// Bulk repair logo and icon assets across all brands:
// - Rehosts every external URL (simpleicons CDN, google favicon, wikimedia, etc.)
//   into the `global-logos` bucket so we control the assets permanently.
// - Optionally re-runs Firecrawl branding to refresh missing/placeholder wordmarks.
// - Generates true monochrome (black/white) SVG variants for SVG assets when needed.
//
// Invoke with POST body:
//   { "limit": 20, "offset": 0, "refreshWordmark": true, "onlyMissing": false }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years
const BUCKET = "global-logos";
const SUPABASE_HOST = new URL(Deno.env.get("SUPABASE_URL") ?? "https://localhost").host;

interface FileEntry {
  url: string;
  format?: string;
  lockup?: "wordmark" | "icon";
  source?: string;
  variant?: "color" | "black" | "white";
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extFromContentType(ct: string | null, fallback = "png"): string {
  if (!ct) return fallback;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("x-icon") || ct.includes("vnd.microsoft.icon")) return "ico";
  return fallback;
}

function isInternal(url: string): boolean {
  try {
    return new URL(url).host === SUPABASE_HOST;
  } catch {
    return false;
  }
}

// Force-tint an SVG to a flat color (black or white) by stripping fills/strokes
// and wrapping in a CSS rule. Preserves the artwork shape.
function monochromeSvg(svgText: string, color: "#000000" | "#ffffff"): string {
  let s = svgText;
  // Drop inline style fills/strokes and named fill attributes
  s = s.replace(/\s(fill|stroke)="(?!none)[^"]*"/gi, "");
  s = s.replace(/(fill|stroke)\s*:\s*[^;"']+/gi, "");
  // Inject a global style at the top of the root svg tag
  const styleBlock = `<style>*{fill:${color} !important;stroke:${color} !important;}</style>`;
  if (/<svg[^>]*>/i.test(s)) {
    s = s.replace(/<svg([^>]*)>/i, `<svg$1>${styleBlock}`);
  }
  return s;
}

async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; ct: string | null }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 LovableLogoBot/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`download ${res.status} ${url.slice(0, 80)}`);
  const ct = res.headers.get("content-type");
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 80) throw new Error(`tiny payload ${bytes.length}b`);
  return { bytes, ct };
}

async function uploadAndSign(
  supabase: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (upErr) throw new Error(`upload: ${upErr.message}`);
  const { data: signed, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (sErr || !signed) throw new Error(`sign: ${sErr?.message}`);
  return signed.signedUrl;
}

async function firecrawlBranding(url: string, apiKey: string): Promise<any> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["branding"], onlyMainContent: false }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`firecrawl ${res.status}`);
  return json;
}

function pickLogoUrl(payload: any): string | null {
  const b = payload?.data?.branding ?? payload?.branding ?? {};
  return b.logo || b.images?.logo || b.images?.ogImage || null;
}

interface RepairResult {
  name: string;
  ok: boolean;
  rehosted: number;
  skipped: number;
  errors: string[];
  wordmarkRefreshed?: boolean;
}

