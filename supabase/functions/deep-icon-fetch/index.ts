// Deep icon fetcher: tries multiple strategies to find a high-res brand icon
// for a given website. Returns ranked candidates; optionally commits the best
// to global_client_logos via the commit-brand-logos function.
//
// POST body: {
//   website_url: string,
//   logo_id?: string,           // if provided + commit=true, attach to this row
//   organization_id?: string,   // required if commit=true and logo_id missing
//   name?: string,              // required if commit=true and logo_id missing
//   commit?: boolean,           // default false: just return candidates
// }
//
// Strategies (in order):
//   1. Parse HTML <link rel="icon|apple-touch-icon|mask-icon"> (all sizes)
//   2. Parse <link rel="manifest"> -> icons[]
//   3. Probe common static paths (/apple-touch-icon-*.png, /favicon-*.png, /favicon.svg, /favicon.ico, /static/...)
//   4. Probe og:image / twitter:image from meta tags
//
// Each candidate is fetched HEAD-style, validated (size, content-type) and
// ranked by (declared size desc, format preference svg>png>ico, source priority).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UA_POOL = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
];

const COMMON_PATHS = [
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-167x167.png",
  "/apple-touch-icon-120x120.png",
  "/favicon.svg",
  "/favicon-512x512.png",
  "/favicon-256x256.png",
  "/favicon-192x192.png",
  "/favicon-180x180.png",
  "/favicon-96x96.png",
  "/favicon-64x64.png",
  "/favicon-32x32.png",
  "/favicon.ico",
  "/static/favicon.svg",
  "/static/favicon.png",
  "/static/images/favicon.svg",
  "/static/images/favicon.png",
  "/static/images/apple-touch-icon.png",
  "/assets/favicon.svg",
  "/assets/favicon.png",
  "/assets/apple-touch-icon.png",
  "/assets/images/favicon.svg",
  "/assets/images/favicon.png",
  "/images/favicon.svg",
  "/images/favicon.png",
  "/images/apple-touch-icon.png",
  "/wp-content/themes/favicon.png",
  "/site-icon.png",
];

interface Candidate {
  url: string;
  source: string; // "html-link" | "manifest" | "common-path" | "og-image"
  format?: string;
  declaredSize?: number; // px (max of width/height)
  bytes?: number;
  contentType?: string;
  score?: number;
}

