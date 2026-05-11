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
import { supabase } from '@/integrations/supabase/client';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

interface IntelligenceBundle {
  brandIntelligence?: any | null;
  entityContext?: any | null;
  oracleIntelligence?: any | null;
  oracleKnowledge?: any[] | null;
  competitiveReports?: any[] | null;
  researchBriefings?: any[] | null;
}

async function fetchIntelligenceBundle(guide: AnyGuide): Promise<IntelligenceBundle> {
  const kind = (guide as any).type || 'brand';
  const entityType = kind === 'product' ? 'product' : kind === 'event' ? 'event' : 'brand';
  const entityId = guide.id;
  const orgId = (guide as any).organizationId || (guide as any).organization_id || null;
  const tableName = kind === 'product' ? 'products' : kind === 'event' ? 'events' : 'brands';

  const out: IntelligenceBundle = {};

  const safe = async <T,>(p: Promise<any> | any, assign: (v: any) => void) => {
    try { const r = await p; assign(r?.data ?? r); } catch { /* ignore */ }
  };

  const tasks: Promise<any>[] = [
    safe(
      supabase.from('brand_intelligence').select('*')
        .eq('entity_type', entityType).eq('entity_id', entityId).maybeSingle(),
      (v) => { out.brandIntelligence = v; },
    ),
    safe(
      supabase.rpc('get_entity_text_context', { p_table: tableName, p_id: entityId }),
      (v) => { out.entityContext = v; },
    ),
    safe(
      supabase.from('competitive_analysis_reports').select('*')
        .eq('entity_id', entityId).order('created_at', { ascending: false }).limit(5),
      (v) => { out.competitiveReports = Array.isArray(v) ? v : []; },
    ),
    safe(
      supabase.from('research_briefings').select('*')
        .eq('entity_id', entityId).order('created_at', { ascending: false }).limit(5),
      (v) => { out.researchBriefings = Array.isArray(v) ? v : []; },
    ),
  ];

  if (orgId) {
    tasks.push(
      safe(
        supabase.from('oracle_intelligence').select('*')
          .eq('organization_id', orgId).maybeSingle(),
        (v) => { out.oracleIntelligence = v; },
      ),
      safe(
        supabase.from('oracle_knowledge_base').select('*')
          .eq('organization_id', orgId).eq('is_active', true)
          .order('created_at', { ascending: false }).limit(200),
        (v) => { out.oracleKnowledge = Array.isArray(v) ? v : []; },
      ),
    );
  }

  await Promise.all(tasks);
  return out;
}

function buildBrandIntelligenceMd(bi: any | null | undefined, ctx: any | null | undefined): string {
  const lines = ['# Brand Brain (Intelligence)', ''];
  if (!bi && !ctx) {
    lines.push('_No intelligence has been synthesized for this entity yet._');
    return lines.join('\n');
  }
  if (bi?.brand_summary) lines.push('## Summary', bi.brand_summary, '');
  if (bi?.market_position) lines.push('## Market Position', bi.market_position, '');
  if (bi?.target_audience) lines.push('## Target Audience', '```json', JSON.stringify(bi.target_audience, null, 2), '```', '');
  if (Array.isArray(bi?.competitive_advantages) && bi.competitive_advantages.length) {
    lines.push('## Competitive Advantages');
    bi.competitive_advantages.forEach((c: any) => lines.push(`- ${typeof c === 'string' ? c : c?.title || c?.text || JSON.stringify(c)}`));
    lines.push('');
  }
  if (bi?.brand_voice_profile) lines.push('## Voice Profile', '```json', JSON.stringify(bi.brand_voice_profile, null, 2), '```', '');
  if (Array.isArray(bi?.growth_recommendations) && bi.growth_recommendations.length) {
    lines.push('## Growth Recommendations');
    bi.growth_recommendations.forEach((r: any) => lines.push(`- ${typeof r === 'string' ? r : r?.title || r?.text || JSON.stringify(r)}`));
    lines.push('');
  }
  if (bi?.cultural_insights && Object.keys(bi.cultural_insights).length) {
    lines.push('## Cultural Insights', '```json', JSON.stringify(bi.cultural_insights, null, 2), '```', '');
  }
  if (Array.isArray(bi?.globallink_recommendations) && bi.globallink_recommendations.length) {
    lines.push('## Localization Recommendations');
    bi.globallink_recommendations.forEach((r: any) => lines.push(`- ${typeof r === 'string' ? r : JSON.stringify(r)}`));
    lines.push('');
  }
  if (bi?.regional_adaptations && Object.keys(bi.regional_adaptations).length) {
    lines.push('## Regional Adaptations', '```json', JSON.stringify(bi.regional_adaptations, null, 2), '```', '');
  }
  if (bi?.bias_awareness_profile && Object.keys(bi.bias_awareness_profile).length) {
    lines.push('## Bias Awareness', '```json', JSON.stringify(bi.bias_awareness_profile, null, 2), '```', '');
  }
  if (bi?.competitive_landscape) {
    lines.push('## Competitive Landscape', '```json', JSON.stringify(bi.competitive_landscape, null, 2), '```', '');
  }
  if (ctx) {
    lines.push('## Aggregated Entity Context', '');
    lines.push('Structured context assembled from this guide for AI consumption:', '');
    lines.push('```json', JSON.stringify(ctx, null, 2), '```');
  }
  return lines.join('\n');
}

