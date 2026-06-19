// Commit user-selected logo candidates: download each, upload to the
// `global-logos` bucket, create/update the global_client_logos row.
//
// POST body: {
//   organization_id: string,
//   name: string,
//   category: string,
//   description?: string,
//   website_url?: string,
//   logo_id?: string,                              // if updating an existing row
//   selections: [{ url, lockup, variant }],
// }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "global-logos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

interface Selection {
  url: string;
  lockup: "icon" | "wordmark";
  variant: "color" | "black" | "white";
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "logo";

function extFromCt(ct: string | null, fallback = "png") {
  if (!ct) return fallback;
  if (ct.includes("svg")) return "svg";
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("ico")) return "ico";
  return fallback;
}

function extFromUrl(u: string): string | undefined {
  try {
    const p = new URL(u).pathname;
    const m = p.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ ok: false, error: "invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      organization_id,
      name,
      category,
      description,
      website_url,
      logo_id,
      selections,
    } = body as {
      organization_id: string;
      name: string;
      category?: string;
      description?: string;
      website_url?: string;
      logo_id?: string;
      selections: Selection[];
    };

    if (!organization_id || !name || !Array.isArray(selections) || !selections.length) {
      return new Response(JSON.stringify({ ok: false, error: "missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve target row
    let targetId = logo_id;
    let existingFiles: any[] = [];
    if (targetId) {
      const { data: row, error } = await admin
        .from("global_client_logos")
        .select("files")
        .eq("id", targetId)
        .maybeSingle();
      if (error) throw error;
      existingFiles = Array.isArray(row?.files) ? (row!.files as any[]) : [];
    } else {
      const { data: row, error } = await admin
        .from("global_client_logos")
        .insert({
          organization_id,
          name: name.trim(),
          description: description?.trim() || null,
          category: category?.trim() || "General",
          website_url: website_url?.trim() || null,
          created_by: user.id,
          files: [],
        })
        .select("id")
        .single();
      if (error) throw error;
      targetId = row.id as string;
    }

    const slug = slugify(name);
    const ts = Date.now();
    const newFiles: any[] = [];
    const errors: { url: string; error: string }[] = [];

    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];
      try {
        const res = await fetch(sel.url, {
          headers: { "User-Agent": "LovableLogoBot/1.0" },
          redirect: "follow",
        });
        if (!res.ok) throw new Error(`download ${res.status}`);
        const ct = res.headers.get("content-type");
        const ext = extFromCt(ct, extFromUrl(sel.url) || "png");
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.length < 100) throw new Error(`tiny ${bytes.length}`);

        const path = `${slug}/${targetId}/${sel.lockup}-${sel.variant}-${ts}-${i}.${ext}`;
        const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
          contentType: ct ?? `image/${ext}`,
          upsert: true,
        });
        if (upErr) throw new Error(`upload ${upErr.message}`);

        const { data: signed, error: sErr } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL);
        if (sErr || !signed) throw new Error(`sign ${sErr?.message}`);

        newFiles.push({
          url: signed.signedUrl,
          format: ext,
          variant: sel.variant,
          lockup: sel.lockup,
          source: "firecrawl-discover",
        });
      } catch (e) {
        errors.push({ url: sel.url, error: (e as Error).message });
      }
    }

    if (!newFiles.length) {
      return new Response(
        JSON.stringify({ ok: false, error: "no files saved", errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const merged = [...existingFiles, ...newFiles];
    const { error: updErr } = await admin
      .from("global_client_logos")
      .update({ files: merged, updated_at: new Date().toISOString() })
      .eq("id", targetId);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ ok: true, id: targetId, files: newFiles, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
