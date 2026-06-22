// Comprehensive logo audit + upgrade.
//
// Phase 1 (audit): For every file in global_client_logos, check quality:
//   - SVG: file size, parses, has <path|polygon|circle|rect, not a tiny favicon
//   - PNG/JPG: pixel dimensions >= 256w, decodes cleanly
//   - mono variants (black/white): color content must actually be mono
//
// Phase 2 (upgrade, opt-in via mode=upgrade): For every weak slot, discover
// better assets:
//   - Firecrawl map on the brand website filtered by "brand|press|media|logo|newsroom|assets"
//   - Scrape top candidates with formats=["branding","links"]
//   - Score links (svg > png; /logo/, /brand/ paths boosted; size from URL hints)
//   - Download best per lockup; if SVG, derive monochrome via CSS injection;
//     if raster, render high-res monochrome PNG via imagescript
//   - Merge into files JSONB, replacing ONLY weak slots, never overwriting good ones
//
// POST body:
//   { mode: "audit" | "upgrade", names?: string[], lockup?: "icon"|"wordmark"|"both",
//     limit?: number, force?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;
const TARGET_W = 2048;
const MIN_RASTER_W = 256;
const MIN_SVG_BYTES = 400;

type Variant = "color" | "black" | "white";
type Lockup = "wordmark" | "icon";
interface FileEntry {
  url: string;
  format?: string;
  lockup?: Lockup;
  source?: string;
  variant?: Variant;
}
interface Row { id: string; name: string; website_url: string | null; files: FileEntry[] }

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function extFromCT(ct: string | null, fb = "png") {
  if (!ct) return fb;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  return fb;
}

async function dl(url: string, timeoutMs = 15000): Promise<{ bytes: Uint8Array; ct: string | null }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LovableLogoBot/1.0" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { bytes, ct: res.headers.get("content-type") };
  } finally {
    clearTimeout(t);
  }
}

// --- audit helpers ----------------------------------------------------------

async function auditOne(f: FileEntry): Promise<{ ok: boolean; reasons: string[]; bytes?: Uint8Array }> {
  const reasons: string[] = [];
  if (!f?.url) return { ok: false, reasons: ["no-url"] };
  let bytes: Uint8Array;
  let ct: string | null;
  try {
    const r = await dl(f.url, 12000);
    bytes = r.bytes;
    ct = r.ct;
  } catch (e) {
    return { ok: false, reasons: [`unreachable:${(e as Error).message}`] };
  }
  const fmt = (f.format || extFromCT(ct, "png")).toLowerCase();

  if (fmt === "svg") {
    if (bytes.length < MIN_SVG_BYTES) reasons.push(`svg-tiny:${bytes.length}b`);
    const text = new TextDecoder().decode(bytes);
    if (!/<svg[\s>]/i.test(text)) reasons.push("not-svg");
    if (!/<(path|polygon|circle|rect|polyline|ellipse|g)\b/i.test(text)) reasons.push("svg-empty");
    // mono check on text content
    if (f.variant === "black" || f.variant === "white") {
      const wantWhite = f.variant === "white";
      const colors = (text.match(/(?:fill|stroke|stop-color)\s*=\s*"(#[0-9a-fA-F]{3,8}|[a-z]+)"/g) || []);
      for (const m of colors) {
        const v = m.match(/"([^"]+)"/)![1].toLowerCase();
        if (v === "none" || v === "transparent") continue;
        if (wantWhite && !(v === "#fff" || v === "#ffffff" || v === "white")) {
          reasons.push(`white-has-non-white:${v}`); break;
        }
        if (!wantWhite && !(v === "#000" || v === "#000000" || v === "black")) {
          reasons.push(`black-has-non-black:${v}`); break;
        }
      }
    }
  } else if (fmt === "png" || fmt === "jpg" || fmt === "jpeg" || fmt === "webp") {
    try {
      const img = await Image.decode(bytes);
      if (img.width < MIN_RASTER_W) reasons.push(`raster-small:${img.width}x${img.height}`);
      if (f.variant === "black" || f.variant === "white") {
        // sample mono correctness
        let bad = 0, sampled = 0;
        const want = f.variant === "white" ? 255 : 0;
        for (let y = 0; y < img.height; y += 8)
          for (let x = 0; x < img.width; x += 8) {
            const px = img.getPixelAt(x + 1, y + 1);
            const a = px & 0xff;
            if (a < 30) continue;
            sampled++;
            const r = (px >> 24) & 0xff, g = (px >> 16) & 0xff, b = (px >> 8) & 0xff;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            if (max - min > 30) { bad++; continue; }
            if (want === 255 && lum < 200) bad++;
            if (want === 0 && lum > 80) bad++;
          }
        if (sampled > 50 && bad / sampled > 0.15) reasons.push(`mono-bad:${Math.round(100*bad/sampled)}%`);
      }
    } catch (e) {
      reasons.push(`decode-fail:${(e as Error).message.slice(0, 40)}`);
    }
  } else {
    reasons.push(`unsupported-fmt:${fmt}`);
  }

  return { ok: reasons.length === 0, reasons, bytes };
}

