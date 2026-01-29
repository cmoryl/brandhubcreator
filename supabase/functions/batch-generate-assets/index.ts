import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrandColor {
  hex: string;
  name: string;
  role?: string;
}

interface GeneratedGradient {
  id: string;
  name: string;
  css: string;
}

interface GeneratedPattern {
  id: string;
  name: string;
  url: string;
}

function generateGradientsFromColors(colors: BrandColor[]): GeneratedGradient[] {
  const gradients: GeneratedGradient[] = [];
  
  const primaryColor = colors.find(c => c.role === 'primary')?.hex || colors[0]?.hex || '#667eea';
  const secondaryColor = colors.find(c => c.role === 'secondary')?.hex || colors[1]?.hex || '#764ba2';
  const accentColor = colors.find(c => c.role === 'accent')?.hex || colors[2]?.hex || '#f093fb';
  
  const hexColors = colors.map(c => c.hex).filter(Boolean);
  
  gradients.push({
    id: crypto.randomUUID(),
    name: "Primary Flow",
    css: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || adjustColor(primaryColor, 30)} 100%)`
  });
  
  gradients.push({
    id: crypto.randomUUID(),
    name: "Radial Burst",
    css: `radial-gradient(circle at 30% 30%, ${adjustColor(primaryColor, 20)} 0%, ${primaryColor} 50%, ${adjustColor(primaryColor, -30)} 100%)`
  });
  
  if (hexColors.length >= 3) {
    gradients.push({
      id: crypto.randomUUID(),
      name: "Brand Spectrum",
      css: `linear-gradient(90deg, ${hexColors[0]} 0%, ${hexColors[1]} 50%, ${hexColors[2]} 100%)`
    });
  } else {
    gradients.push({
      id: crypto.randomUUID(),
      name: "Brand Spectrum",
      css: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 50%, ${secondaryColor} 100%)`
    });
  }
  
  gradients.push({
    id: crypto.randomUUID(),
    name: "Mesh Gradient",
    css: `conic-gradient(from 180deg at 50% 50%, ${primaryColor} 0deg, ${secondaryColor} 90deg, ${accentColor} 180deg, ${secondaryColor} 270deg, ${primaryColor} 360deg)`
  });
  
  return gradients;
}

