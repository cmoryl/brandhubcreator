/**
 * useAdminOrganizations Hook
 * Fetches all organizations for admin users using centralized types and mappers
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Organization, dbToOrganization } from '@/lib/organization/types';

export const useAdminOrganizations = () => {
  const { isAdmin } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!isAdmin) {
      setOrganizations([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }

      setOrganizations(data.map(dbToOrganization));
    } catch (error) {
      console.error('Error in fetchOrganizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return { 
    organizations, 
    isLoading,
    refetch: fetchOrganizations,
  };
};
