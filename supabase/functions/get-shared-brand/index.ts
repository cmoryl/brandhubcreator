import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Create Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query brand by share token (must be public)
    const { data: brand, error } = await supabase
      .from('brands')
      .select('id, name, slug, guide_data, is_public, created_at, updated_at')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
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

    // Extract key brand data for sharing
    const guideData = brand.guide_data as Record<string, unknown> || {};
    const logoData = guideData.logo as Record<string, unknown> | null;
    
    const sharedBrand = {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      // Extract branding essentials
      colors: guideData.colorPalette || guideData.colors || null,
      fonts: guideData.typography || guideData.fonts || null,
      logo_url: logoData?.url || guideData.logoUrl || null,
      mood_keywords: guideData.moodKeywords || guideData.brandPersonality || null,
      imagery_style: guideData.imageryStyle || guideData.visualStyle || null,
      industry: guideData.industry || null,
      target_audience: guideData.targetAudience || null,
      tagline: guideData.tagline || null,
      voice: guideData.brandVoice || guideData.voice || null,
      // Full guide data for complete import
      guide_data: guideData,
      created_at: brand.created_at,
      updated_at: brand.updated_at,
    };

    return new Response(
      JSON.stringify({ brand: sharedBrand }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
