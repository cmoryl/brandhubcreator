import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParseResult {
  fileUrl: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  thumbnailUrl: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
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

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return new Response(
        JSON.stringify({ error: "Only .pdf files are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing PDF: ${file.name}, size: ${file.size}`);

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileSize = formatFileSize(file.size);
    const timestamp = Date.now();

    // Parse the PDF to get metadata and page count
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`PDF has ${pageCount} pages`);

    // Extract metadata
    const metadata = {
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      creator: pdfDoc.getCreator() || undefined,
    };

    // Upload the original PDF file to storage
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${organizationId}/${entityType}s/${entityId}/documents/${sanitizedFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload PDF:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload PDF file" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL for the PDF file
    const { data: urlData } = supabase.storage
      .from("organization-assets")
      .getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    // Generate first page thumbnail
    // We'll extract just the first page as a separate PDF for the thumbnail preview
    // Since we can't render to image in edge function, we'll create a single-page PDF
    // and use Google Docs Viewer to generate a preview, or store the URL for client-side rendering
    let thumbnailUrl = "";

    try {
      // Create a new PDF with just the first page
      const firstPagePdf = await PDFDocument.create();
      const [copiedPage] = await firstPagePdf.copyPages(pdfDoc, [0]);
      firstPagePdf.addPage(copiedPage);
      
      const firstPageBytes = await firstPagePdf.save();
      const thumbnailPath = `${organizationId}/${entityType}s/${entityId}/documents/thumbnails/${sanitizedFileName.replace('.pdf', '')}-thumb.pdf`;
      
      const { error: thumbUploadError } = await supabase.storage
        .from("organization-assets")
        .upload(thumbnailPath, firstPageBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!thumbUploadError) {
        const { data: thumbUrlData } = supabase.storage
          .from("organization-assets")
          .getPublicUrl(thumbnailPath);
        thumbnailUrl = `${thumbUrlData.publicUrl}?t=${timestamp}`;
      }
    } catch (thumbError) {
      console.error("Failed to create thumbnail:", thumbError);
      // Continue without thumbnail - the full PDF URL can be used instead
    }

    const result: ParseResult = {
      fileUrl,
      fileName: file.name,
      fileSize,
      pageCount,
      thumbnailUrl: thumbnailUrl || fileUrl, // Fallback to full PDF if thumbnail fails
      metadata,
    };

    console.log(`Parsed PDF: ${pageCount} pages, thumbnail: ${thumbnailUrl ? 'yes' : 'no'}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to parse PDF",
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
