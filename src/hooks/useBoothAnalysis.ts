import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BoothAnalysis {
  id: string;
  division_id: string;
  variant_label: string | null;
  overall_score: number;
  analysis_data: {
    summary: string;
    messaging_score: number;
    content_score: number;
    differentiation_score: number;
    engagement_score: number;
  };
  strengths: { title: string; detail: string }[];
  improvements: { title: string; detail: string; priority: string }[];
  recommendations: { action: string; impact: string }[];
  created_at: string;
}

interface BoothDivisionContext {
  division_id: string;
  division_name: string;
  division_tagline?: string;
  division_description?: string;
  division_services?: string[];
  division_color?: string;
  variant_label?: string;
  content_sections?: { heading: string; bullets: string[] }[];
}

export function useBoothAnalysis(divisionId: string) {
  const [analysis, setAnalysis] = useState<BoothAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_ai_analyses")
      .select("*")
      .eq("division_id", divisionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAnalysis({
        id: data.id,
        division_id: data.division_id,
        variant_label: data.variant_label,
        overall_score: data.overall_score ?? 0,
        analysis_data: data.analysis_data as BoothAnalysis["analysis_data"],
        strengths: (data.strengths as unknown as BoothAnalysis["strengths"]) ?? [],
        improvements: (data.improvements as unknown as BoothAnalysis["improvements"]) ?? [],
        recommendations: (data.recommendations as unknown as BoothAnalysis["recommendations"]) ?? [],
        created_at: data.created_at,
      });
    } else {
      setAnalysis(null);
    }
    setLoading(false);
  }, [divisionId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const runAnalysis = useCallback(async (context: BoothDivisionContext) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("booth-analysis", {
        body: context,
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Analysis failed");

      toast.success("Booth analysis complete!");
      await fetchLatest();
    } catch (err) {
      console.error("Booth analysis error:", err);
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [fetchLatest]);

  return { analysis, loading, analyzing, runAnalysis, refetch: fetchLatest };
}
