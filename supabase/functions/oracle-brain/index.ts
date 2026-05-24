/**
 * Oracle Brain - Master Organization Intelligence
 * Lightweight orchestrator using direct REST calls instead of heavy SDK
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Import deep intelligence modules
import { EAA_COMPLIANCE_BASELINE, INCLUSIVE_DESIGN_SPRINT_ACTIVITIES, INCLUSIVE_PROMPTING_HEURISTICS } from "../_shared/inclusive-language-patterns.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function restHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function restQuery(table: string, query: string, method = "GET", body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const opts: RequestInit = { method, headers: restHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`REST ${method} ${table}: ${res.status} ${err.slice(0, 200)}`);
  }
  return method === "DELETE" ? null : res.json();
}

async function verifyUser(authHeader: string) {
  const token = authHeader.replace("Bearer ", "");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

async function checkAiPerms(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_use_ai_features`, {
    method: "POST",
    headers: restHeaders(),
    body: JSON.stringify({ _user_id: userId }),
  });
  if (!res.ok) return false;
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await verifyUser(authHeader);
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const canUse = await checkAiPerms(user.id);
    if (!canUse) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, organizationId } = body;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Add Knowledge Entry ----
    if (action === "add_knowledge") {
      const { title, content, contentType, tags, category } = body;
      if (!title || !content) {
        return new Response(JSON.stringify({ error: "title and content required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await restQuery("oracle_knowledge_base", "", "POST", {
        organization_id: organizationId,
        title, content,
        content_type: contentType || "text",
        source_type: "manual",
        category: category || "general",
        tags: tags || [],
        created_by: user.id,
      });
      return new Response(JSON.stringify({ success: true, id: data[0]?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Import Document (AI extraction) ----
    if (action === "import_document") {
      const { title, rawContent, category, tags } = body;
      if (!title || !rawContent) {
        return new Response(JSON.stringify({ error: "title and rawContent required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create a pending job for the import
      const jobData = await restQuery("oracle_jobs", "", "POST", {
        organization_id: organizationId,
        job_type: "document_import",
        status: "pending",
        triggered_by: user.id,
      });
      const jobId = jobData[0]?.id;
      if (!jobId) throw new Error("Failed to create import job");

      // @ts-ignore
      EdgeRuntime.waitUntil(
        processDocumentImport(lovableApiKey, jobId, organizationId, user.id, title, rawContent, category || "research", tags || [])
      );

      return new Response(JSON.stringify({ success: true, job_id: jobId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Delete Knowledge Entry ----
    if (action === "delete_knowledge") {
      const { knowledgeId } = body;
      await restQuery(
        "oracle_knowledge_base",
        `id=eq.${knowledgeId}&organization_id=eq.${organizationId}`,
        "DELETE"
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Get Oracle Context ----
    if (action === "get_context") {
      const { entityId, entityType } = body;
      const [oracleArr, knowledge] = await Promise.all([
        restQuery("oracle_intelligence", `organization_id=eq.${organizationId}&limit=1`),
        restQuery("oracle_knowledge_base", `organization_id=eq.${organizationId}&is_active=eq.true&order=updated_at.desc&limit=20`),
      ]);
      return new Response(JSON.stringify({
        oracle: oracleArr?.[0] || null,
        knowledge: knowledge || [],
        entityContext: { entityId, entityType },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: Synthesize ----
    if (action === "synthesize") {
      const jobData = await restQuery("oracle_jobs", "", "POST", {
        organization_id: organizationId,
        job_type: "synthesis",
        status: "pending",
        triggered_by: user.id,
      });
      const jobId = jobData[0]?.id;
      if (!jobId) throw new Error("Failed to create job");

      // @ts-ignore
      EdgeRuntime.waitUntil(
        processOracleSynthesis(lovableApiKey, jobId, organizationId)
      );

      return new Response(JSON.stringify({ success: true, job_id: jobId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[oracle-brain] Error:", error);
    const status = (error as any)?.status === 429 ? 429 : (error as any)?.status === 402 ? 402 : 500;
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateJob(jobId: string, data: Record<string, any>) {
  await restQuery("oracle_jobs", `id=eq.${jobId}`, "PATCH", data);
}

async function processOracleSynthesis(apiKey: string, jobId: string, organizationId: string) {
  try {
    await updateJob(jobId, { status: "processing", started_at: new Date().toISOString(), progress: 10 });

    const [brains, brands, products, events, knowledge, priorDigests, iconLibs, iconUsage] = await Promise.all([
      restQuery("brand_intelligence", `organization_id=eq.${organizationId}&select=entity_type,entity_id,brand_summary,market_position,competitive_advantages,brand_voice_profile,localization_readiness_score`),
      restQuery("brands", `organization_id=eq.${organizationId}&select=id,name`),
      restQuery("products", `organization_id=eq.${organizationId}&select=id,name`),
      restQuery("events", `organization_id=eq.${organizationId}&select=id,name`),
      restQuery("oracle_knowledge_base", `organization_id=eq.${organizationId}&is_active=eq.true&order=updated_at.desc&limit=30&select=title,content,content_type,tags`),
      restQuery("intelligence_digests", `organization_id=eq.${organizationId}&order=generated_at.desc&limit=3&select=digest,generated_at,data_sources`),
      restQuery("organization_icon_libraries", `organization_id=eq.${organizationId}&is_active=eq.true&select=id,name,level,icons`),
      restQuery("icon_usage_events", `organization_id=eq.${organizationId}&order=created_at.desc&limit=300&select=pack,icon_name,action,brand_id`),
    ]);

    const nameMap: Record<string, string> = {};
    for (const b of (brands || [])) nameMap[b.id] = b.name;
    for (const p of (products || [])) nameMap[p.id] = p.name;
    for (const e of (events || [])) nameMap[e.id] = e.name;

    await updateJob(jobId, { progress: 30 });

    const brainSummaries = (brains || []).map((b: any) => {
      const name = nameMap[b.entity_id] || "Unknown";
      return `${b.entity_type?.toUpperCase()}: ${name}\nSummary: ${b.brand_summary || "N/A"}\nPosition: ${b.market_position || "N/A"}\nAdvantages: ${Array.isArray(b.competitive_advantages) ? b.competitive_advantages.join(", ") : "N/A"}\nReadiness: ${b.localization_readiness_score || "N/A"}%`;
    }).join("\n\n");

    const knowledgeCtx = (knowledge || []).map((k: any) =>
      `[${k.content_type}] ${k.title}: ${(k.content || "").slice(0, 300)}`
    ).join("\n");

    // Build historical digest context for longitudinal awareness
    const digestHistory = (priorDigests || []).map((d: any, i: number) => {
      const date = d.generated_at ? new Date(d.generated_at).toLocaleDateString() : 'Unknown date';
      const digestText = (d.digest || '').slice(0, 600);
      return `--- Prior Digest ${i + 1} (${date}) ---\n${digestText}`;
    }).join("\n\n");

    await updateJob(jobId, { progress: 40 });

    // Build Icon Studio org-level rollup
    const totalIconAssets = (iconLibs || []).reduce((s: number, l: any) =>
      s + (Array.isArray(l.icons) ? l.icons.length : 0), 0);
    const libsByLevel: Record<string, number> = { core: 0, product_line: 0, brand: 0 };
    for (const l of (iconLibs || [])) libsByLevel[l.level] = (libsByLevel[l.level] || 0) + 1;
    const brandsWithIcons = new Set((iconUsage || []).map((u: any) => u.brand_id).filter(Boolean)).size;
    const packTally: Record<string, number> = {};
    const actionTally: Record<string, number> = { added: 0, exported: 0, kit_added: 0, removed: 0 };
    for (const u of (iconUsage || [])) {
      if (u.pack) packTally[u.pack] = (packTally[u.pack] || 0) + 1;
      if (u.action) actionTally[u.action] = (actionTally[u.action] || 0) + 1;
    }
    const topPacks = Object.entries(packTally).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => `${k}(${v})`).join(', ');
    const iconStudioBlock = (iconLibs || []).length === 0 && (iconUsage || []).length === 0
      ? ''
      : `\nICON STUDIO PORTFOLIO:\nLibraries: ${(iconLibs || []).length} (${libsByLevel.core} core, ${libsByLevel.product_line} product-line, ${libsByLevel.brand} brand-specific) totaling ${totalIconAssets} icons\nBrands actively using icons: ${brandsWithIcons} of ${(brands || []).length}\nTop icon packs across org: ${topPacks || 'none tracked'}\nActivity (last 300 events): ${actionTally.added} added, ${actionTally.kit_added} kit-added, ${actionTally.exported} exported, ${actionTally.removed} removed\nAssess iconography consistency across brands/products/events and surface gaps in visual_coherence + recommendations.`;


    const prompt = `You are the Master Oracle Brain. Synthesize ALL entity intelligence into unified org-level strategic insights. You also have access to Deep Intelligence governance modules.

DEEP INTELLIGENCE GOVERNANCE:
- EAA 2025/2026: Enforcement started ${EAA_COMPLIANCE_BASELINE.enforcement_start}. Penalties up to €${(EAA_COMPLIANCE_BASELINE.penalties.max_fine_euros / 1_000_000).toFixed(0)}M. Scope: ${EAA_COMPLIANCE_BASELINE.mandatory_scope.join(', ')}.
- Inclusive Design Sprint Activities: ${INCLUSIVE_DESIGN_SPRINT_ACTIVITIES.map(a => a.title).join(', ')} — recommend during ideation phases.
- Inclusive Prompting Heuristics: ${INCLUSIVE_PROMPTING_HEURISTICS.map(h => h.title).join(', ')} — enforce for all AI-generated imagery.

PORTFOLIO (${(brands||[]).length} brands, ${(products||[]).length} products, ${(events||[]).length} events, ${(brains||[]).length} analyzed):
${brainSummaries || "No entity brains yet."}

KNOWLEDGE (${(knowledge||[]).length} entries):
${knowledgeCtx || "None."}
${iconStudioBlock}


HISTORICAL GOVERNANCE DIGESTS (${(priorDigests||[]).length} prior runs):
${digestHistory || "No prior digests — this is the first governance cycle."}
Use these prior digests to identify TRENDS, REGRESSIONS, and LONG-TERM PATTERNS. Note what improved, what declined, and what remained stagnant across cycles.

PERSONA-BASED INCLUSIVE DESIGN (Microsoft Persona Spectrum):
Evaluate the organization's portfolio through persona-based design thinking, explicitly considering permanent, temporary, and situational needs across ALL user groups:
- Mobility: permanent (wheelchair user), temporary (broken arm), situational (carrying child)
- Vision: permanent (blind), temporary (dilated pupils), situational (bright sunlight)
- Hearing: permanent (deaf), temporary (ear infection), situational (noisy venue)
- Speech: permanent (non-verbal), temporary (laryngitis), situational (foreign language setting)
- Cognitive: permanent (ADHD), temporary (concussion), situational (information overload)
Include a "persona_design_maturity" object assessing how well products, events, and brand touchpoints address the full spectrum.

AUTHENTIC PHOTOGRAPHY & IMAGERY STRATEGY:
Evaluate and guide the organization's visual content strategy toward authentic, photojournalistic imagery:
- Evolve beyond generic 'corporate happy people' stock photography toward real-world documentary-style captures
- Prioritize images of actual experts, employees, and clients in genuine work situations — not posed or staged
- Use photojournalistic techniques: natural lighting, candid moments, real environments, unscripted interactions
- Build credibility through behind-the-scenes content showing real processes, expertise in action, and client collaboration
- Capture emotional authenticity: real reactions, genuine problem-solving, actual team dynamics
- Avoid: overly polished studio shots, artificial diversity staging, disconnected stock imagery, forced smiles
- Ensure diverse representation is natural and contextual, not tokenistic — people as active participants in real scenarios
- Show equal power dynamics in client-expert interactions: collaborative, not hierarchical or pity-based
Include a "photography_strategy" object: {"authenticity_score":0-100,"current_style":"generic_corporate|transitional|photojournalistic|documentary","credibility_gaps":["up to 3"],"evolution_recommendations":["up to 3"],"emotional_connection_score":0-100}

PATIENT-FOCUSED RESEARCH & LOCALIZATION INTEGRATION:
Leverage insights from patient-focused research, user studies, and localization efforts to inform inclusive design across the portfolio:
- Identify how patient/user research findings (clinical trials, patient journeys, caregiver feedback) can improve design for a wider audience beyond the original target demographic
- Assess whether localization efforts (translations, cultural adaptations, regional variants) have surfaced accessibility or usability insights that benefit ALL users
- Evaluate the "curb-cut effect" across the portfolio: features designed for specific patient/user needs that create universal benefits (e.g., plain-language medical instructions helping non-native speakers, high-contrast labels aiding low-vision AND bright-sunlight scenarios)
- Check if research insights are systematically fed back into design iterations across entities, not siloed in individual brand or product reports
- Recommend how patient/user research pipelines can be strengthened to continuously inform inclusive product, event, and brand evolution
Include a "patient_research_integration" object: {"research_utilization_score":0-100,"curb_cut_opportunities":["up to 3 features designed for specific needs that benefit everyone"],"localization_insights":["up to 3 insights from localization that improved universal design"],"feedback_loop_maturity":"nascent|developing|established|advanced","cross_entity_learning":["up to 3 insights shared across brands/products/events"],"recommendations":["up to 3"]}

Return ONLY valid JSON:
{"org_summary":"3-4 sentences","longitudinal_trends":{"improvements":["up to 3 positive trends vs prior cycles"],"regressions":["up to 3 declining trends"],"stagnant_areas":["up to 2 areas showing no progress"],"cycle_over_cycle_insight":"1-2 sentences comparing this cycle to the last"},"portfolio_analysis":{"synergies":["up to 4"],"gaps":["up to 3"],"conflicts":["risks"],"recommendations":["up to 3"]},"market_landscape":{"overall_position":"1-2 sentences","market_opportunities":["up to 3"],"threats":["up to 2"]},"strategic_recommendations":[{"priority":"high|medium|low","recommendation":"rec","rationale":"why","impact":"impact"}],"cross_entity_patterns":{"voice_consistency":"1 sentence","audience_overlap":"1 sentence","visual_coherence":"1 sentence"},"unified_voice_profile":{"primary_tone":"1-2 words","secondary_tones":["up to 3"],"communication_style":"1 sentence","personality_traits":["up to 4"]},"unified_audience_map":{"primary_segment":"1 sentence","secondary_segments":["up to 3"],"underserved_segments":["up to 2"]},"competitive_overview":{"market_position":"1 sentence","key_competitors":["up to 3"],"competitive_moat":"1 sentence"},"cultural_readiness":{"overall_score":50,"strongest_markets":["up to 3"],"expansion_opportunities":["up to 3"]},"governance_posture":{"eaa_readiness":"high|medium|low","inclusive_ai_maturity":"high|medium|low","recommended_sprint_activities":["up to 2 from: Computer Trust Exercise, Human-to-Computer Role-Play, Interaction Diary"],"regulatory_action_items":["up to 3"]},"persona_design_maturity":{"overall_score":50,"mobility_coverage":"1 sentence","vision_coverage":"1 sentence","hearing_coverage":"1 sentence","speech_coverage":"1 sentence","cognitive_coverage":"1 sentence","gaps":["up to 3"],"recommendations":["up to 3"]},"photography_strategy":{"authenticity_score":50,"current_style":"generic_corporate","credibility_gaps":["up to 3"],"evolution_recommendations":["up to 3"],"emotional_connection_score":50},"patient_research_integration":{"research_utilization_score":50,"curb_cut_opportunities":["up to 3"],"localization_insights":["up to 3"],"feedback_loop_maturity":"developing","cross_entity_learning":["up to 3"],"recommendations":["up to 3"]}}`;
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (aiRes.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI synthesis failed: ${aiRes.status}`);
    }

    await updateJob(jobId, { progress: 70 });

    const parsed = await aiRes.json();
    const content = parsed.choices?.[0]?.message?.content || "";

    let synthesis: any;
    try {
      synthesis = JSON.parse(content.trim());
    } catch {
      try {
        const m = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        synthesis = JSON.parse((m?.[1] || m?.[0] || content).trim());
      } catch {
        synthesis = { org_summary: "Synthesis completed.", portfolio_analysis: {}, strategic_recommendations: [], cross_entity_patterns: {}, unified_voice_profile: {}, unified_audience_map: {}, competitive_overview: {}, cultural_readiness: { overall_score: 50 }, market_landscape: {} };
      }
    }

    await updateJob(jobId, { progress: 85 });

    const existingArr = await restQuery("oracle_intelligence", `organization_id=eq.${organizationId}&select=id,synthesis_count&limit=1`);
    const existing = existingArr?.[0];

    const oracleData = {
      organization_id: organizationId,
      org_summary: synthesis.org_summary || null,
      portfolio_analysis: synthesis.portfolio_analysis || {},
      market_landscape: synthesis.market_landscape || {},
      strategic_recommendations: synthesis.strategic_recommendations || [],
      cross_entity_patterns: synthesis.cross_entity_patterns || {},
      unified_voice_profile: synthesis.unified_voice_profile || {},
      unified_audience_map: synthesis.unified_audience_map || {},
      competitive_overview: synthesis.competitive_overview || {},
      cultural_readiness: {
        ...(synthesis.cultural_readiness || {}),
        governance_posture: synthesis.governance_posture || {},
        persona_design_maturity: synthesis.persona_design_maturity || {},
        photography_strategy: synthesis.photography_strategy || {},
        patient_research_integration: synthesis.patient_research_integration || {},
      },
      longitudinal_trends: synthesis.longitudinal_trends || null,
      knowledge_entry_count: (knowledge || []).length,
      entity_brain_count: (brains || []).length,
      last_synthesis_at: new Date().toISOString(),
      synthesis_count: (existing?.synthesis_count || 0) + 1,
    };

    if (existing) {
      await restQuery("oracle_intelligence", `id=eq.${existing.id}`, "PATCH", oracleData);
    } else {
      await restQuery("oracle_intelligence", "", "POST", oracleData);
    }

    await updateJob(jobId, {
      status: "completed", progress: 100,
      completed_at: new Date().toISOString(),
      result: { success: true, summary: synthesis.org_summary?.slice(0, 200) },
    });
  } catch (error) {
    console.error("[oracle] Synthesis error:", error);
    await updateJob(jobId, {
      status: "failed", completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Background document import processor - AI extracts and summarizes content
 */