function buildOracleMd(oracle: any | null | undefined, knowledge: any[] | null | undefined): string {
  const lines = ['# Oracle Intelligence (Organization Brain)', ''];
  if (!oracle && (!knowledge || !knowledge.length)) {
    lines.push('_No Oracle synthesis available for this organization._');
    return lines.join('\n');
  }
  if (oracle?.org_summary) lines.push('## Organization Summary', oracle.org_summary, '');
  if (oracle?.portfolio_analysis) lines.push('## Portfolio Analysis', '```json', JSON.stringify(oracle.portfolio_analysis, null, 2), '```', '');
  if (oracle?.market_landscape) lines.push('## Market Landscape', '```json', JSON.stringify(oracle.market_landscape, null, 2), '```', '');
  if (Array.isArray(oracle?.strategic_recommendations) && oracle.strategic_recommendations.length) {
    lines.push('## Strategic Recommendations');
    oracle.strategic_recommendations.forEach((r: any) => {
      lines.push(`- **${r.title || 'Recommendation'}**${r.priority ? ` _(${r.priority})_` : ''}: ${r.description || ''}`);
    });
    lines.push('');
  }
  if (oracle?.unified_voice_profile) lines.push('## Unified Voice Profile', '```json', JSON.stringify(oracle.unified_voice_profile, null, 2), '```', '');
  if (oracle?.unified_audience_map) lines.push('## Unified Audience Map', '```json', JSON.stringify(oracle.unified_audience_map, null, 2), '```', '');
  if (oracle?.competitive_overview) lines.push('## Competitive Overview', '```json', JSON.stringify(oracle.competitive_overview, null, 2), '```', '');
  if (oracle?.cultural_readiness) lines.push('## Cultural Readiness', '```json', JSON.stringify(oracle.cultural_readiness, null, 2), '```', '');
  if (oracle?.cross_entity_patterns) lines.push('## Cross-Entity Patterns', '```json', JSON.stringify(oracle.cross_entity_patterns, null, 2), '```', '');
  if (knowledge && knowledge.length) {
    lines.push(`## Knowledge Base (${knowledge.length} entries)`, '');
    knowledge.forEach((k: any) => {
      lines.push(`### ${k.title || 'Entry'}`);
      if (k.tags?.length) lines.push(`_Tags: ${k.tags.join(', ')}_`);
      if (k.content) lines.push('', k.content, '');
    });
  }
  return lines.join('\n');
}

