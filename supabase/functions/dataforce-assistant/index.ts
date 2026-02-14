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
      language_code = 'en_US' 
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

    // Get or create conversation
    let conversation;
    if (conversation_id) {
      const { data } = await supabase
        .from('dataforce_assistant_conversations')
        .select('*')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single();
      conversation = data;
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
    try {
      const [{ data: allBrands }, { data: allProducts }, { data: allEvents }] = await Promise.all([
        supabase.from('brands').select('id, name, slug').eq('organization_id', organization_id).limit(100),
        supabase.from('products').select('id, name, slug, parent_brand_id').eq('organization_id', organization_id).limit(100),
        supabase.from('events').select('id, name, slug, parent_brand_id').eq('organization_id', organization_id).limit(100),
      ]);
      const dirParts: string[] = [];
      if (allBrands?.length) dirParts.push(`Brands: ${allBrands.map(b => `${b.name} [slug:${b.slug}]`).join(', ')}`);
      if (allProducts?.length) dirParts.push(`Products: ${allProducts.map(p => `${p.name} [slug:${p.slug}]`).join(', ')}`);
      if (allEvents?.length) dirParts.push(`Events: ${allEvents.map(e => `${e.name} [slug:${e.slug}]`).join(', ')}`);
      if (dirParts.length) entityDirectory = `\n\nAVAILABLE ENTITIES IN THIS ORGANIZATION:\n${dirParts.join('\n')}`;
    } catch (e) {
      console.warn('[dataforce-assistant] Entity directory fetch failed:', e);
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

        } catch (e) {
          console.error('[dataforce-assistant] Data enrichment error:', e);
        }
      }
    }

    // Get DataForce config for persona and mode
    const [{ data: config }, { data: botConfig }] = await Promise.all([
      supabase
        .from('dataforce_config')
        .select('assistant_persona, api_mode')
        .eq('organization_id', organization_id)
        .maybeSingle(),
      supabase
        .from('bot_config')
        .select('system_prompt, model, temperature, max_tokens, is_active, welcome_message, personality_traits, response_style, display_name')
        .eq('bot_type', 'brand_assistant')
        .eq('organization_id', organization_id)
        .maybeSingle(),
    ]);

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

    // Build message history
    const existingMessages = conversation.messages || [];
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

    const systemPrompt = `${persona}${personalityBlock}${styleBlock}

${entityContext}${oracleContext}${entityDirectory}
${languageInstruction}

Guidelines for responses:
- Be concise but comprehensive
- Reference specific brand elements when relevant
- Provide practical, actionable advice
- Maintain brand voice and tone
- If you don't have specific information, say so clearly

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

    return new Response(
      JSON.stringify({
        success: true,
        conversationId: conversation.id,
        message: assistantMessage,
        languageCode: language_code,
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
  // Use shared full brand context extractor for 100% section coverage
  try {
    // Dynamic import wrapped in sync usage - build inline fallback
    const g = guideData || {};
    const parts: string[] = [`Brand/Entity: ${entityName}`];
    
    const hero = g.hero as any;
    if (hero) {
      if (hero.tagline) parts.push(`Tagline: ${hero.tagline}`);
    }
    const identity = g.identity as any;
    if (identity) {
      if (identity.missionStatement || identity.mission) parts.push(`Mission: ${identity.missionStatement || identity.mission}`);
      if (identity.vision) parts.push(`Vision: ${identity.vision}`);
      if (identity.archetype) parts.push(`Brand Archetype: ${identity.archetype}`);
      if (identity.industry) parts.push(`Industry: ${identity.industry}`);
      const tone = Array.isArray(identity.toneOfVoice) ? identity.toneOfVoice : [];
      if (tone.length) parts.push(`Tone of Voice: ${tone.join(', ')}`);
    }
    const values = Array.isArray(g.values) ? g.values : [];
    if (values.length) parts.push(`Core Values: ${values.map((v: any) => v.title || v.text || v.name).filter(Boolean).join(', ')}`);
    const colors = Array.isArray(g.colors) ? g.colors : [];
    if (colors.length) parts.push(`Colors (${colors.length}): ${colors.slice(0, 6).map((c: any) => `${c.name || 'color'}(${c.hex || ''})`).join(', ')}`);
    const typography = Array.isArray(g.typography) ? g.typography : [];
    if (typography.length) parts.push(`Typography: ${typography.slice(0, 4).map((t: any) => t.fontFamily || t.name || 'font').join(', ')}`);
    const logos = Array.isArray(g.logos) ? g.logos : [];
    if (logos.length) parts.push(`Logos: ${logos.length} defined`);
    const services = Array.isArray(g.services) ? g.services : [];
    if (services.length) parts.push(`Services: ${services.slice(0, 5).map((s: any) => s.name || s.title).filter(Boolean).join(', ')}`);
    const social = Array.isArray(g.social) ? g.social : [];
    if (social.length) parts.push(`Social: ${social.slice(0, 5).map((s: any) => `${s.platform || ''}: ${s.handle || s.url || ''}`).join(', ')}`);
    const websites = Array.isArray(g.websites) ? g.websites : [];
    if (websites.length) parts.push(`Websites: ${websites.slice(0, 3).map((w: any) => w.url || w.name || '').join(', ')}`);
    const gradients = Array.isArray(g.gradients) ? g.gradients : [];
    if (gradients.length) parts.push(`Gradients: ${gradients.length}`);
    const patterns = Array.isArray(g.patterns) ? g.patterns : [];
    if (patterns.length) parts.push(`Patterns: ${patterns.length}`);
    const imagery = Array.isArray(g.imagery) ? g.imagery : [];
    if (imagery.length) parts.push(`Imagery: ${imagery.length} assets`);
    const templates = Array.isArray(g.templates) ? g.templates : [];
    if (templates.length) parts.push(`Templates: ${templates.length}`);
    const awards = Array.isArray(g.awards) ? g.awards : [];
    if (awards.length) parts.push(`Awards: ${awards.length}`);
    const statistics = Array.isArray(g.statistics) ? g.statistics : [];
    if (statistics.length) parts.push(`Statistics: ${statistics.length}`);
    const brandIcons = Array.isArray(g.brandIcons) ? g.brandIcons : [];
    if (brandIcons.length) parts.push(`Brand Icons: ${brandIcons.length}`);
    const iconography = Array.isArray(g.iconography) ? g.iconography : [];
    if (iconography.length) parts.push(`Iconography: ${iconography.length}`);
    const signatures = Array.isArray(g.signatures) ? g.signatures : [];
    if (signatures.length) parts.push(`Email Signatures: ${signatures.length}`);
    const emailBanners = Array.isArray(g.emailBanners) ? g.emailBanners : [];
    if (emailBanners.length) parts.push(`Email Banners: ${emailBanners.length}`);
    const videos = Array.isArray(g.videos) ? g.videos : [];
    if (videos.length) parts.push(`Videos: ${videos.length}`);
    const misuse = Array.isArray(g.misuse) ? g.misuse : [];
    if (misuse.length) parts.push(`Misuse Guidelines: ${misuse.length}`);
    const caseStudies = Array.isArray(g.caseStudies) ? g.caseStudies : [];
    if (caseStudies.length) parts.push(`Case Studies: ${caseStudies.length}`);
    const customShapes = Array.isArray(g.customShapes) ? g.customShapes : [];
    if (customShapes.length) parts.push(`Custom Shapes: ${customShapes.length}`);
    const locations = Array.isArray(g.locations) ? g.locations : [];
    if (locations.length) parts.push(`Locations: ${locations.length}`);
    const sponsorLogos = Array.isArray(g.sponsorLogos) ? g.sponsorLogos : [];
    if (sponsorLogos.length) parts.push(`Sponsor Logos: ${sponsorLogos.length}`);
    const clientLogos = Array.isArray(g.clientLogos) ? g.clientLogos : [];
    if (clientLogos.length) parts.push(`Client Logos: ${clientLogos.length}`);

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
