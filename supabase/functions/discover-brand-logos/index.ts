// Discover brand logo candidates via Firecrawl branding extraction.
// Returns multiple candidate image URLs for the user to preview before commit.
//
// POST body: { website_url: string }
// Response: { ok, candidates: [{url, source, format?}], colors?, fonts? }
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Candidate {
  url: string;
  source: string;
  format?: string;
  suggestedLockup?: "icon" | "wordmark";
  suggestedVariant?: "color" | "black" | "white";
}

function extFromUrl(u: string): string | undefined {
  try {
    const path = new URL(u).pathname;
    const m = path.match(/\.([a-z0-9]+)(?:$|\?)/i);
    return m ? m[1].toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

async function firecrawlBranding(url: string, apiKey: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["branding"], onlyMainContent: false }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY missing");

    const { website_url } = await req.json();
    if (!website_url || typeof website_url !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "website_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await firecrawlBranding(website_url, apiKey);
    const b = payload?.data?.branding ?? payload?.branding ?? {};
    const images = b.images ?? {};

    const seen = new Set<string>();
    const candidates: Candidate[] = [];
    const push = (url: string | undefined, source: string, lockup?: "icon" | "wordmark") => {
      if (!url || typeof url !== "string") return;
      if (seen.has(url)) return;
      seen.add(url);
      candidates.push({
        url,
        source,
        format: extFromUrl(url),
        suggestedLockup: lockup,
        suggestedVariant: "color",
      });
    };

    push(b.logo, "branding.logo", "wordmark");
    push(images.logo, "images.logo", "wordmark");
    push(images.darkLogo, "images.darkLogo", "wordmark");
    push(images.lightLogo, "images.lightLogo", "wordmark");
    push(images.ogImage, "images.ogImage");
    push(images.favicon, "images.favicon", "icon");
    push(images.appleTouchIcon, "images.appleTouchIcon", "icon");

    return new Response(
      JSON.stringify({
        ok: true,
        candidates,
        colors: b.colors ?? null,
        fonts: b.fonts ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
