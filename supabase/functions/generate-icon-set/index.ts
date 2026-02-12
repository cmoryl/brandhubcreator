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
const SVG_ARCHITECT_PROMPT = `You are a world-class SVG icon designer producing a cohesive brand icon library that rivals Lucide, Phosphor, and SF Symbols in quality. Every icon must be portfolio-worthy.

## GOLDEN RULES — Violating any is unacceptable

1. **Keyline Geometry**: Every icon on a 24×24 grid using invisible scaffolding:
   - Square content: 18×18 centered (3,3 to 21,21)
   - Circle content: 20px diameter at center 12,12
   - Vertical rect: 14×20 centered | Horizontal rect: 20×14 centered
   Choose the keyline fitting the subject. ALL icons in a set must use consistent keylines for their type.

2. **Optical Weight**: Every icon must have EQUAL perceived visual mass. Simple icons (plus, minus) need slightly larger/thicker forms. Complex icons (gear, chart) can be slightly thinner. The set must look uniform at a glance.

3. **Pixel-Perfect Construction**:
   - ALL coordinates: whole pixels or .5 increments only
   - Horizontal/vertical lines: integer coordinates ONLY
   - NEVER use coordinates like 3.73 or 17.291
   - Curves: control points on whole or .5 pixels

4. **Path Craftsmanship**:
   - MINIMUM segments possible. Simplicity = quality
   - Every path CLOSED (Z) for fill compatibility
   - Maximum 3 <path> elements per icon (prefer 1-2)
   - No tiny segments under 1px

5. **Distinctive Silhouettes**: Each icon instantly recognizable as a filled shape at 16×16px.

6. **Set Cohesion**: All icons in this batch must feel like siblings — same stroke weight, same corner treatment, same level of detail, same optical density.

## TECHNICAL REQUIREMENTS

- ViewBox: ALWAYS "0 0 24 24"
- Use <path> elements ONLY — no circle, rect, line, polygon, ellipse
- Convert ALL shapes to optimized path data
- No image, base64, text, use, clipPath, transforms, IDs, classes, or metadata
- Strip all whitespace between elements

## WHAT MAKES A BAD ICON (NEVER DO THESE)

- 20+ path segments (clip art, not icon)
- Inconsistent stroke widths within one icon
- Off-grid coords causing blur
- More than 5 distinct visual elements (over-detailed)
- Paths that don't close (gaps in fill mode)
- Generic boring shapes — each icon needs personality
- Varying levels of complexity across the set (some simple, some ornate)

## OUTPUT FORMAT

Return ONLY a JSON array. No markdown. No code blocks. No explanation.
Each item: {"name": "Descriptive Name", "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" ...>...</svg>"}

Example:
[{"name": "Home Base", "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M3 12L12 3L21 12M5 10V20H10V14H14V14H14V20H19V10Z\\"/></svg>"}]`;

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
    const contextPrompt = `Generate exactly ${currentSection.count} unique, high-quality icons for the "${currentSection.name}" section.

## Design Brief
- Section: ${currentSection.name} — ${currentSection.description}
- Brand: "${entityName}"${industry ? ` in the ${industry} industry` : ''}
- Category: ${taxonomyCategory.name} (${taxonomyCategory.description})

## Style Specification (MANDATORY — apply to every icon)
- Preset: "${preset}"
- stroke-width: ${strokeWidth}px (EXACT — do not vary between icons)
- stroke-linecap: "${linecap}"
- stroke-linejoin: "${linejoin}"
- stroke: "${isFilled ? 'none' : 'currentColor'}"
- fill: "${isFilled ? 'currentColor' : 'none'}"
${cornerStyle === 'sharp' ? '- ALL corners must be sharp 90° angles. No rounded corners anywhere.' : '- Use smooth rounded corners consistently.'}

## Design Direction
- Each icon must be CONCEPTUALLY DISTINCT — no two icons should look similar
- Names should be descriptive and specific (e.g., "Trending Analytics" not "Chart 1")
- For "${entityName}": infuse subtle brand personality while keeping icons universally readable
- Think about what a designer at ${entityName} would actually need for their ${currentSection.name.toLowerCase()} icons

## Quality Checklist (verify each icon)
✓ Recognizable at 16px as a filled silhouette
✓ All coordinates on whole pixels or .5
✓ Consistent visual weight across all ${currentSection.count} icons
✓ Clean closed paths (end with Z)
✓ No more than 3 <path> elements

Return ONLY the JSON array — no markdown, no explanation:
[{"name": "Icon Name", "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" ...>...</svg>"}]`;

    console.log(`[generate-icon-set] Generating ${currentSection.count} icons for ${category}/${currentSection.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
