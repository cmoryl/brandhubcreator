import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ICON_TAXONOMY: Record<string, { name: string; description: string; sections: { name: string; description: string; count: number }[] }> = {
  Foundation: {
    name: "Foundation",
    description: "Navigation, UI states, basic logic",
    sections: [
      { name: "Navigation", description: "Arrows, menus, wayfinding, breadcrumbs", count: 30 },
      { name: "UI States", description: "Toggle, checkbox, radio, expand/collapse", count: 30 },
      { name: "Basic Logic", description: "Plus, minus, close, check, refresh", count: 30 },
    ]
  },
  Communication: {
    name: "Communication",
    description: "Email, social, feedback, support",
    sections: [
      { name: "Messaging", description: "Chat bubbles, comments, conversations", count: 30 },
      { name: "Notifications", description: "Bells, alerts, badges, indicators", count: 30 },
      { name: "Social", description: "Share, like, follow, connect", count: 30 },
      { name: "Support", description: "Help, FAQ, contact, feedback", count: 30 },
    ]
  },
  "SaaS/Data": {
    name: "SaaS/Data",
    description: "Analytics, security, settings, workflows",
    sections: [
      { name: "Analytics", description: "Charts, graphs, metrics, dashboards", count: 30 },
      { name: "Security", description: "Locks, shields, keys, verification", count: 30 },
      { name: "Settings", description: "Gears, sliders, toggles, configuration", count: 30 },
      { name: "Workflows", description: "Process, automation, integrations", count: 30 },
    ]
  },
  "E-Commerce": {
    name: "E-Commerce",
    description: "Payments, shipping, storefront, loyalty",
    sections: [
      { name: "Shopping", description: "Cart, bag, wishlist, browse", count: 30 },
      { name: "Payments", description: "Cards, wallet, transactions, invoices", count: 30 },
      { name: "Shipping", description: "Delivery, tracking, packages, returns", count: 30 },
      { name: "Loyalty", description: "Rewards, points, membership, gifts", count: 30 },
    ]
  },
  "Marketing Hero": {
    name: "Marketing Hero",
    description: "Growth, trophies, trust signals, abstract concepts",
    sections: [
      { name: "Growth", description: "Rockets, trends, scales, expansion", count: 30 },
      { name: "Achievement", description: "Trophies, medals, badges, certificates", count: 30 },
      { name: "Trust", description: "Handshakes, guarantees, verified, secure", count: 30 },
      { name: "Abstract", description: "Innovation, ideas, concepts, vision", count: 30 },
    ]
  },
  "Industry Specific": {
    name: "Industry Specific",
    description: "Custom symbols based on user's niche",
    sections: [
      { name: "Professional", description: "Industry-relevant professional symbols", count: 30 },
      { name: "Technical", description: "Specialized technical icons", count: 30 },
      { name: "Domain", description: "Domain-specific imagery", count: 30 },
    ]
  },
  "Brand Signature": {
    name: "Brand Signature",
    description: "Bespoke icons derived from THIS brand's DNA — services, archetype, mission, values",
    sections: [
      { name: "Services & Offerings", description: "One distinct icon per service/offering the brand actually delivers — concrete metaphors, not generic stand-ins", count: 40 },
      { name: "Archetype & Values", description: "Symbols that embody the brand's archetype and core values translated into visual metaphor", count: 40 },
      { name: "Mission Moments", description: "Icons depicting the brand's mission in action — the verbs and outcomes from the mission statement and tagline", count: 40 },
    ]
  }
};


