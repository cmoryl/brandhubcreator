/**
 * useBoothSystems — CRUD hook for Booth System Library.
 * Manages master systems, variants (full snapshots), and event links.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoothSystemVariant {
  id: string;
  systemId: string;
  variantName: string;
  variantType: string;
  dimensions: string;
  displayOrder: number;
  snapshotData: Record<string, unknown>;
  coverImageUrl: string | null;
  createdAt: string;
}

export interface BoothSystem {
  id: string;
  name: string;
  description: string;
  organizationId: string | null;
  coverImageUrl: string | null;
  tags: string[];
  variants: BoothSystemVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface BoothSystemEventLink {
  id: string;
  eventId: string;
  systemId: string;
  variantId: string;
  divisionId: string | null;
  overrideData: Record<string, unknown>;
  notes: string;
}

function mapVariant(v: Record<string, unknown>): BoothSystemVariant {
  return {
    id: v.id as string,
    systemId: v.system_id as string,
    variantName: v.variant_name as string,
    variantType: v.variant_type as string,
    dimensions: (v.dimensions as string) || '',
    displayOrder: (v.display_order as number) || 0,
    snapshotData: (v.snapshot_data as Record<string, unknown>) || {},
    coverImageUrl: (v.cover_image_url as string) || null,
    createdAt: v.created_at as string,
  };
}

export function useBoothSystems(organizationId?: string) {
  const [systems, setSystems] = useState<BoothSystem[]>([]);
  const [eventLinks, setEventLinks] = useState<BoothSystemEventLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSystems = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('booth_systems')
        .select('*, booth_system_variants(*)')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSystems((data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        organizationId: s.organization_id,
        coverImageUrl: s.cover_image_url,
        tags: s.tags || [],
        variants: (s.booth_system_variants || [])
          .map(mapVariant)
          .sort((a: BoothSystemVariant, b: BoothSystemVariant) => a.displayOrder - b.displayOrder),
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })));
    } catch (err) {
      console.error('Failed to load booth systems:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchSystems(); }, [fetchSystems]);

  const createSystem = useCallback(async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('booth_systems')
      .insert({
        name,
        description: description || '',
        organization_id: organizationId || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) { toast.error('Failed to create system'); return null; }
    toast.success(`"${name}" system created`);
    await fetchSystems();
    return data.id as string;
  }, [organizationId, fetchSystems]);

  const updateSystem = useCallback(async (
    systemId: string,
    updates: { name?: string; description?: string; coverImageUrl?: string; tags?: string[] }
  ) => {
    const { error } = await supabase
      .from('booth_systems')
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.coverImageUrl !== undefined && { cover_image_url: updates.coverImageUrl }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
      })
      .eq('id', systemId);

    if (error) { toast.error('Failed to update system'); return false; }
    await fetchSystems();
    return true;
  }, [fetchSystems]);

  const deleteSystem = useCallback(async (systemId: string) => {
    const { error } = await supabase
      .from('booth_systems')
      .delete()
      .eq('id', systemId);

    if (error) { toast.error('Failed to delete system'); return false; }
    toast.success('System deleted');
    await fetchSystems();
    return true;
  }, [fetchSystems]);

  const addVariant = useCallback(async (
    systemId: string,
    variantName: string,
    variantType: string,
    dimensions: string,
    snapshotData: Record<string, unknown>,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const system = systems.find(s => s.id === systemId);
    const order = system ? system.variants.length : 0;

    const { data, error } = await supabase
      .from('booth_system_variants')
      .insert({
        system_id: systemId,
        variant_name: variantName,
        variant_type: variantType,
        dimensions,
        display_order: order,
        snapshot_data: snapshotData as any,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) { toast.error('Failed to add variant'); return null; }
    toast.success(`"${variantName}" variant added`);
    await fetchSystems();
    return data.id as string;
  }, [systems, fetchSystems]);

  const updateVariantSnapshot = useCallback(async (
    variantId: string,
    snapshotData: Record<string, unknown>,
    coverImageUrl?: string,
  ) => {
    const updates: Record<string, unknown> = { snapshot_data: snapshotData };
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl;

    const { error } = await supabase
      .from('booth_system_variants')
      .update(updates as any)
      .eq('id', variantId);

    if (error) { toast.error('Failed to save variant'); return false; }
    toast.success('Variant snapshot saved');
    await fetchSystems();
    return true;
  }, [fetchSystems]);

  const deleteVariant = useCallback(async (variantId: string) => {
    const { error } = await supabase
      .from('booth_system_variants')
      .delete()
      .eq('id', variantId);

    if (error) { toast.error('Failed to delete variant'); return false; }
    toast.success('Variant deleted');
    await fetchSystems();
    return true;
  }, [fetchSystems]);

  // Event links
  const fetchEventLinks = useCallback(async (eventId: string) => {
    const { data } = await supabase
      .from('booth_system_event_links')
      .select('*')
      .eq('event_id', eventId);

    const links = (data || []).map((l: any) => ({
      id: l.id,
      eventId: l.event_id,
      systemId: l.system_id,
      variantId: l.variant_id,
      divisionId: l.division_id,
      overrideData: l.override_data || {},
      notes: l.notes || '',
    }));
    setEventLinks(links);
    return links;
  }, []);

  const linkEventToVariant = useCallback(async (
    eventId: string,
    systemId: string,
    variantId: string,
    divisionId?: string,
    notes?: string,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('booth_system_event_links')
      .upsert({
        event_id: eventId,
        system_id: systemId,
        variant_id: variantId,
        division_id: divisionId || null,
        notes: notes || '',
        created_by: user.id,
      }, { onConflict: 'event_id,system_id' });

    if (error) { toast.error('Failed to link event'); return false; }
    toast.success('Event linked to booth system');
    return true;
  }, []);

  const unlinkEvent = useCallback(async (linkId: string) => {
    const { error } = await supabase
      .from('booth_system_event_links')
      .delete()
      .eq('id', linkId);

    if (error) { toast.error('Failed to unlink'); return false; }
    toast.success('Event unlinked');
    return true;
  }, []);

  return {
    systems,
    eventLinks,
    isLoading,
    refetch: fetchSystems,
    createSystem,
    updateSystem,
    deleteSystem,
    addVariant,
    updateVariantSnapshot,
    deleteVariant,
    fetchEventLinks,
    linkEventToVariant,
    unlinkEvent,
  };
}
