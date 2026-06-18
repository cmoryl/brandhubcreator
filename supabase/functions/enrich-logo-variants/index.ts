// Enrich global_client_logos so every brand has authentic black + white variants,
// preferably as SVG (or high-res PNG fallback).
//
// Strategy per brand:
//  1. Try Simple Icons (clean monochrome SVG) by several candidate slugs derived
//     from name + website host. Simple Icons SVGs are inherently single-color and
//     ideal for producing true black/white pairs.
//  2. If a Simple Icons SVG is found AND the brand currently lacks SVG black/white
//     variants for its icon lockup (or its existing B/W files are duplicates of
//     the color file), upsert true monochrome SVG black + white into the icon
//     lockup. Also fill wordmark black/white SVG when the wordmark has no SVG
//     B/W variants today.
//  3. For SVG color wordmarks that already exist but lack genuine SVG black/white,
//     derive monochrome SVGs from the color SVG directly.
//  4. Leave color variants and existing high-quality assets alone.
//
// POST body: { limit?: number, offset?: number, dryRun?: boolean, names?: string[] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

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

function candidateSimpleIconSlugs(name: string, website: string | null): string[] {
  const out = new Set<string>();
  const base = name.toLowerCase()
    .replace(/\[[^\]]*\]/g, " ") // strip "[adobe ...]" suffixes
    .replace(/\(.*?\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/\+/g, "plus")
    .replace(/\./g, " ")
    .trim();
  const compact = base.replace(/[^a-z0-9]+/g, "");
  out.add(compact);
  const dashed = base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  out.add(dashed.replace(/-/g, ""));
  // First word only
  const first = base.split(/\s+/)[0]?.replace(/[^a-z0-9]+/g, "") ?? "";
  if (first) out.add(first);
  // Domain-based
  if (website) {
    try {
      const host = new URL(website).host.replace(/^www\./, "");
      const root = host.split(".")[0];
      if (root) out.add(root.replace(/[^a-z0-9]+/g, ""));
      out.add(host.replace(/[^a-z0-9]+/g, ""));
    } catch { /* ignore */ }
  }
  return [...out].filter(Boolean);
}

async function fetchSimpleIcon(slug: string): Promise<string | null> {
  const urls = [
    `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`,
    `https://unpkg.com/simple-icons@latest/icons/${slug}.svg`,
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { "User-Agent": "LovableLogoBot/1.0" } });
      if (!res.ok) continue;
      const txt = await res.text();
      if (txt.includes("<svg") && txt.length > 80) return txt;
    } catch { /* ignore */ }
  }
  return null;
}

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "");
}

