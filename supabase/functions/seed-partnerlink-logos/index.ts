import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY = "PartnerLink Logos";

// Curated PartnerLink list. `slug` is the Simple Icons slug (https://simpleicons.org).
// Brands without a known Simple Icons slug are seeded with name + website only
// so admins can run the existing "Find Logos" AI flow per-row.
type Partner = { name: string; website: string; slug?: string };

const PARTNERS: Partner[] = [
  { name: "AEM [Adobe Experience Manager]", website: "https://business.adobe.com/products/experience-manager/adobe-experience-manager.html", slug: "adobe" },
  { name: "Adobe Marketo", website: "https://business.adobe.com/products/marketo/adobe-marketo.html", slug: "marketo" },
  { name: "Byner", website: "https://www.byner.com" },
  { name: "CommerceTools", website: "https://commercetools.com" },
  { name: "Eloqua", website: "https://www.oracle.com/cx/marketing/automation/", slug: "oracle" },
  { name: "Hubspot", website: "https://www.hubspot.com", slug: "hubspot" },
  { name: "Kontent AI", website: "https://kontent.ai" },
  { name: "Salesforce", website: "https://www.salesforce.com", slug: "salesforce" },
  { name: "Sharepoint", website: "https://www.microsoft.com/en-us/microsoft-365/sharepoint/collaboration", slug: "microsoftsharepoint" },
  { name: "Shopify", website: "https://www.shopify.com", slug: "shopify" },
  { name: "Sitecore", website: "https://www.sitecore.com", slug: "sitecore" },
  { name: "Stibo Systems MDM", website: "https://www.stibosystems.com" },
  { name: "Umbraco", website: "https://umbraco.com", slug: "umbraco" },
  { name: "Webflow", website: "https://webflow.com", slug: "webflow" },
  { name: "Akeneo", website: "https://www.akeneo.com", slug: "akeneo" },
  { name: "Contentful", website: "https://www.contentful.com", slug: "contentful" },
  { name: "Contentstack", website: "https://www.contentstack.com", slug: "contentstack" },
  { name: "Drupal", website: "https://www.drupal.org", slug: "drupal" },
  { name: "Github", website: "https://github.com", slug: "github" },
  { name: "Google", website: "https://www.google.com", slug: "google" },
  { name: "inRiver", website: "https://www.inriver.com" },
  { name: "Optimizely Episerver", website: "https://www.optimizely.com", slug: "optimizely" },
  { name: "SAP (Commerce Cloud)", website: "https://www.sap.com/products/crm/commerce-cloud.html", slug: "sap" },
  { name: "Service now", website: "https://www.servicenow.com", slug: "servicenow" },
  { name: "Tridion", website: "https://www.rws.com/content-management/tridion/" },
  { name: "Veeva", website: "https://www.veeva.com" },
  { name: "Wordpress", website: "https://wordpress.org", slug: "wordpress" },
  { name: "Zendesk", website: "https://www.zendesk.com", slug: "zendesk" },
  { name: "builder.io", website: "https://www.builder.io" },
  { name: "Prismic.io", website: "https://prismic.io", slug: "prismic" },
  { name: "Sanity.io", website: "https://www.sanity.io", slug: "sanity" },
  { name: "StoryBlok", website: "https://www.storyblok.com", slug: "storyblok" },
  { name: "Agility PIM", website: "https://agilitycms.com" },
  { name: "Amazon", website: "https://www.amazon.com", slug: "amazon" },
  { name: "Amplience", website: "https://amplience.com" },
  { name: "Azure Cloud", website: "https://azure.microsoft.com", slug: "microsoftazure" },
  { name: "Contentserv", website: "https://www.contentserv.com" },
  { name: "Coremedia", website: "https://www.coremedia.com" },
  { name: "Figma", website: "https://www.figma.com", slug: "figma" },
  { name: "Informatica", website: "https://www.informatica.com", slug: "informatica" },
  { name: "Jahia", website: "https://www.jahia.com" },
  { name: "Knak", website: "https://knak.com" },
  { name: "Magnolia", website: "https://www.magnolia-cms.com" },
  { name: "Pimcore", website: "https://pimcore.com", slug: "pimcore" },
  { name: "Salsify", website: "https://www.salsify.com" },
  { name: "1440.io", website: "https://www.1440.io" },
];

