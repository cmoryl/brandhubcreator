import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_CATEGORY = "PartnerLink Logos";

// Curated partner lists per category. `slug` is the Simple Icons slug (https://simpleicons.org).
// Brands without a known Simple Icons slug are seeded with name + website only
// so admins can run the existing "Find Logos" AI flow per-row.
type Partner = { name: string; website: string; slug?: string };

const PARTNERS_BY_CATEGORY: Record<string, Partner[]> = {
  "PartnerLink Logos": [
    { name: "AEM [Adobe Experience Manager]", website: "https://business.adobe.com/products/experience-manager/adobe-experience-manager.html", slug: "adobe" },
    { name: "Adobe Marketo", website: "https://business.adobe.com/products/marketo/adobe-marketo.html", slug: "marketo" },
    { name: "Byner", website: "https://www.byner.com" },
    { name: "CommerceTools", website: "https://commercetools.com" },
    { name: "Eloqua", website: "https://www.oracle.com/cx/marketing/automation/", slug: "oracle" },
    { name: "Hubspot", website: "https://www.hubspot.com", slug: "hubspot" },
    { name: "Kontent AI", website: "https://kontent.ai" },
    { name: "Salesforce", website: "https://www.salesforce.com", slug: "salesforce" },
    { name: "Sharepoint", website: "https://www.microsoft.com/en-us/microsoft-365/sharepoint/collaboration", slug: "microsoftsharepoint" },
    { name: "Shopify", website: "https://www.shopify.com", slug: "shopify" },
    { name: "Sitecore", website: "https://www.sitecore.com", slug: "sitecore" },
    { name: "Stibo Systems MDM", website: "https://www.stibosystems.com" },
    { name: "Umbraco", website: "https://umbraco.com", slug: "umbraco" },
    { name: "Webflow", website: "https://webflow.com", slug: "webflow" },
    { name: "Akeneo", website: "https://www.akeneo.com", slug: "akeneo" },
    { name: "Contentful", website: "https://www.contentful.com", slug: "contentful" },
    { name: "Contentstack", website: "https://www.contentstack.com", slug: "contentstack" },
    { name: "Drupal", website: "https://www.drupal.org", slug: "drupal" },
    { name: "Github", website: "https://github.com", slug: "github" },
    { name: "Google", website: "https://www.google.com", slug: "google" },
    { name: "inRiver", website: "https://www.inriver.com" },
    { name: "Optimizely Episerver", website: "https://www.optimizely.com", slug: "optimizely" },
    { name: "SAP (Commerce Cloud)", website: "https://www.sap.com/products/crm/commerce-cloud.html", slug: "sap" },
    { name: "Service now", website: "https://www.servicenow.com", slug: "servicenow" },
    { name: "Tridion", website: "https://www.rws.com/content-management/tridion/" },
    { name: "Veeva", website: "https://www.veeva.com" },
    { name: "Wordpress", website: "https://wordpress.org", slug: "wordpress" },
    { name: "Zendesk", website: "https://www.zendesk.com", slug: "zendesk" },
    { name: "builder.io", website: "https://www.builder.io" },
    { name: "Prismic.io", website: "https://prismic.io", slug: "prismic" },
    { name: "Sanity.io", website: "https://www.sanity.io", slug: "sanity" },
    { name: "StoryBlok", website: "https://www.storyblok.com", slug: "storyblok" },
    { name: "Agility PIM", website: "https://agilitycms.com" },
    { name: "Amazon", website: "https://www.amazon.com", slug: "amazon" },
    { name: "Amplience", website: "https://amplience.com" },
    { name: "Azure Cloud", website: "https://azure.microsoft.com", slug: "microsoftazure" },
    { name: "Contentserv", website: "https://www.contentserv.com" },
    { name: "Coremedia", website: "https://www.coremedia.com" },
    { name: "Figma", website: "https://www.figma.com", slug: "figma" },
    { name: "Informatica", website: "https://www.informatica.com", slug: "informatica" },
    { name: "Jahia", website: "https://www.jahia.com" },
    { name: "Knak", website: "https://knak.com" },
    { name: "Magnolia", website: "https://www.magnolia-cms.com" },
    { name: "Pimcore", website: "https://pimcore.com", slug: "pimcore" },
    { name: "Salsify", website: "https://www.salsify.com" },
    { name: "1440.io", website: "https://www.1440.io" },
  ],
  "Media": [
    { name: "Netflix", website: "https://www.netflix.com", slug: "netflix" },
    { name: "YouTube", website: "https://www.youtube.com", slug: "youtube" },
    { name: "Spotify", website: "https://www.spotify.com", slug: "spotify" },
    { name: "Hulu", website: "https://www.hulu.com", slug: "hulu" },
    { name: "HBO", website: "https://www.hbo.com", slug: "hbo" },
    { name: "Twitch", website: "https://www.twitch.tv", slug: "twitch" },
    { name: "TikTok", website: "https://www.tiktok.com", slug: "tiktok" },
    { name: "Instagram", website: "https://www.instagram.com", slug: "instagram" },
    { name: "Facebook", website: "https://www.facebook.com", slug: "facebook" },
    { name: "X (Twitter)", website: "https://x.com", slug: "x" },
    { name: "LinkedIn", website: "https://www.linkedin.com", slug: "linkedin" },
    { name: "Snapchat", website: "https://www.snapchat.com", slug: "snapchat" },
    { name: "Reddit", website: "https://www.reddit.com", slug: "reddit" },
    { name: "Pinterest", website: "https://www.pinterest.com", slug: "pinterest" },
    { name: "Vimeo", website: "https://vimeo.com", slug: "vimeo" },
    { name: "SoundCloud", website: "https://soundcloud.com", slug: "soundcloud" },
    { name: "Apple Music", website: "https://music.apple.com", slug: "applemusic" },
    { name: "Amazon Prime Video", website: "https://www.primevideo.com", slug: "primevideo" },
    { name: "Disney+", website: "https://www.disneyplus.com", slug: "disneyplus" },
    { name: "Paramount+", website: "https://www.paramountplus.com", slug: "paramountplus" },
    { name: "Peacock", website: "https://www.peacocktv.com", slug: "peacock" },
    { name: "BBC", website: "https://www.bbc.com", slug: "bbc" },
    { name: "CNN", website: "https://www.cnn.com", slug: "cnn" },
    { name: "The New York Times", website: "https://www.nytimes.com", slug: "newyorktimes" },
  ],
  "General": [
    { name: "Apple", website: "https://www.apple.com", slug: "apple" },
    { name: "Microsoft", website: "https://www.microsoft.com", slug: "microsoft" },
    { name: "Google", website: "https://www.google.com", slug: "google" },
    { name: "Amazon", website: "https://www.amazon.com", slug: "amazon" },
    { name: "Meta", website: "https://about.meta.com", slug: "meta" },
    { name: "IBM", website: "https://www.ibm.com", slug: "ibm" },
    { name: "Intel", website: "https://www.intel.com", slug: "intel" },
    { name: "Nvidia", website: "https://www.nvidia.com", slug: "nvidia" },
    { name: "Samsung", website: "https://www.samsung.com", slug: "samsung" },
    { name: "Sony", website: "https://www.sony.com", slug: "sony" },
    { name: "LG", website: "https://www.lg.com", slug: "lg" },
    { name: "Tesla", website: "https://www.tesla.com", slug: "tesla" },
    { name: "Toyota", website: "https://www.toyota.com", slug: "toyota" },
    { name: "Nike", website: "https://www.nike.com", slug: "nike" },
    { name: "Adidas", website: "https://www.adidas.com", slug: "adidas" },
    { name: "Coca-Cola", website: "https://www.coca-cola.com", slug: "cocacola" },
    { name: "Pepsi", website: "https://www.pepsi.com", slug: "pepsi" },
    { name: "Starbucks", website: "https://www.starbucks.com", slug: "starbucks" },
    { name: "McDonald's", website: "https://www.mcdonalds.com", slug: "mcdonalds" },
    { name: "Visa", website: "https://www.visa.com", slug: "visa" },
    { name: "Mastercard", website: "https://www.mastercard.com", slug: "mastercard" },
    { name: "PayPal", website: "https://www.paypal.com", slug: "paypal" },
    { name: "Walmart", website: "https://www.walmart.com", slug: "walmart" },
    { name: "FedEx", website: "https://www.fedex.com", slug: "fedex" },
    { name: "UPS", website: "https://www.ups.com", slug: "ups" },
  ],
};

