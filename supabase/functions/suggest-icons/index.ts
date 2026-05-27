import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ICONOGRAPHY_BRAIN_SUMMARY } from "../_shared/iconographyKnowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, context, brandColors, availableIcons } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a brand design expert. Given a brand's industry and context, recommend the most relevant icons from the Lucide icon library.

Industry: ${industry || "General"}
Context: ${context || "Standard business"}
Brand Colors: ${(brandColors || []).join(", ")}

Available Lucide icon names (subset): ${(availableIcons || []).slice(0, 300).join(", ")}

Recommend 15-25 icons that would be most useful for this brand. For each icon:
- Pick from the available names list EXACTLY (case-sensitive)
- Explain briefly WHY this icon fits the brand
- Categorize it (navigation, action, communication, data, commerce, marketing, industry-specific)

Focus on icons that are:
1. Industry-relevant (specific to their sector)
2. Commonly needed (navigation, actions, status)
3. Brand-differentiating (unique to their positioning)`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite-preview",
          messages: [
            { role: "system", content: "You are a brand icon consultant." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_suggestions",
                description: "Submit icon suggestions for the brand",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          lucideName: {
                            type: "string",
                            description:
                              "Exact PascalCase Lucide icon name from the available list",
                          },
                          reason: {
                            type: "string",
                            description:
                              "Brief reason why this icon fits the brand",
                          },
                          category: {
                            type: "string",
                            enum: [
                              "navigation",
                              "action",
                              "communication",
                              "data",
                              "commerce",
                              "marketing",
                              "industry-specific",
                            ],
                          },
                        },
                        required: ["lucideName", "reason", "category"],
                      },
                    },
                  },
                  required: ["suggestions"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submit_suggestions" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();

    // Extract from tool call
    let suggestions: any[] = [];
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        suggestions = args.suggestions || [];
      } catch {
        console.warn("Failed to parse tool call args");
      }
    }

    // Fallback: parse from content
    if (suggestions.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          suggestions = JSON.parse(jsonMatch[0]);
        } catch {}
      }
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-icons error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
