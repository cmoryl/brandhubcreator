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

For each section provide 3-5 specific, actionable findings and 2-4 concrete recommendations.
- Brand Consistency: Logo usage, color palette adherence, typography, tone of voice, messaging alignment
- User Experience: Navigation, information architecture, mobile responsiveness, load times, interaction patterns
- Content Quality: Writing quality, freshness, depth, multimedia usage, content gaps
- SEO Health: Meta tags, heading structure, keyword optimization, internal linking, structured data
- Performance: Core Web Vitals estimation, image optimization, resource loading, caching
- Competitive Position: Market positioning vs competitors, unique value proposition clarity, differentiation
- Industry Trends: Alignment with current industry design/content trends, innovation opportunities
- Technical Audit: Security headers, HTTPS, modern frameworks, API patterns, code quality signals
- Accessibility: WCAG compliance signals, contrast, alt text, keyboard navigation, ARIA usage
- Conversion Optimization: CTAs, funnel clarity, trust signals, social proof, form optimization

Be specific and data-driven. Reference specific pages, elements, or patterns you observe.
Output ONLY valid JSON. No markdown, no explanation.`;

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

    const { websiteUrl, entityName, industry, brandContext } = await req.json();

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
    userPrompt += `\n\nPerform a comprehensive website analysis. Be specific, cite real observations, and provide actionable recommendations. Score each category 0-100.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 8000,
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
    let report;
    try {
      let cleanContent = content.trim();
      // Strip markdown code fences
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();
      report = JSON.parse(cleanContent);
    } catch (parseError) {
      // Try extracting the largest JSON object from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          report = JSON.parse(jsonMatch[0]);
        } catch {
          // Attempt to fix truncated JSON by closing open structures
          let truncated = jsonMatch[0];
          // Count open/close braces and brackets
          const openBraces = (truncated.match(/\{/g) || []).length;
          const closeBraces = (truncated.match(/\}/g) || []).length;
          const openBrackets = (truncated.match(/\[/g) || []).length;
          const closeBrackets = (truncated.match(/\]/g) || []).length;
          
          // Remove trailing partial values (incomplete strings, trailing commas)
          truncated = truncated.replace(/,\s*$/, '');
          truncated = truncated.replace(/"[^"]*$/, '""');
          
          // Close open structures
          for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}';
          
          try {
            report = JSON.parse(truncated);
            console.log("[website-analysis] Recovered truncated JSON response");
          } catch {
            console.error("[website-analysis] Parse failed even after recovery attempt:", content.substring(0, 500));
            throw new Error("Failed to parse analysis results. The AI response was truncated — please try again.");
          }
        }
      } else {
        throw new Error("Failed to parse analysis results");
      }
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
