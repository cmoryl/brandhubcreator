import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeEntry {
  id: string;
  type: 'insight' | 'note' | 'learning' | 'milestone' | 'feedback' | 'metric';
  content: string;
  source: 'manual' | 'ai';
  category?: string;
  created_at: string;
}

interface AnalysisResult {
  brand_summary: string;
  market_position: string;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  };
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  };
  growth_recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }[];
  new_insights: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - must have valid auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, entityType, entityId, entry, organizationId } = await req.json();
    
    // Validate entityId is a valid UUID to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (entityId && !uuidRegex.test(entityId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityId format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate entityType whitelist
    if (entityType && !['brand', 'product'].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityType' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    // Create client with user's auth token to respect RLS
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify the user's authentication
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify user has access to the entity before proceeding
    const tableName = entityType === 'brand' ? 'brands' : 'products';
    const { data: entityData, error: entityError } = await userSupabase
      .from(tableName)
      .select('id, user_id, organization_id')
      .eq('id', entityId)
      .maybeSingle();
    
    if (entityError || !entityData) {
      return new Response(
        JSON.stringify({ error: 'Entity not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role client for intelligence operations (after access verified)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create intelligence record
    let { data: intelligence, error: fetchError } = await supabase
      .from('brand_intelligence')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw new Error(`Failed to fetch intelligence: ${fetchError.message}`);
    }

    // Create if doesn't exist
    if (!intelligence) {
      const { data: newIntel, error: createError } = await supabase
        .from('brand_intelligence')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId,
          knowledge_entries: [],
        })
        .select()
        .single();

      if (createError) {
        console.error("Create error:", createError);
        throw new Error(`Failed to create intelligence: ${createError.message}`);
      }
      intelligence = newIntel;
    }

    // Handle different actions
    switch (action) {
      case 'get':
        return new Response(JSON.stringify({ intelligence }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'add_entry':
        if (!entry) throw new Error("Entry is required for add_entry action");
        
        const newEntry: KnowledgeEntry = {
          id: crypto.randomUUID(),
          type: entry.type || 'note',
          content: entry.content,
          source: entry.source || 'manual',
          category: entry.category,
          created_at: new Date().toISOString(),
        };

        const updatedEntries = [...(intelligence.knowledge_entries || []), newEntry];
        
        const { error: updateError } = await supabase
          .from('brand_intelligence')
          .update({ knowledge_entries: updatedEntries })
          .eq('id', intelligence.id);

        if (updateError) throw new Error(`Failed to add entry: ${updateError.message}`);

        return new Response(JSON.stringify({ success: true, entry: newEntry }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'delete_entry':
        if (!entry?.id) throw new Error("Entry ID is required for delete_entry action");
        
        const filteredEntries = (intelligence.knowledge_entries || [])
          .filter((e: KnowledgeEntry) => e.id !== entry.id);
        
        const { error: deleteError } = await supabase
          .from('brand_intelligence')
          .update({ knowledge_entries: filteredEntries })
          .eq('id', intelligence.id);

        if (deleteError) throw new Error(`Failed to delete entry: ${deleteError.message}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'analyze':
        if (!lovableApiKey) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }

        // Fetch the brand/product data
        const table = entityType === 'brand' ? 'brands' : 'products';
        const { data: entityData, error: entityError } = await supabase
          .from(table)
          .select('name, guide_data')
          .eq('id', entityId)
          .single();

        if (entityError) throw new Error(`Failed to fetch ${entityType} data`);

        const guideData = entityData.guide_data as any;
        const knowledgeEntries = intelligence.knowledge_entries || [];

        // Build comprehensive context for AI
        const analysisPrompt = `You are a brand intelligence analyst. Analyze the following brand/product data and knowledge entries to generate comprehensive insights.

BRAND/PRODUCT NAME: ${entityData.name}

BRAND DATA:
- Mission: ${guideData?.hero?.tagline || 'Not specified'}
- Description: ${guideData?.hero?.description || 'Not specified'}
- Values: ${JSON.stringify(guideData?.values || [])}
- Colors: ${JSON.stringify(guideData?.colors?.map((c: any) => c.name) || [])}
- Typography: ${JSON.stringify(guideData?.typography || {})}
- Services: ${JSON.stringify(guideData?.services || [])}

KNOWLEDGE BASE (${knowledgeEntries.length} entries):
${knowledgeEntries.map((e: KnowledgeEntry) => `- [${e.type}] ${e.content}`).join('\n') || 'No entries yet'}

PREVIOUS ANALYSIS COUNT: ${intelligence.analysis_count}
LAST ANALYZED: ${intelligence.last_analyzed_at || 'Never'}

Generate a comprehensive analysis including:
1. Brand summary (2-3 sentences)
2. Market position assessment
3. Target audience identification (primary, secondary, demographics)
4. Competitive advantages (list 3-5)
5. Brand voice profile (tone, personality traits, communication style)
6. Growth recommendations (3-5 actionable items with priority and rationale)
7. New insights based on the knowledge entries (2-3 observations)

Respond with valid JSON matching this structure:
{
  "brand_summary": "string",
  "market_position": "string",
  "target_audience": {
    "primary": "string",
    "secondary": ["string"],
    "demographics": ["string"]
  },
  "competitive_advantages": ["string"],
  "brand_voice_profile": {
    "tone": ["string"],
    "personality": ["string"],
    "communication_style": "string"
  },
  "growth_recommendations": [
    {
      "priority": "high|medium|low",
      "recommendation": "string",
      "rationale": "string"
    }
  ],
  "new_insights": ["string"]
}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a brand intelligence analyst. Always respond with valid JSON." },
              { role: "user", content: analysisPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (aiResponse.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error(`AI analysis failed: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("No content in AI response");

        // Parse the JSON response
        let analysis: AnalysisResult;
        try {
          // Extract JSON from potential markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          const jsonStr = jsonMatch[1].trim();
          analysis = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("Failed to parse AI response:", content);
          throw new Error("Failed to parse AI analysis response");
        }

        // Add AI-generated insights to knowledge entries
        const aiInsights = analysis.new_insights.map((insight: string) => ({
          id: crypto.randomUUID(),
          type: 'insight' as const,
          content: insight,
          source: 'ai' as const,
          category: 'ai-analysis',
          created_at: new Date().toISOString(),
        }));

        const analysisRecord = {
          timestamp: new Date().toISOString(),
          summary: analysis.brand_summary.substring(0, 200),
          insights_count: analysis.new_insights.length,
        };

        // Update intelligence with analysis results
        const { error: analysisError } = await supabase
          .from('brand_intelligence')
          .update({
            brand_summary: analysis.brand_summary,
            market_position: analysis.market_position,
            target_audience: analysis.target_audience,
            competitive_advantages: analysis.competitive_advantages,
            brand_voice_profile: analysis.brand_voice_profile,
            growth_recommendations: analysis.growth_recommendations,
            knowledge_entries: [...(intelligence.knowledge_entries || []), ...aiInsights],
            analysis_history: [...(intelligence.analysis_history || []), analysisRecord],
            last_analyzed_at: new Date().toISOString(),
            analysis_count: (intelligence.analysis_count || 0) + 1,
          })
          .eq('id', intelligence.id);

        if (analysisError) throw new Error(`Failed to save analysis: ${analysisError.message}`);

        return new Response(JSON.stringify({ 
          success: true, 
          analysis,
          insights_added: aiInsights.length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Brand intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
