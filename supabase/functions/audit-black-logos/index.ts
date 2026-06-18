// Audit every variant=black file across global_client_logos and regenerate any
// that aren't truly black. Strategy per row:
// 1. Pick best source for black derivation (priority: SVG white → SVG color → PNG white → PNG color).
// 2. Audit current black entry:
//    - SVG: must contain no non-black/non-transparent color tokens after sanitize.
//    - PNG: sample non-transparent pixels; >=95% must be near-black (<20 RGB).
// 3. If audit fails or no black exists, regenerate from source and upload, marking source as "audit-rebuilt".
//
// POST body: { names?: string[], dryRun?: boolean, lockup?: "wordmark"|"icon"|"both" }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const TARGET_W = 2048;

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function dl(url: string): Promise<Uint8Array> {
  const r = await fetch(url, { headers:{ "User-Agent":"LovableAudit/1.0" }, redirect:"follow" });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function uploadSign(sb: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await sb.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}

function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi, "");
  s = s.replace(/<image\b[\s\S]*?>/gi, "");
  s = s.replace(/\sstyle="[^"]*fill\s*:\s*none[^"]*stroke\s*:\s*(?!none|transparent)[^"]*"/gi, ' fill="none" data-mono-stroke="1"');
  s = s.replace(/\sstyle="[^"]*stroke\s*:\s*(?!none|transparent)[^"]*fill\s*:\s*none[^"]*"/gi, ' fill="none" data-mono-stroke="1"');
  s = s.replace(/\sstyle="[^"]*"/gi, "");
  s = s.replace(/\sclass="[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, ' data-mono-stroke="1"');
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\s(?:stop-color|flood-color|lighting-color|color)="[^"]*"/gi, "");
  s = s.replace(/<\s*(line|polyline)\b(?![^>]*data-mono-stroke)/gi, '<$1 data-mono-stroke="1"');
  const style = `<style>svg,svg *{color:${color}!important;fill:${color}!important}svg [fill="none"],svg [fill="transparent"]{fill:none!important}svg [data-mono-stroke],svg [stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

function paintTokens(svgText: string): string[] {
  const tokens: string[] = [];
  const attr = /\b(?:fill|stroke|color|stop-color|flood-color|lighting-color)\s*=\s*["']([^"']+)["']/gi;
  const css = /(?:fill|stroke|color|stop-color|flood-color|lighting-color)\s*:\s*([^;}"]+)/gi;
  for (const re of [attr, css]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(svgText))) tokens.push(m[1].trim().toLowerCase().replace(/!important/g, "").trim());
  }
  return tokens;
}

function tokenIsBlack(token: string): boolean {
  if (!token || token === "none" || token === "transparent") return true;
  if (token.startsWith("url(") || token.startsWith("var(")) return false;
  if (token === "black") return true;
  if (token === "white" || token === "currentcolor" || token === "inherit") return false;
  const hex = token.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex.slice(0, 6);
    const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
    return r <= 20 && g <= 20 && b <= 20;
  }
  const nums = token.match(/rgba?\(([^)]+)\)/i)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number) ?? [];
  if (nums.length >= 3) return nums[0] <= 20 && nums[1] <= 20 && nums[2] <= 20;
  return false;
}

function svgIsBlack(svgText: string): boolean {
  if (/<image\b/i.test(svgText)) return false;
  const tokens = paintTokens(svgText);
  const meaningful = tokens.filter(t => t !== "none" && t !== "transparent");
  if (!meaningful.length) return false;
  return tokens.every(tokenIsBlack);
}

async function pngIsBlack(bytes: Uint8Array): Promise<boolean> {
  try {
    const img = await Image.decode(bytes);
    const stride = Math.max(1, Math.floor(Math.max(img.width, img.height) / 64));
    let opaque = 0, black = 0;
    for (let y = 0; y < img.height; y += stride) {
      for (let x = 0; x < img.width; x += stride) {
        const px = img.getPixelAt(x + 1, y + 1);
        const a = px & 0xff;
        if (a < 32) continue;
        opaque++;
        const r = (px >> 24) & 0xff, g = (px >> 16) & 0xff, b = (px >> 8) & 0xff;
        if (r < 20 && g < 20 && b < 20) black++;
      }
    }
    if (opaque < 20) return false;
    return black / opaque >= 0.95;
  } catch { return false; }
}

async function monoPng(srcBytes: Uint8Array, color: "white"|"black"): Promise<Uint8Array> {
  let img = await Image.decode(srcBytes);
  if (img.width < TARGET_W) {
    const scale = TARGET_W / img.width;
    img = img.resize(TARGET_W, Math.round(img.height * scale));
  }
  const total = Math.ceil(img.height/4) * Math.ceil(img.width/4);
  let opaque = 0;
  for (let y = 0; y < img.height; y += 4) {
    for (let x = 0; x < img.width; x += 4) {
      const px = img.getPixelAt(x + 1, y + 1);
      if ((px & 0xff) > 250) opaque++;
    }
  }
  // Mostly-opaque source likely uses light/white pixels for transparency — invert luminance for alpha
  const useLuminance = (opaque / total) > 0.95;
  const r = color === "white" ? 255 : 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const px = img.getPixelAt(x + 1, y + 1);
      const pr = (px >> 24) & 0xff;
      const pg = (px >> 16) & 0xff;
      const pb = (px >> 8) & 0xff;
      const pa = px & 0xff;
      let alpha: number;
      if (useLuminance) {
        const lum = 0.299*pr + 0.587*pg + 0.114*pb;
        // For black target on light bg: dark pixels = high alpha. Same formula (255-lum) works.
        alpha = Math.max(0, Math.min(255, Math.round(255 - lum)));
      } else {
        alpha = pa;
      }
      img.setPixelAt(x + 1, y + 1, ((r<<24)|(r<<16)|(r<<8)|alpha) >>> 0);
    }
  }
  return await img.encode();
}

async function processRow(
  sb: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  lockups: ("wordmark"|"icon")[],
  dryRun: boolean,
) {
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];
  const actions: string[] = [];
  const issues: string[] = [];

  for (const lockup of lockups) {
    const get = (v: "color"|"black"|"white") => files.find(f => f?.lockup===lockup && f?.variant===v);
    const white = get("white");
    const black = get("black");
    const color = get("color");

    if (!color && !black && !white) continue;

    // Source priority for black regen: SVG white > SVG color > PNG white > PNG color
    const candidates: Array<{ e: FileEntry; svg: boolean; isWhite: boolean }> = [];
    for (const e of [white, color]) {
      if (!e) continue;
      candidates.push({ e, svg: e.format === "svg", isWhite: e === white });
    }
    candidates.sort((a,b) => (b.svg?2:0)+(b.isWhite?1:0) - ((a.svg?2:0)+(a.isWhite?1:0)));
    const src = candidates[0];

    let needRebuild = false;
    if (!black) needRebuild = true;
    else if (color && black.url === color.url) needRebuild = true;
    else {
      try {
        const bytes = await dl(black.url);
        if (black.format === "svg" || (black.url.toLowerCase().includes(".svg"))) {
          const text = new TextDecoder().decode(bytes);
          if (!svgIsBlack(text)) needRebuild = true;
        } else {
          if (!(await pngIsBlack(bytes))) needRebuild = true;
        }
      } catch { needRebuild = true; }
    }

    if (!needRebuild) { issues.push(`${lockup}:ok`); continue; }
    if (!src) { issues.push(`${lockup}:no-source`); continue; }

    try {
      const srcBytes = await dl(src.e.url);
      let newBytes: Uint8Array, ext: "svg"|"png", ct: string;
      if (src.svg) {
        const text = new TextDecoder().decode(srcBytes);
        newBytes = new TextEncoder().encode(monoSvg(text, "#000000"));
        ext = "svg"; ct = "image/svg+xml";
      } else {
        newBytes = await monoPng(srcBytes, "black");
        ext = "png"; ct = "image/png";
      }
      const path = `${slug}/${lockup}-black-audit.${ext}`;
      if (dryRun) { actions.push(`would-rebuild:${lockup}-black (${ext}, src=${src.e.variant})`); continue; }
      const url = await uploadSign(sb, path, newBytes, ct);
      const entry: FileEntry = { url, format: ext, lockup, variant: "black", source: `audit-rebuilt:${src.e.variant}-${src.e.format ?? "?"}` };
      const i = files.findIndex(f => f?.lockup===lockup && f?.variant==="black");
      if (i>=0) files[i] = entry; else files.push(entry);
      actions.push(`rebuilt:${lockup}-black.${ext}`);
    } catch (e) {
      issues.push(`${lockup}:err:${(e as Error).message}`);
    }
  }

  if (!dryRun && actions.length) {
    const { error } = await sb.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, error: error.message, actions, issues };
  }
  return { name: row.name, actions, issues };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const dryRun = body.dryRun === true;
    const lockupArg = (body.lockup ?? "both") as "wordmark"|"icon"|"both";
    const lockups: ("wordmark"|"icon")[] = lockupArg === "both" ? ["wordmark","icon"] : [lockupArg];
    let q = sb.from("global_client_logos").select("id, name, files").order("name");
    if (Array.isArray(body.names) && body.names.length) q = q.in("name", body.names);
    const { data, error } = await q;
    if (error) throw error;
    const results: any[] = [];
    let rebuilt = 0, okCount = 0, errors = 0;
    for (const r of (data ?? [])) {
      try {
        const out = await processRow(sb, r as any, lockups, dryRun);
        if (out.actions?.length) rebuilt++;
        else okCount++;
        if ((out as any).error) errors++;
        results.push(out);
      } catch (e) {
        errors++;
        results.push({ name: (r as any).name, error: (e as Error).message });
      }
    }
    console.log("audit-black-logos:summary", JSON.stringify({ processed: results.length, rebuilt, okCount, errors }));
    return new Response(JSON.stringify({ ok:true, processed: results.length, rebuilt, okCount, errors, results }),
      { headers: { ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json" } });
  }
});