function buildResearchMd(reports: any[] | null | undefined, briefings: any[] | null | undefined): string {
  const lines = ['# Research & Competitive Reports', ''];
  if ((!reports || !reports.length) && (!briefings || !briefings.length)) {
    lines.push('_No research or competitive reports available._');
    return lines.join('\n');
  }
  if (reports && reports.length) {
    lines.push('## Competitive Analysis Reports', '');
    reports.forEach((r: any) => {
      lines.push(`### ${r.competitor_name || r.title || 'Report'} — ${new Date(r.created_at).toLocaleDateString()}`);
      if (r.summary) lines.push(r.summary);
      if (r.report_data) lines.push('', '```json', JSON.stringify(r.report_data, null, 2), '```');
      lines.push('');
    });
  }
  if (briefings && briefings.length) {
    lines.push('## Research Briefings', '');
    briefings.forEach((b: any) => {
      lines.push(`### ${b.title || b.topic || 'Briefing'} — ${new Date(b.created_at).toLocaleDateString()}`);
      if (b.summary) lines.push(b.summary);
      if (b.briefing_data) lines.push('', '```json', JSON.stringify(b.briefing_data, null, 2), '```');
      lines.push('');
    });
  }
  return lines.join('\n');
}

const slugify = (s: string) =>
  (s || 'guide')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

/**
 * Build a Claude-Skill-compliant `name`:
 *  - lowercase letters/numbers/hyphens only
 *  - <= 64 chars
 *  - cannot contain reserved words "anthropic" / "claude"
 *  - prefer gerund form (using-<brand>-brand) for discovery
 */
function buildSkillName(displayName: string, kind: string): string {
  const base = slugify(displayName)
    .replace(/anthropic/g, 'a-corp')
    .replace(/claude/g, 'guide');
  const prefix = 'using-';
  const suffix = `-${kind}`;
  const allowed = 64 - prefix.length - suffix.length;
  return `${prefix}${base.slice(0, allowed)}${suffix}`.replace(/-+/g, '-').slice(0, 64);
}

/**
 * Build a Claude-Skill-compliant `description`:
 *  - third-person
 *  - <= 1024 chars
 *  - includes WHAT and WHEN
 *  - YAML-safe (escape quotes, strip newlines)
 */
function buildSkillDescription(displayName: string, kind: string, tagline: string, triggers: string[]): string {
  const what =
    `Official ${displayName} ${kind} brand system. ` +
    `Provides approved colors (HEX/RGB/CMYK/Pantone), typography, logo variants, ` +
    `voice and tone rules, imagery direction, do/don't lists, and strategic ` +
    `intelligence (audience, market, competitive landscape).`;
  const when =
    `Use when generating, reviewing, or critiquing any artifact for ${displayName} — ` +
    `including copy, slogans, social posts, ads, decks, web pages, emails, ` +
    `print collateral, or visuals — or when the user mentions ${triggers.join(', ')}.`;
  const tail = tagline ? ` Tagline: "${tagline.replace(/"/g, "'")}".` : '';
  return `${what} ${when}${tail}`.replace(/\s+/g, ' ').trim().slice(0, 1024);
}

const fence = (lang: string, body: string) => '```' + lang + '\n' + body + '\n```';

const safeArr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