async function dbFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=minimal" : "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB error ${res.status}: ${text}`);
  }
  if (options.method === "PATCH") return null;
  return res.json();
}

async function verifyAuth(authHeader: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: authHeader,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = await verifyAuth(authHeader);
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    // Poll mode: check job status
    if (body.jobId) {
      const jobs = await dbFetch(`brand_intelligence_jobs?id=eq.${body.jobId}&select=id,status,result,error_message`);
      const job = jobs?.[0];
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        status: job.status,
        icons: job.status === "completed" ? job.result?.icons : undefined,
        category: job.result?.category,
        section: job.result?.section,
        sectionDescription: job.result?.sectionDescription,
        currentIndex: job.result?.currentIndex,
        totalSections: job.result?.totalSections,
        nextIndex: job.result?.nextIndex,
        complete: job.result?.complete,
        taxonomy: job.result?.taxonomy,
        error: job.error_message,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create mode: start generation job
    const {
      entityName,
      entityId,
      entityType,
      industry,
      category = "Foundation",
      sectionIndex = 0,
      style = { strokeWidth: 2, cornerRadius: "rounded", fill: false },
      preset = "outlined",
      customCount,
    } = body;

    if (!entityName) {
      return new Response(JSON.stringify({ error: "Entity name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    if (sectionIndex >= taxonomyCategory.sections.length) {
      return new Response(JSON.stringify({
        complete: true, category, totalSections: taxonomyCategory.sections.length,
        message: `All ${category} sections generated`
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create a job record
    const jobData = await dbFetch("brand_intelligence_jobs", {
      method: "POST",
      body: JSON.stringify({
        entity_id: entityId || crypto.randomUUID(),
        entity_type: "icon_generation",
        user_id: user.id,
        status: "pending",
        result: { category, sectionIndex, style, preset, customCount, industry, entityName, entityId, entityType },
      }),
    });

    const jobId = jobData[0]?.id;
    if (!jobId) throw new Error("Failed to create job");

    console.log(`[generate-icon-set] Created job ${jobId} for ${category}/${taxonomyCategory.sections[sectionIndex].name}`);

    // Kick off background worker
    EdgeRuntime.waitUntil(runWorker(jobId));

    return new Response(JSON.stringify({ jobId, status: "pending" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Generate icon set error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function runWorker(jobId: string) {
  try {
    // Mark as processing
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "processing", started_at: new Date().toISOString() }),
    });

    // Load job params
    const jobs = await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}&select=result`);
    const params = jobs?.[0]?.result;
    if (!params) throw new Error("No job params found");

    const { category, sectionIndex, style, preset, customCount, industry, entityName, entityId, entityType } = params;
    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    const currentSection = taxonomyCategory.sections[sectionIndex];
    const iconCount = customCount && customCount > 0 ? customCount : currentSection.count;
    const isFilled = style?.fill || preset === "filled";
    // Minimal-line default: 1.5px stroke (Lucide/Tabler/Feather DNA) unless explicitly overridden.
    const strokeWidth = style?.strokeWidth ?? (isFilled ? 0 : 1.5);
    const cornerStyle = style?.cornerRadius || "rounded";
    const linecap = cornerStyle === "sharp" ? "square" : "round";
    const linejoin = cornerStyle === "sharp" ? "miter" : "round";

    // ── Brand DNA: pull rich context so icons feel tailored to the brand ──
    const brandDNA = await loadBrandDNA(entityId, entityType);
    const brandContextBlock = buildBrandContextBlock({ entityName, industry, brandDNA });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the world's foremost SVG icon architect. Your work ships in Lucide, Tabler, Feather, Phosphor, Apple SF Symbols and Google Material Symbols. Every icon is a geometric masterpiece.

## NON-NEGOTIABLE RULES — any violation rejects the whole batch

### Canvas & Grid
- viewBox: "0 0 24 24". Safe zone: keep all content inside (2,2)→(22,22).
- Optical center at 12,12. Pick ONE keyline per icon:
  • Square 18×18 at (3,3)→(21,21)
  • Circle Ø20 centered
  • Portrait 14w×20h | Landscape 20w×14h
- Snap to a 1px grid. Allowed coordinate fractions: .0 and .5 ONLY. NEVER 7.33, 15.8, 4.27.

### SVG Purity (HARD)
- ONLY <path> elements inside <svg>. NO <circle>, <rect>, <line>, <polygon>, <polyline>, <ellipse>, <g>, <use>, <defs>, <mask>, <clipPath>, <style>, <filter>.
- Max 2 paths, strongly prefer 1.
- Use arcs (A/a) for circular curves. Never approximate circles with cubic Bézier chains.
- NO transform=, NO id=, NO class=, NO style=, NO data-*, NO inline fill/stroke colors (those come from the wrapper).

### Stroke Style
${isFilled
  ? `- This batch is FILLED: solid shapes, no stroke. Each path: fill="currentColor".`
  : `- This batch is OUTLINED: stroke-only, no fills. Lines feel like a ${strokeWidth}px pen by Lucide/Tabler/Feather.
- The host wrapper applies: fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${linecap}" stroke-linejoin="${linejoin}".
- DO NOT bake fills, gradients, or duotone shading. Pure outlines only.
- Stroke terminals and joins are UNIFORM across the entire batch.`}

## MASTER CRAFT

### Visual Weight
- All icons must look the SAME WEIGHT when squinted at 16px. Simpler shapes get a bit more mass, complex shapes thin out.
- Pass the 12px silhouette test: still recognizable, still distinct.

### Distinctiveness
- No two icons in a batch should be confusable in silhouette.
- Capture ESSENCE, not literal objects.
- Names: specific + evocative ("Beacon Alert" not "Bell 1").

