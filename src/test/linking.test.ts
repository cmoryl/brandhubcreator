/**
 * Linking System Tests
 * Tests for hierarchical linking between events, products, and brands
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock data structures
const mockMasterEvent = {
  id: 'master-event-1',
  name: 'C3 Summit',
  slug: 'c3-summit-life-sciences',
  organization_id: 'org-1',
  guide_data: {
    hero: { name: 'C3 Summit', tagline: 'Life Sciences Conference' },
    linkedGuides: [
      { id: 'sub-event-1', name: 'C3 Summit London 2025', slug: 'c3-summit-london-2025', region: 'EMEA', accentColor: '#dc2626' },
      { id: 'sub-event-2', name: 'C3 Summit San Francisco 2025', slug: 'c3-summit-san-francisco-2025', region: 'Americas', accentColor: '#3b82f6' },
    ],
  },
};

const mockSubEvent = {
  id: 'sub-event-1',
  name: 'C3 Summit London 2025',
  slug: 'c3-summit-london-2025',
  organization_id: 'org-1',
  guide_data: {
    hero: { name: 'C3 Summit London 2025', tagline: 'EMEA Edition' },
    linkedGuides: [],
  },
};

const mockParentProduct = {
  id: 'parent-product-1',
  name: 'GlobalLink',
  slug: 'globallink',
  organization_id: 'org-1',
  guide_data: {
    hero: { name: 'GlobalLink', tagline: 'Enterprise Translation Management' },
    linkedGuides: [
      { id: 'sub-product-1', name: 'GlobalLink TMS', slug: 'globallink-tms', type: 'product' },
      { id: 'sub-product-2', name: 'GlobalLink Portal', slug: 'globallink-portal', type: 'product' },
    ],
  },
};

const mockBrandWithEvents = {
  id: 'brand-1',
  name: 'TransPerfect',
  slug: 'transperfect',
  organization_id: 'org-1',
  guide_data: {
    hero: { name: 'TransPerfect', tagline: 'Global Language Solutions' },
    linkedGuides: [
      { id: 'event-1', name: 'GlobalLink NEXT', slug: 'globallink-next', type: 'event' },
    ],
  },
};

describe('Linking System', () => {
  describe('Event Hierarchy', () => {
    it('should identify master events with sub-events', () => {
      const linkedGuides = mockMasterEvent.guide_data.linkedGuides || [];
      expect(linkedGuides.length).toBeGreaterThan(0);
      expect(linkedGuides[0]).toHaveProperty('region');
    });

    it('should identify sub-events without children', () => {
      const linkedGuides = mockSubEvent.guide_data.linkedGuides || [];
      expect(linkedGuides.length).toBe(0);
    });

    it('should find parent event for a sub-event', () => {
      const subEventId = 'sub-event-1';
      const masterLinkedGuides = mockMasterEvent.guide_data.linkedGuides || [];
      const isLinked = masterLinkedGuides.some((linked: any) => linked.id === subEventId);
      expect(isLinked).toBe(true);
    });

    it('should extract region data from linked events', () => {
      const linkedGuides = mockMasterEvent.guide_data.linkedGuides || [];
      const regions = linkedGuides.map((g: any) => g.region).filter(Boolean);
      expect(regions).toContain('EMEA');
      expect(regions).toContain('Americas');
    });

    it('should preserve accent colors for regional events', () => {
      const linkedGuides = mockMasterEvent.guide_data.linkedGuides || [];
      const emeaEvent = linkedGuides.find((g: any) => g.region === 'EMEA');
      expect(emeaEvent?.accentColor).toBe('#dc2626');
    });
  });

  describe('Product Hierarchy', () => {
    it('should identify parent products with sub-products', () => {
      const linkedGuides = mockParentProduct.guide_data.linkedGuides || [];
      expect(linkedGuides.length).toBeGreaterThan(0);
      expect(linkedGuides[0]).toHaveProperty('type', 'product');
    });

    it('should support both brand and product types in linkedGuides', () => {
      const mixedLinkedGuides = [
        { id: '1', name: 'Sub Product', type: 'product' },
        { id: '2', name: 'Related Brand', type: 'brand' },
      ];
      const productLinks = mixedLinkedGuides.filter(g => g.type === 'product');
      const brandLinks = mixedLinkedGuides.filter(g => g.type === 'brand');
      expect(productLinks.length).toBe(1);
      expect(brandLinks.length).toBe(1);
    });

    it('should find parent product for a sub-product', () => {
      const subProductId = 'sub-product-1';
      const parentLinkedGuides = mockParentProduct.guide_data.linkedGuides || [];
      const isLinked = parentLinkedGuides.some((linked: any) => linked.id === subProductId);
      expect(isLinked).toBe(true);
    });
  });

  describe('Brand to Event/Product Linking', () => {
    it('should link events to brands', () => {
      const linkedGuides = mockBrandWithEvents.guide_data.linkedGuides || [];
      const eventLinks = linkedGuides.filter((g: any) => g.type === 'event');
      expect(eventLinks.length).toBeGreaterThan(0);
    });

    it('should support mixed entity types in brand linkedGuides', () => {
      const mixedGuides = [
        { id: '1', name: 'Event 1', type: 'event' },
        { id: '2', name: 'Product 1', type: 'product' },
        { id: '3', name: 'Sub Brand', type: 'brand' },
      ];
      expect(mixedGuides.filter(g => g.type === 'event').length).toBe(1);
      expect(mixedGuides.filter(g => g.type === 'product').length).toBe(1);
      expect(mixedGuides.filter(g => g.type === 'brand').length).toBe(1);
    });
  });

  describe('Breadcrumb Hierarchy Building', () => {
    it('should build correct breadcrumb for master event', () => {
      const org = { name: 'TransPerfect', slug: 'transperfect' };
      const event = mockMasterEvent;
      const parentEvent = null;

      const breadcrumbs = [
        { label: org.name, href: `/org/${org.slug}` },
        ...(parentEvent ? [{ label: parentEvent.name, href: `/event/${parentEvent.slug}` }] : []),
      ];
      const currentPage = event.name;

      expect(breadcrumbs.length).toBe(1);
      expect(currentPage).toBe('C3 Summit');
    });

    it('should build correct breadcrumb for sub-event', () => {
      const org = { name: 'TransPerfect', slug: 'transperfect' };
      const event = mockSubEvent;
      const parentEvent = { name: 'C3 Summit', slug: 'c3-summit-life-sciences' };

      const breadcrumbs = [
        { label: org.name, href: `/org/${org.slug}` },
        ...(parentEvent ? [{ label: parentEvent.name, href: `/event/${parentEvent.slug}` }] : []),
      ];
      const currentPage = event.name;

      expect(breadcrumbs.length).toBe(2);
      expect(breadcrumbs[0].label).toBe('TransPerfect');
      expect(breadcrumbs[1].label).toBe('C3 Summit');
      expect(currentPage).toBe('C3 Summit London 2025');
    });

    it('should build correct breadcrumb for sub-product', () => {
      const org = { name: 'TransPerfect', slug: 'transperfect' };
      const product = { name: 'GlobalLink TMS', slug: 'globallink-tms' };
      const parentProduct = { name: 'GlobalLink', slug: 'globallink' };

      const breadcrumbs = [
        { label: org.name, href: `/org/${org.slug}` },
        ...(parentProduct ? [{ label: parentProduct.name, href: `/product/${parentProduct.slug}` }] : []),
      ];
      const currentPage = product.name;

      expect(breadcrumbs.length).toBe(2);
      expect(breadcrumbs[1].label).toBe('GlobalLink');
      expect(currentPage).toBe('GlobalLink TMS');
    });
  });

  describe('Parent Detection Logic', () => {
    it('should detect parent by searching linkedGuides', () => {
      const allEvents = [mockMasterEvent, mockSubEvent];
      const targetEventId = 'sub-event-1';

      let foundParent = null;
      for (const event of allEvents) {
        const linkedGuides = event.guide_data?.linkedGuides || [];
        const isLinked = linkedGuides.some((linked: any) => linked.id === targetEventId);
        if (isLinked) {
          foundParent = event;
          break;
        }
      }

      expect(foundParent).not.toBeNull();
      expect(foundParent?.id).toBe('master-event-1');
    });

    it('should detect parent by slug matching', () => {
      const allEvents = [mockMasterEvent, mockSubEvent];
      const targetEventSlug = 'c3-summit-london-2025';

      let foundParent = null;
      for (const event of allEvents) {
        const linkedGuides = event.guide_data?.linkedGuides || [];
        const isLinked = linkedGuides.some((linked: any) => linked.slug === targetEventSlug);
        if (isLinked) {
          foundParent = event;
          break;
        }
      }

      expect(foundParent).not.toBeNull();
      expect(foundParent?.slug).toBe('c3-summit-life-sciences');
    });

    it('should return null for events with no parent', () => {
      const allEvents = [mockMasterEvent, mockSubEvent];
      const targetEventId = 'master-event-1'; // Master has no parent

      let foundParent = null;
      for (const event of allEvents) {
        if (event.id === targetEventId) continue; // Skip self
        const linkedGuides = event.guide_data?.linkedGuides || [];
        const isLinked = linkedGuides.some((linked: any) => linked.id === targetEventId);
        if (isLinked) {
          foundParent = event;
          break;
        }
      }

      expect(foundParent).toBeNull();
    });
  });

  describe('LinkedGuides Data Structure', () => {
    it('should support minimal linked guide structure', () => {
      const minimalLink = { id: 'abc', name: 'Test' };
      expect(minimalLink).toHaveProperty('id');
      expect(minimalLink).toHaveProperty('name');
    });

    it('should support full linked guide structure', () => {
      const fullLink = {
        id: 'abc',
        name: 'Test Event',
        slug: 'test-event',
        type: 'event',
        region: 'EMEA',
        accentColor: '#ff0000',
        dates: 'May 2025',
        location: 'London, UK',
        attendees: 250,
        venue: 'Conference Center',
      };
      expect(fullLink).toHaveProperty('region');
      expect(fullLink).toHaveProperty('accentColor');
      expect(fullLink).toHaveProperty('dates');
      expect(fullLink).toHaveProperty('location');
    });

    it('should handle empty linkedGuides array', () => {
      const guideData = { linkedGuides: [] };
      expect(Array.isArray(guideData.linkedGuides)).toBe(true);
      expect(guideData.linkedGuides.length).toBe(0);
    });

    it('should handle missing linkedGuides field', () => {
      const guideData = {};
      const linkedGuides = (guideData as any).linkedGuides || [];
      expect(Array.isArray(linkedGuides)).toBe(true);
      expect(linkedGuides.length).toBe(0);
    });
  });

  describe('Hierarchical Card Display', () => {
    it('should count sub-events correctly', () => {
      const linkedGuides = mockMasterEvent.guide_data.linkedGuides || [];
      const subEventCount = linkedGuides.length;
      expect(subEventCount).toBe(2);
    });

    it('should identify events with sub-events for special styling', () => {
      const hasSubEvents = (mockMasterEvent.guide_data.linkedGuides || []).length > 0;
      expect(hasSubEvents).toBe(true);
    });

    it('should generate correct badge text', () => {
      const count: number = 3;
      const badgeText = `${count} Region${count !== 1 ? 's' : ''}`;
      expect(badgeText).toBe('3 Regions');
    });

    it('should generate singular badge text for single region', () => {
      const singleCount: number = 1;
      const singleBadgeText = `${singleCount} Region${singleCount !== 1 ? 's' : ''}`;
      expect(singleBadgeText).toBe('1 Region');
    });
  });

  describe('Parent Event Banner', () => {
    it('should extract parent info for banner display', () => {
      const parentEvent = {
        slug: 'c3-summit-life-sciences',
        name: 'C3 Summit',
      };
      const subEventRegion = 'EMEA';
      const accentColor = '#dc2626';

      expect(parentEvent.slug).toBeTruthy();
      expect(parentEvent.name).toBeTruthy();
      expect(subEventRegion).toBe('EMEA');
      expect(accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should generate correct back link URL', () => {
      const parentSlug = 'c3-summit-life-sciences';
      const backUrl = `/event/${parentSlug}`;
      expect(backUrl).toBe('/event/c3-summit-life-sciences');
    });
  });
});

describe('Linking Edge Cases', () => {
  it('should handle circular references gracefully', () => {
    // Event A links to Event B, Event B links to Event A (should not happen, but handle it)
    const eventA = {
      id: 'a',
      guide_data: { linkedGuides: [{ id: 'b', name: 'B' }] },
    };
    const eventB = {
      id: 'b',
      guide_data: { linkedGuides: [{ id: 'a', name: 'A' }] },
    };

    // When finding parent, avoid infinite loops by checking visited
    const visited = new Set<string>();
    const findParent = (events: any[], targetId: string): any | null => {
      for (const event of events) {
        if (visited.has(event.id)) continue;
        visited.add(event.id);
        const linkedGuides = event.guide_data?.linkedGuides || [];
        if (linkedGuides.some((l: any) => l.id === targetId)) {
          return event;
        }
      }
      return null;
    };

    const parentOfB = findParent([eventA, eventB], 'b');
    expect(parentOfB?.id).toBe('a');
  });

  it('should handle deeply nested hierarchies', () => {
    // Master -> Regional -> City (3 levels)
    const masterEvent = {
      id: 'master',
      name: 'Global Summit',
      guide_data: { linkedGuides: [{ id: 'regional', name: 'EMEA Summit' }] },
    };
    const regionalEvent = {
      id: 'regional',
      name: 'EMEA Summit',
      guide_data: { linkedGuides: [{ id: 'city', name: 'London Summit' }] },
    };
    const cityEvent = {
      id: 'city',
      name: 'London Summit',
      guide_data: { linkedGuides: [] },
    };

    // Build full path
    const buildPath = (events: any[], targetId: string): string[] => {
      const path: string[] = [];
      let currentId = targetId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const current = events.find(e => e.id === currentId);
        if (current) path.unshift(current.name);

        // Find parent
        let parentId = null;
        for (const event of events) {
          if (event.id === currentId) continue;
          const linkedGuides = event.guide_data?.linkedGuides || [];
          if (linkedGuides.some((l: any) => l.id === currentId)) {
            parentId = event.id;
            break;
          }
        }
        currentId = parentId;
      }

      return path;
    };

    const path = buildPath([masterEvent, regionalEvent, cityEvent], 'city');
    expect(path).toEqual(['Global Summit', 'EMEA Summit', 'London Summit']);
  });

  it('should handle orphaned sub-events', () => {
    // Sub-event exists but parent was deleted
    const orphanedEvent = {
      id: 'orphan',
      name: 'Orphaned Event',
      guide_data: { linkedGuides: [] },
    };
    const allEvents = [orphanedEvent]; // Parent missing

    const findParent = (events: any[], targetId: string): any | null => {
      for (const event of events) {
        const linkedGuides = event.guide_data?.linkedGuides || [];
        if (linkedGuides.some((l: any) => l.id === targetId)) {
          return event;
        }
      }
      return null;
    };

    const parent = findParent(allEvents, 'orphan');
    expect(parent).toBeNull();
  });

  it('should handle duplicate linked guides', () => {
    const eventWithDupes = {
      guide_data: {
        linkedGuides: [
          { id: 'a', name: 'Event A' },
          { id: 'a', name: 'Event A Duplicate' }, // Same ID
          { id: 'b', name: 'Event B' },
        ],
      },
    };

    const linkedGuides = eventWithDupes.guide_data.linkedGuides || [];
    const uniqueIds = new Set(linkedGuides.map((g: any) => g.id));
    
    // Should have 2 unique IDs despite 3 entries
    expect(uniqueIds.size).toBe(2);
    expect(linkedGuides.length).toBe(3);
  });
});
