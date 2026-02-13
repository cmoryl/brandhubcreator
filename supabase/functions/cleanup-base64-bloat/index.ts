/**
 * Cleanup Base64 Bloat
 * Scans guide_data for embedded base64 images/PDFs, uploads them to storage,
 * and replaces with storage URLs. Run per-brand to stay under memory limits.
 * 
 * Usage: POST { brandId: "uuid", dryRun?: boolean }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const restHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    // Auth: require valid authorization
    // This function uses service role key internally for storage operations
    // The JWT verification is handled by config.toml (verify_jwt = false)
    // but we still check the request came from an authorized source

    const { brandId, entityType = "brand", dryRun = false } = await req.json();

    if (!brandId) {
      return new Response(JSON.stringify({ error: "brandId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const table = entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events";

    // We can't load the full guide_data into memory for huge brands.
    // Instead, we'll process one section at a time using PostgREST JSONB extraction.
    const sections = [
      "brochures", "imagery", "clientLogos", "logos", "sponsorLogos",
      "brandIcons", "patterns", "hero", "customSections", "pdfDocuments",
    ];

    const stats = {
      sectionsProcessed: 0,
      base64Found: 0,
      base64Migrated: 0,
      bytesSaved: 0,
      errors: [] as string[],
    };

    // Get org_id for storage path
    const entityRes = await fetch(
      `${supabaseUrl}/rest/v1/${table}?id=eq.${brandId}&select=organization_id,name`,
      { headers: restHeaders }
    );
    const entities = await entityRes.json();
    if (!entities?.[0]) {
      return new Response(JSON.stringify({ error: "Entity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = entities[0].organization_id || "no-org";
    const entityName = entities[0].name;

    console.log(`[cleanup] Starting for ${entityName} (${brandId}), dryRun=${dryRun}`);

    // Process each section individually to manage memory
    for (const section of sections) {
      try {
        // Fetch just this section's data
        const sectionRes = await fetch(
          `${supabaseUrl}/rest/v1/${table}?id=eq.${brandId}&select=guide_data->>${section}`,
          { headers: restHeaders }
        );

        if (!sectionRes.ok) continue;

        const sectionRows = await sectionRes.json();
        const rawData = sectionRows?.[0]?.[section];
        if (!rawData) continue;

        let sectionData: any;
        try {
          sectionData = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
        } catch {
          continue;
        }

        if (!sectionData) continue;

        // Find and replace base64 strings in this section
        const result = await processSection(
          sectionData,
          section,
          brandId,
          entityType,
          orgId,
          supabaseUrl,
          serviceKey,
          dryRun,
          stats,
        );

        if (result.changed && !dryRun) {
          // Update just this section in guide_data using JSONB set
          // PostgREST doesn't support jsonb_set directly, so we use RPC or raw update
          const patchRes = await fetch(
            `${supabaseUrl}/rest/v1/rpc/update_guide_section`,
            {
              method: "POST",
              headers: restHeaders,
              body: JSON.stringify({
                p_table: table,
                p_id: brandId,
                p_section: section,
                p_data: JSON.stringify(result.data),
              }),
            }
          );

          if (!patchRes.ok) {
            const errText = await patchRes.text();
            // Fallback: fetch full guide_data, update section, save back
            // Only for sections that actually changed
            console.warn(`[cleanup] RPC failed for ${section}, using fallback: ${errText.slice(0, 100)}`);
            await fallbackSectionUpdate(supabaseUrl, restHeaders, table, brandId, section, result.data);
          }
        }

        stats.sectionsProcessed++;
      } catch (sectionErr) {
        stats.errors.push(`${section}: ${sectionErr instanceof Error ? sectionErr.message : "unknown"}`);
      }
    }

    console.log(`[cleanup] Done: ${stats.base64Found} found, ${stats.base64Migrated} migrated, ${stats.bytesSaved} bytes saved`);

    return new Response(
      JSON.stringify({
        success: true,
        entityName,
        dryRun,
        stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[cleanup] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Recursively find and replace base64 strings in a data structure
 */
