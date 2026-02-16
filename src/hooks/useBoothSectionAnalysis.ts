import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SectionAnalysis {
  id: string;
  section_id: string;
  division_id: string;
  section_heading: string;
  overall_score: number;
  analysis_data: {
    summary: string;
    clarity_rating: string;
  };
  strengths: { point: string }[];
  improvements: { point: string; priority: string }[];
  created_at: string;
}

export function useBoothSectionAnalysis(divisionId: string) {
  const [analyses, setAnalyses] = useState<Record<string, SectionAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [analyzingSection, setAnalyzingSection] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_section_analyses")
      .select("*")
      .eq("division_id", divisionId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Keep only the latest per section_id
      const map: Record<string, SectionAnalysis> = {};
      for (const row of data) {
        const sid = row.section_id;
        if (!map[sid]) {
          map[sid] = {
            id: row.id,
            section_id: sid,
            division_id: row.division_id,
            section_heading: row.section_heading,
            overall_score: row.overall_score ?? 0,
            analysis_data: row.analysis_data as SectionAnalysis["analysis_data"],
            strengths: (row.strengths as unknown as SectionAnalysis["strengths"]) ?? [],
            improvements: (row.improvements as unknown as SectionAnalysis["improvements"]) ?? [],
            created_at: row.created_at,
          };
        }
      }
      setAnalyses(map);
    }
    setLoading(false);
  }, [divisionId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const analyzeSection = useCallback(async (sectionId: string, sectionHeading: string, sectionBullets: string[], divisionName?: string) => {
    setAnalyzingSection(sectionId);
    try {
      const { data, error } = await supabase.functions.invoke("booth-analysis", {
        body: {
          action: "section",
          division_id: divisionId,
          division_name: divisionName || divisionId,
          section_id: sectionId,
          section_heading: sectionHeading,
          section_bullets: sectionBullets,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Section analysis failed");

      toast.success(`"${sectionHeading}" analysis complete!`);
      await fetchAll();
    } catch (err) {
      console.error("Section analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Section analysis failed");
    } finally {
      setAnalyzingSection(null);
    }
  }, [divisionId, fetchAll]);

  return { analyses, loading, analyzingSection, analyzeSection, refetch: fetchAll };
}
