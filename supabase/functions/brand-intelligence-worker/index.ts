/**
 * Brand Intelligence Analysis Worker
 * Ultra-lightweight edge function for AI analysis
 * Uses direct fetch() REST calls instead of Supabase SDK to stay under 150MB
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lightweight DB helper using direct REST calls (no SDK overhead)
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
      const res = await fetch(`${base}/${table}?${query}`, { headers: { ...headers, Prefer: "return=representation" } });
      if (!res.ok) throw new Error(`DB select ${table} failed: ${res.status}`);
      return res.json();
    },
    async selectSingle(table: string, query: string): Promise<any | null> {
      const res = await fetch(`${base}/${table}?${query}`, {
        headers: { ...headers, Accept: "application/vnd.pgrst.object+json", Prefer: "return=representation" },
      });
      if (res.status === 406) return null; // no rows
      if (!res.ok) throw new Error(`DB selectSingle ${table} failed: ${res.status}`);
      return res.json();
    },
    async update(table: string, query: string, body: Record<string, unknown>): Promise<void> {
      const res = await fetch(`${base}/${table}?${query}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`DB update ${table} failed: ${res.status} ${t}`);
      }
    },
    async insert(table: string, body: Record<string, unknown>): Promise<any> {
      const res = await fetch(`${base}/${table}`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`DB insert ${table} failed: ${res.status}`);
      const arr = await res.json();
      return Array.isArray(arr) ? arr[0] : arr;
    },
    async upsert(table: string, body: Record<string, unknown>, onConflict: string): Promise<void> {
      const res = await fetch(`${base}/${table}`, {
        method: "POST",
        headers: { ...headers, Prefer: `return=minimal,resolution=merge-duplicates` },
        body: JSON.stringify(body),
      });
      // Upsert may 409 on some configs, that's ok
      if (!res.ok && res.status !== 409) {
        console.warn(`DB upsert ${table} warning: ${res.status}`);
      }
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = dbFetch(supabaseUrl, supabaseServiceKey);
  let jobId: string | null = null;

  try {
    const body = await req.json();
    jobId = body.jobId;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get job details
    const job = await db.selectSingle('brand_intelligence_jobs', `id=eq.${jobId}&select=id,entity_type,entity_id,organization_id,status`);

    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return new Response(JSON.stringify({ error: "Job already processed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update to processing
    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, {
      status: 'processing',
      started_at: new Date().toISOString(),
      progress: 10,
    });

    // Fetch entity text context via server-side RPC
    // This extracts ONLY text fields from guide_data in PostgreSQL,
    // preventing the 77-126MB guide_data from ever entering Edge Function memory
    const table = job.entity_type === 'brand' ? 'brands' : job.entity_type === 'product' ? 'products' : 'events';
    
    const contextRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_entity_text_context`,
      {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ p_table: table, p_id: job.entity_id }),
      }
    );

    if (!contextRes.ok) {
      throw new Error(`Entity context fetch failed: ${contextRes.status}`);
    }

    const textContext = await contextRes.json();
    if (!textContext) {
      throw new Error(`Entity not found`);
    }

    const entityName = textContext.name || 'Unknown';
    
    // Build lightweight brand context from the extracted text fields
    const brandContext = buildContextFromTextFields(textContext);

    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, { progress: 30 });

    // Skip document context entirely — the SDK import causes memory crashes
    // Documents are still analyzed during brand-audit and research briefings
    const documentCount = 0;

    // Fetch Oracle context directly via REST (no SDK)
    const oracleContext = await fetchOracleContextRest(db, job.organization_id);

    // Build event-specific physical accessibility context
    const isEvent = job.entity_type === 'event';
    const physicalAccessibilityContext = isEvent ? `
PHYSICAL EVENT ACCESSIBILITY STANDARDS (ADA/IBC/ISO 21542):
Evaluate the event's venue and logistics against these critical physical accessibility requirements:
- Doors: ≥32in clear width, ≤5lbf operating force, ≤0.5in thresholds
- Corridors: ≥64in for two-way traffic, ≥44in one-way, protruding objects ≤4in
- Aisles: ≥36in minimum, 60×60in passing spaces
- Ramps: Max 1:12 slope, ≤30in rise per run, handrails 34-38in, 60in landings
- Elevators: Car ≥51×80in, door ≥36in, Braille buttons, audible announcements
- Restrooms: 60in turning circle, grab bars, toilet 17-19in, accessible lavatory
- Seating: 1% wheelchair spaces dispersed, 36×48in clear floor, companion seats
- Stages: Accessible route (ramp/lift), adjustable podium 28-34in
- Registration: Counter at 28-34in, knee clearance ≥27in
- Parking: Van-accessible 11ft+5ft aisle, shortest route to entrance
- Signage: Tactile signs 48-60in AFF, overhead chars ≥3in, Braille
- Floors: Slip-resistant, carpet ≤0.5in pile, level changes ≤0.25in
- Emergency: Accessible egress, areas of refuge, visual+audible alarms
- Outdoor: Accessible mats on soft surfaces ≥36in wide, shade at waiting areas
- Quiet/Sensory rooms: Low stimulation, available throughout event
Include a "physical_accessibility" object in your response with: {"venue_readiness_score":0-100,"ada_compliance_gaps":["..."],"recommended_accommodations":["..."],"critical_measurements":["category: measurement required"]}
` : '';

    const eventJsonExtra = isEvent ? ',"physical_accessibility":{"venue_readiness_score":50,"ada_compliance_gaps":["up to 5"],"recommended_accommodations":["up to 5"],"critical_measurements":["up to 5 category: spec pairs"]}' : '';

    const prompt = `Analyze "${entityName}" ${isEvent ? 'event' : 'brand'}. Return compact JSON:
${brandContext}
${oracleContext ? `\nORACLE BRAIN CONTEXT:\n${oracleContext}` : ''}
${physicalAccessibilityContext}
Analyze for ${isEvent ? 'event experience, venue accessibility, and' : ''} brand coherence and market positioning.${oracleContext ? ' Align with Oracle org-level intelligence.' : ''} Return ONLY valid JSON:
{"summary":"2 sentences","position":"1 sentence","audience":"1 sentence","advantages":["up to 3"],"voice":{"tone":"1-2 words","style":"1-2 words"},"recommendation":"1 sentence","insight":"1 sentence","readiness":50,"cultural_insights":{"global_readiness_score":50,"primary_markets":["up to 3"],"cultural_considerations":[],"localization_priorities":[]},"globallink_recommendations":[{"product":"Translation|AI|Connect","relevance":"high|medium|low","use_case":"1 sentence"}]${eventJsonExtra}}`;

    // Text-only analysis — no multimodal to save memory on large brands
    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[worker] AI error:", aiResponse.status, errText.slice(0, 200));
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, { progress: 60 });

    // Parse response
    const responseText = await aiResponse.text();
    let content = "";
    try {
      const parsed = JSON.parse(responseText);
      content = parsed.choices?.[0]?.message?.content || "";
    } catch {
      console.error("[worker] Response parse error");
      throw new Error("Failed to parse AI response");
    }

    // Extract JSON
    let analysis: any;
    try {
      analysis = JSON.parse(content.trim());
    } catch {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                          content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
        analysis = JSON.parse(jsonStr);
      } catch {
        console.error("[worker] JSON extract error:", content.slice(0, 200));
        analysis = {
          summary: "Analysis completed",
          position: "Market participant",
          audience: "General consumers",
          advantages: ["Brand recognition"],
          voice: { tone: "Professional", style: "Clear" },
          recommendation: "Continue brand development",
          insight: "Opportunity for growth identified",
          readiness: 50
        };
      }
    }

    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, { progress: 80 });

    // Get or create intelligence record
    const intelRows = await db.select('brand_intelligence',
      `entity_type=eq.${job.entity_type}&entity_id=eq.${job.entity_id}&select=id,knowledge_entries,brand_summary,market_position,target_audience,competitive_advantages,brand_voice_profile,growth_recommendations,cultural_insights,globallink_recommendations,localization_readiness_score,analysis_count,learning_context&limit=1`
    );
    let intel = intelRows.length > 0 ? intelRows[0] : null;

    if (!intel) {
      intel = await db.insert('brand_intelligence', {
        entity_type: job.entity_type,
        entity_id: job.entity_id,
        organization_id: job.organization_id,
        knowledge_entries: [],
        semantic_hashes: [],
      });
    }

    if (!intel) throw new Error("Failed to get intelligence record");

    // Create insight entry
    const newInsight = {
      id: crypto.randomUUID(),
      type: 'insight',
      content: analysis.insight || analysis.summary || "Brand analysis completed",
      source: 'ai',
      category: 'ai-analysis',
      created_at: new Date().toISOString(),
      confidence: 0.7,
    };

    const entries = Array.isArray(intel.knowledge_entries) ? intel.knowledge_entries : [];

    // MERGE logic
    const mergeArrays = (existing: any, incoming: any) => {
      const ex = Array.isArray(existing) ? existing : [];
      const inc = Array.isArray(incoming) ? incoming : [];
      const combined = [...ex];
      for (const item of inc) {
        const str = typeof item === 'string' ? item : JSON.stringify(item);
        const isDuplicate = combined.some(e => {
          const eStr = typeof e === 'string' ? e : JSON.stringify(e);
          return eStr.toLowerCase() === str.toLowerCase();
        });
        if (!isDuplicate) combined.push(item);
      }
      return combined;
    };

    const mergeText = (existing: string | null, incoming: string | null | undefined) => {
      if (!incoming) return existing;
      if (!existing) return incoming;
      if (existing.length < 20 && incoming.length > existing.length) return incoming;
      return existing;
    };

    const existingVoice = (intel.brand_voice_profile as any) || {};
    const incomingVoice = analysis.voice || {};
    const mergedVoice = {
      ...existingVoice,
      tone: existingVoice.tone || incomingVoice.tone || "",
      style: existingVoice.style || incomingVoice.style || "",
      personality: existingVoice.personality || incomingVoice.personality,
      communication_style: existingVoice.communication_style || incomingVoice.style || "",
    };

    const existingRecs = Array.isArray(intel.growth_recommendations) ? intel.growth_recommendations : [];
    const incomingRecs = analysis.recommendation ? [{
      priority: "medium",
      recommendation: analysis.recommendation,
      rationale: "",
      confidence: 0.7
    }] : [];
    const mergedRecs = mergeArrays(existingRecs, incomingRecs);

    const existingCultural = (intel.cultural_insights as any) || {};
    const incomingCultural = analysis.cultural_insights || {};
    const mergedCultural = Object.keys(incomingCultural).length > 0 ? {
      ...existingCultural,
      global_readiness_score: incomingCultural.global_readiness_score || existingCultural.global_readiness_score || 50,
      primary_markets: mergeArrays(existingCultural.primary_markets, incomingCultural.primary_markets),
      cultural_considerations: mergeArrays(existingCultural.cultural_considerations, incomingCultural.cultural_considerations),
      localization_priorities: mergeArrays(existingCultural.localization_priorities, incomingCultural.localization_priorities),
      color_cultural_notes: mergeArrays(existingCultural.color_cultural_notes, incomingCultural.color_cultural_notes),
      imagery_guidelines: mergeArrays(existingCultural.imagery_guidelines, incomingCultural.imagery_guidelines),
    } : existingCultural;

    const existingAudience = (intel.target_audience as any) || {};
    const mergedAudience = {
      ...existingAudience,
      primary: existingAudience.primary || analysis.audience || "",
      secondary: mergeArrays(existingAudience.secondary, []),
      demographics: mergeArrays(existingAudience.demographics, []),
    };

    const existingLearning = (intel.learning_context as Record<string, unknown>) || {};
    const mergedLearning = {
      ...existingLearning,
      ...(analysis.social_performance ? { social_performance: analysis.social_performance } : {}),
      ...(analysis.visual_analysis ? { visual_analysis: analysis.visual_analysis } : {}),
      ...(analysis.document_analysis ? { document_analysis: analysis.document_analysis } : {}),
      ...(analysis.physical_accessibility ? { physical_accessibility: analysis.physical_accessibility } : {}),
      last_updated: new Date().toISOString(),
    };

    // Update intelligence with MERGED data
    await db.update('brand_intelligence', `id=eq.${intel.id}`, {
      brand_summary: mergeText(intel.brand_summary as string | null, analysis.summary),
      market_position: mergeText(intel.market_position as string | null, analysis.position),
      target_audience: mergedAudience,
      competitive_advantages: mergeArrays(intel.competitive_advantages, analysis.advantages),
      brand_voice_profile: mergedVoice,
      growth_recommendations: mergedRecs,
      cultural_insights: Object.keys(mergedCultural).length > 0 ? mergedCultural : null,
      globallink_recommendations: mergeArrays(intel.globallink_recommendations, analysis.globallink_recommendations),
      knowledge_entries: [...entries, newInsight],
      learning_context: mergedLearning,
      last_analyzed_at: new Date().toISOString(),
      analysis_count: ((intel as any).analysis_count || 0) + 1,
      localization_readiness_score: Math.max(
        (intel.localization_readiness_score as number) || 0,
        analysis.cultural_insights?.global_readiness_score || analysis.readiness || 50
      ),
    });

    // Auto-feed to Oracle Knowledge Base
    if (job.organization_id && analysis.summary) {
      try {
        const oracleName = textContext?.hero_name || entityName || job.entity_type;
        const insightContent = [
          analysis.summary,
          analysis.position ? `\nMarket Position: ${analysis.position}` : '',
          Array.isArray(analysis.advantages) && analysis.advantages.length > 0
            ? `\nKey Advantages: ${analysis.advantages.join(', ')}` : '',
        ].filter(Boolean).join('');

        await db.upsert('oracle_knowledge_base', {
          organization_id: job.organization_id,
          title: `🧠 ${job.entity_type.charAt(0).toUpperCase() + job.entity_type.slice(1)} Intelligence: ${oracleName}`,
          content: insightContent,
          content_type: 'intelligence',
          source_type: 'entity_brain',
          category: 'entity_insights',
          source_entity_id: job.entity_id,
          source_entity_type: job.entity_type,
          tags: [job.entity_type, 'auto-generated', 'brain-insight'],
          is_active: true,
        }, 'organization_id,source_entity_id,source_entity_type');
      } catch (feedErr) {
        console.warn('[worker] Oracle auto-feed failed (non-critical):', feedErr);
      }
    }

    // Mark job complete
    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, {
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      result: { success: true, summary: analysis.summary },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[worker] Error:", error);

    if (jobId) {
      try {
        await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (updateErr) {
        console.error("[worker] Failed to update job status:", updateErr);
      }
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Fetch Oracle Brain context using REST calls (no SDK)
 */