const CATEGORY_DESCRIPTIONS: Record<string, { withLogo: string; withoutLogo: string }> = {
  "PartnerLink Logos": {
    withLogo: "PartnerLink integration partner (logo via Simple Icons)",
    withoutLogo: "PartnerLink integration partner — use Find Logos to discover assets",
  },
  "Media": {
    withLogo: "Media & entertainment brand (logo via Simple Icons)",
    withoutLogo: "Media & entertainment brand — use Find Logos to discover assets",
  },
  "General": {
    withLogo: "General consumer brand (logo via Simple Icons)",
    withoutLogo: "General consumer brand — use Find Logos to discover assets",
  },
};

async function fetchSimpleIconSvg(slug: string): Promise<string | null> {
  // Use Simple Icons jsDelivr CDN (raw monochrome SVG, MIT-licensed).
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<svg")) return null;
    return text;
  } catch {
    return null;
  }
}

// Cache the Simple Icons bundle for hex lookup (per cold start).
let brandHexBySlug: Map<string, string> | null = null;

// Simple Icons' current metadata intentionally omits some icons that are still
// available as SVG assets, so keep authoritative fallbacks for the curated set.
const BRAND_HEX_FALLBACKS: Record<string, string> = {
  adobe: "#FF0000",
  marketo: "#5C4C9F",
  oracle: "#F80000",
  microsoftazure: "#0078D4",
  microsoftsharepoint: "#0078D4",
  hubspot: "#FF7A59",
  salesforce: "#00A1E0",
  sitecore: "#EB1F1F",
  contentful: "#2478CC",
  contentstack: "#E74C3D",
  drupal: "#0678BE",
  github: "#181717",
  google: "#4285F4",
  sap: "#0FAAFF",
  shopify: "#7AB55C",
  wordpress: "#21759B",
  zendesk: "#03363D",
  figma: "#F24E1E",
  informatica: "#FF4D00",
  pimcore: "#6428B4",
  prismic: "#5163BA",
  sanity: "#F03E2F",
  storyblok: "#09B3AF",
  umbraco: "#3544B1",
  webflow: "#146EF5",
};