async function repairBrand(
  row: { id: string; name: string; website_url: string | null; files: FileEntry[] },
  supabase: ReturnType<typeof createClient>,
  firecrawlKey: string | null,
  opts: { refreshWordmark: boolean },
): Promise<RepairResult> {
  const slug = slugify(row.name);
  const result: RepairResult = { name: row.name, ok: true, rehosted: 0, skipped: 0, errors: [] };
  const files = Array.isArray(row.files) ? [...row.files] : [];

  // Optionally refresh the wordmark via Firecrawl when current wordmark is
  // a known weak source (wikimedia png/svg, missing entirely, etc.)
  if (opts.refreshWordmark && firecrawlKey && row.website_url) {
    const hasGoodWordmark = files.some(
      (f) =>
        f.lockup === "wordmark" &&
        isInternal(f.url) &&
        f.source !== "wikimedia",
    );
    if (!hasGoodWordmark) {
      try {
        const branding = await firecrawlBranding(row.website_url, firecrawlKey);
        const logoUrl = pickLogoUrl(branding);
        if (logoUrl) {
          const { bytes, ct } = await downloadBytes(logoUrl);
          const ext = extFromContentType(ct);
          const path = `${slug}/wordmark-color.${ext}`;
          const signedUrl = await uploadAndSign(supabase, path, bytes, ct ?? `image/${ext}`);

          // Build black/white variants if SVG
          const entries: FileEntry[] = [
            { url: signedUrl, format: ext, lockup: "wordmark", source: "firecrawl", variant: "color" },
          ];
          if (ext === "svg") {
            const svgText = new TextDecoder().decode(bytes);
            const blackBytes = new TextEncoder().encode(monochromeSvg(svgText, "#000000"));
            const whiteBytes = new TextEncoder().encode(monochromeSvg(svgText, "#ffffff"));
            const blackUrl = await uploadAndSign(supabase, `${slug}/wordmark-black.svg`, blackBytes, "image/svg+xml");
            const whiteUrl = await uploadAndSign(supabase, `${slug}/wordmark-white.svg`, whiteBytes, "image/svg+xml");
            entries.push(
              { url: blackUrl, format: "svg", lockup: "wordmark", source: "firecrawl", variant: "black" },
              { url: whiteUrl, format: "svg", lockup: "wordmark", source: "firecrawl", variant: "white" },
            );
          } else {
            entries.push(
              { url: signedUrl, format: ext, lockup: "wordmark", source: "firecrawl", variant: "black" },
              { url: signedUrl, format: ext, lockup: "wordmark", source: "firecrawl", variant: "white" },
            );
          }
          // Replace any existing wordmark entries
          for (let i = files.length - 1; i >= 0; i--) {
            if (files[i]?.lockup === "wordmark") files.splice(i, 1);
          }
          files.push(...entries);
          result.wordmarkRefreshed = true;
          result.rehosted += entries.length;
        }
      } catch (e) {
        result.errors.push(`wordmark: ${(e as Error).message}`);
      }
    }
  }

  // Rehost every external file URL
  // Cache same-URL downloads within this brand to avoid re-fetching
  const downloadCache = new Map<string, { bytes: Uint8Array; ct: string | null }>();
  // Cache same-source -> destination url so identical inputs share the same upload
  const remoteToLocal = new Map<string, FileEntry>();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f?.url) continue;
    if (isInternal(f.url)) {
      result.skipped++;
      continue;
    }
    const cacheKey = `${f.url}|${f.variant ?? "color"}|${f.lockup ?? "wordmark"}`;
    const cached = remoteToLocal.get(cacheKey);
    if (cached) {
      files[i] = { ...f, ...cached };
      result.rehosted++;
      continue;
    }
    try {
      let dl = downloadCache.get(f.url);
      if (!dl) {
        dl = await downloadBytes(f.url);
        downloadCache.set(f.url, dl);
      }
      let { bytes, ct } = dl;
      let ext = extFromContentType(ct, f.format ?? "png");

      // For SVG icons, derive true monochrome when variant !== color
      if (ext === "svg" && f.lockup === "icon" && f.variant && f.variant !== "color") {
        const txt = new TextDecoder().decode(bytes);
        const tinted = monochromeSvg(
          txt,
          f.variant === "white" ? "#ffffff" : "#000000",
        );
        bytes = new TextEncoder().encode(tinted);
        ct = "image/svg+xml";
      }

      const fileName = `${f.lockup ?? "asset"}-${f.variant ?? "color"}.${ext}`;
      const path = `${slug}/${fileName}`;
      const signedUrl = await uploadAndSign(supabase, path, bytes, ct ?? `image/${ext}`);

      const replaced: FileEntry = {
        ...f,
        url: signedUrl,
        format: ext,
        source: `rehosted:${f.source ?? "unknown"}`,
      };
      remoteToLocal.set(cacheKey, replaced);
      files[i] = replaced;
      result.rehosted++;
    } catch (e) {
      // Fallback: try Google favicon for the brand domain, rehost it.
      try {
        const domain = row.website_url ? new URL(row.website_url).host : null;
        if (!domain) throw e;
        const favUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
        const { bytes, ct } = await downloadBytes(favUrl);
        const ext = extFromContentType(ct, "png");
        const path = `${slug}/${f.lockup ?? "asset"}-${f.variant ?? "color"}-fallback.${ext}`;
        const signedUrl = await uploadAndSign(supabase, path, bytes, ct ?? `image/${ext}`);
        files[i] = { ...f, url: signedUrl, format: ext, source: `fallback:favicon` };
        result.rehosted++;
      } catch (e2) {
        // Last resort: drop the broken external entry so the row becomes clean.
        files[i] = null as any;
        result.errors.push(`${f.lockup}/${f.variant}: ${(e as Error).message} (dropped)`);
      }
    }
  }
  // Filter out dropped entries
  for (let i = files.length - 1; i >= 0; i--) {
    if (!files[i]) files.splice(i, 1);
  }


  // Persist
  const { error: updErr } = await supabase
    .from("global_client_logos")
    .update({ files, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  if (updErr) {
    result.errors.push(`db: ${updErr.message}`);
    result.ok = false;
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") ?? null;

    const body = await req.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(50, Number(body.limit ?? 25)));
    const offset = Math.max(0, Number(body.offset ?? 0));
    const refreshWordmark = body.refreshWordmark !== false;
    const onlyMissing = body.onlyMissing === true;

    let q = supabase
      .from("global_client_logos")
      .select("id, name, website_url, files")
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw error;

    let rows = data ?? [];
    if (onlyMissing) {
      rows = rows.filter((r: any) => {
        const s = JSON.stringify(r.files ?? []);
        return s.includes("cdn.simpleicons.org") ||
               s.includes("google.com/s2/favicons") ||
               s.includes("commons.wikimedia.org") ||
               !s.includes(SUPABASE_HOST);
      });
    }

    const results: RepairResult[] = [];
    for (const row of rows) {
      results.push(await repairBrand(row as any, supabase, firecrawlKey, { refreshWordmark }));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        offset,
        limit,
        processed: results.length,
        succeeded: results.filter((r) => r.ok).length,
        results,
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
