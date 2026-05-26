import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    // Verify user
    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { division } = await req.json();
    if (!division) throw new Error("Missing division data");

    // Fetch existing production specs for this division
    const { data: specs } = await supabase
      .from("booth_production_specs")
      .select("category, title, content")
      .eq("division_id", division.id)
      .order("display_order");

    const specsContext = specs?.length
      ? specs.map(s => `[${s.category}] ${s.title}: ${s.content}`).join("\n")
      : "No existing specs available.";

    // Step 1: Generate structured spec sheet via text model
    const specPrompt = `You are a trade show booth production specialist. Generate a comprehensive digital production specification sheet for the "${division.name}" booth division.

Division Details:
- Name: ${division.name}
- Tagline: ${division.tagline}
- Description: ${division.description}
- Brand Color: ${division.color}
- Services: ${division.services?.join(", ") || "N/A"}
- Email: ${division.email}
- Website: ${division.website}

Existing Production Specs:
${specsContext}

Generate a complete production spec sheet as a JSON object with this structure:
{
  "boothTitle": "Division name - Digital Template",
  "dimensions": { "width": "...", "depth": "...", "height": "...", "footprint": "..." },
  "materials": [{ "component": "...", "material": "...", "finish": "...", "notes": "..." }],
  "graphics": [{ "panel": "...", "size": "...", "resolution": "...", "format": "...", "bleed": "..." }],
  "lighting": [{ "type": "...", "quantity": "...", "placement": "...", "color_temp": "..." }],
  "electrical": { "totalPower": "...", "outlets": "...", "specialRequirements": "..." },
  "furniture": [{ "item": "...", "quantity": "...", "dimensions": "...", "finish": "..." }],
  "technology": [{ "device": "...", "specs": "...", "mounting": "...", "connectivity": "..." }],
  "colorSpecs": { "primary": "${division.color}", "pantone": "...", "cmyk": "...", "vinyl": "..." },
  "productionTimeline": [{ "phase": "...", "duration": "...", "deliverable": "..." }],
  "installationNotes": "...",
  "shippingSpecs": { "crates": "...", "weight": "...", "specialHandling": "..." }
}

Make specs realistic for a professional 20x20 trade show booth. Include actual dimensions, material specs, and production-grade detail.`;

    const specResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [{ role: "user", content: specPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "production_spec_sheet",
            description: "Return a complete booth production specification sheet",
            parameters: {
              type: "object",
              properties: {
                boothTitle: { type: "string" },
                dimensions: {
                  type: "object",
                  properties: {
                    width: { type: "string" },
                    depth: { type: "string" },
                    height: { type: "string" },
                    footprint: { type: "string" }
                  }
                },
                materials: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      component: { type: "string" },
                      material: { type: "string" },
                      finish: { type: "string" },
                      notes: { type: "string" }
                    }
                  }
                },
                graphics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      panel: { type: "string" },
                      size: { type: "string" },
                      resolution: { type: "string" },
                      format: { type: "string" },
                      bleed: { type: "string" }
                    }
                  }
                },
                lighting: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      quantity: { type: "string" },
                      placement: { type: "string" },
                      color_temp: { type: "string" }
                    }
                  }
                },
                electrical: {
                  type: "object",
                  properties: {
                    totalPower: { type: "string" },
                    outlets: { type: "string" },
                    specialRequirements: { type: "string" }
                  }
                },
                furniture: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      quantity: { type: "string" },
                      dimensions: { type: "string" },
                      finish: { type: "string" }
                    }
                  }
                },
                technology: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      device: { type: "string" },
                      specs: { type: "string" },
                      mounting: { type: "string" },
                      connectivity: { type: "string" }
                    }
                  }
                },
                colorSpecs: {
                  type: "object",
                  properties: {
                    primary: { type: "string" },
                    pantone: { type: "string" },
                    cmyk: { type: "string" },
                    vinyl: { type: "string" }
                  }
                },
                productionTimeline: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      phase: { type: "string" },
                      duration: { type: "string" },
                      deliverable: { type: "string" }
                    }
                  }
                },
                installationNotes: { type: "string" },
                shippingSpecs: {
                  type: "object",
                  properties: {
                    crates: { type: "string" },
                    weight: { type: "string" },
                    specialHandling: { type: "string" }
                  }
                }
              },
              required: ["boothTitle", "dimensions", "materials", "graphics"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "production_spec_sheet" } }
      }),
    });

    if (!specResponse.ok) {
      const status = specResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`Spec generation failed: ${status}`);
    }

    const specData = await specResponse.json();
    let specSheet = null;

    // Extract from tool call
    const toolCall = specData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        specSheet = JSON.parse(toolCall.function.arguments);
      } catch {
        // Try regex fallback
        const content = specData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) specSheet = JSON.parse(jsonMatch[0]);
      }
    }

    // Step 2: Generate booth mockup image
    const imagePrompt = `Professional 3D rendered trade show booth design for "${division.name}" division. 
Modern 20x20 exhibition booth with clean lines, featuring brand color ${division.color}. 
The booth includes: backlit graphics panels with "${division.tagline}" text, reception counter, product display areas, LED lighting, branded furniture.
Services displayed: ${division.services?.slice(0, 4).join(", ") || "consulting"}.
Corporate professional style, photorealistic rendering, exhibition hall setting, 16:9 aspect ratio.
Ultra high resolution trade show booth mockup.`;

    let mockupImageUrl: string | null = null;

    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (base64Image) {
          // Upload to storage
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `booth-templates/${division.id}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("organization-assets")
            .upload(fileName, bytes, { contentType: "image/png", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("organization-assets")
              .getPublicUrl(fileName);
            mockupImageUrl = urlData.publicUrl;
          }
        }
      }
    } catch (imgErr) {
      console.error("Image generation error (non-fatal):", imgErr);
    }

    return new Response(JSON.stringify({
      specSheet,
      mockupImageUrl,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-booth-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
