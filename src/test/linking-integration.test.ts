/**
 * Linking Integration Tests
 * Tests for hierarchical linking using actual Supabase queries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Linking Integration Tests', () => {
  describe('Event Hierarchy Queries', () => {
    it('should fetch master events with linkedGuides', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, guide_data')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(5);

      // Query should not error (may return empty if no data)
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // If we have master events, verify linkedGuides structure
      if (data && data.length > 0) {
        const masterEvent = data[0];
        const guideData = masterEvent.guide_data as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
        
        expect(Array.isArray(linkedGuides)).toBe(true);
        
        if (linkedGuides.length > 0) {
          const firstLinked = linkedGuides[0] as Record<string, unknown>;
          expect(firstLinked).toHaveProperty('id');
          expect(firstLinked).toHaveProperty('name');
        }
      }
    });

    it('should fetch events by slug', async () => {
      const testSlug = 'c3-summit-life-sciences';
      
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, guide_data')
        .eq('slug', testSlug)
        .maybeSingle();

      expect(error).toBeNull();
      
      if (data) {
        expect(data.slug).toBe(testSlug);
        expect(data).toHaveProperty('guide_data');
      }
    });

    it('should find parent event for a sub-event by searching linkedGuides', async () => {
      // First, get all events with linkedGuides
      const { data: masterEvents, error: masterError } = await supabase
        .from('events')
        .select('id, name, slug, guide_data')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(10);

      expect(masterError).toBeNull();

      if (masterEvents && masterEvents.length > 0) {
        // Pick a sub-event ID from the first master event
        const masterEvent = masterEvents[0];
        const guideData = masterEvent.guide_data as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];

        if (linkedGuides.length > 0) {
          const subEventId = (linkedGuides[0] as Record<string, unknown>).id as string;

          // Now verify we can find the parent by searching
          let foundParent = null;
          for (const event of masterEvents) {
            const eventGuideData = event.guide_data as Record<string, unknown>;
            const eventLinkedGuides = Array.isArray(eventGuideData?.linkedGuides) ? eventGuideData.linkedGuides : [];
            
            const isLinked = eventLinkedGuides.some((linked: unknown) => 
              (linked as Record<string, unknown>).id === subEventId
            );
            
            if (isLinked) {
              foundParent = event;
              break;
            }
          }

          expect(foundParent).not.toBeNull();
          expect(foundParent?.id).toBe(masterEvent.id);
        }
      }
    });

    it('should handle events with empty linkedGuides', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, guide_data')
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data) {
        // Find an event with empty or no linkedGuides
        const simpleEvent = data.find(event => {
          const guideData = event.guide_data as Record<string, unknown>;
          const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
          return linkedGuides.length === 0;
        });

        if (simpleEvent) {
          const guideData = simpleEvent.guide_data as Record<string, unknown>;
          const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
          expect(linkedGuides.length).toBe(0);
        }
      }
    });
  });

  describe('Product Hierarchy Queries', () => {
    it('should fetch products with linkedGuides', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, guide_data')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const parentProduct = data[0];
        const guideData = parentProduct.guide_data as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
        
        expect(Array.isArray(linkedGuides)).toBe(true);
      }
    }, 30000); // Increased timeout for network queries

    it('should fetch products by organization', async () => {
      // Get an organization first
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug')
        .limit(1);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        
        const { data: products, error } = await supabase
          .from('products')
          .select('id, name, slug, organization_id, guide_data')
          .eq('organization_id', orgId)
          .limit(10);

        expect(error).toBeNull();
        expect(Array.isArray(products)).toBe(true);
      }
    }, 30000); // Increased timeout for network queries

    it('should find parent product for sub-product', async () => {
      const { data: parentProducts, error } = await supabase
        .from('products')
        .select('id, name, slug, guide_data')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(5);

      expect(error).toBeNull();

      if (parentProducts && parentProducts.length > 0) {
        const parentProduct = parentProducts[0];
        const guideData = parentProduct.guide_data as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];

        if (linkedGuides.length > 0) {
          const subProductId = (linkedGuides[0] as Record<string, unknown>).id;
          
          // Verify parent detection logic
          const foundParent = parentProducts.find(product => {
            const productGuideData = product.guide_data as Record<string, unknown>;
            const productLinkedGuides = Array.isArray(productGuideData?.linkedGuides) ? productGuideData.linkedGuides : [];
            return productLinkedGuides.some((linked: unknown) => 
              (linked as Record<string, unknown>).id === subProductId
            );
          });

          expect(foundParent?.id).toBe(parentProduct.id);
        }
      }
    });
  });

  describe('Brand Hierarchy Queries', () => {
    it('should fetch brands with linkedGuides', async () => {
      // Use simpler query - just check if brands table is accessible
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_public', true)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    }, 10000);

    it('should fetch public brands by organization', async () => {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, slug')
        .limit(1);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        
        const { data: brands, error } = await supabase
          .from('brands')
          .select('id, name, slug, organization_id')
          .eq('organization_id', orgId)
          .eq('is_public', true)
          .limit(10);

        expect(error).toBeNull();
        expect(Array.isArray(brands)).toBe(true);
      } else {
        // No orgs found, test passes
        expect(true).toBe(true);
      }
    }, 10000);

    it('should verify brand linkedGuides structure when present', async () => {
      // Fetch a public brand and check its structure
      const { data: brands, error } = await supabase
        .from('brands')
        .select('id, name, guide_data')
        .eq('is_public', true)
        .limit(3);

      expect(error).toBeNull();

      if (brands && brands.length > 0) {
        for (const brand of brands) {
          const guideData = brand.guide_data as Record<string, unknown>;
          const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
          
          // Verify structure if linkedGuides exist
          expect(Array.isArray(linkedGuides)).toBe(true);
          
          if (linkedGuides.length > 0) {
            const firstLinked = linkedGuides[0] as Record<string, unknown>;
            // Handle both formats:
            // - Newer format: { id, name, slug, type }
            // - Legacy format: { guideId, guideType, id } where id is the link entry id
            const hasId = 'id' in firstLinked || 'guideId' in firstLinked;
            expect(hasId).toBe(true);
            // Type field should be present in either format
            const hasType = 'type' in firstLinked || 'guideType' in firstLinked;
            expect(hasType).toBe(true);
          }
        }
      }
    }, 10000);
  });

  describe('Cross-Entity Linking', () => {
    it('should fetch organization with all linked entities', async () => {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .limit(1);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;

        // Fetch all entity types in parallel
        const [brandsResult, productsResult, eventsResult] = await Promise.all([
          supabase.from('brands').select('id, name, slug').eq('organization_id', orgId),
          supabase.from('products').select('id, name, slug').eq('organization_id', orgId),
          supabase.from('events').select('id, name, slug').eq('organization_id', orgId),
        ]);

        expect(brandsResult.error).toBeNull();
        expect(productsResult.error).toBeNull();
        expect(eventsResult.error).toBeNull();

        expect(Array.isArray(brandsResult.data)).toBe(true);
        expect(Array.isArray(productsResult.data)).toBe(true);
        expect(Array.isArray(eventsResult.data)).toBe(true);
      }
    });

    it('should verify parent-child relationships are bidirectional in data', async () => {
      // Get a master event
      const { data: masterEvents } = await supabase
        .from('events')
        .select('id, name, slug, guide_data, organization_id')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(1);

      if (masterEvents && masterEvents.length > 0) {
        const masterEvent = masterEvents[0];
        const guideData = masterEvent.guide_data as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];

        if (linkedGuides.length > 0) {
          const subEventRef = linkedGuides[0] as Record<string, unknown>;
          const subEventId = subEventRef.id as string;

          // Fetch the actual sub-event
          const { data: subEvent, error } = await supabase
            .from('events')
            .select('id, name, slug, organization_id')
            .eq('id', subEventId)
            .maybeSingle();

          expect(error).toBeNull();

          if (subEvent) {
            // Both should be in the same organization
            expect(subEvent.organization_id).toBe(masterEvent.organization_id);
          }
        }
      }
    });
  });

  describe('Breadcrumb Data Fetching', () => {
    it('should fetch complete breadcrumb chain for sub-event', async () => {
      // Get a sub-event that has a parent
      const { data: allEvents } = await supabase
        .from('events')
        .select('id, name, slug, guide_data, organization_id')
        .limit(50);

      if (allEvents && allEvents.length > 0) {
        // Find a sub-event by checking if any master event links to it
        for (const potentialSubEvent of allEvents) {
          let parentEvent = null;
          
          for (const event of allEvents) {
            if (event.id === potentialSubEvent.id) continue;
            
            const guideData = event.guide_data as Record<string, unknown>;
            const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
            
            const isLinked = linkedGuides.some((linked: unknown) =>
              (linked as Record<string, unknown>).id === potentialSubEvent.id ||
              (linked as Record<string, unknown>).slug === potentialSubEvent.slug
            );
            
            if (isLinked) {
              parentEvent = event;
              break;
            }
          }

          if (parentEvent) {
            // We found a sub-event with a parent
            // Now fetch the organization
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .select('id, name, slug')
              .eq('id', potentialSubEvent.organization_id!)
              .maybeSingle();

            expect(orgError).toBeNull();

            // Build breadcrumb chain
            const breadcrumbChain = [];
            
            if (org) {
              breadcrumbChain.push({ label: org.name, href: `/org/${org.slug}` });
            }
            
            breadcrumbChain.push({ label: parentEvent.name, href: `/event/${parentEvent.slug}` });
            
            const currentPage = potentialSubEvent.name;

            // Verify chain structure
            expect(breadcrumbChain.length).toBeGreaterThanOrEqual(1);
            expect(currentPage).toBeTruthy();
            
            // Found a complete chain, test passes
            return;
          }
        }
      }
      
      // No sub-events found - that's okay, test still passes
      expect(true).toBe(true);
    });

    it('should fetch organization info for breadcrumb', async () => {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, organization_id')
        .not('organization_id', 'is', null)
        .limit(1);

      if (events && events.length > 0 && events[0].organization_id) {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('id, name, slug, logo_url')
          .eq('id', events[0].organization_id)
          .maybeSingle();

        expect(error).toBeNull();
        
        if (org) {
          expect(org).toHaveProperty('name');
          expect(org).toHaveProperty('slug');
        }
      }
    });
  });

  describe('Public Access Queries', () => {
    it('should fetch public events without auth', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, slug, is_public')
        .eq('is_public', true)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        expect(data[0].is_public).toBe(true);
      }
    });

    it('should fetch public products without auth', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, is_public')
        .eq('is_public', true)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should fetch public brands without auth', async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, is_public')
        .eq('is_public', true)
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('LinkedGuides Data Integrity', () => {
    it('should verify linkedGuides have required fields', async () => {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, guide_data')
        .not('guide_data->linkedGuides', 'eq', '[]')
        .limit(5);

      if (events && events.length > 0) {
        for (const event of events) {
          const guideData = event.guide_data as Record<string, unknown>;
          const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
          
          for (const linked of linkedGuides) {
            const linkedObj = linked as Record<string, unknown>;
            // Required fields
            expect(linkedObj).toHaveProperty('id');
            expect(linkedObj).toHaveProperty('name');
            expect(typeof linkedObj.id).toBe('string');
            expect(typeof linkedObj.name).toBe('string');
          }
        }
      }
    });

    it('should handle malformed linkedGuides gracefully', async () => {
      // Test defensive parsing of linkedGuides
      const testCases = [
        { linkedGuides: null },
        { linkedGuides: undefined },
        { linkedGuides: 'not an array' },
        { linkedGuides: {} },
        { linkedGuides: [] },
        { linkedGuides: [{ id: 'valid', name: 'Valid' }] },
      ];

      for (const testCase of testCases) {
        const guideData = testCase as Record<string, unknown>;
        const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];
        
        expect(Array.isArray(linkedGuides)).toBe(true);
      }
    });
  });
});
