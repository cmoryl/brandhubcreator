import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBSITE_ANALYSIS_PROMPT = `You are a senior digital strategist and website auditor with expertise in UX, SEO, brand consistency, competitive positioning, and industry trends. Produce a comprehensive, actionable website analysis report.

## Report Structure

Return a JSON object with these sections:

{
  "overallScore": <number 0-100>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence executive summary>",
  "sections": {
    "brandConsistency": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "userExperience": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "contentQuality": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "seoHealth": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "performanceInsights": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "competitivePosition": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "industryTrends": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "technicalAudit": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "accessibilityCompliance": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    },
    "conversionOptimization": {
      "score": <0-100>,
      "findings": ["<finding>"],
      "recommendations": ["<recommendation>"]
    }
  },
  "priorityActions": [
    { "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" }
  ],
  "competitorComparison": [
    { "competitor": "<name>", "strengths": ["<strength>"], "weaknesses": ["<weakness>"] }
  ],
  "industryBenchmarks": {
    "averageScore": <number>,
    "topPerformerScore": <number>,
    "positionPercentile": <number>
  }
}

## Analysis Guidelines

For each section provide exactly 1 finding (one short sentence) and 1 recommendation (one short sentence).
Keep the entire JSON output under 1500 tokens. Be extremely concise.

Output ONLY valid JSON. No markdown fences, no explanation, no extra text.`;

/** Extract and recover JSON from potentially truncated/wrapped AI responses */
function extractJsonFromResponse(raw: string): unknown {
  let cleaned = raw.trim();
  // Strip markdown fences
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/, '').trim();

  // Try direct parse first
  try { return JSON.parse(cleaned); } catch {}

  // Find the outermost JSON object
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart === -1) throw new Error("No JSON object found in response");
  
  let candidate = cleaned.substring(jsonStart);
  
  // Try parsing as-is
  try { return JSON.parse(candidate); } catch {}

  // Remove trailing garbage after last }
  const lastBrace = candidate.lastIndexOf('}');
  if (lastBrace > 0) {
    try { return JSON.parse(candidate.substring(0, lastBrace + 1)); } catch {}
  }

  // Truncation recovery: fix trailing commas, incomplete strings, close brackets/braces
  candidate = candidate
    .replace(/,\s*([}\]])/g, '$1')   // trailing commas before closers
    .replace(/,\s*$/, '')             // trailing comma at end
    .replace(/"[^"]*$/, '""')         // incomplete string at end
    .replace(/:\s*$/, ': null')       // incomplete value
    .replace(/,\s*"[^"]*$/, '');      // incomplete key at end

  const openBraces = (candidate.match(/{/g) || []).length;
  const closeBraces = (candidate.match(/}/g) || []).length;
  const openBrackets = (candidate.match(/\[/g) || []).length;
  const closeBrackets = (candidate.match(/]/g) || []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i++) candidate += ']';
  for (let i = 0; i < openBraces - closeBraces; i++) candidate += '}';

  try {
    const result = JSON.parse(candidate);
    console.log("[website-analysis] Recovered truncated JSON response");
    return result;
  } catch {
    // Last resort: remove all control characters
    candidate = candidate.replace(/[\x00-\x1F\x7F]/g, ' ');
    return JSON.parse(candidate);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { websiteUrl, entityName, industry, brandContext, entityId, entityType } = await req.json();

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "Website URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch prior website report for longitudinal comparison
    let priorReportContext = '';
    if (entityId && entityType) {
      try {
        const serviceClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const { data: priorReports } = await serviceClient
          .from('website_analysis_reports')
          .select('overall_score, grade, summary, created_at')
          .eq('entity_id', entityId)
          .eq('entity_type', entityType)
          .order('created_at', { ascending: false })
          .limit(1);

        if (priorReports && priorReports.length > 0) {
          const pr = priorReports[0];
          priorReportContext = `\n\nPRIOR WEBSITE ANALYSIS (${pr.created_at}):\nScore: ${pr.overall_score || 'N/A'}, Grade: ${pr.grade || 'N/A'}\nSummary: ${(pr.summary || '').slice(0, 300)}\nCompare your new analysis against these prior results. Note improvements, regressions, and persistent issues in each category.`;
        }
      } catch (e) {
        console.warn('[website-analysis] Prior report fetch failed (non-critical):', e);
      }
    }

    console.log(`[website-analysis] Analyzing: ${websiteUrl} for ${entityName || 'unknown entity'}`);

    // Build contextual prompt
    let userPrompt = `Analyze this website: ${websiteUrl}`;
    if (entityName) userPrompt += `\nBrand/Company: ${entityName}`;
    if (industry) userPrompt += `\nIndustry: ${industry}`;
    if (brandContext) {
      userPrompt += `\n\nBrand Context:`;
      if (brandContext.colors?.length) userPrompt += `\nBrand Colors: ${brandContext.colors.join(', ')}`;
      if (brandContext.archetype) userPrompt += `\nBrand Archetype: ${brandContext.archetype}`;
      if (brandContext.mission) userPrompt += `\nMission: ${brandContext.mission}`;
      if (brandContext.tagline) userPrompt += `\nTagline: ${brandContext.tagline}`;
      if (brandContext.competitors?.length) userPrompt += `\nKey Competitors: ${brandContext.competitors.join(', ')}`;
    }
    userPrompt += priorReportContext;
    userPrompt += `\n\nPerform a comprehensive website analysis. Be specific, cite real observations, and provide actionable recommendations. Score each category 0-100.${priorReportContext ? ' Compare against prior results and note trends.' : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 3000,
        temperature: 0.2,
        messages: [
          { role: "system", content: WEBSITE_ANALYSIS_PROMPT },
          { role: "user", content: userPrompt },
        ],
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
      console.error("[website-analysis] AI error:", response.status, errorText);
      throw new Error("Failed to analyze website");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON response - handle truncated/wrapped output
    let report: any;
    try {
      report = extractJsonFromResponse(content);
    } catch (parseError) {
      console.warn("[website-analysis] Parse failed, building fallback report. Preview:", content.substring(0, 200));
      // Build a minimal valid report instead of failing
      report = {
        overallScore: 0,
        grade: "N/A",
        summary: "Analysis completed but the response was too large to parse. Please try again — results may vary.",
        sections: {},
        priorityActions: [],
        competitorComparison: [],
        industryBenchmarks: { averageScore: 0, topPerformerScore: 0, positionPercentile: 0 },
      };
    }

    // Ensure required fields exist
    if (!report.overallScore && report.sections) {
      const scores = Object.values(report.sections).map((s: any) => s?.score || 0).filter(Boolean);
      if (scores.length) report.overallScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    }
    if (!report.grade && report.overallScore) {
      report.grade = report.overallScore >= 90 ? 'A' : report.overallScore >= 80 ? 'B' : report.overallScore >= 70 ? 'C' : report.overallScore >= 60 ? 'D' : 'F';
    }

    console.log(`[website-analysis] Analysis complete. Score: ${report.overallScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        report,
        analyzedUrl: websiteUrl,
        analyzedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[website-analysis] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
