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

// Memory budget thresholds
const MAX_FILE_SIZE_FOR_IMAGES = 30 * 1024 * 1024; // 30MB - skip per-slide images above this
const MAX_SLIDES_FOR_IMAGES = 15; // Only extract images for first N slides
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // Skip individual images larger than 2MB

function extractTextFromSlideXml(xmlContent: string): string {
  const textParts: string[] = [];
  const textMatches = xmlContent.matchAll(/<a:t>([^<]*)<\/a:t>/g);
  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) textParts.push(text);
  }
  return textParts.join(' ').substring(0, 500);
}

function extractTitleFromSlideXml(xmlContent: string): string | undefined {
  const titleMatch = xmlContent.match(/<p:ph[^>]*type="title"[^>]*>[\s\S]*?<a:t>([^<]+)<\/a:t>/);
  if (titleMatch) return titleMatch[1].trim();
  const firstTextMatch = xmlContent.match(/<a:t>([^<]{3,})<\/a:t>/);
  if (firstTextMatch) return firstTextMatch[1].trim().substring(0, 100);
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ error: "Only .pptx files are supported" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileSizeBytes = file.size;
    console.log(`Processing presentation: ${file.name}, size: ${fileSizeBytes}`);

    const isLargeFile = fileSizeBytes > MAX_FILE_SIZE_FOR_IMAGES;
    if (isLargeFile) {
      console.log(`Large file detected (${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB) — skipping per-slide image extraction to stay within memory limits`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileSize = formatFileSize(fileSizeBytes);

    // Upload the original PPTX first (before heavy parsing)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${organizationId}/${entityType}s/${entityId}/presentations/${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload PPTX:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload presentation file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("organization-assets").getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    // Parse the PPTX ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);

    const slideXmlFiles = Object.keys(zip.files)
      .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
        return numA - numB;
      });

    const slideCount = slideXmlFiles.length;
    console.log(`Found ${slideCount} slides in presentation`);

    const slides: SlideInfo[] = [];

    // For large files: only extract text, skip image extraction entirely
    // For normal files: extract images for up to MAX_SLIDES_FOR_IMAGES slides
    const maxSlidesForImages = isLargeFile ? 0 : Math.min(slideCount, MAX_SLIDES_FOR_IMAGES);

    // Build relationship maps only if we need images
    const slideRelationships: Map<number, Map<string, string>> = new Map();

    if (maxSlidesForImages > 0) {
      for (let i = 0; i < maxSlidesForImages; i++) {
        const slideNum = i + 1;
        const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        if (zip.files[relPath]) {
          const relContent = await zip.files[relPath].async("text");
          const relMap = new Map<string, string>();
          const relMatches = relContent.matchAll(/Relationship[^>]*Id="(rId\d+)"[^>]*Target="([^"]+)"/g);
          for (const match of relMatches) {
            const [, relId, target] = match;
            let targetPath = target;
            if (target.startsWith("../")) targetPath = "ppt/" + target.substring(3);
            else if (!target.startsWith("ppt/")) targetPath = "ppt/slides/" + target;
            relMap.set(relId, targetPath);
          }
          slideRelationships.set(slideNum, relMap);
        }
      }
    }

    // Process slides
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

        // Only extract images for slides within the limit
        if (slideNum <= maxSlidesForImages) {
          const relMap = slideRelationships.get(slideNum);
          if (relMap) {
            // Find the best (largest) image for this slide
            let bestImageData: Uint8Array | null = null;
            let bestImageExt = "png";
            let bestImageSize = 0;
            let bestIsBackground = true;

            const bgRelIds = new Set<string>();
            const bgBlipMatches = xmlContent.matchAll(/<p:bg>[\s\S]*?<a:blipFill[\s\S]*?r:embed="(rId\d+)"/g);
            for (const m of bgBlipMatches) bgRelIds.add(m[1]);

            const imageRefMatches = xmlContent.matchAll(/r:embed="(rId\d+)"/g);
            const seenPaths = new Set<string>();

            for (const match of imageRefMatches) {
              const relId = match[1];
              const targetPath = relMap.get(relId);
              if (!targetPath || !zip.files[targetPath] || seenPaths.has(targetPath)) continue;
              seenPaths.add(targetPath);

              const ext = targetPath.split(".").pop()?.toLowerCase();
              if (!["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) continue;

              // Check compressed size first to avoid decompressing huge images
              const compressedInfo = zip.files[targetPath];
              // Skip images that are likely too large (compressed > 2MB suggests very large uncompressed)
              if (compressedInfo._data && compressedInfo._data.compressedSize > MAX_IMAGE_SIZE) continue;

              const data = await zip.files[targetPath].async("uint8array");
              if (data.length < 5000 || data.length > MAX_IMAGE_SIZE) continue;

              const isBg = bgRelIds.has(relId);
              // Prefer content images over background; within same type pick largest
              if (
                bestImageData === null ||
                (!isBg && bestIsBackground) ||
                (isBg === bestIsBackground && data.length > bestImageSize)
              ) {
                bestImageData = data;
                bestImageExt = ext === "jpg" ? "jpeg" : (ext || "png");
                bestImageSize = data.length;
                bestIsBackground = isBg;
              }
            }

            if (bestImageData) {
              const slidePath = `${organizationId}/${entityType}s/${entityId}/presentations/slides/${sanitizedFileName}-slide-${slideNum}.${bestImageExt === "jpeg" ? "jpg" : bestImageExt}`;
              const { error: slideUploadError } = await supabase.storage
                .from("organization-assets")
                .upload(slidePath, bestImageData, {
                  contentType: `image/${bestImageExt}`,
                  upsert: true,
                });
              if (!slideUploadError) {
                const { data: slideUrlData } = supabase.storage.from("organization-assets").getPublicUrl(slidePath);
                thumbnailUrl = `${slideUrlData.publicUrl}?t=${timestamp}`;
              }
              // Release memory immediately
              bestImageData = null;
            }
          }
        }
      }

      // For slide 1 with no image, try docProps thumbnail
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
            const { data: thumbUrlData } = supabase.storage.from("organization-assets").getPublicUrl(thumbStoragePath);
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse presentation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
