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
 * SVG Architect System Prompt for batch icon generation
 */
const SVG_ARCHITECT_PROMPT = `You are a Senior SVG Architect and Brand Systems Designer generating a cohesive icon library. You specialize in "Iconic Simplicity"—creating symbols legible at 16px yet detailed enough for marketing at 1024px.

## Core Directives

1. **Geometric Precision**: 24x24 pixel grid. Whole numbers for coordinates.
2. **Structural Consistency**: Uniform visual weight across all icons.
3. **Path Logic**: Single, clean paths. No overlapping or messy intersections.
4. **Cohesive Set**: All icons must feel like they belong to the same family.

## Technical Standards

- ViewBox: \`0 0 24 24\`
- Use \`<path>\` elements (not basic shapes) for CSS control
- No raster data or base64
- Closed paths for fill compatibility
- Optimized, clean SVG code

## Output Format

Return a JSON array of icon objects. Each must have:
- \`name\`: Descriptive, unique name (e.g., "Dashboard Overview")
- \`svg\`: Complete, valid SVG code

IMPORTANT: Output ONLY the JSON array, no markdown code blocks, no explanation.`;

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

    // Build contextual prompt
    const contextPrompt = `Generate ${currentSection.count} unique icons for the "${currentSection.name}" section.
Section Description: ${currentSection.description}
Brand/Entity: ${entityName}${industry ? ` (${industry} industry)` : ''}
Category: ${taxonomyCategory.name} - ${taxonomyCategory.description}

Style Requirements:
- Preset: ${preset}
- stroke-width: ${strokeWidth}
- stroke-linecap: ${linecap}
- stroke-linejoin: ${linejoin}
- stroke: ${isFilled ? 'none' : 'currentColor'}
- fill: ${isFilled ? 'currentColor' : 'none'}

Make icons relevant to "${entityName}" while maintaining cohesion with the ${taxonomyCategory.name} category visual language.

Return ONLY a JSON array like this (no markdown):
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
