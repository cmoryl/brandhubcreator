// supabase/functions/globallink-cultural-adapt/index.ts
// Cultural adaptation suggestions using Lovable AI Gateway

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CulturalAdaptRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  entity_name?: string;
  target_region?: string;
  target_country?: string;
  variant_level?: string;
  region_name?: string;
  sections?: string[];
}

// Fallback static data for when AI is unavailable
const LOCALE_NAMES: Record<string, string> = {
  JP: 'Japan', CN: 'China', IN: 'India', SA: 'Saudi Arabia',
  US: 'United States', DE: 'Germany', BR: 'Brazil', GB: 'United Kingdom',
  FR: 'France', ES: 'Spain', KR: 'South Korea', MX: 'Mexico',
  AU: 'Australia', AE: 'UAE', SG: 'Singapore',
  APAC: 'Asia Pacific', EMEA: 'Europe, Middle East & Africa',
  LATAM: 'Latin America', NA: 'North America', ANZ: 'Australia & New Zealand',
  MENA: 'Middle East & North Africa', SEA: 'Southeast Asia',
  DACH: 'Germany, Austria, Switzerland', NORDICS: 'Nordic Countries',
};

// Extract country code from language codes like "en-US" -> "US"
function resolveCountryCode(code: string): string {
  if (code.includes('-')) {
    return code.split('-').pop()!.toUpperCase();
  }
  return code.toUpperCase();
}

