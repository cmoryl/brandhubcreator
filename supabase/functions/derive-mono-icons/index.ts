// Derive black & white icon variants (SVG + PNG) from an existing color icon
// on a global_client_logos row. Uploads results to storage and appends them
// to the row's `files` array.
//
// POST body: { logo_id: string, lockup?: "icon" | "wordmark" }
//
// SVG strategy: inject a <style> rule that forces fill/stroke to the target color,
// removing color information while preserving shape and alpha.
//
// PNG strategy: decode with imagescript, walk pixels, recolor RGB to target
// while keeping alpha as the silhouette mask. Pixels with alpha=0 stay transparent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image, decode as decodeImage } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "logo";

interface FileRec {
  url: string;
  format: string;
  variant: "color" | "black" | "white";
  lockup?: "icon" | "wordmark";
  source?: string;
}

function deriveMonoSvg(svgText: string, hex: string): string {
  const cleaned = svgText.replace(/<\?xml[^?]*\?>/g, "").trim();
  const styleBlock = `<style>*{fill:${hex} !important;stroke:${hex} !important;stop-color:${hex} !important;}</style>`;
  // Insert style right after the opening <svg ...> tag
  const m = cleaned.match(/<svg\b[^>]*>/i);
  if (!m) return cleaned;
  const insertAt = (m.index ?? 0) + m[0].length;
  return cleaned.slice(0, insertAt) + styleBlock + cleaned.slice(insertAt);
}

async function deriveMonoPng(bytes: Uint8Array, variant: "black" | "white"): Promise<Uint8Array> {
  const decoded = await decodeImage(bytes);
  if (!(decoded instanceof Image)) throw new Error("not a static PNG image");
  const r = variant === "white" ? 255 : 0;
  const g = r;
  const b = r;
  // imagescript pixels are RGBA packed into uint32 0xRRGGBBAA
  for (let y = 1; y <= decoded.height; y++) {
    for (let x = 1; x <= decoded.width; x++) {
      const px = decoded.getPixelAt(x, y);
      const a = px & 0xff;
      if (a === 0) continue;
      const newPx = ((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | a;
      decoded.setPixelAt(x, y, newPx >>> 0);
    }
  }
  return await decoded.encode();
}

async function fetchBytes(url: string): Promise<{ bytes: Uint8Array; ct: string }> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, ct };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { logo_id, lockup = "icon" } = await req.json();
    if (!logo_id) {
      return new Response(JSON.stringify({ ok: false, error: "logo_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await admin
      .from("global_client_logos")
      .select("id, name, files")
      .eq("id", logo_id)
      .maybeSingle();
    if (error || !row) throw new Error("row not found");

    const files: FileRec[] = Array.isArray(row.files) ? row.files as FileRec[] : [];
    const lockupMatch = (f: FileRec) => (f.lockup ?? "wordmark") === lockup;

    // Prefer SVG color, else best PNG color
    const colorSvg = files.find((f) => lockupMatch(f) && f.variant === "color" && f.format === "svg");
    const colorPng = files.find((f) => lockupMatch(f) && f.variant === "color" && f.format === "png");
    const source = colorSvg ?? colorPng;
    if (!source) throw new Error(`no color ${lockup} to derive from`);

    const slug = slugify(row.name);
    const ts = Date.now();
    const produced: FileRec[] = [];
    const variants: ("black" | "white")[] = ["black", "white"];
    const errors: { variant: string; format: string; error: string }[] = [];

    // SVG path
    if (colorSvg) {
      const { bytes } = await fetchBytes(colorSvg.url);
      const text = new TextDecoder().decode(bytes);
      for (const v of variants) {
        try {
          const hex = v === "white" ? "#ffffff" : "#000000";
          const out = new TextEncoder().encode(deriveMonoSvg(text, hex));
          const path = `${slug}/${logo_id}/${lockup}-${v}-${ts}.svg`;
          const { error: upErr } = await admin.storage.from(BUCKET).upload(path, out, {
            contentType: "image/svg+xml", upsert: true,
          });
          if (upErr) throw new Error(upErr.message);
          const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, TTL);
          if (!signed) throw new Error("sign failed");
          produced.push({ url: signed.signedUrl, format: "svg", variant: v, lockup, source: "derived-from-color-svg" });
        } catch (e) {
          errors.push({ variant: v, format: "svg", error: (e as Error).message });
        }
      }
    }

    // PNG path (from PNG color; or rasterize-free skip if only SVG)
    if (colorPng) {
      const { bytes } = await fetchBytes(colorPng.url);
      for (const v of variants) {
        try {
          const out = await deriveMonoPng(bytes, v);
          const path = `${slug}/${logo_id}/${lockup}-${v}-${ts}.png`;
          const { error: upErr } = await admin.storage.from(BUCKET).upload(path, out, {
            contentType: "image/png", upsert: true,
          });
          if (upErr) throw new Error(upErr.message);
          const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, TTL);
          if (!signed) throw new Error("sign failed");
          produced.push({ url: signed.signedUrl, format: "png", variant: v, lockup, source: "derived-from-color-png" });
        } catch (e) {
          errors.push({ variant: v, format: "png", error: (e as Error).message });
        }
      }
    }

    if (!produced.length) {
      return new Response(JSON.stringify({ ok: false, error: "no variants produced", errors }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Replace any existing same-lockup+variant+format combos with new ones
    const kept = files.filter((f) =>
      !produced.some((p) =>
        (f.lockup ?? "wordmark") === p.lockup && f.variant === p.variant && f.format === p.format
      )
    );
    const merged = [...kept, ...produced];
    const { error: updErr } = await admin
      .from("global_client_logos")
      .update({ files: merged, updated_at: new Date().toISOString() })
      .eq("id", logo_id);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ ok: true, produced, errors, files: merged }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
