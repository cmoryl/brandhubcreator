/**
 * useOrgSlug Hook
 * Resolves an organization slug + name from an organizationId.
 * Uses a SECURITY DEFINER function to work for both authenticated and public visitors.
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
        // Use the SECURITY DEFINER function that allows public access
        // for orgs with public entities
        const { data, error } = await supabase
          .rpc('get_org_slug_by_id', { p_org_id: organizationId } as any);

        if (error) {
          console.error('[useOrgSlug] RPC error:', error);
          return;
        }

        // RPC returns TABLE, so data is an array
        if (data && Array.isArray(data) && data.length > 0) {
          setOrgSlug(data[0].slug);
          setOrgName(data[0].name);
        } else if (data && !Array.isArray(data)) {
          // In case it returns a single object
          setOrgSlug((data as any).slug);
          setOrgName((data as any).name);
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
