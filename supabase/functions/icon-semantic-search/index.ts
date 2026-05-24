// Phase 3 — AI-powered semantic icon search.
// Expands a natural-language query into icon-relevant search tokens
// (synonyms, related concepts, brand-aligned terms) using Lovable AI.
// Returns tokens that the client intersects against the local icon index.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Req {
  query: string;
  industry?: string;
  brandKeywords?: string[];
  sectionId?: string;
}

interface ExpandedSearch {
  tokens: string[];
  categories: string[];
  reasoning: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Req;
    const { query, industry, brandKeywords = [], sectionId } = body;
    if (!query || query.trim().length < 2) {
      return json({ tokens: [], categories: [], reasoning: "" });
    }

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY not configured");

    const validCategories = [
      "brands","social","communication","health","wellness","food","travel",
      "finance","business","ecommerce","education","science","nature","weather",
      "transport","tech","devtools","media","security","gaming","sports","files",
      "arrows","ui","shapes","emoji","flags","crypto","misc",
    ];

    const prompt = `You are an icon-search assistant for a brand design tool.
Convert the user's natural-language icon request into a JSON search plan.

USER QUERY: "${query}"
${industry ? `BRAND INDUSTRY: ${industry}` : ""}
${brandKeywords.length ? `BRAND KEYWORDS: ${brandKeywords.join(", ")}` : ""}
${sectionId ? `SECTION CONTEXT: ${sectionId}` : ""}

Allowed categories (pick the 1-4 most relevant): ${validCategories.join(", ")}

Return ONLY a JSON object:
{
  "tokens": ["lowercase","keyword","list","including synonyms, metaphors, related concepts — 8 to 20 single words"],
  "categories": ["1 to 4 from the allowed list"],
  "reasoning": "one short sentence"
}

Rules:
- Tokens must be single words (no spaces, no punctuation), lowercase.
- Include common synonyms and visual metaphors (e.g. for "growth": chart, sprout, leaf, arrow, trend).
- Bias toward concrete nouns/verbs that match icon names.
- No JSON markdown fences. No prose outside the object.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Return only valid JSON. No markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return json({ error: "AI gateway error" }, 500);
    }

    const ai = await aiRes.json();
    const content: string = ai.choices?.[0]?.message?.content ?? "";

    let parsed: ExpandedSearch | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* noop */ }
      }
    }

    if (!parsed) return json({ tokens: [query.toLowerCase()], categories: [], reasoning: "" });

    // Normalize & validate
    const tokens = Array.from(
      new Set(
        (parsed.tokens ?? [])
          .map((t) => String(t).toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
          .filter((t) => t.length >= 2 && t.length <= 24),
      ),
    ).slice(0, 24);
    const categories = (parsed.categories ?? [])
      .map((c) => String(c).toLowerCase().trim())
      .filter((c) => validCategories.includes(c))
      .slice(0, 4);

    return json({ tokens, categories, reasoning: parsed.reasoning ?? "" });
  } catch (e) {
    console.error("icon-semantic-search error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
