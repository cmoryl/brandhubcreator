import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SlideInfo {
  id: string;
  slideNumber: number;
  thumbnailUrl: string;
  title?: string;
  textContent?: string;
}

interface ParseResult {
  slides: SlideInfo[];
  fileUrl: string;
  fileName: string;
  fileSize: string;
  slideCount: number;
}

// Extract text content from slide XML
function extractTextFromSlideXml(xmlContent: string): string {
  const textParts: string[] = [];
  
  // Match all text runs <a:t>...</a:t>
  const textMatches = xmlContent.matchAll(/<a:t>([^<]*)<\/a:t>/g);
  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) {
      textParts.push(text);
    }
  }
  
  return textParts.join(' ').substring(0, 500); // Limit to 500 chars
}

// Extract title from slide XML (usually in the first text placeholder)
function extractTitleFromSlideXml(xmlContent: string): string | undefined {
  // Look for title placeholder type
  const titleMatch = xmlContent.match(/<p:ph[^>]*type="title"[^>]*>[\s\S]*?<a:t>([^<]+)<\/a:t>/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  // Fall back to first large text element
  const firstTextMatch = xmlContent.match(/<a:t>([^<]{3,})<\/a:t>/);
  if (firstTextMatch) {
    return firstTextMatch[1].trim().substring(0, 100);
  }
  
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string || "brand";
    const entityId = formData.get("entityId") as string || "";
    const organizationId = formData.get("organizationId") as string || "";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      return new Response(
        JSON.stringify({ error: "Only .pptx files are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing presentation: ${file.name}, size: ${file.size}`);

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileSize = formatFileSize(file.size);

    // Parse the PPTX (which is a ZIP archive)
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Get slide count by looking at ppt/slides/slide*.xml files
    const slideXmlFiles = Object.keys(zip.files)
      .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });
    
    const slideCount = slideXmlFiles.length;
    console.log(`Found ${slideCount} slides in presentation`);

    // Upload the original PPTX file to storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${organizationId}/${entityType}s/${entityId}/presentations/${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload PPTX:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload presentation file" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL for the PPTX file
    const { data: urlData } = supabase.storage
      .from("organization-assets")
      .getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    const slides: SlideInfo[] = [];

    // Build a map of relationship IDs to media files for each slide
    const slideRelationships: Map<number, Map<string, string>> = new Map();
    
    for (let i = 0; i < slideCount; i++) {
      const slideNum = i + 1;
      const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      
      if (zip.files[relPath]) {
        const relContent = await zip.files[relPath].async("text");
        const relMap = new Map<string, string>();
        
        // Parse relationship entries
        const relMatches = relContent.matchAll(/Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g);
        for (const match of relMatches) {
          const [, relId, target] = match;
          // Normalize target path
          let targetPath = target;
          if (target.startsWith("../")) {
            targetPath = "ppt/" + target.substring(3);
          } else if (!target.startsWith("ppt/")) {
            targetPath = "ppt/slides/" + target;
          }
          relMap.set(relId, targetPath);
        }
        
        slideRelationships.set(slideNum, relMap);
      }
    }

    // Also build slide layout relationships for inherited background images
    // Slide layouts define background images that slides inherit
    const layoutRelationships: Map<string, Map<string, string>> = new Map();
    const layoutFiles = Object.keys(zip.files).filter(name => 
      name.match(/^ppt\/slideLayouts\/_rels\/slideLayout\d+\.xml\.rels$/)
    );
    for (const relPath of layoutFiles) {
      const layoutName = relPath.match(/slideLayout(\d+)/)?.[0] || "";
      const relContent = await zip.files[relPath].async("text");
      const relMap = new Map<string, string>();
      const relMatches = relContent.matchAll(/Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g);
      for (const match of relMatches) {
        const [, relId, target] = match;
        let targetPath = target;
        if (target.startsWith("../")) {
          targetPath = "ppt/" + target.substring(3);
        } else if (!target.startsWith("ppt/")) {
          targetPath = "ppt/slideLayouts/" + target;
        }
        relMap.set(relId, targetPath);
      }
      layoutRelationships.set(layoutName, relMap);
    }

    // Extract text and find the BEST (largest) representative image for each slide
    for (let i = 0; i < slideCount; i++) {
      const slideNum = i + 1;
      const slideXmlPath = `ppt/slides/slide${slideNum}.xml`;
      
      let title: string | undefined;
      let textContent: string | undefined;
      let thumbnailUrl = "";
      
      if (zip.files[slideXmlPath]) {
        const xmlContent = await zip.files[slideXmlPath].async("text");
        title = extractTitleFromSlideXml(xmlContent);
        textContent = extractTextFromSlideXml(xmlContent);
        
        // Collect ALL image candidates from this slide and pick the largest
        const imageCandidates: { path: string; size: number }[] = [];
        
        const relMap = slideRelationships.get(slideNum);
        if (relMap) {
          // Look for ALL image references in the slide XML (r:embed="rId...")
          const imageRefMatches = xmlContent.matchAll(/r:embed="(rId\d+)"/g);
          
          for (const match of imageRefMatches) {
            const relId = match[1];
            const targetPath = relMap.get(relId);
            
            if (targetPath && zip.files[targetPath]) {
              const ext = targetPath.split(".").pop()?.toLowerCase();
              if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
                // Get file size to pick the largest (most detailed) image
                const fileData = zip.files[targetPath];
                const uncompressedSize = fileData._data?.uncompressedSize || 0;
                imageCandidates.push({ path: targetPath, size: uncompressedSize });
              }
            }
          }
          
          // Also check slide background fill images (common in Canva exports)
          const bgBlipMatch = xmlContent.match(/<p:bg>[\s\S]*?<a:blipFill[\s\S]*?r:embed="(rId\d+)"/);
          if (bgBlipMatch) {
            const bgRelId = bgBlipMatch[1];
            const bgTargetPath = relMap.get(bgRelId);
            if (bgTargetPath && zip.files[bgTargetPath]) {
              const ext = bgTargetPath.split(".").pop()?.toLowerCase();
              if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
                const fileData = zip.files[bgTargetPath];
                const uncompressedSize = fileData._data?.uncompressedSize || 0;
                // Boost background images priority by adding size bonus
                imageCandidates.push({ path: bgTargetPath, size: uncompressedSize + 1000000 });
              }
            }
          }
        }
        
        // Also check the slide's layout for inherited background images
        const layoutRelPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        if (zip.files[layoutRelPath] && imageCandidates.length === 0) {
          const relContent = await zip.files[layoutRelPath].async("text");
          const layoutRefMatch = relContent.match(/Target="\.\.\/slideLayouts\/slideLayout(\d+)\.xml"/);
          if (layoutRefMatch) {
            const layoutKey = `slideLayout${layoutRefMatch[1]}`;
            const layoutRels = layoutRelationships.get(layoutKey);
            const layoutXmlPath = `ppt/slideLayouts/slideLayout${layoutRefMatch[1]}.xml`;
            if (layoutRels && zip.files[layoutXmlPath]) {
              const layoutXml = await zip.files[layoutXmlPath].async("text");
              const layoutBlipMatches = layoutXml.matchAll(/r:embed="(rId\d+)"/g);
              for (const lm of layoutBlipMatches) {
                const targetPath = layoutRels.get(lm[1]);
                if (targetPath && zip.files[targetPath]) {
                  const ext = targetPath.split(".").pop()?.toLowerCase();
                  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
                    const fileData = zip.files[targetPath];
                    const uncompressedSize = fileData._data?.uncompressedSize || 0;
                    imageCandidates.push({ path: targetPath, size: uncompressedSize });
                  }
                }
              }
            }
          }
        }
        
        // Sort by size descending and pick the largest image
        if (imageCandidates.length > 0) {
          // Deduplicate by path
          const unique = [...new Map(imageCandidates.map(c => [c.path, c])).values()];
          unique.sort((a, b) => b.size - a.size);
          
          const bestImage = unique[0];
          const ext = bestImage.path.split(".").pop()?.toLowerCase();
          const imageData = await zip.files[bestImage.path].async("uint8array");
          
          // Only use if the image is substantial (> 5KB to skip tiny icons/bullets)
          if (imageData.length > 5000) {
            const slidePath = `${organizationId}/${entityType}s/${entityId}/presentations/slides/${sanitizedFileName}-slide-${slideNum}.${ext}`;
            
            const { error: slideUploadError } = await supabase.storage
              .from("organization-assets")
              .upload(slidePath, imageData, {
                contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
                upsert: true,
              });
            
            if (!slideUploadError) {
              const { data: slideUrlData } = supabase.storage
                .from("organization-assets")
                .getPublicUrl(slidePath);
              thumbnailUrl = `${slideUrlData.publicUrl}?t=${timestamp}`;
            }
          }
        }
      }
      
      // If no embedded image found, try to get docProps thumbnail (usually the first slide rendered)
      if (!thumbnailUrl && slideNum === 1) {
        const thumbnailPath = Object.keys(zip.files).find(
          (name) => name === "docProps/thumbnail.jpeg" || name === "docProps/thumbnail.png"
        );
        
        if (thumbnailPath) {
          const thumbData = await zip.files[thumbnailPath].async("uint8array");
          const ext = thumbnailPath.endsWith(".png") ? "png" : "jpg";
          const thumbStoragePath = `${organizationId}/${entityType}s/${entityId}/presentations/slides/${sanitizedFileName}-slide-1-thumb.${ext}`;
          
          const { error: thumbUploadError } = await supabase.storage
            .from("organization-assets")
            .upload(thumbStoragePath, thumbData, {
              contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
              upsert: true,
            });
          
          if (!thumbUploadError) {
            const { data: thumbUrlData } = supabase.storage
              .from("organization-assets")
              .getPublicUrl(thumbStoragePath);
            thumbnailUrl = `${thumbUrlData.publicUrl}?t=${timestamp}`;
          }
        }
      }
      
      slides.push({
        id: crypto.randomUUID(),
        slideNumber: slideNum,
        thumbnailUrl,
        title: title || `Slide ${slideNum}`,
        textContent,
      });
    }

    const result: ParseResult = {
      slides,
      fileUrl,
      fileName: file.name,
      fileSize,
      slideCount,
    };

    console.log(`Parsed presentation: ${slides.length} slides extracted, ${slides.filter(s => s.thumbnailUrl).length} with images`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing presentation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to parse presentation",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