function titleToSlug(title: string): string {
  // Mirrors simple-icons' slug algorithm.
  const replacements: Record<string, string> = { "+": "plus", ".": "dot", "&": "and", "đ": "d", "ħ": "h", "ı": "i", "ĸ": "k", "ŀ": "l", "ł": "l", "ß": "ss", "ŧ": "t" };
  let s = title;
  for (const [k, v] of Object.entries(replacements)) s = s.split(k).join(v);
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function loadBrandHexMap(): Promise<Map<string, string>> {
  if (brandHexBySlug) return brandHexBySlug;
  const urls = [
    "https://cdn.jsdelivr.net/npm/simple-icons@latest/_data/simple-icons.json",
    // Pinned metadata versions retain hex values for several still-hosted icons
    // that were removed from the latest metadata bundle (Adobe, Oracle, Azure, etc.).
    "https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/_data/simple-icons.json",
    "https://cdn.jsdelivr.net/npm/simple-icons@12.4.0/_data/simple-icons.json",
  ];
  const map = new Map<string, string>();
  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const data = await res.json();
      const entries = Array.isArray(data) ? data : Array.isArray(data?.icons) ? data.icons : [];
      for (const entry of entries) {
        if (!entry?.hex || !entry?.title) continue;
        const slug = (entry.slug && typeof entry.slug === "string") ? entry.slug : titleToSlug(entry.title);
        const hex = entry.hex.startsWith("#") ? entry.hex : `#${entry.hex}`;
        if (!map.has(slug)) map.set(slug, hex);
      }
    } catch {
      // try next url
    }
  }
  for (const [slug, hex] of Object.entries(BRAND_HEX_FALLBACKS)) {
    if (!map.has(slug)) map.set(slug, hex);
  }
  brandHexBySlug = map;
  return brandHexBySlug;
}

