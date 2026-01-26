import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupRequest {
  organizationId?: string;
  backupType?: 'scheduled' | 'manual';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    let organizationId: string | undefined;
    let backupType: 'scheduled' | 'manual' = 'manual';
    let userId: string | undefined;

    // Check if this is a scheduled call (no auth) or manual (with auth)
    const authHeader = req.headers.get("Authorization");
    
    if (req.method === "POST") {
      const body: BackupRequest = await req.json().catch(() => ({}));
      organizationId = body.organizationId;
      backupType = body.backupType || 'manual';
    }

    // For manual backups, verify the user has permission
    if (backupType === 'manual' && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;

      // Verify user is org admin
      if (organizationId) {
        const { data: isAdmin } = await supabase.rpc('is_org_admin', {
          _user_id: userId,
          _org_id: organizationId
        });
        
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ success: false, error: "Must be organization admin to create backups" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Get organizations to backup
    let orgsToBackup: { id: string; name: string; slug: string }[] = [];
    
    if (organizationId) {
      // Single org backup
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', organizationId)
        .single();
      
      if (error || !org) {
        return new Response(
          JSON.stringify({ success: false, error: "Organization not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      orgsToBackup = [org];
    } else {
      // Scheduled backup - backup all organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, slug');
      
      if (error) {
        throw new Error(`Failed to fetch organizations: ${error.message}`);
      }
      orgsToBackup = orgs || [];
    }

    const results: { organizationId: string; success: boolean; backupPath?: string; error?: string }[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const org of orgsToBackup) {
      try {
        // Fetch all brands for this organization
        const { data: brands, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .eq('organization_id', org.id);

        if (brandsError) throw brandsError;

        // Fetch all products for this organization
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('organization_id', org.id);

        if (productsError) throw productsError;

        // Fetch all events for this organization
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('organization_id', org.id);

        if (eventsError) throw eventsError;

        // Create backup object
        const backupData = {
          version: '1.0',
          createdAt: new Date().toISOString(),
          backupType,
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
          },
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

        const backupJson = JSON.stringify(backupData, null, 2);
        const backupPath = `${org.id}/${timestamp}/backup.json`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('brand-backups')
          .upload(backupPath, backupJson, {
            contentType: 'application/json',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Record in backup_history
        const { error: historyError } = await supabase
          .from('backup_history')
          .insert({
            organization_id: org.id,
            backup_type: backupType,
            backup_path: backupPath,
            brands_count: brands?.length || 0,
            products_count: products?.length || 0,
            file_size_bytes: new Blob([backupJson]).size,
            created_by: userId || null,
            status: 'completed',
          });

        if (historyError) {
          console.error('Failed to record backup history:', historyError);
        }

        results.push({
          organizationId: org.id,
          success: true,
          backupPath,
        });

        console.log(`Backup completed for org ${org.slug}: ${brands?.length || 0} brands, ${products?.length || 0} products`);
      } catch (orgError) {
        console.error(`Backup failed for org ${org.id}:`, orgError);
        results.push({
          organizationId: org.id,
          success: false,
          error: orgError instanceof Error ? orgError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Backed up ${successCount} organization(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
        results,
        timestamp,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Backup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Backup failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
