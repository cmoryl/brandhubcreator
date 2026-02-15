import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothContentSection {
  id: string;
  division_id: string;
  heading: string;
  bullets: string[];
  display_order: number;
  variant_label: string | null;
}

export function useBoothContentSections(divisionId: string, variantLabel?: string) {
  const [sections, setSections] = useState<BoothContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_content_sections")
      .select("id, division_id, heading, bullets, display_order, variant_label")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      // Filter: show sections that match the current variant OR are shared (null variant_label)
      const filtered = data.filter(s => 
        s.variant_label === null || s.variant_label === (variantLabel || null)
      );
      setSections(filtered);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const addSection = useCallback(
    async (heading: string, bullets: string[], forVariant?: string | null) => {
      const { error } = await supabase.from("booth_content_sections").insert({
        division_id: divisionId,
        heading,
        bullets,
        display_order: sections.length,
        variant_label: forVariant ?? null,
      });
      if (!error) await fetchSections();
    },
    [divisionId, sections.length, fetchSections]
  );

  const updateSection = useCallback(
    async (id: string, heading: string, bullets: string[], variantLabelVal?: string | null) => {
      const updateData: Record<string, unknown> = { heading, bullets };
      if (variantLabelVal !== undefined) {
        updateData.variant_label = variantLabelVal;
      }
      const { error } = await supabase
        .from("booth_content_sections")
        .update(updateData)
        .eq("id", id);
      if (!error) await fetchSections();
    },
    [fetchSections]
  );

  const deleteSection = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("booth_content_sections")
        .delete()
        .eq("id", id);
      if (!error) await fetchSections();
    },
    [fetchSections]
  );

  return { sections, loading, addSection, updateSection, deleteSection, refetch: fetchSections };
}
