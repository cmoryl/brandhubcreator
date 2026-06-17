import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandCtx {
  brandId: string | null;
  organizationId: string | null;
}

/**
 * Lightweight lookup for standalone pages (e.g. Canva audit reports)
 * that need a brand's id + organization without the full editor context.
 */
export function useBrandContextBySlug(slug?: string | null): BrandCtx & { loading: boolean } {
  const [ctx, setCtx] = useState<BrandCtx>({ brandId: null, organizationId: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('brands')
      .select('id, organization_id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setCtx({
          brandId: data?.id ?? null,
          organizationId: (data as any)?.organization_id ?? null,
        });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { ...ctx, loading };
}