function resolveLocaleName(code: string, regionName?: string): string {
  if (regionName) return regionName;
  const resolved = resolveCountryCode(code);
  return LOCALE_NAMES[resolved] || LOCALE_NAMES[code] || code;
}

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
    const { target_region, target_country, variant_level, region_name, entity_name, sections = [] } = request;

    const rawCode = target_country || target_region || 'global';
    const localeName = resolveLocaleName(rawCode, region_name);
    const countryCode = resolveCountryCode(rawCode);

    // Try AI-powered generation first
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (LOVABLE_API_KEY) {
      try {
        const entityContext = entity_name ? ` for the brand "${entity_name}"` : '';
        const prompt = `You are a cultural branding expert. Generate cultural adaptation notes${entityContext} targeting the ${localeName} market (code: ${rawCode}, level: ${variant_level || 'unknown'}).

Provide practical, actionable cultural considerations organized into these categories:
1. Color symbolism and preferences
2. Imagery and visual guidelines  
3. Messaging tone and communication style
4. Typography and layout preferences
5. Cultural taboos or sensitivities to avoid

Be specific to ${localeName}. Keep each category to 2-3 sentences.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3.1-flash-lite-preview',
            messages: [
              { role: 'system', content: 'You are a cultural branding and localization expert. Provide concise, actionable cultural adaptation guidance.' },
              { role: 'user', content: prompt },
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'cultural_adaptation',
                description: 'Return cultural adaptation suggestions for regional branding.',
                parameters: {
                  type: 'object',
                  properties: {
                    color_notes: { type: 'string', description: 'Color symbolism and preferences for this market' },
                    imagery_notes: { type: 'string', description: 'Visual and imagery guidelines' },
                    messaging_notes: { type: 'string', description: 'Communication tone and messaging style' },
                    typography_notes: { type: 'string', description: 'Typography and layout preferences' },
                    taboos: { type: 'string', description: 'Cultural taboos and sensitivities to avoid' },
                    adaptation_summary: { type: 'string', description: 'Brief overall adaptation summary for this market' },
                  },
                  required: ['color_notes', 'imagery_notes', 'messaging_notes', 'adaptation_summary'],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'cultural_adaptation' } },
          }),
        });

        if (aiResponse.status === 429) {
          console.warn('AI rate limited, falling back to static data');
        } else if (aiResponse.status === 402) {
          console.warn('AI credits exhausted, falling back to static data');
        } else if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall?.function?.arguments) {
            let args;
            try {
              args = typeof toolCall.function.arguments === 'string' 
                ? JSON.parse(toolCall.function.arguments) 
                : toolCall.function.arguments;
            } catch {
              args = null;
            }

            if (args) {
              const suggestions = [];
              let idx = 0;

              if (args.color_notes) {
                suggestions.push({
                  id: `color-ai-${idx++}`,
                  section: 'colors',
                  field: 'palette',
                  original_value: null,
                  suggested_value: { culturalNote: args.color_notes },
                  reason: args.color_notes,
                  confidence: 0.9,
                  status: 'pending',
                });
              }

              if (args.imagery_notes) {
                suggestions.push({
                  id: `imagery-ai-${idx++}`,
                  section: 'imagery',
                  field: 'culturalGuidelines',
                  original_value: null,
                  suggested_value: [args.imagery_notes],
                  reason: args.imagery_notes,
                  confidence: 0.9,
                  status: 'pending',
                });
              }

              if (args.messaging_notes) {
                suggestions.push({
                  id: `messaging-ai-${idx++}`,
                  section: 'messaging',
                  field: 'tone',
                  original_value: null,
                  suggested_value: args.messaging_notes,
                  reason: args.messaging_notes,
                  confidence: 0.85,
                  status: 'pending',
                });
              }

              if (args.typography_notes) {
                suggestions.push({
                  id: `typography-ai-${idx++}`,
                  section: 'typography',
                  field: 'guidelines',
                  original_value: null,
                  suggested_value: args.typography_notes,
                  reason: args.typography_notes,
                  confidence: 0.8,
                  status: 'pending',
                });
              }

              if (args.taboos) {
                suggestions.push({
                  id: `taboos-ai-${idx++}`,
                  section: 'cultural_sensitivity',
                  field: 'taboos',
                  original_value: null,
                  suggested_value: args.taboos,
                  reason: args.taboos,
                  confidence: 0.85,
                  status: 'pending',
                });
              }

              return new Response(
                JSON.stringify({
                  success: true,
                  suggestions,
                  target: rawCode,
                  locale_name: localeName,
                  adaptation_summary: args.adaptation_summary || '',
                  source: 'ai',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } catch (aiErr) {
        console.error('AI generation failed, falling back to static:', aiErr);
      }
    }

    // Fallback: static cultural data
    const COLOR_NOTES: Record<string, Record<string, string>> = {
      JP: { white: 'Associated with mourning', red: 'Lucky and celebratory' },
      CN: { white: 'Funeral color', red: 'Very auspicious' },
      IN: { white: 'Mourning color', red: 'Auspicious for weddings' },
      SA: { green: 'Sacred in Islamic culture', gold: 'Associated with wealth' },
      US: { red: 'Attention/urgency', blue: 'Trust/corporate' },
      DE: { blue: 'Trust', green: 'Environmental' },
      BR: { green: 'National pride', yellow: 'National color' },
      GB: { blue: 'Trust/authority', red: 'Heritage/tradition' },
      FR: { blue: 'Trust/liberty', red: 'Passion/luxury' },
      KR: { white: 'Purity/innocence', red: 'Passion/good fortune' },
      MX: { green: 'Hope/national identity', red: 'National pride' },
      AU: { green: 'National color', gold: 'National color' },
      AE: { green: 'Islamic culture', gold: 'Luxury/prestige' },
      SG: { red: 'Prosperity/good fortune', white: 'Purity' },
    };

    const IMAGERY: Record<string, string[]> = {
      JP: ['Avoid number 4', 'Cherry blossoms are positive', 'Subtle, refined aesthetics preferred'],
      CN: ['Red and gold are auspicious', 'Favor number 8', 'Avoid number 4'],
      SA: ['Avoid alcohol imagery', 'Green is sacred', 'Modest dress in imagery'],
      IN: ['Avoid beef imagery', 'Lotus is positive', 'Vibrant colors resonate'],
      DE: ['Precision over flashiness', 'Environmental consciousness', 'Clean, functional design'],
      BR: ['Vibrant colors preferred', 'Family imagery resonates', 'Informal, warm tone'],
      GB: ['Understated elegance', 'Heritage references', 'Subtle humor appreciated'],
      FR: ['Elegance and sophistication valued', 'Art and culture references', 'Refined aesthetics'],
      KR: ['K-beauty aesthetics', 'Technology-forward imagery', 'Youth culture important'],
      US: ['Diversity in representation', 'Bold, direct messaging', 'Innovation themes'],
    };

    const suggestions: Array<{
      id: string; section: string; field: string;
      original_value: unknown; suggested_value: unknown;
      reason: string; confidence: number; status: string;
    }> = [];

    const lookupCode = COLOR_NOTES[countryCode] ? countryCode : rawCode;

    if (!sections.length || sections.includes('colors')) {
      const colors = COLOR_NOTES[lookupCode];
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

    if (!sections.length || sections.includes('imagery')) {
      const guidelines = IMAGERY[lookupCode];
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

    if (!sections.length || sections.includes('messaging')) {
      const formalLocales = ['JP', 'DE', 'SA', 'CN', 'KR'];
      if (formalLocales.includes(lookupCode)) {
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
        target: rawCode,
        locale_name: localeName,
        source: 'static',
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
