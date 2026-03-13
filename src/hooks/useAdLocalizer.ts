import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  text: string[];
  elements: string[];
  mood: string;
}

interface MarketResult {
  market: string;
  loading: boolean;
  image: string | null;
  error: string | null;
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
    }));
    setResults(initialResults);

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
