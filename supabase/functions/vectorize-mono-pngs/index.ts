// Vectorize existing monochrome PNG logo variants into single-color SVGs.
// For each brand, find any wordmark/icon B/W variant whose format is PNG
// (typically source: "mono-fallback") AND where no SVG B/W variant exists,
// trace the alpha mask into a compact single-color SVG using horizontal
// run-length rectangles at a downsampled resolution. Upload the result and
// mark it source: "auto-vectorized".
//
// POST body: { names?: string[], dryRun?: boolean, force?: boolean, traceWidth?: number }
//   names      – limit to these brand names
//   dryRun     – plan only, no writes
//   force      – overwrite even if an SVG already exists for that variant
//   traceWidth – target trace width in px (default 480, max 1200)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode } from "https://esm.sh/imagescript@1.2.17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

interface FileEntry {
  url: string;
  format?: string;
  lockup?: "wordmark" | "icon";
  source?: string;
  variant?: "color" | "black" | "white";
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function dl(url: string): Promise<Uint8Array> {
  const r = await fetch(url, { headers: { "User-Agent": "LovableLogoBot/1.0" }, redirect: "follow" });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function uploadSign(
  supabase: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array,
) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: "image/svg+xml",
    upsert: true,
  });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

/**
 * Trace a monochrome PNG into an SVG of horizontal run-length rectangles.
 * Approach:
 *  1. Decode + resize to `traceWidth` to keep output small.
 *  2. Derive a binary mask. If the image has real alpha (lots of partial/
 *     transparent pixels), threshold on alpha. Otherwise threshold on
 *     luminance — for a "white" variant we keep light pixels, for "black"
 *     we keep dark pixels.
 *  3. For each row, emit `<rect>` runs of consecutive ON pixels.
 *  4. Wrap in a viewBox sized to the traced grid, fill with `currentColor`,
 *     and inject a `<style>` forcing the requested target color.
 */
async function vectorizePng(
  pngBytes: Uint8Array,
  target: "black" | "white",
  traceWidth: number,
): Promise<Uint8Array> {
  const img = await decode(pngBytes);
  if (!("bitmap" in img)) throw new Error("not a static image");
  const w0 = img.width, h0 = img.height;
  const tw = Math.min(Math.max(64, Math.round(traceWidth)), 1200);
  const th = Math.max(1, Math.round((h0 / w0) * tw));
  // imagescript resize is in-place and returns the image
  if (tw !== w0) (img as any).resize(tw, th);

  const w = img.width, h = img.height;
  const px: Uint8Array = (img as any).bitmap; // RGBA

  // Detect whether the source has meaningful alpha
  let opaque = 0, total = w * h;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 250) opaque++;
  const useAlpha = opaque / total < 0.95;

  const on = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const r = px[o], g = px[o + 1], b = px[o + 2], a = px[o + 3];
      let isOn = false;
      if (useAlpha) {
        isOn = a > 128;
      } else {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        isOn = target === "white" ? lum > 160 : lum < 96;
      }
      on[y * w + x] = isOn ? 1 : 0;
    }
  }

  // Emit horizontal run-length rectangles
  const parts: string[] = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!on[y * w + x]) { x++; continue; }
      let x2 = x;
      while (x2 < w && on[y * w + x2]) x2++;
      const runW = x2 - x;
      parts.push(`<rect x="${x}" y="${y}" width="${runW}" height="1"/>`);
      x = x2;
    }
  }

  const color = target === "black" ? "#000000" : "#ffffff";
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">` +
`<style>rect{fill:${color}}</style>` +
`<g fill="${color}">${parts.join("")}</g>` +
`</svg>`;
  return new TextEncoder().encode(svg);
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  opts: { dryRun: boolean; force: boolean; traceWidth: number },
) {
  const actions: string[] = [];
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  const find = (lockup: "wordmark" | "icon", variant: "color" | "black" | "white") =>
    files.find((f) => f?.lockup === lockup && f?.variant === variant);
  const upsert = (e: FileEntry) => {
    const i = files.findIndex((f) => f?.lockup === e.lockup && f?.variant === e.variant);
    if (i >= 0) files[i] = e; else files.push(e);
  };

  for (const lockup of ["wordmark", "icon"] as const) {
    for (const v of ["black", "white"] as const) {
      const existing = find(lockup, v);
      // Only operate where the current B/W asset is a PNG (no SVG yet),
      // unless forced.
      if (!existing) continue;
      if (existing.format === "svg" && !opts.force) continue;
      if (existing.format !== "png") continue;

      try {
        const srcBytes = await dl(existing.url);
        const svgBytes = await vectorizePng(srcBytes, v, opts.traceWidth);
        const path = `${slug}/${lockup}-${v}-vector.svg`;
        const url = opts.dryRun ? "(dry)" : await uploadSign(supabase, path, svgBytes);
        if (!opts.dryRun) {
          upsert({
            url,
            format: "svg",
            lockup,
            variant: v,
            source: "auto-vectorized",
          });
        }
        actions.push(`${lockup}-${v}.svg auto-vectorized (was ${existing.format})`);
      } catch (e) {
        actions.push(`${lockup}-${v} error: ${(e as Error).message}`);
      }
    }
  }

  if (!opts.dryRun && actions.some((a) => !a.includes("error"))) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, actions, error: error.message };
  }
  return { name: row.name, actions };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({} as any));
    const names: string[] | null =
      Array.isArray(body.names) && body.names.length ? body.names : null;
    const dryRun = body.dryRun === true;
    const force = body.force === true;
    const traceWidth = Number.isFinite(body.traceWidth) ? Number(body.traceWidth) : 480;

    let q = supabase.from("global_client_logos").select("id, name, files").order("name");
    if (names) q = q.in("name", names);
    const { data, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    let touched = 0;
    for (const r of (data ?? [])) {
      const res = await processOne(supabase, r as any, { dryRun, force, traceWidth });
      if (res.actions && res.actions.length) touched++;
      results.push(res);
    }
    const summary = {
      total: results.length,
      touched,
      withChanges: results.filter((r) =>
        (r.actions ?? []).some((a: string) => !a.includes("error"))
      ).length,
    };
    return new Response(JSON.stringify({ ok: true, summary, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
