import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entityName, platform, entityType, industry } = await req.json();

    if (!entityName || !platform) {
      return new Response(JSON.stringify({ error: "entityName and platform are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a social media analytics research assistant. Given a brand/company name, platform, and optional industry, provide realistic estimated social media metrics. Base your estimates on publicly available information about the brand's social media presence. If you don't have specific data, provide reasonable industry-average estimates for a brand of similar size and type. Be conservative in estimates rather than inflating numbers.`;

    const userPrompt = `Research and estimate social media metrics for:
- Brand/Entity: "${entityName}"
- Platform: "${platform}"
- Entity Type: ${entityType || 'brand'}
- Industry: ${industry || 'unknown'}

Return realistic estimates for ALL of the following metrics. Use your knowledge of this brand's actual social media presence if available, otherwise use reasonable industry estimates.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_social_metrics",
              description: "Provide estimated social media metrics for a brand on a specific platform",
              parameters: {
                type: "object",
                properties: {
                  followers_count: { type: "number", description: "Estimated number of followers/subscribers" },
                  engagement_rate: { type: "number", description: "Estimated engagement rate as percentage (e.g. 2.5 for 2.5%)" },
                  posts_count: { type: "number", description: "Estimated number of posts in the reporting period" },
                  avg_likes_per_post: { type: "number", description: "Average likes per post" },
                  avg_comments_per_post: { type: "number", description: "Average comments per post" },
                  avg_shares_per_post: { type: "number", description: "Average shares/retweets per post" },
                  follower_growth_percent: { type: "number", description: "Monthly follower growth rate as percentage" },
                  reach_count: { type: "number", description: "Estimated monthly reach" },
                  impressions_count: { type: "number", description: "Estimated monthly impressions" },
                  viral_coefficient: { type: "number", description: "Viral coefficient (typically 0.1-2.0)" },
                  sentiment_score: { type: "number", description: "Overall sentiment score from -100 to 100" },
                  positive_mentions: { type: "number", description: "Estimated positive mentions per period" },
                  negative_mentions: { type: "number", description: "Estimated negative mentions per period" },
                  neutral_mentions: { type: "number", description: "Estimated neutral mentions per period" },
                  brand_mentions_count: { type: "number", description: "Total brand mentions per period" },
                  share_of_voice_percent: { type: "number", description: "Estimated share of voice in industry (%)" },
                  referral_traffic_count: { type: "number", description: "Estimated referral traffic from platform" },
                  organic_reach_count: { type: "number", description: "Estimated organic reach" },
                  earned_media_value: { type: "number", description: "Estimated earned media value in USD" },
                  confidence_note: { type: "string", description: "Brief note about data confidence and sources" },
                },
                required: ["followers_count", "engagement_rate", "confidence_note"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_social_metrics" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    let metrics: Record<string, unknown>;
    try {
      metrics = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ success: true, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("social-metrics-scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
