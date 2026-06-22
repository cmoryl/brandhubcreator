// One-off: sign newly uploaded wordmark-color files and replace the
// existing wordmark-color entries in global_client_logos.files JSONB.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "global-logos";
const TTL = 60 * 60 * 24 * 365 * 10;

// brand name (ilike) -> { key, format, source, append? }
const REPLACEMENTS: Array<{ name: string; key: string; format: string; source: string; append?: boolean }> = [
  { name: "adidas",     key: "adidas/wordmark-color-full.svg",     format: "svg", source: "worldvectorlogo:full-lockup" },
  { name: "iberostar",  key: "iberostar/wordmark-color-full.svg",  format: "svg", source: "worldvectorlogo:full-lockup" },
  { name: "xbox",       key: "xbox/wordmark-color-full.svg",       format: "svg", source: "wikimedia:Xbox_logo_2019" },
  { name: "wordpress",  key: "wordpress/wordmark-color-full.svg",  format: "svg", source: "wikimedia:WordPress_logo" },
  { name: "figma",      key: "figma/wordmark-color-full.png",      format: "png", source: "seeklogo:figma-full-lockup" },
  { name: "sharepoint", key: "sharepoint/wordmark-color-full.png", format: "png", source: "seeklogo:sharepoint-wordmark", append: true },
  { name: "haas",       key: "haas/wordmark-color-full.png",       format: "png", source: "seeklogo:haas-automation" },
  { name: "eloqua",     key: "eloqua/wordmark-color-full.png",     format: "png", source: "seeklogo:eloqua-classic" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: any[] = [];

  for (const r of REPLACEMENTS) {
    const { data: signed, error: sErr } = await sb.storage.from(BUCKET).createSignedUrl(r.key, TTL);
    if (sErr || !signed) {
      results.push({ brand: r.name, ok: false, step: "sign", error: sErr?.message });
      continue;
    }
    const newFile = {
      format: r.format,
      lockup: "wordmark",
      variant: "color",
      source: r.source,
      url: signed.signedUrl,
    };

    const { data: row, error: rErr } = await sb
      .from("global_client_logos")
      .select("id, files")
      .ilike("name", r.name)
      .maybeSingle();
    if (rErr || !row) {
      results.push({ brand: r.name, ok: false, step: "lookup", error: rErr?.message });
      continue;
    }

    const existing = Array.isArray(row.files) ? row.files : [];
    let merged: any[];
    if (r.append) {
      // keep everything, just add the new wordmark-color
      merged = [...existing, newFile];
    } else {
      // replace existing wordmark-color (drop old color wordmark)
      merged = existing.filter((f: any) => !(f.lockup === "wordmark" && f.variant === "color"));
      merged.unshift(newFile);
    }

    const { error: uErr } = await sb
      .from("global_client_logos")
      .update({ files: merged })
      .eq("id", row.id);

    results.push({ brand: r.name, ok: !uErr, error: uErr?.message, fileCount: merged.length });
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
