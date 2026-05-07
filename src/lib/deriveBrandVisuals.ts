/**
 * Derive a BrandVisualsBundle from existing brand/product/event guide data.
 *
 * The Layout Templates feature requires assets tagged with an
 * ExpressionState (Foundation / Collaborate / Transform). Most brands don't
 * curate that bundle manually — so we synthesize it from what they already have:
 *   - hero cover image / video
 *   - imagery library
 *   - patterns
 *   - gradients
 *   - logos (used sparingly, mostly as Foundation marks)
 *
 * Heuristic mapping:
 *   - Foundation  → calm, hero, primary anchors  (hero cover, logos, "foundation"/"hero" tagged imagery)
 *   - Collaborate → people, partnership, intersecting visuals  (patterns, "collab"/"orbs"/"merge" imagery)
 *   - Transform   → motion, gradients, energy   (gradients, video, "streak"/"flow"/"transform" imagery)
 *
 * If the explicit guide_data.brandVisuals bundle exists, callers should
 * prefer that and only use the derived bundle as a fallback.
 */

import type {
  BrandVisualsBundle,
  BrandStaticAsset,
  BrandMotionAsset,
  ExpressionState,
} from './brandLayoutTemplates';

interface DeriveSource {
  brandSlug?: string;
  hero?: { coverImage?: string; coverVideo?: string; useVideo?: boolean; name?: string };
  logos?: Array<{ id?: string; url?: string; name?: string; variant?: string }>;
  imagery?: Array<{ id?: string; url?: string; imageUrl?: string; name?: string; title?: string; description?: string; category?: string; pillar?: string; tags?: string[] }>;
  patterns?: Array<{ id?: string; url?: string; name?: string }>;
  gradients?: Array<{ id?: string; name?: string; css?: string; preview?: string; previewImage?: string }>;
  approvedImagery?: { sections?: Array<{ name?: string; images?: Array<{ url?: string; tags?: string[] }> }> };
}

const collabKeywords = ['collab', 'orb', 'merge', 'partner', 'connect', 'intersect', 'union', 'team', 'materiality'];
const transformKeywords = ['transform', 'streak', 'flow', 'motion', 'aurora', 'rhythm', 'energy', 'momentum', 'wave', 'gradient'];
const foundationKeywords = ['foundation', 'hero', 'primary', 'core', 'anchor', 'identity', 'mark'];

/** Items that depict realistic human photography — these belong to a separate
 *  imagery system (BrandPhotographyGenerator / humanRealistic preset) and must
 *  NOT populate abstract layout-template slots. */
const HUMAN_PHOTO_PATTERNS = /\b(photo|photography|human|portrait|people|person|face|hand|model)\b/i;
function isHumanPhotography(text: string | undefined): boolean {
  if (!text) return false;
  return HUMAN_PHOTO_PATTERNS.test(text);
}

function pillarToState(pillar: string | undefined): ExpressionState | null {
  if (!pillar) return null;
  const p = pillar.toLowerCase();
  if (p.includes('foundation')) return 'Foundation';
  if (p.includes('transform')) return 'Transform';
  if (p.includes('connect') || p.includes('collab') || p.includes('material')) return 'Collaborate';
  return null;
}

function classifyState(text: string | undefined, fallback: ExpressionState): ExpressionState {
  if (!text) return fallback;
  const t = text.toLowerCase();
  if (collabKeywords.some(k => t.includes(k))) return 'Collaborate';
  if (transformKeywords.some(k => t.includes(k))) return 'Transform';
  if (foundationKeywords.some(k => t.includes(k))) return 'Foundation';
  return fallback;
}

function guessAspect(url: string | undefined): string {
  if (!url) return '16:9';
  const u = url.toLowerCase();
  if (u.includes('vertical') || u.includes('story') || u.includes('9-16')) return '9:16';
  if (u.includes('square') || u.includes('1-1')) return '1:1';
  if (u.includes('ultrawide') || u.includes('30-13')) return '30:13';
  return '16:9';
}

