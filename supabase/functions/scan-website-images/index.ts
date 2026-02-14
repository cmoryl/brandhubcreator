import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scan-website-images] Fetching: ${url}`);

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BrandImageScanner/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = await response.text();
    } catch (fetchError) {
      console.error("[scan-website-images] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch website. Please check the URL is accessible." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract all image sources
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*/gi;
    const bgRegex = /(?:background(?:-image)?)\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
    const ogRegex = /<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/gi;
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    const pictureSourceRegex = /<source[^>]*srcset=["']([^"']+)["'][^>]*/gi;

    const imageUrls = new Set<string>();

    // img src
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      imageUrls.add(match[1]);
    }

    // CSS background images
    while ((match = bgRegex.exec(html)) !== null) {
      imageUrls.add(match[1]);
    }

    // OG images
    while ((match = ogRegex.exec(html)) !== null) {
      imageUrls.add(match[1]);
    }

    // srcset (take largest)
    while ((match = srcsetRegex.exec(html)) !== null) {
      const sources = match[1].split(",").map((s) => s.trim().split(/\s+/)[0]);
      sources.forEach((s) => imageUrls.add(s));
    }

    // picture source srcset
    while ((match = pictureSourceRegex.exec(html)) !== null) {
      const srcsetValue = match[0].match(/srcset=["']([^"']+)["']/)?.[1];
      if (srcsetValue) {
        const sources = srcsetValue.split(",").map((s) => s.trim().split(/\s+/)[0]);
        sources.forEach((s) => imageUrls.add(s));
      }
    }

    // Resolve to absolute URLs and filter
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif|ico)(\?|$)/i;
    const skipPatterns = /data:image\/(?:gif|svg\+xml);base64,(?:[A-Za-z0-9+/=]{0,100})$|1x1|spacer|pixel|tracking|blank\.|transparent\./i;

    const resolvedImages = Array.from(imageUrls)
      .map((imgUrl) => {
        try {
          return new URL(imgUrl, url).href;
        } catch {
          return null;
        }
      })
      .filter((imgUrl): imgUrl is string => {
        if (!imgUrl) return false;
        if (skipPatterns.test(imgUrl)) return false;
        // Allow if has image extension or is from common CDN patterns
        if (imageExtensions.test(imgUrl)) return true;
        // Also allow URLs from known image CDNs even without extension
        if (/images\.|img\.|cdn\.|media\.|assets\.|upload/i.test(imgUrl)) return true;
        return false;
      });

    // Deduplicate and extract metadata
    const uniqueImages = [...new Set(resolvedImages)].slice(0, 200);

    // Try to extract alt text for each image
    const imageData = uniqueImages.map((imgUrl) => {
      const filename = imgUrl.split("/").pop()?.split("?")[0] || "image";
      
      // Try to find alt text from the HTML
      const altMatch = html.match(
        new RegExp(`<img[^>]*src=["']${imgUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*alt=["']([^"']*)["']`, "i")
      ) || html.match(
        new RegExp(`alt=["']([^"']*)["'][^>]*src=["']${imgUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i")
      );

      return {
        url: imgUrl,
        filename,
        alt: altMatch?.[1] || "",
      };
    });

    console.log(`[scan-website-images] Found ${imageData.length} images from ${url}`);

    return new Response(
      JSON.stringify({ success: true, images: imageData, total: imageData.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[scan-website-images] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
