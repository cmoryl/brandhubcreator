import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify AI access
    const { data: canUse } = await supabase.rpc("can_use_ai_features", {
      _user_id: user.id,
    });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "AI features not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { companyName, variant, organizationId } = await req.json();
    if (!companyName || !variant || !organizationId) {
      return new Response(JSON.stringify({ error: "Missing companyName, variant, or organizationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build variant-specific prompt
    let prompt: string;
    switch (variant) {
      case "color":
        prompt = `Generate the official logo of the company "${companyName}" in its original brand colors. The logo should be accurate and recognizable, rendered on a clean solid white background. Show only the logo, no text descriptions, no watermarks, no extra elements. High quality, centered, with generous padding around the logo.`;
        break;
      case "white":
        prompt = `Generate the official logo of the company "${companyName}" rendered entirely in solid white color, on a clean solid dark gray (#1e293b) background. The logo should be accurate and recognizable. Show only the logo, no text descriptions, no watermarks, no extra elements. High quality, centered, with generous padding.`;
        break;
      case "black":
        prompt = `Generate the official logo of the company "${companyName}" rendered entirely in solid black color, on a clean solid white background. The logo should be accurate and recognizable. Show only the logo, no text descriptions, no watermarks, no extra elements. High quality, centered, with generous padding.`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid variant. Use: color, white, or black" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`[generate-client-logo] Generating ${variant} logo for "${companyName}"`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error(`[generate-client-logo] AI error ${status}:`, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("[generate-client-logo] No image in AI response");
      return new Response(JSON.stringify({ error: "AI did not return an image. Try a different company name." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const safeName = companyName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
    const filePath = `${organizationId}/global-logos/${safeName}-${variant}-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(filePath, bytes, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-client-logo] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save generated image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage
      .from("organization-assets")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    console.log(`[generate-client-logo] ✅ ${variant} logo for "${companyName}" saved`);

    return new Response(
      JSON.stringify({ url: publicUrl, variant }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[generate-client-logo] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
