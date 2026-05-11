/**
 * Bias Awareness Scan Edge Function
 * Analyzes brand/product/event content across 4 dimensions:
 * 1. Language & Messaging
 * 2. Visual Representation
 * 3. Accessibility (WCAG 2.2)
 * 4. AI Governance
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { scanTextForInclusiveLanguage, buildDeepIntelligencePromptContext, WCAG_22_NEW_CRITERIA, WFA_12_AREAS, PIE_TOUCHPOINTS, PIE_RECRUITMENT_DIMENSIONS, IMAGERY_STOP_GO, EVENT_ACCESSIBILITY_CHECKLIST, AI_POLICY_AS_CODE, PERSONA_SPECTRUM_DIMENSIONS, OKLCH_COLOR_STANDARD, COLOR_PSYCHOLOGY_DBA, CULTURAL_COLOR_GEOMETRY, COLOR_TRENDS_2026, OPTICAL_GEOMETRY_INTELLIGENCE } from "../_shared/inclusive-language-patterns.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScanRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  entity_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: ScanRequest = await req.json();
    const { organization_id, entity_type, entity_id, entity_name } = body;

    if (!organization_id || !entity_type || !entity_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending scan record
    const { data: scan, error: scanError } = await supabase
      .from('bias_awareness_scans')
      .insert({
        organization_id,
        entity_id,
        entity_type,
        entity_name,
        status: 'processing',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (scanError) {
      console.error('Failed to create scan record:', scanError);
      throw new Error('Failed to create scan record');
    }

    // Get entity context via RPC
    const tableMap = { brand: 'brands', product: 'products', event: 'events' };
    const { data: entityContext } = await supabase.rpc('get_entity_text_context', {
      p_table: tableMap[entity_type],
      p_id: entity_id
    });

    // Get brand intelligence for additional context
    const { data: intelligence } = await supabase
      .from('brand_intelligence')
      .select('brand_summary, brand_voice_profile, cultural_insights, target_audience')
      .eq('entity_id', entity_id)
      .eq('entity_type', entity_type)
      .maybeSingle();

    // Fetch prior bias scan for longitudinal comparison
    let priorScanContext = '';
    try {
      const { data: priorScans } = await supabase
        .from('bias_awareness_scans')
        .select('inclusion_score, language_score, visual_score, accessibility_score, ai_governance_score, completed_at')
        .eq('entity_id', entity_id)
        .eq('entity_type', entity_type)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);
      
      if (priorScans && priorScans.length > 0) {
        const ps = priorScans[0];
        const parts: string[] = [];
        parts.push(`Prior scan date: ${ps.completed_at}`);
        if (ps.inclusion_score != null) parts.push(`Prior inclusion: ${ps.inclusion_score}`);
        if (ps.language_score != null) parts.push(`Prior language: ${ps.language_score}`);
        if (ps.visual_score != null) parts.push(`Prior visual: ${ps.visual_score}`);
        if (ps.accessibility_score != null) parts.push(`Prior accessibility: ${ps.accessibility_score}`);
        if (ps.ai_governance_score != null) parts.push(`Prior AI governance: ${ps.ai_governance_score}`);
        priorScanContext = `\n\nPRIOR BIAS SCAN RESULTS:\n${parts.join('\n')}\nCompare your new scores against these prior results. Note improvements, regressions, and persistent issues.`;
      }
    } catch (e) {
      console.warn('[bias-scan] Prior scan fetch failed (non-critical):', e);
    }

    // Run automated regex scan on entity text context
    const entityText = typeof entityContext === 'string' ? entityContext : JSON.stringify(entityContext || {});
    const regexFindings = scanTextForInclusiveLanguage(entityText);
    const regexSummary = regexFindings.length > 0
      ? `\n\nAUTOMATED REGEX PRE-SCAN (Tier 1 Inclusive Language):\nFound ${regexFindings.length} flagged term(s):\n${regexFindings.slice(0, 20).map(f => `- "${f.matched}" [${f.category}/${f.severity}] → Replace with: ${f.replacements.join(' / ')}`).join('\n')}`
      : '\n\nAUTOMATED REGEX PRE-SCAN: No Tier 1 problematic terms detected.';

    // Build context string with deep intelligence
    const deepIntelCtx = buildDeepIntelligencePromptContext();
    const contextStr = JSON.stringify({
      entity: entityContext || { name: entity_name },
      intelligence: intelligence ? {
        summary: intelligence.brand_summary,
        voice: intelligence.brand_voice_profile,
        cultural: intelligence.cultural_insights,
        audience: intelligence.target_audience
      } : null
    }) + regexSummary + priorScanContext + '\n\n' + deepIntelCtx;

    // Process in background
    // @ts-ignore - EdgeRuntime available in Supabase
    EdgeRuntime.waitUntil((async () => {
      try {
        const wcagContext = WCAG_22_NEW_CRITERIA.map(c => `${c.id} ${c.name} [${c.level}]: ${c.objective}`).join('\n');
        const wfaContext = WFA_12_AREAS.map(a => `Stage ${a.stage} ${a.name}: ${a.audit_question}`).join('\n');
        const pieContext = PIE_TOUCHPOINTS.map(t => `${t.name}: ${t.audit_question}`).join('\n');
        const recruitmentContext = PIE_RECRUITMENT_DIMENSIONS.map(d => `${d.label}: ${d.description} (e.g. ${d.examples.join(', ')})`).join('\n');
        const imageryContext = `STOP: ${IMAGERY_STOP_GO.stop_signals.join('; ')}\nGO: ${IMAGERY_STOP_GO.go_signals.join('; ')}`;
        const eventContext = EVENT_ACCESSIBILITY_CHECKLIST.map(e => `${e.category}: ${e.specification}`).join('\n');
        const personaContext = PERSONA_SPECTRUM_DIMENSIONS.map(p => `${p.dimension}: Permanent(${p.permanent}), Temporary(${p.temporary}), Situational(${p.situational})`).join('\n');
        const policyContext = `Disparate Impact: ${AI_POLICY_AS_CODE.disparate_impact_rule.description}\n${AI_POLICY_AS_CODE.governance_pillars.map(p => `${p.name}: ${p.description}`).join('\n')}`;
        const oklchContext = `${OKLCH_COLOR_STANDARD.description}\nContrast: Primary text ${OKLCH_COLOR_STANDARD.contrast_requirements.primary_text}, Focus ${OKLCH_COLOR_STANDARD.contrast_requirements.focus_indicators}, UI components ${OKLCH_COLOR_STANDARD.contrast_requirements.ui_components}.\n${OKLCH_COLOR_STANDARD.key_principles.join('\n')}`;
        const colorPsychContext = `${COLOR_PSYCHOLOGY_DBA.brand_recognition_stat} ${COLOR_PSYCHOLOGY_DBA.consumer_assessment} Colorblind: ${COLOR_PSYCHOLOGY_DBA.colorblind_prevalence}\nHelmholtz-Kohlrausch: ${COLOR_PSYCHOLOGY_DBA.helmholtz_kohlrausch.description}\nPurple fixation: ${COLOR_PSYCHOLOGY_DBA.purple_fixation.description}\nDBA Principles: ${COLOR_PSYCHOLOGY_DBA.dba_principles.map(p => `${p.name}: ${p.description}`).join(' | ')}\nSACM: ${COLOR_PSYCHOLOGY_DBA.sentiment_color_mapping.mappings.map(m => `${m.sentiment} → ${m.color_family}`).join(', ')}`;
        const culturalColorContext = CULTURAL_COLOR_GEOMETRY.mappings.map(m => `${m.color}: W(${m.western}), E(${m.eastern}), AF(${m.african}), ME(${m.middle_east})`).join('\n');
        const colorTrendsContext = COLOR_TRENDS_2026.trending_palettes.map(t => `${t.name}: ${t.meaning}`).join('\n') + `\nDark Mode 2.0: ${COLOR_TRENDS_2026.dark_mode_2_0.description}`;

        const systemPrompt = `You are an advanced Bias Awareness & Inclusion Auditor for brand ecosystems (2026 Foundations of Inclusive Architecture standard). You have access to automated Tier 1 regex pre-scan results AND comprehensive Deep Intelligence modules. Analyze the provided entity data across 4 core dimensions PLUS 5 advanced governance modules. Incorporate the regex pre-scan findings directly into your language score. Apply EAA/Section 508 regulatory requirements to the accessibility score. Return a single structured JSON assessment.

CORE DIMENSIONS (0-100 each):

1. LANGUAGE & MESSAGING (language_score):
- Asset-based vs deficit-focused framing
- Non-inclusive terminology detection (include gender-biased language: fireman→firefighter, chairman→chairperson, guys→folks)
- Plain language accessibility, cultural sensitivity
- Person-first vs identity-first appropriateness

2. VISUAL REPRESENTATION (visual_score):
- Diversity signals in imagery
- Stereotyping risk detection using Stop/Go Imagery Framework:
${imageryContext}
- Optical Geometry Assessment: Evaluate corner radius consistency. ${OPTICAL_GEOMETRY_INTELLIGENCE.description} Rules: ${OPTICAL_GEOMETRY_INTELLIGENCE.rules.map(r => r.name + ': ' + r.description).join('. ')}. Mood tiers: Technical=${OPTICAL_GEOMETRY_INTELLIGENCE.mood_mapping.sharp.radius}, Modern=${OPTICAL_GEOMETRY_INTELLIGENCE.mood_mapping.modern.radius}, Organic=${OPTICAL_GEOMETRY_INTELLIGENCE.mood_mapping.full_round.radius}.
- Persona spectrum coverage across 5 dimensions:
${personaContext}

PERSONA COVERAGE EVALUATION RULES (critical — do NOT default all to false):
Mark a persona dimension as TRUE when the brand content demonstrates ANY accommodation, awareness, or design consideration for that audience — even implied:
- Mobility: responsive/flexible layouts, touch-friendly targets, physical event accommodations, mentions of adaptive tools or ergonomic design
- Vision: alt text practices, high contrast colors, screen reader compatibility, large text options, visual hierarchy, color-blind safe palettes, dark mode support
- Hearing: captions/subtitles on video, visual notifications, text-based communication, transcripts
- Speech: text-based input/chat options, non-verbal interaction paths, written alternatives to voice
- Cognitive: plain language, clear navigation, consistent layouts, minimal cognitive load, progressive disclosure, error prevention, readable fonts
For each level: permanent=designed for long-term users, temporary=accommodates short-term impairments, situational=helps users in challenging contexts (bright sun, noisy room, one-handed use).
If a brand has ANY content mentioning accessibility, plain language, responsive design, or multi-format content, at least some dimensions should be TRUE. A 0% score should only occur for brands with zero accessibility awareness.

3. ACCESSIBILITY (accessibility_score):
- WCAG 2.2 compliance — evaluate against ALL 9 new success criteria:
${wcagContext}
- Target sizes (24x24px min per 2.5.8), accessible authentication (3.3.8), redundant entry prevention (3.3.7)
- Multi-sensory design (haptic hierarchy, synchronized timing, accessible affordances)
- Event accessibility standards:
${eventContext}
- EAA enforcement (€3M penalties) + U.S. Section 508 (WCAG 2.1 AA by April 2026)

4. AI GOVERNANCE (ai_governance_score):
- AI content oversight, bias detection in automated workflows
- Human-in-the-loop processes, prompt inclusivity
- Policy-as-Code governance:
${policyContext}

ADVANCED MODULES:

MODULE 1 - PI&E "Who Else?" Framework (Annie Jean-Baptiste/Google):
${pieContext}
Score each touchpoint 0-100. Apply the "Curb-Cut Effect" principle. Address intersectionality.

For EACH touchpoint, generate a "recruitment_panel" — a list of 3-5 diverse user personas that should be recruited for testing/validation at that stage. Each persona must include:
- "persona_name": A descriptive name (e.g., "Low-vision retiree on shared tablet")
- "dimension": Which PI&E recruitment dimension they represent (from: ${PIE_RECRUITMENT_DIMENSIONS.map(d => d.id).join(', ')})
- "needs": What specific needs this persona brings to testing
- "curb_cut_benefit": How designing for this persona benefits ALL users
- "recruitment_criteria": Practical screening criteria for recruiting this person

RECRUITMENT DIMENSIONS:
${recruitmentContext}

MODULE 2 - WFA 12 Key Areas Bias Litmus Test (Color-Linked):
${wfaContext}
Commercial impact: inclusive advertising linked to +3.46% short-term and +16.26% long-term sales.
Score key areas 0-100 with specific findings.

MODULE 3 - Policy-as-Code Disparate Impact:
Evaluate content/AI pipelines against the U.S. 80% rule (disparate impact ratio 0.80-1.25). Flag any areas where content skews beyond thresholds. Include Sentiment-to-Color cross-check: verify color choices match emotional valence (e.g., high-saturation red for urgency, not calming wellness). Assess data_journey_traceability, bias_detection_automation, threshold_monitoring readiness.

MODULE 4 - Inclusive Imagery Stop/Go Framework:
Score imagery_inclusion 0-100 based on presence of GO signals and absence of STOP signals.

MODULE 5 - 2026 Master Inclusion Checklist:
Evaluate against key areas: linguistic (CamelCase hashtags for screen readers), technical (no puzzle-based auth per WCAG 3.3.8, 24x24px targets per 2.5.8), physical (32in doors, <5lbs force), communication (roving microphones for Q&A, captions on all videos, speakers describe visuals), digital (WCAG 2.2 AA event apps), color (high-contrast floor indicators, no pinch points from high-saturation branding, sans-serif min 24pt signage). Report completed_count out of applicable_count.

MODULE 6 - Color Accessibility & OKLCH Standard:
${oklchContext}
Evaluate entity's color system for: OKLCH adoption readiness, contrast compliance (7:1 primary text, 3:1 focus/UI), Dark Mode 2.0 (no pure black), colorblind-safe palettes (1 in 12 men affected). Score color_accessibility 0-100.

MODULE 7 - Color Psychology & Distinctive Brand Assets (DBA):
${colorPsychContext}
Evaluate brand colors for: DBA uniqueness/fame, Helmholtz-Kohlrausch awareness, tonal group consistency (Karen Haller Seasons), sentiment-color alignment. Score color_strategy 0-100.

MODULE 8 - Cultural Color Geometry:
${culturalColorContext}
Evaluate color choices against target markets for cultural appropriateness. Flag conflicts (e.g., red for joy vs mourning depending on market). Score cultural_color_readiness 0-100.

MODULE 9 - Sentiment Analysis & Computational Color Modeling (SACM):
SACM is a systematic tool for detecting bias in insight generation, creative development, and research by mapping text sentiment to color palettes.
SACM Reference Mappings: ${COLOR_PSYCHOLOGY_DBA.sentiment_color_mapping.mappings.map((m: any) => m.sentiment + ' → ' + m.color_family).join(', ')}

Apply SACM analysis to:
1. INSIGHT GENERATION BIAS: Analyze whether research insights, market data presentations, and strategic recommendations use color coding that matches their sentiment (e.g., positive findings in cyan/teal, risks in magenta/red). Flag misalignments that could subtly bias decision-making.
2. CREATIVE DEVELOPMENT: Evaluate whether brand's creative assets (ads, presentations, reports) align color choices with intended emotional messaging. Detect where color-sentiment mismatches could create unintended bias or misleading emotional cues.
3. CROSS-CHANNEL CONSISTENCY: Assess whether the brand maintains consistent sentiment-to-color mapping across digital, print, environmental, and social channels. Inconsistency creates cognitive dissonance.
4. BRAND PALETTE PROFILING: Map the entity's entire color palette to sentiment categories. Identify if the palette is skewed toward certain sentiments (e.g., overly aggressive, overly passive) relative to brand positioning.
5. BIAS DETECTION FLAGS: Specifically flag instances where:
   - Calming wellness content uses high-saturation red (urgency mismatch)
   - Trust-building content avoids cyan/teal family (missed alignment)
   - Negative messaging hides behind warm/friendly colors (deceptive framing)
   - Professional content uses overly playful color schemes (credibility risk)
Score sacm_overall 0-100. Include specific mappings_analysis with detected sentiment, expected vs actual colors, and bias flags.

MODULE 10 - Curb-Cut Effect Analysis:
The Curb-Cut Effect: designing for specific accessibility needs creates universal benefits (e.g., curb cuts designed for wheelchairs benefit everyone with strollers, luggage, bikes).
Analyze the entity across these dimensions:

1. PLAIN LANGUAGE ASSESSMENT:
- Evaluate ALL text content for Flesch-Kincaid reading level (aim for Grade 8 or below for universal comprehension)
- Detect jargon density, sentence complexity, passive voice overuse
- Score plain_language_score 0-100 (100 = perfectly clear, universally accessible prose)
- Provide flesch_kincaid_grade (estimated grade level of the content)
- List specific jargon_terms found and their plain-language alternatives

2. MULTI-MODAL CONTENT DELIVERY:
- Assess whether key messages are available in multiple formats (text, visual, audio, video, interactive)
- For EACH major content section, report which modalities are present vs missing
- Score multi_modal_coverage 0-100
- List content_format_gaps: sections that only have one modality

3. ALT-TEXT QUALITY:
- Evaluate all image references for: presence of alt text, descriptive quality, functional accuracy
- Score alt_text_quality 0-100 (based on coverage × quality)
- Report images_total, images_with_alt, images_with_descriptive_alt
- Flag images with generic alt text (e.g., "image", "photo", "logo") as needing improvement

4. UNIVERSAL BENEFIT MAPPING:
- For EACH accessibility accommodation found, map the "curb-cut benefit" — how it helps ALL users
- Examples: plain language → helps non-native speakers, busy execs, mobile readers
  captions → helps in noisy environments, silent browsing, language learners
  high contrast → helps in bright sunlight, aging eyes, tired users
- Generate curb_cut_mappings: array of {accommodation, target_audience, universal_benefits: string[]}

5. CONTENT READINESS INDICATORS:
- For each content section, report a readiness_level: "accessible" | "partially_accessible" | "not_accessible"
- Assess format_diversity: how many delivery formats are available per section

RESPONSE FORMAT (strict JSON):
{
  "inclusion_score": <0-100 weighted average>,
  "language_score": <0-100>,
  "visual_score": <0-100>,
  "accessibility_score": <0-100>,
  "ai_governance_score": <0-100>,
  "language_analysis": {
    "strengths": ["..."],
    "issues": ["..."],
    "framing_assessment": "asset-based|mixed|deficit-focused"
  },
  "visual_analysis": {
    "diversity_signals": ["..."],
    "gaps": ["..."],
    "stereotyping_risks": ["..."]
  },
  "accessibility_analysis": {
    "wcag_strengths": ["..."],
    "wcag_gaps": ["..."],
    "multi_sensory_coverage": "strong|moderate|weak"
  },
  "ai_governance_analysis": {
    "safeguards_detected": ["..."],
    "risks": ["..."],
    "policy_as_code_readiness": "high|medium|low"
  },
  "persona_coverage": {
    "mobility": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "vision": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "hearing": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "speech": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "cognitive": {"permanent": <bool>, "temporary": <bool>, "situational": <bool>},
    "coverage_percentage": <0-100>
  },
   "pie_module": {
     "overall_score": <0-100>,
     "touchpoints": {
       "ideation": {"score": <0-100>, "missing_voices": ["..."], "recommendation": "...", "recruitment_panel": [{"persona_name": "...", "dimension": "...", "needs": "...", "curb_cut_benefit": "...", "recruitment_criteria": "..."}]},
       "research": {"score": <0-100>, "generalization_risks": ["..."], "recommendation": "...", "recruitment_panel": [...]},
       "design": {"score": <0-100>, "curb_cut_opportunities": ["..."], "recommendation": "...", "recruitment_panel": [...]},
       "testing": {"score": <0-100>, "diversity_gaps": ["..."], "recommendation": "...", "recruitment_panel": [...]},
       "marketing": {"score": <0-100>, "intersectionality_issues": ["..."], "recommendation": "...", "recruitment_panel": [...]}
     },
     "aggregate_recruitment_summary": {
       "total_personas_recommended": <number>,
       "dimensions_covered": ["..."],
       "dimensions_missing": ["..."],
       "recruitment_priority": "immediate|short_term|long_term"
     }
   },
  "wfa_module": {
    "overall_score": <0-100>,
    "areas": {
      "business_challenge": {"score": <0-100>, "findings": ["..."]},
      "insight_generation": {"score": <0-100>, "findings": ["..."]},
      "creative_briefing": {"score": <0-100>, "findings": ["..."]},
      "media_placement": {"score": <0-100>, "findings": ["..."]}
    }
  },
  "policy_as_code_module": {
    "overall_score": <0-100>,
    "disparate_impact_flags": [{"area": "...", "ratio": <number>, "severity": "critical|warning|ok", "recommendation": "..."}],
    "data_journey_traceability": "high|medium|low",
    "bias_detection_automation": "high|medium|low",
    "threshold_monitoring": "active|partial|absent"
  },
  "inclusive_imagery_module": {
    "imagery_inclusion_score": <0-100>,
    "stop_signals_detected": ["..."],
    "go_signals_present": ["..."],
    "recommendations": ["..."]
  },
  "inclusion_checklist_module": {
    "completed_count": <number>,
    "applicable_count": <number>,
    "score": <0-100>,
    "categories": {
      "linguistic": {"met": ["..."], "unmet": ["..."]},
      "technical": {"met": ["..."], "unmet": ["..."]},
      "physical": {"met": ["..."], "unmet": ["..."]},
      "communication": {"met": ["..."], "unmet": ["..."]},
      "color": {"met": ["..."], "unmet": ["..."]}
    }
  },
  "color_accessibility_module": {
    "overall_score": <0-100>,
    "oklch_readiness": "adopted|partial|not_adopted",
    "contrast_compliance": {"primary_text": "pass|fail", "focus_indicators": "pass|fail", "ui_components": "pass|fail"},
    "dark_mode_compliance": "compliant|partial|non_compliant",
    "colorblind_safe": <bool>,
    "issues": ["..."],
    "recommendations": ["..."]
  },
   "sacm_module": {
    "overall_score": <0-100>,
    "sentiment_color_alignment": <0-100>,
    "mappings_analysis": [
      {"content_sentiment": "detected sentiment", "expected_color_family": "from SACM model", "actual_brand_color": "what brand uses", "alignment": "aligned|partial|misaligned", "recommendation": "..."}
    ],
    "emotional_valence_score": <0-100>,
    "color_emotion_coherence": "strong|moderate|weak|conflicting",
    "cross_channel_consistency": <0-100>,
    "sacm_bias_flags": [
      {"area": "...", "detected_sentiment": "...", "color_used": "...", "expected_color": "...", "bias_risk": "high|medium|low", "description": "..."}
    ],
    "brand_palette_sentiment_profile": {
      "dominant_sentiment": "...",
      "sentiment_distribution": {"positive_trust": <0-100>, "negative_urgency": <0-100>, "neutral_professional": <0-100>, "joy_energy": <0-100>, "calm_wellness": <0-100>}
    },
    "recommendations": ["..."]
  },
   "color_strategy_module": {
    "overall_score": <0-100>,
    "dba_uniqueness": <0-100>,
    "dba_fame": <0-100>,
    "tonal_consistency": "consistent|mixed|jarring",
    "sentiment_alignment": "aligned|partial|misaligned",
    "helmholtz_awareness": <bool>,
    "cultural_conflicts": [{"color": "...", "market": "...", "conflict": "...", "severity": "critical|warning"}],
    "recommendations": ["..."]
  },
  "wcag_compliance": {
    "overall_level": "AAA|AA|A|none",
    "criteria": [
      {"id": "2.4.11", "name": "Focus Not Obscured (Minimum)", "level": "AA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "2.4.12", "name": "Focus Not Obscured (Enhanced)", "level": "AAA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "2.4.13", "name": "Focus Appearance", "level": "AAA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "2.5.7", "name": "Dragging Movements", "level": "AA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "2.5.8", "name": "Target Size (Minimum)", "level": "AA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "3.2.6", "name": "Consistent Help", "level": "A", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "3.3.7", "name": "Redundant Entry", "level": "A", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "3.3.8", "name": "Accessible Authentication", "level": "AA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."},
      {"id": "3.3.9", "name": "Accessible Authentication (Enhanced)", "level": "AAA", "status": "pass|partial|fail|not_applicable", "evidence": "...", "remediation": "..."}
    ],
    "pass_count": <number>,
    "fail_count": <number>,
    "partial_count": <number>,
    "eaa_readiness": "compliant|partial|non_compliant",
    "section_508_readiness": "compliant|partial|non_compliant",
    "priority_remediations": ["..."]
  },
  "curb_cut_module": {
    "overall_score": <0-100>,
    "plain_language_score": <0-100>,
    "flesch_kincaid_grade": <number>,
    "jargon_terms": [{"term": "...", "plain_alternative": "...", "frequency": <number>}],
    "multi_modal_coverage": <0-100>,
    "content_format_gaps": [{"section": "...", "available_formats": ["text"|"visual"|"audio"|"video"|"interactive"], "missing_formats": ["..."]}],
    "alt_text_quality": <0-100>,
    "alt_text_stats": {"images_total": <number>, "images_with_alt": <number>, "images_with_descriptive_alt": <number>, "generic_alt_flags": ["..."]},
    "curb_cut_mappings": [{"accommodation": "...", "target_audience": "...", "universal_benefits": ["..."]}],
    "content_readiness": [{"section": "...", "readiness_level": "accessible|partially_accessible|not_accessible", "formats_available": <number>, "formats_possible": <number>}],
    "recommendations": ["..."]
  },
  "findings": [
    {"dimension": "language|visual|accessibility|ai_governance|pie|wfa|policy|imagery|checklist|color_accessibility|color_strategy", "severity": "critical|high|medium|low", "title": "...", "description": "...", "recommendation": "..."}
  ],
  "recommendations": [
    {"priority": "immediate|short_term|long_term", "dimension": "...", "action": "...", "impact": "high|medium|low"}
  ]
}`;

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
              { role: "user", content: `Analyze this entity for bias awareness, inclusion, and all 5 advanced modules:\n\n${contextStr}` }
            ],
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('AI gateway error:', response.status, errText);
          
          await supabase.from('bias_awareness_scans').update({
            status: 'failed',
            error_message: response.status === 429 ? 'Rate limit exceeded' : response.status === 402 ? 'AI credits exhausted' : `AI error: ${response.status}`,
            updated_at: new Date().toISOString(),
          }).eq('id', scan.id);
          return;
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr);
          result = null;
        }

        if (!result) {
          await supabase.from('bias_awareness_scans').update({
            status: 'failed',
            error_message: 'Failed to parse AI response',
            updated_at: new Date().toISOString(),
          }).eq('id', scan.id);
          return;
        }

        // Post-process persona coverage: infer from scores & context when AI defaults all to false
        const pc = result.persona_coverage || {};
        const allFalse = ['mobility', 'vision', 'hearing', 'speech', 'cognitive'].every(
          d => !pc[d]?.permanent && !pc[d]?.temporary && !pc[d]?.situational
        );
        if (allFalse && result.inclusion_score > 0) {
          const textLower = entityText.toLowerCase();
          const accScore = result.accessibility_score || 0;
          const langScore = result.language_score || 0;
          const visScore = result.visual_score || 0;

          // Vision: alt text, contrast, color accessibility, dark mode, screen reader
          const hasVisionSignals = accScore >= 40 || visScore >= 50 ||
            /alt[\s-]?text|contrast|color.?blind|screen.?reader|dark.?mode|wcag|a11y|aria|high.?contrast/i.test(textLower);
          if (hasVisionSignals) {
            pc.vision = { permanent: accScore >= 60, temporary: accScore >= 40, situational: true };
          }

          // Cognitive: plain language, clear navigation, readable
          const hasCogSignals = langScore >= 40 ||
            /plain.?language|clear|simple|readable|easy.?to|intuitive|user.?friendly|cognitive|consistent/i.test(textLower);
          if (hasCogSignals) {
            pc.cognitive = { permanent: langScore >= 60, temporary: langScore >= 40, situational: true };
          }

          // Mobility: responsive, touch, adaptive, mobile
          const hasMobilitySignals = accScore >= 40 ||
            /responsive|mobile|touch|adaptive|flexible|ergonomic|assistive/i.test(textLower);
          if (hasMobilitySignals) {
            pc.mobility = { permanent: accScore >= 70, temporary: accScore >= 50, situational: true };
          }

          // Hearing: captions, transcripts, visual alerts
          const hasHearingSignals =
            /caption|subtitle|transcript|visual.?notif|deaf|hearing|sign.?language|closed.?caption/i.test(textLower);
          if (hasHearingSignals) {
            pc.hearing = { permanent: true, temporary: true, situational: true };
          }

          // Speech: text chat, non-verbal, written
          const hasSpeechSignals =
            /chat|text.?based|non.?verbal|written|messaging|email|contact.?form/i.test(textLower);
          if (hasSpeechSignals) {
            pc.speech = { permanent: hasSpeechSignals, temporary: true, situational: true };
          }

          // Recalculate coverage percentage
          let covered = 0;
          let total = 0;
          for (const dim of ['mobility', 'vision', 'hearing', 'speech', 'cognitive']) {
            for (const level of ['permanent', 'temporary', 'situational']) {
              total++;
              if (pc[dim]?.[level]) covered++;
            }
          }
          pc.coverage_percentage = total > 0 ? Math.round((covered / total) * 100) : 0;
          result.persona_coverage = pc;
        }

        // Update scan record with results including advanced modules
        await supabase.from('bias_awareness_scans').update({
          status: 'completed',
          inclusion_score: result.inclusion_score || 0,
          language_score: result.language_score || 0,
          visual_score: result.visual_score || 0,
          accessibility_score: result.accessibility_score || 0,
          ai_governance_score: result.ai_governance_score || 0,
          language_analysis: result.language_analysis || {},
          visual_analysis: result.visual_analysis || {},
          accessibility_analysis: result.accessibility_analysis || {},
          ai_governance_analysis: result.ai_governance_analysis || {},
          persona_coverage: result.persona_coverage || {},
          findings: result.findings || [],
          recommendations: result.recommendations || [],
          pie_module: result.pie_module || null,
          wfa_module: result.wfa_module || null,
          policy_as_code_module: result.policy_as_code_module || null,
          inclusive_imagery_module: result.inclusive_imagery_module || null,
          inclusion_checklist_module: result.inclusion_checklist_module || null,
          color_accessibility_module: result.color_accessibility_module || null,
          color_strategy_module: result.color_strategy_module || null,
          sacm_module: result.sacm_module || null,
          curb_cut_module: result.curb_cut_module || null,
          wcag_compliance: result.wcag_compliance || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', scan.id);

        // Update brand intelligence with bias profile
        const biasProfile = {
          last_scan_id: scan.id,
          last_scan_at: new Date().toISOString(),
          inclusion_score: result.inclusion_score,
          dimension_scores: {
            language: result.language_score,
            visual: result.visual_score,
            accessibility: result.accessibility_score,
            ai_governance: result.ai_governance_score,
          },
          persona_coverage: result.persona_coverage,
          top_findings: (result.findings || []).slice(0, 5),
        };

        const { data: existingIntel } = await supabase
          .from('brand_intelligence')
          .select('id')
          .eq('entity_id', entity_id)
          .eq('entity_type', entity_type)
          .maybeSingle();

        if (existingIntel) {
          await supabase.from('brand_intelligence').update({
            bias_awareness_profile: biasProfile,
            updated_at: new Date().toISOString(),
          }).eq('id', existingIntel.id);
        }

        // Update oracle intelligence with aggregated bias insights
        const { data: existingOracle } = await supabase
          .from('oracle_intelligence')
          .select('id, bias_awareness_insights')
          .eq('organization_id', organization_id)
          .maybeSingle();

        if (existingOracle) {
          const existingInsights = (existingOracle.bias_awareness_insights as Record<string, unknown>) || {};
          const entityScores = (existingInsights.entity_scores as Record<string, unknown>) || {};
          
          const updatedEntityScores = {
            ...entityScores,
            [entity_id]: {
              entity_name,
              entity_type,
              inclusion_score: result.inclusion_score,
              dimensions: {
                language: result.language_score,
                visual: result.visual_score,
                accessibility: result.accessibility_score,
                ai_governance: result.ai_governance_score,
              },
              scanned_at: new Date().toISOString(),
            }
          };

          // Calculate org-wide average
          const scores = Object.values(updatedEntityScores) as Array<{ inclusion_score: number }>;
          const orgAvg = scores.reduce((sum, s) => sum + (s.inclusion_score || 0), 0) / scores.length;

          await supabase.from('oracle_intelligence').update({
            bias_awareness_insights: {
              org_inclusion_score: Math.round(orgAvg * 100) / 100,
              entity_scores: updatedEntityScores,
              entities_scanned: scores.length,
              last_updated: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          }).eq('id', existingOracle.id);
        }

        console.log(`[BiasAwareness] Scan completed for ${entity_name}: ${result.inclusion_score}/100`);

      } catch (err) {
        console.error('[BiasAwareness] Background processing error:', err);
        await supabase.from('bias_awareness_scans').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        }).eq('id', scan.id);
      }
    })());

    return new Response(
      JSON.stringify({ success: true, scan_id: scan.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BiasAwareness] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