function absUrl(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function extOf(u: string): string | undefined {
  try {
    const m = new URL(u).pathname.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

function parseSizes(s?: string | null): number {
  if (!s) return 0;
  const m = s.match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return 0;
  return Math.max(parseInt(m[1], 10), parseInt(m[2], 10));
}

async function fetchWithUA(url: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const ua = UA_POOL[attempt % UA_POOL.length];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/json,image/*,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url: string): Promise<{ ok: boolean; body: string; finalUrl: string }> {
  for (let i = 0; i < UA_POOL.length; i++) {
    try {
      const res = await fetchWithUA(url, {}, i);
      if (res.ok) {
        const body = await res.text();
        return { ok: true, body, finalUrl: res.url };
      }
      if (res.status !== 403 && res.status !== 429) break;
    } catch {
      // try next UA
    }
  }
  return { ok: false, body: "", finalUrl: url };
}

function extractFromHtml(html: string, baseUrl: string): Candidate[] {
  const out: Candidate[] = [];

  const linkRe = /<link\b[^>]*>/gi;
  for (const tag of html.match(linkRe) ?? []) {
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!/icon|apple-touch-icon|mask-icon|shortcut/i.test(rel)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const sizes = tag.match(/\bsizes\s*=\s*["']([^"']+)["']/i)?.[1];
    const abs = absUrl(href, baseUrl);
    if (!abs) continue;
    out.push({
      url: abs,
      source: "html-link",
      format: extOf(abs),
      declaredSize: parseSizes(sizes),
    });
  }

  // og:image / twitter:image as a last resort
  const metaRe = /<meta\b[^>]*>/gi;
  for (const tag of html.match(metaRe) ?? []) {
    const prop =
      tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (prop !== "og:image" && prop !== "twitter:image") continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!content) continue;
    const abs = absUrl(content, baseUrl);
    if (!abs) continue;
    out.push({ url: abs, source: "og-image", format: extOf(abs) });
  }

  // <link rel="manifest"> URL extraction (handled separately)
  return out;
}

async function extractFromManifest(html: string, baseUrl: string): Promise<Candidate[]> {
  const manifestMatch = html.match(
    /<link\b[^>]*rel\s*=\s*["']manifest["'][^>]*href\s*=\s*["']([^"']+)["']/i,
  );
  if (!manifestMatch) return [];
  const manifestUrl = absUrl(manifestMatch[1], baseUrl);
  if (!manifestUrl) return [];

  try {
    const res = await fetchWithUA(manifestUrl);
    if (!res.ok) return [];
    const json = await res.json();
    const icons: any[] = Array.isArray(json?.icons) ? json.icons : [];
    return icons
      .map((ic): Candidate | null => {
        const src = typeof ic?.src === "string" ? absUrl(ic.src, manifestUrl) : null;
        if (!src) return null;
        return {
          url: src,
          source: "manifest",
          format: extOf(src),
          declaredSize: parseSizes(ic?.sizes),
        };
      })
      .filter(Boolean) as Candidate[];
  } catch {
    return [];
  }
}

async function probeCommonPaths(origin: string): Promise<Candidate[]> {
  const out: Candidate[] = [];
  // Run in parallel
  const checks = COMMON_PATHS.map(async (p) => {
    const url = origin + p;
    try {
      const res = await fetchWithUA(url, { method: "GET" });
      if (!res.ok) return null;
      const ct = res.headers.get("content-type") ?? "";
      if (!/image|octet-stream/i.test(ct)) return null;
      const len = parseInt(res.headers.get("content-length") ?? "0", 10) || undefined;
      // declared size from filename (e.g. -180x180)
      const sizeMatch = p.match(/(\d+)x\d+/);
      return {
        url,
        source: "common-path",
        format: extOf(url),
        contentType: ct,
        bytes: len,
        declaredSize: sizeMatch ? parseInt(sizeMatch[1], 10) : 0,
      } as Candidate;
    } catch {
      return null;
    }
  });
  for (const r of await Promise.all(checks)) if (r) out.push(r);
  return out;
}

async function validateCandidate(c: Candidate): Promise<Candidate | null> {
  try {
    const res = await fetchWithUA(c.url, { method: "GET" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/image|octet-stream|svg/i.test(ct)) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length < 200) return null;
    return { ...c, bytes: buf.length, contentType: ct, format: c.format ?? extOf(c.url) };
  } catch {
    return null;
  }
}

function scoreCandidate(c: Candidate): number {
  let s = 0;
  // format preference
  const fmt = (c.format ?? "").toLowerCase();
  if (fmt === "svg") s += 1000;
  else if (fmt === "png") s += 500;
  else if (fmt === "webp") s += 400;
  else if (fmt === "jpg" || fmt === "jpeg") s += 200;
  else if (fmt === "ico") s += 50;
  // declared size
  s += Math.min(c.declaredSize ?? 0, 1024);
  // bytes (proxy for resolution)
  s += Math.min((c.bytes ?? 0) / 100, 500);
  // source priority
  if (c.source === "manifest") s += 100;
  else if (c.source === "html-link") s += 80;
  else if (c.source === "common-path") s += 60;
  else if (c.source === "og-image") s += 20;
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      website_url,
      commit = false,
      logo_id,
      organization_id,
      name,
    } = body as {
      website_url: string;
      commit?: boolean;
      logo_id?: string;
      organization_id?: string;
      name?: string;
    };

    if (!website_url) {
      return new Response(JSON.stringify({ ok: false, error: "website_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const u = new URL(website_url);
    const origin = `${u.protocol}//${u.host}`;

    // 1+2: HTML link & manifest
    const homepage = await fetchText(origin + "/");
    const htmlCands = homepage.ok ? extractFromHtml(homepage.body, homepage.finalUrl) : [];
    const manifestCands = homepage.ok
      ? await extractFromManifest(homepage.body, homepage.finalUrl)
      : [];

    // 3: common paths
    const commonCands = await probeCommonPaths(origin);

    // Dedupe by URL, prefer richer entry
    const map = new Map<string, Candidate>();
    for (const c of [...htmlCands, ...manifestCands, ...commonCands]) {
      const existing = map.get(c.url);
      if (!existing) map.set(c.url, c);
      else {
        map.set(c.url, {
          ...existing,
          declaredSize: Math.max(existing.declaredSize ?? 0, c.declaredSize ?? 0),
          source: existing.source === "common-path" ? c.source : existing.source,
        });
      }
    }

    // Validate (parallel, capped)
    const list = [...map.values()];
    const validated: Candidate[] = [];
    const BATCH = 8;
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(validateCandidate));
      for (const r of results) if (r) validated.push(r);
    }
    for (const c of validated) c.score = scoreCandidate(c);
    validated.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    let commitResult: any = null;
    if (commit && validated.length) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const best = validated[0];
      const projectRef = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/([^.]+)/)?.[1];
      const commitRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/commit-brand-logos`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
          },
          body: JSON.stringify({
            organization_id,
            name,
            category: "Legal",
            website_url,
            logo_id,
            selections: [{ url: best.url, lockup: "icon", variant: "color" }],
          }),
        },
      );
      commitResult = await commitRes.json().catch(() => ({ ok: false }));
      void projectRef;

      // Auto-derive black & white variants from the freshly committed color icon
      if (commitResult?.ok && (commitResult.id || logo_id)) {
        try {
          const deriveRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/derive-mono-icons`,
            {
              method: "POST",
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
              },
              body: JSON.stringify({ logo_id: commitResult.id ?? logo_id, lockup: "icon" }),
            },
          );
          commitResult.derived = await deriveRes.json().catch(() => ({ ok: false }));
        } catch (e) {
          commitResult.derived = { ok: false, error: (e as Error).message };
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        origin,
        total: validated.length,
        candidates: validated.slice(0, 20),
        commit: commitResult,
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
