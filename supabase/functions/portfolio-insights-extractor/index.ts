/**
 * Portfolio Insights Extractor
 * Extracts cross-cutting curb-cut insights from all data sources
 * and distributes them across the portfolio for inclusive design improvement.
 * Uses direct fetch() REST calls to stay under 150MB memory limit.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function dbFetch(supabaseUrl: string, serviceKey: string) {
  const base = `${supabaseUrl}/rest/v1`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  return {
    async select(table: string, query: string): Promise<any[]> {
      try {
        const res = await fetch(`${base}/${table}?${query}`, { headers });
        if (!res.ok) {
          const body = await res.text();
          console.error(`DB select ${table} failed: ${res.status} ${body}`);
          return [];
        }
        return res.json();
      } catch (e) {
        console.error(`DB select ${table} error:`, e);
        return [];
      }
    },
    async insert(table: string, body: Record<string, unknown>[]): Promise<any> {
      const res = await fetch(`${base}/${table}`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`DB insert ${table} failed: ${res.status} ${t}`);
      }
      return res.json();
    },
    async rpc(fn: string, params: Record<string, unknown> = {}): Promise<any> {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(`RPC ${fn} failed: ${res.status}`);
      return res.json();
    },
  };
}

async function callAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a few minutes.");
    }
    if (res.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    throw new Error(`AI call failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonFromAI(raw: string): any {
  // Strip markdown code fences
  let cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
  
  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      for (const key of Object.keys(parsed)) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
    }
    return [parsed];
  } catch { /* continue */ }

  // Extract JSON array
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try { 
      const arr = JSON.parse(match[0]); 
      if (Array.isArray(arr)) return arr;
    } catch { /* continue */ }
  }

  // Handle truncated JSON: find last complete object in array
  const arrStart = cleaned.indexOf('[');
  if (arrStart >= 0) {
    let text = cleaned.substring(arrStart);
    // Find all complete objects by matching closing braces followed by comma or end
    const objects: string[] = [];
    let depth = 0;
    let objStart = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (text[i] === '}') {
        depth--;
        if (depth === 0 && objStart >= 0) {
          objects.push(text.substring(objStart, i + 1));
          objStart = -1;
        }
      }
    }
    if (objects.length > 0) {
      try {
        const repaired = '[' + objects.join(',') + ']';
        const arr = JSON.parse(repaired);
        console.log(`Recovered ${arr.length} insights from truncated JSON`);
        return arr;
      } catch { /* ignore */ }
    }
  }

  console.error("Failed to parse AI JSON. First 500 chars:", cleaned.substring(0, 500));
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = dbFetch(supabaseUrl, serviceKey);

  try {
    const { organizationId } = await req.json();
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user can use AI features
    const token = authHeader.replace("Bearer ", "");
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userData = await userRes.json();
    const userId = userData.id;

    // Gather data from all sources in parallel
    const [
      biasScans,
      localizationJobs,
      researchBriefings,
      competitiveReports,
      websiteReports,
      boothAnalyses,
      allBrands,
      allProducts,
      allEvents,
      existingInsights,
    ] = await Promise.all([
      db.select("bias_awareness_scans", `organization_id=eq.${organizationId}&status=eq.completed&order=completed_at.desc&limit=20`),
      db.select("localization_jobs", `organization_id=eq.${organizationId}&status=eq.completed&order=completed_at.desc&limit=20`),
      db.select("brand_intelligence", `organization_id=eq.${organizationId}&select=entity_id,entity_type,brand_summary,cultural_insights,growth_recommendations,target_audience&limit=20`),
      db.select("competitive_analysis_reports", `organization_id=eq.${organizationId}&order=created_at.desc&limit=10`),
      db.select("website_analysis_reports", `organization_id=eq.${organizationId}&order=created_at.desc&limit=15`),
      db.select("booth_ai_analyses", `order=created_at.desc&limit=10`),
      db.select("brands", `organization_id=eq.${organizationId}&select=id,name,slug`),
      db.select("products", `organization_id=eq.${organizationId}&select=id,name,slug`),
      db.select("events", `organization_id=eq.${organizationId}&select=id,name,slug`),
      db.select("portfolio_insights", `organization_id=eq.${organizationId}&order=created_at.desc&limit=50`),
    ]);

    // Build entity map for cross-referencing
    const allEntities = [
      ...allBrands.map((b: any) => ({ id: b.id, name: b.name, type: 'brand' })),
      ...allProducts.map((p: any) => ({ id: p.id, name: p.name, type: 'product' })),
      ...allEvents.map((e: any) => ({ id: e.id, name: e.name, type: 'event' })),
    ];

    // Existing insight titles for deduplication
    const existingTitles = new Set(existingInsights.map((i: any) => i.title?.toLowerCase()));

    // Build context for AI
    const sourceContext = {
      biasScans: biasScans.map((s: any) => ({
        entityName: s.entity_name,
        entityType: s.entity_type,
        entityId: s.entity_id,
        inclusionScore: s.inclusion_score,
        languageScore: s.language_score,
        visualScore: s.visual_score,
        accessibilityScore: s.accessibility_score,
        aiGovernanceScore: s.ai_governance_score,
        findings: s.findings,
        recommendations: s.recommendations,
        personaCoverage: s.persona_coverage,
      })),
      localization: localizationJobs.map((j: any) => ({
        entityName: j.entity_name,
        entityType: j.entity_type,
        entityId: j.entity_id,
        sourceLanguage: j.source_language,
        targetLanguage: j.target_language,
        wordCount: j.word_count,
      })),
      research: researchBriefings.map((r: any) => ({
        entityId: r.entity_id,
        entityType: r.entity_type,
        summary: r.brand_summary?.substring(0, 200),
        culturalInsights: r.cultural_insights,
        growthRecs: r.growth_recommendations,
      })),
      competitive: competitiveReports.slice(0, 5).map((c: any) => ({
        entityId: c.entity_id,
        entityType: c.entity_type,
        score: c.score,
        reportSummary: JSON.stringify(c.report_data)?.substring(0, 300),
      })),
      websites: websiteReports.slice(0, 8).map((w: any) => ({
        entityId: w.entity_id,
        entityType: w.entity_type,
        url: w.website_url,
        grade: w.grade,
        overallScore: w.overall_score,
      })),
      booth: boothAnalyses.slice(0, 5).map((b: any) => ({
        divisionId: b.division_id,
        overallScore: b.overall_score,
        strengths: b.strengths,
        improvements: b.improvements,
      })),
      entities: allEntities.map(e => `${e.type}:${e.name}(${e.id})`),
    };

    const systemPrompt = `You are an inclusive design strategist specializing in the Curb-Cut Effect. Analyze cross-functional data from bias scans, localization, research, competitive intelligence, website analysis, and booth performance to extract CURB-CUT insights—where solving for specialized needs creates universal benefits.

The Curb-Cut Effect: designing for specific accessibility needs (e.g., wheelchair curb cuts) creates universal benefits (benefits parents with strollers, delivery workers, cyclists). Apply this principle to brand/product/event content.

PRIORITIZE these curb-cut categories:
- PLAIN LANGUAGE: Content written at Grade 8 or below benefits non-native speakers, busy executives, mobile readers, and people with cognitive disabilities
- MULTI-MODAL DELIVERY: Content available in text + visual + audio + video benefits deaf users, blind users, ESL learners, and people in noisy/quiet environments
- ALT-TEXT QUALITY: Descriptive image alt-text helps screen reader users AND improves SEO, social sharing, and content indexing for everyone
- READING LEVEL: Lower Flesch-Kincaid scores help people with dyslexia AND improve comprehension speed for all readers
- CAPTIONS/TRANSCRIPTS: Benefits deaf/HoH users AND helps in noisy environments, silent browsing, language learning
- HIGH CONTRAST: Benefits low-vision users AND helps in bright sunlight, aging eyes, screen glare
- RESPONSIVE DESIGN: Benefits motor-impaired users AND helps one-handed mobile use, small screens

Output a JSON array of insight objects. Each insight should:
1. Identify a pattern or finding from ONE source that benefits OTHER entities
2. Classify the curb-cut category (mobility, vision, hearing, cognitive, language, cultural, universal, plain_language, multi_modal, alt_text)
3. Map the specific accessibility accommodation to its universal benefits
4. Provide actionable recommendations for cross-pollination
5. Assign applicable entity IDs from the portfolio

IMPORTANT: Do NOT duplicate these existing insights: ${JSON.stringify(Array.from(existingTitles))}

JSON schema for each insight:
{
  "title": "string (concise, max 80 chars)",
  "description": "string (2-3 sentences explaining the cross-cutting benefit)",
  "insight_type": "accessibility|usability|localization|inclusive_design|performance|competitive|plain_language|multi_modal",
  "curb_cut_category": "mobility|vision|hearing|cognitive|language|cultural|universal|plain_language|multi_modal|alt_text",
  "severity": "low|medium|high|critical",
  "source_entity_id": "UUID of originating entity",
  "source_entity_name": "name",
  "source_entity_type": "brand|product|event",
  "source_module": "bias_scan|localization|research|competitive|website|booth",
  "applicable_entity_ids": ["UUIDs of entities that would benefit"],
  "applicable_entity_types": ["brand|product|event"],
  "curb_cut_benefit": {"accommodation": "specific accessibility fix", "target_audience": "primary beneficiary", "universal_benefits": ["benefit for all users"]},
  "recommendations": [{"action": "string", "priority": "high|medium|low", "effort": "low|medium|high"}],
  "confidence_score": 0.0-1.0,
  "tags": ["string"]
}

Generate 3-8 high-quality insights. Focus on plain language, multi-modal content delivery, and alt-text quality patterns that create the most cross-portfolio value.`;

    const userPrompt = `Analyze this organization's data and extract curb-cut insights:\n\n${JSON.stringify(sourceContext, null, 1)}`;

    console.log("Source data counts:", {
      biasScans: biasScans.length,
      localization: localizationJobs.length,
      research: researchBriefings.length,
      competitive: competitiveReports.length,
      websites: websiteReports.length,
      booth: boothAnalyses.length,
      entities: allEntities.length,
      existingInsights: existingInsights.length,
    });

    // Need at least some source data to analyze
    if (biasScans.length === 0 && researchBriefings.length === 0 && competitiveReports.length === 0 && websiteReports.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No source data available for extraction", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await callAI(lovableApiKey, systemPrompt, userPrompt);
    console.log("AI response length:", aiResponse.length, "preview:", aiResponse.substring(0, 200));
    const insights = parseJsonFromAI(aiResponse);
    console.log("Parsed insights count:", Array.isArray(insights) ? insights.length : "NOT_ARRAY", typeof insights);

    if (!Array.isArray(insights) || insights.length === 0) {
      console.log("No insights parsed from AI response");
      return new Response(JSON.stringify({ success: true, message: "No new insights extracted", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and insert insights
    const validEntityIds = new Set(allEntities.map(e => e.id));
    console.log("Valid entity IDs count:", validEntityIds.size);
    const insightsToInsert = insights
      .filter((i: any) => {
        const hasTitleDesc = i.title && i.description;
        const isDuplicate = existingTitles.has(i.title?.toLowerCase());
        if (!hasTitleDesc) console.log("Filtered out insight (no title/desc):", JSON.stringify(i).substring(0, 100));
        if (isDuplicate) console.log("Filtered out duplicate:", i.title);
        return hasTitleDesc && !isDuplicate;
      })
      .map((i: any) => ({
        organization_id: organizationId,
        source_entity_id: validEntityIds.has(i.source_entity_id) ? i.source_entity_id : allEntities[0]?.id,
        source_entity_type: i.source_entity_type || 'brand',
        source_entity_name: i.source_entity_name || 'Unknown',
        source_module: i.source_module || 'research',
        title: i.title.substring(0, 200),
        description: i.description.substring(0, 1000),
        insight_type: i.insight_type || 'accessibility',
        curb_cut_category: i.curb_cut_category || 'universal',
        severity: i.severity || 'medium',
        applicable_entity_ids: (i.applicable_entity_ids || []).filter((id: string) => validEntityIds.has(id)),
        applicable_entity_types: i.applicable_entity_types || [],
        recommendations: i.recommendations || [],
        confidence_score: Math.min(1, Math.max(0, Number(i.confidence_score) || 0.5)),
        tags: i.tags || [],
        created_by: userId,
        propagation_status: 'pending',
      }));

    if (insightsToInsert.length > 0) {
      await db.insert("portfolio_insights", insightsToInsert);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: insightsToInsert.length,
      insights: insightsToInsert.map((i: any) => ({ title: i.title, type: i.insight_type, severity: i.severity })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Portfolio insights extraction error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
