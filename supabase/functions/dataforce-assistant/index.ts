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

    // Fetch entity data for context
    let entityContext = '';
    let entityName = 'your organization';
    
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

        // Enrich with document content and social metrics
        try {
          const { fetchDocumentContext, fetchSocialMetricsContext } = await import('../_shared/extractFullBrandContext.ts');
          const [docResult, socialResult] = await Promise.all([
            fetchDocumentContext(supabase, entity_id, entity_type, guideData as Record<string, unknown>, 1500),
            fetchSocialMetricsContext(supabase, entity_id, entity_type),
          ]);
          if (docResult.text) {
            entityContext += `\n${docResult.text}`;
          }
          if (socialResult.text) {
            entityContext += `\n${socialResult.text}`;
          }
        } catch (e) {
          console.error('[dataforce-assistant] Data enrichment error:', e);
        }
      }
    }

    // Get DataForce config for persona and mode
    const { data: config } = await supabase
      .from('dataforce_config')
      .select('assistant_persona, api_mode')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const isDemo = !config || config.api_mode === 'demo';
    const persona = config?.assistant_persona || `You are a helpful brand assistant for ${entityName}. You help users understand and apply brand guidelines correctly.`;

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

    const systemPrompt = `${persona}

${entityContext}
${languageInstruction}

Guidelines for responses:
- Be concise but comprehensive
- Reference specific brand elements when relevant
- Provide practical, actionable advice
- Maintain brand voice and tone
- If you don't have specific information, say so clearly`;

    // Call AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
