/**
 * BrandUniverseOrbit - Renders the GlobalAssetOrbit for brand-type entities
 * Fetches all org brands/products/events to match the org portal hero visualization
 */
import { useMemo } from 'react';
import { GlobalAssetOrbit } from '@/components/portal';
import { usePortalData } from '@/hooks/usePortalData';
import { useOrgSlug } from '@/hooks/useOrgSlug';
import { RefreshCw } from 'lucide-react';

interface BrandUniverseOrbitProps {
  organizationId?: string | null;
  brandColors?: Array<{ hex: string; name?: string }>;
  organizationName?: string;
  organizationLogo?: string | null;
}

export function BrandUniverseOrbit({
  organizationId,
  brandColors,
  organizationName,
  organizationLogo,
}: BrandUniverseOrbitProps) {
  const { orgSlug } = useOrgSlug(organizationId);
  const { organization, brands, products, events, isLoading } = usePortalData(orgSlug);

  const primaryColor = brandColors?.[0]?.hex || '#6366f1';

  const orbitBrands = useMemo(() => brands.map(b => ({
    id: b.id,
    name: b.hero?.name || b.name,
    slug: b.slug || undefined,
    type: 'brand' as const,
    updatedAt: b.updatedAt,
    coverImage: b.hero?.coverImage,
    color: b.colors?.[0]?.hex,
    linkedGuides: b.linkedGuides?.map((g: any) => g.id) || [],
  })), [brands]);

  const orbitProducts = useMemo(() => products.map(p => ({
    id: p.id,
    name: p.hero?.name || p.name,
    slug: p.slug || undefined,
    type: 'product' as const,
    updatedAt: p.updatedAt,
    coverImage: p.hero?.coverImage,
    color: p.colors?.[0]?.hex,
    parentBrandId: p.parentBrandId || undefined,
    linkedGuides: p.linkedGuides?.map((g: any) => g.id) || [],
  })), [products]);

  const orbitEvents = useMemo(() => events.map(e => ({
    id: e.id,
    name: e.hero?.name || e.name,
    slug: e.slug || undefined,
    type: 'event' as const,
    updatedAt: e.updatedAt,
    coverImage: e.hero?.coverImage,
    color: e.colors?.[0]?.hex,
    parentBrandId: e.parentBrandId || undefined,
  })), [events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const orgName = organizationName || organization?.name || '';
  const orgLogo = organizationLogo || organization?.logoUrl || null;

  return (
    <div className="w-full py-8">
      <div className="relative mx-auto" style={{ width: 'min(100%, 700px)', height: 'min(80vw, 700px)' }}>
        <GlobalAssetOrbit
          primaryColor={primaryColor}
          organizationName={orgName}
          organizationLogo={orgLogo}
          className="w-full h-full"
          showLegend={true}
          brands={orbitBrands}
          products={orbitProducts}
          events={orbitEvents}
        />
      </div>
    </div>
  );
}
