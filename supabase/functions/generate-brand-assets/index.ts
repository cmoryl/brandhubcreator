import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandContext {
  name: string;
  colors: Array<{ hex: string; name: string; role?: string }>;
  tagline?: string;
  archetype?: string;
  toneOfVoice?: string[];
  industry?: string;
}

interface GenerateRequest {
  type: "patterns" | "gradients";
  brandContext: BrandContext;
  count?: number;
}

function generateGradientsFromColors(colors: Array<{ hex: string; name: string; role?: string }>, count: number = 4): Array<{ name: string; css: string }> {
  const gradients: Array<{ name: string; css: string }> = [];
  
  // Get primary and secondary colors
  const primaryColor = colors.find(c => c.role === 'primary')?.hex || colors[0]?.hex || '#667eea';
  const secondaryColor = colors.find(c => c.role === 'secondary')?.hex || colors[1]?.hex || '#764ba2';
  const accentColor = colors.find(c => c.role === 'accent')?.hex || colors[2]?.hex || '#f093fb';
  
  // Get all hex colors
  const hexColors = colors.map(c => c.hex).filter(Boolean);
  
  // Gradient 1: Primary diagonal
  gradients.push({
    name: "Primary Flow",
    css: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || adjustColor(primaryColor, 30)} 100%)`
  });
  
  // Gradient 2: Radial burst
  gradients.push({
    name: "Radial Burst",
    css: `radial-gradient(circle at 30% 30%, ${adjustColor(primaryColor, 20)} 0%, ${primaryColor} 50%, ${adjustColor(primaryColor, -30)} 100%)`
  });
  
  // Gradient 3: Multi-stop brand gradient
  if (hexColors.length >= 3) {
    gradients.push({
      name: "Brand Spectrum",
      css: `linear-gradient(90deg, ${hexColors[0]} 0%, ${hexColors[1]} 50%, ${hexColors[2]} 100%)`
    });
  } else {
    gradients.push({
      name: "Brand Spectrum",
      css: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 50%, ${secondaryColor} 100%)`
    });
  }
  
  // Gradient 4: Mesh-like conic gradient
  gradients.push({
    name: "Mesh Gradient",
    css: `conic-gradient(from 180deg at 50% 50%, ${primaryColor} 0deg, ${secondaryColor} 90deg, ${accentColor} 180deg, ${secondaryColor} 270deg, ${primaryColor} 360deg)`
  });
  
  // Add more if needed
  if (count > 4) {
    // Gradient 5: Soft fade
    gradients.push({
      name: "Soft Fade",
      css: `linear-gradient(180deg, ${adjustColor(primaryColor, 40)} 0%, ${primaryColor} 100%)`
    });
    
    // Gradient 6: Diagonal accent
    gradients.push({
      name: "Accent Diagonal",
      css: `linear-gradient(45deg, ${secondaryColor} 0%, ${accentColor} 100%)`
    });
  }
  
  return gradients.slice(0, count);
}

function adjustColor(hex: string, percent: number): string {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, r + (255 * percent / 100)));
  g = Math.min(255, Math.max(0, g + (255 * percent / 100)));
  b = Math.min(255, Math.max(0, b + (255 * percent / 100)));
  
  // Convert back to hex
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

async function generatePatternImages(brandContext: BrandContext, count: number = 4): Promise<Array<{ name: string; url: string }>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }
  
  const patterns: Array<{ name: string; url: string }> = [];
  const primaryColor = brandContext.colors.find(c => c.role === 'primary')?.hex || brandContext.colors[0]?.hex || '#667eea';
  const secondaryColor = brandContext.colors.find(c => c.role === 'secondary')?.hex || brandContext.colors[1]?.hex || '#764ba2';
  
  // Color names for prompts
  const colorDescription = brandContext.colors.slice(0, 3).map(c => c.name || c.hex).join(', ');
  
  const patternPrompts = [
    {
      name: "Tessellated Grid",
      prompt: `Create a seamless tileable geometric pattern featuring tessellated hexagons and triangles. Use colors: ${colorDescription}. Style: modern, minimal, corporate. The pattern should be suitable for ${brandContext.name} brand. Clean lines, high contrast, professional. Ultra high resolution.`
    },
    {
      name: "Wave Form",
      prompt: `Create a seamless tileable pattern of flowing wave lines and curves. Use colors: ${colorDescription}. Style: elegant, dynamic, contemporary. Design for ${brandContext.name} brand identity. Smooth gradients between shapes. Ultra high resolution.`
    },
    {
      name: "Circuit Matrix",
      prompt: `Create a seamless tileable geometric pattern resembling circuit boards or data networks. Use colors: ${colorDescription}. Style: tech-forward, innovative, ${brandContext.archetype || 'professional'}. For ${brandContext.name} brand. Nodes and connecting lines. Ultra high resolution.`
    },
    {
      name: "Dimensional Blocks",
      prompt: `Create a seamless tileable isometric 3D cube pattern with depth and shadows. Use colors: ${colorDescription}. Style: bold, architectural, modern. Designed for ${brandContext.name}. Precise geometry, clean edges. Ultra high resolution.`
    }
  ];
  
  for (let i = 0; i < Math.min(count, patternPrompts.length); i++) {
    try {
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
              content: patternPrompts[i].prompt
            }
          ],
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
          name: patternPrompts[i].name,
          url: imageUrl
        });
      }
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
    const { type, brandContext, count = 4 }: GenerateRequest = await req.json();
    
    if (!brandContext || !brandContext.colors || brandContext.colors.length === 0) {
      return new Response(
        JSON.stringify({ error: "Brand context with colors is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (type === "gradients") {
      const gradients = generateGradientsFromColors(brandContext.colors, count);
      return new Response(
        JSON.stringify({ gradients }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (type === "patterns") {
      const patterns = await generatePatternImages(brandContext, count);
      return new Response(
        JSON.stringify({ patterns }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid type. Use 'patterns' or 'gradients'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in generate-brand-assets:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
