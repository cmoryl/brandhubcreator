import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const EXPIRES = 60 * 60 * 24 * 365 * 10;
  const paths = [
    { variant: "color", path: "belmond/wordmark-color.svg" },
    { variant: "black", path: "belmond/wordmark-black.svg" },
    { variant: "white", path: "belmond/wordmark-white.svg" },
  ];

  const newFiles: any[] = [];
  for (const p of paths) {
    const { data, error } = await sb.storage.from("global-logos").createSignedUrl(p.path, EXPIRES);
    if (error) return new Response(JSON.stringify({ error: error.message, path: p.path }), { status: 500 });
    newFiles.push({
      format: "svg",
      lockup: "wordmark",
      variant: p.variant,
      source: "official:belmond.com",
      url: data.signedUrl,
    });
  }

  const { data: row } = await sb
    .from("global_client_logos")
    .select("id, files")
    .ilike("name", "belmond")
    .maybeSingle();

  if (!row) return new Response(JSON.stringify({ error: "no row" }), { status: 404 });

  const existing = Array.isArray(row.files) ? row.files : [];
  // Drop all existing wordmark entries, keep icons
  const kept = existing.filter((f: any) => (f.lockup ?? "icon") !== "wordmark");
  const merged = [...newFiles, ...kept];

  const { error: upErr } = await sb
    .from("global_client_logos")
    .update({ files: merged })
    .eq("id", row.id);

  if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, files: merged }), {
    headers: { "Content-Type": "application/json" },
  });
});
