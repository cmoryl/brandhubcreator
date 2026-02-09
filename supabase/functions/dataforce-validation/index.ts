/**
 * DataForce Cultural Validation Panel Edge Function
 * Submits brand content for human validation across target regions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ValidationRequest {
  organization_id: string;
  entity_type: 'brand' | 'product' | 'event';
  entity_id: string;
  entity_name: string;
  variant_id?: string;
  target_regions: string[];
  panel_size?: number;
  content_snapshot: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const body: ValidationRequest = await req.json();
    const { 
      organization_id, 
      entity_type, 
      entity_id, 
      entity_name,
      variant_id,
      target_regions,
      panel_size = 10,
      content_snapshot
    } = body;

    if (!organization_id || !entity_type || !entity_id || !target_regions?.length) {
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

    // Get DataForce config
    const { data: config } = await supabase
      .from('dataforce_config')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const isDemo = !config || config.api_mode === 'demo';

    // Create validation request
    const { data: request, error: requestError } = await supabase
      .from('dataforce_validation_requests')
      .insert({
        organization_id,
        entity_type,
        entity_id,
        entity_name,
        variant_id,
        target_regions,
        panel_size,
        content_snapshot,
        status: isDemo ? 'completed' : 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (requestError) {
      throw new Error(`Failed to create validation request: ${requestError.message}`);
    }

    let feedbackSummary = null;
    let validationScore = null;

    if (isDemo) {
      // Demo mode - generate simulated feedback
      feedbackSummary = generateDemoFeedback(entity_name, target_regions, content_snapshot);
      validationScore = feedbackSummary.overallRating;

      // Update with demo results
      await supabase
        .from('dataforce_validation_requests')
        .update({
          status: 'completed',
          responses_received: panel_size,
          validation_score: validationScore,
          feedback_summary: feedbackSummary,
          completed_at: new Date().toISOString(),
        })
        .eq('id', request.id);
    } else {
      // Live mode - would submit to DataForce API
      // For now, mark as pending for review
      console.log('Submitting to DataForce validation panel:', {
        requestId: request.id,
        regions: target_regions,
        panelSize: panel_size
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId: request.id,
        status: isDemo ? 'completed' : 'pending',
        validationScore,
        feedbackSummary,
        isDemo,
        estimatedCompletion: isDemo ? null : calculateEstimatedCompletion(panel_size),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Validation request failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDemoFeedback(
  entityName: string, 
  regions: string[], 
  content: Record<string, unknown>
): Record<string, unknown> {
  const regionComments = regions.flatMap(region => [
    {
      region,
      sentiment: Math.random() > 0.3 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      text: getRandomComment(region, entityName),
      category: ['cultural', 'language', 'visual', 'general'][Math.floor(Math.random() * 4)]
    }
  ]);

  const recommendations = [
    `Consider localizing imagery for ${regions[0]} market`,
    'Color palette resonates well across tested regions',
    'Messaging clarity could be improved for non-native speakers',
    'Typography choices are universally accessible',
    `Brand name pronunciation may need guidance for ${regions[regions.length - 1]}`
  ].slice(0, 3 + Math.floor(Math.random() * 2));

  return {
    overallRating: 70 + Math.floor(Math.random() * 25),
    culturalAppropriateness: 75 + Math.floor(Math.random() * 20),
    messagingClarity: 65 + Math.floor(Math.random() * 30),
    visualAppeal: 80 + Math.floor(Math.random() * 15),
    comments: regionComments,
    recommendations,
    panelDemographics: {
      regionsRepresented: regions.length,
      averageAge: 28 + Math.floor(Math.random() * 15),
      genderBalance: '52% Female, 48% Male',
    }
  };
}

function getRandomComment(region: string, entityName: string): string {
  const comments = [
    `The brand messaging for ${entityName} translates well to our local context.`,
    `Color choices are appropriate for the ${region} market.`,
    `Some imagery may need cultural adaptation for local relevance.`,
    `The brand voice feels authentic and trustworthy.`,
    `Typography is clean and readable in our language.`,
    `Logo design is memorable and works well locally.`,
    `Would recommend minor adjustments to tagline for better resonance.`,
    `Overall brand presentation meets local expectations.`
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function calculateEstimatedCompletion(panelSize: number): string {
  const hoursNeeded = Math.ceil(panelSize / 5) * 24; // Rough estimate
  const completionDate = new Date();
  completionDate.setHours(completionDate.getHours() + hoursNeeded);
  return completionDate.toISOString();
}
