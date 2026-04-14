/**
 * Extract Asset Images
 * Extracts images from all guide_data asset sections:
 * - Brochures/Digital Collateral (previewUrl, thumbnailUrl, externalUrl)
 * - Presentation Templates (fileUrl - extract from PPTX/PDF)
 * - Approved Imagery sections
 * - Image Assets
 * - Social Assets
 * - Patterns
 * - Case Studies
 * - Imagery (visual direction)
 * Also scans uploaded files (PDFs, PPTX) for embedded images.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET_NAME = "organization-assets";
const MAX_DOC_EXTRACTIONS = 6;
const MAX_IMAGES_PER_DOC = 6;
const MIN_IMAGE_BYTES = 2000;
const MAX_IMAGE_BYTES = 10_000_000;
const MAX_DOC_DOWNLOAD_BYTES = 5_000_000; // Skip docs larger than 5MB
const GLOBAL_TIMEOUT_MS = 45_000; // 45s (edge fn limit is 60s)

interface ExtractedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  sourceDocument: string;
  mimeType: string;
  sizeBytes: number;
}

/** Extract JPEG images from PDF binary data via SOI/EOI markers */
function extractJpegFromPdf(bytes: Uint8Array): Uint8Array[] {
  const images: Uint8Array[] = [];
  let i = 0;
  while (i < bytes.length - 2 && images.length < MAX_IMAGES_PER_DOC) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8) {
      const start = i;
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

/** Extract images from PPTX (ZIP) via ppt/media/ entries */
async function extractImagesFromPptx(bytes: Uint8Array): Promise<Array<{ data: Uint8Array; ext: string; mime: string }>> {
  const images: Array<{ data: Uint8Array; ext: string; mime: string }> = [];
  try {
    let offset = 0;
    while (offset < bytes.length - 30 && images.length < MAX_IMAGES_PER_DOC) {
      if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4B ||
          bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
        offset++;
        continue;
      }
      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
      const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) | (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
      const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraFieldLength = bytes[offset + 28] | (bytes[offset + 29] << 8);
      const fileName = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + fileNameLength));
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;
      const dataSize = compressedSize > 0 ? compressedSize : uncompressedSize;
      const isImage = fileName.startsWith("ppt/media/") && /\.(png|jpg|jpeg|gif|bmp|tiff|webp)$/i.test(fileName);

      if (isImage && dataSize >= MIN_IMAGE_BYTES && dataSize <= MAX_IMAGE_BYTES) {
        if (compressionMethod === 0) {
          const imageData = bytes.slice(dataStart, dataStart + dataSize);
          const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', tiff: 'image/tiff' };
          images.push({ data: imageData, ext, mime: mimeMap[ext] || 'image/jpeg' });
        } else if (compressionMethod === 8) {
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
              for (const chunk of chunks) { decompressed.set(chunk, pos); pos += chunk.length; }
              const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
              const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', tiff: 'image/tiff' };
              images.push({ data: decompressed, ext, mime: mimeMap[ext] || 'image/jpeg' });
            }
          } catch (e) {
            console.warn(`Failed to decompress ${fileName}:`, e);
          }
        }
      }
      offset = dataStart + dataSize;
    }
  } catch (err) {
    console.error("PPTX parsing error:", err);
  }
  return images;
}

/** Check if a URL looks like an image */
function isImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|avif)(\?|$)/i.test(lower) ||
    lower.includes('/render/image') || lower.includes('image.shutterstock') ||
    lower.includes('unsplash.com') || lower.includes('pexels.com');
}

/** Check if URL is a document we can extract embedded images from */
function isDocumentUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return /\.(pdf|pptx|ppt|docx)(\?|$)/i.test(lower);
}

