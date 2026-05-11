/**
 * DataForce AI Brand Assistant Edge Function
 * Multilingual AI chatbot that answers brand questions using guide data
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AssistantRequest {
  organization_id: string;
  entity_type?: 'brand' | 'product' | 'event';
  entity_id?: string;
  message: string;
  conversation_id?: string;
  language_code?: string;
  conversation_style?: 'direct' | 'suggestive' | 'educational' | 'creative';
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
    const DATAFORCE_API_KEY = Deno.env.get('DATAFORCE_API_KEY');

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
    const body: AssistantRequest = await req.json();
    const { 
      organization_id, 
      entity_type, 
      entity_id, 
      message, 
      conversation_id,
      language_code = 'en_US',
      conversation_style = 'direct'
    } = body;

    if (!organization_id || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify organization membership
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

    // Get or create conversation + load user persona + past conversation summaries in parallel
    let conversation;
    let userPersona: any = null;
    let pastConversationSummaries: string[] = [];

    const conversationPromise = conversation_id
      ? supabase.from('dataforce_assistant_conversations').select('*').eq('id', conversation_id).eq('user_id', user.id).single()
      : Promise.resolve({ data: null });

    const personaPromise = supabase
      .from('user_assistant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .maybeSingle();

    // Load last 5 past conversations for this user (excluding current) to give continuity
    const pastConvsPromise = supabase
      .from('dataforce_assistant_conversations')
      .select('id, messages, entity_type, entity_name, updated_at')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6);

    // Load institutional memory for this entity (or org-wide if no entity)
    const memoryQuery = supabase
      .from('assistant_memory')
      .select('summary, key_decisions, topics, entity_type, entity_id, created_at')
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (entity_id) {
      // Fetch both entity-specific and org-wide memory
    }

    const [convResult, personaResult, pastConvsResult, memoryResult] = await Promise.all([
      conversationPromise,
      personaPromise,
      pastConvsPromise,
      memoryQuery,
    ]);

    conversation = convResult.data;
    userPersona = personaResult.data;

    // Build past conversation summaries (skip current conversation)
    if (pastConvsResult.data?.length) {
      for (const pc of pastConvsResult.data) {
        if (conversation_id && pc.id === conversation_id) continue;
        const msgs = Array.isArray(pc.messages) ? pc.messages : [];
        if (msgs.length < 2) continue;
        // Extract last few user messages as topic summary
        const userMsgs = msgs.filter((m: any) => m.role === 'user').slice(-3);
        const topics = userMsgs.map((m: any) => (m.content || '').slice(0, 80)).join('; ');
        if (topics) {
          const entityLabel = pc.entity_name ? ` (${pc.entity_type}: ${pc.entity_name})` : '';
          pastConversationSummaries.push(`${new Date(pc.updated_at).toLocaleDateString()}${entityLabel}: ${topics}`);
        }
        if (pastConversationSummaries.length >= 5) break;
      }
    }

    if (!conversation) {
      const { data, error } = await supabase
        .from('dataforce_assistant_conversations')
        .insert({
          organization_id,
          entity_type,
          entity_id,
          user_id: user.id,
          language_code,
          messages: [],
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create conversation: ${error.message}`);
      conversation = data;
    }

    // Fetch entity data and Oracle context for rich assistant knowledge
    let entityContext = '';
    let entityName = 'your organization';
    
    // Build entity directory for navigation (all brands, products, events in org)
    let entityDirectory = '';
    // Store entity map for cross-entity lookups: name → { id, type, table }
    const entityMap: Map<string, { id: string; type: string; table: string; slug: string }> = new Map();
    let allBrands: any[] = [];
    let allProducts: any[] = [];
    let allEvents: any[] = [];
    try {
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, name, slug').eq('organization_id', organization_id).limit(100),
        supabase.from('products').select('id, name, slug, parent_brand_id').eq('organization_id', organization_id).limit(100),
        supabase.from('events').select('id, name, slug, parent_brand_id').eq('organization_id', organization_id).limit(100),
      ]);
      allBrands = brandsRes.data || [];
      allProducts = productsRes.data || [];
      allEvents = eventsRes.data || [];

      // Populate entity map
      for (const b of allBrands) entityMap.set(b.name.toLowerCase(), { id: b.id, type: 'brand', table: 'brands', slug: b.slug });
      for (const p of allProducts) entityMap.set(p.name.toLowerCase(), { id: p.id, type: 'product', table: 'products', slug: p.slug });
      for (const e of allEvents) entityMap.set(e.name.toLowerCase(), { id: e.id, type: 'event', table: 'events', slug: e.slug });

      const dirParts: string[] = [];
      if (allBrands.length) dirParts.push(`Brands: ${allBrands.map(b => `${b.name} [slug:${b.slug}]`).join(', ')}`);
      if (allProducts.length) {
        const parentProducts = allProducts.filter(p => !p.parent_brand_id);
        const subProducts = allProducts.filter(p => p.parent_brand_id);
        if (parentProducts.length) dirParts.push(`Products: ${parentProducts.map(p => `${p.name} [slug:${p.slug}]`).join(', ')}`);
        if (subProducts.length) {
          const grouped = subProducts.reduce((acc: Record<string, any[]>, p) => {
            const parent = allBrands.find(b => b.id === p.parent_brand_id) || allProducts.find(pp => pp.id === p.parent_brand_id);
            const parentName = parent?.name || 'Unknown';
            if (!acc[parentName]) acc[parentName] = [];
            acc[parentName].push(p);
            return acc;
          }, {});
          for (const [parentName, subs] of Object.entries(grouped)) {
            dirParts.push(`Sub-Products of ${parentName}: ${subs.map((p: any) => `${p.name} [slug:${p.slug}]`).join(', ')}`);
          }
        }
      }
      if (allEvents.length) {
        const parentEvents = allEvents.filter(e => !e.parent_brand_id);
        const subEvents = allEvents.filter(e => e.parent_brand_id);
        if (parentEvents.length) dirParts.push(`Events: ${parentEvents.map(e => `${e.name} [slug:${e.slug}]`).join(', ')}`);
        if (subEvents.length) {
          const grouped = subEvents.reduce((acc: Record<string, any[]>, e) => {
            const parent = allBrands.find(b => b.id === e.parent_brand_id) || allEvents.find(ee => ee.id === e.parent_brand_id);
            const parentName = parent?.name || 'Unknown';
            if (!acc[parentName]) acc[parentName] = [];
            acc[parentName].push(e);
            return acc;
          }, {});
          for (const [parentName, subs] of Object.entries(grouped)) {
            dirParts.push(`Sub-Events of ${parentName}: ${subs.map((e: any) => `${e.name} [slug:${e.slug}]`).join(', ')}`);
          }
        }
      }
      if (dirParts.length) entityDirectory = `\n\nAVAILABLE ENTITIES IN THIS ORGANIZATION:\n${dirParts.join('\n')}`;
    } catch (e) {
      console.warn('[dataforce-assistant] Entity directory fetch failed:', e);
    }

    // Cross-entity on-demand knowledge: detect entity names mentioned in user message
    let crossEntityContext = '';
    try {
      const messageLower = message.toLowerCase();
      const matchedEntities: { id: string; type: string; table: string; name: string }[] = [];
      for (const [name, info] of entityMap.entries()) {
        // Skip the active entity (already has deep context)
        if (entity_id && info.id === entity_id) continue;
        // Match entity names (at least 3 chars to avoid false positives)
        if (name.length >= 3 && messageLower.includes(name)) {
          matchedEntities.push({ ...info, name });
        }
      }
      // Fetch up to 3 cross-referenced entities to stay within memory limits
      if (matchedEntities.length > 0) {
        const toFetch = matchedEntities.slice(0, 3);
        const crossResults = await Promise.all(
          toFetch.map(ent => 
            supabase.from(ent.table).select('name, guide_data').eq('id', ent.id).single()
          )
        );
        const crossParts: string[] = [];
        for (let i = 0; i < crossResults.length; i++) {
          const { data: crossEntity } = crossResults[i];
          if (crossEntity?.guide_data) {
            crossParts.push(`\n--- ${crossEntity.name} (${toFetch[i].type}) ---\n${buildEntityContext(crossEntity.guide_data as Record<string, unknown>, crossEntity.name)}`);
          }
        }
        if (crossParts.length > 0) {
          crossEntityContext = `\n\nCROSS-REFERENCED ENTITY DATA (user asked about these):\n${crossParts.join('\n')}`;
        }
      }
    } catch (e) {
      console.warn('[dataforce-assistant] Cross-entity fetch failed (non-critical):', e);
    }
    
    // Fetch Oracle context in parallel with entity data
    let oracleContext = '';
    try {
      const [{ data: oracle }, { data: oracleKb }] = await Promise.all([
        supabase.from('oracle_intelligence')
          .select('org_summary, unified_voice_profile, strategic_recommendations, competitive_overview')
          .eq('organization_id', organization_id)
          .maybeSingle(),
        supabase.from('oracle_knowledge_base')
          .select('title, content')
          .eq('organization_id', organization_id)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(5),
      ]);
      const parts: string[] = [];
      if (oracle?.org_summary) parts.push(`Organization Strategy: ${oracle.org_summary}`);
      if (oracle?.unified_voice_profile?.primary_tone) parts.push(`Organization Voice: ${oracle.unified_voice_profile.primary_tone}`);
      if (oracle?.competitive_overview?.market_position) parts.push(`Market Position: ${oracle.competitive_overview.market_position}`);
      const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
      if (recs.length > 0) parts.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
      if (oracleKb?.length) parts.push(`Institutional Knowledge:\n${oracleKb.map((k: any) => `- ${k.title}: ${(k.content || '').slice(0, 200)}`).join('\n')}`);
      if (parts.length > 0) oracleContext = `\n\nORGANIZATION INTELLIGENCE (Oracle Brain):\n${parts.join('\n')}`;
    } catch (e) {
      console.warn('[dataforce-assistant] Oracle context failed (non-critical):', e);
    }
    
    if (entity_type && entity_id) {
      const tableName = entity_type === 'brand' ? 'brands' : entity_type === 'product' ? 'products' : 'events';
      const { data: entity } = await supabase
        .from(tableName)
        .select('name, guide_data')
        .eq('id', entity_id)
        .single();
      
      if (entity) {
        entityName = entity.name;
        const guideData = entity.guide_data || {};
        entityContext = buildEntityContext(guideData, entity.name);

        // Enrich with ALL available data sources in parallel
        try {
          const { fetchDocumentContext, fetchSocialMetricsContext } = await import('../_shared/extractFullBrandContext.ts');
          const [
            docResult,
            socialResult,
            { data: brandIntel },
            { data: compReports },
            { data: researchJobs },
            { data: complianceJobs },
            { data: regionalVariants },
            { data: biasScan },
            { data: healthSnapshots },
            { data: localizationJobs },
            { data: generatedAssets },
            { data: websiteReports },
          ] = await Promise.all([
            fetchDocumentContext(supabase, entity_id, entity_type, guideData as Record<string, unknown>, 1500),
            fetchSocialMetricsContext(supabase, entity_id, entity_type),
            supabase.from('brand_intelligence')
              .select('brand_summary, brand_voice_profile, competitive_advantages, cultural_insights, growth_recommendations, market_position, target_audience, regional_adaptations, localization_readiness_score, competitive_landscape')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .maybeSingle(),
            supabase.from('competitive_analysis_reports')
              .select('report_data, competitors, score, created_at')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1),
            supabase.from('brand_intelligence_jobs')
              .select('result, status, created_at')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(2),
            supabase.from('dataforce_compliance_jobs')
              .select('compliance_score, issues_found, issues_data, status, created_at')
              .eq('entity_id', entity_id)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(3),
            supabase.from('brand_regional_variants')
              .select('variant_code, variant_level, colors_override, typography_override, messaging_override, voice_override, imagery_override, cultural_adaptations, translation_status')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .limit(10),
            // NEW: Bias & Inclusion Scans
            supabase.from('bias_awareness_scans')
              .select('inclusion_score, language_score, visual_score, accessibility_score, ai_governance_score, findings, recommendations, persona_coverage, status, created_at')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .eq('status', 'completed')
              .order('created_at', { ascending: false })
              .limit(1),
            // NEW: Brand Health Snapshots
            supabase.from('health_snapshots')
              .select('snapshot_date, brand_health_score, compliance_score, bias_inclusion_score, website_score, competitive_score, score_deltas')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .order('snapshot_date', { ascending: false })
              .limit(6),
            // NEW: Localization Jobs
            supabase.from('localization_jobs')
              .select('source_language, target_language, word_count, translation_method, status, created_at')
              .eq('entity_id', entity_id)
              .order('created_at', { ascending: false })
              .limit(10),
            // NEW: Generated Assets
            supabase.from('brand_generated_assets')
              .select('name, category, asset_type, prompt_used, is_approved, created_at')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .order('created_at', { ascending: false })
              .limit(10),
            // NEW: Website Analysis Reports
            supabase.from('website_analysis_reports')
              .select('website_url, overall_score, grade, summary, created_at')
              .eq('entity_id', entity_id)
              .eq('entity_type', entity_type)
              .order('created_at', { ascending: false })
              .limit(3),
          ]);

          if (docResult.text) entityContext += `\n${docResult.text}`;
          if (socialResult.text) entityContext += `\n${socialResult.text}`;

          // Brand Intelligence Brain
          if (brandIntel) {
            const biParts: string[] = [];
            if (brandIntel.brand_summary) biParts.push(`AI Brand Summary: ${brandIntel.brand_summary}`);
            if (brandIntel.market_position) biParts.push(`Market Position: ${brandIntel.market_position}`);
            const voice = brandIntel.brand_voice_profile as any;
            if (voice?.primary_tone) biParts.push(`Brand Voice: ${voice.primary_tone}${voice.formality ? `, Formality: ${voice.formality}` : ''}`);
            const advantages = Array.isArray(brandIntel.competitive_advantages) ? brandIntel.competitive_advantages : [];
            if (advantages.length) biParts.push(`Competitive Advantages: ${advantages.slice(0, 5).map((a: any) => typeof a === 'string' ? a : a.advantage || a.title || '').filter(Boolean).join('; ')}`);
            const cultural = brandIntel.cultural_insights as any;
            if (cultural?.readiness_score != null) biParts.push(`Cultural Readiness Score: ${cultural.readiness_score}/100`);
            if (cultural?.key_considerations) biParts.push(`Cultural Considerations: ${Array.isArray(cultural.key_considerations) ? cultural.key_considerations.slice(0, 3).join('; ') : ''}`);
            const growth = Array.isArray(brandIntel.growth_recommendations) ? brandIntel.growth_recommendations : [];
            if (growth.length) biParts.push(`Growth Recommendations: ${growth.slice(0, 3).map((g: any) => typeof g === 'string' ? g : g.recommendation || g.title || '').filter(Boolean).join('; ')}`);
            const audience = brandIntel.target_audience as any;
            if (audience?.primary) biParts.push(`Target Audience: ${audience.primary}`);
            if (brandIntel.localization_readiness_score != null) biParts.push(`Localization Readiness: ${brandIntel.localization_readiness_score}/100`);
            const landscape = brandIntel.competitive_landscape as any;
            if (landscape?.positioning_summary) biParts.push(`Competitive Positioning: ${landscape.positioning_summary}`);
            if (landscape?.threats?.length) biParts.push(`Key Threats: ${landscape.threats.slice(0, 3).join('; ')}`);
            if (landscape?.opportunities?.length) biParts.push(`Opportunities: ${landscape.opportunities.slice(0, 3).join('; ')}`);
            const regional = Array.isArray(brandIntel.regional_adaptations) ? brandIntel.regional_adaptations : [];
            if (regional.length) biParts.push(`Regional Insights: ${regional.slice(0, 3).map((r: any) => `${r.region || r.market || ''}: ${r.insight || r.recommendation || ''}`).filter(Boolean).join('; ')}`);
            if (biParts.length > 0) entityContext += `\n\nBRAND INTELLIGENCE (AI Brain):\n${biParts.join('\n')}`;
          }

          // Latest Competitive Report
          if (compReports?.length) {
            const report = compReports[0];
            const rd = report.report_data as any;
            const crParts: string[] = [];
            if (report.score != null) crParts.push(`Overall Score: ${report.score}/100`);
            if (rd?.executive_summary) crParts.push(`Summary: ${String(rd.executive_summary).slice(0, 400)}`);
            if (rd?.swot) {
              const swot = rd.swot;
              if (swot.strengths?.length) crParts.push(`Strengths: ${swot.strengths.slice(0, 3).join('; ')}`);
              if (swot.weaknesses?.length) crParts.push(`Weaknesses: ${swot.weaknesses.slice(0, 3).join('; ')}`);
              if (swot.opportunities?.length) crParts.push(`Opportunities: ${swot.opportunities.slice(0, 3).join('; ')}`);
              if (swot.threats?.length) crParts.push(`Threats: ${swot.threats.slice(0, 3).join('; ')}`);
            }
            const competitors = Array.isArray(report.competitors) ? report.competitors : [];
            if (competitors.length) crParts.push(`Competitors Analyzed: ${competitors.slice(0, 5).map((c: any) => typeof c === 'string' ? c : c.name || '').filter(Boolean).join(', ')}`);
            if (crParts.length > 0) entityContext += `\n\nCOMPETITIVE INTELLIGENCE:\n${crParts.join('\n')}`;
          }

          // Research Briefings
          if (researchJobs?.length) {
            const rbParts: string[] = [];
            for (const job of researchJobs) {
              const result = job.result as any;
              if (result?.briefing) rbParts.push(`Research (${new Date(job.created_at).toLocaleDateString()}): ${String(result.briefing).slice(0, 300)}`);
              else if (result?.summary) rbParts.push(`Research: ${String(result.summary).slice(0, 300)}`);
              if (result?.market_trends?.length) rbParts.push(`Market Trends: ${result.market_trends.slice(0, 3).map((t: any) => typeof t === 'string' ? t : t.trend || t.title || '').filter(Boolean).join('; ')}`);
              if (result?.risks?.length) rbParts.push(`Risks: ${result.risks.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.risk || r.title || '').filter(Boolean).join('; ')}`);
            }
            if (rbParts.length > 0) entityContext += `\n\nRESEARCH BRIEFINGS:\n${rbParts.join('\n')}`;
          }

          // Compliance History
          if (complianceJobs?.length) {
            const chParts: string[] = [];
            for (const job of complianceJobs) {
              chParts.push(`Compliance Scan (${new Date(job.created_at).toLocaleDateString()}): Score ${job.compliance_score}%, ${job.issues_found || 0} issues found`);
              const issues = job.issues_data as any;
              if (Array.isArray(issues) && issues.length) {
                chParts.push(`  Top Issues: ${issues.slice(0, 3).map((i: any) => `${i.category || i.type || 'Issue'}: ${i.description || i.message || ''}`).join('; ')}`);
              }
            }
            if (chParts.length > 0) entityContext += `\n\nCOMPLIANCE HISTORY:\n${chParts.join('\n')}`;
          }

          // Regional Variants
          if (regionalVariants?.length) {
            const rvParts: string[] = [];
            for (const v of regionalVariants) {
              const overrides: string[] = [];
              if (v.colors_override) overrides.push('colors');
              if (v.typography_override) overrides.push('typography');
              if (v.messaging_override) overrides.push('messaging');
              if (v.voice_override) overrides.push('voice');
              if (v.imagery_override) overrides.push('imagery');
              rvParts.push(`${v.variant_code} (${v.variant_level}): overrides [${overrides.join(', ')}], translation: ${v.translation_status || 'none'}`);
              const adaptations = v.cultural_adaptations as any;
              if (adaptations?.notes) rvParts.push(`  Cultural notes: ${String(adaptations.notes).slice(0, 150)}`);
            }
            if (rvParts.length > 0) entityContext += `\n\nREGIONAL VARIANTS:\n${rvParts.join('\n')}`;
          }

          // Bias & Inclusion Scans
          if (biasScan) {
            const bs = biasScan as any;
            const bsParts: string[] = [];
            if (bs.inclusion_score != null) bsParts.push(`Overall Inclusion Score: ${bs.inclusion_score}/100`);
            if (bs.language_score != null) bsParts.push(`Language Score: ${bs.language_score}/100`);
            if (bs.visual_score != null) bsParts.push(`Visual Score: ${bs.visual_score}/100`);
            if (bs.accessibility_score != null) bsParts.push(`Accessibility Score: ${bs.accessibility_score}/100`);
            if (bs.ai_governance_score != null) bsParts.push(`AI Governance Score: ${bs.ai_governance_score}/100`);
            const findings = Array.isArray(bs.findings) ? bs.findings : [];
            if (findings.length) bsParts.push(`Key Findings: ${findings.slice(0, 5).map((f: any) => `[${f.severity || 'info'}] ${f.title || f.description || ''}`).join('; ')}`);
            const recs = Array.isArray(bs.recommendations) ? bs.recommendations : [];
            if (recs.length) bsParts.push(`Recommendations: ${recs.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.text || r.title || '').filter(Boolean).join('; ')}`);
            const persona = bs.persona_coverage as any;
            if (persona) {
              const dims = ['vision', 'mobility', 'hearing', 'speech', 'cognitive'];
              const covered = dims.filter(d => persona[d]?.covered || persona[d] === true);
              bsParts.push(`Persona Spectrum Coverage: ${covered.length}/${dims.length} (${covered.join(', ') || 'none'})`);
            }
            if (bsParts.length > 0) entityContext += `\n\nBIAS & INCLUSION ANALYSIS:\n${bsParts.join('\n')}`;
          }

          // Brand Health Snapshots (trends)
          if (healthSnapshots?.length) {
            const hsParts: string[] = [];
            const latest = healthSnapshots[0] as any;
            hsParts.push(`Latest Health Score (${latest.snapshot_date}): ${latest.brand_health_score ?? 'N/A'}/100`);
            if (latest.compliance_score != null) hsParts.push(`Compliance: ${latest.compliance_score}/100`);
            if (latest.bias_inclusion_score != null) hsParts.push(`Bias & Inclusion: ${latest.bias_inclusion_score}/100`);
            if (latest.website_score != null) hsParts.push(`Website: ${latest.website_score}/100`);
            if (latest.competitive_score != null) hsParts.push(`Competitive: ${latest.competitive_score}/100`);
            const deltas = latest.score_deltas as any;
            if (deltas?.health != null) hsParts.push(`Health Trend: ${deltas.health > 0 ? '▲' : '▼'} ${Math.abs(deltas.health)} pts`);
            if (healthSnapshots.length > 1) {
              const oldest = healthSnapshots[healthSnapshots.length - 1] as any;
              hsParts.push(`${healthSnapshots.length}-period range: ${oldest.brand_health_score ?? '?'} → ${latest.brand_health_score ?? '?'}`);
            }
            if (hsParts.length > 0) entityContext += `\n\nBRAND HEALTH TRENDS:\n${hsParts.join('\n')}`;
          }

          // Localization Jobs
          if (localizationJobs?.length) {
            const ljParts: string[] = [];
            const statusCounts: Record<string, number> = {};
            const languages = new Set<string>();
            let totalWords = 0;
            for (const job of localizationJobs) {
              const j = job as any;
              statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
              if (j.target_language) languages.add(j.target_language);
              totalWords += j.word_count || 0;
            }
            ljParts.push(`Translation Jobs: ${localizationJobs.length} (${Object.entries(statusCounts).map(([s, c]) => `${c} ${s}`).join(', ')})`);
            ljParts.push(`Target Languages: ${Array.from(languages).join(', ')}`);
            ljParts.push(`Total Words Translated: ${totalWords.toLocaleString()}`);
            if (ljParts.length > 0) entityContext += `\n\nLOCALIZATION STATUS:\n${ljParts.join('\n')}`;
          }

          // Generated Assets
          if (generatedAssets?.length) {
            const gaParts: string[] = [];
            const approved = generatedAssets.filter((a: any) => a.is_approved);
            gaParts.push(`AI-Generated Assets: ${generatedAssets.length} total, ${approved.length} approved`);
            const categories = [...new Set(generatedAssets.map((a: any) => a.category).filter(Boolean))];
            if (categories.length) gaParts.push(`Categories: ${categories.join(', ')}`);
            gaParts.push(`Recent: ${generatedAssets.slice(0, 3).map((a: any) => `${a.name} (${a.asset_type})`).join(', ')}`);
            if (gaParts.length > 0) entityContext += `\n\nCREATIVE STUDIO ASSETS:\n${gaParts.join('\n')}`;
          }

          // Website Analysis Reports
          if (websiteReports?.length) {
            const waParts: string[] = [];
            for (const wr of websiteReports) {
              const w = wr as any;
              waParts.push(`${w.website_url}: Score ${w.overall_score}/100 (Grade: ${w.grade || 'N/A'}) - ${(w.summary || '').slice(0, 200)}`);
            }
            if (waParts.length > 0) entityContext += `\n\nWEBSITE ANALYSIS:\n${waParts.join('\n')}`;
          }

        } catch (e) {
          console.error('[dataforce-assistant] Data enrichment error:', e);
        }
      }
    }

    // Get DataForce config for persona and mode
    // Try per-brand agent config first, then fall back to generic brand_assistant
    const configPromise = supabase
      .from('dataforce_config')
      .select('assistant_persona, api_mode')
      .eq('organization_id', organization_id)
      .maybeSingle();

    let brandBotPromise;
    if (entity_type === 'brand' && entity_id) {
      brandBotPromise = supabase
        .from('bot_config')
        .select('system_prompt, model, temperature, max_tokens, is_active, welcome_message, personality_traits, response_style, display_name')
        .eq('bot_type', 'brand_agent')
        .eq('brand_id', entity_id)
        .maybeSingle();
    } else {
      brandBotPromise = Promise.resolve({ data: null });
    }

    const genericBotPromise = supabase
      .from('bot_config')
      .select('system_prompt, model, temperature, max_tokens, is_active, welcome_message, personality_traits, response_style, display_name')
      .eq('bot_type', 'brand_assistant')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const [{ data: config }, { data: brandBotConfig }, { data: genericBotConfig }] = await Promise.all([
      configPromise, brandBotPromise, genericBotPromise,
    ]);

    // Per-brand agent config takes priority over generic brand_assistant config
    const botConfig = brandBotConfig || genericBotConfig;

    const isDemo = !config || config.api_mode === 'demo';
    // Bot Manager config takes priority over DataForce config
    const persona = botConfig?.system_prompt || config?.assistant_persona || `You are a helpful brand assistant for ${entityName}. You help users understand and apply brand guidelines correctly.`;
    const aiModel = botConfig?.model || 'google/gemini-3-flash-preview';
    const aiTemperature = botConfig?.temperature ?? 0.7;
    const aiMaxTokens = botConfig?.max_tokens ?? 4096;
    
    // If bot is explicitly disabled in Bot Manager, return inactive response
    if (botConfig && botConfig.is_active === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Brand Assistant is currently disabled by your administrator.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build message history (must be before demo mode block that references it)
    const existingMessages = Array.isArray(conversation.messages) ? conversation.messages : [];

    // Demo mode - return helpful placeholder response
    if (isDemo && !LOVABLE_API_KEY) {
      const demoResponse = generateDemoAssistantResponse(message, entityName);
      
      const newMessages = [
        ...existingMessages,
        { id: crypto.randomUUID(), role: 'user', content: message, timestamp: new Date().toISOString() },
        { id: crypto.randomUUID(), role: 'assistant', content: demoResponse, timestamp: new Date().toISOString() }
      ];

      await supabase
        .from('dataforce_assistant_conversations')
        .update({ messages: newMessages })
        .eq('id', conversation.id);

      return new Response(
        JSON.stringify({
          success: true,
          conversationId: conversation.id,
          message: demoResponse,
          languageCode: language_code,
          isDemo: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageHistory = existingMessages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // Language instruction
    const languageInstruction = language_code !== 'en_US' 
      ? `\n\nIMPORTANT: Respond in the language specified by code: ${language_code}. If the user writes in a different language, still respond in ${language_code}.`
      : '';

    // Build personality context from Bot Manager config
    const personalityBlock = botConfig?.personality_traits 
      ? `\nPersonality traits: ${Array.isArray(botConfig.personality_traits) ? (botConfig.personality_traits as string[]).join(', ') : botConfig.personality_traits}`
      : '';
    const styleBlock = botConfig?.response_style 
      ? `\nResponse style: ${botConfig.response_style}` 
      : '';

    // Build user persona context block
    let personaContext = '';
    if (userPersona) {
      const pp: string[] = [];
      const style = userPersona.communication_style as any;
      if (style?.tone) pp.push(`Communication tone: ${style.tone}`);
      if (style?.detail_level) pp.push(`Detail preference: ${style.detail_level}`);
      if (style?.format_preference) pp.push(`Format preference: ${style.format_preference}`);
      const prefs = userPersona.preferences as any;
      if (prefs?.focus_areas?.length) pp.push(`Focus areas: ${prefs.focus_areas.join(', ')}`);
      if (prefs?.avoid?.length) pp.push(`Avoids: ${prefs.avoid.join(', ')}`);
      if (prefs?.likes?.length) pp.push(`Likes: ${prefs.likes.join(', ')}`);
      const feedback = userPersona.feedback_patterns as any;
      if (feedback?.common_corrections?.length) pp.push(`Common corrections from user: ${feedback.common_corrections.slice(0, 3).join('; ')}`);
      if (feedback?.satisfaction_signals?.length) pp.push(`Things they appreciate: ${feedback.satisfaction_signals.slice(0, 3).join('; ')}`);
      if (userPersona.expertise_level) pp.push(`Expertise level: ${userPersona.expertise_level}`);
      if (userPersona.topics_of_interest?.length) pp.push(`Topics of interest: ${userPersona.topics_of_interest.slice(0, 8).join(', ')}`);
      if (pp.length > 0) personaContext = `\n\nUSER PERSONA (adapt your style to this specific user):\n${pp.join('\n')}`;
    }

    // Build past conversation context
    let pastConversationContext = '';
    if (pastConversationSummaries.length > 0) {
      pastConversationContext = `\n\nPAST CONVERSATIONS WITH THIS USER (for continuity):\n${pastConversationSummaries.join('\n')}`;
    }

    // Build institutional memory context from assistant_memory table
    let institutionalMemoryContext = '';
    if (memoryResult.data?.length) {
      const memParts: string[] = [];
      // Prioritize entity-specific memory, then org-wide
      const entityMemory = entity_id ? memoryResult.data.filter((m: any) => m.entity_id === entity_id) : [];
      const orgMemory = memoryResult.data.filter((m: any) => !entityMemory.includes(m));
      const relevantMemory = [...entityMemory.slice(0, 5), ...orgMemory.slice(0, 3)];
      for (const mem of relevantMemory) {
        const entityLabel = mem.entity_type ? ` [${mem.entity_type}]` : '';
        const decisions = Array.isArray(mem.key_decisions) && mem.key_decisions.length
          ? ` | Decisions: ${mem.key_decisions.slice(0, 3).map((d: any) => typeof d === 'string' ? d : d.decision || d.text || '').filter(Boolean).join('; ')}`
          : '';
        memParts.push(`- ${new Date(mem.created_at).toLocaleDateString()}${entityLabel}: ${(mem.summary || '').slice(0, 250)}${decisions}`);
      }
      if (memParts.length > 0) {
        institutionalMemoryContext = `\n\nINSTITUTIONAL MEMORY (key learnings from past conversations):\n${memParts.join('\n')}`;
      }
    }

    // === INCLUSIVE LANGUAGE GUARDRAILS (enforced baseline) ===
    const inclusiveLanguageGuardrails = `
INCLUSIVE LANGUAGE & BIAS GUARDRAILS (MANDATORY — always follow these):
1. Use person-first language: "person with a disability" not "disabled person", "people experiencing homelessness" not "homeless people".
2. Avoid ableist terms: Replace "blind spot" with "gap", "crippling" with "severe", "tone-deaf" with "insensitive", "crazy/insane" with "unexpected/surprising", "lame" with "ineffective", "dumb" with "unclear".
3. Use gender-neutral language: "they/them" for unknown gender, "workforce" not "manpower", "chairperson" not "chairman", "staffed" not "manned".
4. Avoid age-based stereotypes: Don't assume tech literacy by age, avoid "elderly" (use "older adults"), avoid "young and dynamic".
5. Cultural sensitivity: Avoid idioms that don't translate well across cultures. Don't assume Western-centric norms. Respect naming conventions across cultures.
6. Representation awareness: When giving examples of people, vary names, backgrounds, and contexts. Avoid defaulting to Western/Anglo examples.
7. Accessibility-first framing: Suggest accessible alternatives proactively. Consider screen readers, color contrast, and cognitive load in recommendations.
8. Avoid stereotyping in brand archetypes: Don't reinforce harmful gender, racial, or cultural stereotypes when discussing brand personality or target audiences.
${language_code !== 'en_US' ? `9. MULTILINGUAL BIAS AWARENESS: When responding in ${language_code}, apply inclusive language standards appropriate to that language and culture. Be aware of gendered grammar (e.g., Spanish, French, German) and use inclusive alternatives where available. Flag culturally specific bias risks.` : ''}

If you detect potentially biased content in the brand data you're referencing, gently flag it with a suggestion for improvement. Frame bias observations constructively.`;

    const systemPrompt = `${persona}${personalityBlock}${styleBlock}

${entityContext}${oracleContext}${crossEntityContext}${entityDirectory}${personaContext}${pastConversationContext}${institutionalMemoryContext}
${languageInstruction}

${inclusiveLanguageGuardrails}

Guidelines for responses:
${conversation_style === 'direct' ? `- Be concise and straight-to-the-point. Give brief, actionable answers without elaboration unless asked.
- Use bullet points over paragraphs. Skip pleasantries.
- Prioritize the most important information first.` :
conversation_style === 'suggestive' ? `- Proactively offer alternatives and related suggestions the user may not have considered.
- After answering, suggest 2-3 follow-up directions or complementary ideas.
- Frame options with pros/cons to help decision-making.` :
conversation_style === 'educational' ? `- Provide detailed explanations with context and reasoning behind recommendations.
- Explain the "why" behind brand guidelines, not just the "what".
- Include relevant best practices, industry standards, and design principles.
- Use examples to illustrate concepts.` :
`- Be exploratory and imaginative in your responses.
- Suggest creative applications and unconventional uses of brand elements.
- Draw connections between brand elements and broader design/cultural trends.
- Encourage experimentation while respecting brand boundaries.`}
- Reference specific brand elements when relevant
- Provide practical, actionable advice
- Maintain brand voice and tone
- If you don't have specific information, say so clearly
- Adapt your communication style to this user's preferences and expertise level
- Remember and reference relevant past interactions when applicable

NAVIGATION LINKS:
When a user asks about a specific brand, product, or event that exists in the entity directory above, include navigation links in your response using this exact format:
[[nav:TYPE:SLUG:SECTION|LABEL]]
Where TYPE is "brand", "product", or "event", SLUG is the entity slug from the directory, SECTION is an optional section hash (e.g. "colors", "typography", "hero", "identity", "logos", "imagery", "social", "values", "templates", "gradients", "patterns", "iconography", "misuse", "services", "signatures", "digital-collateral", "social-assets", "statistics", "case-studies", "videos", "websites", "awards"), and LABEL is the display text.
Examples:
- "Check out [[nav:brand:transperfect:colors|TransPerfect's Color Palette]]"
- "View [[nav:product:globallink-tms|GlobalLink TMS]] for details"
- "See [[nav:event:annual-summit:hero|Annual Summit Overview]]"
- "You can view it at [[nav:brand:transperfect|TransPerfect Brand Guide]]"
Only use slugs that exist in the entity directory. Do not fabricate slugs. If no matching entity exists, do not include a navigation link.`;

    // Call AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        temperature: aiTemperature,
        max_tokens: aiMaxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          ...messageHistory,
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Update conversation with new messages
    const newMessages = [
      ...existingMessages,
      { 
        id: crypto.randomUUID(), 
        role: 'user', 
        content: message, 
        timestamp: new Date().toISOString() 
      },
      { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: assistantMessage, 
        timestamp: new Date().toISOString() 
      }
    ];

    await supabase
      .from('dataforce_assistant_conversations')
      .update({ messages: newMessages })
      .eq('id', conversation.id);

    // Background persona learning: every 5 interactions, extract user preferences via AI
    const interactionCount = (userPersona?.interaction_count || 0) + 1;
    const shouldUpdatePersona = interactionCount % 5 === 0 || !userPersona;

    // Use EdgeRuntime.waitUntil for background persona extraction
    const personaUpdateTask = async () => {
      try {
        // Upsert interaction count immediately
        await supabase
          .from('user_assistant_profiles')
          .upsert({
            user_id: user.id,
            organization_id,
            interaction_count: interactionCount,
          }, { onConflict: 'user_id,organization_id' });

        if (shouldUpdatePersona && LOVABLE_API_KEY) {
          // Collect recent messages for persona extraction (last 20 across conversations)
          const recentMsgs = newMessages.slice(-20).map((m: any) => `${m.role}: ${(m.content || '').slice(0, 200)}`).join('\n');

          const personaExtraction = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: 'google/gemini-3.1-flash-lite-preview',
              temperature: 0.3,
              max_tokens: 1024,
              messages: [
                { role: "system", content: "Extract user persona traits from these chat messages. Return ONLY valid JSON." },
                { role: "user", content: `Analyze these messages and extract the user's working style and preferences:\n\n${recentMsgs}\n\nReturn JSON with these fields:\n- communication_style: { tone: string, detail_level: "brief"|"moderate"|"detailed", format_preference: "bullet_points"|"paragraphs"|"mixed" }\n- preferences: { focus_areas: string[], likes: string[], avoid: string[] }\n- feedback_patterns: { common_corrections: string[], satisfaction_signals: string[] }\n- expertise_level: "beginner"|"intermediate"|"advanced"|"expert"\n- topics_of_interest: string[]` }
              ],
              tools: [{
                type: "function",
                function: {
                  name: "update_persona",
                  description: "Update user persona profile",
                  parameters: {
                    type: "object",
                    properties: {
                      communication_style: { type: "object", properties: { tone: { type: "string" }, detail_level: { type: "string" }, format_preference: { type: "string" } } },
                      preferences: { type: "object", properties: { focus_areas: { type: "array", items: { type: "string" } }, likes: { type: "array", items: { type: "string" } }, avoid: { type: "array", items: { type: "string" } } } },
                      feedback_patterns: { type: "object", properties: { common_corrections: { type: "array", items: { type: "string" } }, satisfaction_signals: { type: "array", items: { type: "string" } } } },
                      expertise_level: { type: "string" },
                      topics_of_interest: { type: "array", items: { type: "string" } }
                    },
                    required: ["communication_style", "expertise_level"],
                    additionalProperties: false
                  }
                }
              }],
              tool_choice: { type: "function", function: { name: "update_persona" } }
            }),
          });

          if (personaExtraction.ok) {
            const pResult = await personaExtraction.json();
            const toolCall = pResult.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              try {
                const extracted = JSON.parse(toolCall.function.arguments);
                // Merge with existing persona (cumulative learning)
                const mergedStyle = { ...(userPersona?.communication_style || {}), ...extracted.communication_style };
                const mergedPrefs = {
                  focus_areas: [...new Set([...(userPersona?.preferences?.focus_areas || []), ...(extracted.preferences?.focus_areas || [])])].slice(0, 15),
                  likes: [...new Set([...(userPersona?.preferences?.likes || []), ...(extracted.preferences?.likes || [])])].slice(0, 10),
                  avoid: [...new Set([...(userPersona?.preferences?.avoid || []), ...(extracted.preferences?.avoid || [])])].slice(0, 10),
                };
                const mergedFeedback = {
                  common_corrections: [...new Set([...(userPersona?.feedback_patterns?.common_corrections || []), ...(extracted.feedback_patterns?.common_corrections || [])])].slice(0, 10),
                  satisfaction_signals: [...new Set([...(userPersona?.feedback_patterns?.satisfaction_signals || []), ...(extracted.feedback_patterns?.satisfaction_signals || [])])].slice(0, 10),
                };
                const mergedTopics = [...new Set([...(userPersona?.topics_of_interest || []), ...(extracted.topics_of_interest || [])])].slice(0, 20);

                await supabase
                  .from('user_assistant_profiles')
                  .upsert({
                    user_id: user.id,
                    organization_id,
                    communication_style: mergedStyle,
                    preferences: mergedPrefs,
                    feedback_patterns: mergedFeedback,
                    expertise_level: extracted.expertise_level || userPersona?.expertise_level || 'intermediate',
                    topics_of_interest: mergedTopics,
                    interaction_count: interactionCount,
                    last_persona_update: new Date().toISOString(),
                  }, { onConflict: 'user_id,organization_id' });

                console.log('[dataforce-assistant] User persona updated successfully');
              } catch (parseErr) {
                console.warn('[dataforce-assistant] Persona parse error:', parseErr);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[dataforce-assistant] Background persona update failed (non-critical):', e);
      }
    };

    // Run persona update in background
    (globalThis as any).EdgeRuntime?.waitUntil?.(personaUpdateTask()) || personaUpdateTask();

    // Background conversation memory: summarize when conversation reaches 10+ messages
    const memorySaveTask = async () => {
      try {
        if (newMessages.length >= 10 && newMessages.length % 10 === 0 && LOVABLE_API_KEY) {
          const recentMsgs = newMessages.slice(-20).map((m: any) => `${m.role}: ${(m.content || '').slice(0, 300)}`).join('\n');
          const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: 'google/gemini-3.1-flash-lite-preview',
              temperature: 0.2,
              max_tokens: 512,
              messages: [
                { role: "system", content: "Summarize this conversation into a concise institutional memory entry. Return ONLY valid JSON." },
                { role: "user", content: `Summarize the key topics, decisions, and insights from this conversation:\n\n${recentMsgs}\n\nReturn JSON:\n- summary: string (2-3 sentences)\n- key_decisions: string[] (max 5 actionable decisions made)\n- topics: string[] (max 8 topic keywords)` }
              ],
              tools: [{
                type: "function",
                function: {
                  name: "save_memory",
                  description: "Save conversation memory",
                  parameters: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      key_decisions: { type: "array", items: { type: "string" } },
                      topics: { type: "array", items: { type: "string" } }
                    },
                    required: ["summary", "topics"],
                    additionalProperties: false
                  }
                }
              }],
              tool_choice: { type: "function", function: { name: "save_memory" } }
            }),
          });

          if (summaryResponse.ok) {
            const sResult = await summaryResponse.json();
            const toolCall = sResult.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              const extracted = JSON.parse(toolCall.function.arguments);
              await supabase.from('assistant_memory').insert({
                organization_id,
                entity_type: entity_type || null,
                entity_id: entity_id || null,
                summary: extracted.summary || 'Conversation summary',
                key_decisions: extracted.key_decisions || [],
                topics: extracted.topics || [],
                conversation_id: conversation.id,
              });
              console.log('[dataforce-assistant] Conversation memory saved');
            }
          }
        }
      } catch (e) {
        console.warn('[dataforce-assistant] Memory save failed (non-critical):', e);
      }
    };
    (globalThis as any).EdgeRuntime?.waitUntil?.(memorySaveTask()) || memorySaveTask();

    // Background self-bias monitoring: lightweight check on assistant output
    const biasCheckTask = async () => {
      try {
        if (!LOVABLE_API_KEY) return;
        const biasCheckResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: 'google/gemini-3.1-flash-lite-preview',
            temperature: 0.1,
            max_tokens: 512,
            messages: [
              { role: "system", content: "You are a bias detection system. Analyze the AI assistant response for bias issues." },
              { role: "user", content: `Check this AI response for bias:\n\n"${assistantMessage.slice(0, 1500)}"\n\nLook for: ableist language, gender bias, cultural insensitivity, stereotyping, exclusionary framing, age-based assumptions.\n\nReturn ONLY valid JSON.` }
            ],
            tools: [{
              type: "function",
              function: {
                name: "report_bias",
                description: "Report bias findings in AI response",
                parameters: {
                  type: "object",
                  properties: {
                    has_bias: { type: "boolean" },
                    severity: { type: "string", enum: ["none", "low", "medium", "high"] },
                    issues: { type: "array", items: { type: "object", properties: { type: { type: "string" }, description: { type: "string" }, suggestion: { type: "string" } }, required: ["type", "description"] } }
                  },
                  required: ["has_bias", "severity"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "report_bias" } }
          }),
        });

        if (biasCheckResponse.ok) {
          const bResult = await biasCheckResponse.json();
          const toolCall = bResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            const biasResult = JSON.parse(toolCall.function.arguments);
            if (biasResult.has_bias && biasResult.severity !== 'none') {
              // Log bias finding to conversation and audit
              const biasFlag = {
                message_id: newMessages[newMessages.length - 1]?.id,
                flag_type: 'auto_detected',
                severity: biasResult.severity,
                issues: biasResult.issues || [],
                flagged_at: new Date().toISOString(),
                flagged_by: 'system',
              };

              // Update conversation with bias flag
              const existingFlags = Array.isArray(conversation.bias_flags) ? conversation.bias_flags : [];
              await supabase
                .from('dataforce_assistant_conversations')
                .update({ 
                  bias_flags: [...existingFlags, biasFlag],
                  bias_flagged_count: (conversation.bias_flagged_count || 0) + 1,
                })
                .eq('id', conversation.id);

              // Audit log the bias detection
              await supabase.rpc('insert_audit_log', {
                p_entity_type: 'assistant_bias',
                p_action_type: 'bias_auto_detected',
                p_entity_name: entityName,
                p_organization_id: organization_id,
                p_details: { 
                  conversation_id: conversation.id,
                  severity: biasResult.severity,
                  issues_count: (biasResult.issues || []).length,
                  language: language_code,
                },
              }).catch(() => {}); // Non-critical

              console.log(`[dataforce-assistant] Bias auto-detected (${biasResult.severity}): ${(biasResult.issues || []).length} issues`);
            }
          }
        }
      } catch (e) {
        console.warn('[dataforce-assistant] Bias check failed (non-critical):', e);
      }
    };
    (globalThis as any).EdgeRuntime?.waitUntil?.(biasCheckTask()) || biasCheckTask();

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: conversation.id,
        message: assistantMessage,
        languageCode: language_code,
        hasPersona: !!userPersona,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assistant error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Assistant failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildEntityContext(guideData: Record<string, unknown>, entityName: string): string {
  try {
    const g = guideData || {};
    const parts: string[] = [`Brand/Entity: ${entityName}`];
    
    // HERO - full details
    const hero = g.hero as any;
    if (hero) {
      if (hero.name) parts.push(`Display Name: ${hero.name}`);
      if (hero.tagline) parts.push(`Tagline: ${hero.tagline}`);
      if (hero.description) parts.push(`Description: ${String(hero.description).slice(0, 300)}`);
      if (hero.coverImage) parts.push(`Has Cover Image: yes`);
      if (hero.cardImage) parts.push(`Has Card Image: yes`);
    }

    // IDENTITY - deep
    const identity = g.identity as any;
    if (identity) {
      if (identity.missionStatement || identity.mission) parts.push(`Mission: ${identity.missionStatement || identity.mission}`);
      if (identity.visionStatement || identity.vision) parts.push(`Vision: ${identity.visionStatement || identity.vision}`);
      if (identity.archetype) parts.push(`Brand Archetype: ${identity.archetype}`);
      if (identity.industry) parts.push(`Industry: ${identity.industry}`);
      if (identity.brandPromise) parts.push(`Brand Promise: ${String(identity.brandPromise).slice(0, 200)}`);
      if (identity.brandStory) parts.push(`Brand Story: ${String(identity.brandStory).slice(0, 400)}`);
      if (identity.personality) parts.push(`Personality: ${typeof identity.personality === 'string' ? identity.personality : JSON.stringify(identity.personality).slice(0, 200)}`);
      if (identity.voiceTone) parts.push(`Voice & Tone: ${typeof identity.voiceTone === 'string' ? identity.voiceTone : JSON.stringify(identity.voiceTone).slice(0, 200)}`);
      const tone = Array.isArray(identity.toneOfVoice) ? identity.toneOfVoice : [];
      if (tone.length) parts.push(`Tone of Voice Keywords: ${tone.join(', ')}`);
      if (identity.positioning) parts.push(`Positioning: ${String(identity.positioning).slice(0, 200)}`);
      if (identity.targetAudience) parts.push(`Target Audience: ${String(identity.targetAudience).slice(0, 200)}`);
      if (identity.uniqueSellingProposition) parts.push(`USP: ${String(identity.uniqueSellingProposition).slice(0, 200)}`);
    }

    // TAGLINE section
    const tagline = g.tagline as any;
    if (tagline) {
      if (tagline.primary) parts.push(`Primary Tagline: ${tagline.primary}`);
      if (tagline.secondary) parts.push(`Secondary Tagline: ${tagline.secondary}`);
      if (tagline.guidelines) parts.push(`Tagline Guidelines: ${String(tagline.guidelines).slice(0, 200)}`);
    }

    // VALUES - with descriptions
    const values = Array.isArray(g.values) ? g.values : [];
    if (values.length) parts.push(`Core Values:\n${values.map((v: any) => `  • ${v.title || v.text || v.name}${v.description ? ': ' + String(v.description).slice(0, 100) : ''}`).join('\n')}`);

    // COLORS - deep with roles, usage, accessibility
    const colors = Array.isArray(g.colors) ? g.colors : [];
    if (colors.length) parts.push(`Colors (${colors.length}):\n${colors.slice(0, 10).map((c: any) => `  • ${c.name || 'Color'}: ${c.hex || ''}${c.role ? ' [' + c.role + ']' : ''}${c.usage ? ' — ' + String(c.usage).slice(0, 80) : ''}${c.pantone ? ' (Pantone: ' + c.pantone + ')' : ''}${c.cmyk ? ' (CMYK: ' + c.cmyk + ')' : ''}`).join('\n')}`);

    // COLOR COMBINATIONS
    const colorCombinations = Array.isArray(g.colorCombinations) ? g.colorCombinations : [];
    if (colorCombinations.length) parts.push(`Color Combinations: ${colorCombinations.length} defined pairings${colorCombinations.slice(0, 3).map((cc: any) => ` — ${cc.name || cc.label || 'combo'}: ${cc.description || ''}`).join(';')}`);

    // TYPOGRAPHY - deep with weights, sizes, usage
    const typography = Array.isArray(g.typography) ? g.typography : [];
    if (typography.length) parts.push(`Typography (${typography.length}):\n${typography.slice(0, 6).map((t: any) => `  • ${t.fontFamily || t.family || t.name || 'Font'}${t.weight ? ' w' + t.weight : ''}${t.role ? ' [' + t.role + ']' : ''}${t.usage ? ' — ' + String(t.usage).slice(0, 80) : ''}${t.size ? ' size:' + t.size : ''}${t.lineHeight ? ' lh:' + t.lineHeight : ''}`).join('\n')}`);

    // LOGOS - detailed with variants and usage rules
    const logos = Array.isArray(g.logos) ? g.logos : [];
    if (logos.length) parts.push(`Logos (${logos.length}):\n${logos.slice(0, 8).map((l: any) => `  • ${l.name || l.label || 'Logo'}${l.variant ? ' [' + l.variant + ']' : ''}${l.usage ? ' — ' + String(l.usage).slice(0, 100) : ''}${l.clearSpace ? ' clearSpace:' + l.clearSpace : ''}${l.minSize ? ' minSize:' + l.minSize : ''}`).join('\n')}`);

    // SERVICES - with descriptions
    const services = Array.isArray(g.services) ? g.services : [];
    if (services.length) parts.push(`Services:\n${services.slice(0, 8).map((s: any) => `  • ${s.name || s.title || 'Service'}${s.description ? ': ' + String(s.description).slice(0, 100) : ''}`).join('\n')}`);

    // SOCIAL profiles
    const social = Array.isArray(g.social) ? g.social : [];
    if (social.length) parts.push(`Social Profiles: ${social.map((s: any) => `${s.platform || ''}: ${s.handle || s.url || ''}`).join(', ')}`);

    // SOCIAL ASSETS
    const socialAssets = Array.isArray(g.socialAssets) ? g.socialAssets : [];
    if (socialAssets.length) parts.push(`Social Assets: ${socialAssets.length} (${socialAssets.slice(0, 3).map((a: any) => a.name || a.title || a.platform || 'asset').join(', ')})`);

    // WEBSITES
    const websites = Array.isArray(g.websites) ? g.websites : [];
    if (websites.length) parts.push(`Websites:\n${websites.slice(0, 5).map((w: any) => `  • ${w.url || w.name || ''}${w.label ? ' (' + w.label + ')' : ''}${w.description ? ' — ' + String(w.description).slice(0, 80) : ''}`).join('\n')}`);

    // GRADIENTS - with details
    const gradients = Array.isArray(g.gradients) ? g.gradients : [];
    if (gradients.length) parts.push(`Gradients (${gradients.length}):\n${gradients.slice(0, 5).map((gr: any) => `  • ${gr.name || 'Gradient'}${gr.type ? ' [' + gr.type + ']' : ''}${gr.colors ? ' colors: ' + (Array.isArray(gr.colors) ? gr.colors.join(' → ') : gr.colors) : ''}${gr.usage ? ' — ' + String(gr.usage).slice(0, 80) : ''}`).join('\n')}`);

    // PATTERNS - with details
    const patterns = Array.isArray(g.patterns) ? g.patterns : [];
    if (patterns.length) parts.push(`Patterns (${patterns.length}):\n${patterns.slice(0, 5).map((p: any) => `  • ${p.name || 'Pattern'}${p.usage ? ' — ' + String(p.usage).slice(0, 80) : ''}`).join('\n')}`);

    // IMAGERY / VISUAL DIRECTION
    const imagery = Array.isArray(g.imagery) ? g.imagery : [];
    if (imagery.length) parts.push(`Visual Direction / Imagery (${imagery.length}):\n${imagery.slice(0, 5).map((im: any) => `  • ${im.name || im.title || 'Image'}${im.category ? ' [' + im.category + ']' : ''}${im.description ? ' — ' + String(im.description).slice(0, 80) : ''}`).join('\n')}`);

    // IMAGE ASSETS
    const imageAssets = Array.isArray(g.imageAssets) ? g.imageAssets : [];
    if (imageAssets.length) parts.push(`Image Assets: ${imageAssets.length} files`);

    // TEMPLATES
    const templates = Array.isArray(g.templates) ? g.templates : [];
    if (templates.length) parts.push(`Templates (${templates.length}):\n${templates.slice(0, 5).map((t: any) => `  • ${t.name || t.title || 'Template'}${t.category ? ' [' + t.category + ']' : ''}${t.description ? ' — ' + String(t.description).slice(0, 80) : ''}`).join('\n')}`);

    // BROCHURES
    const brochures = Array.isArray(g.brochures) ? g.brochures : [];
    if (brochures.length) parts.push(`Brochures (${brochures.length}):\n${brochures.slice(0, 5).map((b: any) => `  • ${b.name || b.title || 'Brochure'}${b.description ? ' — ' + String(b.description).slice(0, 80) : ''}`).join('\n')}`);

    // PRESENTATION TEMPLATES
    const presentationTemplates = Array.isArray(g.presentationTemplates) ? g.presentationTemplates : [];
    if (presentationTemplates.length) parts.push(`Presentation Templates: ${presentationTemplates.length}`);

    // DIGITAL COLLATERAL
    const emailBanners = Array.isArray(g.emailBanners) ? g.emailBanners : [];
    if (emailBanners.length) parts.push(`Email Banners: ${emailBanners.length}`);

    // BRAND ICONS & ICONOGRAPHY
    const brandIcons = Array.isArray(g.brandIcons) ? g.brandIcons : [];
    if (brandIcons.length) parts.push(`Brand Icons (${brandIcons.length}):\n${brandIcons.slice(0, 5).map((ic: any) => `  • ${ic.name || 'Icon'}${ic.style ? ' [' + ic.style + ']' : ''}${ic.usage ? ' — ' + String(ic.usage).slice(0, 60) : ''}`).join('\n')}`);
    const iconography = Array.isArray(g.iconography) ? g.iconography : [];
    if (iconography.length) parts.push(`Iconography Library: ${iconography.length} icons`);

    // SIGNATURES
    const signatures = Array.isArray(g.signatures) ? g.signatures : [];
    if (signatures.length) parts.push(`Email Signatures (${signatures.length}):\n${signatures.slice(0, 3).map((s: any) => `  • ${s.name || s.title || 'Signature'}${s.role ? ' — ' + s.role : ''}`).join('\n')}`);

    // QR CODES
    const qr = g.qr as any;
    if (qr) {
      if (qr.defaultUrl) parts.push(`QR Code URL: ${qr.defaultUrl}`);
      if (qr.style) parts.push(`QR Style: ${JSON.stringify(qr.style).slice(0, 100)}`);
    }

    // VIDEOS
    const videos = Array.isArray(g.videos) ? g.videos : [];
    if (videos.length) parts.push(`Videos (${videos.length}):\n${videos.slice(0, 5).map((v: any) => `  • ${v.title || v.name || 'Video'}${v.url ? ' — ' + v.url : ''}${v.description ? ' — ' + String(v.description).slice(0, 80) : ''}`).join('\n')}`);

    // MISUSE / ANTI-PATTERNS
    const misuse = Array.isArray(g.misuse) ? g.misuse : [];
    if (misuse.length) parts.push(`Anti-Pattern / Misuse Rules (${misuse.length}):\n${misuse.slice(0, 5).map((m: any) => `  • ${m.title || m.name || 'Rule'}${m.description ? ': ' + String(m.description).slice(0, 100) : ''}`).join('\n')}`);

    // CASE STUDIES
    const caseStudies = Array.isArray(g.caseStudies) ? g.caseStudies : [];
    if (caseStudies.length) parts.push(`Case Studies (${caseStudies.length}):\n${caseStudies.slice(0, 5).map((cs: any) => `  • ${cs.title || cs.name || 'Case Study'}${cs.description ? ': ' + String(cs.description).slice(0, 100) : ''}`).join('\n')}`);

    // AWARDS
    const awards = Array.isArray(g.awards) ? g.awards : [];
    if (awards.length) parts.push(`Awards (${awards.length}):\n${awards.slice(0, 5).map((a: any) => `  • ${a.title || a.name || 'Award'}${a.organization ? ' from ' + a.organization : ''}${a.year ? ' (' + a.year + ')' : ''}${a.category ? ' [' + a.category + ']' : ''}`).join('\n')}`);

    // STATISTICS
    const statistics = Array.isArray(g.statistics) ? g.statistics : [];
    if (statistics.length) parts.push(`Statistics:\n${statistics.slice(0, 8).map((s: any) => `  • ${s.label || s.title || 'Stat'}: ${s.value || ''}`).join('\n')}`);

    // CUSTOM SHAPES / GEOMETRIC PRIMITIVES
    const customShapes = Array.isArray(g.customShapes) ? g.customShapes : [];
    if (customShapes.length) parts.push(`Geometric Primitives / Custom Shapes: ${customShapes.length}`);

    // SPONSOR LOGOS
    const sponsorLogos = Array.isArray(g.sponsorLogos) ? g.sponsorLogos : [];
    if (sponsorLogos.length) parts.push(`Sponsor Logos: ${sponsorLogos.length} (${sponsorLogos.slice(0, 5).map((s: any) => s.name || s.title || 'sponsor').join(', ')})`);

    // CLIENT LOGOS
    const clientLogos = Array.isArray(g.clientLogos) ? g.clientLogos : [];
    if (clientLogos.length) parts.push(`Client Logos: ${clientLogos.length} (${clientLogos.slice(0, 5).map((c: any) => c.name || c.title || 'client').join(', ')})`);

    // LINKED GUIDES (sub-products, sub-events)
    const linkedGuides = Array.isArray(g.linkedGuides) ? g.linkedGuides : [];
    if (linkedGuides.length) parts.push(`Linked Sub-Entities: ${linkedGuides.map((lg: any) => `${lg.name || 'entity'} (${lg.type || 'unknown'})`).join(', ')}`);

    // EVENT-SPECIFIC SECTIONS
    const eventBrief = g.eventBrief as any;
    if (eventBrief) {
      const ebParts: string[] = [];
      if (eventBrief.objective) ebParts.push(`Objective: ${String(eventBrief.objective).slice(0, 200)}`);
      if (eventBrief.audience) ebParts.push(`Audience: ${String(eventBrief.audience).slice(0, 150)}`);
      if (eventBrief.theme) ebParts.push(`Theme: ${eventBrief.theme}`);
      if (eventBrief.venue) ebParts.push(`Venue: ${eventBrief.venue}`);
      if (eventBrief.dates) ebParts.push(`Dates: ${eventBrief.dates}`);
      if (eventBrief.budget) ebParts.push(`Budget: ${eventBrief.budget}`);
      if (ebParts.length) parts.push(`Event Brief:\n${ebParts.map(p => '  ' + p).join('\n')}`);
    }

    // WEBINARS
    const webinars = Array.isArray(g.webinars) ? g.webinars : [];
    if (webinars.length) parts.push(`Webinars (${webinars.length}):\n${webinars.slice(0, 5).map((w: any) => `  • ${w.title || 'Webinar'}${w.speakers ? ' — Speakers: ' + w.speakers : ''}${w.date ? ' (' + w.date + ')' : ''}`).join('\n')}`);

    // PRESENTATIONS
    const presentations = Array.isArray(g.presentations) ? g.presentations : [];
    if (presentations.length) parts.push(`Presentations: ${presentations.length}`);

    // SHARED ASSETS (events)
    const sharedAssets = Array.isArray(g.sharedAssets) ? g.sharedAssets : [];
    if (sharedAssets.length) parts.push(`Shared Assets: ${sharedAssets.length} files`);

    // LOCATIONS
    const locations = Array.isArray(g.locations) ? g.locations : [];
    if (locations.length) parts.push(`Locations (${locations.length}):\n${locations.slice(0, 5).map((loc: any) => `  • ${loc.name || loc.city || 'Location'}${loc.address ? ' — ' + loc.address : ''}${loc.category ? ' [' + loc.category + ']' : ''}`).join('\n')}`);

    // SIGNAGE
    const signage = Array.isArray(g.signage) ? g.signage : [];
    if (signage.length) parts.push(`Event Signage (${signage.length}):\n${signage.slice(0, 5).map((s: any) => `  • ${s.name || s.title || 'Sign'} [${s.type || 'general'}]${s.dimensions ? ' ' + s.dimensions : ''}`).join('\n')}`);

    // PARTNER BOOTHS
    const partnerBooths = Array.isArray(g.partnerBooths) ? g.partnerBooths : [];
    if (partnerBooths.length) parts.push(`Partner Booths: ${partnerBooths.length} (${partnerBooths.slice(0, 5).map((b: any) => b.name || b.company || 'booth').join(', ')})`);

    // PRINT MATERIALS (events)
    const eventPrintMaterials = Array.isArray(g.eventPrintMaterials) ? g.eventPrintMaterials : [];
    if (eventPrintMaterials.length) parts.push(`Event Print Materials: ${eventPrintMaterials.length}`);

    // INFOGRAPHICS
    const eventInfographics = Array.isArray(g.eventInfographics) ? g.eventInfographics : [];
    if (eventInfographics.length) parts.push(`Event Infographics: ${eventInfographics.length}`);

    // APPLICATIONS
    const eventApplications = Array.isArray(g.eventApplications) ? g.eventApplications : [];
    if (eventApplications.length) parts.push(`Event Applications: ${eventApplications.length}`);

    // INSIGHTS
    const insights = Array.isArray(g.insights) ? g.insights : [];
    if (insights.length) parts.push(`Insights & Updates: ${insights.length} entries`);

    // SECTION LAYOUTS (admin config)
    const sectionLayouts = g.sectionLayouts as any;
    if (sectionLayouts && typeof sectionLayouts === 'object') {
      const layoutEntries = Object.entries(sectionLayouts).filter(([_, v]) => v);
      if (layoutEntries.length) parts.push(`Configured Section Layouts: ${layoutEntries.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }

    return parts.join('\n');
  } catch {
    return `Brand/Entity: ${entityName}`;
  }
}

function generateDemoAssistantResponse(message: string, entityName: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('color') || lowerMessage.includes('palette')) {
    return `**Demo Mode Response**\n\nFor ${entityName}'s color guidelines, I would analyze your brand palette and provide specific recommendations. In live mode with DataForce activated, I can:\n\n• Explain color usage rules and accessibility requirements\n• Suggest color combinations for specific use cases\n• Provide hex/RGB values with context\n\nTo activate full AI capabilities, configure your DataForce API key in settings.`;
  }
  
  if (lowerMessage.includes('logo') || lowerMessage.includes('brand mark')) {
    return `**Demo Mode Response**\n\nRegarding ${entityName}'s logo guidelines, I'm currently in demo mode. When fully activated, I can help with:\n\n• Logo placement and spacing rules\n• Approved variations and when to use each\n• Common misuse examples to avoid\n\nActivate DataForce in settings for personalized brand guidance.`;
  }
  
  if (lowerMessage.includes('tone') || lowerMessage.includes('voice') || lowerMessage.includes('messaging')) {
    return `**Demo Mode Response**\n\nFor ${entityName}'s brand voice, the full assistant can provide:\n\n• Tone guidelines for different contexts\n• Example phrases and vocabulary\n• Writing style recommendations\n\nThis is a demo response. Enable DataForce for AI-powered brand assistance.`;
  }
  
  return `**Demo Mode Response**\n\nThank you for your question about ${entityName}. I'm currently running in demo mode with limited capabilities.\n\nWhen DataForce is activated, I can:\n• Answer detailed brand guideline questions\n• Provide contextual recommendations\n• Help with content creation in your brand voice\n• Support multiple languages\n\nConfigure your DataForce API key in the admin settings to unlock full functionality.`;
}
