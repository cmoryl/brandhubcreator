import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: canUse } = await supabase.rpc("can_use_ai_features", { _user_id: user.id });
      if (!canUse) {
        return new Response(JSON.stringify({ error: "AI features not available" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { entityId, entityType, categoryName } = await req.json();
    if (!entityId) {
      return new Response(JSON.stringify({ error: "entityId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch entity guide_data
    const tableMap: Record<string, string> = { brand: "brands", product: "products", event: "events" };
    const table = tableMap[entityType] || "brands";
    const { data: entityData } = await supabase
      .from(table)
      .select("name, guide_data, organization_id")
      .eq("id", entityId)
      .maybeSingle();

    if (!entityData) {
      return new Response(JSON.stringify({ error: "Entity not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gd = (entityData as any).guide_data || {};
    const orgId = (entityData as any).organization_id;

    // Extract all materials from guide_data
    const materials: Array<{
      id: string;
      type: string;
      title: string;
      source: string;
      url?: string;
      thumbnailUrl?: string;
      description?: string;
    }> = [];

    // Logos intentionally excluded from materials analysis

    // Images / Imagery
    const imagery = Array.isArray(gd.imagery) ? gd.imagery : [];
    imagery.forEach((img: any, i: number) => {
      if (img?.url || img?.imageUrl) {
        materials.push({
          id: `imagery-${i}`,
          type: 'image',
          title: img.title || img.name || `Image ${i + 1}`,
          source: 'Brand Imagery',
          url: img.url || img.imageUrl,
          thumbnailUrl: img.thumbnailUrl || img.url || img.imageUrl,
        });
      }
    });

    // Approved imagery sections
    const approvedSections = gd.approvedImagery?.sections || [];
    approvedSections.forEach((section: any) => {
      if (Array.isArray(section.images)) {
        section.images.forEach((img: any) => {
          materials.push({
            id: `approved-${img.id}`,
            type: 'approved_image',
            title: img.title || 'Approved Image',
            source: `Approved: ${section.name}`,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl || img.url,
          });
        });
      }
    });

    // Patterns
    const patterns = Array.isArray(gd.patterns) ? gd.patterns : [];
    patterns.forEach((p: any, i: number) => {
      if (p?.imageUrl || p?.url) {
        materials.push({
          id: `pattern-${i}`,
          type: 'pattern',
          title: p.name || `Pattern ${i + 1}`,
          source: 'Patterns',
          url: p.imageUrl || p.url,
          thumbnailUrl: p.imageUrl || p.url,
        });
      }
    });

    // Brochures (PDFs, collateral)
    const brochures = Array.isArray(gd.brochures) ? gd.brochures : [];
    brochures.forEach((b: any, i: number) => {
      materials.push({
        id: `brochure-${i}`,
        type: 'pdf',
        title: b.title || b.name || `Brochure ${i + 1}`,
        source: 'Brochures',
        url: b.fileUrl || b.externalUrl,
        thumbnailUrl: b.thumbnailUrl || b.coverUrl,
        description: b.description,
      });
    });

    // Presentation Templates
    const presentations = Array.isArray(gd.presentationTemplates) ? gd.presentationTemplates : [];
    presentations.forEach((p: any, i: number) => {
      materials.push({
        id: `presentation-${i}`,
        type: 'presentation',
        title: p.title || p.name || `Presentation ${i + 1}`,
        source: 'Presentations',
        url: p.fileUrl || p.externalUrl,
        thumbnailUrl: p.thumbnailUrl || p.coverUrl,
        description: p.description,
      });
    });

    // Templates
    const templates = Array.isArray(gd.templates) ? gd.templates : [];
    templates.forEach((t: any, i: number) => {
      materials.push({
        id: `template-${i}`,
        type: 'template',
        title: t.title || t.name || `Template ${i + 1}`,
        source: 'Templates',
        url: t.fileUrl || t.externalUrl,
        thumbnailUrl: t.thumbnailUrl || t.coverUrl,
      });
    });

    // Case Studies
    const caseStudies = Array.isArray(gd.caseStudies) ? gd.caseStudies : [];
    caseStudies.forEach((cs: any, i: number) => {
      materials.push({
        id: `casestudy-${i}`,
        type: 'case_study',
        title: cs.title || cs.name || `Case Study ${i + 1}`,
        source: 'Case Studies',
        url: cs.fileUrl || cs.externalUrl,
        thumbnailUrl: cs.thumbnailUrl || cs.coverUrl,
        description: cs.description,
      });
    });

    // Image assets
    const imageAssets = Array.isArray(gd.imageAssets) ? gd.imageAssets : [];
    imageAssets.forEach((a: any, i: number) => {
      if (a?.url || a?.imageUrl || a?.fileUrl) {
        materials.push({
          id: `asset-${i}`,
          type: 'image_asset',
          title: a.title || a.name || `Asset ${i + 1}`,
          source: 'Image Assets',
          url: a.url || a.imageUrl || a.fileUrl,
          thumbnailUrl: a.thumbnailUrl || a.url || a.imageUrl || a.fileUrl,
        });
      }
    });

    // Hero image
    if (gd.hero?.coverImage || gd.hero?.imageUrl) {
      materials.push({
        id: 'hero-cover',
        type: 'hero',
        title: 'Hero / Cover Image',
        source: 'Hero',
        url: gd.hero.coverImage || gd.hero.imageUrl,
        thumbnailUrl: gd.hero.coverImage || gd.hero.imageUrl,
      });
    }

    // Now use AI to analyze the materials and generate imagery guidance
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return materials without AI analysis
      return new Response(JSON.stringify({ materials, guidance: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build brand context
    const brandContext = {
      name: (entityData as any).name,
      archetype: gd.identity?.archetype || '',
      colors: (gd.colors || []).slice(0, 6).map((c: any) => ({ name: c?.name, hex: c?.hex || c?.value })).filter((c: any) => c.hex),
      values: (gd.values || []).slice(0, 5).map((v: any) => v?.text || v).filter(Boolean),
      industry: gd.industry || gd.hero?.industry || '',
      toneOfVoice: gd.identity?.toneOfVoice || [],
    };

    // Only analyze materials that have visual URLs (images)
    const visualMaterials = materials.filter(m =>
      m.url && (m.type === 'image' || m.type === 'pattern' ||
        m.type === 'approved_image' || m.type === 'hero' || m.type === 'image_asset')
    );

    const materialsSummary = materials.map(m =>
      `- [${m.type}] "${m.title}" (source: ${m.source})${m.description ? ` — ${m.description.slice(0, 100)}` : ''}`
    ).join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a brand imagery consultant analyzing existing brand materials to provide guidance for new imagery searches. The brand is "${brandContext.name}" with archetype "${brandContext.archetype}", colors: ${brandContext.colors.map((c: any) => `${c.name}(${c.hex})`).join(', ')}, values: ${brandContext.values.join(', ')}, industry: ${brandContext.industry}.`
          },
          {
            role: "user",
            content: `Analyze these ${materials.length} existing brand materials and provide imagery search guidance:\n\n${materialsSummary}\n\n${categoryName ? `The user is looking for imagery for the "${categoryName}" category.` : ''}\n\nBased on these materials, provide:\n1. Visual style characteristics detected across materials\n2. Recommended search terms that would find imagery consistent with these materials\n3. Color palette guidance based on existing materials\n4. Mood and tone recommendations\n5. What to avoid based on the current materials`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_imagery_guidance",
            description: "Provide structured imagery guidance based on brand materials analysis",
            parameters: {
              type: "object",
              properties: {
                visualStyle: {
                  type: "array",
                  items: { type: "string" },
                  description: "Visual style characteristics detected (e.g. 'clean minimalist', 'warm corporate')"
                },
                recommendedSearchTerms: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific search queries to find matching imagery"
                },
                colorGuidance: {
                  type: "string",
                  description: "Color palette guidance based on existing materials"
                },
                moodAndTone: {
                  type: "array",
                  items: { type: "string" },
                  description: "Mood and tone keywords (e.g. 'professional', 'aspirational')"
                },
                avoidances: {
                  type: "array",
                  items: { type: "string" },
                  description: "Things to avoid in imagery based on brand analysis"
                },
                overallSummary: {
                  type: "string",
                  description: "Brief summary of the brand's visual identity based on materials"
                },
              },
              required: ["visualStyle", "recommendedSearchTerms", "colorGuidance", "moodAndTone", "avoidances", "overallSummary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_imagery_guidance" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ materials, guidance: null, error: "Rate limited. Please try again shortly." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ materials, guidance: null, error: "AI credits exhausted." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ materials, guidance: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    let guidance = null;
    if (toolCall?.function?.arguments) {
      guidance = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }

    return new Response(JSON.stringify({ materials, guidance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("extract-brand-materials error:", err);
    return new Response(JSON.stringify({ error: "Failed to extract materials" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
