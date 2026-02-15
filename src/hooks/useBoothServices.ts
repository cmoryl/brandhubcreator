import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothService {
  id: string;
  division_id: string;
  label: string;
  icon_svg: string | null;
  display_order: number;
}

export function useBoothServices(divisionId: string) {
  const [services, setServices] = useState<BoothService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_services")
      .select("id, division_id, label, icon_svg, display_order")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) setServices(data);
    setLoading(false);
  }, [divisionId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addService = useCallback(
    async (label: string, iconSvg?: string) => {
      const { error } = await supabase.from("booth_services").insert({
        division_id: divisionId,
        label,
        icon_svg: iconSvg || null,
        display_order: services.length,
      });
      if (!error) await fetchServices();
    },
    [divisionId, services.length, fetchServices]
  );

  const updateService = useCallback(
    async (id: string, label: string, iconSvg?: string | null) => {
      const { error } = await supabase
        .from("booth_services")
        .update({ label, icon_svg: iconSvg ?? null })
        .eq("id", id);
      if (!error) await fetchServices();
    },
    [fetchServices]
  );

  const deleteService = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("booth_services")
        .delete()
        .eq("id", id);
      if (!error) await fetchServices();
    },
    [fetchServices]
  );

  return { services, loading, addService, updateService, deleteService, refetch: fetchServices };
}
