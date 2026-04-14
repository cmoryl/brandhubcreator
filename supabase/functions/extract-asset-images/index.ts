/**
 * Extract Asset Images
 * Extracts embedded images from PDFs and PPTX files stored in brand guide_data
 * (brochures, presentations, templates, case studies).
 * Uploads extracted images to organization-assets bucket and returns URLs.
 * Uses lightweight binary parsing to stay under 150MB memory.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET_NAME = "organization-assets";
const MAX_ASSETS = 10; // Max documents to process
const MAX_IMAGES_PER_DOC = 8; // Max images per document
const MIN_IMAGE_BYTES = 5000; // Ignore tiny images (<5KB, likely icons/bullets)
const MAX_IMAGE_BYTES = 10_000_000; // Skip images over 10MB

interface ExtractedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  sourceDocument: string;
  width?: number;
  height?: number;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Extract JPEG images from PDF binary data.
 * Looks for JPEG markers (FFD8...FFD9) within PDF streams.
 */
function extractJpegFromPdf(bytes: Uint8Array): Uint8Array[] {
  const images: Uint8Array[] = [];
  let i = 0;

  while (i < bytes.length - 2 && images.length < MAX_IMAGES_PER_DOC) {
    // Look for JPEG SOI marker (FF D8)
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8) {
      const start = i;
      // Find JPEG EOI marker (FF D9)
      let j = i + 2;
      while (j < bytes.length - 1) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          const end = j + 2;
          const imgData = bytes.slice(start, end);
          if (imgData.length >= MIN_IMAGE_BYTES && imgData.length <= MAX_IMAGE_BYTES) {
            images.push(imgData);
          }
          i = end;
          break;
        }
        j++;
      }
      if (j >= bytes.length - 1) break;
    } else {
      i++;
    }
  }

  return images;
}

/**
 * Extract images from PPTX (ZIP) binary data.
 * PPTX files are ZIP archives with images in ppt/media/ directory.
 */
