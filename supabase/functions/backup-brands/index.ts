import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { verifyServiceRoleOrUser } from "../_shared/internalAuth.ts";

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
    // SECURITY: every caller must present either a valid user JWT (manual
    // backups from the app) or the service-role bearer (scheduled jobs invoked
    // by other edge functions / cron). Previously the function bypassed auth
    // entirely when `backupType !== 'manual'`, letting any anonymous request
    // dump an org's data.
    const gate = await verifyServiceRoleOrUser(req, corsHeaders);
    if (!gate.ok) return gate.response;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let organizationId: string | undefined;
    let backupType: 'scheduled' | 'manual' = 'manual';
    let userId: string | undefined;

    if (req.method === "POST") {
      const body: BackupRequest = await req.json().catch(() => ({}));
      organizationId = body.organizationId;
      backupType = body.backupType || 'manual';
    }

    if (gate.auth.kind === 'user') {
      userId = gate.auth.userId;
      // Manual backups must still pass org-membership checks.
      if (organizationId) {
        const { data: isMember } = await supabase.rpc('is_org_member', {
          _user_id: userId,
          _org_id: organizationId,
        });
        if (!isMember) {
          return new Response(
            JSON.stringify({ success: false, error: "Must be organization member to create backups" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }


    if (!organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: "Organization ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization info
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', organizationId)
      .single();
    
    if (orgError || !org) {
      return new Response(
        JSON.stringify({ success: false, error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting backup for org: ${org.slug}`);

    // Fetch ONLY metadata, not the full guide_data
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, slug, is_public, is_favorite, created_at, updated_at')
      .eq('organization_id', organizationId);

    if (brandsError) throw brandsError;

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, is_public, is_favorite, parent_brand_id, created_at, updated_at')
      .eq('organization_id', organizationId);

    if (productsError) throw productsError;

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, slug, is_public, is_favorite, parent_brand_id, created_at, updated_at')
      .eq('organization_id', organizationId);

    if (eventsError) throw eventsError;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create manifest backup (metadata only)
    const manifestData = {
      version: '2.0',
      type: 'manifest',
      createdAt: new Date().toISOString(),
      backupType,
      organization: { id: org.id, name: org.name, slug: org.slug },
      manifest: {
        brands: (brands || []).map(b => ({ id: b.id, name: b.name, slug: b.slug })),
        products: (products || []).map(p => ({ id: p.id, name: p.name, slug: p.slug, parent_brand_id: p.parent_brand_id })),
        events: (events || []).map(e => ({ id: e.id, name: e.name, slug: e.slug, parent_brand_id: e.parent_brand_id })),
      },
      counts: {
        brands: brands?.length || 0,
        products: products?.length || 0,
        events: events?.length || 0,
      },
      note: 'Full guide data backed up separately per-brand. Use restore endpoint to restore.'
    };

    const manifestJson = JSON.stringify(manifestData);
    const manifestPath = `${org.id}/${timestamp}/manifest.json`;

    console.log(`Uploading manifest: ${manifestPath}`);

    // Upload manifest
    const { error: uploadError } = await supabase.storage
      .from('brand-backups')
      .upload(manifestPath, manifestJson, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      console.error('Manifest upload error:', uploadError);
      throw uploadError;
    }

    // Now backup each brand individually (with full guide_data)
    let totalSize = manifestJson.length;
    
    for (const brand of (brands || [])) {
      try {
        const { data: fullBrand, error } = await supabase
          .from('brands')
          .select('*')
          .eq('id', brand.id)
          .single();
        
        if (error) {
          console.error(`Failed to fetch brand ${brand.id}:`, error);
          continue;
        }

        const brandJson = JSON.stringify(fullBrand);
        const brandPath = `${org.id}/${timestamp}/brands/${brand.id}.json`;
        
        const { error: brandUploadError } = await supabase.storage
          .from('brand-backups')
          .upload(brandPath, brandJson, {
            contentType: 'application/json',
            upsert: true,
          });
        
        if (brandUploadError) {
          console.error(`Failed to upload brand ${brand.id}:`, brandUploadError);
        } else {
          totalSize += brandJson.length;
          console.log(`Backed up brand: ${brand.name} (${brandJson.length} bytes)`);
        }
      } catch (e) {
        console.error(`Error backing up brand ${brand.id}:`, e);
      }
    }

    // Backup products individually
    for (const product of (products || [])) {
      try {
        const { data: fullProduct, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', product.id)
          .single();
        
        if (error) continue;

        const productJson = JSON.stringify(fullProduct);
        const productPath = `${org.id}/${timestamp}/products/${product.id}.json`;
        
        const { error: productUploadError } = await supabase.storage
          .from('brand-backups')
          .upload(productPath, productJson, { contentType: 'application/json', upsert: true });
        
        if (!productUploadError) {
          totalSize += productJson.length;
        }
      } catch (e) {
        console.error(`Error backing up product ${product.id}:`, e);
      }
    }

    // Backup events individually  
    for (const event of (events || [])) {
      try {
        const { data: fullEvent, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', event.id)
          .single();
        
        if (error) continue;

        const eventJson = JSON.stringify(fullEvent);
        const eventPath = `${org.id}/${timestamp}/events/${event.id}.json`;
        
        const { error: eventUploadError } = await supabase.storage
          .from('brand-backups')
          .upload(eventPath, eventJson, { contentType: 'application/json', upsert: true });
        
        if (!eventUploadError) {
          totalSize += eventJson.length;
        }
      } catch (e) {
        console.error(`Error backing up event ${event.id}:`, e);
      }
    }

    // Record in backup_history
    const { error: historyError } = await supabase
      .from('backup_history')
      .insert({
        organization_id: org.id,
        backup_type: backupType,
        backup_path: manifestPath,
        brands_count: brands?.length || 0,
        products_count: products?.length || 0,
        file_size_bytes: totalSize,
        created_by: userId || null,
        status: 'completed',
      });

    if (historyError) {
      console.error('Failed to record backup history:', historyError);
    }

    console.log(`Backup completed: ${brands?.length || 0} brands, ${products?.length || 0} products, ${events?.length || 0} events (${totalSize} bytes total)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backed up ${brands?.length || 0} brands, ${products?.length || 0} products, ${events?.length || 0} events`,
        backupPath: manifestPath,
        totalSize,
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