### Geometric Perfection
- Consistent corners across the batch (ALL sharp OR ALL rounded — never mixed).
- Consistent terminals across the batch.
- Optical alignment beats mathematical alignment.

## CREATIVE AMBITION (non-negotiable)
You are NOT making a stock icon pack. You are making a curated, gallery-grade collection that an art director would screenshot.

- BAN the obvious solution. For each concept, brainstorm 3 metaphors silently, then pick the one that is LEAST predictable but still instantly readable. Reject the first idea that comes to mind — it's almost always the cliché (cloud=cloud shape, security=padlock, idea=lightbulb, analytics=bar chart, settings=gear, user=head-and-shoulders, time=clock face, message=speech bubble, search=magnifier). Find a fresher symbol that means the same thing.
- COMPOSE, don't label. Combine 2 micro-elements into one tight glyph that creates a NEW meaning (e.g. compass-needle + sound-wave = "navigate audio"; seed + circuit-node = "growth engine"). One coherent silhouette, never two icons glued together.
- SURPRISE ANGLE. Prefer unexpected viewpoints: top-down, cross-section, exploded, isometric hint, negative-space cutouts, half-glyphs that imply the whole. A book seen from the spine. A bridge seen end-on. A wave mid-break.
- NEGATIVE SPACE AS SUBJECT. At least ~25% of the batch should use counter-form, cutouts, or implied shape as the primary storytelling device.
- ASYMMETRY WITH PURPOSE. Avoid mirror-symmetric defaults unless the concept demands it. Tilt, offset, or weight one side to give the glyph energy.
- METAPHOR LADDER. For every icon ask: literal → functional → poetic. Ship the poetic one IF it still reads in 0.3s. Otherwise ship functional. NEVER ship literal.
- ZERO RECYCLED SHAPES across the batch. If two icons share a base form (e.g. both built on a circle-with-line), redesign one. Silhouette diversity is the headline metric.
- KILL DECORATION. Sparkles, stars, dots, motion-lines, and corner accents are forbidden unless they ARE the concept. Every stroke must carry meaning.
- BRAND-NATIVE METAPHORS. Mine the brand DNA (archetype, services, mission verbs) for symbols competitors would never think to use. The collection should feel un-portable to any other brand.

These icons must be indistinguishable in quality from a hand-crafted Lucide release — and more interesting than one.`;


    const userPrompt = `Design exactly ${iconCount} MASTER-QUALITY icons for the "${currentSection.name}" section.

## Context
- Section: ${currentSection.name} — ${currentSection.description}
- Category: ${taxonomyCategory.name} — ${taxonomyCategory.description}

${brandContextBlock}

## Mandatory Style (identical on EVERY icon)
- Preset: "${preset}"
- ${isFilled ? "FILLED" : `OUTLINED, stroke-width ${strokeWidth}`}, ${cornerStyle} corners
- stroke-linecap "${linecap}" / stroke-linejoin "${linejoin}"
${isFilled
  ? `- Each path: fill="currentColor" stroke="none"`
  : `- Each path: fill="none" stroke="currentColor" (wrapper enforces this — do NOT add color attributes yourself)`}

## Design Direction
- Reference: Lucide "${currentSection.name.toLowerCase()}", Tabler outline, Feather, Phosphor regular. Then EXCEED them.
- Each icon must read clearly at 16px and remain a distinct silhouette at 12px.
- Translate the brand DNA above into metaphor choices — e.g. if the brand archetype is "Sage", lean on tomes/lenses/compass motifs; if "Outlaw", lean on bolts/sparks/asymmetry. NEVER generic stock.
- For Industry-Specific sections, draw 60%+ of metaphors from the brand's actual services/products listed above.
- These should feel like premium icons designed specifically for "${entityName}", not interchangeable with another brand's set.

