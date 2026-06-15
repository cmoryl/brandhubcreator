/**
 * Canva embed helpers.
 *
 * Accepts any Canva share / view / edit URL and returns a normalized
 * "embed" URL suitable for `<iframe src>`, plus a canonical "open in Canva"
 * URL for CTAs.
 *
 * Supported inputs:
 *  - https://www.canva.com/design/DAFxxxxx/view
 *  - https://www.canva.com/design/DAFxxxxx/view?utm_*=...
 *  - https://www.canva.com/design/DAFxxxxx/edit
 *  - https://www.canva.com/design/DAFxxxxx/<token>/view
 *  - https://www.canva.com/design/DAFxxxxx/<token>/view?embed
 *  - Any of the above with /view?embed already appended
 *  - Folder links: https://www.canva.com/folder/FAFxxxxx
 */

export interface CanvaUrlInfo {
  /** Embed URL — append `?embed` and ensure `/view` path. */
  embedUrl: string;
  /** Canonical viewer URL — same as embed without `?embed`. */
  openUrl: string;
  /** True if this looks like a folder URL (no embed). */
  isFolder: boolean;
}

const CANVA_HOST_RE = /^https?:\/\/([a-z0-9-]+\.)?canva\.com\//i;

/** Normalize a Canva share URL into embed + open URLs. Returns null if invalid. */
export function parseCanvaUrl(raw: string | null | undefined): CanvaUrlInfo | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!CANVA_HOST_RE.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Folder link — no embeddable design.
  if (/\/folder\//i.test(url.pathname)) {
    url.search = '';
    return { embedUrl: url.toString(), openUrl: url.toString(), isFolder: true };
  }

  // Match /design/<id>[/<token>][/<view|edit>]
  const designMatch = url.pathname.match(/\/design\/([^/]+)(?:\/([^/]+))?(?:\/(view|edit))?/i);
  if (!designMatch) {
    // Unknown Canva path — fall back to raw URL for "open" and try `?embed` for embed.
    const open = new URL(url.toString());
    open.search = '';
    const embed = new URL(open.toString());
    embed.search = 'embed';
    return { embedUrl: embed.toString(), openUrl: open.toString(), isFolder: false };
  }

  const [, id, maybeToken] = designMatch;
  // Token is optional but Canva includes it on shared links — keep it if present
  // and it's not literally "view" or "edit".
  const token = maybeToken && !/^(view|edit)$/i.test(maybeToken) ? maybeToken : null;

  const base = `${url.origin}/design/${id}${token ? `/${token}` : ''}/view`;
  return {
    embedUrl: `${base}?embed`,
    openUrl: base,
    isFolder: false,
  };
}

/** Cheap predicate for input validation. */
export function isCanvaUrl(raw: string | null | undefined): boolean {
  return parseCanvaUrl(raw) !== null;
}
