import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothContentSection {
  id: string;
  division_id: string;
  heading: string;
  bullets: string[];
  display_order: number;
}

export function useBoothContentSections(divisionId: string) {
  const [sections, setSections] = useState<BoothContentSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_content_sections")
      .select("id, division_id, heading, bullets, display_order")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) setSections(data);
    setLoading(false);
  }, [divisionId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const addSection = useCallback(
    async (heading: string, bullets: string[]) => {
      const { error } = await supabase.from("booth_content_sections").insert({
        division_id: divisionId,
        heading,
        bullets,
        display_order: sections.length,
      });
      if (!error) await fetchSections();
    },
    [divisionId, sections.length, fetchSections]
  );

  const updateSection = useCallback(
    async (id: string, heading: string, bullets: string[]) => {
      const { error } = await supabase
        .from("booth_content_sections")
        .update({ heading, bullets })
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
