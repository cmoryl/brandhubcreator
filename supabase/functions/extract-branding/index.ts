import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedBranding {
  name: string;
  tagline: string;
  colors: {
    name: string;
    hex: string;
    usage: string;
  }[];
  typography: {
    name: string;
    fontFamily: string;
    usage: string;
  }[];
  logoUrls: string[];
  eventDetails?: {
    eventName: string;
    eventDates: string;
    location: string;
    venue: string;
    description: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type = 'event' } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract-branding] Fetching URL: ${url}`);

    // Fetch the website HTML
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandExtractor/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (fetchError) {
      console.error("[extract-branding] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch website. Please check the URL is accessible." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate HTML to avoid token limits (keep important parts)
    const truncatedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 15000);

    // Extract meta tags and title separately
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

    // Extract inline styles for colors
    const styleMatches = html.match(/style="[^"]*(?:background-color|color|border-color):\s*([^;"]+)/gi) || [];
    const cssColors = styleMatches.slice(0, 20).join(', ');

    // Extract image URLs that might be logos
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*/gi) || [];
    const potentialLogos = imgMatches
      .filter(img => /logo|brand|header/i.test(img))
      .map(img => img.match(/src=["']([^"']+)["']/i)?.[1])
      .filter(Boolean)
      .slice(0, 5);

    const extractionPrompt = `You are a brand identity extraction specialist. Analyze the following website content and extract branding information.

WEBSITE URL: ${url}
PAGE TITLE: ${title}
META DESCRIPTION: ${metaDescription}
OG TITLE: ${ogTitle}
OG DESCRIPTION: ${ogDescription}
OG IMAGE: ${ogImage}
POTENTIAL LOGO URLS: ${potentialLogos.join(', ')}
CSS COLORS FOUND: ${cssColors}

HTML CONTENT (truncated):
${truncatedHtml}

Extract the following for this ${type}:
1. Brand/Event name
2. Tagline or slogan
3. Primary and secondary colors (with hex codes - infer from the design)
4. Typography/fonts used
5. Any logo URLs found
${type === 'event' ? '6. Event details (dates, location, venue, description)' : ''}

Respond with valid JSON matching this exact structure:
{
  "name": "Brand or Event Name",
  "tagline": "Main tagline or slogan",
  "colors": [
    { "name": "Primary", "hex": "#1e3a8a", "usage": "Main brand color" },
    { "name": "Secondary", "hex": "#ec4899", "usage": "Accent color" }
  ],
  "typography": [
    { "name": "Headings", "fontFamily": "Inter, sans-serif", "usage": "Headlines and titles" },
    { "name": "Body", "fontFamily": "System UI, sans-serif", "usage": "Body text" }
  ],
  "logoUrls": ["https://example.com/logo.png"],
  ${type === 'event' ? `"eventDetails": {
    "eventName": "Event Name",
    "eventDates": "May 8, 2025",
    "location": "London, UK",
    "venue": "Venue Name",
    "description": "Brief event description"
  }` : '"eventDetails": null'}
}

Be precise with color extraction. Look for:
- Background colors of headers/heroes
- Button colors
- Text colors
- Accent colors used for highlights

If you can't determine a value, use reasonable defaults based on the industry/type.`;

    console.log("[extract-branding] Calling AI for analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a brand identity extraction specialist. Always respond with valid JSON only, no markdown." },
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[extract-branding] AI error:", errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let branding: ExtractedBranding;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      branding = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[extract-branding] Parse error:", content);
      throw new Error("Failed to parse branding data");
    }

    // Resolve relative URLs to absolute
    if (branding.logoUrls && branding.logoUrls.length > 0) {
      branding.logoUrls = branding.logoUrls.map(logoUrl => {
        try {
          return new URL(logoUrl, url).href;
        } catch {
          return logoUrl;
        }
      });
    }

    // Add OG image if available and not already in logos
    if (ogImage && !branding.logoUrls?.includes(ogImage)) {
      try {
        const absoluteOgImage = new URL(ogImage, url).href;
        branding.logoUrls = [absoluteOgImage, ...(branding.logoUrls || [])];
      } catch {
        // Ignore invalid URLs
      }
    }

    console.log("[extract-branding] Successfully extracted branding:", branding.name);

    return new Response(
      JSON.stringify({ success: true, branding }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[extract-branding] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
