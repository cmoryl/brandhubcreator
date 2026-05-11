/**
 * Claude Skill Exporter
 *
 * Packages a brand / product / event guide into a Claude-compatible
 * "skill" folder (zipped) so it can be loaded into Claude as project
 * knowledge. Folder layout:
 *
 *   <slug>/
 *     SKILL.md                  (frontmatter: name, description)
 *     guide.json                (full structured guide data)
 *     references/
 *       overview.md
 *       colors.md
 *       typography.md
 *       logos.md
 *       voice-and-messaging.md
 *       imagery.md
 *       assets.md               (download URLs)
 *     README.md
 */
import JSZip from 'jszip';
import { BrandGuide, ProductGuide } from '@/types/brand';
import { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

const slugify = (s: string) =>
  (s || 'guide')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

const fence = (lang: string, body: string) => '```' + lang + '\n' + body + '\n```';

const safeArr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

function buildSkillMd(guide: AnyGuide, kind: string): string {
  const name = slugify(guide.hero?.name || 'guide');
  const displayName = guide.hero?.name || 'Untitled';
  const tagline = guide.hero?.tagline || '';
  const description = `${displayName} ${kind} brand skill. ${tagline}`.slice(0, 480).trim();

  return `---
name: ${name}
description: ${JSON.stringify(description)}
---

# ${displayName} — ${kind[0].toUpperCase() + kind.slice(1)} Brand Skill

${tagline ? `> ${tagline}\n` : ''}
This skill encodes the official brand system for **${displayName}**. Use it
whenever generating copy, designs, social posts, decks, or any artifact that
must stay on-brand.

## When to use this skill
- The user references "${displayName}" or any of its products/events.
- The user asks for on-brand copy, slogans, social posts, or visuals.
- The user requests color, typography, logo usage, voice, or imagery guidance.

## How to use
1. Read \`references/overview.md\` for positioning and identity.
2. Pull color values from \`references/colors.md\` (HEX is canonical).
3. Use only fonts in \`references/typography.md\`.
4. Match the tone described in \`references/voice-and-messaging.md\`.
5. Logo + asset URLs are in \`references/logos.md\` and \`references/assets.md\`.
6. Full structured data lives in \`guide.json\` for programmatic lookup.

## Hard rules
- Never invent colors, fonts, or logo variants outside this skill.
- Never modify approved logos (no recoloring, stretching, or effects).
- Always respect the voice, do/don't lists, and any anti-patterns noted.
`;
}

function buildOverview(guide: AnyGuide, kind: string): string {
  const h = guide.hero || ({} as any);
  const id: any = (guide as any).identity || {};
  const lines: string[] = [];
  lines.push(`# Overview — ${h.name || ''}`);
  if (h.tagline) lines.push(`\n_${h.tagline}_\n`);
  lines.push(`**Type:** ${kind}`);
  if ((guide as any).slug) lines.push(`**Slug:** ${(guide as any).slug}`);
  if (id.mission) lines.push(`\n## Mission\n${id.mission}`);
  if (id.vision) lines.push(`\n## Vision\n${id.vision}`);
  if (id.positioning) lines.push(`\n## Positioning\n${id.positioning}`);
  if (id.archetype) lines.push(`\n## Archetype\n${id.archetype}`);
  const values = safeArr((guide as any).values);
  if (values.length) {
    lines.push(`\n## Values`);
    values.forEach((v: any) => lines.push(`- **${v.name || v.title || ''}** — ${v.description || ''}`));
  }
  return lines.join('\n');
}

function buildColors(guide: AnyGuide): string {
  const colors = safeArr((guide as any).colors);
  const combos = safeArr((guide as any).colorCombinations);
  const lines = ['# Colors', ''];
  if (!colors.length) lines.push('_No colors defined._');
  colors.forEach((c: any) => {
    lines.push(`## ${c.name || c.hex}`);
    lines.push(`- **HEX:** \`${c.hex}\``);
    if (c.rgb) lines.push(`- **RGB:** ${c.rgb}`);
    if (c.cmyk) lines.push(`- **CMYK:** ${c.cmyk}`);
    if (c.pantone) lines.push(`- **Pantone:** ${c.pantone}`);
    if (c.role) lines.push(`- **Role:** ${c.role}`);
    if (c.usage) lines.push(`- **Usage:** ${c.usage}`);
    lines.push('');
  });
  if (combos.length) {
    lines.push('## Approved color combinations');
    combos.forEach((cc: any) => {
      lines.push(`- **${cc.name}** (${cc.status || 'approved'}): ${(cc.colors || []).join(', ')}`);
    });
  }
  return lines.join('\n');
}

function buildTypography(guide: AnyGuide): string {
  const fonts = safeArr((guide as any).typography);
  const lines = ['# Typography', ''];
  if (!fonts.length) lines.push('_No typography defined._');
  fonts.forEach((f: any) => {
    lines.push(`## ${f.name || f.fontFamily}`);
    lines.push(`- **Family:** ${f.fontFamily}`);
    if (f.weight) lines.push(`- **Weight:** ${f.weight}`);
    if (f.role) lines.push(`- **Role:** ${f.role}`);
    if (f.usage) lines.push(`- **Usage:** ${f.usage}`);
    if (f.downloadUrl) lines.push(`- **Download:** ${f.downloadUrl}`);
    lines.push('');
  });
  return lines.join('\n');
}

function buildLogos(guide: AnyGuide): string {
  const logos = safeArr((guide as any).logos);
  const links = safeArr((guide as any).logoDownloadLinks);
  const lines = ['# Logos', ''];
  if (!logos.length) lines.push('_No logos defined._');
  logos.forEach((l: any) => {
    lines.push(`## ${l.name} (${l.variant})`);
    if (l.description) lines.push(l.description);
    if (l.url) lines.push(`- **URL:** ${l.url}`);
    lines.push('');
  });
  if (links.length) {
    lines.push('## Download links');
    links.forEach((d: any) => {
      lines.push(`- **${d.label}** ${d.format ? `(${d.format})` : ''} — ${d.url}`);
    });
  }
  return lines.join('\n');
}

function buildVoice(guide: AnyGuide): string {
  const v: any = (guide as any).voice || {};
  const taglines = safeArr((guide as any).taglineLibrary || (guide as any).taglines);
  const lines = ['# Voice & Messaging', ''];
  if (v.tone) lines.push(`## Tone\n${Array.isArray(v.tone) ? v.tone.join(', ') : v.tone}\n`);
  if (v.personality) lines.push(`## Personality\n${Array.isArray(v.personality) ? v.personality.join(', ') : v.personality}\n`);
  if (Array.isArray(v.dos) && v.dos.length) {
    lines.push('## Do');
    v.dos.forEach((x: any) => lines.push(`- ${typeof x === 'string' ? x : x?.text || ''}`));
  }
  if (Array.isArray(v.donts) && v.donts.length) {
    lines.push("\n## Don't");
    v.donts.forEach((x: any) => lines.push(`- ${typeof x === 'string' ? x : x?.text || ''}`));
  }
  if (taglines.length) {
    lines.push('\n## Tagline library');
    taglines.forEach((t: any) => lines.push(`- ${typeof t === 'string' ? t : t?.text || t?.tagline || ''}`));
  }
  if (lines.length === 2) lines.push('_No voice guidance defined._');
  return lines.join('\n');
}

function buildImagery(guide: AnyGuide): string {
  const imagery = safeArr((guide as any).imagery);
  const lines = ['# Imagery', ''];
  if (!imagery.length) return lines.concat(['_No imagery defined._']).join('\n');
  imagery.forEach((i: any) => {
    lines.push(`## ${i.name || i.title || 'Image'}`);
    if (i.description) lines.push(i.description);
    if (i.url) lines.push(`- **URL:** ${i.url}`);
    if (i.category) lines.push(`- **Category:** ${i.category}`);
    lines.push('');
  });
  return lines.join('\n');
}

function buildAssets(guide: AnyGuide): string {
  const lines = ['# Assets', ''];
  const sections: Array<[string, any[]]> = [
    ['Brochures', safeArr((guide as any).brochures)],
    ['Case studies', safeArr((guide as any).caseStudies)],
    ['Patterns', safeArr((guide as any).patterns)],
    ['Gradients', safeArr((guide as any).gradients)],
    ['Icons', safeArr((guide as any).brandIcons)],
    ['Social icons', safeArr((guide as any).socialIcons)],
  ];
  sections.forEach(([title, arr]) => {
    if (!arr.length) return;
    lines.push(`## ${title}`);
    arr.forEach((a: any) => {
      const url = a.url || a.fileUrl || a.imageUrl || a.thumbnailUrl;
      lines.push(`- **${a.name || a.title || a.id}**${url ? ` — ${url}` : ''}`);
    });
    lines.push('');
  });
  if (lines.length === 2) lines.push('_No additional assets defined._');
  return lines.join('\n');
}

function buildReadme(guide: AnyGuide, kind: string): string {
  const name = guide.hero?.name || 'Guide';
  return `# ${name} — Claude Skill

This folder is a Claude-compatible **skill** export of the ${kind} guide for
${name}. To use it:

1. Unzip the folder.
2. In Claude (claude.ai or Claude Code), create a new Skill and upload the
   contents of this folder, or drop the folder into your project knowledge.
3. Claude will automatically read \`SKILL.md\` and pull from the
   \`references/\` files when relevant.

\`guide.json\` is the full structured payload — handy if you want to wire
this brand into automations, scripts, or other tools.

Generated ${new Date().toISOString()}.
`;
}

/* ---------- Asset bundling ---------- */

interface AssetRef {
  url: string;
  category: 'logos' | 'imagery' | 'icons' | 'patterns' | 'gradients' | 'brochures' | 'case-studies' | 'fonts' | 'misc';
  name?: string;
}

function collectAssetRefs(guide: AnyGuide): AssetRef[] {
  const out: AssetRef[] = [];
  const push = (category: AssetRef['category'], items: any[], pickers: ((a: any) => string | undefined)[]) => {
    items.forEach((a) => {
      for (const p of pickers) {
        const url = p(a);
        if (url && /^https?:\/\//i.test(url)) {
          out.push({ url, category, name: a?.name || a?.title });
          break;
        }
      }
    });
  };
  push('logos', safeArr((guide as any).logos), [(a) => a.url]);
  push('imagery', safeArr((guide as any).imagery), [(a) => a.url]);
  push('icons', safeArr((guide as any).brandIcons), [(a) => a.url || a.svgUrl]);
  push('icons', safeArr((guide as any).socialIcons), [(a) => a.url]);
  push('patterns', safeArr((guide as any).patterns), [(a) => a.url || a.imageUrl]);
  push('gradients', safeArr((guide as any).gradients), [(a) => a.url || a.imageUrl]);
  push('brochures', safeArr((guide as any).brochures), [(a) => a.fileUrl || a.url]);
  push('case-studies', safeArr((guide as any).caseStudies), [(a) => a.fileUrl || a.url || a.imageUrl]);
  push('fonts', safeArr((guide as any).typography), [(a) => a.downloadUrl]);
  return out;
}

function filenameFromUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || fallback;
    return decodeURIComponent(last).replace(/[^\w.\-]+/g, '_').slice(0, 100) || fallback;
  } catch {
    return fallback;
  }
}

