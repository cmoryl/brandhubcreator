import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoothDownloadLink {
  id: string;
  division_id: string;
  label: string;
  url: string;
  display_order: number;
}

export function useBoothDownloadLinks(divisionId: string) {
  const [links, setLinks] = useState<BoothDownloadLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase
      .from('booth_download_links')
      .select('*')
      .eq('division_id', divisionId)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Failed to fetch booth download links:', error);
    } else {
      setLinks((data as BoothDownloadLink[]) || []);
    }
    setLoading(false);
  }, [divisionId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(async (label: string, url: string) => {
    const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.display_order)) + 1 : 0;
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('booth_download_links')
      .insert({
        division_id: divisionId,
        label,
        url,
        display_order: maxOrder,
        created_by: userData.user?.id || null,
      });

    if (error) {
      toast.error('Failed to add download link');
      console.error(error);
    } else {
      toast.success('Download link added');
      await fetchLinks();
    }
  }, [divisionId, links, fetchLinks]);

  const updateLink = useCallback(async (id: string, label: string, url: string) => {
    const { error } = await supabase
      .from('booth_download_links')
      .update({ label, url, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update link');
    } else {
      toast.success('Link updated');
      await fetchLinks();
    }
  }, [fetchLinks]);

  const deleteLink = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('booth_download_links')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete link');
    } else {
      toast.success('Link removed');
      await fetchLinks();
    }
  }, [fetchLinks]);

  return { links, loading, addLink, updateLink, deleteLink, refetch: fetchLinks };
}