function buildSkillMd(guide: AnyGuide, kind: string, hasIntel: boolean, hasAntiPatterns: boolean): string {
  const displayName = guide.hero?.name || 'Untitled';
  const tagline = guide.hero?.tagline || '';
  const name = buildSkillName(displayName, kind);

  // Discovery triggers — keywords Claude will match user intent against
  const triggers = [
    displayName.toLowerCase(),
    `${displayName.toLowerCase()} brand`,
    `${displayName.toLowerCase()} ${kind}`,
    'brand guidelines',
    'visual identity',
    'on-brand copy',
    'brand colors',
    'brand voice',
  ];
  const description = buildSkillDescription(displayName, kind, tagline, triggers);

  // Inline quick-reference so Claude can answer trivial questions
  // without opening reference files (per Anthropic's "concise is key").
  const colors = safeArr((guide as any).colors).slice(0, 6);
  const fonts = safeArr((guide as any).typography).slice(0, 4);
  const voice: any = (guide as any).voice || {};
  const dos = safeArr(voice.dos).slice(0, 4);
  const donts = safeArr(voice.donts).slice(0, 4);

  const quickColors = colors.length
    ? colors.map((c: any) => `- ${c.name || c.role || 'Color'}: \`${c.hex}\`${c.role ? ` (${c.role})` : ''}`).join('\n')
    : '_See `references/colors.md`._';
  const quickFonts = fonts.length
    ? fonts.map((f: any) => `- ${f.role || 'Font'}: **${f.fontFamily || f.name}**${f.weight ? ` ${f.weight}` : ''}`).join('\n')
    : '_See `references/typography.md`._';
  const quickDos = dos.length
    ? dos.map((x: any) => `- ${typeof x === 'string' ? x : x?.text || ''}`).join('\n')
    : '';
  const quickDonts = donts.length
    ? donts.map((x: any) => `- ${typeof x === 'string' ? x : x?.text || ''}`).join('\n')
    : '';

  return `---
name: ${name}
description: ${JSON.stringify(description)}
version: 1.0.0
generated_at: ${new Date().toISOString()}
entity_type: ${kind}
entity_name: ${JSON.stringify(displayName)}
---

# ${displayName} — ${kind[0].toUpperCase() + kind.slice(1)} Brand Skill

${tagline ? `> ${tagline}\n` : ''}
This skill encodes the official brand system for **${displayName}**. Apply it
whenever generating, reviewing, or critiquing any artifact that represents
the brand.

## When to use this skill
- The user mentions "${displayName}" or any of its products/events.
- The user asks for on-brand copy, taglines, social posts, ads, or visuals.
- The user requests color, typography, logo, voice, or imagery guidance.
- The user reviews or critiques content for brand consistency.

## Quick reference (inline — no file load needed)

### Primary colors
${quickColors}

### Typography
${quickFonts}
${quickDos ? `\n### Do\n${quickDos}` : ''}${quickDonts ? `\n\n### Don't\n${quickDonts}` : ''}

## Reference files (load on demand)
- \`references/overview.md\` — positioning, mission, vision, archetype, values
- \`references/colors.md\` — full palette + approved combinations
- \`references/typography.md\` — complete type system + downloads
- \`references/logos.md\` — variants, clearspace, download links
- \`references/voice-and-messaging.md\` — tone, personality, full do/don't, taglines
- \`references/imagery.md\` — approved imagery direction and examples
- \`references/assets.md\` — brochures, case studies, patterns, gradients, icons${hasAntiPatterns ? '\n- `references/anti-patterns.md` — explicitly forbidden patterns and misuse examples' : ''}
- \`guide.json\` — full structured payload for programmatic lookup${hasIntel ? `
- \`intelligence/brand-brain.md\` — synthesized brand intelligence + entity context
- \`intelligence/oracle.md\` — organization-wide Oracle intelligence + knowledge base
- \`intelligence/research-and-competitive.md\` — research briefings + competitive reports
- \`intelligence/intelligence.json\` — full structured intelligence payload` : ''}

## Hard rules (low-freedom — do NOT deviate)
1. **Colors:** Use ONLY HEX values listed in \`references/colors.md\`. Never invent, tint, shade, or "close enough" approximate.
2. **Typography:** Use ONLY font families in \`references/typography.md\`. No substitutions (no "Arial as a fallback for X").
3. **Logos:** Use ONLY approved variants from \`references/logos.md\`. Never recolor, stretch, rotate, add effects, or place on disallowed backgrounds.
4. **Voice:** Match the tone and personality in \`references/voice-and-messaging.md\`. Respect every Do/Don't.
5. **Imagery:** Only use imagery matching the direction in \`references/imagery.md\`.${hasAntiPatterns ? '\n6. **Anti-patterns:** Review `references/anti-patterns.md` — these patterns are explicitly forbidden.' : ''}

## Pre-flight checklist (run before delivering any artifact)
- [ ] Every color is from the approved palette
- [ ] Every font is from the approved type system
- [ ] Logo (if any) is an approved variant, untouched
- [ ] Tone matches the voice profile
- [ ] No items from the Don't list appear
- [ ] Imagery matches approved direction
`;
}