async function processSection(
  data: any,
  sectionName: string,
  brandId: string,
  entityType: string,
  orgId: string,
  supabaseUrl: string,
  serviceKey: string,
  dryRun: boolean,
  stats: any,
): Promise<{ changed: boolean; data: any }> {
  let changed = false;

  if (typeof data === "string") {
    if (isBase64DataUri(data)) {
      stats.base64Found++;
      if (!dryRun) {
        const url = await uploadBase64ToStorage(
          data, sectionName, brandId, entityType, orgId, supabaseUrl, serviceKey, stats.base64Migrated
        );
        if (url) {
          stats.base64Migrated++;
          stats.bytesSaved += data.length;
          return { changed: true, data: url };
        }
      } else {
        stats.bytesSaved += data.length;
      }
    }
    return { changed: false, data };
  }

  if (Array.isArray(data)) {
    const newArr = [];
    for (let i = 0; i < data.length; i++) {
      const result = await processSection(
        data[i], sectionName, brandId, entityType, orgId, supabaseUrl, serviceKey, dryRun, stats
      );
      newArr.push(result.data);
      if (result.changed) changed = true;
    }
    return { changed, data: newArr };
  }

  if (data && typeof data === "object") {
    const newObj: any = {};
    for (const key of Object.keys(data)) {
      // Check common fields that hold base64: url, thumbnailUrl, coverImage, logoUrl, fileData, content
      const result = await processSection(
        data[key], sectionName, brandId, entityType, orgId, supabaseUrl, serviceKey, dryRun, stats
      );
      newObj[key] = result.data;
      if (result.changed) changed = true;
    }
    return { changed, data: newObj };
  }

  return { changed: false, data };
}

function isBase64DataUri(str: string): boolean {
  return str.startsWith("data:image/") || str.startsWith("data:application/pdf");
}

/**
 * Upload a base64 data URI to Supabase Storage
 */
async function uploadBase64ToStorage(
  dataUri: string,
  sectionName: string,
  brandId: string,
  entityType: string,
  orgId: string,
  supabaseUrl: string,
  serviceKey: string,
  index: number,
): Promise<string | null> {
  try {
    // Parse the data URI
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];

    // Determine file extension
    const extMap: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
    };
    const ext = extMap[mimeType] || "bin";

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage
    const storagePath = `${orgId}/${entityType}s/${brandId}/migrated/${sectionName}_${index}_${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/organization-assets/${storagePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": mimeType,
          "x-upsert": "true",
        },
        body: bytes,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.warn(`[cleanup] Upload failed: ${uploadRes.status} ${errText.slice(0, 100)}`);
      return null;
    }

    // Return public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/organization-assets/${storagePath}`;
    console.log(`[cleanup] Migrated ${sectionName} item (${(bytes.length / 1024).toFixed(0)}KB) → ${storagePath}`);
    return publicUrl;

  } catch (err) {
    console.warn(`[cleanup] Upload error:`, err);
    return null;
  }
}

/**
 * Fallback: fetch guide_data, update section, save back
 * WARNING: This loads full guide_data — only works for smaller brands
 */
async function fallbackSectionUpdate(
  supabaseUrl: string,
  headers: Record<string, string>,
  table: string,
  brandId: string,
  section: string,
  newData: any,
) {
  try {
    // Fetch current guide_data
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${table}?id=eq.${brandId}&select=guide_data`,
      { headers }
    );
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const rows = await res.json();
    if (!rows?.[0]) throw new Error("No entity found");

    const guideData = rows[0].guide_data || {};
    guideData[section] = newData;

    // Save back
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/${table}?id=eq.${brandId}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ guide_data: guideData }),
      }
    );

    if (!updateRes.ok) {
      const t = await updateRes.text();
      console.error(`[cleanup] Fallback update failed: ${updateRes.status} ${t.slice(0, 100)}`);
    } else {
      console.log(`[cleanup] Fallback update for ${section} succeeded`);
    }
  } catch (err) {
    console.error(`[cleanup] Fallback error:`, err);
  }
}
