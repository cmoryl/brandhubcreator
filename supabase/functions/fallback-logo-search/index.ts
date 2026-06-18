// Fallback logo fetcher: searches Wikimedia Commons (and optionally
// worldvectorlogo / seeklogo direct guesses) for brand SVG logos when the
// brand's own site refuses our user-agent or fails. Derives true monochrome
// black/white SVGs from the color SVG and uploads to global-logos bucket.
//
// POST body: { names: string[], dryRun?: boolean, lockup?: "wordmark"|"icon" }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;
const UA = "LovableLogoBot/1.0 (https://lovable.dev; contact: support@lovable.dev)";

interface FileEntry {
  url: string; format?: string; lockup?: "wordmark"|"icon";
  source?: string; variant?: "color"|"black"|"white";
}

interface DomainAttempt {
  domain: string;
  url: string;
  ok: boolean;
  status?: number;
  ms: number;
  bytes?: number;
  errorType?: "tls" | "network" | "timeout" | "http" | "parse" | "empty";
  errorMessage?: string;
}

interface BrandMetrics {
  name: string;
  startedAt: string;
  totalMs: number;
  attempts: DomainAttempt[];
  candidates: Array<{ title: string; score: number; chosen: boolean }>;
  picked?: { title: string; url: string; domain: string; score: number; confidence: "high"|"medium"|"low" };
  outcome: "matched" | "no-match" | "error";
  error?: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function classifyError(err: unknown): { type: DomainAttempt["errorType"]; message: string } {
  const msg = (err instanceof Error ? err.message : String(err)) || "unknown";
  const m = msg.toLowerCase();
  if (m.includes("tls") || m.includes("certificate") || m.includes("ssl") || m.includes("handshake")) return { type: "tls", message: msg };
  if (m.includes("timeout") || m.includes("timed out")) return { type: "timeout", message: msg };
  if (m.includes("dns") || m.includes("connection") || m.includes("network") || m.includes("refused") || m.includes("reset") || m.includes("unreachable") || m.includes("http2")) return { type: "network", message: msg };
  return { type: "network", message: msg };
}

async function trackedFetch(url: string, attempts: DomainAttempt[], init?: RequestInit): Promise<Response | null> {
  const domain = (() => { try { return new URL(url).hostname; } catch { return "?"; } })();
  const t0 = performance.now();
  try {
    const r = await fetch(url, init);
    const ms = Math.round(performance.now() - t0);
    const attempt: DomainAttempt = { domain, url, ok: r.ok, status: r.status, ms };
    if (!r.ok) { attempt.errorType = "http"; attempt.errorMessage = `HTTP ${r.status}`; }
    attempts.push(attempt);
    return r;
  } catch (e) {
    const ms = Math.round(performance.now() - t0);
    const { type, message } = classifyError(e);
    attempts.push({ domain, url, ok: false, ms, errorType: type, errorMessage: message });
    return null;
  }
}

function sanitizeSvg(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi,"")
          .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi,"")
          .replace(/\son\w+=["'][^"']*["']/gi,"");
}