function buildAntiPatterns(guide: AnyGuide): string {
  const aps = safeArr((guide as any).antiPatterns);
  const lines = ['# Anti-patterns (forbidden)', '', 'These patterns are explicitly forbidden by the brand. Reject or rewrite content that uses them.', ''];
  if (!aps.length) return lines.concat(['_No anti-patterns explicitly defined._']).join('\n');
  aps.forEach((p: any) => {
    lines.push(`## ${p.name || p.title || 'Anti-pattern'}`);
    if (p.description) lines.push(p.description);
    if (p.example) lines.push(`\n_Example:_ ${p.example}`);
    if (p.reason) lines.push(`\n_Why:_ ${p.reason}`);
    lines.push('');
  });
  return lines.join('\n');
}

function buildManifest(guide: AnyGuide, kind: string, includedFiles: string[]): string {
  const displayName = guide.hero?.name || 'Untitled';
  const lines = [
    `# Manifest — ${displayName}`,
    '',
    `Type: **${kind}**`,
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Files in this skill',
    '',
    ...includedFiles.map((f) => `- \`${f}\``),
  ];
  return lines.join('\n');
}

function buildOverview(guide: AnyGuide, kind: string): string {
  const h = guide.hero || ({} as any);
  const id: any = (guide as any).identity || {};
  const lines: string[] = [];
  lines.push(`# Overview — ${h.name || ''}`);
  if (h.tagline) lines.push(`\n_${h.tagline}_\n`);
  lines.push('## Table of contents');
  lines.push('- Identity (mission, vision, positioning, archetype)');
  lines.push('- Values');
  lines.push('');
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
  category:
    | 'logos'
    | 'imagery'
    | 'approved-imagery'
    | 'image-library'
    | 'icons'
    | 'patterns'
    | 'gradients'
    | 'brochures'
    | 'case-studies'
    | 'presentations'
    | 'templates'
    | 'pdf-thumbnails'
    | 'fonts'
    | 'hero'
    | 'misc';
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

  // Hero / cover
  const hero: any = (guide as any).hero || {};
  [hero.coverImage, hero.cardImage, hero.backgroundImage, hero.videoUrl].forEach((u) => {
    if (u && /^https?:\/\//i.test(u)) out.push({ url: u, category: 'hero', name: 'hero' });
  });

  push('logos', safeArr((guide as any).logos), [(a) => a.url]);
  push('imagery', safeArr((guide as any).imagery), [(a) => a.url]);

  // Approved imagery sections (full curated visual identity)
  const approvedSections = safeArr((guide as any).approvedImagery?.sections);
  approvedSections.forEach((s: any) => {
    safeArr(s?.images).forEach((img: any) => {
      const url = img?.url;
      if (url && /^https?:\/\//i.test(url)) {
        out.push({ url, category: 'approved-imagery', name: `${s?.name || 'section'}-${img?.name || ''}` });
      }
    });
  });

  // Image library / image assets
  push('image-library', safeArr((guide as any).imageAssets), [(a) => a.url || a.thumbnailUrl]);

  push('icons', safeArr((guide as any).brandIcons), [(a) => a.url || a.svgUrl]);
  push('icons', safeArr((guide as any).socialIcons), [(a) => a.url]);
  push('patterns', safeArr((guide as any).patterns), [(a) => a.url || a.imageUrl]);
  push('gradients', safeArr((guide as any).gradients), [(a) => a.url || a.imageUrl]);

  // Brochures: include both the PDF file AND its thumbnail
  safeArr((guide as any).brochures).forEach((b: any) => {
    const file = b?.fileUrl || b?.url;
    if (file && /^https?:\/\//i.test(file)) out.push({ url: file, category: 'brochures', name: b?.title });
    const thumb = b?.thumbnailUrl || b?.previewUrl;
    if (thumb && /^https?:\/\//i.test(thumb) && thumb !== file) {
      out.push({ url: thumb, category: 'pdf-thumbnails', name: `${b?.title || 'brochure'}-thumb` });
    }
  });

  // Case studies: PDF + cover image
  safeArr((guide as any).caseStudies).forEach((c: any) => {
    const file = c?.fileUrl || c?.url;
    if (file && /^https?:\/\//i.test(file)) out.push({ url: file, category: 'case-studies', name: c?.title });
    const img = c?.imageUrl || c?.coverImage || c?.thumbnailUrl;
    if (img && /^https?:\/\//i.test(img) && img !== file) {
      out.push({ url: img, category: 'case-studies', name: `${c?.title || 'case-study'}-cover` });
    }
  });

  // Presentation templates: file + slide thumbnails
  safeArr((guide as any).presentationTemplates).forEach((p: any) => {
    const file = p?.fileUrl || p?.url;
    if (file && /^https?:\/\//i.test(file)) out.push({ url: file, category: 'presentations', name: p?.name });
    const thumb = p?.cardImageUrl || p?.thumbnailUrl;
    if (thumb && /^https?:\/\//i.test(thumb) && thumb !== file) {
      out.push({ url: thumb, category: 'pdf-thumbnails', name: `${p?.name || 'deck'}-thumb` });
    }
    safeArr(p?.slides).forEach((s: any, i: number) => {
      const sthumb = s?.thumbnailUrl || s?.imageUrl;
      if (sthumb && /^https?:\/\//i.test(sthumb)) {
        out.push({ url: sthumb, category: 'pdf-thumbnails', name: `${p?.name || 'deck'}-slide-${i + 1}` });
      }
    });
  });

  // Templates (digital collateral)
  safeArr((guide as any).templates).forEach((t: any) => {
    const file = t?.fileUrl || t?.url;
    if (file && /^https?:\/\//i.test(file)) out.push({ url: file, category: 'templates', name: t?.name });
    const thumb = t?.thumbnailUrl;
    if (thumb && /^https?:\/\//i.test(thumb) && thumb !== file) {
      out.push({ url: thumb, category: 'pdf-thumbnails', name: `${t?.name || 'template'}-thumb` });
    }
  });

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
  includeIntelligence?: boolean;
  /** Skip the pre-export validator (NOT recommended). */
  skipValidation?: boolean;
  onProgress?: (done: number, total: number) => void;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
}

export class ClaudeSkillValidationError extends Error {
  issues: ValidationIssue[];
  report: string;
  constructor(issues: ValidationIssue[], report: string) {
    super(`Claude Skill export blocked: ${issues.filter(i => i.severity === 'error').length} error(s).`);
    this.name = 'ClaudeSkillValidationError';
    this.issues = issues;
    this.report = report;
  }
}

const RESERVED_FRONTMATTER_WORDS = ['anthropic', 'claude'];
const BANNED_CONTENT_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i, label: 'private key' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key' },
  { re: /sk-[a-zA-Z0-9]{20,}/, label: 'OpenAI-style secret key' },
  { re: /eyJhbGciOi[A-Za-z0-9_=-]{20,}\.[A-Za-z0-9_=-]{20,}\.[A-Za-z0-9_.+/=-]{10,}/, label: 'JWT token' },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
  { re: /<script\b[^>]*>[\s\S]*?<\/script>/i, label: 'inline <script> tag' },
];

async function validateSkillZip(
  root: JSZip,
  guide: AnyGuide,
  kind: string,
  hasIntel: boolean,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const push = (severity: 'error' | 'warning', code: string, message: string, path?: string) =>
    issues.push({ severity, code, message, path });

  const required = [
    'SKILL.md',
    'README.md',
    'guide.json',
    'references/overview.md',
    'references/colors.md',
    'references/typography.md',
    'references/logos.md',
    'references/voice-and-messaging.md',
    'references/imagery.md',
    'references/assets.md',
  ];
  if (hasIntel) {
    required.push(
      'intelligence/brand-brain.md',
      'intelligence/oracle.md',
      'intelligence/research-and-competitive.md',
      'intelligence/intelligence.json',
    );
  }
  for (const path of required) {
    if (!root.file(path)) push('error', 'missing_file', 'Required file is missing.', path);
  }

  const skillFile = root.file('SKILL.md');
  if (skillFile) {
    const md = await skillFile.async('string');
    const fm = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (!fm) {
      push('error', 'frontmatter_missing', 'SKILL.md has no YAML frontmatter block.', 'SKILL.md');
    } else {
      const fmBody = fm[1];
      const nameMatch = fmBody.match(/^name:\s*(.+)$/m);
      const descMatch = fmBody.match(/^description:\s*(.+)$/m);

      if (!nameMatch) {
        push('error', 'frontmatter_name_missing', 'Frontmatter `name` is required.', 'SKILL.md');
      } else {
        const name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
        if (!name) push('error', 'name_empty', '`name` cannot be empty.', 'SKILL.md');
        if (name.length > 64) push('error', 'name_too_long', `\`name\` exceeds 64 chars (${name.length}).`, 'SKILL.md');
        if (!/^[a-z0-9-]+$/.test(name)) push('error', 'name_invalid_chars', `\`name\` must be lowercase letters/numbers/hyphens only. Got: "${name}".`, 'SKILL.md');
        if (/<[^>]+>/.test(name)) push('error', 'name_xml', '`name` cannot contain XML tags.', 'SKILL.md');
        for (const r of RESERVED_FRONTMATTER_WORDS) {
          if (name.toLowerCase().includes(r)) push('error', 'name_reserved', `\`name\` cannot contain reserved word "${r}".`, 'SKILL.md');
        }
      }

      if (!descMatch) {
        push('error', 'frontmatter_description_missing', 'Frontmatter `description` is required.', 'SKILL.md');
      } else {
        let desc = descMatch[1].trim();
        try { if (/^".*"$/s.test(desc)) desc = JSON.parse(desc); } catch { /* keep raw */ }
        if (!desc) push('error', 'description_empty', '`description` cannot be empty.', 'SKILL.md');
        if (desc.length > 1024) push('error', 'description_too_long', `\`description\` exceeds 1024 chars (${desc.length}).`, 'SKILL.md');
        if (/<[^>]+>/.test(desc)) push('error', 'description_xml', '`description` cannot contain XML tags.', 'SKILL.md');
        if (/\b(I can|I will|I'll|you can use|we can)\b/i.test(desc)) {
          push('warning', 'description_not_third_person', '`description` should be in third person.', 'SKILL.md');
        }
      }
    }

    const bodyLines = md.split('\n').length;
    if (bodyLines > 500) push('warning', 'skill_md_too_long', `SKILL.md is ${bodyLines} lines (recommended < 500).`, 'SKILL.md');
  }

  if (!guide.hero?.name) push('error', 'guide_missing_name', 'Guide is missing `hero.name`.', 'guide.json');
  if (!['brand', 'product', 'event'].includes(kind)) push('warning', 'unknown_kind', `Unrecognized guide kind "${kind}".`);
  if (safeArr((guide as any).colors).length === 0) push('warning', 'no_colors', 'Guide defines no colors.', 'references/colors.md');
  if (safeArr((guide as any).typography).length === 0) push('warning', 'no_typography', 'Guide defines no typography.', 'references/typography.md');
  if (safeArr((guide as any).logos).length === 0) push('warning', 'no_logos', 'Guide defines no logos.', 'references/logos.md');

  const textPaths: string[] = [];
  root.forEach((relPath, entry) => {
    if (entry.dir) return;
    if (/\.(md|json|txt|yml|yaml)$/i.test(relPath)) textPaths.push(relPath);
  });
  for (const relPath of textPaths) {
    const f = root.file(relPath);
    if (!f) continue;
    const text = await f.async('string');
    for (const { re, label } of BANNED_CONTENT_PATTERNS) {
      if (re.test(text)) push('error', 'banned_content', `Detected banned content: ${label}.`, relPath);
    }
  }

  let fileCount = 0;
  root.forEach((_p, entry) => { if (!entry.dir) fileCount++; });
  if (fileCount > 5000) push('error', 'too_many_files', `Skill contains ${fileCount} files (max 5000).`);
  if (fileCount < required.length) push('error', 'too_few_files', `Skill contains only ${fileCount} files (expected ≥ ${required.length}).`);

  return issues;
}

function formatValidationReport(issues: ValidationIssue[]): string {
  if (!issues.length) return 'All checks passed.';
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const lines: string[] = [];
  lines.push(`Claude Skill validation: ${errors.length} error(s), ${warnings.length} warning(s)`, '');
  if (errors.length) {
    lines.push('ERRORS (block export):');
    errors.forEach((i) => lines.push(`  • [${i.code}] ${i.path ? `${i.path} — ` : ''}${i.message}`));
    lines.push('');
  }
  if (warnings.length) {
    lines.push('WARNINGS:');
    warnings.forEach((i) => lines.push(`  • [${i.code}] ${i.path ? `${i.path} — ` : ''}${i.message}`));
  }
  return lines.join('\n');
}

export async function exportGuideAsClaudeSkill(
  guide: AnyGuide,
  opts: ExportOptions = {},
): Promise<{ blob: Blob; filename: string; folder: string; bundled: number; failed: number }> {
  const kind = (guide as any).type || 'brand';
  const folder = slugify(guide.hero?.name || (guide as any).slug || kind) + '-skill';
  const includeIntel = opts.includeIntelligence !== false;

  const zip = new JSZip();
  const root = zip.folder(folder)!;

  // Fetch intelligence in parallel with zip scaffolding
  const intelPromise = includeIntel ? fetchIntelligenceBundle(guide) : Promise.resolve({} as IntelligenceBundle);

  const hasAntiPatterns = safeArr((guide as any).antiPatterns).length > 0;
  const hasIntel = includeIntel;

  root.file('SKILL.md', buildSkillMd(guide, kind, hasIntel, hasAntiPatterns));
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
  if (hasAntiPatterns) refs.file('anti-patterns.md', buildAntiPatterns(guide));

  const intel = await intelPromise;
  if (includeIntel) {
    const intelDir = root.folder('intelligence')!;
    intelDir.file('brand-brain.md', buildBrandIntelligenceMd(intel.brandIntelligence, intel.entityContext));
    intelDir.file('oracle.md', buildOracleMd(intel.oracleIntelligence, intel.oracleKnowledge));
    intelDir.file('research-and-competitive.md', buildResearchMd(intel.competitiveReports, intel.researchBriefings));
    intelDir.file('intelligence.json', JSON.stringify(intel, null, 2));
  }

  let bundled = 0;
  let failedCount = 0;
  if (opts.embedAssets) {
    const refsList = collectAssetRefs(guide);
    const { manifest, failed } = await bundleAssets(root, refsList, opts.onProgress);
    bundled = manifest.filter((m) => m.ok).length;
    failedCount = failed.length;
    refs.file('bundled-assets.md', buildBundledAssetsMd(manifest, failed));
  }


  // Write the manifest before validation so it appears in required-file scans
  const includedFiles: string[] = [];
  zip.folder(folder)!.forEach((relPath) => { includedFiles.push(relPath); });
  root.file('MANIFEST.md', buildManifest(guide, kind, includedFiles.sort()));

  // Pre-export validation — fail loudly with a clear report
  if (!opts.skipValidation) {
    const issues = await validateSkillZip(root, guide, kind, includeIntel);
    const report = formatValidationReport(issues);
    root.file('VALIDATION.md', report);
    const hasErrors = issues.some(i => i.severity === 'error');
    if (hasErrors) throw new ClaudeSkillValidationError(issues, report);
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