async function fetchSimpleIconBrandHex(slug: string): Promise<string | null> {
  const map = await loadBrandHexMap();
  return map.get(slug) ?? BRAND_HEX_FALLBACKS[slug] ?? null;
}

function colorizeSvg(svg: string, hex: string): string {
  // Simple Icons SVGs are single-path monochrome; inject fill on the root <svg>
  // and strip any inline fills on children so the override always wins.
  let out = svg.replace(/\sfill="[^"]*"/g, "");
  out = out.replace(/<svg([^>]*)>/, `<svg$1 fill="${hex}">`);
  return out;
}

function svgToDataUrl(svg: string): string {
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanWordmarkName(name: string): string {
  return name
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim() || name;
}

function svgInner(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .replace(/\sfill=["'][^"']*["']/gi, "");
}

function makeWordmarkSvg(name: string, color: string, iconSvg?: string | null): string {
  const label = cleanWordmarkName(name);
  const fontSize = Math.max(46, Math.min(74, Math.floor(560 / Math.max(label.length, 8))));
  const textX = iconSvg ? 192 : 40;
  const iconMarkup = iconSvg
    ? `<g transform="translate(44 66) scale(5.4)" fill="${color}">${svgInner(iconSvg)}</g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 260" role="img" aria-label="${escapeXml(label)} wordmark">
  <rect width="960" height="260" fill="none"/>
  ${iconMarkup}
  <text x="${textX}" y="146" fill="${color}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="0">${escapeXml(label)}</text>
</svg>`;
}

async function generatedWordmarkFiles(p: Partner): Promise<Array<{ variant: "color" | "white" | "black"; format: "svg"; url: string; lockup: "wordmark" }>> {
  const iconSvg = p.slug ? await fetchSimpleIconSvg(p.slug) : null;
  const brandHex = p.slug ? await fetchSimpleIconBrandHex(p.slug) : null;
  const colorHex = brandHex ?? "#111827";
  return [
    { variant: "color", format: "svg", url: svgToDataUrl(makeWordmarkSvg(p.name, colorHex, iconSvg)), lockup: "wordmark" },
    { variant: "white", format: "svg", url: svgToDataUrl(makeWordmarkSvg(p.name, "#ffffff", iconSvg)), lockup: "wordmark" },
    { variant: "black", format: "svg", url: svgToDataUrl(makeWordmarkSvg(p.name, "#000000", iconSvg)), lockup: "wordmark" },
  ];
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function absolutize(base: string, ref: string): string | null {
  try { return new URL(ref, base).toString(); } catch { return null; }
}

async function urlOk(url: string, timeoutMs = 6000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("image/") || ct.includes("svg");
  } catch { return false; }
}

async function scrapeSiteForLogo(website: string): Promise<Array<{ url: string; format: "svg" | "png" | "jpg" }>> {
  const found: Array<{ url: string; format: "svg" | "png" | "jpg" }> = [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(website, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(t);
    if (!res.ok) return found;
    const html = await res.text();
    const candidates = new Set<string>();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/gi,
      /<link[^>]+rel=["']mask-icon["'][^>]+href=["']([^"']+)["']/gi,
      /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/gi,
      /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["']/gi,
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        const abs = absolutize(website, m[1]);
        if (abs) candidates.add(abs);
      }
    }
    for (const u of candidates) {
      const lower = u.toLowerCase().split("?")[0];
      let fmt: "svg" | "png" | "jpg" = "png";
      if (lower.endsWith(".svg")) fmt = "svg";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) fmt = "jpg";
      if (await urlOk(u)) {
        found.push({ url: u, format: fmt });
        if (found.length >= 3) break;
      }
    }
  } catch { /* ignore */ }
  return found;
}

async function discoverColorLogo(website: string): Promise<Array<{ variant: "color"; format: "svg" | "png" | "jpg"; url: string }>> {
  const out: Array<{ variant: "color"; format: "svg" | "png" | "jpg"; url: string }> = [];
  const domain = domainFromUrl(website);
  if (!domain) return out;

  const clearbit = `https://logo.clearbit.com/${domain}?size=512`;
  if (await urlOk(clearbit)) out.push({ variant: "color", format: "png", url: clearbit });

  const scraped = await scrapeSiteForLogo(website);
  for (const s of scraped) out.push({ variant: "color", format: s.format, url: s.url });

  if (out.length === 0) {
    const google = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    if (await urlOk(google)) out.push({ variant: "color", format: "png", url: google });
  }
  return out;
}

type LogoFormat = "svg" | "png" | "jpg";
type WordmarkFile = { variant: "color" | "white" | "black"; format: LogoFormat; url: string; lockup: "wordmark"; source?: string };
type LogoCandidate = { url: string; source: "official" | "wikimedia"; context: string; score: number };
type AssetMeta = { ok: boolean; format: LogoFormat; width?: number; height?: number; aspect?: number; svg?: string; contentType?: string };

function inferFormat(url: string, contentType = ""): LogoFormat | null {
  const lower = url.toLowerCase().split("?")[0];
  if (contentType.includes("svg") || lower.endsWith(".svg")) return "svg";
  if (contentType.includes("jpeg") || contentType.includes("jpg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpg";
  if (contentType.includes("png") || lower.endsWith(".png")) return "png";
  return null;
}

function logoCandidateScore(url: string, context: string, brandName: string, source: "official" | "wikimedia"): number {
  const hay = `${url} ${context}`.toLowerCase();
  const brand = cleanWordmarkName(brandName).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  let score = source === "official" ? 55 : 48;
  if (hay.includes("wordmark")) score += 35;
  if (hay.includes("full-logo") || hay.includes("full_logo") || hay.includes("lockup")) score += 28;
  if (hay.includes("horizontal")) score += 22;
  if (hay.includes("logo")) score += 18;
  if (hay.includes("brand") || hay.includes("navbar") || hay.includes("header")) score += 10;
  for (const part of brand.split(" ").filter((p) => p.length > 2)) if (hay.includes(part)) score += 5;
  if (/favicon|apple-touch|touch-icon|mask-icon|sprite|app-icon|icon[-_]?\d|symbol|glyph|avatar|badge|social|og-image|opengraph/i.test(hay)) score -= 35;
  if (/old|former|previous|legacy|obsolete|deprecated/i.test(hay)) score -= 18;
  if (/\.svg(?:\?|$)/i.test(url)) score += 12;
  return score;
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function getAttr(tag: string, attr: string): string | null {
  const m = new RegExp(`${attr}=["']([^"']+)["']`, "i").exec(tag);
  return m?.[1] ? decodeHtmlEntities(m[1]) : null;
}

function urlsFromSrcset(srcset: string): string[] {
  return srcset.split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
}

function parseSvgDimensions(svg: string): { width?: number; height?: number; aspect?: number } {
  const tag = /<svg\b[^>]*>/i.exec(svg)?.[0] ?? "";
  const num = (v: string | null) => {
    if (!v) return undefined;
    const n = Number.parseFloat(v.replace(/px$/i, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  let width = num(getAttr(tag, "width"));
  let height = num(getAttr(tag, "height"));
  const vb = /viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i.exec(tag);
  if ((!width || !height) && vb) {
    width = width ?? Number.parseFloat(vb[1]);
    height = height ?? Number.parseFloat(vb[2]);
  }
  return width && height ? { width, height, aspect: width / height } : { width, height };
}

function parsePngDimensions(bytes: Uint8Array): { width?: number; height?: number; aspect?: number } {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return {};
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width && height ? { width, height, aspect: width / height } : {};
}

function parseJpegDimensions(bytes: Uint8Array): { width?: number; height?: number; aspect?: number } {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return {};
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const len = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = (bytes[offset + 5] << 8) + bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) + bytes[offset + 8];
      return width && height ? { width, height, aspect: width / height } : {};
    }
    offset += 2 + len;
  }
  return {};
}

function sanitizeSvg(svg: string): string {
  return svg.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "").replace(/\son\w+=["'][^"']*["']/gi, "").replace(/\sxmlns:xlink=["'][^"']*["']/gi, "");
}

function monochromeSvg(svg: string, color: string): string {
  return sanitizeSvg(svg).replace(/<svg([^>]*)>/i, `<svg$1><style>*{fill:${color}!important} [fill="none"],[fill="transparent"]{fill:none!important} [stroke]:not([stroke="none"]){stroke:${color}!important}</style>`);
}

async function fetchAssetMeta(url: string, timeoutMs = 9000): Promise<AssetMeta | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const format = inferFormat(url, contentType);
    if (!format) return null;
    if (format === "svg") {
      const svg = sanitizeSvg(await res.text());
      if (!svg.includes("<svg")) return null;
      return { ok: true, format, ...parseSvgDimensions(svg), svg, contentType };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const dims = format === "png" ? parsePngDimensions(buf) : parseJpegDimensions(buf);
    return { ok: true, format, ...dims, contentType };
  } catch { return null; }
}

function pushUniqueCandidate(candidates: LogoCandidate[], candidate: LogoCandidate) {
  if (candidate.url && !candidates.some((c) => c.url === candidate.url)) candidates.push(candidate);
}

function officialLogoCandidatesFromHtml(website: string, html: string, brandName: string): LogoCandidate[] {
  const candidates: LogoCandidate[] = [];
  const tags = [...html.matchAll(/<(?:img|source|link|meta|object|embed|a|use)\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of tags) {
    if (!/logo|wordmark|brand|navbar|header|masthead/i.test(tag)) continue;
    const urls = [getAttr(tag, "src"), getAttr(tag, "href"), getAttr(tag, "data"), getAttr(tag, "content"), getAttr(tag, "data-src"), getAttr(tag, "data-lazy-src"), getAttr(tag, "data-original"), ...urlsFromSrcset(getAttr(tag, "srcset") ?? ""), ...urlsFromSrcset(getAttr(tag, "data-srcset") ?? "")].filter(Boolean) as string[];
    for (const raw of urls) {
      const abs = absolutize(website, raw);
      if (!abs) continue;
      const score = logoCandidateScore(abs, tag, brandName, "official");
      if (score > 35) pushUniqueCandidate(candidates, { url: abs, source: "official", context: tag, score });
    }
  }
  for (const m of html.matchAll(/url\((['"]?)([^)'" ]+)\1\)/gi)) {
    if (!/logo|wordmark|brand/i.test(m[2])) continue;
    const abs = absolutize(website, m[2]);
    if (abs) pushUniqueCandidate(candidates, { url: abs, source: "official", context: m[2], score: logoCandidateScore(abs, m[2], brandName, "official") });
  }
  return candidates;
}

async function discoverOfficialWordmarkCandidates(website: string, brandName: string): Promise<LogoCandidate[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(website, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36", Accept: "text/html,application/xhtml+xml" } });
    clearTimeout(t);
    if (!res.ok) return [];
    return officialLogoCandidatesFromHtml(res.url || website, await res.text(), brandName);
  } catch { return []; }
}

async function discoverWikimediaWordmarkCandidates(brandName: string): Promise<LogoCandidate[]> {
  const out: LogoCandidate[] = [];
  const base = cleanWordmarkName(brandName);
  for (const search of [`${base} logo svg`, `${base} wordmark svg`, `${base} horizontal logo svg`]) {
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(search)}&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`;
      const res = await fetch(url, { redirect: "follow", headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const pages = Object.values((await res.json())?.query?.pages ?? {}) as any[];
      for (const page of pages) {
        const image = page?.imageinfo?.[0];
        if (!image?.url) continue;
        const context = `${page.title ?? ""} ${image.mime ?? ""}`;
        const score = logoCandidateScore(image.url, context, brandName, "wikimedia");
        if (score > 32) pushUniqueCandidate(out, { url: image.url, source: "wikimedia", context, score });
      }
    } catch { /* continue */ }
  }
  return out;
}

async function selectBestWordmarkCandidate(candidates: LogoCandidate[]): Promise<{ candidate: LogoCandidate; meta: AssetMeta } | null> {
  let best: { candidate: LogoCandidate; meta: AssetMeta; score: number } | null = null;
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score).slice(0, 18)) {
    const meta = await fetchAssetMeta(candidate.url);
    if (!meta?.ok) continue;
    const aspect = meta.aspect ?? 0;
    let score = candidate.score + (meta.format === "svg" ? 20 : 0) + (((meta.width ?? 0) >= 220 || meta.format === "svg") ? 8 : 0);
    if (aspect >= 1.8 && aspect <= 10) score += 45;
    else if (aspect >= 1.35) score += 22;
    else if (aspect > 0 && aspect < 1.15) score -= 38;
    if (!best || score > best.score) best = { candidate, meta, score };
  }
  return best ? { candidate: best.candidate, meta: best.meta } : null;
}

function sourceToWordmarkFiles(candidate: LogoCandidate, meta: AssetMeta): WordmarkFile[] {
  if (meta.format === "svg" && meta.svg) {
    return [
      { variant: "color", format: "svg", url: svgToDataUrl(meta.svg), lockup: "wordmark", source: candidate.source },
      { variant: "white", format: "svg", url: svgToDataUrl(monochromeSvg(meta.svg, "#ffffff")), lockup: "wordmark", source: candidate.source },
      { variant: "black", format: "svg", url: svgToDataUrl(monochromeSvg(meta.svg, "#000000")), lockup: "wordmark", source: candidate.source },
    ];
  }
  return [{ variant: "color", format: meta.format, url: candidate.url, lockup: "wordmark", source: candidate.source }];
}

async function discoverWordmarkLogos(p: Partner): Promise<WordmarkFile[]> {
  const selected = await selectBestWordmarkCandidate([
    ...await discoverOfficialWordmarkCandidates(p.website, p.name),
    ...await discoverWikimediaWordmarkCandidates(p.name),
  ]);
  const generated = await generatedWordmarkFiles(p);
  if (!selected) return generated.map((g) => ({ ...g, source: "generated" }));
  const real = sourceToWordmarkFiles(selected.candidate, selected.meta);
  const variants = new Set(real.map((f) => f.variant));
  return [...real, ...generated.filter((g) => !variants.has(g.variant)).map((g) => ({ ...g, source: "generated" }))];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is signed in and is an admin/owner of the org they're seeding.
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const organizationId: string | undefined = body.organizationId;
    const namesFilter: string[] | undefined = Array.isArray(body.names) ? body.names : undefined;
    const force: boolean = body.force === true;
    const wordmarksOnly: boolean = body.wordmarksOnly === true;
    // Categories can be a single string or array. Defaults to PartnerLink Logos.
    const rawCategories: string[] = Array.isArray(body.categories)
      ? body.categories
      : typeof body.category === "string"
        ? [body.category]
        : [DEFAULT_CATEGORY];
    const categories = rawCategories.filter((c) => PARTNERS_BY_CATEGORY[c]);
    if (categories.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unknown category. Supported: ${Object.keys(PARTNERS_BY_CATEGORY).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const namesFilterLower = namesFilter?.map((n) => n.toLowerCase());

    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm membership/admin.
    const { data: member } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const isOrgAdmin = member && ["admin", "owner"].includes(member.role);
    if (!isOrgAdmin) {
      // also allow platform admins
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const isPlatformAdmin = (roles || []).some((r) => ["admin", "super_admin"].includes(r.role));
      if (!isPlatformAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const allResults: Array<{ category: string; name: string; status: "inserted" | "updated" | "skipped" | "no-logo" }> = [];
    let totalPartners = 0;

    for (const category of categories) {
      const partners = PARTNERS_BY_CATEGORY[category];
      const desc = CATEGORY_DESCRIPTIONS[category] ?? {
        withLogo: `${category} brand (logo via Simple Icons)`,
        withoutLogo: `${category} brand — use Find Logos to discover assets`,
      };
      totalPartners += partners.length;

      // Existing rows in this category for this org → backfill if missing files, else skip.
      const { data: existing } = await admin
        .from("global_client_logos")
        .select("id, name, files")
        .eq("organization_id", organizationId)
        .eq("category", category);
      const existingByName = new Map<string, { id: string; files: any[] }>(
        (existing || []).map((r: any) => [
          r.name.toLowerCase(),
          { id: r.id, files: Array.isArray(r.files) ? r.files : [] },
        ]),
      );

      const rowsToInsert: any[] = [];

      for (const p of partners) {
        if (namesFilterLower && !namesFilterLower.includes(p.name.toLowerCase())) continue;

        const existingRow = existingByName.get(p.name.toLowerCase());

        // Wordmarks-only mode: only re-scrape wordmarks and overwrite the wordmark
        // slots on existing rows. Skip partners that don't already exist.
        if (wordmarksOnly) {
          if (!existingRow) {
            allResults.push({ category, name: p.name, status: "skipped" });
            continue;
          }
          const wordmarks = await discoverWordmarkLogos(p);
          // Drop existing wordmark entries; keep icon entries intact.
          const preserved = existingRow.files.filter((f: any) => f?.lockup !== "wordmark");
          const merged = [...preserved, ...wordmarks.map((w) => ({ ...w, lockup: "wordmark" }))];
          if (wordmarks.length === 0) {
            allResults.push({ category, name: p.name, status: "no-logo" });
            continue;
          }
          const { error: updErr } = await admin
            .from("global_client_logos")
            .update({ files: merged })
            .eq("id", existingRow.id);
          if (updErr) throw updErr;
          allResults.push({ category, name: p.name, status: "updated" });
          continue;
        }

        const files: any[] = [];
        let foundLogo = false;
        let hasColor = false;
        if (p.slug) {
          const svg = await fetchSimpleIconSvg(p.slug);
          if (svg) {
            foundLogo = true;
            const whiteSvg = colorizeSvg(svg, "#ffffff");
            const blackSvg = colorizeSvg(svg, "#000000");
            files.push({ variant: "white", format: "svg", url: svgToDataUrl(whiteSvg), lockup: "icon" });
            files.push({ variant: "black", format: "svg", url: svgToDataUrl(blackSvg), lockup: "icon" });
            files.push({ variant: "white", format: "png", url: `https://cdn.simpleicons.org/${p.slug}/ffffff`, lockup: "icon" });
            files.push({ variant: "black", format: "png", url: `https://cdn.simpleicons.org/${p.slug}/000000`, lockup: "icon" });

            const hex = await fetchSimpleIconBrandHex(p.slug);
            if (hex) {
              const cleanHex = hex.replace("#", "");
              const colorSvg = colorizeSvg(svg, `#${cleanHex}`);
              files.push({ variant: "color", format: "svg", url: svgToDataUrl(colorSvg), lockup: "icon" });
              files.push({ variant: "color", format: "png", url: `https://cdn.simpleicons.org/${p.slug}/${cleanHex}`, lockup: "icon" });
              hasColor = true;
            }
          }
        }

        // Deep discovery fallback: ALWAYS try to find real brand color logo from web
        if (!hasColor) {
          const discovered = await discoverColorLogo(p.website);
          for (const d of discovered) {
            files.push({ ...d, lockup: "icon" });
            foundLogo = true;
          }
        }

        // Wordmark / full-logo discovery — populates the wordmark row.
        const wordmarks = await discoverWordmarkLogos(p);
        for (const w of wordmarks) {
          files.push({ ...w, lockup: "wordmark" });
          foundLogo = true;
        }

        if (existingRow) {
          const shouldUpdate = foundLogo && (force || files.length > existingRow.files.length);
          if (shouldUpdate) {
            const { error: updErr } = await admin
              .from("global_client_logos")
              .update({ files })
              .eq("id", existingRow.id);
            if (updErr) throw updErr;
            allResults.push({ category, name: p.name, status: "updated" });
          } else {
            allResults.push({ category, name: p.name, status: "skipped" });
          }
          continue;
        }

        rowsToInsert.push({
          organization_id: organizationId,
          name: p.name,
          description: p.slug ? desc.withLogo : desc.withoutLogo,
          category,
          website_url: p.website,
          files,
          created_by: userData.user.id,
        });
        allResults.push({ category, name: p.name, status: foundLogo ? "inserted" : "no-logo" });
      }

      if (rowsToInsert.length > 0) {
        const { error: insertErr } = await admin
          .from("global_client_logos")
          .insert(rowsToInsert);
        if (insertErr) throw insertErr;
      }
    }

    const summary = {
      categories,
      total: totalPartners,
      inserted: allResults.filter((r) => r.status === "inserted").length,
      updated: allResults.filter((r) => r.status === "updated").length,
      withoutLogo: allResults.filter((r) => r.status === "no-logo").length,
      skipped: allResults.filter((r) => r.status === "skipped").length,
      results: allResults,
    };


    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[seed-partnerlink-logos] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
