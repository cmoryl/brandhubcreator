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
    const social = (guideData.social as Array<Record<string, unknown>>) || [];
    const imagery = (guideData.imagery as Array<Record<string, unknown>>) || [];
    const misuse = (guideData.misuse as Array<Record<string, unknown>>) || [];
    const values = (guideData.values as Array<Record<string, unknown>>) || [];
    const services = (guideData.services as Array<Record<string, unknown>>) || [];
    
    // Find logo variants
    const primaryLogo = logos.find(l => l.variant === 'primary') || logos[0];
    const monoLogo = logos.find(l => l.variant === 'monochrome');
    const reversedLogo = logos.find(l => l.variant === 'reversed');
    const iconLogo = logos.find(l => l.variant === 'icon');

    // Extract photography guidelines from imagery (do/dont examples)
    const photographyDos = imagery.filter(i => i.type === 'do').map(i => ({
      url: i.url,
      description: i.description
    }));
    const photographyDonts = imagery.filter(i => i.type === 'dont').map(i => ({
      url: i.url,
      description: i.description
    }));

    // Extract social handles and hashtags
    const socialHandles = social.map(s => ({
      platform: s.platform,
      handle: s.handle,
      url: s.url
    }));

    // Extract misuse examples (do's and don'ts for AI prompts)
    const brandConstraints = misuse.map(m => ({
      description: m.description,
      exampleUrl: m.url
    }));

    return new Response(
      JSON.stringify({
        brand: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          
          // === CORE BRANDING (Currently Supported) ===
          colors: guideData.colors || [],
          fonts: guideData.typography || [],
          logo_url: primaryLogo?.url || hero.logoUrl || null,
          tagline: tagline.primary || hero.tagline || null,
          voice: identity.toneOfVoice || [],
          mission: identity.missionStatement || null,
          archetype: identity.archetype || null,
          
          // === LOGO VARIANTS ===
          logos: {
            primary: primaryLogo?.url || null,
            monochrome: monoLogo?.url || null,
            reversed: reversedLogo?.url || null,
            icon: iconLogo?.url || null,
            all: logos.map(l => ({ name: l.name, url: l.url, variant: l.variant }))
          },
          
          // === VISUAL ASSETS ===
          patterns: guideData.patterns || [],
          gradients: guideData.gradients || [],
          iconography: guideData.iconography || [],
          defaultIconColor: guideData.defaultIconColor || null,
          
          // === PHOTOGRAPHY GUIDELINES ===
          photography: {
            approved: photographyDos,
            rejected: photographyDonts,
            styleDirection: imagery.length > 0 
              ? `${photographyDos.length} approved styles, ${photographyDonts.length} rejected examples`
              : null
          },
          
          // === DO'S & DON'TS (for AI prompt constraints) ===
          constraints: {
            brandMisuse: brandConstraints,
            colorCombinations: guideData.colorCombinations || []
          },
          
          // === SOCIAL MEDIA ===
          socialMedia: {
            handles: socialHandles,
            hashtags: values.map(v => v.text ? `#${String(v.text).replace(/\s+/g, '')}` : null).filter(Boolean),
            assets: guideData.socialAssets || []
          },
          
          // === LAYOUT & COMPOSITION ===
          displayBanners: guideData.displayBanners || [],
          templates: guideData.templates || [],
          templateSpecs: guideData.templateSpecs || [],
          
          // === EXTENDED IDENTITY ===
          values: values.map(v => ({ 
            text: v.text, 
            description: v.description,
            icon: v.icon
          })),
          services: services.map(s => ({
            name: s.name,
            description: s.description,
            icon: s.icon
          })),
          
          // === METADATA ===
          industry: guideData.industry || null,
          targetAudience: guideData.targetAudience || null,
          pageSettings: guideData.pageSettings || null,
          
          // === FULL DATA (for complete import) ===
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
