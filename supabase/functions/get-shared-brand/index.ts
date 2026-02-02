import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to safely extract array with limit
function safeArray<T>(arr: unknown, limit = 50): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, limit) as T[];
}

// Helper to safely extract string
function safeStr(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

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
    
    // Extract only essential data with memory limits
    const hero = (guideData.hero as Record<string, unknown>) || {};
    const identity = (guideData.identity as Record<string, unknown>) || {};
    const tagline = (guideData.tagline as Record<string, unknown>) || {};
    
    // Limit arrays to prevent memory bloat
    const logos = safeArray<Record<string, unknown>>(guideData.logos, 10);
    const colors = safeArray<Record<string, unknown>>(guideData.colors, 20);
    const typography = safeArray<Record<string, unknown>>(guideData.typography, 10);
    const patterns = safeArray<Record<string, unknown>>(guideData.patterns, 20);
    const gradients = safeArray<Record<string, unknown>>(guideData.gradients, 20);
    const brandIcons = safeArray<Record<string, unknown>>(guideData.brandIcons, 30);
    const imagery = safeArray<Record<string, unknown>>(guideData.imagery, 30);
    const values = safeArray<Record<string, unknown>>(guideData.values, 20);
    const services = safeArray<Record<string, unknown>>(guideData.services, 20);
    const social = safeArray<Record<string, unknown>>(guideData.social, 10);
    const sponsorLogos = safeArray<Record<string, unknown>>(guideData.sponsorLogos, 50);
    
    // Find logo variants efficiently
    const findLogo = (variant: string) => logos.find(l => l.variant === variant);
    const primaryLogo = findLogo('primary') || logos[0];
    
    // Simplified photo extraction
    const photographyDos = imagery
      .filter(i => i.type === 'do')
      .slice(0, 15)
      .map(i => ({ id: i.id, url: i.url, description: i.description }));
    
    const photographyDonts = imagery
      .filter(i => i.type === 'dont')
      .slice(0, 15)
      .map(i => ({ id: i.id, url: i.url, description: i.description }));

    // Collect imagery URLs efficiently - limit total
    const allImageryUrls: Array<{ url: string; type: string; name?: string }> = [];
    
    // Add hero images (max 2)
    if (hero.coverImage) allImageryUrls.push({ url: String(hero.coverImage), type: 'hero', name: 'Hero Cover' });
    if (hero.logoUrl) allImageryUrls.push({ url: String(hero.logoUrl), type: 'hero-logo', name: 'Hero Logo' });
    
    // Add logos (max 10)
    logos.forEach(l => {
      if (l.url && allImageryUrls.length < 100) {
        allImageryUrls.push({ url: String(l.url), type: 'logo', name: String(l.name || l.variant) });
      }
    });
    
    // Add brand icons (max 20)
    brandIcons.slice(0, 20).forEach(icon => {
      if (icon.url && allImageryUrls.length < 100) {
        allImageryUrls.push({ url: String(icon.url), type: 'brand-icon', name: String(icon.name || 'Icon') });
      }
    });
    
    // Add patterns (max 15)
    patterns.slice(0, 15).forEach(p => {
      if (p.url && allImageryUrls.length < 100) {
        allImageryUrls.push({ url: String(p.url), type: 'pattern', name: String(p.name || 'Pattern') });
      }
    });
    
    // Add approved photography (max 10)
    photographyDos.slice(0, 10).forEach(p => {
      if (p.url && allImageryUrls.length < 100) {
        allImageryUrls.push({ url: String(p.url), type: 'photography-approved' });
      }
    });
    
    // Add sponsor logos (max 30)
    sponsorLogos.slice(0, 30).forEach(s => {
      if (s.url && allImageryUrls.length < 100) {
        allImageryUrls.push({ url: String(s.url), type: 'sponsor-logo', name: String(s.name || 'Sponsor') });
      }
    });

    // Build compact response
    const response = {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        
        // Core branding
        colors: colors.map(c => ({ 
          id: c.id, name: c.name, hex: c.hex, role: c.role, usage: c.usage 
        })),
        fonts: typography.map(t => ({ 
          id: t.id, role: t.role, family: t.fontFamily || t.family, weight: t.weight 
        })),
        logo_url: primaryLogo?.url || hero.logoUrl || null,
        tagline: tagline.primary || hero.tagline || null,
        voice: identity.toneOfVoice || [],
        mission: identity.missionStatement || null,
        
        // Logo variants
        logos: {
          primary: findLogo('primary')?.url || null,
          secondary: findLogo('secondary')?.url || null,
          monochrome: findLogo('monochrome')?.url || null,
          reversed: findLogo('reversed')?.url || null,
          icon: findLogo('icon')?.url || null,
          wordmark: findLogo('wordmark')?.url || null,
          all: logos.map(l => ({ id: l.id, name: l.name, url: l.url, variant: l.variant }))
        },
        
        // Brand icons
        brandIcons: brandIcons.map(icon => ({
          id: icon.id, name: icon.name, url: icon.url, isPrimary: icon.isPrimary || false
        })),
        
        // Visual assets
        patterns: patterns.map(p => ({ id: p.id, name: p.name, url: p.url })),
        gradients: gradients.map(g => ({ id: g.id, name: g.name, css: g.css })),
        
        // Photography
        photography: {
          approved: photographyDos,
          rejected: photographyDonts,
        },
        
        // All imagery (limited for memory)
        allImagery: {
          totalCount: allImageryUrls.length,
          all: allImageryUrls
        },
        
        // Constraints for AI
        constraints: {
          brandMisuse: safeArray(guideData.misuse, 20).map(m => ({
            id: (m as Record<string, unknown>).id,
            description: (m as Record<string, unknown>).description,
            exampleUrl: (m as Record<string, unknown>).url
          })),
          rejectedPhotography: photographyDonts
        },
        
        // Social media
        socialMedia: {
          handles: social.map(s => ({ platform: s.platform, handle: s.handle, url: s.url })),
          hashtags: values.slice(0, 10).map(v => v.text ? `#${String(v.text).replace(/\s+/g, '')}` : null).filter(Boolean),
        },
        
        // Values and services (limited)
        values: values.map(v => ({ id: v.id, text: v.text, description: v.description })),
        services: services.map(s => ({ id: s.id, name: s.name, description: s.description })),
        
        // Sponsor logos
        sponsorLogos: {
          all: sponsorLogos.map(s => ({ id: s.id, name: s.name, url: s.url, tier: s.tier })),
          allLogoUrls: sponsorLogos.map(s => s.url).filter(Boolean).slice(0, 50),
          totalCount: sponsorLogos.length
        },
        
        // Hero settings
        heroSettings: {
          coverImage: hero.coverImage || null,
          coverVideo: hero.coverVideo || null,
          useVideo: hero.useVideo || false,
        },
        
        // Metadata
        industry: guideData.industry || null,
        created_at: brand.created_at,
        updated_at: brand.updated_at,
        
        // Full data for complete import (only on request - commented for memory)
        // guide_data: guideData,
      }
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[get-shared-brand] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