async function fetchOracleContextRest(db: ReturnType<typeof dbFetch>, organizationId: string | null): Promise<string | null> {
  if (!organizationId) return null;

  try {
    const [oracleRows, knowledge] = await Promise.all([
      db.select('oracle_intelligence',
        `organization_id=eq.${organizationId}&select=org_summary,unified_voice_profile,competitive_overview,strategic_recommendations&limit=1`
      ),
      db.select('oracle_knowledge_base',
        `organization_id=eq.${organizationId}&is_active=eq.true&select=title,content&order=updated_at.desc&limit=5`
      ),
    ]);

    const oracle = oracleRows.length > 0 ? oracleRows[0] : null;
    if (!oracle?.org_summary && (!knowledge || knowledge.length === 0)) return null;

    const parts: string[] = [];
    if (oracle?.org_summary) parts.push(`Org Summary: ${oracle.org_summary}`);
    if (oracle?.unified_voice_profile?.primary_tone) {
      parts.push(`Org Voice: ${oracle.unified_voice_profile.primary_tone}`);
    }
    if (oracle?.competitive_overview?.market_position) {
      parts.push(`Org Market Position: ${oracle.competitive_overview.market_position}`);
    }
    const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
    if (recs.length > 0) {
      parts.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
    }
    if (knowledge && knowledge.length > 0) {
      parts.push(`Knowledge Base: ${knowledge.map((k: any) => `${k.title}: ${k.content.slice(0, 100)}`).join(' | ')}`);
    }

    return parts.join('\n');
  } catch (err) {
    console.warn('[worker] Oracle context fetch failed:', err);
    return null;
  }
}

