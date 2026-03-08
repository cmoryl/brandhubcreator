import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { characterId, promptHint, forceRegenerate = false } = await req.json();

    if (!characterId || !promptHint) {
      return new Response(JSON.stringify({ error: "Missing characterId or promptHint" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped caching path prevents stale cross-user sprites
    const spriteDir = `booth-sprites/${user.id}`;
    const fileName = `${characterId}.png`;
    const storagePath = `${spriteDir}/${fileName}`;

    // Check if sprite already exists in storage unless forced
    if (!forceRegenerate) {
      const { data: existingFiles } = await supabase.storage
        .from("organization-assets")
        .list(spriteDir, { search: fileName });

      if (existingFiles && existingFiles.length > 0) {
        const match = existingFiles.find((file) => file.name === fileName) ?? existingFiles[0];
        const cacheToken = encodeURIComponent(
          match?.updated_at ?? match?.created_at ?? Date.now().toString()
        );
        const { data: urlData } = supabase.storage.from("organization-assets").getPublicUrl(storagePath);

        return new Response(JSON.stringify({ url: `${urlData.publicUrl}?v=${cacheToken}`, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate character sprite using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whiteBgPrompt = `Create a photorealistic full-body character sprite of ${promptHint}. Show exactly one person, full body from head to shoes, centered and clearly visible, occupying most of the frame. Use neutral studio lighting and sharp detail. Place the person on a perfectly solid pure white background (#FFFFFF) with no gradients, no texture, no props, no environment, no text, no logo, and no extra people.`;
    const greenBgPrompt = `Create a photorealistic full-body character sprite of ${promptHint}. Show exactly one person, full body from head to shoes, centered and clearly visible, occupying most of the frame. Use neutral studio lighting and sharp detail. Place the person on a perfectly solid bright green chroma key background (#00FF00) edge-to-edge with no gradients, no texture, no props, no environment, no text, no logo, and no extra people.`;

    console.log(`[generate-character-sprite] Generating sprite for ${characterId} (${user.id})`);

    const generationAttempts = [
      { model: "google/gemini-2.5-flash-image", prompt: whiteBgPrompt },
      { model: "google/gemini-3-pro-image-preview", prompt: whiteBgPrompt },
      { model: "google/gemini-3-pro-image-preview", prompt: greenBgPrompt },
    ] as const;

    let imageUrl: string | undefined;

    for (const attempt of generationAttempts) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: attempt.model,
          messages: [
            {
              role: "user",
              content: attempt.prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited — please try again shortly" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.warn(`[generate-character-sprite] Attempt failed (${attempt.model}): ${status}`);
        continue;
      }

      const aiData = await aiResponse.json();
      imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        console.log(`[generate-character-sprite] Success with ${attempt.model}`);
        break;
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data or fetch remote image URL, then upload to storage
    let binaryData: Uint8Array;
    if (imageUrl.startsWith("data:image")) {
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    } else {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image (${imageResponse.status})`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      binaryData = new Uint8Array(arrayBuffer);
    }

    const { error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(storagePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-character-sprite] Upload error:", uploadError);
      // Return the image directly as fallback
      return new Response(JSON.stringify({ url: imageUrl, cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("organization-assets").getPublicUrl(storagePath);

    console.log(`[generate-character-sprite] Generated and cached: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ url: `${publicUrlData.publicUrl}?t=${Date.now()}`, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-character-sprite] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

