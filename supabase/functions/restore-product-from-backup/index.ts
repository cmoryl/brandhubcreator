import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RestoreProductRequest {
  organizationId: string;
  /** Optional explicit backup path (e.g. "{orgId}/{timestamp}/manifest.json"). If omitted, uses latest completed backup_history entry. */
  backupPath?: string;
  /** Product slug to restore (default: "globallink") */
  productSlug?: string;
  /** If true, overwrites the current product row (default true) */
  overwrite?: boolean;
}

async function downloadJsonFromStorage(
  // Supabase edge runtime types can be overly-strict across versions; keep this permissive.
  supabase: any,
  path: string,
): Promise<any> {
  const { data, error } = await supabase.storage.from("brand-backups").download(path);
  if (error || !data) throw new Error(`Failed to download ${path}: ${error?.message ?? "unknown"}`);
  return JSON.parse(await data.text());
}

async function restoreProductRow(params: {
  supabase: any;
  organizationId: string;
  actingUserId: string;
  product: any;
  overwrite: boolean;
}) {
  const { supabase, organizationId, actingUserId, product, overwrite } = params;

  if (!product?.id) throw new Error("Backup product is missing id");

  // Ensure correct org/user ownership on restore, and always keep it visible in the portal
  const productData = {
    ...product,
    organization_id: organizationId,
    user_id: actingUserId,
    is_public: true,
    updated_at: new Date().toISOString(),
  };

  if (overwrite) {
    const { error } = await supabase.from("products").upsert(productData, { onConflict: "id" });
    if (error) throw error;
    return;
  }

  // If not overwriting, only insert if it doesn't exist.
  const { data: existing, error: existingErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", product.id)
    .maybeSingle();
  if (existingErr) throw existingErr;
  if (existing) return;

  const { error } = await supabase.from("products").insert(productData);
  if (error) throw error;
}

/**
 * Restore a single product (by slug) from the latest org backup in the brand-backups bucket.
 * Supports both:
 *  - Chunked backups (manifest.json + /products/{id}.json)
 *  - Legacy backups (backup.json with data.products[])
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RestoreProductRequest = await req.json();
    const organizationId = body.organizationId;
    const productSlug = body.productSlug ?? "globallink";
    const overwrite = body.overwrite ?? true;

    if (!organizationId) {
      return new Response(JSON.stringify({ success: false, error: "organizationId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is org admin
    const { data: isAdmin, error: isAdminError } = await supabase.rpc("is_org_admin", {
      _user_id: user.id,
      _org_id: organizationId,
    });
    if (isAdminError) throw isAdminError;
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Must be organization admin to restore backups" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve backupPath (latest completed) if missing
    let backupPath = body.backupPath;
    if (!backupPath) {
      const { data: backups, error } = await supabase
        .from("backup_history")
        .select("backup_path, created_at")
        .eq("organization_id", organizationId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      backupPath = backups?.[0]?.backup_path;
    }

    if (!backupPath) throw new Error("No completed backups found for organization");

    // Try as manifest first (chunked v2.1)
    let restoredFrom: "chunked" | "legacy" = "legacy";
    let restoredProductId: string | null = null;

    if (backupPath.endsWith("/manifest.json")) {
      const manifest = await downloadJsonFromStorage(supabase, backupPath);
      const isChunked = manifest?.type === "chunked-manifest" || manifest?.version === "2.1";

      if (isChunked) {
        restoredFrom = "chunked";
        const basePath = backupPath.replace("/manifest.json", "");
        const productRefs: Array<{ id: string }> = manifest?.manifest?.products ?? [];

        // Download product JSONs until we find the requested slug
        for (const ref of productRefs) {
          if (!ref?.id) continue;
          const productPath = `${basePath}/products/${ref.id}.json`;
          try {
            const productJson = await downloadJsonFromStorage(supabase, productPath);
            if (productJson?.slug === productSlug) {
              await restoreProductRow({
                supabase,
                organizationId,
                actingUserId: user.id,
                product: productJson,
                overwrite,
              });
              restoredProductId = productJson.id;
              break;
            }
          } catch {
            // ignore per-item download failures
          }
        }
      }
    }

    // Fallback: legacy backup.json
    if (!restoredProductId) {
      const legacyPath = backupPath.endsWith("/manifest.json")
        ? backupPath.replace("/manifest.json", "/backup.json")
        : backupPath;

      const legacyBackup = await downloadJsonFromStorage(supabase, legacyPath);
      const products: any[] = legacyBackup?.data?.products ?? [];
      const product = products.find((p) => p?.slug === productSlug);
      if (!product) {
        throw new Error(`Product with slug "${productSlug}" not found in backup`);
      }

      await restoreProductRow({
        supabase,
        organizationId,
        actingUserId: user.id,
        product,
        overwrite,
      });
      restoredFrom = "legacy";
      restoredProductId = product.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        restoredFrom,
        backupPath,
        productSlug,
        restoredProductId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("restore-product-from-backup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Restore failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
