// Rasterize wordmark SVGs into high-resolution PNG variants for any
// wordmark variant (color/black/white) that has an SVG but no PNG.
//
// POST body: { logo_id: string, variants?: ("color"|"black"|"white")[] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;
const TARGET_W = 2048;

interface FileEntry {
  url: string;
  format?: "svg" | "png" | "ico" | string;
  lockup?: "wordmark" | "icon";
  variant?: "color" | "black" | "white";
  source?: string;
}

let wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasmRes = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
      const wasmBuf = new Uint8Array(await wasmRes.arrayBuffer());
      await initWasm(wasmBuf);
    })();
  }
  await wasmReady;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function downloadText(url: string): Promise<string> {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`download ${r.status}`);
  return await r.text();
}

async function uploadAndSign(
  supabase: ReturnType<typeof createClient>,
  path: string,
  bytes: Uint8Array,
  ct: string,
) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: ct,
    upsert: true,
  });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

async function rasterize(svgText: string, targetWidth = TARGET_W): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svgText, {
    fitTo: { mode: "width", value: targetWidth },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { logo_id, variants } = await req.json();
    if (!logo_id || typeof logo_id !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "logo_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wanted: Array<"color" | "black" | "white"> =
      Array.isArray(variants) && variants.length
        ? variants.filter((v: string) => ["color", "black", "white"].includes(v))
        : ["color", "black", "white"];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("global_client_logos")
      .select("id, name, files")
      .eq("id", logo_id)
      .maybeSingle();
    if (error || !row) throw new Error(`logo not found: ${error?.message ?? "missing"}`);

    const files: FileEntry[] = Array.isArray(row.files) ? (row.files as FileEntry[]) : [];
    const slug = slugify(row.name);

    const produced: FileEntry[] = [];
    const skipped: Array<{ variant: string; reason: string }> = [];
    const errors: Array<{ variant: string; error: string }> = [];

    for (const v of wanted) {
      const hasPng = files.some(
        (f) => (f.lockup ?? "wordmark") === "wordmark" && f.variant === v && f.format === "png",
      );
      if (hasPng) {
        skipped.push({ variant: v, reason: "png already exists" });
        continue;
      }
      const svg = files.find(
        (f) => (f.lockup ?? "wordmark") === "wordmark" && f.variant === v && f.format === "svg",
      );
      if (!svg) {
        skipped.push({ variant: v, reason: "no svg source" });
        continue;
      }
      try {
        const svgText = await downloadText(svg.url);
        const png = await rasterize(svgText, TARGET_W);
        const ts = Date.now();
        const path = `${slug}/${logo_id}/wordmark-${v}-${ts}.png`;
        const signed = await uploadAndSign(supabase, path, png, "image/png");
        produced.push({
          url: signed,
          format: "png",
          variant: v,
          lockup: "wordmark",
          source: "rasterized-from-svg",
        });
      } catch (e) {
        errors.push({ variant: v, error: (e as Error).message });
      }
    }

    if (produced.length) {
      const nextFiles = [...files, ...produced];
      const { error: upErr } = await supabase
        .from("global_client_logos")
        .update({ files: nextFiles })
        .eq("id", logo_id);
      if (upErr) throw new Error(`db update: ${upErr.message}`);
      return new Response(
        JSON.stringify({ ok: true, produced, skipped, errors, files: nextFiles }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, produced, skipped, errors, files }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