async function fetchAsBlob(url: string, timeoutMs = 15000): Promise<Blob | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, mode: 'cors' });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function bundleAssets(
  zipRoot: JSZip,
  refs: AssetRef[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ manifest: Array<{ url: string; path?: string; ok: boolean }>; failed: AssetRef[] }> {
  const manifest: Array<{ url: string; path?: string; ok: boolean }> = [];
  const failed: AssetRef[] = [];
  const used = new Set<string>();
  let done = 0;
  const concurrency = 6;

  // De-dupe by URL
  const unique = Array.from(new Map(refs.map((r) => [r.url, r])).values());

  const worker = async (queue: AssetRef[]) => {
    while (queue.length) {
      const ref = queue.shift()!;
      const blob = await fetchAsBlob(ref.url);
      done++;
      onProgress?.(done, unique.length);
      if (!blob) {
        failed.push(ref);
        manifest.push({ url: ref.url, ok: false });
        continue;
      }
      let base = filenameFromUrl(ref.url, `${ref.category}-${done}.bin`);
      let path = `assets/${ref.category}/${base}`;
      let i = 1;
      while (used.has(path)) {
        const dot = base.lastIndexOf('.');
        const stem = dot > 0 ? base.slice(0, dot) : base;
        const ext = dot > 0 ? base.slice(dot) : '';
        path = `assets/${ref.category}/${stem}-${i++}${ext}`;
      }
      used.add(path);
      zipRoot.file(path, blob);
      manifest.push({ url: ref.url, path, ok: true });
    }
  };

  const queue = [...unique];
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker(queue)));
  return { manifest, failed };
}

