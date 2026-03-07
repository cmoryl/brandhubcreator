import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Attempts to fetch the actual company logo from the web using multiple strategies:
 * 1. Clearbit Logo API (free, high-quality)
 * 2. Google Favicon service (fallback)
 * 3. Direct website favicon scraping
 * 
 * Then uses AI to create white/black monochrome variants from the real color logo.
 */

/** Try to resolve a company domain from the name or provided URL */
function extractDomain(companyName: string, websiteUrl?: string): string[] {
  const domains: string[] = [];

  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
      domains.push(url.hostname.replace(/^www\./, ""));
    } catch { /* ignore */ }
  }

  // Common domain patterns from company name
  const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  domains.push(`${sanitized}.com`);
  domains.push(`${sanitized}.io`);
  domains.push(`${sanitized}.co`);

  // Handle multi-word names
  const dashed = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
  if (dashed !== sanitized) {
    domains.push(`${dashed}.com`);
  }

  return [...new Set(domains)];
}

/** Fetch logo from Clearbit */
async function fetchClearbitLogo(domain: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://logo.clearbit.com/${domain}?size=512`;
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("image")) {
        console.log(`[fetch-logo] ✅ Clearbit hit for ${domain}`);
        return await res.arrayBuffer();
      }
    }
  } catch (e) {
    console.log(`[fetch-logo] Clearbit miss for ${domain}:`, e);
  }
  return null;
}

/** Fetch high-res favicon from Google */
async function fetchGoogleFavicon(domain: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      // Google returns a default globe icon (~700 bytes) if not found — filter it out
      if (buf.byteLength > 1000) {
        console.log(`[fetch-logo] ✅ Google favicon hit for ${domain} (${buf.byteLength} bytes)`);
        return buf;
      }
    }
  } catch (e) {
    console.log(`[fetch-logo] Google favicon miss for ${domain}:`, e);
  }
  return null;
}

/** Try scraping og:image or apple-touch-icon from the website directly */
async function scrapeWebsiteLogo(domain: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://${domain}`, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandHubBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // Try og:image first
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    if (ogMatch?.[1]) {
      const imgUrl = ogMatch[1].startsWith("http") ? ogMatch[1] : `https://${domain}${ogMatch[1]}`;
      console.log(`[fetch-logo] ✅ og:image found: ${imgUrl}`);
      return imgUrl;
    }

    // Try apple-touch-icon
    const appleMatch = html.match(/<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/i);
    if (appleMatch?.[1]) {
      const imgUrl = appleMatch[1].startsWith("http") ? appleMatch[1] : `https://${domain}${appleMatch[1]}`;
      console.log(`[fetch-logo] ✅ apple-touch-icon found: ${imgUrl}`);
      return imgUrl;
    }

    // Try high-res favicon link
    const faviconMatch = html.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]+)"/i);
    if (faviconMatch?.[1]) {
      const imgUrl = faviconMatch[1].startsWith("http") ? faviconMatch[1] : `https://${domain}${faviconMatch[1]}`;
      return imgUrl;
    }
  } catch (e) {
    console.log(`[fetch-logo] Scrape miss for ${domain}:`, e);
  }
  return null;
}

/** Convert a URL to ArrayBuffer */
async function urlToBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) return await res.arrayBuffer();
  } catch { /* ignore */ }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "AI features not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { companyName, variant, organizationId, websiteUrl } = await req.json();
    if (!companyName || !variant || !organizationId) {
      return new Response(JSON.stringify({ error: "Missing companyName, variant, or organizationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = companyName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();

    // ── STEP 1: Find the real company logo ──
    if (variant === "color") {
      const domains = extractDomain(companyName, websiteUrl);
      let logoBuffer: ArrayBuffer | null = null;

      // Try Clearbit first (best quality)
      for (const domain of domains) {
        logoBuffer = await fetchClearbitLogo(domain);
        if (logoBuffer) break;
      }

      // Fallback: Google Favicon
      if (!logoBuffer) {
        for (const domain of domains) {
          logoBuffer = await fetchGoogleFavicon(domain);
          if (logoBuffer) break;
        }
      }

      // Fallback: Scrape website directly
      if (!logoBuffer) {
        for (const domain of domains) {
          const scraped = await scrapeWebsiteLogo(domain);
          if (scraped) {
            logoBuffer = await urlToBuffer(scraped);
            if (logoBuffer) break;
          }
        }
      }

      if (!logoBuffer) {
        return new Response(JSON.stringify({
          error: `Could not find a logo for "${companyName}". Try providing the company website URL.`,
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload the real logo
      const filePath = `${organizationId}/global-logos/${safeName}-color-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(filePath, logoBuffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("[fetch-logo] Upload error:", uploadError);
        return new Response(JSON.stringify({ error: "Failed to save logo" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: urlData } = supabase.storage.from("organization-assets").getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ url: `${urlData.publicUrl}?t=${Date.now()}`, variant: "color" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── STEP 2: For white/black variants, use AI to convert the color logo ──
    if (variant === "white" || variant === "black") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI service not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // We need the color logo URL to edit it — check if it was passed
      const { colorLogoUrl } = await req.json().catch(() => ({}));

      // Build conversion prompt
      const bgDesc = variant === "white"
        ? "Convert this logo to be entirely solid white. Place it on a solid dark slate (#1e293b) background."
        : "Convert this logo to be entirely solid black. Place it on a solid white (#ffffff) background.";

      const prompt = `${bgDesc} Keep the exact same shape and proportions. Output only the logo, centered, with generous padding. No text, no watermarks.`;

      const messages: any[] = [{ role: "user", content: [] as any[] }];

      if (colorLogoUrl) {
        messages[0].content.push(
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: colorLogoUrl } }
        );
      } else {
        // Fallback: ask AI to find and render the company's logo in the variant
        messages[0].content = `Find the real, official logo of the company "${companyName}" and render it ${
          variant === "white"
            ? "entirely in solid white on a dark slate (#1e293b) background"
            : "entirely in solid black on a clean white background"
        }. The logo must be accurate and recognizable. Show only the logo, centered, with generous padding. No extra text or elements.`;
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages,
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiResponse.text();
        console.error(`[fetch-logo] AI error ${status}:`, errText);
        return new Response(JSON.stringify({ error: "AI conversion failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        return new Response(JSON.stringify({ error: `Could not create ${variant} variant. Try manually uploading.` }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload AI-converted variant
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const filePath = `${organizationId}/global-logos/${safeName}-${variant}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(filePath, bytes, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("[fetch-logo] Upload error:", uploadError);
        return new Response(JSON.stringify({ error: "Failed to save variant" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: urlData } = supabase.storage.from("organization-assets").getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ url: `${urlData.publicUrl}?t=${Date.now()}`, variant }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid variant. Use: color, white, or black" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[fetch-logo] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
