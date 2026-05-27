import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { requireServiceRole } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Process backup queue - handles pending backup jobs asynchronously.
 * Server-to-server only: invoked by queue-backup with the service-role bearer
 * (or by Supabase cron). Public callers are rejected.
 *
 * Flow:
 * 1. Find pending jobs that are ready to run (scheduled_for <= now or null)
 * 2. Mark them as 'processing'
 * 3. Perform the backup
 * 4. Update status to 'completed' or 'failed'
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: previously this endpoint had zero auth, letting any anonymous
  // caller process the backup queue with service-role credentials.
  const denied = requireServiceRole(req, corsHeaders);
  if (denied) return denied;

  const startTime = Date.now();
  const maxProcessingTime = 55000; // 55 seconds to stay under edge function limits

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);


    // Parse optional params
    let jobId: string | undefined;
    let limit = 3; // Process up to 3 jobs per invocation

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      jobId = body.jobId;
      limit = body.limit || 3;
    }

    // Find pending jobs ready to process
    let query = supabase
      .from('backup_jobs')
      .select('*')
      .eq('status', 'pending')
      .or('scheduled_for.is.null,scheduled_for.lte.now()')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (jobId) {
      query = supabase
        .from('backup_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'pending')
        .limit(1);
    }

    const { data: pendingJobs, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch pending jobs: ${fetchError.message}`);
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending jobs to process', processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingJobs.length} backup jobs`);

    const results: Array<{ jobId: string; success: boolean; error?: string }> = [];

    for (const job of pendingJobs) {
      // Check if we're running out of time
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('Approaching timeout, stopping processing');
        break;
      }

      try {
        // Mark as processing
        await supabase
          .from('backup_jobs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', job.id);

        // Get organization info
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('id', job.organization_id)
          .single();

        if (orgError || !org) {
          throw new Error('Organization not found');
        }

        console.log(`Starting backup for org: ${org.slug}`);

        // Fetch all data
        const { data: brands, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .eq('organization_id', job.organization_id);

        if (brandsError) throw brandsError;

        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('organization_id', job.organization_id);

        if (productsError) throw productsError;

        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', job.organization_id);

        if (eventsError) throw eventsError;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create backup data
        const backupData = {
          version: '2.0',
          type: 'full',
          createdAt: new Date().toISOString(),
          backupType: job.job_type,
          jobId: job.id,
          organization: { id: org.id, name: org.name, slug: org.slug },
          data: {
            brands: brands || [],
            products: products || [],
            events: events || [],
          },
          counts: {
            brands: brands?.length || 0,
            products: products?.length || 0,
            events: events?.length || 0,
          }
        };

        const backupJson = JSON.stringify(backupData);
        const backupPath = `${org.id}/${timestamp}/backup.json`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('brand-backups')
          .upload(backupPath, backupJson, {
            contentType: 'application/json',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Mark job as completed
        await supabase
          .from('backup_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            backup_path: backupPath,
            brands_count: brands?.length || 0,
            products_count: products?.length || 0,
            events_count: events?.length || 0,
            file_size_bytes: backupJson.length,
          })
          .eq('id', job.id);

        // Also add to backup_history for backwards compatibility
        await supabase
          .from('backup_history')
          .insert({
            organization_id: org.id,
            backup_type: job.job_type,
            backup_path: backupPath,
            brands_count: brands?.length || 0,
            products_count: products?.length || 0,
            file_size_bytes: backupJson.length,
            created_by: job.created_by,
            status: 'completed',
          });

        console.log(`Completed backup job ${job.id}: ${brands?.length || 0} brands, ${products?.length || 0} products, ${events?.length || 0} events`);
        
        results.push({ jobId: job.id, success: true });
      } catch (jobError) {
        console.error(`Failed to process job ${job.id}:`, jobError);
        
        // Mark job as failed
        await supabase
          .from('backup_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: jobError instanceof Error ? jobError.message : 'Unknown error',
          })
          .eq('id', job.id);

        results.push({ 
          jobId: job.id, 
          success: false, 
          error: jobError instanceof Error ? jobError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} jobs: ${successCount} succeeded, ${failCount} failed`,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Queue processor error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Queue processing failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
