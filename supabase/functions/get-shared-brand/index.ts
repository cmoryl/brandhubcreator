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
    const patterns = (guideData.patterns as Array<Record<string, unknown>>) || [];
    const gradients = (guideData.gradients as Array<Record<string, unknown>>) || [];
    const brandIcons = (guideData.brandIcons as Array<Record<string, unknown>>) || [];
    const imageAssets = (guideData.imageAssets as Array<Record<string, unknown>>) || [];
    const caseStudies = (guideData.caseStudies as Array<Record<string, unknown>>) || [];
    const brochures = (guideData.brochures as Array<Record<string, unknown>>) || [];
    const templates = (guideData.templates as Array<Record<string, unknown>>) || [];
    const socialAssets = (guideData.socialAssets as Array<Record<string, unknown>>) || [];
    const displayBanners = (guideData.displayBanners as Array<Record<string, unknown>>) || [];
    const videos = (guideData.videos as Array<Record<string, unknown>>) || [];
    const webinars = (guideData.webinars as Array<Record<string, unknown>>) || [];
    
    // Find logo variants
    const primaryLogo = logos.find(l => l.variant === 'primary') || logos[0];
    const monoLogo = logos.find(l => l.variant === 'monochrome');
    const reversedLogo = logos.find(l => l.variant === 'reversed');
    const iconLogo = logos.find(l => l.variant === 'icon');
    const wordmarkLogo = logos.find(l => l.variant === 'wordmark');
    const secondaryLogo = logos.find(l => l.variant === 'secondary');

    // Extract photography guidelines from imagery (do/dont examples)
    const photographyDos = imagery.filter(i => i.type === 'do').map(i => ({
      id: i.id,
      url: i.url,
      description: i.description
    }));
    const photographyDonts = imagery.filter(i => i.type === 'dont').map(i => ({
      id: i.id,
      url: i.url,
      description: i.description
    }));

    // Extract social handles
    const socialHandles = social.map(s => ({
      platform: s.platform,
      handle: s.handle,
      url: s.url,
      color: s.color
    }));

    // Extract misuse examples (do's and don'ts for AI prompts)
    const brandConstraints = misuse.map(m => ({
      id: m.id,
      description: m.description,
      exampleUrl: m.url
    }));

    // Collect ALL imagery URLs for EventKIT asset library
    const allImageryUrls: Array<{ url: string; type: string; name?: string; description?: string }> = [];

    // Hero images
    if (hero.coverImage) {
      allImageryUrls.push({ url: String(hero.coverImage), type: 'hero', name: 'Hero Cover Image' });
    }
    if (hero.logoUrl) {
      allImageryUrls.push({ url: String(hero.logoUrl), type: 'hero-logo', name: 'Hero Logo' });
    }

    // All logos
    logos.forEach(l => {
      if (l.url) {
        allImageryUrls.push({ url: String(l.url), type: 'logo', name: String(l.name || l.variant) });
      }
    });

    // Brand icons/symbols
    brandIcons.forEach(icon => {
      if (icon.url) {
        allImageryUrls.push({ url: String(icon.url), type: 'brand-icon', name: String(icon.name || 'Brand Icon') });
      }
    });

    // Approved photography (do's)
    photographyDos.forEach(p => {
      allImageryUrls.push({ url: String(p.url), type: 'photography-approved', description: String(p.description || '') });
    });

    // Patterns
    patterns.forEach(p => {
      if (p.url) {
        allImageryUrls.push({ url: String(p.url), type: 'pattern', name: String(p.name || 'Pattern') });
      }
    });

    // Image assets library
    imageAssets.forEach(asset => {
      if (asset.url) {
        allImageryUrls.push({ url: String(asset.url), type: 'image-asset', name: String(asset.name || 'Image Asset') });
      }
    });

    // Case study previews
    caseStudies.forEach(cs => {
      if (cs.previewUrl) {
        allImageryUrls.push({ url: String(cs.previewUrl), type: 'case-study', name: String(cs.title || 'Case Study') });
      }
    });

    // Brochure previews/thumbnails
    brochures.forEach(b => {
      if (b.thumbnailUrl) {
        allImageryUrls.push({ url: String(b.thumbnailUrl), type: 'brochure', name: String(b.title || 'Brochure') });
      }
      if (b.previewUrl && b.previewUrl !== b.thumbnailUrl) {
        allImageryUrls.push({ url: String(b.previewUrl), type: 'brochure-preview', name: String(b.title || 'Brochure') });
      }
    });

    // Template thumbnails
    templates.forEach(t => {
      if (t.thumbnailUrl) {
        allImageryUrls.push({ url: String(t.thumbnailUrl), type: 'template', name: String(t.name || 'Template') });
      }
    });

    // Social asset previews
    socialAssets.forEach(sa => {
      if (sa.previewImageUrl) {
        allImageryUrls.push({ url: String(sa.previewImageUrl), type: 'social-asset', name: String(sa.platform || 'Social Asset') });
      }
      if (sa.profileIconUrl) {
        allImageryUrls.push({ url: String(sa.profileIconUrl), type: 'social-profile-icon', name: `${sa.platform} Profile` });
      }
    });

    // Display banner previews
    displayBanners.forEach(db => {
      if (db.previewImageUrl) {
        allImageryUrls.push({ url: String(db.previewImageUrl), type: 'display-banner', name: String(db.name || 'Display Banner') });
      }
    });

    // Video thumbnails
    videos.forEach(v => {
      if (v.thumbnail) {
        allImageryUrls.push({ url: String(v.thumbnail), type: 'video-thumbnail', name: String(v.title || 'Video') });
      }
    });

    // Webinar thumbnails
    webinars.forEach(w => {
      if (w.thumbnailUrl) {
        allImageryUrls.push({ url: String(w.thumbnailUrl), type: 'webinar', name: String(w.title || 'Webinar') });
      }
    });

    return new Response(
      JSON.stringify({
        brand: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          
          // === CORE BRANDING ===
          colors: guideData.colors || [],
          fonts: guideData.typography || [],
          logo_url: primaryLogo?.url || hero.logoUrl || null,
          tagline: tagline.primary || hero.tagline || null,
          taglineVariations: tagline.variations || [],
          voice: identity.toneOfVoice || [],
          mission: identity.missionStatement || null,
          archetype: identity.archetype || null,
          
          // === LOGO VARIANTS (structured) ===
          logos: {
            primary: primaryLogo?.url || null,
            secondary: secondaryLogo?.url || null,
            monochrome: monoLogo?.url || null,
            reversed: reversedLogo?.url || null,
            icon: iconLogo?.url || null,
            wordmark: wordmarkLogo?.url || null,
            all: logos.map(l => ({ 
              id: l.id,
              name: l.name, 
              url: l.url, 
              variant: l.variant 
            }))
          },
          
          // === BRAND SYMBOLS/ICONS ===
          brandIcons: brandIcons.map(icon => ({
            id: icon.id,
            name: icon.name,
            url: icon.url,
            isPrimary: icon.isPrimary || false
          })),
          
          // === VISUAL ASSETS ===
          patterns: patterns.map(p => ({
            id: p.id,
            name: p.name,
            url: p.url
          })),
          gradients: gradients.map(g => ({
            id: g.id,
            name: g.name,
            css: g.css
          })),
          iconography: guideData.iconography || [],
          defaultIconColor: guideData.defaultIconColor || null,
          
          // === PHOTOGRAPHY GUIDELINES ===
          photography: {
            approved: photographyDos,
            rejected: photographyDonts,
            allApprovedUrls: photographyDos.map(p => p.url),
            styleDirection: imagery.length > 0 
              ? `${photographyDos.length} approved styles, ${photographyDonts.length} rejected examples`
              : null
          },
          
          // === IMAGE ASSET LIBRARY ===
          imageAssets: imageAssets.map(asset => ({
            id: asset.id,
            name: asset.name,
            url: asset.url,
            type: asset.type
          })),
          
          // === ALL IMAGERY (consolidated for easy consumption) ===
          allImagery: {
            totalCount: allImageryUrls.length,
            byType: {
              logos: allImageryUrls.filter(i => i.type === 'logo').map(i => i.url),
              brandIcons: allImageryUrls.filter(i => i.type === 'brand-icon').map(i => i.url),
              patterns: allImageryUrls.filter(i => i.type === 'pattern').map(i => i.url),
              photography: allImageryUrls.filter(i => i.type === 'photography-approved').map(i => i.url),
              heroImages: allImageryUrls.filter(i => i.type.startsWith('hero')).map(i => i.url),
              collateral: allImageryUrls.filter(i => ['case-study', 'brochure', 'template'].includes(i.type)).map(i => i.url),
              social: allImageryUrls.filter(i => i.type.startsWith('social')).map(i => i.url),
              banners: allImageryUrls.filter(i => i.type === 'display-banner').map(i => i.url),
              video: allImageryUrls.filter(i => ['video-thumbnail', 'webinar'].includes(i.type)).map(i => i.url),
            },
            all: allImageryUrls
          },
          
          // === DO'S & DON'TS (for AI prompt constraints) ===
          constraints: {
            brandMisuse: brandConstraints,
            colorCombinations: guideData.colorCombinations || [],
            rejectedPhotography: photographyDonts
          },
          
          // === SOCIAL MEDIA ===
          socialMedia: {
            handles: socialHandles,
            hashtags: values.map(v => v.text ? `#${String(v.text).replace(/\s+/g, '')}` : null).filter(Boolean),
            assets: socialAssets.map(sa => ({
              id: sa.id,
              platform: sa.platform,
              postSize: sa.postSize,
              storySize: sa.storySize,
              coverSize: sa.coverSize,
              previewImageUrl: sa.previewImageUrl,
              profileIconUrl: sa.profileIconUrl
            }))
          },
          
          // === LAYOUT & COMPOSITION ===
          displayBanners: displayBanners.map(db => ({
            id: db.id,
            name: db.name,
            dimensions: db.dimensions,
            aspectRatio: db.aspectRatio,
            category: db.category,
            previewImageUrl: db.previewImageUrl
          })),
          templates: templates.map(t => ({
            id: t.id,
            name: t.name,
            fileType: t.fileType,
            thumbnailUrl: t.thumbnailUrl,
            externalUrl: t.externalUrl
          })),
          templateSpecs: guideData.templateSpecs || [],
          
          // === COLLATERAL PREVIEWS ===
          caseStudies: caseStudies.map(cs => ({
            id: cs.id,
            title: cs.title,
            description: cs.description,
            previewUrl: cs.previewUrl
          })),
          brochures: brochures.map(b => ({
            id: b.id,
            title: b.title,
            category: b.category,
            previewUrl: b.previewUrl,
            thumbnailUrl: b.thumbnailUrl
          })),
          
          // === VIDEO CONTENT ===
          videos: videos.map(v => ({
            id: v.id,
            title: v.title,
            url: v.url,
            type: v.type,
            thumbnail: v.thumbnail
          })),
          webinars: webinars.map(w => ({
            id: w.id,
            title: w.title,
            thumbnailUrl: w.thumbnailUrl,
            recordingUrl: w.recordingUrl,
            status: w.status
          })),
          
          // === EXTENDED IDENTITY ===
          values: values.map(v => ({ 
            id: v.id,
            text: v.text, 
            description: v.description,
            icon: v.icon
          })),
          services: services.map(s => ({
            id: s.id,
            name: s.name,
            description: s.description,
            icon: s.icon,
            imageUrl: s.imageUrl,
            headerImage: s.headerImage
          })),
          
          // === METADATA ===
          industry: guideData.industry || null,
          targetAudience: guideData.targetAudience || null,
          pageSettings: guideData.pageSettings || null,
          heroSettings: {
            coverImage: hero.coverImage || null,
            coverVideo: hero.coverVideo || null,
            useVideo: hero.useVideo || false,
            kenBurnsEffect: hero.kenBurnsEffect || false
          },
          
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
