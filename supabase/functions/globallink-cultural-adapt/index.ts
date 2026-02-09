// supabase/functions/globallink-cultural-adapt/index.ts
// Lightweight edge function for cultural adaptation suggestions - no external deps

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CulturalAdaptRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  target_region?: string;
  target_country?: string;
  sections?: string[];
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

// Static cultural data - minimal memory footprint
const COLOR_NOTES: Record<string, Record<string, string>> = {
  JP: { white: 'Associated with mourning', red: 'Lucky and celebratory' },
  CN: { white: 'Funeral color', red: 'Very auspicious' },
  IN: { white: 'Mourning color', red: 'Auspicious for weddings' },
  SA: { green: 'Sacred in Islamic culture', gold: 'Associated with wealth' },
  US: { red: 'Attention/urgency', blue: 'Trust/corporate' },
  DE: { blue: 'Trust', green: 'Environmental' },
  BR: { green: 'National pride', yellow: 'National color' },
};

const LOCALE_NAMES: Record<string, string> = {
  JP: 'Japan', CN: 'China', IN: 'India', SA: 'Saudi Arabia',
  US: 'United States', DE: 'Germany', BR: 'Brazil', GB: 'United Kingdom',
  FR: 'France', ES: 'Spain', global: 'Global',
};

const IMAGERY: Record<string, string[]> = {
  JP: ['Avoid number 4', 'Cherry blossoms are positive'],
  CN: ['Red and gold are auspicious', 'Favor number 8'],
  SA: ['Avoid alcohol imagery', 'Green is sacred'],
  IN: ['Avoid beef imagery', 'Lotus is positive'],
  DE: ['Precision over flashiness', 'Environmental consciousness'],
  BR: ['Vibrant colors preferred', 'Family imagery resonates'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: CulturalAdaptRequest = await req.json();
    const { target_region, target_country, sections = [] } = request;

    const targetLocale = target_country || target_region || 'global';
    const suggestions: AdaptationSuggestion[] = [];
    const localeName = LOCALE_NAMES[targetLocale] || targetLocale;

    // Generate color suggestions
    if (!sections.length || sections.includes('colors')) {
      const colors = COLOR_NOTES[targetLocale];
      if (colors) {
        Object.entries(colors).forEach(([color, note], idx) => {
          suggestions.push({
            id: `color-${idx}`,
            section: 'colors',
            field: 'palette',
            original_value: color,
            suggested_value: { color, culturalNote: note },
            reason: `In ${localeName}, ${color}: ${note}`,
            confidence: 0.85,
            status: 'pending',
          });
        });
      }
    }

    // Generate imagery suggestions
    if (!sections.length || sections.includes('imagery')) {
      const guidelines = IMAGERY[targetLocale];
      if (guidelines) {
        suggestions.push({
          id: 'imagery-guidelines',
          section: 'imagery',
          field: 'culturalGuidelines',
          original_value: null,
          suggested_value: guidelines,
          reason: `Cultural imagery guidelines for ${localeName}`,
          confidence: 0.9,
          status: 'pending',
        });
      }
    }

    // Generate messaging suggestions
    if (!sections.length || sections.includes('messaging')) {
      const formalLocales = ['JP', 'DE', 'SA', 'CN', 'KR'];
      if (formalLocales.includes(targetLocale)) {
        suggestions.push({
          id: 'messaging-tone',
          section: 'messaging',
          field: 'tone',
          original_value: 'standard',
          suggested_value: 'formal with increased respect markers',
          reason: `${localeName} markets prefer formal, respectful communication`,
          confidence: 0.75,
          status: 'pending',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        target: targetLocale,
        locale_name: localeName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error), suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
