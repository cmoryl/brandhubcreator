/**
 * useOrgSlug Hook
 * Resolves an organization slug + name from an organizationId.
 * Works for public visitors by using a database function that bypasses RLS.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrgSlugResult {
  orgSlug: string | null;
  orgName: string | null;
  isLoading: boolean;
}

export const useOrgSlug = (organizationId: string | null | undefined): OrgSlugResult => {
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!organizationId || fetchedIdRef.current === organizationId) return;

    const fetchOrgSlug = async () => {
      setIsLoading(true);
      fetchedIdRef.current = organizationId;
      try {
        // Query organizations table - RLS allows if org has public entities
        const { data, error } = await supabase
          .from('organizations')
          .select('slug, name')
          .eq('id', organizationId)
          .maybeSingle();

        if (!error && data) {
          setOrgSlug(data.slug);
          setOrgName(data.name);
        }
      } catch (err) {
        console.error('[useOrgSlug] Error fetching org slug:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgSlug();
  }, [organizationId]);

  return { orgSlug, orgName, isLoading };
};