## Pre-Submission Checklist (verify EACH icon)
✓ Only <path> elements, max 2, prefer 1
✓ ALL coordinates are integers or .5 — ZERO arbitrary decimals
✓ No transforms, no inline colors, no ids/classes/styles
✓ Uniform visual weight across the batch
✓ Recognizable as a silhouette at 12×12
✓ Reflects the brand DNA, not a generic icon-set
✓ Would be accepted into a Lucide pull request`;

    console.log(`[generate-icon-set-worker] Generating ${iconCount} icons via gemini-2.5-pro for ${category}/${currentSection.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_icons",
            description: "Submit the generated SVG icons",
            parameters: {
              type: "object",
              properties: {
                icons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Specific, evocative icon name" },
                      svg: { type: "string", description: "Complete SVG element string" },
                    },
                    required: ["name", "svg"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["icons"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_icons" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI gateway ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let icons: Array<{ name: string; svg: string }> = [];

    // Tool call extraction
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        icons = parsed.icons || [];
        console.log(`[generate-icon-set-worker] Extracted ${icons.length} icons via tool calling`);
      } catch (e) {
        console.error("[generate-icon-set-worker] Tool call parse error:", e);
      }
    }

    // Fallback: content parsing
    if (icons.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        let clean = content.trim();
        if (clean.startsWith("```json")) clean = clean.slice(7);
        else if (clean.startsWith("```")) clean = clean.slice(3);
        if (clean.endsWith("```")) clean = clean.slice(0, -3);
        icons = JSON.parse(clean.trim());
      } catch {
        const svgMatches = [...content.matchAll(/<svg[\s\S]*?<\/svg>/gi)];
        const nameMatches = [...content.matchAll(/"name"\s*:\s*"([^"]+)"/gi)];
        icons = svgMatches.map((m, i) => ({
          name: nameMatches[i]?.[1] || `${currentSection.name} ${i + 1}`,
          svg: m[0],
        }));
      }
    }

    // Sanitize + validate each SVG against the rule set. Reject icons we can't fix.
    const cleaned = icons
      .map((icon, idx) => {
        const result = sanitizeAndValidate(icon.svg || "", { isFilled, strokeWidth, linecap, linejoin });
        if (!result.ok) {
          console.warn(`[generate-icon-set-worker] Rejected icon "${icon.name}": ${result.reason}`);
          return null;
        }
        return {
          id: crypto.randomUUID(),
          name: icon.name || `${currentSection.name} Icon ${idx + 1}`,
          svgPath: result.svg,
          category: `${category} / ${currentSection.name}`,
          viewBox: "0 0 24 24",
          fillMode: isFilled ? "fill" : "stroke",
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const formattedIcons = cleaned;
    console.log(`[generate-icon-set-worker] Completed: ${formattedIcons.length}/${icons.length} icons passed validation for ${category}/${currentSection.name}`);

    // Save result
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: {
          icons: formattedIcons,
          category,
          section: currentSection.name,
          sectionDescription: currentSection.description,
          currentIndex: sectionIndex,
          totalSections: taxonomyCategory.sections.length,
          nextIndex: sectionIndex + 1,
          complete: sectionIndex >= taxonomyCategory.sections.length - 1,
          taxonomy: {
            categoryName: taxonomyCategory.name,
            categoryDescription: taxonomyCategory.description,
            totalCategories: Object.keys(ICON_TAXONOMY).length,
          },
        },
      }),
    });
  } catch (error) {
    console.error("[generate-icon-set-worker] Error:", error);
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }),
    });
  }
}

/**
 * Strict sanitizer + validator for generated SVG icons.
 * - Strips forbidden elements/attributes (transform, id, class, style, inline colors, gradients, defs…).
 * - Forces the wrapper attributes to the requested stroke/fill mode (so the AI can't smuggle in baked colors).
 * - Rejects icons that use disallowed primitives, have wild decimal coords, or are missing paths.
 */
function sanitizeAndValidate(
  raw: string,
  opts: { isFilled: boolean; strokeWidth: number; linecap: string; linejoin: string },
): { ok: true; svg: string } | { ok: false; reason: string } {
  let svg = String(raw || "").trim();
  if (!svg.startsWith("<svg")) return { ok: false, reason: "missing <svg> root" };

  // Disallowed primitives & wrappers — if the model used them, reject (instead of silently breaking layout).
  if (/<(circle|rect|line|polygon|polyline|ellipse|g|use|defs|mask|clipPath|style|filter|linearGradient|radialGradient|image|text|foreignObject)\b/i.test(svg)) {
    return { ok: false, reason: "contains forbidden SVG primitive" };
  }

  // Must contain at least one <path d="…">
  const pathMatches = [...svg.matchAll(/<path\b[^>]*\bd\s*=\s*"([^"]+)"[^>]*\/?>/gi)];
  if (pathMatches.length === 0) return { ok: false, reason: "no <path d=…> found" };
  if (pathMatches.length > 3) return { ok: false, reason: `${pathMatches.length} paths (max 3)` };

  // Reject wild decimal coordinates (more than 2 decimal places, or non-.5 fractions are a soft warning only).
  for (const m of pathMatches) {
    const d = m[1];
    const badDecimals = d.match(/\d+\.\d{3,}/g);
    if (badDecimals && badDecimals.length > 0) {
      return { ok: false, reason: `path has ${badDecimals.length} high-precision decimals (snap to .0/.5)` };
    }
  }

  // Strip forbidden attributes from every element.
  svg = svg.replace(/\s(id|class|style|data-[\w-]+|transform)\s*=\s*"[^"]*"/gi, "");

  // Strip baked colors from inner elements (we re-apply wrapper-level coloring).
  svg = svg.replace(/<(path|svg)\b([^>]*)>/gi, (_, tag, attrs) => {
    const cleaned = attrs
      .replace(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|opacity|fill-opacity|stroke-opacity)\s*=\s*"[^"]*"/gi, "");
    return `<${tag}${cleaned}>`;
  });

  // Force a clean, predictable <svg ...> opening tag with our enforced attributes.
  const wrapperAttrs = opts.isFilled
    ? `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none"`
    : `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth}" stroke-linecap="${opts.linecap}" stroke-linejoin="${opts.linejoin}"`;

  svg = svg.replace(/<svg\b[^>]*>/i, `<svg ${wrapperAttrs}>`);

  // Final sanity: must still parse as a closed <svg>…</svg>.
  if (!/<\/svg>\s*$/i.test(svg)) return { ok: false, reason: "unterminated <svg>" };

  return { ok: true, svg };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Brand DNA loader — pulls archetype, services, values, tone, mission, etc.  */
