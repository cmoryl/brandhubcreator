import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken } = await req.json();

    if (!shareToken) {
      return new Response(
        JSON.stringify({ error: 'Share token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Single optimized query with only needed fields
    const { data: brand, error } = await supabase
      .from('brands')
      .select('id, name, slug, guide_data, created_at, updated_at')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch brand' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Brand not found or not shared' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guideData = (brand.guide_data as Record<string, unknown>) || {};
    const hero = (guideData.hero as Record<string, unknown>) || {};
    const logos = (guideData.logos as Array<Record<string, unknown>>) || [];
    const identity = (guideData.identity as Record<string, unknown>) || {};
    const tagline = (guideData.tagline as Record<string, unknown>) || {};
    
    // Find primary logo or first available
    const primaryLogo = logos.find(l => l.variant === 'primary') || logos[0];

    return new Response(
      JSON.stringify({
        brand: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          // Core branding essentials for EventKIT import
          colors: guideData.colors || [],
          fonts: guideData.typography || [],
          logo_url: primaryLogo?.url || hero.logoUrl || null,
          tagline: tagline.primary || hero.tagline || null,
          voice: identity.toneOfVoice || [],
          mission: identity.missionStatement || null,
          archetype: identity.archetype || null,
          // Full data for complete import
          guide_data: guideData,
          created_at: brand.created_at,
          updated_at: brand.updated_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
