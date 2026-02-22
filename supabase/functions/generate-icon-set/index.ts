import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const SVG_ARCHITECT_PROMPT = `You are a world-class SVG icon designer who has designed icons for Apple, Google, and Figma. You produce icons that rival SF Symbols and Material Symbols in craft and precision.

## IRON RULES — violating ANY means the entire output is rejected

### Canvas & Grid
- Canvas: 24×24 viewBox. Safe zone: 2px inset on all sides (content between 2,2 and 22,22).
- Keyline geometry (choose ONE per icon, keep consistent across batch):
  • Square: 18×18 centered at 12,12 → bounds (3,3)→(21,21)
  • Circle: ⌀20 centered at 12,12
  • Portrait: 14w×20h centered | Landscape: 20w×14h centered

### Coordinate Precision
- ALL coordinates must be whole integers or exactly .5 (e.g., 6, 12.5). NEVER use arbitrary decimals like 7.33 or 15.8.
- Horizontal & vertical lines: integer-only coordinates.

### SVG Element Rules
- ONLY <path> elements. NEVER use <circle>, <rect>, <line>, <polygon>, <ellipse>, <g>, <use>, <defs>, <clipPath>, <mask>.
- Convert geometric shapes to optimized path data using arcs (A command) for curves.
- Maximum 3 <path> elements per icon. Strongly prefer 1 unified path.
- Every path MUST be closed with Z.
- No transforms, no IDs, no classes, no style attributes, no data-* attributes.

### Path Optimization
- Remove redundant points, merge collinear segments.
- Use arcs (A/a) for circles and rounded corners — never approximate circles with cubic Bézier chains.
- Consistent winding: clockwise outer, counter-clockwise inner (even-odd fill rule).
- Minimum segment length: 1px.

## DESIGN EXCELLENCE

### Visual Consistency (Critical)
- Every icon in the batch must have IDENTICAL perceived visual weight at 16px rendering.
- Simple icons get slightly more mass; complex icons get slightly thinner strokes.
- When squinted, all icons should resolve to the same gray value.

### Distinctiveness & Craft
- Each icon must pass the "16px silhouette test" — instantly recognizable filled black at 16×16.
- No two icons should be confusable as silhouettes.
- Use clever negative space, meaningful cutouts, or subtle asymmetry.
- Avoid cliché: capture the ESSENCE of the concept, not just the literal object.
- Names must be specific and evocative: "Beacon Alert" not "Bell 1", "Vault Shield" not "Lock".

### Professional Standards
- Consistent corner treatment across all icons (ALL sharp OR ALL rounded, never mixed).
- Uniform stroke terminals (ALL round OR ALL square, never mixed).
- Balanced positive/negative space. Clear figure-ground separation.
- Would pass review by a principal designer at a Big Tech design system team.

## OUTPUT FORMAT
Return ONLY a raw JSON array (no markdown, no explanation, no backticks):
[{"name":"Descriptive Icon Name","svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M..Z\\"/></svg>"}]`;