/* directly from the entity's guide_data so the AI can design brand-specific  */
/* icons instead of generic taxonomy fill.                                    */
/* ────────────────────────────────────────────────────────────────────────── */

interface BrandDNA {
  archetype?: string;
  mission?: string;
  tagline?: string;
  toneOfVoice?: string[];
  values?: string[];
  services?: string[];
  primaryColor?: string;
  industry?: string;
}

async function loadBrandDNA(entityId?: string, entityType?: string): Promise<BrandDNA | null> {
  if (!entityId || !entityType) return null;
  const table = entityType === "brand" ? "brands" : entityType === "product" ? "products" : entityType === "event" ? "events" : null;
  if (!table) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_entity_text_context`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_table: table, p_id: entityId }),
    });
    if (!res.ok) return null;
    const ctx = await res.json();
    if (!ctx) return null;
    const toArr = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : String(x ?? ""))).filter(Boolean);
      return [];
    };
    const primaryColorObj = Array.isArray(ctx.colors)
      ? (ctx.colors.find((c: any) => (c?.role || "").toLowerCase() === "primary") ?? ctx.colors[0])
      : null;
    return {
      archetype: ctx.archetype || undefined,
      mission: ctx.mission || undefined,
      tagline: ctx.primary_tagline || ctx.hero_tagline || undefined,
      toneOfVoice: toArr(ctx.tone_of_voice).slice(0, 4),
      values: toArr(ctx.values).slice(0, 5),
      services: toArr(ctx.services).slice(0, 6),
      primaryColor: primaryColorObj?.hex || undefined,
      industry: ctx.industry || undefined,
    };
  } catch (err) {
    console.warn("[generate-icon-set-worker] Brand DNA fetch failed:", err);
    return null;
  }
}

function buildBrandContextBlock(args: { entityName: string; industry?: string; brandDNA: BrandDNA | null }): string {
  const { entityName, industry, brandDNA } = args;
  const lines: string[] = ["## Brand DNA (design FOR this brand, not generic)"];
  lines.push(`- Brand: "${entityName}"`);
  const effIndustry = brandDNA?.industry || industry;
  if (effIndustry) lines.push(`- Industry: ${effIndustry}`);
  if (brandDNA?.archetype) lines.push(`- Archetype: ${brandDNA.archetype} → metaphor vocabulary should reflect this archetype's symbols`);
  if (brandDNA?.mission) lines.push(`- Mission: ${truncate(brandDNA.mission, 220)}`);
  if (brandDNA?.tagline) lines.push(`- Tagline: "${truncate(brandDNA.tagline, 140)}"`);
  if (brandDNA?.toneOfVoice?.length) lines.push(`- Voice: ${brandDNA.toneOfVoice.join(", ")} — translate these adjectives into line quality, corner style, and gesture`);
  if (brandDNA?.values?.length) lines.push(`- Values: ${brandDNA.values.join(", ")}`);
  if (brandDNA?.services?.length) lines.push(`- Services / offerings: ${brandDNA.services.join("; ")}`);
  if (brandDNA?.primaryColor) lines.push(`- Primary color (for context only — DO NOT bake into SVG): ${brandDNA.primaryColor}`);
  if (lines.length === 1) {
    // No DNA loaded — fall back to minimal context
    lines.push(`- (No deep brand context available — design crisp, neutral icons that still feel premium.)`);
  }
  return lines.join("\n");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
