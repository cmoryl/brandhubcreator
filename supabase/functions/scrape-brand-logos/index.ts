// Scrape official brand logos via Firecrawl branding extractor,
// upload them to the `global-logos` bucket, and update `global_client_logos.files`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

interface BrandInput {
  name: string;
  website_url: string;
}

interface ScrapeResult {
  name: string;
  ok: boolean;
  url?: string;
  error?: string;
}

async function firecrawlBranding(url: string, apiKey: string): Promise<any> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["branding"],
      onlyMainContent: false,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

function pickLogoUrl(brandingPayload: any): string | null {
  const b = brandingPayload?.data?.branding ?? brandingPayload?.branding ?? {};
  return b.logo || b.images?.logo || b.images?.ogImage || null;
}

function extFromContentType(ct: string | null, fallback = "png"): string {
  if (!ct) return fallback;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return fallback;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function processBrand(
  brand: BrandInput,
  supabase: ReturnType<typeof createClient>,
  firecrawlKey: string,
): Promise<ScrapeResult> {
  try {
    const branding = await firecrawlBranding(brand.website_url, firecrawlKey);
    const logoUrl = pickLogoUrl(branding);
    if (!logoUrl) return { name: brand.name, ok: false, error: "no logo in branding payload" };

    const imgRes = await fetch(logoUrl, {
      headers: { "User-Agent": "Mozilla/5.0 LovableLogoBot/1.0" },
    });
    if (!imgRes.ok) return { name: brand.name, ok: false, error: `download ${imgRes.status}` };
    const ct = imgRes.headers.get("content-type");
    const ext = extFromContentType(ct);
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    if (bytes.length < 200) return { name: brand.name, ok: false, error: "logo too small" };

    const path = `${slugify(brand.name)}/logo.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("global-logos")
      .upload(path, bytes, {
        contentType: ct ?? `image/${ext}`,
        upsert: true,
      });
    if (upErr) return { name: brand.name, ok: false, error: `upload: ${upErr.message}` };

    const { data: signed, error: sErr } = await supabase.storage
      .from("global-logos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr || !signed) return { name: brand.name, ok: false, error: `sign: ${sErr?.message}` };

    const fileEntry = (variant: string) => ({
      variant,
      format: ext,
      lockup: "wordmark",
      source: "firecrawl",
      url: signed.signedUrl,
    });

    // Replace wordmark entries, keep icon entries.
    const { data: existing } = await supabase
      .from("global_client_logos")
      .select("files")
      .eq("name", brand.name)
      .maybeSingle();

    const kept = Array.isArray(existing?.files)
      ? (existing!.files as any[]).filter((f) => f?.lockup !== "wordmark")
      : [];
    const newFiles = [...kept, fileEntry("color"), fileEntry("black"), fileEntry("white")];

    const { error: updErr } = await supabase
      .from("global_client_logos")
      .update({ files: newFiles, updated_at: new Date().toISOString() })
      .eq("name", brand.name);
    if (updErr) return { name: brand.name, ok: false, error: `db: ${updErr.message}` };

    return { name: brand.name, ok: true, url: signed.signedUrl };
  } catch (e) {
    return { name: brand.name, ok: false, error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) throw new Error("FIRECRAWL_API_KEY missing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    let brands: BrandInput[] = body.brands ?? [];

    if (!brands.length) {
      // Default: pick the brands whose wordmark is still a placeholder svg or unreachable.
      const { data, error } = await supabase
        .from("global_client_logos")
        .select("name, website_url, files")
        .not("website_url", "is", null);
      if (error) throw error;
      brands = (data ?? [])
        .filter((row: any) => {
          const filesStr = JSON.stringify(row.files ?? []);
          return (
            filesStr.includes("data:image/svg") ||
            filesStr.includes("placeholder") ||
            !filesStr.includes("wikimedia")
          );
        })
        .map((r: any) => ({ name: r.name, website_url: r.website_url }));
    }

    const results: ScrapeResult[] = [];
    // Sequential to respect Firecrawl rate limits.
    for (const b of brands) {
      results.push(await processBrand(b, supabase, firecrawlKey));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total: results.length,
        succeeded: results.filter((r) => r.ok).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