// --- upgrade helpers --------------------------------------------------------

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "");
}

function monoSvg(svgText: string, color: "#000000" | "#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi, "");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi, "");
  const style = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function monoPng(srcBytes: Uint8Array, color: "black" | "white"): Promise<Uint8Array> {
  let img = await Image.decode(srcBytes);
  if (img.width < TARGET_W) {
    const scale = TARGET_W / img.width;
    img = img.resize(TARGET_W, Math.round(img.height * scale));
  }
  let opaque = 0, sampled = 0;
  for (let y = 0; y < img.height; y += 4)
    for (let x = 0; x < img.width; x += 4) {
      sampled++;
      if ((img.getPixelAt(x + 1, y + 1) & 0xff) > 250) opaque++;
    }
  const useLum = (opaque / sampled) > 0.95;
  const c = color === "black" ? 0 : 255;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      const px = img.getPixelAt(x + 1, y + 1);
      const pr = (px >> 24) & 0xff, pg = (px >> 16) & 0xff, pb = (px >> 8) & 0xff, pa = px & 0xff;
      const alpha = useLum
        ? Math.max(0, Math.min(255, Math.round(255 - (0.299 * pr + 0.587 * pg + 0.114 * pb))))
        : pa;
      img.setPixelAt(x + 1, y + 1, ((c << 24) | (c << 16) | (c << 8) | alpha) >>> 0);
    }
  return await img.encode();
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

// Firecrawl discovery: map domain -> branding-rich pages -> collect candidate logo URLs
async function discoverCandidates(websiteUrl: string, firecrawlKey: string): Promise<{ wordmark: string[]; icon: string[] }> {
  const wordmark: string[] = [];
  const icon: string[] = [];

  // 1) Map domain for brand/press pages
  let pages: string[] = [websiteUrl];
  try {
    const mapRes = await fetch("https://api.firecrawl.dev/v2/map", {
      method: "POST",
      headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: websiteUrl, search: "brand press media logo newsroom assets", limit: 25, includeSubdomains: true }),
    });
    const mj = await mapRes.json().catch(() => ({} as any));
    const links: string[] = mj?.links?.map((l: any) => typeof l === "string" ? l : l?.url).filter(Boolean) || [];
    const prioritized = links.filter((u: string) => /\/(brand|press|media|newsroom|logo|assets|about\/brand)/i.test(u)).slice(0, 4);
    pages = [...new Set([...prioritized, websiteUrl])].slice(0, 5);
  } catch (_) { /* fall back to homepage only */ }

  // 2) Scrape each with branding + links
  for (const pageUrl of pages) {
    try {
      const sRes = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: pageUrl, formats: ["branding", "links"], onlyMainContent: false }),
      });
      const sj = await sRes.json().catch(() => ({} as any));
      const b = sj?.data?.branding ?? sj?.branding ?? {};
      const allLinks: string[] = sj?.data?.links ?? sj?.links ?? [];
      if (b?.logo) wordmark.push(b.logo);
      if (b?.images?.logo) wordmark.push(b.images.logo);
      if (b?.symbol) icon.push(b.symbol);
      if (b?.icon) icon.push(b.icon);
      if (b?.images?.symbol) icon.push(b.images.symbol);
      if (b?.images?.icon) icon.push(b.images.icon);
      // Sniff direct logo links
      for (const l of allLinks) {
        if (typeof l !== "string") continue;
        if (!/\.(svg|png)(\?|$)/i.test(l)) continue;
        if (/sprite|icon-[\d]+|emoji|flag/i.test(l)) continue;
        if (/logo|brand|wordmark/i.test(l)) wordmark.push(l);
        if (/symbol|mark|favicon|app[-_]?icon/i.test(l)) icon.push(l);
      }
    } catch (_) { /* skip */ }
  }

  // Dedupe, prefer SVG first
  const dedupe = (arr: string[]) => {
    const seen = new Set<string>(); const out: string[] = [];
    const sorted = [...new Set(arr)].sort((a, b) => {
      const aSvg = /\.svg(\?|$)/i.test(a) ? 0 : 1;
      const bSvg = /\.svg(\?|$)/i.test(b) ? 0 : 1;
      return aSvg - bSvg;
    });
    for (const u of sorted) { if (!seen.has(u)) { seen.add(u); out.push(u); } }
    return out.slice(0, 5);
  };
  return { wordmark: dedupe(wordmark), icon: dedupe(icon) };
}

