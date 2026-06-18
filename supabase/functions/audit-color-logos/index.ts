// Audit every variant=color file across global_client_logos. Strategy per row:
// 1. Audit current color: must download; if SVG must contain non-mono color tokens
//    (not all-black, not all-white); if raster sample pixels and confirm color (not >95% mono).
// 2. If color slot is currently raster (PNG/JPG), attempt SVG upgrade via svgl.app catalog
//    matched by brand name. If a clean SVG is found, replace the color slot.
// 3. If color slot is missing entirely, attempt the same SVG sourcing.
//
// Does NOT touch black/white variants. Run audit-black-logos / audit-white-logos
// separately to refresh mono variants from the upgraded color source.
//
// POST body: { names?: string[], dryRun?: boolean, lockup?: "wordmark"|"icon"|"both",
//              forceUpgrade?: boolean, svglOnly?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

async function dl(url: string): Promise<{ bytes: Uint8Array; ct: string|null }> {
  const r = await fetch(url, { headers:{ "User-Agent":"LovableAudit/1.0" }, redirect:"follow" });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  if (bytes.length < 80) throw new Error(`tiny ${bytes.length}`);
  return { bytes, ct: r.headers.get("content-type") };
}

async function uploadSign(sb: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await sb.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
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

function hexNorm(token: string): [number,number,number] | null {
  if (!token) return null;
  if (token === "black") return [0,0,0];
  if (token === "white") return [255,255,255];
  const hex = token.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex.slice(0, 6);
    return [parseInt(full.slice(0,2),16), parseInt(full.slice(2,4),16), parseInt(full.slice(4,6),16)];
  }
  const nums = token.match(/rgba?\(([^)]+)\)/i)?.[1].split(/[,\s/]+/).filter(Boolean).map(Number) ?? [];
  if (nums.length >= 3) return [nums[0], nums[1], nums[2]];
  return null;
}

function svgHasColor(svgText: string): boolean {
  // Considered "color" if at least one paint token resolves to a non-mono color
  // (not pure black, not pure white, not transparent/none).
  const tokens = paintTokens(svgText);
  let colorful = 0;
  for (const t of tokens) {
    if (!t || t === "none" || t === "transparent" || t === "currentcolor" || t === "inherit") continue;
    if (t.startsWith("url(") || t.startsWith("var(")) { colorful++; continue; } // gradients/vars treated as color
    const rgb = hexNorm(t);
    if (!rgb) continue;
    const [r,g,b] = rgb;
    const isBlack = r <= 20 && g <= 20 && b <= 20;
    const isWhite = r >= 235 && g >= 235 && b >= 235;
    const isGray = Math.abs(r-g) < 8 && Math.abs(g-b) < 8 && Math.abs(r-b) < 8;
    if (!isBlack && !isWhite && !isGray) colorful++;
  }
  // embedded raster also counts as colorful enough — keep as-is
  if (/<image\b/i.test(svgText) && colorful === 0) return true;
  return colorful > 0;
}

async function pngHasColor(bytes: Uint8Array): Promise<boolean> {
  try {
    const img = await Image.decode(bytes);
    const stride = Math.max(1, Math.floor(Math.max(img.width, img.height) / 64));
    let opaque = 0, colorful = 0;
    for (let y = 0; y < img.height; y += stride) {
      for (let x = 0; x < img.width; x += stride) {
        const px = img.getPixelAt(x + 1, y + 1);
        const a = px & 0xff;
        if (a < 32) continue;
        opaque++;
        const r = (px >> 24) & 0xff, g = (px >> 16) & 0xff, b = (px >> 8) & 0xff;
        const isBlack = r < 20 && g < 20 && b < 20;
        const isWhite = r > 235 && g > 235 && b > 235;
        const isGray = Math.abs(r-g) < 8 && Math.abs(g-b) < 8 && Math.abs(r-b) < 8;
        if (!isBlack && !isWhite && !isGray) colorful++;
      }
    }
    if (opaque < 20) return false;
    return colorful / opaque >= 0.05;
  } catch { return false; }
}

