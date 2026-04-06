/**
 * Scheduled Research Trigger
 * Cron handler that queries due research_schedules and fires brand-research for each.
 * Designed to be invoked daily by pg_cron at 9 AM UTC.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: 'Service key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const adminSupabase = createClient(supabaseUrl, serviceKey);

  try {
    // Find schedules that are due
    const now = new Date().toISOString();
    const { data: dueSchedules, error: schedError } = await adminSupabase
      .from('research_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now)
      .limit(10); // Process max 10 per invocation

    if (schedError) throw schedError;
    if (!dueSchedules || dueSchedules.length === 0) {
      console.log('[scheduled-research] No due schedules found');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No schedules due' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[scheduled-research] Found ${dueSchedules.length} due schedules`);

    let successCount = 0;
    let failCount = 0;

    for (const schedule of dueSchedules) {
      try {
        // Get a user with admin access to this org for auth context
        let userId = schedule.created_by;
        if (!userId && schedule.organization_id) {
          const { data: member } = await adminSupabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', schedule.organization_id)
            .in('role', ['owner', 'admin'])
            .limit(1)
            .single();
          userId = member?.user_id;
        }

        if (!userId) {
          console.warn(`[scheduled-research] No user found for schedule ${schedule.id}, skipping`);
          failCount++;
          continue;
        }

        // Create a job record directly (bypass auth since this is a system trigger)
        const { data: job, error: jobError } = await adminSupabase
          .from('brand_intelligence_jobs')
          .insert({
            entity_id: schedule.entity_id,
            entity_type: schedule.entity_type,
            organization_id: schedule.organization_id,
            user_id: userId,
            status: 'pending',
            progress: 0,
          })
          .select('id')
          .single();

        if (jobError || !job) {
          console.error(`[scheduled-research] Failed to create job for ${schedule.entity_id}:`, jobError);
          failCount++;
          continue;
        }

        // Invoke the brand-research function via HTTP (self-call)
        // We use the service role key since this is system-initiated
        const response = await fetch(`${supabaseUrl}/functions/v1/brand-research`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            // Use service role via a special impersonation header
            'x-supabase-service-role': serviceKey,
          },
          body: JSON.stringify({
            entityId: schedule.entity_id,
            entityType: schedule.entity_type,
            briefingType: schedule.briefing_type || 'weekly',
            focusAreas: [],
            _systemTriggered: true,
            _userId: userId,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error(`[scheduled-research] brand-research call failed for ${schedule.entity_id}:`, text);
          failCount++;
          continue;
        }

        await response.text(); // consume body

        // Calculate next run
        const nextRun = new Date();
        switch (schedule.cadence) {
          case 'weekly':
            nextRun.setDate(nextRun.getDate() + 7);
            break;
          case 'biweekly':
            nextRun.setDate(nextRun.getDate() + 14);
            break;
          case 'monthly':
          default:
            nextRun.setMonth(nextRun.getMonth() + 1);
            break;
        }

        // Update schedule
        await adminSupabase
          .from('research_schedules')
          .update({
            last_run_at: now,
            next_run_at: nextRun.toISOString(),
          })
          .eq('id', schedule.id);

        successCount++;
        console.log(`[scheduled-research] Triggered for ${schedule.entity_type}:${schedule.entity_id}`);
      } catch (err) {
        console.error(`[scheduled-research] Error processing schedule ${schedule.id}:`, err);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueSchedules.length,
        succeeded: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scheduled-research] Error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
