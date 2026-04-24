import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrandContext {
  name: string;
  colors: Array<{ hex: string; name: string; role?: string }>;
  tagline?: string;
  archetype?: string;
  toneOfVoice?: string[];
  industry?: string;
  mission?: string;
  values?: string[];
  fonts?: Array<{ family: string; role?: string }>;
  imageryAvoidList?: Array<{ name?: string; reason?: string; url?: string }>;
}

interface GenerateRequest {
  prompt: string;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  category?: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16';
  stylePreset?: 'photorealistic' | 'illustration' | 'minimal' | 'bold' | '3d' | 'abstract';
  applyBrandContext?: boolean;
  saveToHistory?: boolean;
  promptId?: string;
}

function buildBrandConstraints(brand: BrandContext): string {
  const parts: string[] = [];
  
  // Color palette
  if (brand.colors && brand.colors.length > 0) {
    const colorList = brand.colors.slice(0, 5).map(c => {
      const role = c.role ? ` (${c.role})` : '';
      return `${c.name || c.hex}${role}`;
    }).join(', ');
    parts.push(`Use brand color palette: ${colorList}`);
  }
  
  // Brand archetype/tone
  if (brand.archetype) {
    parts.push(`Brand archetype: ${brand.archetype}`);
  }
  
  if (brand.toneOfVoice && brand.toneOfVoice.length > 0) {
    parts.push(`Visual tone: ${brand.toneOfVoice.slice(0, 3).join(', ')}`);
  }
  
  // Industry context
  if (brand.industry) {
    parts.push(`Industry context: ${brand.industry}`);
  }
  
  // Typography hint
  if (brand.fonts && brand.fonts.length > 0) {
    const primaryFont = brand.fonts.find(f => f.role === 'primary')?.family || brand.fonts[0]?.family;
    if (primaryFont) {
      parts.push(`Typography style: ${primaryFont}`);
    }
  }
  
  return parts.join('. ');
}

function buildAvoidDirectives(brand: BrandContext): string {
  if (!brand.imageryAvoidList || brand.imageryAvoidList.length === 0) return '';
  // Cap at the 12 most recent rejections to keep prompt size sane
  const recent = brand.imageryAvoidList.slice(-12);
  const reasons = recent
    .map((item) => item.reason?.trim())
    .filter((r): r is string => !!r && r.length > 0);

  const lines: string[] = [];
  lines.push('NEGATIVE FEEDBACK — these directions have been explicitly rejected by the brand team. DO NOT generate imagery in this style, composition, or subject matter:');
  if (reasons.length > 0) {
    const unique = Array.from(new Set(reasons)).slice(0, 10);
    unique.forEach((r) => lines.push(`- Avoid: ${r}`));
  } else {
    lines.push(`- ${recent.length} previously rejected reference${recent.length === 1 ? '' : 's'}; steer clearly away from their style and treatment.`);
  }
  return lines.join('\n');
}

function getAspectRatioDimensions(ratio: string): { width: number; height: number } {
  switch (ratio) {
    case '16:9': return { width: 1920, height: 1080 };
    case '4:3': return { width: 1600, height: 1200 };
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1':
    default: return { width: 1024, height: 1024 };
  }
}

