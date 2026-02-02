import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QueueBackupRequest {
  organizationId: string;
  jobType?: 'manual' | 'scheduled';
  scheduledFor?: string; // ISO date string for scheduled backups
}

/**
 * Queue a backup job for async processing.
 * Returns immediately with job ID - actual backup happens via process-backup-queue.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: QueueBackupRequest = await req.json();
    const { organizationId, jobType = 'manual', scheduledFor } = body;

    if (!organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: "Organization ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is org member
    const { data: isMember } = await supabase.rpc('is_org_member', {
      _user_id: user.id,
      _org_id: organizationId
    });

    if (!isMember) {
      return new Response(
        JSON.stringify({ success: false, error: "Must be organization member to create backups" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending/processing job for this org
    const { data: existingJobs } = await supabase
      .from('backup_jobs')
      .select('id, status, created_at')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingJobs && existingJobs.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "A backup is already in progress or queued",
          existingJobId: existingJobs[0].id,
          status: existingJobs[0].status,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the job
    const { data: job, error: insertError } = await supabase
      .from('backup_jobs')
      .insert({
        organization_id: organizationId,
        job_type: jobType,
        scheduled_for: scheduledFor || null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create backup job:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to queue backup" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Queued backup job ${job.id} for org ${organizationId}`);

    // For immediate backups (not scheduled), trigger processing
    if (!scheduledFor) {
      // Fire and forget - don't wait for response
      const processUrl = `${supabaseUrl}/functions/v1/process-backup-queue`;
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      }).catch(err => {
        console.error('Failed to trigger queue processor:', err);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: scheduledFor 
          ? `Backup scheduled for ${scheduledFor}`
          : 'Backup queued and processing',
        jobId: job.id,
        status: job.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Queue backup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to queue backup",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
