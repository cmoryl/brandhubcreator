/**
 * Industry-standard logo source lookup.
 *
 * Compares a brand's stored SVG logos against well-known canonical
 * repositories so the audit can flag missing or outdated marks.
 *
 * Sources probed (all CORS-friendly, no auth required):
 *  - gilbarbara/logos        — large multi-color brand SVG library
 *  - svgl.app                — curated brand SVG set
 *  - simpleicons.org         — monochrome brand SVGs (icon-only)
 *  - wikimedia commons       — fallback search
 *
 * All probes are best-effort. A 404 simply means "not in that registry".
 */

export type IndustrySource = 'gilbarbara' | 'svgl' | 'simpleicons' | 'wikimedia';

export interface IndustryCandidate {
  source: IndustrySource;
  label: string;
  url: string;
  /** Tone hint for the badge in the UI. */
  tone: 'success' | 'info' | 'warning';
}

export interface IndustryProbeResult {
  candidate: IndustryCandidate;
  /** HTTP status of the GET (or 0 if network error / CORS fail). */
  status: number;
  /** SHA-256 of the response body when status==200, else null. */
  sha256: string | null;
  /** Raw SVG text when status==200 and content-type is svg, else null. */
  svgText: string | null;
  /** Bytes of payload (0 if not fetched). */
  bytes: number;
  /** When false: network / CORS error and we couldn't even read a status. */
  reachable: boolean;
}

export interface BrandStandardsReport {
  slug: string;
  alternateSlugs: string[];
  probes: IndustryProbeResult[];
  /** Probes that returned 200. */
  hits: IndustryProbeResult[];
  /** Hashes of the brand's currently-stored SVG files (url -> sha256). */
  storedHashes: Record<string, string>;
  /** url -> matching canonical source labels (byte-identical). */
  matches: Record<string, string[]>;
  /** Did at least one canonical source list this brand at all? */
  hasCanonical: boolean;
}

const SAFE_SLUG_RE = /[^a-z0-9-]/g;

export function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[.'’]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(SAFE_SLUG_RE, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generate plausible slug variants — e.g. "google-cloud", "googlecloud". */
export function slugVariants(name: string): string[] {
  const base = slugifyBrand(name);
  if (!base) return [];
  const out = new Set<string>([base]);
  out.add(base.replace(/-/g, ''));
  // first token only ("google cloud" -> "google")
  const first = base.split('-')[0];
  if (first && first.length >= 3) out.add(first);
  return Array.from(out);
}

function candidatesFor(slug: string): IndustryCandidate[] {
  return [
    {
      source: 'gilbarbara',
      label: 'gilbarbara/logos',
      url: `https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/${slug}.svg`,
      tone: 'success',
    },
    {
      source: 'svgl',
      label: 'svgl.app',
      url: `https://svgl.app/library/${slug}.svg`,
      tone: 'success',
    },
    {
      source: 'simpleicons',
      label: 'Simple Icons',
      url: `https://cdn.simpleicons.org/${slug}`,
      tone: 'info',
    },
  ];
}

async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function probe(candidate: IndustryCandidate, signal?: AbortSignal): Promise<IndustryProbeResult> {
  try {
    const res = await fetch(candidate.url, { method: 'GET', signal, redirect: 'follow' });
    const status = res.status;
    if (!res.ok) {
      return { candidate, status, sha256: null, svgText: null, bytes: 0, reachable: true };
    }
    const buf = await res.arrayBuffer();
    const text = new TextDecoder().decode(buf);
    const looksSvg = /<svg[\s>]/i.test(text);
    return {
      candidate,
      status,
      sha256: await sha256Hex(buf),
      svgText: looksSvg ? text : null,
      bytes: buf.byteLength,
      reachable: true,
    };
  } catch {
    return { candidate, status: 0, sha256: null, svgText: null, bytes: 0, reachable: false };
  }
}

/** Normalize SVG text so visually-identical files with cosmetic whitespace differences still match. */
function normalizeSvg(text: string): string {
  return text
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

export async function probeIndustryStandards(opts: {
  brandName: string;
  storedSvgUrls: string[];
  signal?: AbortSignal;
}): Promise<BrandStandardsReport> {
  const { brandName, storedSvgUrls, signal } = opts;
  const slugs = slugVariants(brandName);
  const seen = new Set<string>();
  const allCandidates: IndustryCandidate[] = [];
  for (const slug of slugs) {
    for (const c of candidatesFor(slug)) {
      if (seen.has(c.url)) continue;
      seen.add(c.url);
      allCandidates.push(c);
    }
  }

  const probes = await Promise.all(allCandidates.map((c) => probe(c, signal)));
  const hits = probes.filter((p) => p.status === 200 && p.svgText);

  // Hash stored SVGs (best-effort; CORS may block some).
  const storedHashes: Record<string, string> = {};
  const storedNorms: Record<string, string> = {};
  await Promise.all(
    storedSvgUrls.map(async (url) => {
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) return;
        const text = await res.text();
        if (!/<svg[\s>]/i.test(text)) return;
        storedHashes[url] = await sha256Hex(text);
        storedNorms[url] = await sha256Hex(normalizeSvg(text));
      } catch {
        /* ignore */
      }
    }),
  );

  // Cross-reference: which stored files match a canonical source?
  const matches: Record<string, string[]> = {};
  const hitNormHashes = await Promise.all(
    hits.map(async (h) => ({
      label: h.candidate.label,
      raw: h.sha256,
      norm: h.svgText ? await sha256Hex(normalizeSvg(h.svgText)) : null,
    })),
  );
  for (const [url, rawHash] of Object.entries(storedHashes)) {
    const norm = storedNorms[url];
    const labels = hitNormHashes
      .filter((h) => h.raw === rawHash || (norm && h.norm && h.norm === norm))
      .map((h) => h.label);
    if (labels.length) matches[url] = labels;
  }

  return {
    slug: slugs[0] ?? '',
    alternateSlugs: slugs.slice(1),
    probes,
    hits,
    storedHashes,
    matches,
    hasCanonical: hits.length > 0,
  };
}