function getStyleModifiers(preset: string): string {
  switch (preset) {
    case 'photorealistic':
      return 'Photorealistic, high-resolution photography, professional lighting, sharp focus, ultra high detail.';
    case 'illustration':
      return 'Digital illustration style, clean vector aesthetics, modern design, flat color areas with subtle gradients.';
    case 'minimal':
      return 'Minimalist design, clean lines, generous white space, simple geometric forms, elegant simplicity.';
    case 'bold':
      return 'Bold graphic design, strong contrasts, dynamic composition, impactful visual presence.';
    case '3d':
      return '3D rendered, isometric perspective, soft shadows, modern materials, professional CGI quality.';
    case 'abstract':
      return 'Abstract composition, artistic interpretation, flowing forms, expressive color interactions.';
    default:
      return 'Professional quality, high resolution, clean design.';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      prompt, 
      entityId, 
      entityType, 
      category = 'general',
      aspectRatio = '1:1', 
      stylePreset = 'photorealistic',
      applyBrandContext = true,
      saveToHistory = true,
      promptId
    }: GenerateRequest = await req.json();

    if (!prompt || !entityId || !entityType) {
      return new Response(
        JSON.stringify({ error: "prompt, entityId, and entityType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch entity data for brand context
    let brandContext: BrandContext | null = null;
    let organizationId: string | null = null;
    
    if (applyBrandContext) {
      const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
      const { data: entity, error: entityError } = await supabase
        .from(tableName)
        .select('name, guide_data, organization_id')
        .eq('id', entityId)
        .single();
      
      if (entity && !entityError) {
        const guideData = entity.guide_data as Record<string, unknown> || {};
        const identity = guideData.identity as Record<string, unknown> || {};
        
        brandContext = {
          name: entity.name,
          colors: (guideData.colors as BrandContext['colors']) || [],
          tagline: (guideData.tagline as Record<string, unknown>)?.primary as string || undefined,
          archetype: identity.archetype as string || undefined,
          toneOfVoice: identity.toneOfVoice as string[] || undefined,
          industry: guideData.industry as string || undefined,
          mission: identity.missionStatement as string || undefined,
          fonts: (guideData.typography as BrandContext['fonts']) || [],
          imageryAvoidList: (guideData.imageryAvoidList as BrandContext['imageryAvoidList']) || [],
        };
        organizationId = entity.organization_id;
      }
    }

    // Build enhanced prompt with brand constraints
    let enhancedPrompt = prompt;
    
    if (brandContext) {
      const constraints = buildBrandConstraints(brandContext);
      if (constraints) {
        enhancedPrompt = `${prompt}\n\nBrand Guidelines:\n${constraints}`;
      }
      const avoidDirectives = buildAvoidDirectives(brandContext);
      if (avoidDirectives) {
        enhancedPrompt = `${enhancedPrompt}\n\n${avoidDirectives}`;
      }
    }
    
    // Add style modifiers
    const styleModifiers = getStyleModifiers(stylePreset);
    enhancedPrompt = `${enhancedPrompt}\n\nStyle: ${styleModifiers}`;
    
    // Add aspect ratio hint
    const dimensions = getAspectRatioDimensions(aspectRatio);
    enhancedPrompt = `${enhancedPrompt}\n\nAspect ratio: ${aspectRatio} (${dimensions.width}x${dimensions.height})`;

    console.log(`[generate-creative-asset] Generating for ${entityType}/${entityId} with prompt length: ${enhancedPrompt.length}`);

    // Generate image with Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: enhancedPrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-creative-asset] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || '';

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image generated", textResponse }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to history if requested
    let savedAssetId: string | null = null;
    if (saveToHistory) {
      const { data: savedAsset, error: saveError } = await supabase
        .from('brand_generated_assets')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          organization_id: organizationId,
          name: prompt.slice(0, 100),
          category,
          asset_type: 'image',
          image_url: imageUrl,
          prompt_used: enhancedPrompt,
          prompt_id: promptId || null,
          model_used: 'gemini-2.5-flash-image',
          generation_params: {
            aspectRatio,
            stylePreset,
            applyBrandContext,
            originalPrompt: prompt
          },
          aspect_ratio: aspectRatio,
          created_by: user.id
        })
        .select('id')
        .single();
      
      if (!saveError && savedAsset) {
        savedAssetId = savedAsset.id;
      }

      // Update prompt usage if from library
      if (promptId) {
        await supabase
          .from('brand_prompt_library')
          .update({ 
            use_count: supabase.rpc('increment', { x: 1 }),
            last_used_at: new Date().toISOString()
          })
          .eq('id', promptId);
      }
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        textResponse,
        savedAssetId,
        promptUsed: enhancedPrompt,
        brandContextApplied: !!brandContext
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-creative-asset] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
