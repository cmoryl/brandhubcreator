import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Icon sections by entity type
const ENTITY_SECTIONS: Record<string, { name: string; description: string; count: number }[]> = {
  brand: [
    { name: "Core Identity", description: "Logo marks, brand symbols, identity elements", count: 6 },
    { name: "Navigation", description: "Menu, arrows, wayfinding icons", count: 6 },
    { name: "Actions", description: "Edit, save, delete, share operations", count: 6 },
    { name: "Communication", description: "Messages, notifications, contact icons", count: 6 },
    { name: "Commerce", description: "Shopping, payments, transactions", count: 5 },
    { name: "Users & Teams", description: "People, profiles, collaboration", count: 5 },
    { name: "Data & Analytics", description: "Charts, metrics, reporting", count: 5 },
    { name: "Settings & Security", description: "Configuration, privacy, locks", count: 5 },
    { name: "Files & Media", description: "Documents, images, attachments", count: 4 },
    { name: "Status & Feedback", description: "Alerts, success, error states", count: 2 },
  ],
  product: [
    { name: "Product Features", description: "Core functionality and capabilities", count: 8 },
    { name: "User Actions", description: "Primary interactions and operations", count: 7 },
    { name: "Navigation", description: "Menu, tabs, breadcrumbs, arrows", count: 6 },
    { name: "Data Display", description: "Tables, lists, grids, views", count: 5 },
    { name: "Input & Forms", description: "Fields, selections, uploads", count: 5 },
    { name: "Feedback & Status", description: "Loading, success, error, progress", count: 5 },
    { name: "Settings", description: "Preferences, configuration, toggles", count: 5 },
    { name: "Help & Support", description: "Documentation, tooltips, guides", count: 4 },
    { name: "Social & Sharing", description: "Share, connect, collaborate", count: 3 },
    { name: "Utilities", description: "Search, filter, sort, refresh", count: 2 },
  ],
  event: [
    { name: "Event Identity", description: "Event logo, badges, marks", count: 6 },
    { name: "Schedule & Time", description: "Calendar, clock, timeline icons", count: 7 },
    { name: "Venue & Location", description: "Maps, directions, places", count: 6 },
    { name: "Speakers & People", description: "Presenters, attendees, teams", count: 6 },
    { name: "Sessions & Content", description: "Talks, workshops, panels", count: 6 },
    { name: "Registration", description: "Tickets, badges, check-in", count: 5 },
    { name: "Networking", description: "Connect, chat, meet", count: 5 },
    { name: "Sponsors & Partners", description: "Exhibitors, partners, booths", count: 4 },
    { name: "Amenities", description: "Food, parking, facilities", count: 3 },
    { name: "Feedback", description: "Ratings, surveys, comments", count: 2 },
  ],
};

interface IconResult {
  id: string;
  name: string;
  svgPath: string;
  category: string;
  viewBox: string;
  fillMode: 'stroke' | 'fill';
}

interface SectionResult {
  section: string;
  icons: IconResult[];
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
      entityType = 'brand', 
      entityName, 
      industry,
      style = { strokeWidth: 2, cornerRadius: 'rounded', fill: false },
      sectionIndex = 0, // Which section to generate (for chunked processing)
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

    const sections = ENTITY_SECTIONS[entityType] || ENTITY_SECTIONS.brand;
    
    // If sectionIndex is out of bounds, return complete
    if (sectionIndex >= sections.length) {
      return new Response(
        JSON.stringify({ 
          complete: true, 
          totalSections: sections.length,
          message: "All sections generated" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentSection = sections[sectionIndex];
    
    // Build comprehensive prompt for icon generation
    const systemPrompt = `You are an expert icon designer creating a cohesive icon set for "${entityName}"${industry ? ` in the ${industry} industry` : ''}.

You are generating icons for the "${currentSection.name}" section: ${currentSection.description}

CRITICAL RULES:
1. Output ONLY a valid JSON array of icon objects, nothing else
2. Generate exactly ${currentSection.count} unique icons
3. Each icon must have: name (string), svg (complete SVG code)
4. Use viewBox="0 0 24 24" for all icons
5. Use stroke-based design with stroke-width="${style?.strokeWidth || 2}"
6. Use stroke-linecap="${style?.cornerRadius === 'sharp' ? 'square' : 'round'}" and stroke-linejoin="${style?.cornerRadius === 'sharp' ? 'miter' : 'round'}"
7. Use stroke="currentColor" and fill="${style?.fill ? 'currentColor' : 'none'}"
8. Keep paths simple - avoid complex gradients or filters
9. Icons should be recognizable at 24px and scale well
10. Names should be descriptive and unique (e.g., "Dashboard Overview", "User Profile", "Settings Gear")
11. Make icons relevant to "${entityName}" and its ${entityType === 'event' ? 'event' : entityType === 'product' ? 'product' : 'brand'} context

OUTPUT FORMAT (JSON array only, no markdown):
[
  {
    "name": "Icon Name",
    "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"...\\" /></svg>"
  }
]`;

    console.log(`[generate-icon-set] Generating ${currentSection.count} icons for section: ${currentSection.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate ${currentSection.count} icons for the "${currentSection.name}" section of ${entityName}'s ${entityType} icon set. Return only a JSON array.` 
          },
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
          name: names[i] || `Icon ${i + 1}`,
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
      category: currentSection.name,
      viewBox: '0 0 24 24',
      fillMode: style?.fill ? 'fill' : 'stroke',
    }));

    console.log(`[generate-icon-set] Generated ${formattedIcons.length} icons for section: ${currentSection.name}`);

    return new Response(
      JSON.stringify({ 
        section: currentSection.name,
        sectionDescription: currentSection.description,
        icons: formattedIcons,
        currentIndex: sectionIndex,
        totalSections: sections.length,
        nextIndex: sectionIndex + 1,
        complete: sectionIndex >= sections.length - 1,
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
