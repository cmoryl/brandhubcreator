/**
 * DataForce GenAI Brand Training Edge Function
 * Manages AI model training jobs for brand-specific content generation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TrainingRequest {
  organization_id: string;
  entity_type?: 'brand' | 'product' | 'event';
  entity_id?: string;
  training_type: 'voice' | 'visual' | 'content';
  training_config?: {
    base_model?: string;
    learning_rate?: number;
    epochs?: number;
    custom_prompts?: string[];
  };
}

interface GenerateRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  prompt: string;
  content_type: 'tagline' | 'description' | 'social_post' | 'email' | 'blog';
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
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'start_training';

    if (action === 'generate') {
      return handleGenerate(req, supabase, user, LOVABLE_API_KEY, DATAFORCE_API_KEY);
    }

    // Default: start training
    const body: TrainingRequest = await req.json();
    const { 
      organization_id, 
      entity_type, 
      entity_id, 
      training_type,
      training_config
    } = body;

    if (!organization_id || !training_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify organization admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get DataForce config
    const { data: config } = await supabase
      .from('dataforce_config')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const isDemo = !config || config.api_mode === 'demo';

    // Get entity data for training
    let entityData = null;
    if (entity_type && entity_id) {
      const tableName = entity_type === 'brand' ? 'brands' : entity_type === 'product' ? 'products' : 'events';
      const { data } = await supabase
        .from(tableName)
        .select('name, guide_data')
        .eq('id', entity_id)
        .single();
      entityData = data;
    }

    // Calculate samples from guide data
    const samplesAvailable = countTrainingSamples(entityData?.guide_data || {}, training_type);

    // Create training job
    const { data: job, error: jobError } = await supabase
      .from('dataforce_training_jobs')
      .insert({
        organization_id,
        entity_type,
        entity_id,
        training_type,
        status: isDemo ? 'completed' : 'collecting',
        samples_collected: isDemo ? samplesAvailable : 0,
        samples_target: training_config?.epochs ? training_config.epochs * 10 : 100,
        training_config: training_config || {
          baseModel: config?.training_model_base || 'gemini-3-flash-preview',
          learningRate: 0.001,
          epochs: 10,
          batchSize: 8
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create training job: ${jobError.message}`);
    }

    let metrics = null;

    if (isDemo) {
      // Demo mode - generate simulated training results
      metrics = {
        accuracy: 0.85 + Math.random() * 0.1,
        loss: 0.15 + Math.random() * 0.1,
        validationScore: 0.82 + Math.random() * 0.12,
        brandAlignmentScore: 0.88 + Math.random() * 0.1,
        sampleUtilization: 0.95
      };

      await supabase
        .from('dataforce_training_jobs')
        .update({
          status: 'completed',
          model_id: `demo-${training_type}-${Date.now()}`,
          metrics,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Update config with training info
      await supabase
        .from('dataforce_config')
        .update({
          training_voice_samples: samplesAvailable,
          training_last_sync_at: new Date().toISOString(),
        })
        .eq('organization_id', organization_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: isDemo ? 'completed' : 'collecting',
        trainingType: training_type,
        samplesCollected: isDemo ? samplesAvailable : 0,
        samplesTarget: training_config?.epochs ? training_config.epochs * 10 : 100,
        metrics,
        isDemo,
        estimatedCompletion: isDemo ? null : calculateTrainingTime(samplesAvailable),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Training error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Training failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGenerate(
  req: Request, 
  supabase: any, 
  user: any,
  LOVABLE_API_KEY: string | undefined,
  DATAFORCE_API_KEY: string | undefined
): Promise<Response> {
  const body: GenerateRequest = await req.json();
  const { organization_id, entity_type, entity_id, prompt, content_type } = body;

  if (!organization_id || !entity_type || !entity_id || !prompt) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if in demo mode
  const { data: config } = await supabase
    .from('dataforce_config')
    .select('api_mode')
    .eq('organization_id', organization_id)
    .maybeSingle();

  const isDemo = !config || config.api_mode === 'demo';

  // If no AI key available, return demo content
  if (!LOVABLE_API_KEY && !DATAFORCE_API_KEY) {
    return new Response(
      JSON.stringify({
        success: true,
        content: generateDemoContent(content_type, prompt),
        contentType: content_type,
        isDemo: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get entity data
  const tableName = entity_type === 'brand' ? 'brands' : entity_type === 'product' ? 'products' : 'events';
  const { data: entity } = await supabase
    .from(tableName)
    .select('name, guide_data')
    .eq('id', entity_id)
    .single();

  if (!entity) {
    return new Response(
      JSON.stringify({ success: false, error: 'Entity not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const guideData = entity.guide_data || {};
  const voiceContext = buildVoiceContext(guideData, entity.name);
  
  const contentTypePrompts: Record<string, string> = {
    tagline: 'Create a memorable tagline (under 10 words)',
    description: 'Write a compelling brand description (2-3 sentences)',
    social_post: 'Write an engaging social media post (under 280 characters)',
    email: 'Write a professional email introduction paragraph',
    blog: 'Write an engaging blog post introduction (2-3 paragraphs)'
  };

  const systemPrompt = `You are a brand content writer trained specifically for ${entity.name}.

${voiceContext}

Your task: ${contentTypePrompts[content_type] || prompt}

Guidelines:
- Match the brand's established voice and tone exactly
- Use vocabulary consistent with the brand's identity
- Maintain the brand's personality in every word
- Create content that feels authentically on-brand`;

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
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI credits exhausted' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw new Error(`AI request failed: ${response.status}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content || '';

  return new Response(
    JSON.stringify({
      success: true,
      content,
      contentType: content_type,
      entityName: entity.name,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function countTrainingSamples(guideData: Record<string, unknown>, type: string): number {
  let count = 0;
  
  if (type === 'voice' || type === 'content') {
    const identity = guideData.identity as any || {};
    const voice = guideData.voice as any || {};
    const messaging = guideData.messaging as any || {};
    
    if (identity.mission) count += 5;
    if (identity.vision) count += 5;
    if (voice.tone) count += 10;
    if (voice.personality) count += 10;
    if (messaging.taglines) count += (messaging.taglines as any[])?.length * 3 || 0;
  }
  
  if (type === 'visual') {
    const colors = guideData.colors as any || {};
    const logos = guideData.logos as any || {};
    
    if (colors.primary) count += 5;
    if (colors.secondary) count += 5;
    if (logos.primary) count += 10;
    if (logos.variations) count += Object.keys(logos.variations || {}).length * 5;
  }
  
  return Math.max(count, 20);
}

function buildVoiceContext(guideData: Record<string, unknown>, entityName: string): string {
  const sections: string[] = [];
  
  const voice = guideData.voice as any;
  if (voice) {
    if (voice.tone) sections.push(`Brand Tone: ${voice.tone}`);
    if (voice.personality) sections.push(`Personality: ${voice.personality}`);
    if (voice.vocabulary) sections.push(`Vocabulary Style: ${voice.vocabulary}`);
  }

  const identity = guideData.identity as any;
  if (identity) {
    if (identity.mission) sections.push(`Mission: ${identity.mission}`);
    if (identity.archetype) sections.push(`Brand Archetype: ${identity.archetype}`);
  }

  const values = guideData.values as any;
  if (Array.isArray(values) && values.length > 0) {
    const valueNames = values.map((v: any) => v.title || v.name).filter(Boolean);
    if (valueNames.length > 0) sections.push(`Core Values: ${valueNames.join(', ')}`);
  }

  return sections.length > 0 
    ? `Brand Voice Profile for ${entityName}:\n${sections.join('\n')}`
    : `Brand: ${entityName}`;
}

function calculateTrainingTime(samples: number): string {
  const minutesNeeded = Math.ceil(samples / 10) * 15;
  const completionDate = new Date();
  completionDate.setMinutes(completionDate.getMinutes() + minutesNeeded);
  return completionDate.toISOString();
}

function generateDemoContent(contentType: string, prompt: string): string {
  const demoContents: Record<string, string> = {
    tagline: '✨ Demo Mode: "Your Brand, Amplified" — Activate DataForce for custom AI-generated taglines.',
    description: '📝 Demo Mode: This is a placeholder brand description. When DataForce is activated with your API key, the AI will generate compelling, on-brand descriptions tailored to your unique voice and messaging guidelines.',
    social_post: '🚀 Demo Mode: [Your engaging social post here] — Connect DataForce to generate authentic social content that matches your brand voice. #BrandHub',
    email: '📧 Demo Mode:\n\nDear Valued Customer,\n\nThis is a placeholder email introduction. Activate DataForce to generate personalized, on-brand email content that resonates with your audience.\n\nBest regards,\nYour Brand Team',
    blog: '📖 Demo Mode:\n\n## Your Blog Post Title Here\n\nThis is demo content. When you activate DataForce with your API credentials, the AI will generate compelling blog introductions that match your brand voice, incorporate your key messages, and engage your target audience effectively.\n\nThe content will be tailored to your specific brand guidelines and tone of voice.'
  };
  
  return demoContents[contentType] || `Demo Mode: Generated content for "${prompt}" would appear here. Activate DataForce for AI-powered content generation.`;
}