function monochromeSvg(svgText: string, color: "#000000" | "#ffffff"): string {
  let s = sanitizeSvg(svgText);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  const styleBlock = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  if (/<svg[^>]*>/i.test(s)) s = s.replace(/<svg([^>]*)>/i, `<svg$1>${styleBlock}`);
  return s;
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
  if (upErr) throw new Error(`upload ${path}: ${upErr.message}`);
  const { data: signed, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (sErr || !signed) throw new Error(`sign ${path}: ${sErr?.message}`);
  return signed.signedUrl;
}

function findEntry(files: FileEntry[], lockup: string, variant: string): FileEntry | undefined {
  return files.find((f) => f?.lockup === lockup && f?.variant === variant);
}

function isSvgGenuineMono(files: FileEntry[], lockup: string): boolean {
  const black = findEntry(files, lockup, "black");
  const white = findEntry(files, lockup, "white");
  const color = findEntry(files, lockup, "color");
  if (!black || !white) return false;
  if (black.format !== "svg" || white.format !== "svg") return false;
  // Treat as fake if black/white URL is the same as color URL
  if (color && (black.url === color.url || white.url === color.url)) return false;
  return true;
}

async function enrichBrand(
  row: { id: string; name: string; website_url: string | null; files: FileEntry[] },
  supabase: ReturnType<typeof createClient>,
  dryRun: boolean,
): Promise<{ name: string; actions: string[]; ok: boolean; error?: string }> {
  const actions: string[] = [];
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  // 1) Try Simple Icons
  let siSvg: string | null = null;
  let siSlug = "";
  for (const candidate of candidateSimpleIconSlugs(row.name, row.website_url)) {
    siSvg = await fetchSimpleIcon(candidate);
    if (siSvg) { siSlug = candidate; break; }
  }
  if (siSvg) actions.push(`simpleicons:${siSlug}`);

  // Helper to upsert/replace entry
  const upsert = (entry: FileEntry) => {
    const idx = files.findIndex((f) => f?.lockup === entry.lockup && f?.variant === entry.variant);
    if (idx >= 0) files[idx] = entry; else files.push(entry);
  };

  async function deriveAndStore(lockup: "icon" | "wordmark", svgText: string, srcLabel: string) {
    const blackSvg = monochromeSvg(svgText, "#000000");
    const whiteSvg = monochromeSvg(svgText, "#ffffff");
    if (dryRun) {
      actions.push(`would-write:${lockup}-black/white.svg (${srcLabel})`);
      return;
    }
    const blackUrl = await uploadAndSign(
      supabase, `${slug}/${lockup}-black.svg`,
      new TextEncoder().encode(blackSvg), "image/svg+xml",
    );
    const whiteUrl = await uploadAndSign(
      supabase, `${slug}/${lockup}-white.svg`,
      new TextEncoder().encode(whiteSvg), "image/svg+xml",
    );
    upsert({ url: blackUrl, format: "svg", lockup, source: srcLabel, variant: "black" });
    upsert({ url: whiteUrl, format: "svg", lockup, source: srcLabel, variant: "white" });
    actions.push(`wrote:${lockup}-black/white.svg (${srcLabel})`);
  }

  // 2) Icon variants — Simple Icons is icon-shaped
  if (siSvg && !isSvgGenuineMono(files, "icon")) {
    // Also store color SVG (using brand-toned variant via Simple Icons CDN with color)
    // We keep the upstream raw monochrome svg as the "color" too if no color exists.
    const existingIconColor = findEntry(files, "icon", "color");
    if (!existingIconColor || existingIconColor.format !== "svg") {
      if (!dryRun) {
        const colorUrl = await uploadAndSign(
          supabase, `${slug}/icon-color.svg`,
          new TextEncoder().encode(sanitizeSvg(siSvg)), "image/svg+xml",
        );
        upsert({ url: colorUrl, format: "svg", lockup: "icon", source: `simpleicons:${siSlug}`, variant: "color" });
        actions.push(`wrote:icon-color.svg`);
      } else {
        actions.push(`would-write:icon-color.svg`);
      }
    }
    await deriveAndStore("icon", siSvg, `simpleicons:${siSlug}`);
  }

  // 3) Wordmark — derive B/W from existing color SVG when not already genuine
  if (!isSvgGenuineMono(files, "wordmark")) {
    const colorWord = findEntry(files, "wordmark", "color");
    if (colorWord && (colorWord.format ?? "").toLowerCase() === "svg") {
      try {
        const res = await fetch(colorWord.url);
        if (res.ok) {
          const txt = await res.text();
          if (txt.includes("<svg")) {
            await deriveAndStore("wordmark", txt, `derived:${colorWord.source ?? "internal"}`);
          }
        }
      } catch (e) {
        actions.push(`wordmark-derive-failed: ${(e as Error).message}`);
      }
    } else if (siSvg) {
      // Last resort: fall back to using simple-icons mark as wordmark monochrome
      // ONLY when there's no wordmark SVG at all (so users still get something usable).
      const word = findEntry(files, "wordmark", "color");
      if (!word) {
        await deriveAndStore("wordmark", siSvg, `simpleicons:${siSlug}`);
      }
    }
  }

  if (!dryRun && actions.length > 0) {
    const cleanFiles = files.filter(Boolean);
    const { error } = await supabase
      .from("global_client_logos")
      .update({ files: cleanFiles, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return { name: row.name, actions, ok: false, error: error.message };
  }

  return { name: row.name, actions, ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({} as any));
    const limit = Math.max(1, Math.min(150, Number(body.limit ?? 150)));
    const offset = Math.max(0, Number(body.offset ?? 0));
    const dryRun = body.dryRun === true;
    const names: string[] | null = Array.isArray(body.names) && body.names.length > 0 ? body.names : null;

    let q = supabase
      .from("global_client_logos")
      .select("id, name, website_url, files")
      .order("name", { ascending: true });
    if (names) q = q.in("name", names);
    else q = q.range(offset, offset + limit - 1);

    const { data, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    // Process in small concurrent batches to be friendly to upstreams.
    const rows = data ?? [];
    const BATCH = 4;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const part = await Promise.all(
        chunk.map((r: any) => enrichBrand(r, supabase, dryRun).catch((e) => ({
          name: r.name, actions: [], ok: false, error: (e as Error).message,
        }))),
      );
      results.push(...part);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: results.length,
        succeeded: results.filter((r) => r.ok).length,
        withChanges: results.filter((r) => r.actions.length > 0).length,
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