async function tryCandidates(candidates: string[]): Promise<{ bytes: Uint8Array; ct: string | null; url: string } | null> {
  for (const url of candidates) {
    try {
      const { bytes, ct } = await dl(url, 10000);
      if (bytes.length < 200) continue;
      const fmt = extFromCT(ct, "");
      if (fmt === "svg") {
        const txt = new TextDecoder().decode(bytes);
        if (!/<(path|polygon|circle|rect)/i.test(txt)) continue;
        return { bytes, ct, url };
      }
      // raster: must decode and be reasonable size
      try {
        const img = await Image.decode(bytes);
        if (img.width >= MIN_RASTER_W) return { bytes, ct, url };
      } catch (_) { continue; }
    } catch (_) { continue; }
  }
  return null;
}

interface SlotReport { lockup: Lockup; variant: Variant; ok: boolean; reasons: string[]; existing?: string }

async function auditRow(row: Row): Promise<{ slots: SlotReport[]; weak: { lockup: Lockup; variants: Variant[] }[] }> {
  const slots: SlotReport[] = [];
  const lockups: Lockup[] = ["wordmark", "icon"];
  const variants: Variant[] = ["color", "black", "white"];
  for (const lk of lockups) {
    for (const vr of variants) {
      const f = row.files.find(x => x.lockup === lk && x.variant === vr);
      if (!f) { slots.push({ lockup: lk, variant: vr, ok: false, reasons: ["missing"] }); continue; }
      const a = await auditOne(f);
      slots.push({ lockup: lk, variant: vr, ok: a.ok, reasons: a.reasons, existing: f.url });
    }
  }
  // group weak by lockup
  const byLk: Record<Lockup, Variant[]> = { wordmark: [], icon: [] };
  for (const s of slots) if (!s.ok) byLk[s.lockup].push(s.variant);
  const weak = lockups.filter(lk => byLk[lk].length > 0).map(lk => ({ lockup: lk, variants: byLk[lk] }));
  return { slots, weak };
}

