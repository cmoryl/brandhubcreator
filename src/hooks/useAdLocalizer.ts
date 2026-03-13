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

export interface MarketCaption {
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface ComplianceResult {
  score: number;
  issues: string[];
}

export interface MarketResult {
  market: string;
  loading: boolean;
  image: string | null;
  error: string | null;
  culturalInsights: CulturalInsights | null;
  insightsLoading: boolean;
  caption: MarketCaption | null;
  captionLoading: boolean;
  compliance: ComplianceResult | null;
  complianceLoading: boolean;
  saved: boolean;
}

export interface BrandContext {
  brandId: string;
  organizationId: string;
  brandName: string;
  colors?: { name: string; hex: string }[];
  archetype?: string;
  voiceTone?: string;
  industry?: string;
  tagline?: string;
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
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);

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

  const loadBrandContext = useCallback(async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, organization_id, guide_data')
        .eq('id', brandId)
        .single();

      if (error || !data) return null;

      const guide = data.guide_data as any;
      const ctx: BrandContext = {
        brandId: data.id,
        organizationId: data.organization_id || '',
        brandName: data.name,
        colors: Array.isArray(guide?.colors) ? guide.colors.slice(0, 6).map((c: any) => ({ name: c.name || '', hex: c.hex || '' })) : [],
        archetype: guide?.identity?.archetype || '',
        voiceTone: guide?.identity?.toneOfVoice?.[0] || guide?.identity?.voiceTone || '',
        industry: guide?.industry || '',
        tagline: guide?.hero?.tagline || guide?.tagline?.primary || '',
      };
      setBrandContext(ctx);
      return ctx;
    } catch (err) {
      console.warn('Failed to load brand context:', err);
      return null;
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
      caption: null, captionLoading: false,
      compliance: null, complianceLoading: false,
      saved: false,
    }));
    setResults(initialResults);

    // Phase 1: Fetch GlobalLink cultural insights in parallel
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

    // Phase 2: Generate images with GlobalLink + brand context
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
                brandContext: brandContext ? {
                  name: brandContext.brandName,
                  colors: brandContext.colors,
                  archetype: brandContext.archetype,
                  voiceTone: brandContext.voiceTone,
                  industry: brandContext.industry,
                  tagline: brandContext.tagline,
                } : null,
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
  }, [brandContext]);

  const generateCaption = useCallback(async (market: string) => {
    if (!brandContext?.organizationId) {
      toast.error('Select a brand first for caption generation');
      return;
    }

    setResults(prev => prev.map(r =>
      r.market === market ? { ...r, captionLoading: true } : r
    ));

    try {
      const marketResult = results.find(r => r.market === market);
      const response = await supabase.functions.invoke('dataforce-training?action=generate', {
        body: {
          organization_id: brandContext.organizationId,
          entity_type: 'brand',
          entity_id: brandContext.brandId,
          prompt: `Generate a social media caption for an advertisement localized to ${market}. 
            Brand: ${brandContext.brandName}. Archetype: ${brandContext.archetype || 'N/A'}. 
            Voice: ${brandContext.voiceTone || 'professional'}.
            ${marketResult?.culturalInsights?.messaging_notes ? `Cultural messaging notes: ${marketResult.culturalInsights.messaging_notes}` : ''}
            Include 3-5 relevant hashtags and a call-to-action.`,
          content_type: 'social_caption',
        }
      });

      if (response.error) throw response.error;
      const data = response.data;

      const caption: MarketCaption = {
        caption: data?.generatedContent?.content || data?.content || `Localized caption for ${market}`,
        hashtags: data?.generatedContent?.hashtags || data?.hashtags || [`#${market.replace(/\s/g, '')}`, `#${brandContext.brandName.replace(/\s/g, '')}`],
        cta: data?.generatedContent?.cta || data?.cta || 'Learn more',
      };

      setResults(prev => prev.map(r =>
        r.market === market ? { ...r, caption, captionLoading: false } : r
      ));
    } catch (err) {
      console.error('Caption generation failed:', err);
      setResults(prev => prev.map(r =>
        r.market === market ? { ...r, captionLoading: false } : r
      ));
      toast.error(`Caption generation failed for ${market}`);
    }
  }, [brandContext, results]);

  const runComplianceCheck = useCallback(async (market: string) => {
    if (!brandContext?.organizationId) {
      toast.error('Select a brand first for compliance scanning');
      return;
    }

    setResults(prev => prev.map(r =>
      r.market === market ? { ...r, complianceLoading: true } : r
    ));

    try {
      const response = await supabase.functions.invoke('dataforce-compliance', {
        body: {
          organization_id: brandContext.organizationId,
          entity_type: 'brand',
          entity_id: brandContext.brandId,
          entity_name: `${brandContext.brandName} - ${market} Localization`,
          guide_data: {
            market,
            type: 'localized_ad',
            brandName: brandContext.brandName,
            colors: brandContext.colors,
          },
        }
      });

      if (response.error) throw response.error;
      const data = response.data;

      const compliance: ComplianceResult = {
        score: data?.complianceScore || 0,
        issues: (data?.issues || []).map((i: any) => i.description || i.message || String(i)),
      };

      setResults(prev => prev.map(r =>
        r.market === market ? { ...r, compliance, complianceLoading: false } : r
      ));

      toast.success(`${market}: Compliance ${compliance.score}%`);
    } catch (err) {
      console.error('Compliance check failed:', err);
      setResults(prev => prev.map(r =>
        r.market === market ? { ...r, complianceLoading: false } : r
      ));
      toast.error(`Compliance check failed for ${market}`);
    }
  }, [brandContext]);

  const saveAsset = useCallback(async (market: string) => {
    if (!brandContext?.organizationId) {
      toast.error('Select a brand to save assets');
      return;
    }

    const marketResult = results.find(r => r.market === market);
    if (!marketResult?.image) {
      toast.error('No image to save');
      return;
    }

    try {
      // Save to brand_generated_assets
      const { error } = await supabase
        .from('brand_generated_assets')
        .insert({
          entity_id: brandContext.brandId,
          entity_type: 'brand',
          organization_id: brandContext.organizationId,
          name: `${brandContext.brandName} - ${market} Localized Ad`,
          prompt_used: `Ad localization for ${market}`,
          category: 'localized_ad',
          asset_type: 'image',
          image_url: `data:image/jpeg;base64,${marketResult.image}`,
          is_approved: false,
          generation_params: {
            market,
            culturalInsights: marketResult.culturalInsights,
            caption: marketResult.caption,
            compliance: marketResult.compliance,
          } as any,
        });

      if (error) throw error;

      // Log audit
      await supabase.rpc('insert_audit_log', {
        p_brand_id: brandContext.brandId,
        p_entity_type: 'brand',
        p_action_type: 'ad_localization_saved',
        p_entity_name: `${brandContext.brandName} - ${market}`,
        p_details: { market, hasCaption: !!marketResult.caption, complianceScore: marketResult.compliance?.score },
        p_organization_id: brandContext.organizationId,
      });

      setResults(prev => prev.map(r =>
        r.market === market ? { ...r, saved: true } : r
      ));

      toast.success(`Saved ${market} asset to library`);
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(`Failed to save ${market} asset`);
    }
  }, [brandContext, results]);

  const reset = useCallback(() => {
    setResults([]);
    setAnalysis(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    results,
    isGenerating,
    brandContext,
    analyzeImage,
    generateForMarkets,
    generateCaption,
    runComplianceCheck,
    saveAsset,
    loadBrandContext,
    reset,
    setResults,
  };
}
