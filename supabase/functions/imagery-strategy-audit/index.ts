/**
 * Imagery Strategy Audit Edge Function
 * Scores entity imagery across 6 dimensions using inclusive heuristics.
 *
 * Hybrid approach:
 *   - Pulls metadata + counts across ALL imagery sources (Visual Direction,
 *     Approved Imagery library, Image Assets library, Brochures, Presentations,
 *     Templates, Case Studies).
 *   - Sends a small set of representative thumbnails to Gemini multimodal so the
 *     model can actually see the visual material.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { IMAGERY_STOP_GO } from "../_shared/inclusive-language-patterns.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_VISION_IMAGES = 6;

interface SampledImage {
  url: string;
  source: string;
  caption?: string;
}

/** Pick a representative, deduplicated, source-balanced sample for vision. */
function pickVisionSample(allBuckets: SampledImage[][]): SampledImage[] {
  const seen = new Set<string>();
  const out: SampledImage[] = [];
  // Round-robin across non-empty buckets so we don't only pull from one source.
  let added = true;
  let idx = 0;
  while (added && out.length < MAX_VISION_IMAGES) {
    added = false;
    for (const bucket of allBuckets) {
      if (out.length >= MAX_VISION_IMAGES) break;
      const item = bucket[idx];
      if (!item || !item.url) continue;
      if (seen.has(item.url)) continue;
      // Skip obviously non-image extensions (pdfs/docs etc) — we want previews
      const lower = item.url.toLowerCase().split("?")[0];
      if (/\.(pdf|pptx?|docx?|xlsx?|ai|sketch|psd|fig)$/i.test(lower)) continue;
      seen.add(item.url);
      out.push(item);
      added = true;
    }
    idx++;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { entityId, entityType = "brand", organizationId } = await req.json();
    if (!entityId || !organizationId) {
      return new Response(JSON.stringify({ error: "entityId and organizationId required" }), { status: 400, headers: corsHeaders });
    }

    const { data: canUse } = await adminClient.rpc("can_use_ai_features", {
      _user_id: userId, _entity_id: entityId, _entity_type: entityType,
    });
    if (!canUse) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403, headers: corsHeaders });
    }

    const { data: context } = await adminClient.rpc("get_entity_text_context", {
      p_table: entityType === "brand" ? "brands" : entityType === "product" ? "products" : "events",
      p_id: entityId,
    });

    const entityName = context?.name || "Unknown";
    const archetype = context?.archetype || "";
    const mission = context?.mission || "";
    const values = context?.values || [];
    const colorNames = context?.colorNames || (Array.isArray(context?.colors) ? context.colors.map((c: any) => c?.name).filter(Boolean) : []);

    // Counts across the broader visual inventory
    const counts = {
      visualDirection: context?.imagery_count || 0,
      approvedImagery: context?.approved_imagery_count || 0,
      imageAssets: context?.image_assets_count || 0,
      brochures: context?.brochures_count || 0,
      presentations: context?.presentations_count || 0,
      templates: context?.templates_count || 0,
      caseStudies: context?.case_studies_count || 0,
    };
    const totalAnalyzedAssets =
      counts.visualDirection + counts.approvedImagery + counts.imageAssets +
      counts.brochures + counts.presentations + counts.templates + counts.caseStudies;

    // Sampled imagery from each source (already capped by the SQL function)
    const visualDirectionSamples: SampledImage[] = (context?.imagery_samples || []).map((s: any) => ({
      url: s.url, source: `Visual Direction (${s.type === "dont" ? "DON'T" : "DO"})`,
      caption: s.description,
    }));
    const approvedSamples: SampledImage[] = (context?.approved_imagery_samples || []).map((s: any) => ({
      url: s.url, source: `Approved Imagery — ${s.section || "library"}`,
      caption: Array.isArray(s.tags) ? s.tags.join(", ") : undefined,
    }));
    const imageAssetSamples: SampledImage[] = (context?.image_assets_samples || []).map((s: any) => ({
      url: s.url, source: `Image Assets${s.category ? ` — ${s.category}` : ""}`,
      caption: s.name,
    }));
    const collateralSamples: SampledImage[] = (context?.collateral_samples || []).map((s: any) => ({
      url: s.url, source: `${s.source}${s.category ? ` (${s.category})` : ""}`,
      caption: s.title,
    }));

    const visionSample = pickVisionSample([
      visualDirectionSamples,
      approvedSamples,
      imageAssetSamples,
      collateralSamples,
    ]);

    // Build textual asset inventory paragraph
    const inventoryLines: string[] = [];
    if (counts.visualDirection) inventoryLines.push(`- Visual Direction guideline images: ${counts.visualDirection}`);
    if (counts.approvedImagery) {
      const sectionDescr = (context?.approved_imagery_sections || [])
        .map((s: any) => `"${s.name}" (${s.image_count})`).join(", ");
      inventoryLines.push(`- Approved Imagery library: ${counts.approvedImagery} images${sectionDescr ? ` across sections ${sectionDescr}` : ""}`);
    }
    if (counts.imageAssets) inventoryLines.push(`- Downloadable Image Assets: ${counts.imageAssets}`);
    if (counts.brochures) inventoryLines.push(`- Digital Collateral / Brochures (PDFs): ${counts.brochures}`);
    if (counts.presentations) inventoryLines.push(`- Presentation Templates (PPTX/PDF/Figma/etc.): ${counts.presentations}`);
    if (counts.templates) inventoryLines.push(`- Master Template files: ${counts.templates}`);
    if (counts.caseStudies) inventoryLines.push(`- Case Studies with imagery: ${counts.caseStudies}`);
    const inventory = inventoryLines.length ? inventoryLines.join("\n") : "- (No visual material catalogued yet)";

    const captionLines: string[] = [];
    [...visualDirectionSamples, ...approvedSamples, ...imageAssetSamples, ...collateralSamples]
      .slice(0, 24)
      .forEach((s, i) => {
        captionLines.push(`  ${i + 1}. [${s.source}]${s.caption ? ` — ${s.caption}` : ""}`);
      });

    const prompt = `You are an expert brand imagery auditor specializing in inclusive visual storytelling.

Analyze the COMPLETE visual asset inventory for this entity (not only the Visual Direction Do/Don't list — also Approved Imagery library, Image Assets, brochures, presentations/PowerPoints, PDFs, templates, and case studies) and score across 6 dimensions (0-100 each).

ENTITY: "${entityName}" (${entityType})
Archetype: ${archetype}
Mission: ${mission}
Values: ${JSON.stringify(values)}
Colors: ${JSON.stringify(colorNames)}

VISUAL ASSET INVENTORY (${totalAnalyzedAssets} total assets considered):
${inventory}

ASSET LABELS / CAPTIONS (sample):
${captionLines.length ? captionLines.join("\n") : "  (no captions available)"}

${visionSample.length ? `You will ALSO be shown ${visionSample.length} representative thumbnails. Inspect them visually for diversity, authenticity, action-orientation, cultural respect, and stock-photo dependency. Tie your findings back to the broader inventory above — extrapolate carefully when the sample is small.` : "No visual thumbnails are available; reason from the inventory and brand positioning only."}

STOP SIGNALS TO DETECT:
${IMAGERY_STOP_GO.stop_signals.map((s) => `- ${s}`).join("\n")}

GO SIGNALS TO LOOK FOR:
${IMAGERY_STOP_GO.go_signals.map((s) => `- ${s}`).join("\n")}

ADDITIONAL STOP SIGNALS:
- Tokenistic representation — single "diverse" person in a group
- Stereotypical roles (e.g., gender-specific occupations)
- Exoticizing or "othering" cultural imagery
- Inspiration porn — disability used as motivational device
- Homogeneous groups presented as universal default
- AI-generated faces or bodies without disclosure

ADDITIONAL GO SIGNALS:
- Authentic, candid moments over posed stock imagery
- Diverse age, ethnicity, gender, body type, and ability representation
- Contextual storytelling — people in real environments
- Inclusive family structures and relationship dynamics
- Cultural dress and traditions depicted respectfully

When writing recommendations, reference specific asset sources (e.g. "Approved Imagery — People section", "Brochure PDFs", "Presentation Templates") so the team knows where to act.`;

    const userContent: any[] = [{ type: "text", text: prompt }];
    for (const img of visionSample) {
      userContent.push({ type: "image_url", image_url: { url: img.url } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500, headers: corsHeaders });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a brand imagery auditor. Inspect any provided thumbnails alongside the textual inventory. Return structured JSON via the supplied tool only." },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "imagery_audit_result",
            description: "Return imagery audit scores and analysis",
            parameters: {
              type: "object",
              properties: {
                diversity_score: { type: "number", description: "0-100" },
                authenticity_score: { type: "number", description: "0-100" },
                cultural_context_score: { type: "number", description: "0-100" },
                action_orientation_score: { type: "number", description: "0-100" },
                inclusive_prompting_score: { type: "number", description: "0-100" },
                stock_dependency: { type: "string", enum: ["low", "medium", "high"] },
                stop_signals_detected: { type: "array", items: { type: "string" } },
                go_signals_present: { type: "array", items: { type: "string" } },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      dimension: { type: "string" },
                    },
                    required: ["title", "description", "priority", "dimension"],
                  },
                },
              },
              required: ["diversity_score", "authenticity_score", "cultural_context_score", "action_orientation_score", "inclusive_prompting_score", "stock_dependency", "stop_signals_detected", "go_signals_present", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "imagery_audit_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      // Return 200 with error payload so the Supabase client SDK doesn't throw
      // and discard the body — the hook reads data.error to show a toast.
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    const overall = Math.round(
      (result.diversity_score * 0.25) +
      (result.authenticity_score * 0.2) +
      (result.cultural_context_score * 0.2) +
      (result.action_orientation_score * 0.15) +
      (result.inclusive_prompting_score * 0.2)
    );

    const { data: audit, error: insertErr } = await adminClient
      .from("imagery_strategy_audits")
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId,
        overall_score: overall,
        diversity_score: result.diversity_score,
        authenticity_score: result.authenticity_score,
        cultural_context_score: result.cultural_context_score,
        action_orientation_score: result.action_orientation_score,
        inclusive_prompting_score: result.inclusive_prompting_score,
        stock_dependency: result.stock_dependency,
        stop_signals_detected: result.stop_signals_detected,
        go_signals_present: result.go_signals_present,
        recommendations: result.recommendations,
        // Reflect the broader inventory the audit considered
        images_analyzed: totalAnalyzedAssets,
        created_by: userId,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw new Error("Failed to save audit results");
    }

    return new Response(JSON.stringify({
      success: true,
      audit,
      meta: {
        sources_considered: counts,
        thumbnails_inspected: visionSample.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("imagery-strategy-audit error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