// ============ svgl.app catalog matcher ============
type SvglUrl = string | { light?: string; dark?: string };
interface SvglEntry { id: number; title: string; route?: SvglUrl; wordmark?: SvglUrl }

const SVGL_NAME_OVERRIDES: Record<string,string> = {
  "x (twitter)": "x",
  "wordpress": "wordpress",
  "service now": "servicenow",
  "sap (commerce cloud)": "sap",
  "aem [adobe experience manager]": "adobe",
  "adobe marketo": "marketo",
  "sharepoint": "microsoft sharepoint",
  "azure cloud": "azure",
  "google": "google",
  "apple music": "apple music",
  "the new york times": "the new york times",
  "marks & spencer": "marks and spencer",
  "p&g": "procter and gamble",
  "johnson & johnson": "johnson and johnson",
  "mcdonald's": "mcdonalds",
};

function pickSvglUrl(u: SvglUrl | undefined): string | null {
  if (!u) return null;
  if (typeof u === "string") return u;
  return u.light ?? u.dark ?? null;
}

async function svglFind(rawName: string): Promise<SvglEntry | null> {
  const norm = rawName.toLowerCase().trim();
  const queryName = SVGL_NAME_OVERRIDES[norm] ?? norm;
  const searchTerms = Array.from(new Set([queryName, norm, queryName.split(/[\s\-]/)[0]].filter(Boolean)));
  let best: SvglEntry | null = null;
  for (const term of searchTerms) {
    try {
      const r = await fetch(`https://api.svgl.app?search=${encodeURIComponent(term)}`);
      if (!r.ok) continue;
      const list = (await r.json()) as SvglEntry[];
      if (!Array.isArray(list) || !list.length) continue;
      const exact = list.find(e => e.title.toLowerCase() === queryName)
                 || list.find(e => e.title.toLowerCase() === norm);
      if (exact) return exact;
      if (!best) {
        // Tolerant: startsWith / contains the full normalized name
        best = list.find(e => e.title.toLowerCase().startsWith(queryName))
            || list.find(e => e.title.toLowerCase().includes(queryName))
            || null;
      }
    } catch { /* ignore */ }
  }
  return best;
}
    } catch { /* ignore */ }
  }
  return null;
}

async function fetchSvglAsset(entry: SvglEntry, lockup: "wordmark"|"icon"): Promise<{ svg: string; usedField: string } | null> {
  const candidates: Array<{ field: string; url: string|null }> = lockup === "wordmark"
    ? [
        { field: "wordmark", url: pickSvglUrl(entry.wordmark) },
        { field: "route", url: pickSvglUrl(entry.route) },
      ]
    : [
        { field: "route", url: pickSvglUrl(entry.route) },
        { field: "wordmark", url: pickSvglUrl(entry.wordmark) },
      ];
  for (const c of candidates) {
    if (!c.url) continue;
    try {
      const { bytes, ct } = await dl(c.url);
      const text = new TextDecoder().decode(bytes);
      if (!text.includes("<svg")) continue;
      if (!(ct?.includes("svg") || c.url.toLowerCase().endsWith(".svg"))) continue;
      if (!svgHasColor(text)) continue;
      return { svg: text, usedField: c.field };
    } catch { /* try next */ }
  }
  return null;
}