async function extractImagesFromPptx(bytes: Uint8Array): Promise<Array<{ data: Uint8Array; ext: string; mime: string }>> {
  const images: Array<{ data: Uint8Array; ext: string; mime: string }> = [];
  
  try {
    // Parse ZIP structure manually to find image entries
    // ZIP local file headers start with PK\x03\x04
    let offset = 0;
    
    while (offset < bytes.length - 30 && images.length < MAX_IMAGES_PER_DOC) {
      // Check for local file header signature
      if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4B || 
          bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
        offset++;
        continue;
      }

      // Parse local file header
      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
      const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) | (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
      const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

      const fileNameBytes = bytes.slice(offset + 30, offset + 30 + fileNameLength);
      const fileName = new TextDecoder().decode(fileNameBytes);
      
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;
      const dataSize = compressedSize > 0 ? compressedSize : uncompressedSize;
      
      // Check if it's an image in ppt/media/
      const isImage = fileName.startsWith("ppt/media/") && 
        /\.(png|jpg|jpeg|gif|bmp|tiff|webp)$/i.test(fileName);
      
      if (isImage && compressionMethod === 0 && dataSize >= MIN_IMAGE_BYTES && dataSize <= MAX_IMAGE_BYTES) {
        // Stored (no compression) - extract directly
        const imageData = bytes.slice(dataStart, dataStart + dataSize);
        const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
          gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', tiff: 'image/tiff',
        };
        images.push({ data: imageData, ext, mime: mimeMap[ext] || 'image/jpeg' });
      } else if (isImage && compressionMethod === 8 && dataSize >= MIN_IMAGE_BYTES && dataSize <= MAX_IMAGE_BYTES) {
        // Deflate compressed - use DecompressionStream
        try {
          const compressedData = bytes.slice(dataStart, dataStart + dataSize);
          const ds = new DecompressionStream("raw");
          const writer = ds.writable.getWriter();
          const reader = ds.readable.getReader();
          
          writer.write(compressedData);
          writer.close();
          
          const chunks: Uint8Array[] = [];
          let totalLen = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLen += value.length;
            if (totalLen > MAX_IMAGE_BYTES) break;
          }
          
          if (totalLen >= MIN_IMAGE_BYTES && totalLen <= MAX_IMAGE_BYTES) {
            const decompressed = new Uint8Array(totalLen);
            let pos = 0;
            for (const chunk of chunks) {
              decompressed.set(chunk, pos);
              pos += chunk.length;
            }
            const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeMap: Record<string, string> = {
              jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
              gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', tiff: 'image/tiff',
            };
            images.push({ data: decompressed, ext, mime: mimeMap[ext] || 'image/jpeg' });
          }
        } catch (e) {
          console.warn(`Failed to decompress ${fileName}:`, e);
        }
      }

      // Move to next entry
      offset = dataStart + dataSize;
    }
  } catch (err) {
    console.error("PPTX parsing error:", err);
  }

  return images;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
      if (!canUse) {
        return new Response(JSON.stringify({ error: "AI features not available" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { entityId, entityType } = await req.json();
    if (!entityId) {
      return new Response(JSON.stringify({ error: "entityId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch entity guide_data
    const tableMap: Record<string, string> = { brand: "brands", product: "products", event: "events" };
    const table = tableMap[entityType] || "brands";
    const { data: entityData } = await supabase
      .from(table)
      .select("name, guide_data, organization_id")
      .eq("id", entityId)
      .maybeSingle();

    if (!entityData) {
      return new Response(JSON.stringify({ error: "Entity not found", images: [] }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gd = (entityData as any).guide_data || {};
    const orgId = (entityData as any).organization_id;
    const entityName = (entityData as any).name;

    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization", images: [] }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all document URLs from guide_data
    const docSources: Array<{ url: string; title: string; source: string }> = [];

    // Brochures
    (Array.isArray(gd.brochures) ? gd.brochures : []).forEach((b: any) => {
      if (b?.fileUrl) docSources.push({ url: b.fileUrl, title: b.title || b.name || 'Brochure', source: 'brochures' });
    });

    // Presentations
    (Array.isArray(gd.presentationTemplates) ? gd.presentationTemplates : []).forEach((p: any) => {
      if (p?.fileUrl) docSources.push({ url: p.fileUrl, title: p.title || p.name || 'Presentation', source: 'presentations' });
    });

    // Templates
    (Array.isArray(gd.templates) ? gd.templates : []).forEach((t: any) => {
      if (t?.fileUrl) docSources.push({ url: t.fileUrl, title: t.title || t.name || 'Template', source: 'templates' });
    });

    // Case Studies
    (Array.isArray(gd.caseStudies) ? gd.caseStudies : []).forEach((cs: any) => {
      if (cs?.fileUrl) docSources.push({ url: cs.fileUrl, title: cs.title || cs.name || 'Case Study', source: 'caseStudies' });
    });

    if (docSources.length === 0) {
      return new Response(JSON.stringify({ 
        images: [], 
        message: "No digital assets found with uploaded files. Upload PDFs or presentations to extract imagery." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedImages: ExtractedImage[] = [];
    const processedDocs = docSources.slice(0, MAX_ASSETS);

    for (const doc of processedDocs) {
      try {
        // Determine if internal (Supabase storage) or external URL
        const isInternal = doc.url.includes(supabaseUrl) || doc.url.includes('supabase');
        
        let fileBytes: Uint8Array | null = null;

        if (isInternal) {
          // Extract storage path from URL
          const pathMatch = doc.url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
          if (pathMatch) {
            const storagePath = pathMatch[1].split('?')[0];
            const bucketMatch = doc.url.match(/\/storage\/v1\/object\/public\/([^/]+)\//);
            const bucket = bucketMatch ? bucketMatch[1] : BUCKET_NAME;
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .download(storagePath);
            
            if (error || !data) {
              console.warn(`Failed to download ${doc.title}:`, error);
              continue;
            }
            fileBytes = new Uint8Array(await data.arrayBuffer());
          }
        } else {
          // External URL - try to fetch via proxy
          try {
            const resp = await fetch(doc.url, { 
              headers: { 'User-Agent': 'BrandHub-ImageExtractor/1.0' },
              signal: AbortSignal.timeout(15000),
            });
            if (resp.ok) {
              fileBytes = new Uint8Array(await resp.arrayBuffer());
            }
          } catch (fetchErr) {
            console.warn(`Failed to fetch external ${doc.title}:`, fetchErr);
            continue;
          }
        }

        if (!fileBytes || fileBytes.length < 1000) continue;

        // Determine file type
        const isPdf = fileBytes[0] === 0x25 && fileBytes[1] === 0x50; // %P (PDF)
        const isZip = fileBytes[0] === 0x50 && fileBytes[1] === 0x4B; // PK (ZIP/PPTX/DOCX)
        const isPptx = isZip && doc.url.toLowerCase().includes('.pptx');

        let docImages: Array<{ data: Uint8Array; ext: string; mime: string }> = [];

        if (isPdf) {
          const jpegImages = extractJpegFromPdf(fileBytes);
          docImages = jpegImages.map(data => ({ data, ext: 'jpg', mime: 'image/jpeg' }));
        } else if (isPptx || isZip) {
          docImages = await extractImagesFromPptx(fileBytes);
        }

        // Upload extracted images to storage
        for (let idx = 0; idx < docImages.length; idx++) {
          const img = docImages[idx];
          const timestamp = Date.now();
          const fileName = `extracted-${doc.source}-${timestamp}-${idx}.${img.ext}`;
          const storagePath = `${orgId}/extracted-imagery/${entityId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, img.data, {
              cacheControl: '3600',
              upsert: true,
              contentType: img.mime,
            });

          if (uploadError) {
            console.warn(`Upload error for ${fileName}:`, uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

          const publicUrl = `${urlData.publicUrl}?t=${timestamp}`;

          extractedImages.push({
            id: crypto.randomUUID(),
            url: publicUrl,
            thumbnailUrl: publicUrl,
            title: `${doc.title} — Image ${idx + 1}`,
            source: 'extracted',
            sourceDocument: doc.title,
            mimeType: img.mime,
            sizeBytes: img.data.length,
          });
        }
      } catch (docErr) {
        console.error(`Error processing ${doc.title}:`, docErr);
      }
    }

    return new Response(JSON.stringify({
      images: extractedImages,
      documentsProcessed: processedDocs.length,
      documentsTotal: docSources.length,
      message: extractedImages.length > 0
        ? `Extracted ${extractedImages.length} images from ${processedDocs.length} documents`
        : `Processed ${processedDocs.length} documents but no extractable images found`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[extract-asset-images] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", images: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
