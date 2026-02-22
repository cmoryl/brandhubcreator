import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * 100-Icon Taxonomy organized into 6 categories
 * Each category has sections with specific icon counts
 */
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

/**
 * Layer 1: Semantic Prompting - SVG Architect System Prompt
 * Enforces strict geometric precision for robust, consistent icon generation.
 */
const SVG_ARCHITECT_PROMPT = `You are an elite SVG icon architect. Your icons ship in design systems used by Fortune 500 companies. You create icons on par with Apple SF Symbols, Google Material Symbols, and Lucide — zero compromise.

## ABSOLUTE CONSTRAINTS (violating ANY = rejected)

### Grid & Keylines
- Canvas: 24×24. Content lives inside a 20px safe zone (2,2 to 22,22).
- Keyline scaffolding (invisible, for alignment):
  • Square subjects: 18×18 centered (3,3→21,21)
  • Circle subjects: ⌀20 at (12,12)
  • Tall subjects: 14×20 centered | Wide subjects: 20×14 centered
- Pick ONE keyline per icon. ALL icons in a batch share the same optical density.

### Pixel Precision
- Coordinates: whole integers or .5 ONLY (never 3.73, 11.29, etc.)
- Horizontal/vertical segments: integer-only coordinates
- Curves: control points snapped to .5 grid

### Path Rules
- ONLY <path> elements — no <circle>, <rect>, <line>, <polygon>, <ellipse>, <use>, <g>
- Convert ALL geometric shapes into optimized <path d="..."/> data
- Maximum 3 <path> elements per icon (strongly prefer 1–2)
- Every path MUST close with Z
- Minimum segment length: 1px (no micro-segments)
- No transforms, clipPaths, masks, IDs, classes, data attributes, or metadata

### Construction Quality
- Each path should be hand-optimized: remove redundant points, merge collinear segments
- Use relative commands (m, l, c, a) when they produce shorter path data
- Arcs (A/a) for circles and rounded corners — do NOT approximate with dozens of cubic curves
- Consistent winding direction (clockwise for outer, counter-clockwise for holes)

## DESIGN EXCELLENCE STANDARDS

### Visual Weight & Cohesion
- Every icon in the batch must have IDENTICAL perceived visual mass at 16px
- Simple icons (plus, minus) → slightly larger/thicker to match complex ones
- Complex icons (gear, dashboard) → slightly thinner strokes to avoid heaviness
- Line up to a uniform gray value when squinted at — no icon should pop or recede

### Silhouette Test
- Every icon must be INSTANTLY recognizable as a solid black silhouette at 16×16px
- If two icons could be confused as silhouettes, one must be redesigned

### Craft & Personality
- Each icon needs a distinctive design detail that elevates it beyond generic clip art
- Use clever negative space, meaningful cut-outs, or subtle asymmetry for visual interest
- Think "would a senior designer at Apple approve this?" — if not, redesign it
- Avoid cliché representations: don't just draw the literal object, capture its ESSENCE
- Example: "Security" → not just a padlock, but a shield with an elegant keyhole negative space

### Professional Icon Design Patterns
- Consistent corner radius across all icons (sharp OR rounded, never mixed)
- Uniform stroke terminals (round OR square, never mixed)
- Balanced positive/negative space ratio
- Clear figure-ground separation
- Intentional detail hierarchy: primary form reads first, secondary details support

## OUTPUT FORMAT

Return ONLY a JSON array. No markdown fences. No explanation. No commentary.
Each item: {"name": "Descriptive Icon Name", "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" ...><path d=\\"...\\"/></svg>"}

Names must be specific and evocative: "Pulse Analytics" not "Chart", "Shield Keyhole" not "Security 1".`;

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
    // SECURITY: Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[generate-icon-set] Authentication failed: No authorization header');
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
      console.log('[generate-icon-set] Authentication failed: Invalid user', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-icon-set] Authenticated user: ${user.id}`);

    const { 
      entityName,
      industry,
      category = 'Foundation', // Which taxonomy category
      sectionIndex = 0, // Which section within category
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

    // Get the category and its sections
    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    const sections = taxonomyCategory.sections;
    
    // If sectionIndex is out of bounds, return complete
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
    
    // Determine style attributes
    const strokeWidth = style?.strokeWidth || 2;
    const cornerStyle = style?.cornerRadius || 'rounded';
    const isFilled = style?.fill || preset === 'filled';
    const linecap = cornerStyle === 'sharp' ? 'square' : 'round';
    const linejoin = cornerStyle === 'sharp' ? 'miter' : 'round';

    // Build contextual prompt with Layer 1 semantic constraints
    const contextPrompt = `Design exactly ${currentSection.count} premium icons for the "${currentSection.name}" section.