interface IconResult {
  id: string;
  name: string;
  svgPath: string;
  category: string;
  viewBox: string;
  fillMode: 'stroke' | 'fill';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      entityName,
      industry,
      category = 'Foundation',
      sectionIndex = 0,
      style = { strokeWidth: 2, cornerRadius: 'rounded', fill: false },
      preset = 'outlined',
    } = await req.json();

    if (!entityName) {
      return new Response(
        JSON.stringify({ error: "Entity name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    const sections = taxonomyCategory.sections;

    if (sectionIndex >= sections.length) {
      return new Response(
        JSON.stringify({
          complete: true,
          category,
          totalSections: sections.length,
          message: `All ${category} sections generated`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentSection = sections[sectionIndex];
    const strokeWidth = style?.strokeWidth || 2;
    const cornerStyle = style?.cornerRadius || 'rounded';
    const isFilled = style?.fill || preset === 'filled';
    const linecap = cornerStyle === 'sharp' ? 'square' : 'round';
    const linejoin = cornerStyle === 'sharp' ? 'miter' : 'round';

    const contextPrompt = `Design exactly ${currentSection.count} premium, production-ready icons for the "${currentSection.name}" section.

## Context
- Section: ${currentSection.name} — ${currentSection.description}
- Brand: "${entityName}"${industry ? ` | Industry: ${industry}` : ''}
- Category: ${taxonomyCategory.name} — ${taxonomyCategory.description}
- These icons will ship in a Fortune-500-grade brand design system

## Mandatory Style (identical on EVERY icon)
- Preset: "${preset}"
- stroke-width: ${strokeWidth}
- stroke-linecap: "${linecap}" | stroke-linejoin: "${linejoin}"
- stroke: "${isFilled ? 'none' : 'currentColor'}" | fill: "${isFilled ? 'currentColor' : 'none'}"
${cornerStyle === 'sharp' ? '- SHARP corners — 0° and 90° joins, square terminals, zero rounding' : '- ROUNDED corners — smooth joins, round terminals, gentle curves'}

## Design Direction
- Study how Apple SF Symbols, Google Material Symbols, Phosphor, and Lucide handle "${currentSection.name.toLowerCase()}" icons — then EXCEED that quality
- Each icon must be conceptually distinct — all ${currentSection.count} must be immediately distinguishable as filled silhouettes at 16px
- Names: specific + evocative ("Beacon Alert" not "Notification 1", "Vault Shield" not "Security")
${industry ? `- Infuse ${industry} visual language where meaningful (domain-specific metaphors, not generic)` : ''}
- These should feel like premium, cohesive icons designed specifically for "${entityName}"

## Pre-Submission Checklist (verify EACH icon)
✓ Recognizable as filled silhouette at 16×16px
✓ ALL coordinates on whole integers or .5 — NO arbitrary decimals
✓ Uniform visual weight across all siblings
✓ Clean closed paths ending with Z
✓ ≤3 <path> elements (prefer 1-2)
✓ No primitives (<circle>, <rect>, etc.) — paths only
✓ No redundant points, micro-segments, or transform attributes
✓ Would be accepted into the Lucide icon library

Return ONLY the raw JSON array — no markdown, no backticks, no explanation.`;

    console.log(`[generate-icon-set] Generating ${currentSection.count} icons: ${category}/${currentSection.name} via gemini-2.5-pro`);

    // Use tool calling for structured output — far more reliable than freeform JSON
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SVG_ARCHITECT_PROMPT },
          { role: "user", content: contextPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_icons",
              description: "Submit the generated SVG icons as a structured array",
              parameters: {
                type: "object",
                properties: {
                  icons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Specific, evocative icon name" },
                        svg: { type: "string", description: "Complete SVG element string with xmlns, viewBox, and path data" }
                      },
                      required: ["name", "svg"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["icons"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_icons" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate icons");
    }

    const data = await response.json();

    // Extract icons — try tool call first, then fall back to content parsing
    let icons: Array<{ name: string; svg: string }> = [];

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        icons = parsed.icons || [];
        console.log(`[generate-icon-set] Extracted ${icons.length} icons via tool calling`);
      } catch (e) {
        console.error("[generate-icon-set] Failed to parse tool call arguments:", e);
      }
    }

    // Fallback: parse from content if tool calling didn't work
    if (icons.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
        else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
        if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
        cleanContent = cleanContent.trim();
        icons = JSON.parse(cleanContent);
        console.log(`[generate-icon-set] Extracted ${icons.length} icons via content parsing`);
      } catch {
        // Last resort: regex extraction
        const svgMatches = [...content.matchAll(/<svg[\s\S]*?<\/svg>/gi)];
        const nameMatches = [...content.matchAll(/"name"\s*:\s*"([^"]+)"/gi)];
        icons = svgMatches.map((m, i) => ({
          name: nameMatches[i]?.[1] || `${currentSection.name} ${i + 1}`,
          svg: m[0]
        }));
        console.log(`[generate-icon-set] Extracted ${icons.length} icons via regex fallback`);
      }
    }

    // Post-process: sanitize SVGs
    const formattedIcons: IconResult[] = icons.map((icon, idx) => {
      let svg = icon.svg || '';
      
      // Ensure proper xmlns
      if (!svg.includes('xmlns=')) {
        svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      // Ensure viewBox
      if (!svg.includes('viewBox=')) {
        svg = svg.replace('<svg', '<svg viewBox="0 0 24 24"');
      }

      return {
        id: crypto.randomUUID(),
        name: icon.name || `${currentSection.name} Icon ${idx + 1}`,
        svgPath: svg,
        category: `${category} / ${currentSection.name}`,
        viewBox: '0 0 24 24',
        fillMode: isFilled ? 'fill' as const : 'stroke' as const,
      };
    });

    console.log(`[generate-icon-set] Returning ${formattedIcons.length} icons for ${category}/${currentSection.name}`);

    return new Response(
      JSON.stringify({
        category,
        section: currentSection.name,
        sectionDescription: currentSection.description,
        icons: formattedIcons,
        currentIndex: sectionIndex,
        totalSections: sections.length,
        nextIndex: sectionIndex + 1,
        complete: sectionIndex >= sections.length - 1,
        taxonomy: {
          categoryName: taxonomyCategory.name,
          categoryDescription: taxonomyCategory.description,
          totalCategories: Object.keys(ICON_TAXONOMY).length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate icon set error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
