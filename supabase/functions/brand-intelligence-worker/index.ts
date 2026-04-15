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

    // Fetch prior analysis for longitudinal comparison
    let priorAnalysisContext = '';
    try {
      const priorIntel = await db.selectSingle('brand_intelligence',
        `entity_id=eq.${job.entity_id}&entity_type=eq.${job.entity_type}&select=brand_summary,market_position,localization_readiness_score,analysis_count,last_analyzed_at,competitive_advantages,cultural_insights`
      );
      if (priorIntel && priorIntel.last_analyzed_at) {
        const parts: string[] = [];
        parts.push(`Last analyzed: ${priorIntel.last_analyzed_at}`);
        parts.push(`Analysis count: ${priorIntel.analysis_count || 0}`);
        if (priorIntel.brand_summary) parts.push(`Prior summary: ${String(priorIntel.brand_summary).slice(0, 300)}`);
        if (priorIntel.market_position) parts.push(`Prior position: ${String(priorIntel.market_position).slice(0, 150)}`);
        if (priorIntel.localization_readiness_score != null) parts.push(`Prior readiness: ${priorIntel.localization_readiness_score}%`);
        if (Array.isArray(priorIntel.competitive_advantages) && priorIntel.competitive_advantages.length) {
          parts.push(`Prior advantages: ${priorIntel.competitive_advantages.slice(0, 3).join('; ')}`);
        }
        priorAnalysisContext = `\nPRIOR ANALYSIS HISTORY:\n${parts.join('\n')}\nCompare your new analysis against these prior findings. Note what changed, improved, or regressed.`;
      }
    } catch (e) {
      console.warn('[worker] Prior analysis fetch failed (non-critical):', e);
    }

    await db.update('brand_intelligence_jobs', `id=eq.${jobId}`, { progress: 30 });

    // Skip document context entirely — the SDK import causes memory crashes
    // Documents are still analyzed during brand-audit and research briefings
    const documentCount = 0;

    // Fetch content from external linked assets (Dropbox, GlobalLink, etc.)
    const externalDocContent = await fetchExternalAssetContent(
      supabaseUrl, supabaseServiceKey, textContext
    );
    if (externalDocContent) {
      console.log(`[worker] Extracted ${externalDocContent.length} chars from external assets`);
    }

    // Fetch Oracle context directly via REST (no SDK)
    const oracleContext = await fetchOracleContextRest(db, job.organization_id);

    // Fetch Visual DNA (learned imagery preferences) for cross-pollination
    let visualDnaContext = '';
    try {
      const visualDna = await db.selectSingle('imagery_visual_dna',
        `entity_id=eq.${job.entity_id}&entity_type=eq.${job.entity_type}&select=preferred_categories,preferred_colors,preferred_styles,mood_keywords,avoid_keywords,approval_patterns,total_approved,total_skipped,total_removed,confidence_score`
      );
      if (visualDna && (visualDna.total_approved > 0 || visualDna.total_skipped > 0)) {
        const parts: string[] = [];
        parts.push(`VISUAL DNA PROFILE (from ${visualDna.total_approved || 0} approved, ${visualDna.total_skipped || 0} skipped, ${visualDna.total_removed || 0} removed images):`);
        if (Array.isArray(visualDna.preferred_categories) && visualDna.preferred_categories.length > 0) {
          parts.push(`Preferred imagery categories: ${visualDna.preferred_categories.slice(0, 5).map((c: any) => c.name || c).join(', ')}`);
        }
        if (Array.isArray(visualDna.preferred_colors) && visualDna.preferred_colors.length > 0) {
          parts.push(`Preferred colors in imagery: ${visualDna.preferred_colors.slice(0, 5).map((c: any) => c.color || c).join(', ')}`);
        }
        if (Array.isArray(visualDna.preferred_styles) && visualDna.preferred_styles.length > 0) {
          parts.push(`Preferred visual styles: ${visualDna.preferred_styles.slice(0, 5).map((s: any) => s.style || s).join(', ')}`);
        }
        if (Array.isArray(visualDna.mood_keywords) && visualDna.mood_keywords.length > 0) {
          parts.push(`Preferred mood/themes: ${visualDna.mood_keywords.slice(0, 8).join(', ')}`);
        }
        if (Array.isArray(visualDna.avoid_keywords) && visualDna.avoid_keywords.length > 0) {
          parts.push(`Imagery to AVOID: ${visualDna.avoid_keywords.slice(0, 6).join(', ')}`);
        }
        const patterns = visualDna.approval_patterns as any;
        if (patterns?.summary) parts.push(`Visual taste summary: ${String(patterns.summary).slice(0, 200)}`);
        if (Array.isArray(patterns?.rejection_reasons) && patterns.rejection_reasons.length > 0) {
          parts.push(`Common rejection reasons: ${patterns.rejection_reasons.slice(0, 4).join('; ')}`);
        }
        parts.push(`Confidence: ${visualDna.confidence_score || 0}%`);
        visualDnaContext = `\n${parts.join('\n')}\nIncorporate this visual preference data into your imagery guidelines and brand voice analysis. Note alignment or misalignment between visual preferences and stated brand identity.`;
      }
    } catch (e) {
      console.warn('[worker] Visual DNA fetch failed (non-critical):', e);
    }

    // Fetch visibility audit context
    let visibilityContext = '';
    try {
      const visAudits = await db.select('brand_visibility_audits',
        `entity_id=eq.${job.entity_id}&entity_type=eq.${job.entity_type}&status=eq.completed&order=created_at.desc&limit=1&select=overall_visibility_score,search_visibility_score,ai_platform_score,social_media_score,visibility_gaps,recommendations`
      );
      if (visAudits.length > 0) {
        const va = visAudits[0];
        const parts: string[] = [];
        parts.push(`VISIBILITY AUDIT DATA:`);
        parts.push(`Overall: ${va.overall_visibility_score ?? 'N/A'}%, Search: ${va.search_visibility_score ?? 'N/A'}%, AI Platforms: ${va.ai_platform_score ?? 'N/A'}%, Social: ${va.social_media_score ?? 'N/A'}%`);
        const gaps = Array.isArray(va.visibility_gaps) ? va.visibility_gaps : [];
        if (gaps.length > 0) {
          const critical = gaps.filter((g: any) => g.severity === 'critical' || g.severity === 'high');
          parts.push(`${gaps.length} visibility gaps found (${critical.length} critical/high)`);
          critical.slice(0, 3).forEach((g: any) => parts.push(`- [${g.severity}] ${g.title || g.gap || g.category}: ${(g.description || '').slice(0, 100)}`));
        }
        const recs = Array.isArray(va.recommendations) ? va.recommendations : [];
        if (recs.length > 0) {
          parts.push(`Top recommendations: ${recs.slice(0, 3).map((r: any) => r.title || r.recommendation || '').join('; ')}`);
        }
        visibilityContext = `\n${parts.join('\n')}\nIncorporate visibility gaps into your growth recommendations and market position analysis.`;
      }
    } catch (e) {
      console.warn('[worker] Visibility audit fetch failed (non-critical):', e);
    }

    // Fetch social metrics context
    let socialMetricsContext = '';
    try {
      const snapshots = await db.select('social_metrics_snapshots',
        `entity_id=eq.${job.entity_id}&entity_type=eq.${job.entity_type}&order=snapshot_date.desc&limit=5&select=platform,followers_count,engagement_rate,follower_growth_percent,sentiment_score,brand_mentions_count,snapshot_date`
      );
      if (snapshots.length > 0) {
        const parts: string[] = ['SOCIAL METRICS SNAPSHOT:'];
        for (const s of snapshots) {
          parts.push(`${s.platform}: ${s.followers_count || 0} followers, ${(s.engagement_rate || 0).toFixed(1)}% engagement, ${(s.follower_growth_percent || 0).toFixed(1)}% growth, sentiment ${(s.sentiment_score || 0).toFixed(1)}, ${s.brand_mentions_count || 0} mentions (${s.snapshot_date})`);
        }
        socialMetricsContext = `\n${parts.join('\n')}\nFactor social performance into brand strength assessment and audience analysis.`;
      }
    } catch (e) {
      console.warn('[worker] Social metrics fetch failed (non-critical):', e);
    }

    // Fetch DataForce compliance context
    let complianceContext = '';
    try {
      const compJobs = await db.select('dataforce_compliance_jobs',
        `entity_id=eq.${job.entity_id}&status=eq.completed&order=created_at.desc&limit=1&select=compliance_score,findings,recommendations`
      );
      if (compJobs.length > 0) {
        const c = compJobs[0];
        const parts: string[] = [`BRAND COMPLIANCE SCORE: ${c.compliance_score ?? 'N/A'}%`];
        const findings = Array.isArray(c.findings) ? c.findings : [];
        if (findings.length > 0) {
          parts.push(`Key findings: ${findings.slice(0, 3).map((f: any) => f.title || f.finding || JSON.stringify(f).slice(0, 60)).join('; ')}`);
        }
        complianceContext = `\n${parts.join('\n')}\nConsider compliance gaps in your recommendations.`;
      }
    } catch (e) {
      console.warn('[worker] Compliance fetch failed (non-critical):', e);
    }

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

    const isProduct = job.entity_type === 'product';
    const isBrand = job.entity_type === 'brand';
    const personaDesignContext = `
PERSONA-BASED INCLUSIVE DESIGN (Microsoft Persona Spectrum):
Integrate persona-based design thinking, explicitly considering permanent, temporary, and situational needs across ALL user groups:
- Mobility: permanent (wheelchair user), temporary (broken arm), situational (carrying child)
- Vision: permanent (blind), temporary (dilated pupils), situational (bright sunlight)
- Hearing: permanent (deaf), temporary (ear infection), situational (noisy venue)
- Speech: permanent (non-verbal), temporary (laryngitis), situational (foreign language setting)
- Cognitive: permanent (ADHD), temporary (concussion), situational (information overload)
Assess how well this ${job.entity_type}'s design, UX, and touchpoints address the full persona spectrum.
Include a "persona_design" object: {"spectrum_score":0-100,"dimension_scores":{"mobility":0-100,"vision":0-100,"hearing":0-100,"speech":0-100,"cognitive":0-100},"gaps":["up to 3"],"recommendations":["up to 3"]}
`;

    const inclusiveImageryContext = `
INCLUSIVE IMAGERY STANDARDS:
Evaluate all marketing materials and brand imagery against these mandatory principles:
- Actively showcase diverse individuals in realistic, everyday scenarios — not staged or tokenistic
- Reflect equal power hierarchies: avoid depicting disabled, elderly, or minority individuals in subordinate or pitied roles
- Reject pity-based tropes: no "inspiration porn", no framing disability as tragedy or triumph narrative
- Ensure representation spans age, ethnicity, gender identity, body type, and visible/invisible disability
- Depict assistive technology (wheelchairs, hearing aids, prosthetics) as neutral everyday tools, not props
- Show diverse individuals as active participants, decision-makers, and leaders — not passive recipients
- PRIORITIZE authentic, high-quality imagery over generic stock photos — showcase real people in genuine work environments, labs, innovation spaces, and community settings
- Feature innovative environments authentically: real labs, workshops, offices, field locations — not staged sets or overly polished corporate backdrops
- Capture candid expertise: scientists at work, engineers problem-solving, clinicians with patients, teams collaborating in real time
- Reject visual clichés: no handshake photos, no pointing-at-screens, no arms-crossed power poses, no blue-tinted stock "technology" imagery
Include an "inclusive_imagery" object: {"diversity_score":0-100,"power_hierarchy_balance":"equal|skewed|problematic","trope_risks":["up to 3"],"representation_gaps":["up to 3"],"authenticity_score":0-100,"stock_photo_dependency":"low|medium|high","recommendations":["up to 3"]}
`;

    const patientResearchContext = `
PATIENT-FOCUSED RESEARCH & LOCALIZATION INTEGRATION:
Leverage insights from patient-focused research, user studies, and localization efforts to inform inclusive design decisions:
- Identify how patient/user research findings (clinical trials, patient journeys, caregiver feedback) can improve design for a wider audience
- Assess whether localization efforts (translations, cultural adaptations, regional variants) have surfaced accessibility or usability insights that benefit ALL users — not just target demographics
- Evaluate the "curb-cut effect": features designed for specific patient/user needs that create universal benefits (e.g., plain-language medical instructions helping non-native speakers, high-contrast labels aiding low-vision AND bright-sunlight scenarios)
- Check if research insights are systematically fed back into design iterations, not siloed in reports
- Recommend how patient/user research pipelines can be strengthened to continuously inform inclusive product and brand evolution
Include a "patient_research_integration" object: {"research_utilization_score":0-100,"curb_cut_opportunities":["up to 3 features designed for specific needs that benefit everyone"],"localization_insights":["up to 3 insights from localization that improved universal design"],"feedback_loop_maturity":"nascent|developing|established|advanced","recommendations":["up to 3"]}
`;

    const labToLaunchContext = `
LAB-TO-LAUNCH JOURNEY VISUALIZATION:
Evaluate and recommend content that visually explains the complete 'lab to launch' journey for life sciences and similar innovation-driven entities:
- Assess whether existing content clearly maps the pipeline stages: discovery/research → preclinical → clinical trials → regulatory review → manufacturing → market launch → post-market surveillance
- Identify opportunities for visual storytelling: infographics, timeline graphics, process diagrams, milestone markers, and behind-the-scenes photography at each stage
- Evaluate how well the brand communicates scientific rigor and innovation process to diverse audiences (patients, investors, regulators, healthcare providers, general public)
- Check for transparency: does the content demystify complex processes without oversimplifying or creating unrealistic expectations?
- Recommend visual formats that build trust: data visualization of trial results, real lab/facility photography, expert commentary overlays, patient journey integration points
- Ensure accessibility: all journey visualizations should work for colorblind users, screen readers (alt-text), and multiple languages
Include a "lab_to_launch" object: {"journey_clarity_score":0-100,"stages_covered":["which pipeline stages are well-represented"],"visualization_gaps":["up to 3 stages or transitions lacking visual content"],"storytelling_opportunities":["up to 3 specific content pieces that would strengthen the narrative"],"audience_accessibility":"low|medium|high","recommendations":["up to 3"]}
`;

    const personaJsonExtra = ',"persona_design":{"spectrum_score":50,"dimension_scores":{"mobility":50,"vision":50,"hearing":50,"speech":50,"cognitive":50},"gaps":["up to 3"],"recommendations":["up to 3"]},"inclusive_imagery":{"diversity_score":50,"power_hierarchy_balance":"equal","trope_risks":[],"representation_gaps":["up to 3"],"authenticity_score":50,"stock_photo_dependency":"medium","recommendations":["up to 3"]}';

    const patientResearchJsonExtra = ',"patient_research_integration":{"research_utilization_score":50,"curb_cut_opportunities":["up to 3"],"localization_insights":["up to 3"],"feedback_loop_maturity":"developing","recommendations":["up to 3"]}';

    const labToLaunchJsonExtra = ',"lab_to_launch":{"journey_clarity_score":50,"stages_covered":["up to 5"],"visualization_gaps":["up to 3"],"storytelling_opportunities":["up to 3"],"audience_accessibility":"medium","recommendations":["up to 3"]}';

    const prompt = `Analyze "${entityName}" ${isEvent ? 'event' : isProduct ? 'product' : 'brand'}. Return compact JSON:
${brandContext}
${oracleContext ? `\nORACLE BRAIN CONTEXT:\n${oracleContext}` : ''}
${visualDnaContext}
${visibilityContext}
${socialMetricsContext}
${complianceContext}
${externalDocContent ? `\nEXTERNAL LINKED DOCUMENTS (fetched from Dropbox/GlobalLink/external sources):\n${externalDocContent}` : ''}
${priorAnalysisContext}
${physicalAccessibilityContext}
${personaDesignContext}
${inclusiveImageryContext}
${patientResearchContext}
${labToLaunchContext}
Analyze for ${isEvent ? 'event experience, venue accessibility, and' : isProduct ? 'product inclusive design, user accessibility, and' : 'brand inclusive representation, imagery standards, and'} brand coherence and market positioning.${oracleContext ? ' Align with Oracle org-level intelligence.' : ''}${externalDocContent ? ' Incorporate insights from external linked documents into your analysis.' : ''}${priorAnalysisContext ? ' Compare against prior analysis and note trends.' : ''}

SACM (Sentiment Analysis & Computational Color Modeling):
Evaluate whether the brand's color palette aligns with its messaging sentiment:
- Positive/Trust → Cyan/Teal, Negative/Urgency → Magenta/Red, Neutral/Professional → Blue-Gray/Slate, Joy/Energy → Yellow/Orange, Calm/Wellness → Green/Sage
Include a "sacm_analysis" object: {"sentiment_color_alignment":0-100,"dominant_sentiment":"...","bias_flags":["up to 3 misalignments"],"recommendations":["up to 3"]}

IMPORTANT — IMAGERY & COLOR CULTURAL ANALYSIS:
- Assess whether brand photography includes diverse representation across age, ethnicity, gender identity, body type, and disability
- Provide specific imagery_guidelines for improving multicultural appeal and authentic representation
- Analyze color choices for cultural sensitivity across target markets (e.g., white=mourning in East Asia, red=luck in China vs danger in Western markets)
- Provide color_cultural_notes with specific observations about the brand's palette in cross-cultural contexts

Return ONLY valid JSON:
{"summary":"2 sentences","position":"1 sentence","audience":"1 sentence","advantages":["up to 3"],"voice":{"tone":"1-2 words","style":"1-2 words"},"recommendation":"1 sentence","insight":"1 sentence","readiness":50,"cultural_insights":{"global_readiness_score":50,"primary_markets":["up to 3"],"cultural_considerations":[{"region":"region name","considerations":["up to 3"],"design_adaptations":["up to 3"],"messaging_notes":"1 sentence"}],"localization_priorities":["up to 3"],"color_cultural_notes":["up to 3 notes on color symbolism across cultures"],"imagery_guidelines":["up to 5 specific guidelines for diverse, authentic brand photography"]},"globallink_recommendations":[{"product":"Translation|AI|Connect","relevance":"high|medium|low","use_case":"1 sentence"}],"sacm_analysis":{"sentiment_color_alignment":50,"dominant_sentiment":"...","bias_flags":["up to 3"],"recommendations":["up to 3"]}${eventJsonExtra}${personaJsonExtra}${patientResearchJsonExtra}${labToLaunchJsonExtra}}`;

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
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
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
      ...(analysis.persona_design ? { persona_design: analysis.persona_design } : {}),
      ...(analysis.inclusive_imagery ? { inclusive_imagery: analysis.inclusive_imagery } : {}),
      ...(analysis.patient_research_integration ? { patient_research_integration: analysis.patient_research_integration } : {}),
      ...(analysis.lab_to_launch ? { lab_to_launch: analysis.lab_to_launch } : {}),
      ...(analysis.sacm_analysis ? { sacm_analysis: analysis.sacm_analysis } : {}),
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

    // Fire-and-forget: trigger asset content extraction in background
    if (job.organization_id) {
      try {
        const extractUrl = `${supabaseUrl}/functions/v1/extract-asset-content`;
        const extractPromise = fetch(extractUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
            apikey: supabaseServiceKey,
          },
          body: JSON.stringify({
            entityId: job.entity_id,
            entityType: job.entity_type,
            organizationId: job.organization_id,
          }),
        }).catch(e => console.warn('[worker] Asset extraction trigger failed (non-critical):', e));

        // Use waitUntil if available, otherwise just fire and forget
        if (typeof (globalThis as any).EdgeRuntime?.waitUntil === 'function') {
          (globalThis as any).EdgeRuntime.waitUntil(extractPromise);
        }
      } catch (triggerErr) {
        console.warn('[worker] Asset extraction trigger error (non-critical):', triggerErr);
      }
    }

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

  // Booth analyses (enriched)
  const boothAnalyses = ctx.booth_analyses;
  if (Array.isArray(boothAnalyses) && boothAnalyses.length > 0) {
    const boothDetails = boothAnalyses.map((b: any) => {
      const d: string[] = [`${b.division_name || 'Division'}: ${b.overall_score}/100`];
      if (b.variant) d.push(`(${b.variant})`);
      if (b.summary) d.push(`- ${b.summary.slice(0, 150)}`);
      const scores = [];
      if (b.design_score) scores.push(`Design:${b.design_score}`);
      if (b.messaging_score) scores.push(`Msg:${b.messaging_score}`);
      if (b.engagement_score) scores.push(`Eng:${b.engagement_score}`);
      if (scores.length) d.push(`[${scores.join(', ')}]`);
      if (Array.isArray(b.regional_insights) && b.regional_insights.length > 0) {
        const regions = b.regional_insights.slice(0, 3).map((r: any) => `${r.region}:${r.predicted_score}`).join(', ');
        d.push(`Regions: ${regions}`);
      }
      return d.join(' ');
    });
    parts.push(`Booth Analyses (${boothAnalyses.length}): ${boothDetails.join('; ')}`);
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

  // External linked assets (metadata)
  const allExternal = [
    ...(Array.isArray(ctx.external_assets) ? ctx.external_assets : []),
    ...(Array.isArray(ctx.external_templates) ? ctx.external_templates : []),
    ...(Array.isArray(ctx.external_presentations) ? ctx.external_presentations : []),
  ];
  if (allExternal.length > 0) {
    const extDetails = allExternal.map((ea: any) => {
      const d: string[] = [ea.title || 'Asset'];
      if (ea.category) d.push(`[${ea.category}]`);
      if (ea.url) d.push(`→ ${ea.url}`);
      if (ea.source) d.push(`(${ea.source})`);
      return d.join(' ');
    });
    parts.push(`External Linked Assets (${allExternal.length}): ${extDetails.join('; ')}`);
  }

  return parts.join('\n');
}

