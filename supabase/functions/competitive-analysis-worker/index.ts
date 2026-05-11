import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  let jobId: string | null = null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const headers = {
    "apikey": serviceKey,
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const updateJob = async (updates: Record<string, unknown>) => {
    if (!jobId) return;
    await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify(updates),
    });
  };

  try {
    const body = await req.json();
    jobId = body.jobId;
    const { entityType, entityId, organizationId, competitors, region, country, userId } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch entity name + intelligence context (skip guide_data to save memory)
    const tableName = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";

    const [entityRes, intelRes, oracleRes, oracleKbRes, priorReportsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${entityId}&select=id,name,organization_id&limit=1`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/brand_intelligence?entity_id=eq.${entityId}&entity_type=eq.${entityType}&select=brand_summary,market_position,competitive_advantages,brand_voice_profile,target_audience&limit=1`, { headers }),
      organizationId ? fetch(`${supabaseUrl}/rest/v1/oracle_intelligence?organization_id=eq.${organizationId}&select=org_summary,strategic_recommendations,unified_voice_profile,competitive_overview,market_landscape&limit=1`, { headers }) : Promise.resolve(null),
      organizationId ? fetch(`${supabaseUrl}/rest/v1/oracle_knowledge_base?organization_id=eq.${organizationId}&is_active=eq.true&source_type=neq.entity_brain&order=updated_at.desc&limit=5&select=title,content`, { headers }) : Promise.resolve(null),
      fetch(`${supabaseUrl}/rest/v1/competitive_analysis_reports?entity_id=eq.${entityId}&entity_type=eq.${entityType}&order=created_at.desc&limit=1&select=score,report_data,created_at`, { headers }),
    ]);

    const entityRows = await entityRes.json();
    const intelRows = await intelRes.json();
    
    // Parse Oracle context
    let oracleContext = "";
    try {
      const oracleRows = oracleRes ? await oracleRes.json() : [];
      const oracleKbRows = oracleKbRes ? await oracleKbRes.json() : [];
      const oracle = Array.isArray(oracleRows) && oracleRows.length > 0 ? oracleRows[0] : null;
      const oracleKb = Array.isArray(oracleKbRows) ? oracleKbRows : [];
      
      if (oracle || oracleKb.length > 0) {
        const parts: string[] = [];
        if (oracle?.org_summary) parts.push(`Org Strategy: ${oracle.org_summary}`);
        if (oracle?.competitive_overview?.market_position) parts.push(`Org Market Position: ${oracle.competitive_overview.market_position}`);
        if (oracle?.market_landscape?.overall_position) parts.push(`Market Landscape: ${oracle.market_landscape.overall_position}`);
        const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
        if (recs.length > 0) parts.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
        if (oracleKb.length > 0) parts.push(`Knowledge Base: ${oracleKb.map((k: any) => `${k.title}: ${(k.content || '').slice(0, 150)}`).join(' | ')}`);
        oracleContext = parts.join('\n');
      }
    } catch (e) {
      console.warn('[competitive-worker] Oracle context fetch failed (non-critical):', e);
    }

    if (!Array.isArray(entityRows) || entityRows.length === 0) {
      throw new Error("Entity not found");
    }

    const entity = entityRows[0];
    const intel = Array.isArray(intelRows) && intelRows.length > 0 ? intelRows[0] : null;

    await updateJob({ progress: 20 });

    // Build context from intelligence data (not guide_data)
    const contextParts: string[] = [`Brand: ${entity.name}`, `Type: ${entityType}`];
    if (intel) {
      if (intel.brand_summary) contextParts.push(`Summary: ${String(intel.brand_summary).substring(0, 400)}`);
      if (intel.market_position) contextParts.push(`Market Position: ${String(intel.market_position).substring(0, 200)}`);
      if (intel.competitive_advantages) {
        const adv = Array.isArray(intel.competitive_advantages)
          ? intel.competitive_advantages.slice(0, 5).join(", ")
          : String(intel.competitive_advantages).substring(0, 200);
        contextParts.push(`Advantages: ${adv}`);
      }
      if (intel.target_audience) {
        const ta = typeof intel.target_audience === "string" ? intel.target_audience : JSON.stringify(intel.target_audience);
        contextParts.push(`Audience: ${ta.substring(0, 200)}`);
      }
      if (intel.brand_voice_profile) {
        const voice = typeof intel.brand_voice_profile === "string" ? intel.brand_voice_profile : JSON.stringify(intel.brand_voice_profile);
        contextParts.push(`Voice: ${voice.substring(0, 200)}`);
      }
    }

    const entityContext = contextParts.join(". ");
    const competitorList = competitors.slice(0, 5).map((c: string, i: number) => `${i + 1}. ${c}`).join("\n");

    // Build prior report context for longitudinal comparison
    let priorReportContext = "";
    try {
      const priorRows = await priorReportsRes.json();
      const priorReport = Array.isArray(priorRows) && priorRows.length > 0 ? priorRows[0] : null;
      if (priorReport) {
        const parts: string[] = [];
        parts.push(`Prior report date: ${priorReport.created_at}`);
        parts.push(`Prior overall score: ${priorReport.score || 'N/A'}`);
        const rd = priorReport.report_data;
        if (rd?.executiveSummary?.overview) parts.push(`Prior overview: ${String(rd.executiveSummary.overview).slice(0, 300)}`);
        if (rd?.executiveSummary?.currentPosition) parts.push(`Prior position: ${String(rd.executiveSummary.currentPosition).slice(0, 200)}`);
        if (Array.isArray(rd?.swotAnalysis?.strengths)) parts.push(`Prior strengths: ${rd.swotAnalysis.strengths.slice(0, 3).join('; ')}`);
        if (Array.isArray(rd?.swotAnalysis?.weaknesses)) parts.push(`Prior weaknesses: ${rd.swotAnalysis.weaknesses.slice(0, 3).join('; ')}`);
        priorReportContext = `\nPRIOR COMPETITIVE REPORT:\n${parts.join('\n')}\nCompare your new analysis against these prior findings. Note score changes, new threats, resolved weaknesses, and emerging trends.`;
      }
    } catch (e) {
      console.warn('[competitive-worker] Prior report fetch failed (non-critical):', e);
    }

    const regionalNote = country || region
      ? `\nREGIONAL FOCUS: Tailor analysis for ${country || ""} ${region ? `(${region})` : ""} market.`
      : "";

    const oracleNote = oracleContext
      ? `\nORACLE BRAIN (Org-Level Strategic Intelligence):\n${oracleContext}\n\nUse this organizational context to ground your competitive analysis in the broader portfolio strategy.`
      : "";

    await updateJob({ progress: 40 });

    const prompt = `Competitive analysis for ${entity.name} against competitors.${regionalNote}${oracleNote}${priorReportContext}

ENTITY: ${entityContext}

COMPETITORS:
${competitorList}

Return ONLY valid JSON:
{
  "visualIdentityAudit":{"logoAnalysis":{"style":"","typography":"","symbolism":"","scalability":"","memorability":""},"colorPalette":{"primary":[],"secondary":[],"psychology":"","accessibility":"","consistency":""},"typographySystem":{"fonts":[],"hierarchy":"","personality":""},"visualStyle":{"photographyStyle":"","illustrationApproach":"","iconography":"","aesthetic":""},"designPatterns":{"uiElements":"","whitespace":"","interactions":""}},
  "digitalPresence":{"homepageImpression":{"heroImpact":"","hierarchy":"","ctaDesign":"","effectiveness":""},"uxAnalysis":{"navigation":"","contentOrganization":"","mobileResponsive":"","overallPolish":""},"contentPresentation":{"videoUsage":"","dataVisualization":"","caseStudyDesign":""}},
  "marketingCollateral":{"materialQuality":[],"productMarketing":[],"socialConsistency":""},
  "brandPositioning":{"personalityMatrix":{"innovationScore":7,"approachabilityScore":7,"technicalScore":7,"boldnessScore":7,"enterpriseScore":7,"globalScore":7},"targetAudienceSignals":[],"trustIndicators":[],"differentiation":[]},
  "strengthsWeaknesses":{"designSophistication":7,"visualConsistency":7,"userCentricity":7,"innovation":7,"clarity":7,"emotionalConnection":7,"professionalPolish":7},
  "recommendations":{"positioningOpportunities":[],"designPriorities":[{"title":"","impact":"","effort":""}],"brandRefinements":{"logo":"","colors":"","typography":"","imagery":""},"digitalImprovements":[],"assetOptimization":[]},
  "marketPerception":{"categoryMaturity":"","dominantTrends":[],"currentRanking":7,"keyStrengths":[],"criticalGaps":[],"risks":[]},
  "swotAnalysis":{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]},
  "competitorProfiles":[{"name":"","type":"direct","overallScore":7,"brandStrength":"","visualIdentitySummary":"","digitalPresenceSummary":"","keyDifferentiator":"","biggestWeakness":"","threatLevel":"medium"}],
  "contentMessaging":{"toneSummary":"","messagingPillars":[],"contentStrategy":"","socialMediaApproach":"","thoughtLeadership":"","contentGaps":[]},
  "marketTrends":{"industryTrends":[],"innovationGaps":[],"emergingOpportunities":[],"disruptionRisks":[],"technologyAdoption":""},
  "executiveSummary":{"overview":"","currentPosition":"","topPriorities":[],"actionPlan":{"thirtyDay":[],"sixtyDay":[],"ninetyDay":[]},"successMetrics":[]},
  "score":75,
  "competitors":${JSON.stringify(competitors.slice(0, 5))}
}

Create one competitorProfile per competitor. Scores 1-10 integers. Be specific and actionable.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [
          { role: "system", content: "You are an expert brand strategist. Return valid JSON only matching the schema exactly." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 6000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errText.slice(0, 200)}`);
    }

    await updateJob({ progress: 70 });

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response content");

    // Parse JSON
    let reportData;
    try {
      reportData = JSON.parse(content.trim());
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
      // Fix truncated JSON
      let fixed = jsonStr;
      if (!fixed.endsWith("}")) {
        const lastBrace = fixed.lastIndexOf("}");
        if (lastBrace > 0) fixed = fixed.substring(0, lastBrace + 1);
      }
      reportData = JSON.parse(fixed);
    }

    await updateJob({ progress: 85 });

    // Calculate score
    const sw = reportData.strengthsWeaknesses || {};
    const avgScore = Math.round(
      ((sw.designSophistication || 5) + (sw.visualConsistency || 5) + (sw.userCentricity || 5) +
        (sw.innovation || 5) + (sw.clarity || 5) + (sw.emotionalConnection || 5) + (sw.professionalPolish || 5)) / 7 * 10
    );

    // Save report via REST
    const saveRes = await fetch(`${supabaseUrl}/rest/v1/competitive_analysis_reports`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        organization_id: organizationId || entity.organization_id,
        report_type: "competitive",
        report_data: reportData,
        competitors: competitors.slice(0, 10),
        score: avgScore,
        status: "completed",
        created_by: userId,
      }),
    });

    const savedReports = await saveRes.json();
    const savedReport = savedReports?.[0];
    if (!savedReport?.id) throw new Error("Failed to save report");

    // Update brand intelligence competitive_landscape
    const landscape = {
      last_updated: new Date().toISOString(),
      overall_score: avgScore,
      competitors_analyzed: competitors.slice(0, 5),
      report_id: savedReport.id,
    };

    const existingIntelRes = await fetch(
      `${supabaseUrl}/rest/v1/brand_intelligence?entity_id=eq.${entityId}&entity_type=eq.${entityType}&select=id&limit=1`,
      { headers }
    );
    const existingIntel = await existingIntelRes.json();

    if (Array.isArray(existingIntel) && existingIntel.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/brand_intelligence?id=eq.${existingIntel[0].id}`, {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({ competitive_landscape: landscape, updated_at: new Date().toISOString() }),
      });
    }

    // Complete job with report reference
    await updateJob({
      status: "completed",
      progress: 100,
      result: { reportId: savedReport.id, score: avgScore, entityName: entity.name },
      completed_at: new Date().toISOString(),
    });

    console.log(`Competitive analysis complete for ${entity.name}. Score: ${avgScore}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Worker error:", error);
    await updateJob({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      completed_at: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
