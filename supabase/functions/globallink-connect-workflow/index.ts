/**
 * GlobalLink Connect Workflow Edge Function
 * Handles automated translation workflow triggers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WorkflowRequest {
  action: 'trigger' | 'status' | 'cancel' | 'list_templates';
  organization_id: string;
  entity_type?: 'brand' | 'product' | 'event';
  entity_id?: string;
  workflow_template?: string;
  target_languages?: string[];
}

interface WorkflowStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  languages_completed: string[];
  languages_pending: string[];
  started_at: string;
  estimated_completion?: string;
}

// Available workflow templates
const WORKFLOW_TEMPLATES = [
  {
    id: 'quick-translate',
    name: 'Quick Translation',
    description: 'Fast AI translation for review',
    estimated_time: '5 minutes',
    steps: ['extract', 'translate', 'store'],
  },
  {
    id: 'full-localization',
    name: 'Full Localization',
    description: 'Complete cultural adaptation with review',
    estimated_time: '2-4 hours',
    steps: ['extract', 'cultural-analysis', 'translate', 'adapt', 'review', 'store'],
  },
  {
    id: 'batch-update',
    name: 'Batch Update',
    description: 'Update all existing translations when source changes',
    estimated_time: '10-30 minutes',
    steps: ['diff', 'translate-delta', 'merge', 'store'],
  },
  {
    id: 'regional-rollout',
    name: 'Regional Rollout',
    description: 'Deploy to specific regional variants',
    estimated_time: '1-2 hours',
    steps: ['extract', 'translate', 'adapt-regions', 'create-variants', 'store'],
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WorkflowRequest = await req.json();
    const { action, organization_id, entity_type, entity_id, workflow_template, target_languages } = body;

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(
        JSON.stringify({ error: 'Access denied to organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get GlobalLink product config
    const { data: glConfig } = await supabase
      .from('globallink_product_config')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    switch (action) {
      case 'list_templates':
        return new Response(
          JSON.stringify({
            success: true,
            templates: WORKFLOW_TEMPLATES,
            connect_enabled: glConfig?.connect_enabled || false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'trigger':
        if (!entity_type || !entity_id || !workflow_template) {
          return new Response(
            JSON.stringify({ error: 'entity_type, entity_id, and workflow_template are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const template = WORKFLOW_TEMPLATES.find(t => t.id === workflow_template);
        if (!template) {
          return new Response(
            JSON.stringify({ error: 'Invalid workflow template' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get target languages for org
        const { data: languages } = await supabase
          .from('localization_target_languages')
          .select('language_code, language_name')
          .eq('organization_id', organization_id)
          .eq('is_active', true);

        const targetLangs = target_languages || languages?.map(l => l.language_code) || [];

        if (targetLangs.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No target languages configured. Please add languages first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get entity name
        const tableName = entity_type === 'brand' ? 'brands' : entity_type === 'product' ? 'products' : 'events';
        const { data: entity } = await supabase
          .from(tableName)
          .select('name, guide_data')
          .eq('id', entity_id)
          .maybeSingle();

        if (!entity) {
          return new Response(
            JSON.stringify({ error: 'Entity not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create localization jobs for each language
        const jobs = [];
        for (const langCode of targetLangs) {
          const langName = languages?.find(l => l.language_code === langCode)?.language_name || langCode;
          
          const { data: job, error: jobError } = await supabase
            .from('localization_jobs')
            .insert({
              organization_id,
              entity_type,
              entity_id,
              entity_name: entity.name,
              target_language: langCode,
              source_content: entity.guide_data,
              status: 'pending',
              translation_method: template.id === 'quick-translate' ? 'ai' : 'professional',
              submitted_by: user.id,
            })
            .select()
            .single();

          if (!jobError && job) {
            jobs.push({
              id: job.id,
              language: langCode,
              language_name: langName,
              status: 'pending',
            });
          }
        }

        const workflowStatus: WorkflowStatus = {
          id: crypto.randomUUID(),
          status: 'processing',
          progress: 0,
          languages_completed: [],
          languages_pending: targetLangs,
          started_at: new Date().toISOString(),
          estimated_completion: template.estimated_time,
        };

        return new Response(
          JSON.stringify({
            success: true,
            workflow: workflowStatus,
            jobs_created: jobs.length,
            jobs,
            template: template.name,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'status':
        // Get all pending/processing jobs for this org
        const { data: activeJobs } = await supabase
          .from('localization_jobs')
          .select('*')
          .eq('organization_id', organization_id)
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: false });

        return new Response(
          JSON.stringify({
            success: true,
            active_jobs: activeJobs?.length || 0,
            jobs: activeJobs || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'cancel':
        if (!entity_id) {
          return new Response(
            JSON.stringify({ error: 'entity_id is required for cancel' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: cancelError } = await supabase
          .from('localization_jobs')
          .update({ status: 'cancelled' })
          .eq('entity_id', entity_id)
          .eq('organization_id', organization_id)
          .in('status', ['pending', 'processing']);

        if (cancelError) {
          return new Response(
            JSON.stringify({ error: 'Failed to cancel workflow' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Workflow cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[globallink-connect-workflow] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Workflow failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