function buildBundledAssetsMd(
  manifest: Array<{ url: string; path?: string; ok: boolean }>,
  failed: AssetRef[],
): string {
  const lines = ['# Bundled assets', ''];
  const ok = manifest.filter((m) => m.ok);
  if (!ok.length) lines.push('_No assets were successfully bundled._');
  ok.forEach((m) => lines.push(`- \`${m.path}\` ← ${m.url}`));
  if (failed.length) {
    lines.push('', '## Failed downloads');
    lines.push('These URLs could not be fetched (CORS, 404, or timeout). Use the original URL:');
    failed.forEach((f) => lines.push(`- ${f.url}`));
  }
  return lines.join('\n');
}

/* ---------- Export ---------- */

export interface ExportOptions {
  embedAssets?: boolean;
  onProgress?: (done: number, total: number) => void;
}

export async function exportGuideAsClaudeSkill(
  guide: AnyGuide,
  opts: ExportOptions = {},
): Promise<{ blob: Blob; filename: string; folder: string; bundled: number; failed: number }> {
  const kind = (guide as any).type || 'brand';
  const folder = slugify(guide.hero?.name || (guide as any).slug || kind) + '-skill';

  const zip = new JSZip();
  const root = zip.folder(folder)!;

  root.file('SKILL.md', buildSkillMd(guide, kind));
  root.file('README.md', buildReadme(guide, kind));
  root.file('guide.json', JSON.stringify(guide, null, 2));

  const refs = root.folder('references')!;
  refs.file('overview.md', buildOverview(guide, kind));
  refs.file('colors.md', buildColors(guide));
  refs.file('typography.md', buildTypography(guide));
  refs.file('logos.md', buildLogos(guide));
  refs.file('voice-and-messaging.md', buildVoice(guide));
  refs.file('imagery.md', buildImagery(guide));
  refs.file('assets.md', buildAssets(guide));

  let bundled = 0;
  let failedCount = 0;
  if (opts.embedAssets) {
    const refsList = collectAssetRefs(guide);
    const { manifest, failed } = await bundleAssets(root, refsList, opts.onProgress);
    bundled = manifest.filter((m) => m.ok).length;
    failedCount = failed.length;
    refs.file('bundled-assets.md', buildBundledAssetsMd(manifest, failed));
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  return { blob, filename: `${folder}.zip`, folder, bundled, failed: failedCount };
}

export async function downloadGuideAsClaudeSkill(
  guide: AnyGuide,
  opts: ExportOptions = {},
): Promise<{ bundled: number; failed: number }> {
  const { blob, filename, bundled, failed } = await exportGuideAsClaudeSkill(guide, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { bundled, failed };
}