/**
 * Build brand context from pre-extracted text fields (from get_entity_text_context RPC)
 * No guide_data ever enters Edge Function memory
 */
function buildContextFromTextFields(ctx: any): string {
  const parts: string[] = [];
  if (ctx.name) parts.push(`Name: ${ctx.name}`);
  if (ctx.hero_name) parts.push(`Brand Name: ${ctx.hero_name}`);
  if (ctx.hero_tagline) parts.push(`Tagline: ${ctx.hero_tagline}`);
  if (ctx.primary_tagline) parts.push(`Primary Tagline: ${ctx.primary_tagline}`);
  if (ctx.mission) parts.push(`Mission: ${ctx.mission}`);
  if (ctx.archetype) parts.push(`Archetype: ${ctx.archetype}`);
  if (ctx.industry) parts.push(`Industry: ${ctx.industry}`);

  // Tone of voice
  const tone = ctx.tone_of_voice;
  if (Array.isArray(tone) && tone.length > 0) parts.push(`Tone: ${tone.slice(0, 5).join(', ')}`);
  else if (typeof tone === 'string') parts.push(`Tone: ${tone}`);

  // Colors
  const colors = ctx.colors;
  if (Array.isArray(colors) && colors.length > 0) {
    const colorSummary = colors.slice(0, 8).map((c: any) =>
      `${c.name || c.role || ''}:${c.hex || ''}`
    ).filter(Boolean).join(', ');
    if (colorSummary) parts.push(`Colors: ${colorSummary}`);
  }

  // Values
  const values = ctx.values;
  if (Array.isArray(values) && values.length > 0) {
    parts.push(`Values: ${values.filter(Boolean).join(', ')}`);
  }

  // Services
  const services = ctx.services;
  if (Array.isArray(services) && services.length > 0) {
    parts.push(`Services: ${services.filter(Boolean).join(', ')}`);
  }

  // Typography
  const typography = ctx.typography;
  if (Array.isArray(typography) && typography.length > 0) {
    parts.push(`Fonts: ${typography.filter(Boolean).join(', ')}`);
  }

  // Awards (enriched)
  const awards = ctx.awards;
  if (Array.isArray(awards) && awards.length > 0) {
    const awardDetails = awards.map((a: any) => {
      const d: string[] = [a.title || 'Award'];
      if (a.organization) d.push(`by ${a.organization}`);
      if (a.year) d.push(`(${a.year})`);
      if (a.category) d.push(`[${a.category}]`);
      if (a.description) d.push(`- ${a.description}`);
      return d.join(' ');
    });
    parts.push(`Awards (${ctx.awards_count || awards.length}): ${awardDetails.join('; ')}`);
  }

  // Webinars (enriched)
  const webinars = ctx.webinars;
  if (Array.isArray(webinars) && webinars.length > 0) {
    const webinarDetails = webinars.map((w: any) => {
      const d: string[] = [w.title || 'Webinar'];
      if (w.topic) d.push(`[${w.topic}]`);
      if (w.speakers) d.push(`Speakers: ${w.speakers}`);
      if (w.description) d.push(`- ${w.description}`);
      if (w.date) d.push(`(${w.date})`);
      return d.join(' ');
    });
    parts.push(`Webinars (${ctx.webinars_count || webinars.length}): ${webinarDetails.join('; ')}`);
  }

  // Websites (enriched)
  const websites = ctx.websites;
  if (Array.isArray(websites) && websites.length > 0) {
    const siteDetails = websites.map((ws: any) => {
      const d: string[] = [ws.url || 'site'];
      if (ws.label) d.push(`(${ws.label})`);
      if (ws.purpose) d.push(`Purpose: ${ws.purpose}`);
      if (ws.description) d.push(`- ${ws.description}`);
      return d.join(' ');
    });
    parts.push(`Websites (${ctx.websites_count || websites.length}): ${siteDetails.join('; ')}`);
  }

  // Website analysis reports
  const analyses = ctx.website_analyses;
  if (Array.isArray(analyses) && analyses.length > 0) {
    const analysisDetails = analyses.map((wa: any) => {
      const d: string[] = [wa.url || 'site'];
      if (wa.score) d.push(`Score: ${wa.score}/100`);
      if (wa.grade) d.push(`Grade: ${wa.grade}`);
      if (wa.summary) d.push(wa.summary);
      return d.join(' | ');
    });
    parts.push(`Website Analyses: ${analysisDetails.join(' || ')}`);
  }

  // Case studies
  const caseStudies = ctx.case_studies;
  if (Array.isArray(caseStudies) && caseStudies.length > 0) {
    parts.push(`Case Studies (${ctx.case_studies_count || caseStudies.length}): ${caseStudies.map((cs: any) => `${cs.title || 'Study'}${cs.description ? ': ' + cs.description : ''}`).join('; ')}`);
  }

  // Statistics
  const statistics = ctx.statistics;
  if (Array.isArray(statistics) && statistics.length > 0) {
    parts.push(`Statistics: ${statistics.map((s: any) => `${s.label || 'stat'}: ${s.value || ''}`).join(', ')}`);
  }

  // Social profiles
  const social = ctx.social_profiles;
  if (Array.isArray(social) && social.length > 0) {
    parts.push(`Social: ${social.map((sp: any) => `${sp.platform || 'channel'}: ${sp.handle || ''}`).join(', ')}`);
  }

  // Asset counts
  const counts: string[] = [];
  if (ctx.logos_count > 0) counts.push(`logos: ${ctx.logos_count}`);
  if (ctx.imagery_count > 0) counts.push(`imagery: ${ctx.imagery_count}`);
  if (ctx.patterns_count > 0) counts.push(`patterns: ${ctx.patterns_count}`);
  if (ctx.brochures_count > 0) counts.push(`brochures: ${ctx.brochures_count}`);
  if (ctx.icons_count > 0) counts.push(`icons: ${ctx.icons_count}`);
  if (counts.length > 0) parts.push(`Asset counts: ${counts.join(', ')}`);

  return parts.join('\n');
}