function monoSvg(svgText: string, color: "#000000"|"#ffffff") {
  let s = sanitizeSvg(svgText);
  s = s.replace(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi, "");
  s = s.replace(/url\(#[^)]+\)/gi, color);
  s = s.replace(/\sfill="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/\sstroke="(?!none|transparent)[^"]*"/gi,"");
  s = s.replace(/fill\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  s = s.replace(/stroke\s*:\s*(?!none|transparent)[^;"']+/gi,"");
  const style = `<style>*{fill:${color} !important;color:${color} !important}[fill="none"],[fill="transparent"]{fill:none!important}[stroke]:not([stroke="none"]):not([stroke="transparent"]){stroke:${color}!important}</style>`;
  return s.replace(/<svg([^>]*)>/i, `<svg$1>${style}`);
}

async function uploadSign(supabase: ReturnType<typeof createClient>, path: string, bytes: Uint8Array, ct: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ct, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (e2 || !data) throw new Error(`sign: ${e2?.message}`);
  return data.signedUrl;
}

async function commonsSearch(brand: string, attempts: DomainAttempt[]): Promise<string[]> {
  const queries = [
    `${brand} logo filetype:svg`,
    `${brand} wordmark filetype:svg`,
    `${brand} logo.svg`,
  ];
  const titles: string[] = [];
  for (const q of queries) {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(q)}`;
    const r = await trackedFetch(u, attempts, { headers: { "User-Agent": UA, "Accept":"application/json" } });
    if (!r || !r.ok) continue;
    const j: any = await r.json().catch(()=>({}));
    for (const hit of (j?.query?.search ?? [])) {
      if (typeof hit.title === "string" && hit.title.toLowerCase().endsWith(".svg")) {
        if (!titles.includes(hit.title)) titles.push(hit.title);
      }
    }
    if (titles.length) break;
  }
  return titles;
}

async function commonsFileUrl(title: string, attempts: DomainAttempt[]): Promise<string|null> {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|mime|size&titles=${encodeURIComponent(title)}`;
  const r = await trackedFetch(u, attempts, { headers: { "User-Agent": UA, "Accept":"application/json" } });
  if (!r || !r.ok) return null;
  const j: any = await r.json().catch(()=>({}));
  const pages = j?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    const ii = pages[k]?.imageinfo?.[0];
    if (ii?.url && (ii?.mime?.includes("svg") || ii.url.toLowerCase().endsWith(".svg"))) {
      return ii.url as string;
    }
  }
  return null;
}

function scoreTitle(title: string, brand: string): number {
  const t = title.toLowerCase();
  const b = brand.toLowerCase();
  let s = 0;
  if (t.includes(b)) s += 5;
  if (/logo\.svg$/.test(t)) s += 4;
  if (/wordmark/.test(t)) s += 2;
  if (/(old|historical|former|1[09]\d{2}|20\d{2}|alternative|variant|small|tiny|outline)/.test(t)) s -= 3;
  if (/(country|flag|map)/.test(t)) s -= 5;
  s -= Math.min(3, Math.floor(t.length / 40));
  return s;
}

function confidenceFor(score: number): "high"|"medium"|"low" {
  if (score >= 7) return "high";
  if (score >= 3) return "medium";
  return "low";
}

async function pickBestSvg(
  brand: string,
  attempts: DomainAttempt[],
  candidates: BrandMetrics["candidates"],
  override?: string,
): Promise<{ title: string; url: string; bytes: Uint8Array; score: number } | null> {
  let scored: Array<{ t: string; s: number }>;
  if (override) {
    const t = override.startsWith("File:") ? override : `File:${override}`;
    scored = [{ t, s: 10 }];
  } else {
    const titles = await commonsSearch(brand, attempts);
    if (!titles.length) return null;
    scored = titles.map(t => ({ t, s: scoreTitle(t, brand) }))
                   .sort((a,b) => b.s - a.s)
                   .slice(0, 4);
  }
  for (const { t, s } of scored) candidates.push({ title: t, score: s, chosen: false });
  for (const { t, s } of scored) {
    try {
      const url = await commonsFileUrl(t, attempts);
      if (!url) continue;
      const r = await trackedFetch(url, attempts, { headers: { "User-Agent": UA } });
      if (!r || !r.ok) continue;
      const buf = new Uint8Array(await r.arrayBuffer());
      const last = attempts[attempts.length - 1];
      if (last) last.bytes = buf.length;
      if (buf.length < 300) { if (last) { last.ok = false; last.errorType = "empty"; last.errorMessage = "body<300B"; } continue; }
      const head = new TextDecoder().decode(buf.slice(0, 200)).toLowerCase();
      if (!head.includes("<svg") && !head.includes("<?xml")) { if (last) { last.ok = false; last.errorType = "parse"; last.errorMessage = "not-svg"; } continue; }
      const chosen = candidates.find(c => c.title === t);
      if (chosen) chosen.chosen = true;
      return { title: t, url, bytes: buf, score: s };
    } catch (_) { /* try next */ }
  }
  return null;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; name: string; files: FileEntry[] },
  lockup: "wordmark"|"icon",
  dryRun: boolean,
  override?: string,
): Promise<BrandMetrics & { actions?: string[] }> {
  const metrics: BrandMetrics = {
    name: row.name,
    startedAt: new Date().toISOString(),
    totalMs: 0,
    attempts: [],
    candidates: [],
    outcome: "no-match",
  };
  const t0 = performance.now();
  const actions: string[] = [];
  try {
    const slug = slugify(row.name);
    const files: FileEntry[] = Array.isArray(row.files) ? [...row.files] : [];

    const pick = await pickBestSvg(row.name, metrics.attempts, metrics.candidates, override);
    if (!pick) {
      metrics.totalMs = Math.round(performance.now() - t0);
      console.log("fallback-logo-search", JSON.stringify(metrics));
      return metrics;
    }
    const domain = (()=>{ try { return new URL(pick.url).hostname; } catch { return "?"; } })();
    metrics.picked = { title: pick.title, url: pick.url, domain, score: pick.score, confidence: confidenceFor(pick.score) };
    actions.push(`commons:${pick.title}`);

    const upsert = (e: FileEntry) => {
      const i = files.findIndex(f => f?.lockup===e.lockup && f?.variant===e.variant);
      if (i>=0) files[i]=e; else files.push(e);
    };

    const svgText = new TextDecoder().decode(pick.bytes);
    const colorBytes = new TextEncoder().encode(sanitizeSvg(svgText));
    const blackBytes = new TextEncoder().encode(monoSvg(svgText, "#000000"));
    const whiteBytes = new TextEncoder().encode(monoSvg(svgText, "#ffffff"));

    if (!dryRun) {
      const colorUrl = await uploadSign(supabase, `${slug}/${lockup}-color.svg`, colorBytes, "image/svg+xml");
      const blackUrl = await uploadSign(supabase, `${slug}/${lockup}-black.svg`, blackBytes, "image/svg+xml");
      const whiteUrl = await uploadSign(supabase, `${slug}/${lockup}-white.svg`, whiteBytes, "image/svg+xml");
      upsert({ url: colorUrl, format:"svg", lockup, variant:"color", source:"wikimedia-commons" });
      upsert({ url: blackUrl, format:"svg", lockup, variant:"black", source:"wikimedia-commons" });
      upsert({ url: whiteUrl, format:"svg", lockup, variant:"white", source:"wikimedia-commons" });
      const { error } = await supabase.from("global_client_logos")
        .update({ files, updated_at: new Date().toISOString() }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    actions.push(`wrote:${lockup}-color/black/white.svg`);
    metrics.outcome = "matched";
  } catch (e) {
    metrics.outcome = "error";
    metrics.error = (e as Error).message;
  } finally {
    metrics.totalMs = Math.round(performance.now() - t0);
    console.log("fallback-logo-search", JSON.stringify(metrics));
  }
  return { ...metrics, actions };
}

function aggregate(results: BrandMetrics[]) {
  const domains: Record<string, { attempts: number; ok: number; failed: number; httpErrors: number; tlsErrors: number; networkErrors: number; avgMs: number; }> = {};
  let totalAttempts = 0, totalMs = 0;
  const outcomes = { matched: 0, "no-match": 0, error: 0 };
  const confidence = { high: 0, medium: 0, low: 0 };
  for (const r of results) {
    outcomes[r.outcome]++;
    if (r.picked) confidence[r.picked.confidence]++;
    for (const a of r.attempts) {
      totalAttempts++;
      const d = (domains[a.domain] ||= { attempts:0, ok:0, failed:0, httpErrors:0, tlsErrors:0, networkErrors:0, avgMs:0 });
      d.attempts++; d.avgMs += a.ms;
      if (a.ok) d.ok++; else {
        d.failed++;
        if (a.errorType === "http") d.httpErrors++;
        else if (a.errorType === "tls") d.tlsErrors++;
        else if (a.errorType === "network" || a.errorType === "timeout") d.networkErrors++;
      }
      totalMs += a.ms;
    }
  }
  for (const d of Object.values(domains)) d.avgMs = Math.round(d.avgMs / Math.max(1, d.attempts));
  return { outcomes, confidence, totalAttempts, totalMs, domains };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const runStartedAt = new Date().toISOString();
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(()=>({} as any));
    const names: string[] = Array.isArray(body.names) ? body.names : [];
    if (!names.length) throw new Error("names required");
    const dryRun = body.dryRun === true;
    const lockup = (body.lockup ?? "wordmark") as "wordmark"|"icon";
    const overrides: Record<string,string> = (body.overrides && typeof body.overrides === "object") ? body.overrides : {};

    const { data, error } = await supabase
      .from("global_client_logos").select("id, name, files").in("name", names);
    if (error) throw error;

    const results: BrandMetrics[] = [];
    for (const r of (data ?? [])) {
      const row = r as any;
      results.push(await processOne(supabase, row, lockup, dryRun, overrides[row.name]));
    }
    const metrics = aggregate(results);
    console.log("fallback-logo-search:summary", JSON.stringify({ runStartedAt, processed: results.length, ...metrics }));
    return new Response(JSON.stringify({ ok:true, processed: results.length, results, metrics }),
      { headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  } catch (e) {
    console.log("fallback-logo-search:error", JSON.stringify({ runStartedAt, error: (e as Error).message }));
    return new Response(JSON.stringify({ ok:false, error:(e as Error).message }),
      { status:500, headers:{ ...corsHeaders, "Content-Type":"application/json" } });
  }
});