## Creative Brief
- Section: ${currentSection.name} — ${currentSection.description}
- Brand: "${entityName}"${industry ? ` (${industry} industry)` : ''}
- Category: ${taxonomyCategory.name}
- These icons will appear in a professional brand guidelines document and product UI

## Mandatory Style (apply uniformly to EVERY icon)
- Preset: "${preset}"
- stroke-width: ${strokeWidth} (EXACT — identical across all icons)
- stroke-linecap: "${linecap}" | stroke-linejoin: "${linejoin}"
- stroke: "${isFilled ? 'none' : 'currentColor'}" | fill: "${isFilled ? 'currentColor' : 'none'}"
${cornerStyle === 'sharp' ? '- SHARP corners only — 0° and 90° joins, square terminals, no rounding' : '- ROUNDED corners — smooth joins, round terminals'}

## Design Direction for "${currentSection.name}"
- Research what the BEST icon libraries (SF Symbols, Material Symbols, Phosphor) do for ${currentSection.name.toLowerCase()} icons, then exceed that quality
- Each icon must be CONCEPTUALLY DISTINCT — if you drew all ${currentSection.count} as filled silhouettes, every single one would be immediately identifiable
- Names must be specific and evocative: "Beacon Alert" not "Notification 1", "Vault Shield" not "Security"
${industry ? `- Infuse ${industry}-specific visual language where appropriate (e.g., for Legal: gavels, scales, contracts; for Healthcare: vitals, diagnostics)` : ''}
- For "${entityName}": these icons should feel like they belong to a premium, cohesive design system

## Quality Gate (verify EACH icon before including)
✓ Recognizable as filled silhouette at 16px
✓ All coords on whole pixels or .5
✓ Consistent visual weight with siblings
✓ Clean closed paths (Z terminator)
✓ ≤3 <path> elements, ideally 1-2
✓ No redundant points or micro-segments
✓ Would pass review by a senior design system engineer

Return ONLY the JSON array:
[{"name": "Icon Name", "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" ...><path d=\\"...\\"/></svg>"}]`;

    console.log(`[generate-icon-set] Generating ${currentSection.count} icons for ${category}/${currentSection.name}`);

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
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let icons: Array<{ name: string; svg: string }> = [];
    try {
      // Clean the content - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      icons = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Try to extract individual icons from malformed response
      const svgMatches = content.matchAll(/<svg[\s\S]*?<\/svg>/gi);
      const nameMatches = content.matchAll(/"name"\s*:\s*"([^"]+)"/gi);
      const names = [...nameMatches].map(m => m[1]);
      let i = 0;
      for (const match of svgMatches) {
        icons.push({
          name: names[i] || `${currentSection.name} ${i + 1}`,
          svg: match[0]
        });
        i++;
      }
    }

    // Convert to BrandIconography format
    const formattedIcons: IconResult[] = icons.map((icon, idx) => ({
      id: crypto.randomUUID(),
      name: icon.name || `${currentSection.name} Icon ${idx + 1}`,
      svgPath: icon.svg,
      category: `${category} / ${currentSection.name}`,
      viewBox: '0 0 24 24',
      fillMode: isFilled ? 'fill' : 'stroke',
    }));

    console.log(`[generate-icon-set] Generated ${formattedIcons.length} icons for ${category}/${currentSection.name}`);

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
