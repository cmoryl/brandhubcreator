import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrandColor {
  hex: string;
  name: string;
  role?: string;
}

function adjustColor(hex: string, percent: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, Math.max(0, r + (255 * percent / 100)));
  g = Math.min(255, Math.max(0, g + (255 * percent / 100)));
  b = Math.min(255, Math.max(0, b + (255 * percent / 100)));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function generateGradients(colors: BrandColor[]) {
  const primaryColor = colors.find(c => c.role === 'primary')?.hex || colors[0]?.hex || '#667eea';
  const secondaryColor = colors.find(c => c.role === 'secondary')?.hex || colors[1]?.hex || '#764ba2';
  const accentColor = colors.find(c => c.role === 'accent')?.hex || colors[2]?.hex || '#f093fb';
  const hexColors = colors.map(c => c.hex).filter(Boolean);
  
  return [
    { id: crypto.randomUUID(), name: "Primary Flow", css: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || adjustColor(primaryColor, 30)} 100%)` },
    { id: crypto.randomUUID(), name: "Radial Burst", css: `radial-gradient(circle at 30% 30%, ${adjustColor(primaryColor, 20)} 0%, ${primaryColor} 50%, ${adjustColor(primaryColor, -30)} 100%)` },
    { id: crypto.randomUUID(), name: "Brand Spectrum", css: hexColors.length >= 3 ? `linear-gradient(90deg, ${hexColors[0]} 0%, ${hexColors[1]} 50%, ${hexColors[2]} 100%)` : `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 50%, ${secondaryColor} 100%)` },
    { id: crypto.randomUUID(), name: "Mesh Gradient", css: `conic-gradient(from 180deg at 50% 50%, ${primaryColor} 0deg, ${secondaryColor} 90deg, ${accentColor} 180deg, ${secondaryColor} 270deg, ${primaryColor} 360deg)` }
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { organizationId } = await req.json();
    const results = { processed: 0, gradientsAdded: 0, errors: [] as string[] };

    // Get brands needing gradients
    let query = supabase.from("brands").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) query = query.eq("organization_id", organizationId);
    const { data: brands } = await query;

    for (const brand of (brands || [])) {
      const guideData = brand.guide_data as Record<string, unknown> || {};
      const colors = (guideData.colors as BrandColor[]) || [];
      const existingGradients = (guideData.gradients as unknown[]) || [];
      
      if (colors.length === 0 || existingGradients.length >= 4) continue;

      const newGradients = generateGradients(colors);
      const { error } = await supabase.from("brands").update({ 
        guide_data: { ...guideData, gradients: [...existingGradients, ...newGradients] } 
      }).eq("id", brand.id);

      if (error) {
        results.errors.push(`${brand.name}: ${error.message}`);
      } else {
        results.processed++;
        results.gradientsAdded += newGradients.length;
      }
    }

    // Same for products
    let pQuery = supabase.from("products").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) pQuery = pQuery.eq("organization_id", organizationId);
    const { data: products } = await pQuery;

    for (const product of (products || [])) {
      const guideData = product.guide_data as Record<string, unknown> || {};
      const colors = (guideData.colors as BrandColor[]) || [];
      const existingGradients = (guideData.gradients as unknown[]) || [];
      
      if (colors.length === 0 || existingGradients.length >= 4) continue;

      const newGradients = generateGradients(colors);
      const { error } = await supabase.from("products").update({ 
        guide_data: { ...guideData, gradients: [...existingGradients, ...newGradients] } 
      }).eq("id", product.id);

      if (!error) {
        results.processed++;
        results.gradientsAdded += newGradients.length;
      }
    }

    // Same for events
    let eQuery = supabase.from("events").select("id, name, guide_data").eq("user_id", user.id);
    if (organizationId) eQuery = eQuery.eq("organization_id", organizationId);
    const { data: events } = await eQuery;

    for (const event of (events || [])) {
      const guideData = event.guide_data as Record<string, unknown> || {};
      const colors = (guideData.colors as BrandColor[]) || [];
      const existingGradients = (guideData.gradients as unknown[]) || [];
      
      if (colors.length === 0 || existingGradients.length >= 4) continue;

      const newGradients = generateGradients(colors);
      const { error } = await supabase.from("events").update({ 
        guide_data: { ...guideData, gradients: [...existingGradients, ...newGradients] } 
      }).eq("id", event.id);

      if (!error) {
        results.processed++;
        results.gradientsAdded += newGradients.length;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