async function processRow(
  sb: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  lockups: ("wordmark"|"icon")[],
  dryRun: boolean,
  forceUpgrade: boolean,
) {
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];
  const actions: string[] = [];
  const issues: string[] = [];

  let svglEntry: SvglEntry | null | undefined = undefined;
  const getSvgl = async () => {
    if (svglEntry === undefined) svglEntry = await svglFind(row.name);
    return svglEntry;
  };

  for (const lockup of lockups) {
    const colorIdx = files.findIndex(f => f?.lockup===lockup && f?.variant==="color");
    const color = colorIdx >= 0 ? files[colorIdx] : null;
    const colorIsSvg = color ? (color.format === "svg" || color.url.toLowerCase().includes(".svg")) : false;

    // Audit existing color
    let auditOk = false;
    let auditNote = "";
    if (color) {
      try {
        const { bytes } = await dl(color.url);
        if (colorIsSvg) {
          const text = new TextDecoder().decode(bytes);
          auditOk = svgHasColor(text);
          if (!auditOk) auditNote = "svg-is-mono";
        } else {
          auditOk = await pngHasColor(bytes);
          if (!auditOk) auditNote = "raster-mostly-mono";
        }
      } catch (e) {
        auditNote = `dl-fail:${(e as Error).message}`;
      }
    } else {
      auditNote = "missing";
    }

    const shouldUpgrade = !color || !colorIsSvg || forceUpgrade || !auditOk;

    if (!shouldUpgrade) { issues.push(`${lockup}:ok-svg`); continue; }

    // Attempt SVG sourcing via svgl
    const entry = await getSvgl();
    if (!entry) {
      if (auditOk) issues.push(`${lockup}:ok-raster-no-svgl`);
      else issues.push(`${lockup}:no-svgl-match${auditNote ? `:${auditNote}` : ""}`);
      continue;
    }

    let asset: { svg: string; usedField: string } | null;
    try { asset = await fetchSvglAsset(entry, lockup); }
    catch (e) { issues.push(`${lockup}:svgl-err:${(e as Error).message}`); continue; }
    if (!asset) {
      if (auditOk) issues.push(`${lockup}:ok-raster-no-svgl-asset`);
      else issues.push(`${lockup}:svgl-no-asset${auditNote ? `:${auditNote}` : ""}`);
      continue;
    }

    if (dryRun) { actions.push(`would-upgrade:${lockup}-color.svg (svgl/${entry.title}/${asset.usedField})`); continue; }

    try {
      const path = `${slug}/${lockup}-color-svgl.svg`;
      const bytes = new TextEncoder().encode(asset.svg);
      const url = await uploadSign(sb, path, bytes, "image/svg+xml");
      const entryNew: FileEntry = { url, format: "svg", lockup, variant: "color", source: `svgl:${entry.title}:${asset.usedField}` };
      // remove existing color slot for this lockup
      for (let i = files.length - 1; i >= 0; i--) {
        if (files[i]?.lockup===lockup && files[i]?.variant==="color") files.splice(i, 1);
      }
      files.push(entryNew);
      actions.push(`upgraded:${lockup}-color.svg (svgl/${entry.title}/${asset.usedField}${auditNote?`,prev:${auditNote}`:""})`);
    } catch (e) {
      issues.push(`${lockup}:upload-err:${(e as Error).message}`);
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
    const forceUpgrade = body.forceUpgrade === true;
    const lockupArg = (body.lockup ?? "both") as "wordmark"|"icon"|"both";
    const lockups: ("wordmark"|"icon")[] = lockupArg === "both" ? ["wordmark","icon"] : [lockupArg];
    let q = sb.from("global_client_logos").select("id, name, files").order("name");
    if (Array.isArray(body.names) && body.names.length) q = q.in("name", body.names);
    const { data, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    let upgraded = 0, okCount = 0, errors = 0;
    for (const r of (data ?? [])) {
      try {
        const out = await processRow(sb, r as any, lockups, dryRun, forceUpgrade);
        if (out.actions?.length) upgraded++;
        else okCount++;
        if ((out as any).error) errors++;
        results.push(out);
      } catch (e) {
        errors++;
        results.push({ name: (r as any).name, error: (e as Error).message });
      }
    }
    console.log("audit-color-logos:summary", JSON.stringify({ processed: results.length, upgraded, okCount, errors }));
    return new Response(JSON.stringify({ ok:true, processed: results.length, upgraded, okCount, errors, results }),
      { headers: { ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json" } });
  }
});
