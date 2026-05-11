import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify JWT manually
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check AI access
    const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "AI access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { boothLayout, panels, placedAssets, boothSize, divisionName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build booth context for AI
    const panelDescriptions = (panels || []).map((p: any) => 
      `Panel "${p.label}" at position [${p.position.join(',')}], size ${p.specLabel || `${p.size[0].toFixed(1)}m × ${p.size[1].toFixed(1)}m`}${p.imageUrl ? ' (has graphic)' : ' (empty)'}`
    ).join('\n');

    const assetDescriptions = (placedAssets || []).map((a: any) =>
      `${a.label || a.assetId} at position [${a.position.map((v: number) => v.toFixed(1)).join(',')}]`
    ).join('\n');

    const systemPrompt = `You are a trade show booth traffic simulation AI expert. Analyze booth layouts and predict attendee behavior patterns, traffic flow, engagement zones, and visibility scores. You must return structured data using the provided tool.

Key principles:
- Aisle-facing elements get highest traffic
- Corner booths have 2x visibility
- Screens/TVs visible from aisles attract passers-by
- Reception counters create natural entry points
- Demo stations need clear sightlines from approach paths
- Back corners are typically dead zones unless specifically activated
- Dwell time correlates with interactive elements (screens, demos)
- Queue formation happens at reception and demo stations`;

    const userPrompt = `Analyze this trade show booth and simulate attendee behavior:

**Booth Type:** ${boothLayout || 'u-shape'}
**Booth Size:** ${boothSize || "10' × 10'"}
**Division:** ${divisionName || 'Unknown'}

**Panels:**
${panelDescriptions || 'No panels configured'}

**Placed Assets (furniture/equipment):**
${assetDescriptions || 'No assets placed'}

Generate a comprehensive crowd simulation analysis including:
1. Overall booth visibility score (0-100)
2. Traffic heat map zones (grid of intensity values 0-1 for a 10x10 grid mapped to booth footprint)
3. High visibility zones and dead zones
4. Sightline analysis from main aisle approaches
5. Engagement zone predictions around interactive elements
6. Average dwell time estimates per zone
7. Queue prediction for demo stations and reception
8. Specific optimization recommendations for furniture/screen placement`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "crowd_simulation_result",
            description: "Return the complete crowd simulation analysis for a trade show booth",
            parameters: {
              type: "object",
              properties: {
                visibilityScore: {
                  type: "number",
                  description: "Overall booth visibility score 0-100"
                },
                summary: {
                  type: "string",
                  description: "2-3 sentence summary of booth traffic potential"
                },
                heatMapGrid: {
                  type: "array",
                  description: "10x10 grid of traffic intensity values (0.0 to 1.0). Row 0 = back wall, Row 9 = front/aisle. Each row has 10 values left to right.",
                  items: {
                    type: "array",
                    items: { type: "number" }
                  }
                },
                highVisibilityZones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      gridX: { type: "number", description: "Grid column 0-9" },
                      gridZ: { type: "number", description: "Grid row 0-9" },
                      intensity: { type: "number", description: "0.0 to 1.0" }
                    },
                    required: ["name", "description", "gridX", "gridZ", "intensity"]
                  }
                },
                deadZones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      gridX: { type: "number" },
                      gridZ: { type: "number" },
                      suggestion: { type: "string" }
                    },
                    required: ["name", "description", "gridX", "gridZ", "suggestion"]
                  }
                },
                engagementZones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string", enum: ["screen", "demo", "reception", "meeting", "product-display", "seating"] },
                      estimatedDwellTime: { type: "string", description: "e.g. '2m 30s'" },
                      avgCrowdSize: { type: "number" },
                      gridX: { type: "number" },
                      gridZ: { type: "number" }
                    },
                    required: ["name", "type", "estimatedDwellTime", "avgCrowdSize", "gridX", "gridZ"]
                  }
                },
                sightlines: {
                  type: "array",
                  description: "Key sightline paths from approach directions",
                  items: {
                    type: "object",
                    properties: {
                      from: { type: "string", description: "Approach direction" },
                      visibleElements: { type: "array", items: { type: "string" } },
                      blockedElements: { type: "array", items: { type: "string" } },
                      score: { type: "number", description: "Sightline quality 0-100" }
                    },
                    required: ["from", "visibleElements", "blockedElements", "score"]
                  }
                },
                queuePredictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      location: { type: "string" },
                      peakWaitTime: { type: "string" },
                      avgQueueLength: { type: "number" },
                      bottleneckRisk: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["location", "peakWaitTime", "avgQueueLength", "bottleneckRisk"]
                  }
                },
                overallDwellTime: { type: "string", description: "Average total dwell time estimate" },
                peakCapacity: { type: "number", description: "Max comfortable attendees at once" },
                optimizations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      category: { type: "string", enum: ["tv-placement", "demo-station", "product-shelf", "reception", "seating", "signage", "traffic-flow"] },
                      recommendation: { type: "string" },
                      impact: { type: "string" }
                    },
                    required: ["priority", "category", "recommendation", "impact"]
                  }
                }
              },
              required: ["visibilityScore", "summary", "heatMapGrid", "highVisibilityZones", "deadZones", "engagementZones", "sightlines", "queuePredictions", "overallDwellTime", "peakCapacity", "optimizations"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "crowd_simulation_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let simulationData;

    // Extract from tool call response
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        simulationData = JSON.parse(toolCall.function.arguments);
      } catch {
        // Fallback: try regex extraction
        const match = toolCall.function.arguments.match(/\{[\s\S]*\}/);
        if (match) simulationData = JSON.parse(match[0]);
      }
    }

    if (!simulationData) {
      // Regex fallback from content
      const content = aiResult.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        simulationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI simulation response");
      }
    }

    // Validate and normalize heat map grid
    if (!Array.isArray(simulationData.heatMapGrid) || simulationData.heatMapGrid.length !== 10) {
      // Generate a reasonable default grid
      simulationData.heatMapGrid = Array.from({ length: 10 }, (_, row) => 
        Array.from({ length: 10 }, (_, col) => {
          // Front rows (high index) get more traffic
          const frontBias = row / 9;
          // Center columns get more traffic
          const centerBias = 1 - Math.abs(col - 4.5) / 5;
          return Math.round((frontBias * 0.6 + centerBias * 0.4) * 100) / 100;
        })
      );
    }

    return new Response(JSON.stringify(simulationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("booth-crowd-simulation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
