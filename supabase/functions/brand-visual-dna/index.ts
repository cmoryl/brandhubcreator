/**
 * brand-visual-dna
 *
 * Trains a brand's "visual DNA" from its approved imagery:
 *   1. Pulls approved images (or accepts a list) for the entity.
 *   2. Vision-captions each image (Lovable AI Gateway, gemini-2.5-flash).
 *   3. Embeds each caption (openai/text-embedding-3-small, 1536-d).
 *   4. Aggregates captions → structured DNA (palette, moods, lighting,
 *      composition, photography style, do/dont, signature motifs, seed).
 *   5. Upserts embeddings + DNA into the database.
 *
 * Heavy work runs inside EdgeRuntime.waitUntil so the HTTP request
 * returns immediately; the client polls `brand_visual_dna` for status.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";
const CHAT_URL = `${GATEWAY_BASE}/chat/completions`;
const EMBED_URL = `${GATEWAY_BASE}/embeddings`;
const VISION_MODEL = "google/gemini-2.5-flash";
const SYNTH_MODEL = "google/gemini-2.5-flash";
const EMBED_MODEL = "openai/text-embedding-3-small";
const MAX_IMAGES = 60; // hard cap per training run

type EntityType = "brand" | "product" | "event";

interface ApprovedImage {
  id: string;
  url: string;
  tags?: string[];
  notes?: string;
}

interface SectionLite {
  id?: string;
  name?: string;
  images?: ApprovedImage[];
}

const tableForEntity = (type: EntityType) =>
  type === "brand" ? "brands" : type === "product" ? "products" : "events";

const supaService = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

const callChat = async (
  model: string,
  messages: unknown,
  responseFormat?: "json_object",
) => {
  const body: Record<string, unknown> = { model, messages };
  if (responseFormat) body.response_format = { type: responseFormat };
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI chat ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
};

const callEmbeddings = async (inputs: string[]) => {
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Embeddings ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.data ?? []).map((d: { embedding: number[] }) => d.embedding);
};

const captionImage = async (imageUrl: string, brandName: string) => {
  const sys =
    "You are a senior brand art director. Describe the image in 4-6 sentences, " +
    "covering: (1) subject & scene, (2) lighting & mood, (3) dominant colors, " +
    "(4) composition & framing, (5) photographic/illustrative style and signature motifs. " +
    "Be concrete and specific. No marketing fluff.";
  return await callChat(VISION_MODEL, [
    { role: "system", content: sys },
    {
      role: "user",
      content: [
        { type: "text", text: `Brand: ${brandName}. Describe this approved brand image.` },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ]);
};

const synthesizeDna = async (
  brandName: string,
  captions: { url: string; caption: string; tags: string[] }[],
) => {
  const joined = captions
    .map(
      (c, i) =>
        `#${i + 1} (tags: ${c.tags.join(", ") || "—"})\n${c.caption.trim()}`,
    )
    .join("\n\n");
  const sys =
    "You are a brand-design strategist. Given many image descriptions for a single " +
    "brand, synthesize the brand's visual DNA into strict JSON with this shape: " +
    `{\n  "palette": [{"name": string, "hex": string, "role": string}],\n  "moods": string[],\n  "lighting": string,\n  "composition": string,\n  "subject_matter": string[],\n  "photography_style": string,\n  "signature_motifs": string[],\n  "do_patterns": string[],\n  "dont_patterns": string[],\n  "prompt_seed": string\n}` +
    " The prompt_seed is a single sentence (<= 40 words) that an image generator " +
    "can prepend to any new prompt to keep generations on-brand. " +
    "Only output JSON. No prose, no markdown.";
  const out = await callChat(
    SYNTH_MODEL,
    [
      { role: "system", content: sys },
      {
        role: "user",
        content: `Brand: ${brandName}\n\nApproved image descriptions:\n\n${joined}`,
      },
    ],
    "json_object",
  );
  try {
    return JSON.parse(out);
  } catch {
    // Try to salvage JSON from a fenced block
    const match = out.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("DNA synthesis returned non-JSON");
  }
};

const collectApprovedImages = async (
  supabase: ReturnType<typeof supaService>,
  entityId: string,
  entityType: EntityType,
) => {
  const table = tableForEntity(entityType);
  const { data, error } = await supabase
    .from(table)
    .select("guide_data, organization_id, name")
    .eq("id", entityId)
    .maybeSingle();
  if (error) throw error;
  const orgId = (data as { organization_id?: string } | null)?.organization_id;
  const name = (data as { name?: string } | null)?.name ?? "Brand";
  const sections: SectionLite[] =
    (data as { guide_data?: { approvedImagery?: { sections?: SectionLite[] } } } | null)
      ?.guide_data?.approvedImagery?.sections ?? [];
  const collected: { sectionId?: string; image: ApprovedImage }[] = [];
  for (const s of sections) {
    for (const img of s.images ?? []) {
      if (!img?.url) continue;
      collected.push({ sectionId: s.id, image: img });
      if (collected.length >= MAX_IMAGES) break;
    }
    if (collected.length >= MAX_IMAGES) break;
  }
  return { organizationId: orgId, brandName: name, images: collected };
};

const trainEntity = async (
  entityId: string,
  entityType: EntityType,
  explicitImages?: ApprovedImage[],
  explicitOrgId?: string,
  explicitName?: string,
) => {
  const supabase = supaService();
  const startedAt = Date.now();

  // Mark in-progress.
  await supabase
    .from("brand_visual_dna")
    .upsert(
      {
        entity_id: entityId,
        entity_type: entityType,
        organization_id: explicitOrgId ?? "00000000-0000-0000-0000-000000000000",
        last_training_status: "running",
        last_training_error: null,
      },
      { onConflict: "entity_id,entity_type" },
    );

  try {
    const collected = explicitImages?.length
      ? {
          organizationId: explicitOrgId,
          brandName: explicitName ?? "Brand",
          images: explicitImages.slice(0, MAX_IMAGES).map((image) => ({ image })),
        }
      : await collectApprovedImages(supabase, entityId, entityType);

    if (!collected.organizationId) throw new Error("entity has no organization_id");
    const images = collected.images;
    if (images.length === 0) {
      await supabase
        .from("brand_visual_dna")
        .update({
          last_training_status: "empty",
          last_training_error: "No approved imagery to learn from yet.",
          source_image_count: 0,
          last_trained_at: new Date().toISOString(),
        })
        .eq("entity_id", entityId)
        .eq("entity_type", entityType);
      return;
    }

    // Caption images sequentially (memory-safe). Skip failures.
    const captions: { url: string; caption: string; tags: string[]; sectionId?: string; imageId: string }[] = [];
    for (const { image, sectionId } of images) {
      try {
        const caption = await captionImage(image.url, collected.brandName);
        if (caption?.trim()) {
          captions.push({
            url: image.url,
            caption,
            tags: image.tags ?? [],
            sectionId,
            imageId: image.id,
          });
        }
      } catch (err) {
        console.warn("[brand-visual-dna] caption failed for", image.url, err);
      }
    }

    if (captions.length === 0) throw new Error("All caption attempts failed");

    // Embed all captions in one batch (max 256).
    const embedTexts = captions.map((c) =>
      `${c.caption}\nTags: ${c.tags.join(", ")}`.slice(0, 30_000),
    );
    const embeddings = await callEmbeddings(embedTexts);

    // Upsert per-image embeddings.
    const rows = captions.map((c, i) => ({
      organization_id: collected.organizationId!,
      entity_id: entityId,
      entity_type: entityType,
      section_id: c.sectionId ?? null,
      image_id: c.imageId,
      image_url: c.url,
      caption: c.caption,
      tags: c.tags,
      embedding: embeddings[i],
      model_version: EMBED_MODEL,
    }));
    // Batch upsert in chunks of 50 to keep payload bounded.
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error: upErr } = await supabase
        .from("brand_imagery_embeddings")
        .upsert(chunk, { onConflict: "entity_id,entity_type,image_id" });
      if (upErr) throw upErr;
    }

    // Synthesize DNA.
    const dna = await synthesizeDna(collected.brandName, captions);
    const promptSeed: string =
      typeof dna?.prompt_seed === "string" ? dna.prompt_seed : "";

    await supabase
      .from("brand_visual_dna")
      .upsert(
        {
          organization_id: collected.organizationId,
          entity_id: entityId,
          entity_type: entityType,
          dna,
          prompt_seed: promptSeed,
          source_image_count: captions.length,
          last_trained_at: new Date().toISOString(),
          last_training_status: "ok",
          last_training_error: null,
        },
        { onConflict: "entity_id,entity_type" },
      );

    console.log(
      `[brand-visual-dna] trained ${entityType}=${entityId} on ${captions.length} images in ${Date.now() - startedAt}ms`,
    );
  } catch (err) {
    console.error("[brand-visual-dna] training failed:", err);
    await supabase
      .from("brand_visual_dna")
      .upsert(
        {
          entity_id: entityId,
          entity_type: entityType,
          organization_id: explicitOrgId ?? "00000000-0000-0000-0000-000000000000",
          last_training_status: "error",
          last_training_error: String((err as Error)?.message ?? err).slice(0, 500),
          last_trained_at: new Date().toISOString(),
        },
        { onConflict: "entity_id,entity_type" },
      );
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { entityId, entityType, images, organizationId, brandName } = body as {
      entityId?: string;
      entityType?: EntityType;
      images?: ApprovedImage[];
      organizationId?: string;
      brandName?: string;
    };

    if (!entityId || !entityType || !["brand", "product", "event"].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: "entityId and entityType (brand|product|event) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fire-and-forget training; client polls brand_visual_dna for status.
    const work = trainEntity(entityId, entityType, images, organizationId, brandName);
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(work);
    } else {
      // Fallback (local): swallow rejection so the response still returns.
      work.catch((e) => console.error(e));
    }

    return new Response(
      JSON.stringify({ status: "queued", entityId, entityType }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[brand-visual-dna] handler error:", err);
    return new Response(
      JSON.stringify({ error: String((err as Error)?.message ?? err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
