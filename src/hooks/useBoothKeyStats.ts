import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothKeyStat {
  id: string;
  division_id: string;
  label: string;
  value: string;
  icon_svg: string | null;
  display_order: number;
  variant_label: string | null;
}

export function useBoothKeyStats(divisionId: string, variantLabel?: string) {
  const [stats, setStats] = useState<BoothKeyStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_key_stats")
      .select("id, division_id, label, value, icon_svg, display_order, variant_label")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      const filtered = data.filter(s =>
        s.variant_label === null || s.variant_label === (variantLabel || null)
      );
      setStats(filtered);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const addStat = useCallback(
    async (label: string, value: string, iconSvg?: string, forVariant?: string | null) => {
      const { error } = await supabase.from("booth_key_stats").insert({
        division_id: divisionId,
        label,
        value,
        icon_svg: iconSvg || null,
        display_order: stats.length,
        variant_label: forVariant ?? null,
      });
      if (!error) await fetchStats();
    },
    [divisionId, stats.length, fetchStats]
  );

  const updateStat = useCallback(
    async (id: string, label: string, value: string, iconSvg?: string | null) => {
      const { error } = await supabase
        .from("booth_key_stats")
        .update({ label, value, icon_svg: iconSvg ?? null })
        .eq("id", id);
      if (!error) await fetchStats();
    },
    [fetchStats]
  );

  const deleteStat = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("booth_key_stats")
        .delete()
        .eq("id", id);
      if (!error) await fetchStats();
    },
    [fetchStats]
  );

  return { stats, loading, addStat, updateStat, deleteStat, refetch: fetchStats };
}