/** Collect all image URLs and document URLs from guide_data */
function collectAssetUrls(gd: any): { 
  directImages: Array<{ url: string; title: string; source: string }>;
  documents: Array<{ url: string; title: string; source: string }>;
} {
  const directImages: Array<{ url: string; title: string; source: string }> = [];
  const documents: Array<{ url: string; title: string; source: string }> = [];

  const addUrl = (url: string, title: string, source: string) => {
    if (!url || url.length < 10) return;
    // Skip base64 data URIs
    if (url.startsWith('data:')) return;
    
    if (isDocumentUrl(url)) {
      documents.push({ url, title, source });
    } else if (isImageUrl(url)) {
      directImages.push({ url, title, source });
    } else if (url.includes('supabase') || url.includes('storage')) {
      // Storage URLs without clear extension - treat as potential images
      directImages.push({ url, title, source });
    }
  };

  // 1. Brochures / Digital Collateral
  const brochures = Array.isArray(gd.brochures) ? gd.brochures : [];
  for (const b of brochures) {
    if (b?.previewUrl) addUrl(b.previewUrl, b.title || 'Brochure', 'brochures');
    if (b?.thumbnailUrl) addUrl(b.thumbnailUrl, b.title || 'Brochure', 'brochures');
    if (b?.externalUrl) addUrl(b.externalUrl, b.title || 'Brochure', 'brochures');
  }

  // 2. Presentation Templates (have fileUrl)
  const presentations = Array.isArray(gd.presentationTemplates) ? gd.presentationTemplates : [];
  for (const p of presentations) {
    if (p?.fileUrl) addUrl(p.fileUrl, p.name || p.title || 'Presentation', 'presentations');
    if (p?.thumbnailUrl) addUrl(p.thumbnailUrl, p.name || 'Presentation Thumb', 'presentations');
    if (p?.cardImageUrl) addUrl(p.cardImageUrl, p.name || 'Presentation Card', 'presentations');
    // Also check slide thumbnails
    if (Array.isArray(p?.slides)) {
      for (const s of p.slides) {
        if (s?.thumbnailUrl) addUrl(s.thumbnailUrl, `${p.name || 'Slide'} #${s.slideNumber || ''}`, 'presentation-slides');
      }
    }
  }

  // 3. Templates (legacy)
  const templates = Array.isArray(gd.templates) ? gd.templates : [];
  for (const t of templates) {
    if (t?.fileUrl) addUrl(t.fileUrl, t.name || t.title || 'Template', 'templates');
    if (t?.thumbnailUrl) addUrl(t.thumbnailUrl, t.name || 'Template', 'templates');
    if (t?.externalUrl) addUrl(t.externalUrl, t.name || 'Template', 'templates');
  }

  // 4. Case Studies
  const caseStudies = Array.isArray(gd.caseStudies) ? gd.caseStudies : [];
  for (const cs of caseStudies) {
    if (cs?.fileUrl) addUrl(cs.fileUrl, cs.title || cs.name || 'Case Study', 'caseStudies');
    if (cs?.thumbnailUrl) addUrl(cs.thumbnailUrl, cs.title || 'Case Study', 'caseStudies');
    if (cs?.imageUrl) addUrl(cs.imageUrl, cs.title || 'Case Study', 'caseStudies');
    if (cs?.coverImage) addUrl(cs.coverImage, cs.title || 'Case Study', 'caseStudies');
  }

  // 5. Approved Imagery sections
  const approvedImagery = gd.approvedImagery;
  if (approvedImagery && Array.isArray(approvedImagery.sections)) {
    for (const section of approvedImagery.sections) {
      if (Array.isArray(section?.images)) {
        for (const img of section.images) {
          if (img?.url) addUrl(img.url, img.title || `${section.name || 'Approved'} Image`, 'approvedImagery');
          if (img?.thumbnailUrl) addUrl(img.thumbnailUrl, img.title || 'Approved Thumb', 'approvedImagery');
        }
      }
    }
  }

  // 6. Imagery (visual direction photos)
  const imagery = Array.isArray(gd.imagery) ? gd.imagery : [];
  for (const img of imagery) {
    if (img?.url) addUrl(img.url, img.caption || img.title || 'Imagery', 'imagery');
  }

  // 7. Image Assets
  const imageAssets = Array.isArray(gd.imageAssets) ? gd.imageAssets : [];
  for (const asset of imageAssets) {
    if (asset?.url) addUrl(asset.url, asset.name || 'Image Asset', 'imageAssets');
    if (asset?.thumbnailUrl) addUrl(asset.thumbnailUrl, asset.name || 'Image Asset', 'imageAssets');
  }

  // 8. Patterns
  const patterns = Array.isArray(gd.patterns) ? gd.patterns : [];
  for (const p of patterns) {
    if (p?.url) addUrl(p.url, p.name || 'Pattern', 'patterns');
  }

  // 9. Social Assets
  const socialAssets = Array.isArray(gd.socialAssets) ? gd.socialAssets : [];
  for (const sa of socialAssets) {
    if (sa?.url) addUrl(sa.url, sa.title || sa.name || 'Social Asset', 'socialAssets');
    if (sa?.imageUrl) addUrl(sa.imageUrl, sa.title || 'Social Asset', 'socialAssets');
    if (sa?.thumbnailUrl) addUrl(sa.thumbnailUrl, sa.title || 'Social Asset', 'socialAssets');
  }

  // 10. Hero images
  if (gd.hero) {
    if (gd.hero.imageUrl) addUrl(gd.hero.imageUrl, 'Hero Image', 'hero');
    if (gd.hero.coverImage) addUrl(gd.hero.coverImage, 'Hero Cover', 'hero');
    if (gd.hero.cardImage) addUrl(gd.hero.cardImage, 'Hero Card', 'hero');
  }

  // 11. PDF Documents
  const pdfDocuments = Array.isArray(gd.pdfDocuments) ? gd.pdfDocuments : [];
  for (const pdf of pdfDocuments) {
    if (pdf?.fileUrl) addUrl(pdf.fileUrl, pdf.name || 'PDF Document', 'pdfDocuments');
    if (pdf?.thumbnailUrl) addUrl(pdf.thumbnailUrl, pdf.name || 'PDF Thumb', 'pdfDocuments');
  }

  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const dedup = <T extends { url: string }>(arr: T[]): T[] => {
    return arr.filter(item => {
      const key = item.url.split('?')[0]; // ignore cache-busting params
      if (seenUrls.has(key)) return false;
      seenUrls.add(key);
      return true;
    });
  };

  return {
    directImages: dedup(directImages),
    documents: dedup(documents),
  };
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

    if (!orgId) {
      return new Response(JSON.stringify({ error: "No organization", images: [] }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all URLs from guide_data
    const { directImages, documents } = collectAssetUrls(gd);

    console.log(`[extract-asset-images] Found ${directImages.length} direct images, ${documents.length} documents`);

    if (directImages.length === 0 && documents.length === 0) {
      return new Response(JSON.stringify({
        images: [],
        documentsProcessed: 0,
        documentsTotal: 0,
        message: "No assets found in this guide. Upload images, PDFs, or presentations first.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedImages: ExtractedImage[] = [];

    // Phase 1: Collect direct image URLs (already accessible, no extraction needed)
    for (const img of directImages) {
      extractedImages.push({
        id: crypto.randomUUID(),
        url: img.url,
        thumbnailUrl: img.url,
        title: img.title,
        source: img.source,
        sourceDocument: img.source,
        mimeType: 'image/jpeg',
        sizeBytes: 0, // Unknown for direct URLs
      });
    }

    // Phase 2: Extract embedded images from documents (PDFs, PPTX)
    const processedDocs = documents.slice(0, MAX_DOC_EXTRACTIONS);
    let docsProcessed = 0;
    const phaseStartTime = Date.now();

    for (const doc of processedDocs) {
      // Global timeout: return what we have so far
      if (Date.now() - phaseStartTime > GLOBAL_TIMEOUT_MS) {
        console.log(`[extract-asset-images] Global timeout reached after ${docsProcessed} docs`);
        break;
      }
      try {
        const isInternal = doc.url.includes(supabaseUrl) || doc.url.includes('supabase');
        let fileBytes: Uint8Array | null = null;

        if (isInternal) {
          const pathMatch = doc.url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
          if (pathMatch) {
            const bucket = pathMatch[1];
            const storagePath = pathMatch[2].split('?')[0];
            const { data, error } = await supabase.storage.from(bucket).download(storagePath);
            if (error || !data) {
              console.warn(`Failed to download ${doc.title}:`, error);
              continue;
            }
            fileBytes = new Uint8Array(await data.arrayBuffer());
          }
        } else {
          try {
            const resp = await fetch(doc.url, {
              headers: { 'User-Agent': 'BrandHub-ImageExtractor/1.0' },
              signal: AbortSignal.timeout(8000),
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
        docsProcessed++;

        const isPdf = fileBytes[0] === 0x25 && fileBytes[1] === 0x50;
        const isZip = fileBytes[0] === 0x50 && fileBytes[1] === 0x4B;

        let docImages: Array<{ data: Uint8Array; ext: string; mime: string }> = [];

        if (isPdf) {
          docImages = extractJpegFromPdf(fileBytes).map(data => ({ data, ext: 'jpg', mime: 'image/jpeg' }));
        } else if (isZip) {
          docImages = await extractImagesFromPptx(fileBytes);
        }

        for (let idx = 0; idx < docImages.length; idx++) {
          const img = docImages[idx];
          const timestamp = Date.now();
          const fileName = `extracted-${doc.source}-${timestamp}-${idx}.${img.ext}`;
          const storagePath = `${orgId}/extracted-imagery/${entityId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, img.data, {
              cacheControl: '3600', upsert: true, contentType: img.mime,
            });

          if (uploadError) {
            console.warn(`Upload error for ${fileName}:`, uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

          extractedImages.push({
            id: crypto.randomUUID(),
            url: `${urlData.publicUrl}?t=${timestamp}`,
            thumbnailUrl: `${urlData.publicUrl}?t=${timestamp}`,
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

    const totalSources = directImages.length + documents.length;
    return new Response(JSON.stringify({
      images: extractedImages,
      documentsProcessed: docsProcessed,
      documentsTotal: documents.length,
      directImagesFound: directImages.length,
      totalSources,
      message: extractedImages.length > 0
        ? `Found ${extractedImages.length} images (${directImages.length} direct, ${extractedImages.length - directImages.length} extracted from ${docsProcessed} documents)`
        : `Scanned ${totalSources} asset references but no usable images found`,
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