function adjustColor(hex: string, percent: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.min(255, Math.max(0, r + (255 * percent / 100)));
  g = Math.min(255, Math.max(0, g + (255 * percent / 100)));
  b = Math.min(255, Math.max(0, b + (255 * percent / 100)));
  
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

async function generatePatternImages(brandName: string, colors: BrandColor[], archetype?: string): Promise<GeneratedPattern[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured, skipping pattern generation");
    return [];
  }
  
  const patterns: GeneratedPattern[] = [];
  const colorDescription = colors.slice(0, 3).map(c => c.name || c.hex).join(', ');
  
  const patternPrompts = [
    {
      name: "Tessellated Grid",
      prompt: `Create a seamless tileable geometric pattern featuring tessellated hexagons and triangles. Use colors: ${colorDescription}. Style: modern, minimal, corporate. The pattern should be suitable for ${brandName} brand. Clean lines, high contrast, professional. Ultra high resolution.`
    },
    {
      name: "Wave Form",
      prompt: `Create a seamless tileable pattern of flowing wave lines and curves. Use colors: ${colorDescription}. Style: elegant, dynamic, contemporary. Design for ${brandName} brand identity. Smooth gradients between shapes. Ultra high resolution.`
    },
    {
      name: "Circuit Matrix",
      prompt: `Create a seamless tileable geometric pattern resembling circuit boards or data networks. Use colors: ${colorDescription}. Style: tech-forward, innovative, ${archetype || 'professional'}. For ${brandName} brand. Nodes and connecting lines. Ultra high resolution.`
    },
    {
      name: "Dimensional Blocks",
      prompt: `Create a seamless tileable isometric 3D cube pattern with depth and shadows. Use colors: ${colorDescription}. Style: bold, architectural, modern. Designed for ${brandName}. Precise geometry, clean edges. Ultra high resolution.`
    }
  ];
  
  for (let i = 0; i < patternPrompts.length; i++) {
    try {
      console.log(`Generating pattern ${i + 1}/4 for ${brandName}...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: patternPrompts[i].prompt }],
          modalities: ["image", "text"]
        }),
      });
      
      if (!response.ok) {
        console.error(`Failed to generate pattern ${i + 1}:`, response.status);
        continue;
      }
      
      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        patterns.push({
          id: crypto.randomUUID(),
          name: patternPrompts[i].name,
          url: imageUrl
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error generating pattern ${i + 1}:`, error);
    }
  }
  
  return patterns;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organizationId, generatePatterns = true, generateGradients = true } = await req.json();

    const results = {
      brands: { processed: 0, gradientsAdded: 0, patternsAdded: 0 },
      products: { processed: 0, gradientsAdded: 0, patternsAdded: 0 },
      events: { processed: 0, gradientsAdded: 0, patternsAdded: 0 },
      errors: [] as string[]
    };

    // Process brands
    let brandsQuery = supabase.from("brands").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) {
      brandsQuery = brandsQuery.eq("organization_id", organizationId);
    }
    const { data: brands, error: brandsError } = await brandsQuery;
    
    if (brandsError) {
      results.errors.push(`Failed to fetch brands: ${brandsError.message}`);
    }

    for (const brand of (brands || [])) {
      try {
        const guideData = brand.guide_data as Record<string, unknown> || {};
        const colors: BrandColor[] = (guideData.colors as BrandColor[]) || [];
        const existingGradients = (guideData.gradients as GeneratedGradient[]) || [];
        const existingPatterns = (guideData.patterns as GeneratedPattern[]) || [];
        
        if (colors.length === 0) {
          console.log(`Skipping ${brand.name} - no colors defined`);
          continue;
        }

        const updates: Record<string, unknown> = {};
        
        if (generateGradients && existingGradients.length < 4) {
          const newGradients = generateGradientsFromColors(colors);
          updates.gradients = [...existingGradients, ...newGradients];
          results.brands.gradientsAdded += newGradients.length;
        }
        
        if (generatePatterns && existingPatterns.length < 4) {
          const hero = guideData.hero as { name?: string } | undefined;
          const identity = guideData.identity as { archetype?: string } | undefined;
          const brandName = hero?.name || brand.name;
          const archetype = identity?.archetype;
          const newPatterns = await generatePatternImages(brandName, colors, archetype);
          updates.patterns = [...existingPatterns, ...newPatterns];
          results.brands.patternsAdded += newPatterns.length;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("brands")
            .update({ guide_data: { ...guideData, ...updates } })
            .eq("id", brand.id);
          
          if (updateError) {
            results.errors.push(`Failed to update brand ${brand.name}: ${updateError.message}`);
          } else {
            results.brands.processed++;
            console.log(`Updated brand: ${brand.name}`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Error processing brand ${brand.name}: ${errorMsg}`);
      }
    }

    // Process products
    let productsQuery = supabase.from("products").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) {
      productsQuery = productsQuery.eq("organization_id", organizationId);
    }
    const { data: products, error: productsError } = await productsQuery;
    
    if (productsError) {
      results.errors.push(`Failed to fetch products: ${productsError.message}`);
    }

    for (const product of (products || [])) {
      try {
        const guideData = product.guide_data as Record<string, unknown> || {};
        const colors: BrandColor[] = (guideData.colors as BrandColor[]) || [];
        const existingGradients = (guideData.gradients as GeneratedGradient[]) || [];
        const existingPatterns = (guideData.patterns as GeneratedPattern[]) || [];
        
        if (colors.length === 0) continue;

        const updates: Record<string, unknown> = {};
        
        if (generateGradients && existingGradients.length < 4) {
          const newGradients = generateGradientsFromColors(colors);
          updates.gradients = [...existingGradients, ...newGradients];
          results.products.gradientsAdded += newGradients.length;
        }
        
        if (generatePatterns && existingPatterns.length < 4) {
          const hero = guideData.hero as { name?: string } | undefined;
          const identity = guideData.identity as { archetype?: string } | undefined;
          const productName = hero?.name || product.name;
          const archetype = identity?.archetype;
          const newPatterns = await generatePatternImages(productName, colors, archetype);
          updates.patterns = [...existingPatterns, ...newPatterns];
          results.products.patternsAdded += newPatterns.length;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ guide_data: { ...guideData, ...updates } })
            .eq("id", product.id);
          
          if (updateError) {
            results.errors.push(`Failed to update product ${product.name}: ${updateError.message}`);
          } else {
            results.products.processed++;
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Error processing product ${product.name}: ${errorMsg}`);
      }
    }

    // Process events
    let eventsQuery = supabase.from("events").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) {
      eventsQuery = eventsQuery.eq("organization_id", organizationId);
    }
    const { data: events, error: eventsError } = await eventsQuery;
    
    if (eventsError) {
      results.errors.push(`Failed to fetch events: ${eventsError.message}`);
    }

    for (const event of (events || [])) {
      try {
        const guideData = event.guide_data as Record<string, unknown> || {};
        const colors: BrandColor[] = (guideData.colors as BrandColor[]) || [];
        const existingGradients = (guideData.gradients as GeneratedGradient[]) || [];
        
        if (colors.length === 0) continue;

        const updates: Record<string, unknown> = {};
        
        if (generateGradients && existingGradients.length < 4) {
          const newGradients = generateGradientsFromColors(colors);
          updates.gradients = [...existingGradients, ...newGradients];
          results.events.gradientsAdded += newGradients.length;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("events")
            .update({ guide_data: { ...guideData, ...updates } })
            .eq("id", event.id);
          
          if (updateError) {
            results.errors.push(`Failed to update event ${event.name}: ${updateError.message}`);
          } else {
            results.events.processed++;
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Error processing event ${event.name}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Processed ${results.brands.processed} brands, ${results.products.processed} products, ${results.events.processed} events`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Batch generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
