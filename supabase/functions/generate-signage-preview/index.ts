import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignagePreviewRequest {
  signageType: string;
  signageName: string;
  dimensions: string;
  brandName?: string;
  brandColors?: string[];
  style?: 'photorealistic' | 'mockup' | 'venue';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signageType, signageName, dimensions, brandName, brandColors, style = 'photorealistic' } = await req.json() as SignagePreviewRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt for hyper-realistic signage imagery
    const colorDescription = brandColors?.length 
      ? `using brand colors: ${brandColors.slice(0, 3).join(', ')}` 
      : '';
    
    const brandContext = brandName ? `for "${brandName}"` : '';
    
    const signageDescriptions: Record<string, string> = {
      'booth-backdrop': 'large trade show booth backdrop wall with lighting',
      'pull-up-banner': 'professional roll-up retractable banner stand',
      'table-banner': 'table throw cover or table top display',
      'hanging-sign': 'overhead hanging banner or sign suspended from ceiling',
      'floor-graphic': 'floor decal or floor standing display',
      'directional': 'wayfinding or directional signage arrow',
      'podium-sign': 'podium graphic or lectern branding',
      'stage-backdrop': 'large stage backdrop with professional lighting',
      'outdoor-banner': 'outdoor vinyl banner or flag',
      'other': 'professional event signage display',
    };

    const signageDesc = signageDescriptions[signageType] || signageDescriptions['other'];
    
    const stylePrompts: Record<string, string> = {
      'photorealistic': 'Ultra photorealistic render, professional photography, soft studio lighting, shallow depth of field, high-end commercial shoot',
      'mockup': 'Clean product mockup on white background, studio lighting, minimal shadows, template-style presentation',
      'venue': 'In realistic venue setting, convention center or event space, natural lighting, people blur in background, authentic trade show atmosphere',
    };

    const prompt = `Generate a hyper-realistic preview image of a ${signageDesc} ${brandContext}. 
The signage is named "${signageName}" with dimensions ${dimensions} ${colorDescription}.
${stylePrompts[style]}
Show the signage from a professional viewing angle, as if photographed at a real event or trade show.
Make it look like a high-quality professional photograph, not an illustration.
16:9 aspect ratio, 4K quality, commercial photography style.`;

    console.log('[generate-signage-preview] Generating for:', signageName, signageType);

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
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[generate-signage-preview] AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    console.log('[generate-signage-preview] Successfully generated image');

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        prompt: prompt.substring(0, 200) + '...',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[generate-signage-preview] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate preview" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
