import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LocationResearchRequest {
  venueName: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
}

interface LocationReport {
  overview: string;
  neighborhood: {
    description: string;
    character: string;
    safetyNotes: string;
  };
  dining: {
    nearby: string[];
    recommendations: string;
  };
  transportation: {
    airports: string[];
    publicTransit: string;
    rideshare: string;
    parking: string;
  };
  hotels: {
    luxury: string[];
    midRange: string[];
    budget: string[];
    recommendations: string;
  };
  attractions: {
    cultural: string[];
    entertainment: string[];
    outdoor: string[];
  };
  practicalInfo: {
    weather: string;
    timezone: string;
    currency: string;
    tipping: string;
    localCustoms: string;
  };
  eventTips: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CRITICAL: Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Authentication failed: No authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed: Invalid user", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { venueName, city, state, country, address }: LocationResearchRequest = await req.json();

    if (!city || !country) {
      return new Response(
        JSON.stringify({ error: "City and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const locationQuery = [venueName, address, city, state, country].filter(Boolean).join(", ");

    const systemPrompt = `You are an expert travel and event planning researcher. Generate comprehensive location reports for event venues that help attendees and organizers plan their visit.

Your reports should be practical, accurate, and helpful for business travelers attending conferences or events. Focus on information that would be valuable for event attendees.

Always respond with valid JSON matching the exact structure requested.`;

    const userPrompt = `Research and generate a comprehensive location report for an event at:

Location: ${locationQuery}
${venueName ? `Venue: ${venueName}` : ''}

Generate a detailed JSON report with this exact structure:
{
  "overview": "2-3 sentence overview of the area and its significance",
  "neighborhood": {
    "description": "Description of the neighborhood/district",
    "character": "The vibe and character of the area",
    "safetyNotes": "General safety information for visitors"
  },
  "dining": {
    "nearby": ["Restaurant 1", "Restaurant 2", "Restaurant 3", "Restaurant 4", "Restaurant 5"],
    "recommendations": "Brief dining recommendations for event attendees"
  },
  "transportation": {
    "airports": ["Nearest Airport 1 with distance", "Airport 2 if applicable"],
    "publicTransit": "Public transit options to reach the venue",
    "rideshare": "Rideshare availability and tips",
    "parking": "Parking options and recommendations"
  },
  "hotels": {
    "luxury": ["Hotel 1", "Hotel 2", "Hotel 3"],
    "midRange": ["Hotel 1", "Hotel 2", "Hotel 3"],
    "budget": ["Hotel 1", "Hotel 2", "Hotel 3"],
    "recommendations": "Brief hotel recommendations for event attendees"
  },
  "attractions": {
    "cultural": ["Museum/cultural site 1", "Site 2", "Site 3"],
    "entertainment": ["Entertainment venue 1", "Venue 2", "Venue 3"],
    "outdoor": ["Park/outdoor area 1", "Area 2", "Area 3"]
  },
  "practicalInfo": {
    "weather": "Typical weather and what to pack",
    "timezone": "Timezone information",
    "currency": "Currency and payment info",
    "tipping": "Tipping customs",
    "localCustoms": "Any important local customs or etiquette"
  },
  "eventTips": [
    "Tip 1 for event attendees",
    "Tip 2 for event attendees",
    "Tip 3 for event attendees",
    "Tip 4 for event attendees",
    "Tip 5 for event attendees"
  ]
}

Provide real, accurate information based on your knowledge. Be specific with names of actual restaurants, hotels, and attractions in the area.`;

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
          { role: "user", content: userPrompt },
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the response (handle markdown code blocks)
    let reportJson: LocationReport;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      reportJson = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse location report");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: reportJson,
        generatedAt: new Date().toISOString(),
        location: locationQuery,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Location research error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
