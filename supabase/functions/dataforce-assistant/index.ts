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

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      }
    }

    // Get DataForce config for persona
    const { data: config } = await supabase
      .from('dataforce_config')
      .select('assistant_persona')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const persona = config?.assistant_persona || `You are a helpful brand assistant for ${entityName}. You help users understand and apply brand guidelines correctly.`;

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
  const sections: string[] = [`Brand/Entity: ${entityName}`];
  
  const hero = guideData.hero as any;
  if (hero) {
    if (hero.tagline) sections.push(`Tagline: ${hero.tagline}`);
  }

  const identity = guideData.identity as any;
  if (identity) {
    if (identity.mission) sections.push(`Mission: ${identity.mission}`);
    if (identity.vision) sections.push(`Vision: ${identity.vision}`);
    if (identity.archetype) sections.push(`Brand Archetype: ${identity.archetype}`);
  }

  const voice = guideData.voice as any;
  if (voice) {
    if (voice.tone) sections.push(`Tone: ${voice.tone}`);
    if (voice.personality) sections.push(`Personality: ${voice.personality}`);
  }

  const colors = guideData.colors as any;
  if (colors) {
    if (colors.primary) sections.push(`Primary Color: ${colors.primary}`);
    if (colors.secondary) sections.push(`Secondary Color: ${colors.secondary}`);
  }

  const values = guideData.values as any;
  if (Array.isArray(values) && values.length > 0) {
    const valueNames = values.map((v: any) => v.title || v.name).filter(Boolean).join(', ');
    if (valueNames) sections.push(`Core Values: ${valueNames}`);
  }

  return sections.join('\n');
}
