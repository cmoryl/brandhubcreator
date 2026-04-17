import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a brand research analyst. Given a parent service offered by a brand, and supporting context scraped from the brand's own website, identify the most useful SUB-SERVICES, capabilities, or offering tiers nested under that parent service.

Rules:
- Return ONLY sub-services that clearly belong under the given parent service.
- Use the brand's own terminology when it appears in the source content.
- Prefer 4-8 concise items. Skip generic filler.
- Each sub-service must have a short, specific name (3-6 words) and a 1-sentence description.
- Never invent capabilities the brand does not appear to offer.
- Do not include the parent service itself as a sub-service.
- Skip pricing, contact info, careers, blog posts, and unrelated marketing content.`;

interface SubServiceSuggestion {
  name: string;
  description: string;
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BrandHub-SubService-Bot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip scripts/styles, then collapse to text
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Cap to keep prompt small
    return stripped.slice(0, 12000);
  } catch (err) {
    console.warn("[generate-sub-services] fetch failed", url, err);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase environment is not configured");
    }

    // Auth: require a logged-in user
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      parentServiceName,
      parentServiceDescription,
      brandName,
      urls,
      entityId,
      entityType,
    } = body as {
      parentServiceName?: string;
      parentServiceDescription?: string;
      brandName?: string;
      urls?: string[];
      entityId?: string;
      entityType?: "brand" | "product" | "event";
    };

    if (!parentServiceName || typeof parentServiceName !== "string") {
      return new Response(JSON.stringify({ error: "parentServiceName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sourceUrls = Array.isArray(urls)
      ? urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u)).slice(0, 4)
      : [];
    if (sourceUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one valid http(s) source URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI access guard via existing RPC
    if (entityId && entityType) {
      const { data: canUse } = await supabase.rpc("can_use_ai_features", {
        _user_id: userData.user.id,
        _entity_id: entityId,
        _entity_type: entityType,
      });
      if (canUse === false) {
        return new Response(JSON.stringify({ error: "AI features are not available for this account" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const pageTexts = await Promise.all(sourceUrls.map(fetchPageText));
    const sourceContent = pageTexts
      .map((text, idx) => (text ? `--- SOURCE ${idx + 1}: ${sourceUrls[idx]} ---\n${text}` : ""))
      .filter(Boolean)
      .join("\n\n");

    if (!sourceContent.trim()) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve any readable content from the provided URLs" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Brand: ${brandName ?? "(unspecified)"}\nParent service: ${parentServiceName}${
      parentServiceDescription ? `\nParent description: ${parentServiceDescription}` : ""
    }\n\nSource content scraped from the brand website:\n${sourceContent}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_sub_services",
              description: "Return a list of sub-services nested under the parent service.",
              parameters: {
                type: "object",
                properties: {
                  subServices: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["subServices"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_sub_services" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("[generate-sub-services] gateway error", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: SubServiceSuggestion[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        if (Array.isArray(parsed.subServices)) {
          suggestions = parsed.subServices
            .filter((s: any) => s && typeof s.name === "string")
            .slice(0, 12)
            .map((s: any) => ({
              name: String(s.name).trim(),
              description: typeof s.description === "string" ? s.description.trim() : "",
            }));
        }
      } catch (err) {
        console.error("[generate-sub-services] failed to parse tool args", err);
      }
    }

    return new Response(
      JSON.stringify({ suggestions, sourcesUsed: sourceUrls }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-sub-services] unhandled", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