async function processDocumentImport(
  apiKey: string, jobId: string, organizationId: string, userId: string,
  title: string, rawContent: string, category: string, tags: string[]
) {
  try {
    await updateJob(jobId, { status: "processing", started_at: new Date().toISOString(), progress: 20 });

    // Truncate to avoid token limits
    const truncated = rawContent.slice(0, 8000);

    const prompt = `You are the Oracle Knowledge Extractor. Analyze this document and extract key insights for an organization's knowledge base.

DOCUMENT TITLE: ${title}
DOCUMENT CONTENT:
${truncated}

Extract and summarize the most important strategic insights, facts, frameworks, and actionable knowledge. Return ONLY valid JSON:
{"summary":"2-3 paragraph comprehensive summary of key insights","key_findings":["up to 6 most important findings or facts"],"strategic_implications":["up to 4 implications for brand/business strategy"],"extracted_tags":["up to 5 topic tags derived from content"]}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI extraction failed: ${aiRes.status}`);
    }

    await updateJob(jobId, { progress: 60 });

    const parsed = await aiRes.json();
    const content = parsed.choices?.[0]?.message?.content || "";

    let extraction: any;
    try {
      extraction = JSON.parse(content.trim());
    } catch {
      try {
        const m = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
        extraction = JSON.parse((m?.[1] || m?.[0] || content).trim());
      } catch {
        extraction = { summary: rawContent.slice(0, 500), key_findings: [], strategic_implications: [], extracted_tags: [] };
      }
    }

    // Build rich knowledge entry content
    const richContent = [
      extraction.summary,
      extraction.key_findings?.length ? `\n\nKey Findings:\n${extraction.key_findings.map((f: string) => `• ${f}`).join('\n')}` : '',
      extraction.strategic_implications?.length ? `\n\nStrategic Implications:\n${extraction.strategic_implications.map((s: string) => `• ${s}`).join('\n')}` : '',
    ].filter(Boolean).join('');

    const allTags = [...new Set([...tags, ...(extraction.extracted_tags || [])])];

    await updateJob(jobId, { progress: 80 });

    // Insert into knowledge base
    await restQuery("oracle_knowledge_base", "", "POST", {
      organization_id: organizationId,
      title: `📄 ${title}`,
      content: richContent,
      content_type: "document",
      source_type: "document_import",
      category,
      tags: allTags,
      created_by: userId,
      metadata: { original_length: rawContent.length, findings_count: extraction.key_findings?.length || 0 },
    });

    await updateJob(jobId, {
      status: "completed", progress: 100,
      completed_at: new Date().toISOString(),
      result: { success: true, title, findings: extraction.key_findings?.length || 0 },
    });
  } catch (error) {
    console.error("[oracle] Document import error:", error);
    await updateJob(jobId, {
      status: "failed", completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
