// One-off: replace black wordmark variant for a global_client_logos row.
// Body: { logo_id, svg_base64, filename }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "logo";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { logo_id, svg_base64 } = await req.json();
    if (!logo_id || !svg_base64) {
      return new Response(JSON.stringify({ ok: false, error: "missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row, error: rErr } = await admin
      .from("global_client_logos")
      .select("id, name, files")
      .eq("id", logo_id)
      .maybeSingle();
    if (rErr || !row) throw new Error("row not found");

    const bytes = Uint8Array.from(atob(svg_base64), (c) => c.charCodeAt(0));
    const slug = slugify(row.name);
    const ts = Date.now();
    const path = `${slug}/${logo_id}/wordmark-black-${ts}.svg`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/svg+xml",
      upsert: true,
    });
    if (upErr) throw new Error(`upload ${upErr.message}`);
    const { data: signed, error: sErr } = await admin.storage.from(BUCKET).createSignedUrl(path, TTL);
    if (sErr || !signed) throw new Error(`sign ${sErr?.message}`);

    const existing = Array.isArray(row.files) ? row.files as any[] : [];
    // Remove any existing wordmark+black entries (any format)
    const kept = existing.filter((f) => !(f && f.variant === "black" && (f.lockup === "wordmark" || !f.lockup)));
    const newFile = {
      url: signed.signedUrl,
      format: "svg",
      variant: "black",
      lockup: "wordmark",
      source: "manual-upload-revised",
    };
    const merged = [...kept, newFile];
    const { error: updErr } = await admin
      .from("global_client_logos")
      .update({ files: merged, updated_at: new Date().toISOString() })
      .eq("id", logo_id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, file: newFile, name: row.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
