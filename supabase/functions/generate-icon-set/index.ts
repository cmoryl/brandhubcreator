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
      { name: "Navigation", description: "Arrows, menus, wayfinding, breadcrumbs", count: 8 },
      { name: "UI States", description: "Toggle, checkbox, radio, expand/collapse", count: 6 },
      { name: "Basic Logic", description: "Plus, minus, close, check, refresh", count: 6 },
    ]
  },
  Communication: {
    name: "Communication",
    description: "Email, social, feedback, support",
    sections: [
      { name: "Messaging", description: "Chat bubbles, comments, conversations", count: 6 },
      { name: "Notifications", description: "Bells, alerts, badges, indicators", count: 5 },
      { name: "Social", description: "Share, like, follow, connect", count: 5 },
      { name: "Support", description: "Help, FAQ, contact, feedback", count: 4 },
    ]
  },
  "SaaS/Data": {
    name: "SaaS/Data",
    description: "Analytics, security, settings, workflows",
    sections: [
      { name: "Analytics", description: "Charts, graphs, metrics, dashboards", count: 7 },
      { name: "Security", description: "Locks, shields, keys, verification", count: 5 },
      { name: "Settings", description: "Gears, sliders, toggles, configuration", count: 5 },
      { name: "Workflows", description: "Process, automation, integrations", count: 5 },
    ]
  },
  "E-Commerce": {
    name: "E-Commerce",
    description: "Payments, shipping, storefront, loyalty",
    sections: [
      { name: "Shopping", description: "Cart, bag, wishlist, browse", count: 5 },
      { name: "Payments", description: "Cards, wallet, transactions, invoices", count: 5 },
      { name: "Shipping", description: "Delivery, tracking, packages, returns", count: 5 },
      { name: "Loyalty", description: "Rewards, points, membership, gifts", count: 3 },
    ]
  },
  "Marketing Hero": {
    name: "Marketing Hero",
    description: "Growth, trophies, trust signals, abstract concepts",
    sections: [
      { name: "Growth", description: "Rockets, trends, scales, expansion", count: 5 },
      { name: "Achievement", description: "Trophies, medals, badges, certificates", count: 4 },
      { name: "Trust", description: "Handshakes, guarantees, verified, secure", count: 4 },
      { name: "Abstract", description: "Innovation, ideas, concepts, vision", count: 4 },
    ]
  },
  "Industry Specific": {
    name: "Industry Specific",
    description: "Custom symbols based on user's niche",
    sections: [
      { name: "Professional", description: "Industry-relevant professional symbols", count: 5 },
      { name: "Technical", description: "Specialized technical icons", count: 5 },
      { name: "Domain", description: "Domain-specific imagery", count: 4 },
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
        entity_id: crypto.randomUUID(),
        entity_type: "icon_generation",
        user_id: user.id,
        status: "pending",
        result: { category, sectionIndex, style, preset, customCount, industry, entityName },
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

    const { category, sectionIndex, style, preset, customCount, industry, entityName } = params;
    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    const currentSection = taxonomyCategory.sections[sectionIndex];
    const iconCount = customCount && customCount > 0 ? customCount : currentSection.count;
    const strokeWidth = style?.strokeWidth || 2;
    const cornerStyle = style?.cornerRadius || "rounded";
    const isFilled = style?.fill || preset === "filled";
    const linecap = cornerStyle === "sharp" ? "square" : "round";
    const linejoin = cornerStyle === "sharp" ? "miter" : "round";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the world's foremost SVG icon architect. Your icons ship in Apple, Google, and Airbnb design systems. Every icon you create is a masterpiece of geometric precision.

## ABSOLUTE RULES — breaking ANY = entire batch rejected

### Canvas & Grid
- Canvas: 24×24 viewBox. Safe zone: 2px inset (content within 2,2 → 22,22).
- Keyline shapes (pick ONE per icon):
  • Square: 18×18 centered at 12,12 → (3,3)→(21,21)
  • Circle: ⌀20 centered at 12,12
  • Portrait: 14w×20h | Landscape: 20w×14h centered

### Coordinate Mastery
- ALL coordinates MUST be whole integers or exactly .5 (6, 12.5). NEVER 7.33 or 15.8.
- Horizontal/vertical lines: integer-only coordinates.

### SVG Purity
- ONLY <path> elements. NEVER <circle>, <rect>, <line>, <polygon>, <ellipse>, <g>, <use>, <defs>.
- Convert ALL shapes to optimized path data. Circles → arcs (A command).
- Maximum 2 <path> elements per icon. Strongly prefer 1 unified path.
- Every path MUST close with Z.
- No transforms, IDs, classes, style attributes, data-* attributes.

### Path Excellence
- Remove ALL redundant points. Merge collinear segments.
- Use arcs (A/a) for curves — never approximate circles with cubic Bézier chains.
- Consistent winding: clockwise outer, counter-clockwise inner.
- Minimum segment length: 1px.

## MASTER-LEVEL CRAFT

### Visual Weight (Critical)
- Every icon must have IDENTICAL perceived visual weight at 16px rendering.
- Simple icons get slightly more mass; complex icons use thinner strokes.
- All icons should resolve to the same gray value when squinted.

### Iconic Distinctiveness
- Each icon must pass the "12px silhouette test" — recognizable filled black at 12×12.
- No two icons confusable as silhouettes.
- Use negative space, meaningful cutouts, subtle asymmetry.
- Capture ESSENCE, not literal objects. A "security" icon shouldn't just be a lock.
- Names: specific + evocative ("Beacon Alert" not "Bell 1", "Cipher Key" not "Lock 2").

### Geometric Perfection
- Consistent corner treatment (ALL sharp OR ALL rounded, never mixed).
- Uniform stroke terminals (ALL round OR ALL square, never mixed).
- Balanced positive/negative space. Clear figure-ground separation.
- Optical alignment over mathematical alignment where they differ.
- These icons should be indistinguishable from Apple SF Symbols in quality.`;

    const userPrompt = `Design exactly ${iconCount} MASTER-QUALITY icons for the "${currentSection.name}" section.

## Context
- Section: ${currentSection.name} — ${currentSection.description}
- Brand: "${entityName}"${industry ? ` | Industry: ${industry}` : ""}
- Category: ${taxonomyCategory.name} — ${taxonomyCategory.description}
- These icons ship in a Fortune-500 brand design system and must be FLAWLESS

## Mandatory Style (identical on EVERY icon)
- Preset: "${preset}"
- stroke-width: ${strokeWidth}
- stroke-linecap: "${linecap}" | stroke-linejoin: "${linejoin}"
- stroke: "${isFilled ? "none" : "currentColor"}" | fill: "${isFilled ? "currentColor" : "none"}"
${cornerStyle === "sharp" ? "- SHARP corners — 0° and 90° joins, square terminals, zero rounding" : "- ROUNDED corners — smooth joins, round terminals, gentle curves"}

## Design Direction
- Study Apple SF Symbols, Google Material Symbols, Phosphor, and Lucide "${currentSection.name.toLowerCase()}" icons. Then EXCEED that quality.
- Each icon: conceptually distinct, immediately distinguishable at 12px as filled silhouettes.
- Names: specific + evocative ("Beacon Alert" not "Notification 1", "Cipher Key" not "Security").
${industry ? `- Infuse ${industry} visual language: domain-specific metaphors, not generic.` : ""}
- These should feel like premium icons designed specifically for "${entityName}".

## Pre-Submission Checklist (verify EACH icon before submitting)
✓ Recognizable as filled silhouette at 12×12px
✓ ALL coordinates on whole integers or .5 — ZERO arbitrary decimals
✓ Uniform visual weight across all siblings
✓ Clean closed paths ending with Z
✓ ≤2 <path> elements (prefer 1)
✓ No primitives — paths only
✓ No redundant points, micro-segments, or transform attributes
✓ Would be accepted into Apple SF Symbols`;

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

    // Post-process SVGs
    const formattedIcons = icons.map((icon, idx) => {
      let svg = icon.svg || "";
      if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      if (!svg.includes("viewBox=")) svg = svg.replace("<svg", '<svg viewBox="0 0 24 24"');
      return {
        id: crypto.randomUUID(),
        name: icon.name || `${currentSection.name} Icon ${idx + 1}`,
        svgPath: svg,
        category: `${category} / ${currentSection.name}`,
        viewBox: "0 0 24 24",
        fillMode: isFilled ? "fill" : "stroke",
      };
    });

    console.log(`[generate-icon-set-worker] Completed: ${formattedIcons.length} icons for ${category}/${currentSection.name}`);

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
