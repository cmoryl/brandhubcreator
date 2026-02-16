import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothProductionSpec {
  id: string;
  division_id: string;
  category: string;
  title: string;
  content: string;
  display_order: number;
  variant_label: string | null;
}

export function useBoothProductionSpecs(divisionId: string, variantLabel?: string) {
  const [specs, setSpecs] = useState<BoothProductionSpec[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_production_specs")
      .select("id, division_id, category, title, content, display_order, variant_label")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      const filtered = data.filter(s =>
        s.variant_label === null || s.variant_label === (variantLabel || null)
      );
      setSpecs(filtered);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  const addSpec = useCallback(
    async (title: string, content: string, category: string = "general", forVariant?: string | null) => {
      const { error } = await supabase.from("booth_production_specs").insert({
        division_id: divisionId,
        title,
        content,
        category,
        display_order: specs.length,
        variant_label: forVariant ?? null,
      });
      if (!error) await fetchSpecs();
    },
    [divisionId, specs.length, fetchSpecs]
  );

  const updateSpec = useCallback(
    async (id: string, title: string, content: string, category: string) => {
      const { error } = await supabase
        .from("booth_production_specs")
        .update({ title, content, category })
        .eq("id", id);
      if (!error) await fetchSpecs();
    },
    [fetchSpecs]
  );

  const deleteSpec = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("booth_production_specs")
        .delete()
        .eq("id", id);
      if (!error) await fetchSpecs();
    },
    [fetchSpecs]
  );

  return { specs, loading, addSpec, updateSpec, deleteSpec, refetch: fetchSpecs };
}
