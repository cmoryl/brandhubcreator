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
}

interface ParseResult {
  slides: SlideInfo[];
  fileUrl: string;
  fileName: string;
  fileSize: string;
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
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

    // Extract slide thumbnails from ppt/media/ folder
    // PPTX files store images used in slides here
    const slides: SlideInfo[] = [];
    const mediaFiles: { name: string; data: Uint8Array }[] = [];

    // First, try to get slide thumbnails from docProps/thumbnail.jpeg or ppt/slideLayouts/
    // But more reliably, we'll extract from ppt/media/ which contains all embedded images

    // Check for slide count by looking at ppt/slides/slide*.xml files
    const slideXmlFiles = Object.keys(zip.files).filter(
      (name) => name.match(/^ppt\/slides\/slide\d+\.xml$/)
    );
    const slideCount = slideXmlFiles.length;

    console.log(`Found ${slideCount} slides in presentation`);

    // Extract images from ppt/media/ folder
    for (const [path, zipFile] of Object.entries(zip.files)) {
      if (path.startsWith("ppt/media/") && !zipFile.dir) {
        const ext = path.split(".").pop()?.toLowerCase();
        if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
          const data = await zipFile.async("uint8array");
          mediaFiles.push({ name: path, data });
        }
      }
    }

    // Try to get the thumbnail image first (most PPTX have this)
    let thumbnailData: Uint8Array | null = null;
    const thumbnailPath = Object.keys(zip.files).find(
      (name) => name === "docProps/thumbnail.jpeg" || name === "docProps/thumbnail.png"
    );
    if (thumbnailPath) {
      thumbnailData = await zip.files[thumbnailPath].async("uint8array");
    }

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

    // Upload slide thumbnails (use media images as slide previews)
    // Sort media files to try to match slide order
    mediaFiles.sort((a, b) => a.name.localeCompare(b.name));

    // Take up to slideCount images (or all if we have fewer)
    const slidesToProcess = Math.min(
      mediaFiles.length > 0 ? mediaFiles.length : (thumbnailData ? 1 : 0),
      Math.max(slideCount, 1)
    );

    // If we have a thumbnail but no media files, use it for slide 1
    if (mediaFiles.length === 0 && thumbnailData) {
      const thumbPath = `${organizationId}/${entityType}s/${entityId}/presentations/slides/${sanitizedFileName}-slide-1.jpg`;
      
      const { error: thumbUploadError } = await supabase.storage
        .from("organization-assets")
        .upload(thumbPath, thumbnailData, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!thumbUploadError) {
        const { data: thumbUrlData } = supabase.storage
          .from("organization-assets")
          .getPublicUrl(thumbPath);

        slides.push({
          id: crypto.randomUUID(),
          slideNumber: 1,
          thumbnailUrl: `${thumbUrlData.publicUrl}?t=${timestamp}`,
          title: "Slide 1",
        });
      }
    }

    // Upload media files as slide thumbnails
    for (let i = 0; i < Math.min(mediaFiles.length, 20); i++) {
      const media = mediaFiles[i];
      const ext = media.name.split(".").pop()?.toLowerCase() || "png";
      const slidePath = `${organizationId}/${entityType}s/${entityId}/presentations/slides/${sanitizedFileName}-slide-${i + 1}.${ext}`;

      const { error: slideUploadError } = await supabase.storage
        .from("organization-assets")
        .upload(slidePath, media.data, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        });

      if (!slideUploadError) {
        const { data: slideUrlData } = supabase.storage
          .from("organization-assets")
          .getPublicUrl(slidePath);

        slides.push({
          id: crypto.randomUUID(),
          slideNumber: i + 1,
          thumbnailUrl: `${slideUrlData.publicUrl}?t=${timestamp}`,
          title: `Slide ${i + 1}`,
        });
      }
    }

    // If no slides were extracted, create placeholder entries
    if (slides.length === 0) {
      for (let i = 0; i < slideCount; i++) {
        slides.push({
          id: crypto.randomUUID(),
          slideNumber: i + 1,
          thumbnailUrl: "", // No thumbnail available
          title: `Slide ${i + 1}`,
        });
      }
    }

    const result: ParseResult = {
      slides,
      fileUrl,
      fileName: file.name,
      fileSize,
    };

    console.log(`Parsed presentation: ${slides.length} slides extracted`);

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
