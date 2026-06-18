// Audit + derive: for every brand, if any color SVG exists for a lockup
// (icon or wordmark), generate true monochrome black & white SVGs from it
// and replace any non-SVG / weak / missing B/W variant. This is the
// "upgrade everything we already have an SVG for" pass — no Firecrawl,
// no network beyond fetching our own bucket and re-uploading.
//
// POST body: { names?: string[], dryRun?: boolean, force?: boolean }
//   names  – limit to these brand names
//   dryRun – plan only, no writes
//   force  – overwrite B/W even if already SVG (use after monoSvg changes)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}

// Is this fill value "white-ish"? Such shapes are typically cutouts/negative
// space in chunky color logos (Amex letters, LEGO inner blocks, etc.) and
// must remain transparent in monochrome — otherwise the holes fill in and
// the mark becomes an unreadable blob.
function isWhiteish(v: string): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase().replace(/\s+/g, "");
  if (t === "white" || t === "#fff" || t === "#ffffff") return true;
  let m = t.match(/^#([0-9a-f]{6})$/);
  if (m) {
    const n = parseInt(m[1], 16);
    return ((n>>16)&0xff) > 240 && ((n>>8)&0xff) > 240 && (n&0xff) > 240;
  }
  m = t.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const ex = m[1].split("").map(c => c+c).join("");
    const n = parseInt(ex, 16);
    return ((n>>16)&0xff) > 240 && ((n>>8)&0xff) > 240 && (n&0xff) > 240;
  }
  m = t.match(/^rgba?\((\d+),(\d+),(\d+)/);
  if (m) return +m[1] > 240 && +m[2] > 240 && +m[3] > 240;
  if (t.startsWith("hsl")) {
    const hm = t.match(/^hsla?\(\s*[^,]+,\s*[^,]+,\s*(\d+(?:\.\d+)?)%/);
    if (hm) return parseFloat(hm[1]) > 94;
  }
  return false;
}

// Walk every tag and mark shapes whose fill (attr or style) is white as
// cutouts via data-mono-cutout="1". CSS below renders those as transparent
// so holes stay holes for both black and white variants.
function tagCutouts(svg: string): string {
  return svg.replace(/<([a-zA-Z][\w:-]*)\b([^/>]*)(\/?)>/g, (_full, name, attrs, slash) => {
    let cutout = false;
    const fAttr = attrs.match(/\sfill\s*=\s*"([^"]*)"/i);
    if (fAttr && isWhiteish(fAttr[1])) cutout = true;
    if (!cutout) {
      const sAttr = attrs.match(/\sstyle\s*=\s*"([^"]*)"/i);
      if (sAttr) {
        const fm = sAttr[1].match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i);
        if (fm && isWhiteish(fm[1])) cutout = true;
      }
    }
    return cutout
      ? `<${name}${attrs} data-mono-cutout="1"${slash}>`
      : `<${name}${attrs}${slash}>`;
  });
}

function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi, "");
  s = s.replace(/<image\b[\s\S]*?>/gi, "");
  // Tag white-filled shapes as cutouts BEFORE we strip fill attributes.
  s = tagCutouts(s);
  s = s.replace(/\sstyle="[^"]*fill\s*:\s*none[^"]*stroke\s*:\s*(?!none|transparent)[^"]*"/gi, ' fill="none" data-mono-stroke="1"');
  s = s.replace(/\sstyle="[^"]*stroke\s*:\s*(?!none|transparent)[^"]*fill\s*:\s*none[^"]*"/gi, ' fill="none" data-mono-stroke="1"');
  s = s.replace(/\sstyle="[^"]*"/gi, "");
  s = s.replace(/\sclass="[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, ' data-mono-stroke="1"');
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\s(?:stop-color|flood-color|lighting-color|color)="[^"]*"/gi, "");
  s = s.replace(/<\s*(line|polyline)\b(?![^>]*data-mono-stroke)/gi, '<$1 data-mono-stroke="1"');
  const style = `<style>`
    + `svg,svg *{color:${color}!important;fill:${color}!important}`
    + `svg [fill="none"],svg [fill="transparent"]{fill:none!important}`
    // Cutouts must paint transparent and NOT inherit the ink stroke.
    + `svg [data-mono-cutout="1"]{fill:transparent!important;stroke:none!important}`
    + `svg [data-mono-stroke]:not([data-mono-cutout="1"]),`
    + `svg [stroke]:not([stroke="none"]):not([stroke="transparent"]):not([data-mono-cutout="1"]){stroke:${color}!important}`
    + `</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function dl(url: string): Promise<Uint8Array> {
  const r = await fetch(url, { headers:{ "User-Agent":"LovableLogoBot/1.0" }, redirect:"follow" });
  if (!r.ok) throw new Error(`dl ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType:"image/svg+xml", upsert:true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  dryRun: boolean,
  force: boolean,
) {
  const actions: string[] = [];
  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

  const find = (lockup: "wordmark"|"icon", variant: "color"|"black"|"white") =>
    files.find(f => f?.lockup===lockup && f?.variant===variant);
  const upsert = (e: FileEntry) => {
    const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
    if (i>=0) files[i]=e; else files.push(e);
  };

  for (const lockup of ["wordmark","icon"] as const) {
    const color = find(lockup, "color");
    if (!color || color.format !== "svg") continue;
    for (const v of ["black","white"] as const) {
      const existing = find(lockup, v);
      const ok = existing && existing.format === "svg" && !force;
      if (ok) continue;
      try {
        const srcBytes = await dl(color.url);
        const text = new TextDecoder().decode(srcBytes);
        const mono = monoSvg(text, v === "black" ? "#000000" : "#ffffff");
        const bytes = new TextEncoder().encode(mono);
        const path = `${slug}/${lockup}-${v}.svg`;
        const url = dryRun ? "(dry)" : await uploadSign(supabase, path, bytes);
        if (!dryRun) upsert({ url, format:"svg", lockup, variant:v, source:"derived-from-color-svg" });
        actions.push(`${lockup}-${v}.svg ${existing ? `replaced(${existing.format})` : "added"}`);
      } catch (e) {
        actions.push(`${lockup}-${v}.svg error: ${(e as Error).message}`);
      }
    }
  }

  if (!dryRun && actions.some(a => !a.includes("error"))) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, actions, error: error.message };
  }
  return { name: row.name, actions };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const names: string[]|null = Array.isArray(body.names) && body.names.length ? body.names : null;
    const dryRun = body.dryRun === true;
    const force = body.force === true;

    let q = supabase.from("global_client_logos").select("id, name, files").order("name");
    if (names) q = q.in("name", names);
    const { data, error } = await q;
    if (error) throw error;

    const results: any[] = [];
    let touched = 0;
    for (const r of (data ?? [])) {
      const res = await processOne(supabase, r as any, dryRun, force);
      if (res.actions && res.actions.length) touched++;
      results.push(res);
    }
    const summary = {
      total: results.length,
      touched,
      withChanges: results.filter(r => (r.actions ?? []).some((a:string)=>!a.includes("error"))).length,
    };
    return new Response(JSON.stringify({ ok:true, summary, results },null,2),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
