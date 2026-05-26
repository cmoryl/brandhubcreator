import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShapeRequest {
  prompt: string;
  brandColors: { hex: string; name: string }[];
  style?: 'geometric' | 'organic' | 'minimal' | 'layered' | 'abstract';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, brandColors, style = 'geometric' } = await req.json() as ShapeRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build color context
    const colorContext = brandColors.length > 0
      ? `Use these brand colors: ${brandColors.map(c => `${c.name}: ${c.hex}`).join(', ')}`
      : 'Use professional, modern colors';

    const systemPrompt = `You are an expert SVG designer creating brand design elements. Generate clean, scalable SVG code for design shapes.

CRITICAL RULES:
1. Output ONLY valid SVG code - no markdown, no explanations, just the SVG
2. Use viewBox for scalability (e.g., viewBox="0 0 100 100")
3. Include width="100" height="100" (or appropriate aspect ratio)
4. Use gradients with unique IDs (use random suffixes like grad-abc123)
5. Keep paths simple and clean - these are brand elements, not illustrations
6. ${colorContext}

STYLE GUIDE for "${style}":
${style === 'geometric' ? '- Use precise geometric shapes (rectangles, circles, polygons)\n- Sharp edges, clean lines\n- Layered elements with transparency' : ''}
${style === 'organic' ? '- Flowing curves and soft edges\n- Natural, rounded forms\n- Smooth gradients' : ''}
${style === 'minimal' ? '- Simple, single-element designs\n- Clean lines, minimal complexity\n- Focus on negative space' : ''}
${style === 'layered' ? '- Multiple overlapping elements\n- Depth through transparency and offset\n- 3D-like effects' : ''}
${style === 'abstract' ? '- Creative, artistic forms\n- Unexpected combinations\n- Bold, expressive shapes' : ''}

OUTPUT: Return ONLY the SVG code, starting with <svg and ending with </svg>`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a brand design shape: ${prompt}` }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract SVG from response (in case there's any extra text)
    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
    if (!svgMatch) {
      console.error("No valid SVG found in response:", content);
      throw new Error("Failed to generate valid SVG");
    }

    const svg = svgMatch[0];

    return new Response(JSON.stringify({ 
      svg,
      prompt,
      style 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Shape generation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
