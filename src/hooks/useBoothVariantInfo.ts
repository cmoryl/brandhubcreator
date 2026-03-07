import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothVariantInfo {
  id: string;
  division_id: string;
  variant_label: string;
  tagline: string;
  description: string | null;
  details: { heading: string; bullets: string[] }[];
}

export function useBoothVariantInfo(divisionId: string, variantLabel: string) {
  const [info, setInfo] = useState<BoothVariantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_variant_info")
      .select("id, division_id, variant_label, tagline, description, details")
      .eq("division_id", divisionId)
      .eq("variant_label", variantLabel)
      .maybeSingle();

    if (!error && data) {
      const details = Array.isArray(data.details) ? data.details as { heading: string; bullets: string[] }[] : [];
      setInfo({ ...data, tagline: data.tagline || '', details });
    } else {
      setInfo(null);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const saveInfo = useCallback(
    async (description: string, details: { heading: string; bullets: string[] }[], tagline?: string) => {
      if (info) {
        const updateData: Record<string, unknown> = { description, details: details as unknown };
        if (tagline !== undefined) updateData.tagline = tagline;
        const { error } = await supabase
          .from("booth_variant_info")
          .update(updateData)
          .eq("id", info.id);
        if (!error) await fetchInfo();
      } else {
        const { error } = await supabase
          .from("booth_variant_info")
          .insert({
            division_id: divisionId,
            variant_label: variantLabel,
            tagline: tagline || '',
            description,
            details: details as unknown,
          });
        if (!error) await fetchInfo();
      }
    },
    [info, divisionId, variantLabel, fetchInfo]
  );

  const deleteInfo = useCallback(async () => {
    if (!info) return;
    const { error } = await supabase
      .from("booth_variant_info")
      .delete()
      .eq("id", info.id);
    if (!error) {
      setInfo(null);
    }
  }, [info]);

  return { info, loading, saveInfo, deleteInfo, refetch: fetchInfo };
}
