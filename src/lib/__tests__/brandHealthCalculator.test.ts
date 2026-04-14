import { describe, it, expect } from 'vitest';
import { calculateBrandHealth } from '../brandHealthCalculator';

// Helper to make minimal guide data
const makeGuide = (overrides: Record<string, unknown> = {}) => ({
  hero: { name: 'Test Brand', tagline: 'Test tagline', description: 'desc', imageUrl: 'img.png', coverImage: 'cover.png', cardImage: 'card.png' },
  ...overrides,
});

describe('brandHealthCalculator', () => {
  // ─── Core Identity ───

  it('scores hero section based on filled fields', () => {
    const result = calculateBrandHealth({ hero: { name: 'X' } });
    const hero = result.breakdown.find(b => b.section === 'hero');
    expect(hero?.completeness).toBe(30); // name only = 0.3

    const full = calculateBrandHealth(makeGuide());
    const heroFull = full.breakdown.find(b => b.section === 'hero');
    expect(heroFull?.completeness).toBe(100);
  });

  it('scores tagline from hero.tagline', () => {
    const r1 = calculateBrandHealth({ hero: { name: 'X' } });
    expect(r1.breakdown.find(b => b.section === 'tagline')?.completeness).toBe(0);

    const r2 = calculateBrandHealth({ hero: { name: 'X', tagline: 'Y' } });
    expect(r2.breakdown.find(b => b.section === 'tagline')?.completeness).toBe(100);
  });

  it('scores identity based on filled fields', () => {
    const r = calculateBrandHealth({ identity: { missionStatement: 'M', visionStatement: 'V', brandPromise: 'P', personality: 'P' } });
    expect(r.breakdown.find(b => b.section === 'identity')?.completeness).toBe(100);
  });

  it('scores values with depth (descriptions)', () => {
    const shallow = calculateBrandHealth({ values: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] });
    expect(shallow.breakdown.find(b => b.section === 'values')?.completeness).toBe(85);

    const deep = calculateBrandHealth({ values: [{ name: 'A', description: 'd' }, { name: 'B', description: 'd' }, { name: 'C', description: 'd' }, { name: 'D' }] });
    expect(deep.breakdown.find(b => b.section === 'values')?.completeness).toBe(100);
  });

  it('scores services with depth', () => {
    const r = calculateBrandHealth({ services: [{ name: 'A', description: 'd' }, { name: 'B', description: 'd' }, { name: 'C' }, { name: 'D' }] });
    expect(r.breakdown.find(b => b.section === 'services')?.completeness).toBe(100);
  });

  // ─── Visual Identity ───

  it('scores colors by count', () => {
    expect(calculateBrandHealth({ colors: ['#fff'] }).breakdown.find(b => b.section === 'colors')?.completeness).toBe(30);
    expect(calculateBrandHealth({ colors: ['#a', '#b', '#c', '#d', '#e', '#f'] }).breakdown.find(b => b.section === 'colors')?.completeness).toBe(100);
  });

  it('scores logos by count', () => {
    expect(calculateBrandHealth({ logos: [{ url: 'a' }] }).breakdown.find(b => b.section === 'logos')?.completeness).toBe(40);
    expect(calculateBrandHealth({ logos: [{ url: 'a' }, { url: 'b' }, { url: 'c' }, { url: 'd' }] }).breakdown.find(b => b.section === 'logos')?.completeness).toBe(100);
  });

  it('scores typography by count', () => {
    expect(calculateBrandHealth({ typography: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }).breakdown.find(b => b.section === 'typography')?.completeness).toBe(100);
  });

  // ─── Generic array sections should NOT fall through incorrectly ───

  it('scores gradients independently from caseStudies', () => {
    const r = calculateBrandHealth({ gradients: [{ id: '1' }, { id: '2' }, { id: '3' }], caseStudies: [] });
    expect(r.breakdown.find(b => b.section === 'gradients')?.completeness).toBe(100);
    expect(r.breakdown.find(b => b.section === 'caseStudies')?.completeness).toBe(0);
  });

  it('scores patterns independently', () => {
    const r = calculateBrandHealth({ patterns: [{ id: '1' }] });
    expect(r.breakdown.find(b => b.section === 'patterns')?.completeness).toBe(40);
  });

  it('scores templates independently', () => {
    const r = calculateBrandHealth({ templates: [{ id: '1' }, { id: '2' }] });
    expect(r.breakdown.find(b => b.section === 'templates')?.completeness).toBe(70);
  });

  it('scores templateSpecs independently', () => {
    const r = calculateBrandHealth({ templateSpecs: [{ id: '1' }] });
    expect(r.breakdown.find(b => b.section === 'templateSpecs')?.completeness).toBe(40);
  });

  it('scores displayBanners independently', () => {
    const r = calculateBrandHealth({ displayBanners: [{ id: '1' }] });
    expect(r.breakdown.find(b => b.section === 'displayBanners')?.completeness).toBe(40);
  });

  it('scores socialIcons independently', () => {
    const r = calculateBrandHealth({ socialIcons: [{ id: '1' }, { id: '2' }, { id: '3' }] });
    expect(r.breakdown.find(b => b.section === 'socialIcons')?.completeness).toBe(100);
  });

  // ─── Digital Collateral (brochures) ───

  it('scores brochures by count', () => {
    expect(calculateBrandHealth({ brochures: [] }).breakdown.find(b => b.section === 'brochures')?.completeness).toBe(0);
    expect(calculateBrandHealth({ brochures: [{ id: '1' }] }).breakdown.find(b => b.section === 'brochures')?.completeness).toBe(40);
    expect(calculateBrandHealth({ brochures: [{ id: '1' }, { id: '2' }, { id: '3' }] }).breakdown.find(b => b.section === 'brochures')?.completeness).toBe(70);
    expect(calculateBrandHealth({ brochures: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }] }).breakdown.find(b => b.section === 'brochures')?.completeness).toBe(100);
  });

  // ─── Case Studies: dedicated + collateral category ───

  it('scores caseStudies from dedicated array', () => {
    const r = calculateBrandHealth({ caseStudies: [{ id: '1', title: 'CS1' }] });
    expect(r.breakdown.find(b => b.section === 'caseStudies')?.completeness).toBe(40);
  });

  it('scores caseStudies from brochures with Case Study category', () => {
    const r = calculateBrandHealth({
      caseStudies: [],
      brochures: [
        { id: '1', category: 'Case Study', title: 'CS from collateral' },
        { id: '2', category: 'Brief', title: 'Not a case study' },
      ],
    });
    expect(r.breakdown.find(b => b.section === 'caseStudies')?.completeness).toBe(40); // 1 case study
  });

  it('combines dedicated caseStudies + brochure Case Study items', () => {
    const r = calculateBrandHealth({
      caseStudies: [{ id: '1' }],
      brochures: [
        { id: '2', category: 'Case Study' },
        { id: '3', category: 'Case Study' },
      ],
    });
    expect(r.breakdown.find(b => b.section === 'caseStudies')?.completeness).toBe(100); // 3 total
  });

  // ─── Presentation Templates with external counts ───

  it('scores presentationTemplates combining guide_data and DB count', () => {
    const r = calculateBrandHealth(
      { presentationTemplates: [{ id: '1' }] },
      null, 'brand', null,
      { presentationTemplatesCount: 2 }
    );
    expect(r.breakdown.find(b => b.section === 'presentationTemplates')?.completeness).toBe(100); // 3 total
  });

  // ─── Entity type filtering ───

  it('excludes event-only sections from brand scoring', () => {
    const r = calculateBrandHealth(makeGuide(), null, 'brand');
    const eventSections = ['eventDetails', 'eventLogos', 'eventSchedule', 'eventSpeakers'];
    for (const s of eventSections) {
      expect(r.breakdown.find(b => b.section === s)).toBeUndefined();
    }
  });

  it('excludes brand-only sections from event scoring', () => {
    const r = calculateBrandHealth(makeGuide(), null, 'event');
    const brandOnly = ['webinars', 'locations', 'revenueData', 'websites', 'signatures', 'qr'];
    for (const s of brandOnly) {
      expect(r.breakdown.find(b => b.section === s)).toBeUndefined();
    }
  });

  it('includes brand-only sections for product scoring', () => {
    const r = calculateBrandHealth(makeGuide({ brochures: [{ id: '1' }] }), null, 'product');
    expect(r.breakdown.find(b => b.section === 'brochures')?.completeness).toBe(40);
  });

  // ─── Hidden sections ───

  it('excludes hidden sections from scoring', () => {
    const r = calculateBrandHealth(makeGuide({ colors: ['#a', '#b', '#c', '#d', '#e', '#f'] }), ['colors']);
    expect(r.breakdown.find(b => b.section === 'colors')).toBeUndefined();
  });

  it('maps sidebar section IDs to weight keys for hidden sections', () => {
    const r = calculateBrandHealth(makeGuide(), ['casestudies']);
    expect(r.breakdown.find(b => b.section === 'caseStudies')).toBeUndefined();
  });

  // ─── Section order whitelist ───

  it('only scores sections in sectionOrder when provided', () => {
    const r = calculateBrandHealth(
      makeGuide({ colors: ['#a', '#b', '#c', '#d'] }),
      null, 'brand',
      ['colors', 'hero'] // only these two
    );
    expect(r.totalSections).toBe(2);
    expect(r.breakdown).toHaveLength(2);
    expect(r.breakdown.map(b => b.section).sort()).toEqual(['colors', 'hero']);
  });

  // ─── Event-specific sections ───

  it('scores eventDetails by filled fields', () => {
    const r = calculateBrandHealth(
      { eventDetails: { eventName: 'E', startDate: '2025-01-01', endDate: '2025-01-02', venue: 'V', location: 'L', tagline: 'T' } },
      null, 'event'
    );
    expect(r.breakdown.find(b => b.section === 'eventDetails')?.completeness).toBe(100);
  });

  it('scores eventSponsors with depth', () => {
    const r = calculateBrandHealth(
      { eventSponsors: [{ name: 'S1', logoUrl: 'l', tier: 'Gold', description: 'd' }, { name: 'S2', logoUrl: 'l', tier: 'Silver', description: 'd' }, { name: 'S3', logoUrl: 'l', tier: 'Bronze', description: 'd' }] },
      null, 'event'
    );
    expect(r.breakdown.find(b => b.section === 'eventSponsors')?.completeness).toBe(100);
  });

  it('scores eventDigitalMaterials aggregating sub-tabs', () => {
    const r = calculateBrandHealth(
      {
        eventDigitalMaterials: [{ id: '1' }, { id: '2' }],
        eventBanners: [{ id: '3' }],
        eventInfographics: [{ id: '4' }],
        eventApplications: [],
        eventSponsorshipMaterials: [{ id: '5' }],
      },
      null, 'event'
    );
    // 5 items, 4 active tabs → full score
    expect(r.breakdown.find(b => b.section === 'eventDigitalMaterials')?.completeness).toBe(100);
  });

  // ─── Overall score ───

  it('returns 0 for null guideData', () => {
    const r = calculateBrandHealth(null);
    expect(r.overallScore).toBe(0);
    expect(r.filledSections).toBe(0);
  });

  it('returns a reasonable score for a well-populated brand', () => {
    const r = calculateBrandHealth(makeGuide({
      identity: { missionStatement: 'M', visionStatement: 'V', brandPromise: 'P', personality: 'P' },
      values: [{ name: 'A', description: 'd' }, { name: 'B', description: 'd' }, { name: 'C', description: 'd' }, { name: 'D', description: 'd' }],
      colors: ['#a', '#b', '#c', '#d', '#e', '#f'],
      typography: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      logos: [{ url: 'a' }, { url: 'b' }, { url: 'c' }, { url: 'd' }],
      services: [{ name: 'A', description: 'd' }, { name: 'B', description: 'd' }, { name: 'C', description: 'd' }, { name: 'D', description: 'd' }],
      social: [{ platform: 'x' }, { platform: 'y' }, { platform: 'z' }, { platform: 'w' }],
    }), null, 'brand');
    expect(r.overallScore).toBeGreaterThan(40);
    expect(r.filledSections).toBeGreaterThan(5);
  });

  // ─── Category scores ───

  it('provides category scores', () => {
    const r = calculateBrandHealth(makeGuide({
      colors: ['#a', '#b', '#c', '#d'],
    }), null, 'brand');
    const visual = r.categoryScores.find(c => c.category === 'Visual Identity');
    expect(visual).toBeDefined();
    expect(visual!.score).toBeGreaterThan(0);
  });
});
