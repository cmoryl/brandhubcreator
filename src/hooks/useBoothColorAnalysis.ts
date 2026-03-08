import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface ColorPsychology {
  color: string;
  emotion: string;
  industry_fit: string;
  notes?: string;
}

export interface ContrastPair {
  foreground: string;
  background: string;
  ratio: number;
  wcag_aa: boolean;
  wcag_aaa?: boolean;
  use_case?: string;
}

export interface ProductionNote {
  color: string;
  hex?: string;
  rgb?: string;
  cmyk?: string;
  pantone?: string;
  cmyk_safe: boolean;
  large_format_notes?: string;
  material_notes?: string;
}

export interface ColorRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  suggested_color?: string;
}

export interface BoothColorAnalysis {
  id: string;
  division_id: string;
  variant_label: string | null;
  colors: string[];
  overall_score: number | null;
  accessibility_score: number | null;
  production_score: number | null;
  analysis_data: {
    summary?: string;
    harmony_type?: string;
    harmony_notes?: string;
    contrast_pairs?: ContrastPair[];
    production_notes?: ProductionNote[];
    strengths?: string[];
  };
  psychology_data: ColorPsychology[] | null;
  recommendations: ColorRecommendation[] | null;
  created_at: string;
  updated_at: string;
}

export function useBoothColorAnalysis(divisionId: string, variantLabel?: string) {
  const [analysis, setAnalysis] = useState<BoothColorAnalysis | null>(null);
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);

    // Fetch current palette colors for the run button
    const { data: palData } = await supabase
      .from('booth_color_palettes')
      .select('colors, variant_label')
      .eq('division_id', divisionId);

    if (palData && palData.length > 0) {
      const normalizeVariant = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
      const targetVariant = normalizeVariant(variantLabel ?? null);

      const exactMatch = palData.find((d) => normalizeVariant(d.variant_label) === targetVariant);
      const sharedMatch = palData.find((d) => d.variant_label === null);
      const fallbackMatch = palData.find((d) => Array.isArray(d.colors) && d.colors.length > 0);
      const match = exactMatch || sharedMatch || fallbackMatch;

      if (match?.colors && Array.isArray(match.colors)) {
        setPaletteColors(match.colors as string[]);
      } else {
        setPaletteColors([]);
      }
    } else {
      setPaletteColors([]);
    }

    const query = (supabase
      .from("booth_color_analyses" as any)
      .select("*") as any)
      .eq("division_id", divisionId);

    if (variantLabel) {
      query.eq("variant_label", variantLabel);
    } else {
      query.is("variant_label", null);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      const d = data as Record<string, unknown>;
      setAnalysis({
        id: d.id as string,
        division_id: d.division_id as string,
        variant_label: d.variant_label as string | null,
        colors: Array.isArray(d.colors) ? d.colors as string[] : [],
        overall_score: d.overall_score as number | null,
        accessibility_score: d.accessibility_score as number | null,
        production_score: d.production_score as number | null,
        analysis_data: (d.analysis_data as BoothColorAnalysis["analysis_data"]) || {},
        psychology_data: Array.isArray(d.psychology_data) ? d.psychology_data as ColorPsychology[] : null,
        recommendations: Array.isArray(d.recommendations) ? d.recommendations as ColorRecommendation[] : null,
        created_at: d.created_at as string,
        updated_at: d.updated_at as string,
      });
    } else {
      setAnalysis(null);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const runAnalysis = useCallback(
    async (colors: string[], divisionName?: string) => {
      setAnalyzing(true);
      try {
        const { data, error } = await supabase.functions.invoke("booth-color-analysis", {
          body: {
            division_id: divisionId,
            division_name: divisionName,
            variant_label: variantLabel || null,
            colors,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success("Color analysis complete");
        await fetchAnalysis();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        logger.debug("Color analysis error:", err);
        toast.error(msg);
      } finally {
        setAnalyzing(false);
      }
    },
    [divisionId, variantLabel, fetchAnalysis]
  );

  return { analysis, loading, analyzing, runAnalysis, paletteColors, refetch: fetchAnalysis };
}
