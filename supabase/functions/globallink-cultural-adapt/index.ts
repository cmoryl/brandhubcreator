// supabase/functions/globallink-cultural-adapt/index.ts
// Edge function for AI-powered cultural adaptation suggestions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CulturalAdaptRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  target_region?: string;
  target_country?: string;
  sections?: string[];
  guide_data: Record<string, unknown>;
}

interface AdaptationSuggestion {
  id: string;
  section: string;
  field: string;
  original_value: unknown;
  suggested_value: unknown;
  reason: string;
  confidence: number;
  status: 'pending' | 'applied' | 'rejected';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: CulturalAdaptRequest = await req.json();
    const { organization_id, entity_type, entity_id, target_region, target_country, guide_data, sections = [] } = request;

    // Check if user can use AI features (org admin or super admin)
    const { data: canUseAI } = await supabase.rpc('can_use_ai_features', {
      _user_id: userId,
      _entity_id: entity_id || null,
      _entity_type: entity_type || null,
    });

    if (!canUseAI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI features require admin privileges',
          suggestions: [],
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization's GlobalLink product config
    const { data: config } = await supabase
      .from('globallink_product_config')
      .select('*')
      .eq('organization_id', organization_id)
      .single();

    if (!config?.ai_enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI features not enabled for this organization',
          suggestions: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get country cultural notes if targeting a specific country
    let culturalContext: Record<string, unknown> = {};
    if (target_country) {
      const { data: countryData } = await supabase
        .from('brand_country_mappings')
        .select('cultural_notes, business_context')
        .eq('organization_id', organization_id)
        .eq('country_code', target_country)
        .single();

      if (countryData) {
        culturalContext = {
          ...countryData.cultural_notes,
          ...countryData.business_context,
        };
      }
    }

    // Generate AI-powered cultural adaptation suggestions
    // In demo mode, return mock suggestions
    const suggestions = await generateCulturalSuggestions(
      guide_data,
      target_country || target_region || 'global',
      culturalContext,
      sections,
      config.ai_model
    );

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        target: target_country || target_region || 'global',
        cultural_context: culturalContext,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cultural adaptation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateCulturalSuggestions(
  guideData: Record<string, unknown>,
  targetLocale: string,
  culturalContext: Record<string, unknown>,
  sections: string[],
  aiModel: string
): Promise<AdaptationSuggestion[]> {
  const suggestions: AdaptationSuggestion[] = [];

  // Cultural color considerations by region
  const colorAdaptations: Record<string, Record<string, string>> = {
    JP: { white: 'Associated with mourning in some contexts', red: 'Lucky and celebratory' },
    CN: { white: 'Funeral color, use gold or red instead', red: 'Very auspicious' },
    IN: { white: 'Associated with mourning', red: 'Auspicious for weddings' },
    SA: { green: 'Sacred in Islamic culture', gold: 'Associated with wealth' },
    US: { red: 'Attention/urgency', green: 'Go/success', blue: 'Trust/corporate' },
    DE: { blue: 'Trust', green: 'Environmental' },
    BR: { green: 'National pride', yellow: 'National color' },
  };

  // Check colors section
  const colors = guideData.colors as Record<string, unknown> | undefined;
  if (colors && (!sections.length || sections.includes('colors'))) {
    const palette = colors.palette as Array<{ name: string; hex: string }> | undefined;
    if (palette && targetLocale in colorAdaptations) {
      const adaptations = colorAdaptations[targetLocale];
      palette.forEach((color, idx) => {
        const colorName = color.name.toLowerCase();
        Object.entries(adaptations).forEach(([key, note]) => {
          if (colorName.includes(key)) {
            suggestions.push({
              id: `color-${idx}-${key}`,
              section: 'colors',
              field: `palette[${idx}]`,
              original_value: color,
              suggested_value: { ...color, culturalNote: note },
              reason: `In ${getLocaleName(targetLocale)}, ${key} is: ${note}`,
              confidence: 0.85,
              status: 'pending',
            });
          }
        });
      });
    }
  }

  // Check imagery section for cultural sensitivities
  const imagery = guideData.imagery as Record<string, unknown> | undefined;
  if (imagery && (!sections.length || sections.includes('imagery'))) {
    const guidelines = imagery.guidelines as string[] | undefined;
    if (guidelines) {
      // Add cultural imagery guidelines
      suggestions.push({
        id: 'imagery-cultural-guidelines',
        section: 'imagery',
        field: 'culturalGuidelines',
        original_value: null,
        suggested_value: getCulturalImageryGuidelines(targetLocale),
        reason: `Cultural imagery considerations for ${getLocaleName(targetLocale)}`,
        confidence: 0.9,
        status: 'pending',
      });
    }
  }

  // Check messaging for cultural tone
  const messaging = guideData.messaging as Record<string, unknown> | undefined;
  if (messaging && (!sections.length || sections.includes('messaging'))) {
    const tone = messaging.tone as string | undefined;
    if (tone) {
      const culturalTone = getCulturalToneAdaptation(tone, targetLocale);
      if (culturalTone !== tone) {
        suggestions.push({
          id: 'messaging-tone',
          section: 'messaging',
          field: 'tone',
          original_value: tone,
          suggested_value: culturalTone,
          reason: `Adapted tone for ${getLocaleName(targetLocale)} market preferences`,
          confidence: 0.75,
          status: 'pending',
        });
      }
    }
  }

  return suggestions;
}

function getLocaleName(code: string): string {
  const names: Record<string, string> = {
    JP: 'Japan',
    CN: 'China',
    IN: 'India',
    SA: 'Saudi Arabia',
    US: 'United States',
    DE: 'Germany',
    BR: 'Brazil',
    GB: 'United Kingdom',
    FR: 'France',
    ES: 'Spain',
    global: 'Global',
    americas: 'Americas',
    emea: 'EMEA',
    apac: 'Asia-Pacific',
  };
  return names[code] || code;
}

function getCulturalImageryGuidelines(locale: string): string[] {
  const guidelines: Record<string, string[]> = {
    JP: [
      'Avoid the number 4 (associated with death)',
      'Minimize direct eye contact in business imagery',
      'Cherry blossoms and cranes are positive symbols',
    ],
    CN: [
      'Red and gold are auspicious colors',
      'Dragon imagery is positive and powerful',
      'Avoid number 4, favor number 8',
    ],
    SA: [
      'Avoid imagery of alcohol, pork, or revealing clothing',
      'Men and women shown separately in business contexts',
      'Green is a sacred color',
    ],
    IN: [
      'Avoid leather/beef imagery',
      'Lotus and elephant are positive symbols',
      'Left hand considered impure - use right hand in gestures',
    ],
    DE: [
      'Precision and quality over flashiness',
      'Environmental consciousness valued',
      'Direct, straightforward imagery preferred',
    ],
    BR: [
      'Vibrant, warm colors preferred',
      'Family and community imagery resonates',
      'Avoid purple (mourning color)',
    ],
  };
  return guidelines[locale] || ['Adapt imagery to local cultural preferences'];
}

function getCulturalToneAdaptation(originalTone: string, locale: string): string {
  const formalLocales = ['JP', 'DE', 'SA', 'CN', 'KR'];
  const casualLocales = ['US', 'AU', 'BR'];

  const isOriginalFormal = originalTone.toLowerCase().includes('formal') ||
                          originalTone.toLowerCase().includes('professional');

  if (formalLocales.includes(locale) && !isOriginalFormal) {
    return originalTone + ' with increased formality for local market';
  }

  if (casualLocales.includes(locale) && isOriginalFormal) {
    return originalTone + ' with approachable, friendly adaptation';
  }

  return originalTone;
}
