import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RestoreRequest {
  backupPath: string;
  organizationId: string;
  restoreOptions?: {
    brands?: boolean;
    products?: boolean;
    events?: boolean;
    overwrite?: boolean; // If true, overwrites existing data; if false, skips existing
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
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

    const body: RestoreRequest = await req.json();
    const { backupPath, organizationId, restoreOptions = {} } = body;

    if (!backupPath || !organizationId) {
      return new Response(
        JSON.stringify({ success: false, error: "backupPath and organizationId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is org admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      _user_id: user.id,
      _org_id: organizationId
    });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Must be organization admin to restore backups" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download backup file
    const { data: backupFile, error: downloadError } = await supabase.storage
      .from('brand-backups')
      .download(backupPath);

    if (downloadError || !backupFile) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to download backup: ${downloadError?.message}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const backupText = await backupFile.text();
    const backupData = JSON.parse(backupText);

    // Validate backup format
    if (!backupData.version || !backupData.data) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid backup format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      brands: restoreBrands = true,
      products: restoreProducts = true,
      events: restoreEvents = true,
      overwrite = false,
    } = restoreOptions;

    const results = {
      brands: { restored: 0, skipped: 0, errors: 0 },
      products: { restored: 0, skipped: 0, errors: 0 },
      events: { restored: 0, skipped: 0, errors: 0 },
    };

    // Restore brands
    if (restoreBrands && backupData.data.brands) {
      for (const brand of backupData.data.brands) {
        try {
          // Check if brand already exists
          const { data: existing } = await supabase
            .from('brands')
            .select('id')
            .eq('id', brand.id)
            .single();

          if (existing && !overwrite) {
            results.brands.skipped++;
            continue;
          }

          const brandData = {
            ...brand,
            organization_id: organizationId,
            updated_at: new Date().toISOString(),
          };

          if (existing && overwrite) {
            const { error } = await supabase
              .from('brands')
              .update(brandData)
              .eq('id', brand.id);
            
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('brands')
              .insert(brandData);
            
            if (error) throw error;
          }

          results.brands.restored++;
        } catch (err) {
          console.error(`Failed to restore brand ${brand.id}:`, err);
          results.brands.errors++;
        }
      }
    }

    // Restore products
    if (restoreProducts && backupData.data.products) {
      for (const product of backupData.data.products) {
        try {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('id', product.id)
            .single();

          if (existing && !overwrite) {
            results.products.skipped++;
            continue;
          }

          const productData = {
            ...product,
            organization_id: organizationId,
            updated_at: new Date().toISOString(),
          };

          if (existing && overwrite) {
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('id', product.id);
            
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('products')
              .insert(productData);
            
            if (error) throw error;
          }

          results.products.restored++;
        } catch (err) {
          console.error(`Failed to restore product ${product.id}:`, err);
          results.products.errors++;
        }
      }
    }

    // Restore events
    if (restoreEvents && backupData.data.events) {
      for (const event of backupData.data.events) {
        try {
          const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('id', event.id)
            .single();

          if (existing && !overwrite) {
            results.events.skipped++;
            continue;
          }

          const eventData = {
            ...event,
            organization_id: organizationId,
            updated_at: new Date().toISOString(),
          };

          if (existing && overwrite) {
            const { error } = await supabase
              .from('events')
              .update(eventData)
              .eq('id', event.id);
            
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('events')
              .insert(eventData);
            
            if (error) throw error;
          }

          results.events.restored++;
        } catch (err) {
          console.error(`Failed to restore event ${event.id}:`, err);
          results.events.errors++;
        }
      }
    }

    const totalRestored = results.brands.restored + results.products.restored + results.events.restored;
    const totalErrors = results.brands.errors + results.products.errors + results.events.errors;

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        message: `Restored ${totalRestored} items${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`,
        results,
        backupInfo: {
          version: backupData.version,
          createdAt: backupData.createdAt,
          originalCounts: backupData.counts,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Restore error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Restore failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