async function fetchSimpleIconSvg(slug: string): Promise<string | null> {
  // Use Simple Icons jsDelivr CDN (raw monochrome SVG, MIT-licensed).
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<svg")) return null;
    return text;
  } catch {
    return null;
  }
}

function colorizeSvg(svg: string, hex: string): string {
  // Simple Icons SVGs are single-path monochrome; inject fill on the root <svg>
  // and strip any inline fills on children so the override always wins.
  let out = svg.replace(/\sfill="[^"]*"/g, "");
  out = out.replace(/<svg([^>]*)>/, `<svg$1 fill="${hex}">`);
  return out;
}

function svgToDataUrl(svg: string): string {
  // Use base64 for safe transport in JSONB / data URLs
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is signed in and is an admin/owner of the org they're seeding.
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const organizationId: string | undefined = body.organizationId;
    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm membership/admin.
    const { data: member } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const isOrgAdmin = member && ["admin", "owner"].includes(member.role);
    if (!isOrgAdmin) {
      // also allow platform admins
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const isPlatformAdmin = (roles || []).some((r) => ["admin", "super_admin"].includes(r.role));
      if (!isPlatformAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Existing rows in this category for this org → backfill if missing files, else skip.
    const { data: existing } = await admin
      .from("global_client_logos")
      .select("id, name, files")
      .eq("organization_id", organizationId)
      .eq("category", CATEGORY);
    const existingByName = new Map<string, { id: string; files: any[] }>(
      (existing || []).map((r: any) => [
        r.name.toLowerCase(),
        { id: r.id, files: Array.isArray(r.files) ? r.files : [] },
      ]),
    );

    const results: Array<{ name: string; status: "inserted" | "updated" | "skipped" | "no-logo"; }> = [];
    const rowsToInsert: any[] = [];

    for (const p of PARTNERS) {
      const files: any[] = [];
      let foundLogo = false;
      if (p.slug) {
        const svg = await fetchSimpleIconSvg(p.slug);
        if (svg) {
          foundLogo = true;
          const whiteSvg = colorizeSvg(svg, "#ffffff");
          const blackSvg = colorizeSvg(svg, "#000000");
          files.push({ variant: "white", format: "svg", url: svgToDataUrl(whiteSvg) });
          files.push({ variant: "black", format: "svg", url: svgToDataUrl(blackSvg) });
          files.push({ variant: "white", format: "png", url: `https://cdn.simpleicons.org/${p.slug}/ffffff` });
          files.push({ variant: "black", format: "png", url: `https://cdn.simpleicons.org/${p.slug}/000000` });
        }
      }

      const existingRow = existingByName.get(p.name.toLowerCase());
      if (existingRow) {
        // Backfill only when row has no files AND we now have some.
        if (existingRow.files.length === 0 && foundLogo) {
          const { error: updErr } = await admin
            .from("global_client_logos")
            .update({ files })
            .eq("id", existingRow.id);
          if (updErr) throw updErr;
          results.push({ name: p.name, status: "updated" });
        } else {
          results.push({ name: p.name, status: "skipped" });
        }
        continue;
      }

      rowsToInsert.push({
        organization_id: organizationId,
        name: p.name,
        description: p.slug
          ? "PartnerLink integration partner (logo via Simple Icons)"
          : "PartnerLink integration partner — use Find Logos to discover assets",
        category: CATEGORY,
        website_url: p.website,
        files,
        created_by: userData.user.id,
      });
      results.push({ name: p.name, status: foundLogo ? "inserted" : "no-logo" });
    }

    if (rowsToInsert.length > 0) {
      const { error: insertErr } = await admin
        .from("global_client_logos")
        .insert(rowsToInsert);
      if (insertErr) throw insertErr;
    }

    const summary = {
      total: PARTNERS.length,
      inserted: results.filter((r) => r.status === "inserted").length,
      withoutLogo: results.filter((r) => r.status === "no-logo").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[seed-partnerlink-logos] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
