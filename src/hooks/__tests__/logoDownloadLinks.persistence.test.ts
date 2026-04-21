import { describe, it, expect } from 'vitest';
import { dbToBrandGuide, dbToProductGuide } from '../useBrandStorage';
import { normalizeGuide } from '@/lib/guideNormalization';

/**
 * Regression test for the bug where logoDownloadLinks added in the
 * per-logo popup were saved to guide_data but stripped on reload because
 * dbToBrandGuide / dbToProductGuide / normalizeGuide didn't map the field.
 */

const sampleLinks = [
  { id: 'dl-1', label: 'SVG Pack', url: 'https://dl.dropboxusercontent.com/s/abc?dl=1', format: 'SVG', logoId: 'logo-1' },
  { id: 'dl-2', label: 'PNG Pack', url: 'https://dl.dropboxusercontent.com/s/def?dl=1', format: 'PNG', logoId: 'logo-1' },
];

const baseDbRow = {
  id: 'brand-1',
  user_id: 'user-1',
  organization_id: 'org-1',
  name: 'Test Brand',
  slug: 'test-brand',
  is_favorite: false,
  is_public: false,
  share_token: null,
  section_order: null,
  hidden_sections: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('logoDownloadLinks persistence', () => {
  it('preserves logoDownloadLinks when loading a brand from the database', () => {
    const dbBrand = {
      ...baseDbRow,
      guide_data: {
        hero: { name: 'Test Brand', tagline: '', coverImage: '', logoUrl: '' },
        logos: [{ id: 'logo-1', name: 'Primary', url: 'https://example.com/logo.svg', variant: 'primary' }],
        logoDownloadLinks: sampleLinks,
      },
    };

    const guide = dbToBrandGuide(dbBrand as any);
    expect(guide.logoDownloadLinks).toEqual(sampleLinks);
    expect(guide.logoDownloadLinks).toHaveLength(2);
    expect(guide.logoDownloadLinks?.[0].url).toContain('dl.dropboxusercontent.com');
  });

  it('preserves logoDownloadLinks when loading a product from the database', () => {
    const dbProduct = {
      ...baseDbRow,
      parent_brand_id: 'brand-1',
      guide_data: {
        hero: { name: 'Test Product', tagline: '', coverImage: '', logoUrl: '' },
        logos: [],
        logoDownloadLinks: sampleLinks,
      },
    };

    const guide = dbToProductGuide(dbProduct as any);
    expect(guide.logoDownloadLinks).toEqual(sampleLinks);
  });

  it('defaults logoDownloadLinks to [] when missing from guide_data', () => {
    const dbBrand = {
      ...baseDbRow,
      guide_data: { hero: { name: 'Test', tagline: '', coverImage: '', logoUrl: '' } },
    };
    expect(dbToBrandGuide(dbBrand as any).logoDownloadLinks).toEqual([]);
  });

  it('survives a full round-trip: add link → save → reload', () => {
    // Initial: brand has no links
    const initial = dbToBrandGuide({
      ...baseDbRow,
      guide_data: { hero: { name: 'Test', tagline: '', coverImage: '', logoUrl: '' }, logoDownloadLinks: [] },
    } as any);
    expect(initial.logoDownloadLinks).toEqual([]);

    // User adds a link in the logo popup → state updated via spread
    const newLink = { id: 'dl-new', label: 'Brand Pack', url: 'https://dl.dropboxusercontent.com/s/xyz?dl=1', format: 'package', logoId: 'logo-1' };
    const updated = { ...initial, logoDownloadLinks: [...(initial.logoDownloadLinks ?? []), newLink] };

    // Simulate save: guide_data is what gets persisted (id/type/etc stripped)
    const { id, type, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...persisted } = updated as any;

    // Simulate reload from DB
    const reloaded = dbToBrandGuide({ ...baseDbRow, guide_data: persisted } as any);
    expect(reloaded.logoDownloadLinks).toHaveLength(1);
    expect(reloaded.logoDownloadLinks?.[0]).toMatchObject(newLink);
  });

  it('normalizeGuide (public/legacy load path) also preserves logoDownloadLinks', () => {
    const raw = {
      id: 'brand-1',
      type: 'brand',
      hero: { name: 'Test', tagline: '', coverImage: '', logoUrl: '' },
      logos: [],
      logoDownloadLinks: sampleLinks,
    };
    const normalized = normalizeGuide(raw) as any;
    expect(normalized.logoDownloadLinks).toEqual(sampleLinks);
  });
});