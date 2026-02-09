// supabase/functions/globallink-cultural-adapt/index.ts
// Edge function for AI-powered cultural adaptation suggestions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

// Cultural data - kept lightweight
const COLOR_ADAPTATIONS: Record<string, Record<string, string>> = {
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

const IMAGERY_GUIDELINES: Record<string, string[]> = {
  JP: ['Avoid number 4', 'Minimize direct eye contact', 'Cherry blossoms are positive'],
  CN: ['Red and gold are auspicious', 'Dragon imagery is positive', 'Favor number 8'],
  SA: ['Avoid alcohol imagery', 'Gender separation in business contexts', 'Green is sacred'],
  IN: ['Avoid beef imagery', 'Lotus and elephant are positive', 'Use right hand in gestures'],
  DE: ['Precision over flashiness', 'Environmental consciousness', 'Direct imagery'],
  BR: ['Vibrant colors preferred', 'Family imagery resonates', 'Avoid purple'],
};

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

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication', suggestions: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: CulturalAdaptRequest = await req.json();
    const { organization_id, entity_type, entity_id, target_region, target_country, sections = [] } = request;

    // Check if user can use AI features
    const { data: canUseAI } = await supabase.rpc('can_use_ai_features', {
      _user_id: user.id,
      _entity_id: entity_id || null,
      _entity_type: entity_type || null,
    });

    if (!canUseAI) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI features require admin privileges', suggestions: [] }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization's GlobalLink product config
    const { data: config } = await supabase
      .from('globallink_product_config')
      .select('ai_enabled')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (!config?.ai_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI features not enabled', suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetLocale = target_country || target_region || 'global';
    const suggestions: AdaptationSuggestion[] = [];
    const localeName = LOCALE_NAMES[targetLocale] || targetLocale;

    // Generate lightweight suggestions based on locale
    if (!sections.length || sections.includes('colors')) {
      const adaptations = COLOR_ADAPTATIONS[targetLocale];
      if (adaptations) {
        Object.entries(adaptations).forEach(([color, note], idx) => {
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
      const guidelines = IMAGERY_GUIDELINES[targetLocale];
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
    console.error('Cultural adaptation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error), suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