export function deriveBrandVisuals(source: DeriveSource | undefined): BrandVisualsBundle {
  if (!source) return { staticAssets: [], motionAssets: [] };

  const staticAssets: BrandStaticAsset[] = [];
  const motionAssets: BrandMotionAsset[] = [];

  // 1. Hero — Foundation anchor
  if (source.hero?.coverImage) {
    staticAssets.push({
      id: 'derived-hero-cover',
      name: source.hero.name ? `${source.hero.name} hero` : 'Hero cover',
      expressionState: 'Foundation',
      aspectRatio: '16:9',
      imageUrl: source.hero.coverImage,
      description: 'Brand hero cover image',
    });
  }

  // 2. Hero video — Transform motion
  if (source.hero?.coverVideo) {
    motionAssets.push({
      id: 'derived-hero-video',
      name: source.hero.name ? `${source.hero.name} motion` : 'Hero motion',
      expressionState: 'Transform',
      aspectRatio: '16:9',
      videoUrl: source.hero.coverVideo,
      orientation: 'horizontal',
      loop: true,
      autoplay: true,
      muted: true,
    });
  }

  // 3. Imagery — distributed across all three states by pillar/keyword.
  //    Skip human-photography items: they belong to the separate
  //    "Human Realistic" photography system, not the abstract layout slots.
  (source.imagery ?? []).forEach((img, idx) => {
    const url = img.imageUrl || img.url;
    if (!url) return;
    const text = `${img.name ?? ''} ${img.title ?? ''} ${img.description ?? ''} ${(img.tags ?? []).join(' ')}`.trim();
    if (isHumanPhotography(text) || isHumanPhotography(url)) return;
    const fallback: ExpressionState =
      idx % 3 === 0 ? 'Foundation' : idx % 3 === 1 ? 'Collaborate' : 'Transform';
    const state = pillarToState(img.pillar) ?? classifyState(text, fallback);
    staticAssets.push({
      id: `derived-imagery-${img.id ?? idx}`,
      name: img.title || img.name || img.description?.slice(0, 60) || `Brand visual ${idx + 1}`,
      expressionState: state,
      aspectRatio: guessAspect(url),
      imageUrl: url,
      description: img.description,
      tags: img.tags,
    });
  });

  // 4. Approved imagery sections — additional Collaborate / Foundation depth
  (source.approvedImagery?.sections ?? []).forEach((section, sIdx) => {
    (section.images ?? []).forEach((img, iIdx) => {
      if (!img.url) return;
      const text = `${section.name ?? ''} ${(img.tags ?? []).join(' ')}`;
      if (isHumanPhotography(text) || isHumanPhotography(img.url)) return;
      const state = classifyState(text, sIdx % 2 === 0 ? 'Foundation' : 'Collaborate');
      staticAssets.push({
        id: `derived-approved-${sIdx}-${iIdx}`,
        name: section.name || 'Approved visual',
        expressionState: state,
        aspectRatio: guessAspect(img.url),
        imageUrl: img.url,
        tags: img.tags,
      });
    });
  });


  // 5. Patterns — Collaborate (texture, depth, partnership feel)
  (source.patterns ?? []).forEach((p, idx) => {
    if (!p.url) return;
    staticAssets.push({
      id: `derived-pattern-${p.id ?? idx}`,
      name: p.name || `Pattern ${idx + 1}`,
      expressionState: classifyState(p.name, 'Collaborate'),
      aspectRatio: '1:1',
      imageUrl: p.url,
      description: 'Brand pattern',
    });
  });

  // 6. Gradients — Transform (energy, motion). Use preview image if available.
  (source.gradients ?? []).forEach((g, idx) => {
    const url = g.previewImage || g.preview;
    if (!url) return;
    staticAssets.push({
      id: `derived-gradient-${g.id ?? idx}`,
      name: g.name || `Gradient ${idx + 1}`,
      expressionState: 'Transform',
      aspectRatio: '16:9',
      imageUrl: url,
      description: 'Brand gradient surface',
    });
  });

  // 7. Logos — at most 2 SVG/PNG marks contribute as Foundation marks
  (source.logos ?? []).slice(0, 2).forEach((logo, idx) => {
    if (!logo.url) return;
    staticAssets.push({
      id: `derived-logo-${logo.id ?? idx}`,
      name: logo.name || `Logo ${idx + 1}`,
      expressionState: 'Foundation',
      aspectRatio: logo.variant === 'stacked' ? '1:1' : '16:9',
      imageUrl: logo.url,
      description: `Brand ${logo.variant ?? 'primary'} logo`,
    });
  });

  return { staticAssets, motionAssets };
}

/**
 * Use the explicit brandVisuals if it has any assets; otherwise derive one from the source.
 */
export function resolveBrandVisuals(
  explicit: BrandVisualsBundle | undefined,
  source: DeriveSource | undefined,
): BrandVisualsBundle {
  const hasExplicit =
    (explicit?.staticAssets?.length ?? 0) + (explicit?.motionAssets?.length ?? 0) > 0;
  if (hasExplicit) return explicit!;
  return deriveBrandVisuals(source);
}
