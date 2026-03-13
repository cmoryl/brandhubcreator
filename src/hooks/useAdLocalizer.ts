import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  text: string[];
  elements: string[];
  mood: string;
}

export interface CulturalInsights {
  color_notes?: string;
  imagery_notes?: string;
  messaging_notes?: string;
  typography_notes?: string;
  taboos?: string;
  adaptation_summary?: string;
}

export interface MarketResult {
  market: string;
  loading: boolean;
  image: string | null;
  error: string | null;
  culturalInsights: CulturalInsights | null;
  insightsLoading: boolean;
}

async function fetchGlobalLinkInsights(market: string): Promise<CulturalInsights | null> {
  try {
    const { data, error } = await supabase.functions.invoke('globallink-cultural-adapt', {
      body: {
        organization_id: 'ad-localizer',
        entity_type: 'brand',
        entity_id: 'ad-localizer',
        entity_name: 'Ad Creative',
        target_country: market,
        variant_level: 'country',
        region_name: market,
        sections: ['colors', 'imagery', 'messaging'],
      },
    });

    if (error) throw error;

    if (data?.success && Array.isArray(data.suggestions)) {
      const insights: CulturalInsights = {};
      for (const s of data.suggestions) {
        if (s.section === 'colors') insights.color_notes = s.reason;
        else if (s.section === 'imagery') insights.imagery_notes = s.reason;
        else if (s.section === 'messaging') insights.messaging_notes = s.reason;
        else if (s.section === 'typography') insights.typography_notes = s.reason;
        else if (s.section === 'taboos') insights.taboos = s.reason;
      }
      // Check for adaptation_summary in the last suggestion or a dedicated field
      const summaryItem = data.suggestions.find((s: any) => s.section === 'summary');
      if (summaryItem) insights.adaptation_summary = summaryItem.reason;
      return insights;
    }
    return null;
  } catch (err) {
    console.warn(`GlobalLink insights failed for ${market}:`, err);
    return null;
  }
}

export function useAdLocalizer() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const analyzeImage = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke('ad-localizer', {
        body: { action: 'analyze', imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      toast.error('Image analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const generateForMarkets = useCallback(async (
    markets: string[],
    imageBase64: string,
    aspectRatio: string,
    culturalAdaptation: boolean,
    currentAnalysis: AnalysisResult | null,
  ) => {
    if (!imageBase64 || markets.length === 0) return;

    setIsGenerating(true);
    const initialResults: MarketResult[] = markets.map(m => ({
      market: m, loading: true, image: null, error: null,
      culturalInsights: null, insightsLoading: culturalAdaptation,
    }));
    setResults(initialResults);

    // Phase 1: Fetch GlobalLink cultural insights in parallel (if cultural adaptation enabled)
    const insightsMap: Record<string, CulturalInsights | null> = {};
    if (culturalAdaptation) {
      const insightsPromises = markets.map(async (market) => {
        const insights = await fetchGlobalLinkInsights(market);
        insightsMap[market] = insights;
        setResults(prev => prev.map(r =>
          r.market === market ? { ...r, culturalInsights: insights, insightsLoading: false } : r
        ));
      });
      await Promise.all(insightsPromises);
    }

    // Phase 2: Generate images with GlobalLink context baked in
    const batchSize = 2;
    for (let i = 0; i < markets.length; i += batchSize) {
      const batch = markets.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (market) => {
          try {
            const { data, error } = await supabase.functions.invoke('ad-localizer', {
              body: {
                action: 'generate',
                imageBase64,
                market,
                aspectRatio,
                culturalAdaptation,
                analysis: currentAnalysis,
                globalLinkInsights: insightsMap[market] || null,
              },
            });

            if (error) throw error;

            setResults(prev => prev.map(r =>
              r.market === market
                ? { ...r, loading: false, image: data?.image || null, error: data?.image ? null : 'Generation failed' }
                : r
            ));
          } catch (err: any) {
            const msg = err?.message || '';
            const errorMsg = msg.includes('429') ? 'Rate limited' : msg.includes('402') ? 'Credits exhausted' : 'API Error';
            if (msg.includes('429')) toast.error('Rate limited — please wait a moment');
            if (msg.includes('402')) toast.error('AI credits exhausted');

            setResults(prev => prev.map(r =>
              r.market === market
                ? { ...r, loading: false, error: errorMsg }
                : r
            ));
          }
        })
      );
    }
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setAnalysis(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    results,
    isGenerating,
    analyzeImage,
    generateForMarkets,
    reset,
    setResults,
  };
}
