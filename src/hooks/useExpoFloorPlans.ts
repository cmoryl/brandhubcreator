import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FloorPlan {
  id: string;
  organization_id: string | null;
  event_id: string | null;
  name: string;
  venue_name: string | null;
  hall_name: string | null;
  file_url: string;
  file_type: string;
  dimensions: Record<string, any>;
  scale_factor: number;
  grid_size: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BoothPlacement {
  id: string;
  floor_plan_id: string;
  division_id: string | null;
  label: string;
  booth_size: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  booth_number: string | null;
  is_own_booth: boolean;
  is_competitor: boolean;
  category: string;
  notes: string | null;
  metadata: Record<string, any>;
}

export interface FloorZone {
  id: string;
  floor_plan_id: string;
  zone_type: string;
  label: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  opacity: number;
  intensity: string;
  metadata: Record<string, any>;
}

export function useExpoFloorPlans(organizationId?: string) {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFloorPlans = useCallback(async () => {
    setLoading(true);
    const query = supabase.from('expo_floor_plans').select('*').order('created_at', { ascending: false });
    if (organizationId) query.eq('organization_id', organizationId);
    const { data, error } = await query;
    if (error) { toast.error('Failed to load floor plans'); }
    else setFloorPlans((data || []) as unknown as FloorPlan[]);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { fetchFloorPlans(); }, [fetchFloorPlans]);

  const createFloorPlan = async (plan: Partial<FloorPlan>) => {
    const { data, error } = await supabase.from('expo_floor_plans').insert(plan as any).select().single();
    if (error) { toast.error('Failed to create floor plan'); return null; }
    await fetchFloorPlans();
    return data as unknown as FloorPlan;
  };

  const deleteFloorPlan = async (id: string) => {
    const { error } = await supabase.from('expo_floor_plans').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setFloorPlans(prev => prev.filter(p => p.id !== id));
    toast.success('Floor plan deleted');
  };

  return { floorPlans, loading, fetchFloorPlans, createFloorPlan, deleteFloorPlan };
}

export function useBoothPlacements(floorPlanId: string | null) {
  const [placements, setPlacements] = useState<BoothPlacement[]>([]);
  const [zones, setZones] = useState<FloorZone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!floorPlanId) return;
    setLoading(true);
    const [placementsRes, zonesRes] = await Promise.all([
      supabase.from('expo_booth_placements').select('*').eq('floor_plan_id', floorPlanId),
      supabase.from('expo_floor_zones').select('*').eq('floor_plan_id', floorPlanId),
    ]);
    setPlacements((placementsRes.data || []) as unknown as BoothPlacement[]);
    setZones((zonesRes.data || []) as unknown as FloorZone[]);
    setLoading(false);
  }, [floorPlanId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addPlacement = async (placement: Partial<BoothPlacement>) => {
    const { data, error } = await supabase.from('expo_booth_placements').insert({ ...placement, floor_plan_id: floorPlanId } as any).select().single();
    if (error) { toast.error('Failed to add booth'); return null; }
    setPlacements(prev => [...prev, data as unknown as BoothPlacement]);
    return data as unknown as BoothPlacement;
  };

  const updatePlacement = async (id: string, updates: Partial<BoothPlacement>) => {
    const { error } = await supabase.from('expo_booth_placements').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update booth'); return; }
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePlacement = async (id: string) => {
    const { error } = await supabase.from('expo_booth_placements').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setPlacements(prev => prev.filter(p => p.id !== id));
  };

  const addZone = async (zone: Partial<FloorZone>) => {
    const { data, error } = await supabase.from('expo_floor_zones').insert({ ...zone, floor_plan_id: floorPlanId } as any).select().single();
    if (error) { toast.error('Failed to add zone'); return null; }
    setZones(prev => [...prev, data as unknown as FloorZone]);
    return data as unknown as FloorZone;
  };

  const deleteZone = async (id: string) => {
    const { error } = await supabase.from('expo_floor_zones').delete().eq('id', id);
    if (error) { toast.error('Failed to delete zone'); return; }
    setZones(prev => prev.filter(z => z.id !== id));
  };

  return { placements, zones, loading, fetchAll, addPlacement, updatePlacement, deletePlacement, addZone, deleteZone };
}