/**
 * Fetch text content from external linked assets (Dropbox, GlobalLink, etc.)
 * Uses proxy-download to safely fetch external URLs, then extracts text
 * Capped at 3 documents, 10KB each to stay within memory limits
 */
async function fetchExternalAssetContent(
  supabaseUrl: string,
  serviceKey: string,
  textContext: any
): Promise<string | null> {
  // Collect all external URLs from context
  const allExternal = [
    ...(Array.isArray(textContext.external_assets) ? textContext.external_assets : []),
    ...(Array.isArray(textContext.external_templates) ? textContext.external_templates : []),
    ...(Array.isArray(textContext.external_presentations) ? textContext.external_presentations : []),
  ].filter((e: any) => e?.url && typeof e.url === 'string');

  if (allExternal.length === 0) return null;

  // Limit to 3 docs to stay within memory/time constraints
  const toFetch = allExternal.slice(0, 3);
  const results: string[] = [];

  for (const asset of toFetch) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${supabaseUrl}/functions/v1/proxy-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey,
        },
        body: JSON.stringify({ url: asset.url }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[worker] External fetch failed for ${asset.title}: ${response.status}`);
        results.push(`[${asset.title}] (${asset.source || 'external'}) — URL: ${asset.url} — Could not fetch content`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/pdf')) {
        // Extract text from PDF bytes
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const pdfText = extractTextFromPdfBytes(bytes);
        const trimmed = pdfText.slice(0, 10000);
        if (trimmed.length > 50) {
          results.push(`[${asset.title}] (${asset.source || 'external'}):\n${trimmed}`);
        } else {
          results.push(`[${asset.title}] (${asset.source || 'external'}) — PDF with limited extractable text, ${bytes.length} bytes`);
        }
      } else if (contentType.includes('text/') || contentType.includes('application/json') || contentType.includes('markdown')) {
        const text = await response.text();
        const trimmed = text.slice(0, 10000);
        results.push(`[${asset.title}] (${asset.source || 'external'}):\n${trimmed}`);
      } else {
        // Binary non-PDF — just note the asset exists
        results.push(`[${asset.title}] (${asset.source || 'external'}) — Binary asset: ${contentType}, URL: ${asset.url}`);
      }
    } catch (err) {
      console.warn(`[worker] External asset fetch error for ${asset.title}:`, err);
      results.push(`[${asset.title}] (${asset.source || 'external'}) — URL: ${asset.url} — Fetch timed out or failed`);
    }
  }

  if (results.length === 0) return null;

  const totalExternal = allExternal.length;
  const header = totalExternal > toFetch.length
    ? `Fetched ${toFetch.length} of ${totalExternal} external documents:`
    : `Fetched ${results.length} external document(s):`;

  return `${header}\n\n${results.join('\n\n')}`;
}

/**
 * Simple PDF text extraction from raw bytes
 * Looks for text streams between BT/ET markers
 */
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);
  
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];
    const textRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch;
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const extracted = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (extracted.trim()) text.push(extracted);
    }
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const parts2 = tjMatch[1].match(/\(([^)]*)\)/g);
      if (parts2) {
        const combined = parts2.map(p => p.slice(1, -1)).join("");
        if (combined.trim()) text.push(combined);
      }
    }
  }
  
  return text.join(" ").replace(/\s+/g, " ").trim();
}
