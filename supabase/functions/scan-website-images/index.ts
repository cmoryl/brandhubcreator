import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const USER_AGENT = "Mozilla/5.0 (compatible; BrandImageScanner/2.0)";
const MAX_PAGES = 30;
const FETCH_TIMEOUT = 8000;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif|ico)(\?|$)/i;
const SKIP_PATTERNS = /data:image\/(?:gif|svg\+xml);base64,(?:[A-Za-z0-9+/=]{0,100})$|1x1|spacer|pixel|tracking|blank\.|transparent\./i;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractLinks(html: string, baseUrl: string, origin: string): string[] {
  const linkRegex = /<a[^>]*href=["']([^"'#]+)["']/gi;
  const links = new Set<string>();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const resolved = new URL(match[1], baseUrl).href;
      // Only same-origin links, no assets
      if (resolved.startsWith(origin) && !IMAGE_EXTENSIONS.test(resolved) &&
          !resolved.match(/\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx|mp4|mp3|avi|mov)(\?|$)/i)) {
        // Remove fragment
        const clean = resolved.split("#")[0];
        links.add(clean);
      }
    } catch { /* ignore */ }
  }
  return Array.from(links);
}

function extractImages(html: string, baseUrl: string): { url: string; alt: string }[] {
  const imageUrls = new Set<string>();
  const imageAlts = new Map<string, string>();

  // img src + alt
  const imgRegex = /<img[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/src=["']([^"']+)["']/i);
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (srcMatch) {
      imageUrls.add(srcMatch[1]);
      if (altMatch?.[1]) imageAlts.set(srcMatch[1], altMatch[1]);
    }
    // Also get srcset
    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    if (srcsetMatch) {
      srcsetMatch[1].split(",").forEach(s => {
        const src = s.trim().split(/\s+/)[0];
        if (src) imageUrls.add(src);
      });
    }
  }

  // CSS background images
  const bgRegex = /(?:background(?:-image)?)\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    imageUrls.add(match[1]);
  }

  // OG images
  const ogRegex = /<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    imageUrls.add(match[1]);
  }

  // picture source srcset
  const sourceRegex = /<source[^>]*srcset=["']([^"']+)["'][^>]*/gi;
  while ((match = sourceRegex.exec(html)) !== null) {
    match[1].split(",").forEach(s => {
      const src = s.trim().split(/\s+/)[0];
      if (src) imageUrls.add(src);
    });
  }

  // Resolve and filter
  const results: { url: string; alt: string }[] = [];
  for (const imgUrl of imageUrls) {
    try {
      const resolved = new URL(imgUrl, baseUrl).href;
      if (SKIP_PATTERNS.test(resolved)) continue;
      if (IMAGE_EXTENSIONS.test(resolved) || /images\.|img\.|cdn\.|media\.|assets\.|upload/i.test(resolved)) {
        results.push({ url: resolved, alt: imageAlts.get(imgUrl) || "" });
      }
    } catch { /* ignore */ }
  }
  return results;
}

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

    const { url, deepCrawl = false } = await req.json();
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

    const origin = parsedUrl.origin;
    const allImages = new Map<string, { url: string; filename: string; alt: string }>();
    const visited = new Set<string>();
    const queue: string[] = [url];
    let pagesScanned = 0;
    const maxPages = deepCrawl ? MAX_PAGES : 1;

    console.log(`[scan-website-images] Starting ${deepCrawl ? 'deep' : 'single page'} scan: ${url}`);

    while (queue.length > 0 && pagesScanned < maxPages) {
      // Process up to 5 pages in parallel
      const batch = queue.splice(0, 5).filter(u => !visited.has(u));
      if (batch.length === 0) continue;

      batch.forEach(u => visited.add(u));

      const results = await Promise.allSettled(
        batch.map(async (pageUrl) => {
          const html = await fetchPage(pageUrl);
          if (!html) return { links: [], images: [] };
          const images = extractImages(html, pageUrl);
          const links = deepCrawl ? extractLinks(html, pageUrl, origin) : [];
          return { links, images };
        })
      );

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        pagesScanned++;
        
        for (const img of result.value.images) {
          if (!allImages.has(img.url)) {
            const filename = img.url.split("/").pop()?.split("?")[0] || "image";
            allImages.set(img.url, { url: img.url, filename, alt: img.alt });
          }
        }

        for (const link of result.value.links) {
          if (!visited.has(link) && queue.length + visited.size < maxPages * 3) {
            queue.push(link);
          }
        }
      }
    }

    const imageData = Array.from(allImages.values()).slice(0, 500);

    console.log(`[scan-website-images] Found ${imageData.length} unique images across ${pagesScanned} pages from ${url}`);

    return new Response(
      JSON.stringify({ success: true, images: imageData, total: imageData.length, pagesScanned }),
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