async function upgradeRow(
  supabase: ReturnType<typeof createClient>,
  row: Row,
  firecrawlKey: string,
  lockupFilter: "icon" | "wordmark" | "both",
  force: boolean,
) {
  const actions: string[] = [];
  if (!row.website_url) return { name: row.name, skipped: "no-website" };

  const audit = await auditRow(row);
  if (!force && audit.weak.length === 0) {
    return { name: row.name, status: "all-good", slots: audit.slots };
  }
  const targets = audit.weak.filter(w => lockupFilter === "both" || lockupFilter === w.lockup);
  if (targets.length === 0) return { name: row.name, status: "no-target-lockups", slots: audit.slots };

  const slug = slugify(row.name);
  const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];
  const upsert = (e: FileEntry) => {
    const i = files.findIndex(f => f?.lockup === e.lockup && f?.variant === e.variant);
    if (i >= 0) files[i] = e; else files.push(e);
  };

  let candidates: { wordmark: string[]; icon: string[] };
  try {
    candidates = await discoverCandidates(row.website_url, firecrawlKey);
  } catch (e) {
    return { name: row.name, error: `discover: ${(e as Error).message}`, slots: audit.slots };
  }
  actions.push(`candidates:w=${candidates.wordmark.length},i=${candidates.icon.length}`);

  for (const t of targets) {
    const pool = t.lockup === "wordmark" ? candidates.wordmark : candidates.icon;
    if (pool.length === 0) { actions.push(`${t.lockup}:no-candidates`); continue; }
    const picked = await tryCandidates(pool);
    if (!picked) { actions.push(`${t.lockup}:all-failed`); continue; }
    const ext = extFromCT(picked.ct, "png");

    // If this lockup's color slot is weak OR doesn't exist OR force, replace color
    const colorWeak = audit.slots.find(s => s.lockup === t.lockup && s.variant === "color" && !s.ok);
    if (colorWeak || force) {
      try {
        const url = await uploadSign(supabase, `${slug}/${t.lockup}-color-v4.${ext}`, picked.bytes, picked.ct ?? `image/${ext}`);
        upsert({ url, format: ext, lockup: t.lockup, variant: "color", source: "firecrawl-brandkit" });
        actions.push(`${t.lockup}-color:upgraded(${ext})`);
      } catch (e) { actions.push(`${t.lockup}-color-err:${(e as Error).message.slice(0,30)}`); }
    }
    // Mono variants
    for (const vr of t.variants) {
      if (vr === "color") continue;
      try {
        if (ext === "svg") {
          const txt = new TextDecoder().decode(picked.bytes);
          const monoBytes = new TextEncoder().encode(monoSvg(txt, vr === "black" ? "#000000" : "#ffffff"));
          const url = await uploadSign(supabase, `${slug}/${t.lockup}-${vr}-v4.svg`, monoBytes, "image/svg+xml");
          upsert({ url, format: "svg", lockup: t.lockup, variant: vr, source: "firecrawl-brandkit" });
          actions.push(`${t.lockup}-${vr}:svg-mono`);
        } else {
          const monoBytes = await monoPng(picked.bytes, vr === "black" ? "black" : "white");
          const url = await uploadSign(supabase, `${slug}/${t.lockup}-${vr}-v4.png`, monoBytes, "image/png");
          upsert({ url, format: "png", lockup: t.lockup, variant: vr, source: "firecrawl-brandkit-mono" });
          actions.push(`${t.lockup}-${vr}:png-mono(${Math.round(monoBytes.length/1024)}KB)`);
        }
      } catch (e) { actions.push(`${t.lockup}-${vr}-err:${(e as Error).message.slice(0,30)}`); }
    }
  }

  const wroteAny = actions.some(a => /upgraded|mono/.test(a));
  if (wroteAny) {
    const { error } = await supabase.from("global_client_logos")
      .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return { name: row.name, actions, error: error.message, slots: audit.slots };
  }
  return { name: row.name, actions, slots: audit.slots };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const body = await req.json().catch(() => ({} as any));
    const mode = (body.mode ?? "audit") as "audit" | "upgrade";
    const names: string[] | null = Array.isArray(body.names) && body.names.length ? body.names : null;
    const lockup = (body.lockup ?? "both") as "icon" | "wordmark" | "both";
    const limit = typeof body.limit === "number" ? body.limit : 999;
    const force = body.force === true;

    if (mode === "upgrade" && !firecrawlKey) throw new Error("FIRECRAWL_API_KEY missing");

    let q = supabase.from("global_client_logos").select("id, name, website_url, files").order("name");
    if (names) q = q.in("name", names);
    const { data, error } = await q;
    if (error) throw error;

    const rows = ((data ?? []) as any[]).slice(0, limit);
    const results: any[] = [];
    let weakCount = 0;
    for (const r of rows) {
      try {
        const row = { ...r, files: Array.isArray(r.files) ? r.files : [] } as Row;
        if (mode === "audit") {
          const a = await auditRow(row);
          const weakSlots = a.slots.filter(s => !s.ok);
          if (weakSlots.length) weakCount++;
          results.push({ name: row.name, weak: weakSlots.map(s => `${s.lockup}-${s.variant}:${s.reasons.join(",")}`), ok: weakSlots.length === 0 });
        } else {
          results.push(await upgradeRow(supabase, row, firecrawlKey!, lockup, force));
        }
      } catch (e) {
        results.push({ name: (r as any).name, error: (e as Error).message });
      }
    }
    return new Response(JSON.stringify({ ok: true, mode, processed: results.length, weakRows: weakCount, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
