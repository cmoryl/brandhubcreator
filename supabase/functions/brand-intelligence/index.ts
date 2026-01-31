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

interface InsightFeedback {
  id: string;
  insight_id: string;
  status: 'approved' | 'rejected' | 'corrected';
  correction_text?: string;
  user_id: string;
  timestamp: string;
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

interface LearningContext {
  approved_insights: string[];
  rejected_insights: string[];
  user_corrections: Array<{ original: string; corrected: string }>;
  cross_entity_insights: string[];
  analysis_improvements: string[];
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

    const { action, entityType, entityId, entry, organizationId, feedback } = await req.json();
    
    // Validate entityId is a valid UUID to prevent enumeration
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (entityId && !uuidRegex.test(entityId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityId format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate entityType whitelist
    if (entityType && !['brand', 'product', 'event'].includes(entityType)) {
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
    const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    const { data: entityAccessData, error: entityError } = await userSupabase
      .from(tableName)
      .select('id, user_id, organization_id, parent_brand_id')
      .eq('id', entityId)
      .maybeSingle();
    
    if (entityError || !entityAccessData) {
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
      console.error("[brand-intelligence] Fetch error:", fetchError);
      throw new Error("Failed to retrieve intelligence data");
    }

    // Create if doesn't exist
    if (!intelligence) {
      const parentEntityId = (entityAccessData as any).parent_brand_id || null;
      const { data: newIntel, error: createError } = await supabase
        .from('brand_intelligence')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId,
          parent_entity_id: parentEntityId,
          knowledge_entries: [],
          insight_feedback: [],
          learning_context: {},
        })
        .select()
        .single();

      if (createError) {
        console.error("[brand-intelligence] Create error:", createError);
        throw new Error("Failed to create intelligence record");
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

        if (updateError) {
          console.error("[brand-intelligence] Update error:", updateError);
          throw new Error("Failed to add entry");
        }

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

        if (deleteError) {
          console.error("[brand-intelligence] Delete error:", deleteError);
          throw new Error("Failed to delete entry");
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'submit_feedback':
        if (!feedback) throw new Error("Feedback is required");
        
        const newFeedback: InsightFeedback = {
          id: crypto.randomUUID(),
          insight_id: feedback.insight_id,
          status: feedback.status,
          correction_text: feedback.correction_text,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        };
        
        const currentFeedback = (intelligence.insight_feedback || []) as InsightFeedback[];
        // Remove existing feedback for same insight from same user
        const filteredFeedback = currentFeedback.filter(
          (f: InsightFeedback) => !(f.insight_id === feedback.insight_id && f.user_id === user.id)
        );
        const updatedFeedback = [...filteredFeedback, newFeedback];
        
        // Update learning context based on feedback
        const learningCtx = (intelligence.learning_context || {}) as LearningContext;
        const entries = (intelligence.knowledge_entries || []) as KnowledgeEntry[];
        const insightContent = entries.find((e: KnowledgeEntry) => e.id === feedback.insight_id)?.content || '';
        
        if (feedback.status === 'approved') {
          learningCtx.approved_insights = [...(learningCtx.approved_insights || []), insightContent].slice(-20);
        } else if (feedback.status === 'rejected') {
          learningCtx.rejected_insights = [...(learningCtx.rejected_insights || []), insightContent].slice(-20);
        } else if (feedback.status === 'corrected' && feedback.correction_text) {
          learningCtx.user_corrections = [
            ...(learningCtx.user_corrections || []),
            { original: insightContent, corrected: feedback.correction_text }
          ].slice(-10);
        }
        
        const { error: feedbackError } = await supabase
          .from('brand_intelligence')
          .update({ 
            insight_feedback: updatedFeedback,
            learning_context: learningCtx 
          })
          .eq('id', intelligence.id);

        if (feedbackError) {
          console.error("[brand-intelligence] Feedback error:", feedbackError);
          throw new Error("Failed to save feedback");
        }

        return new Response(JSON.stringify({ success: true, feedback: newFeedback }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'analyze':
        if (!lovableApiKey) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }

        // Fetch the brand/product/event data
        const table = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
        const { data: entityData, error: entError } = await supabase
          .from(table)
          .select('name, guide_data, parent_brand_id')
          .eq('id', entityId)
          .single();

        if (entError) throw new Error(`Failed to fetch ${entityType} data`);

        const guideData = entityData.guide_data as any;
        const knowledgeEntries = intelligence.knowledge_entries || [];
        const learningContext = (intelligence.learning_context || {}) as LearningContext;
        const previousAnalysis = intelligence.brand_summary ? {
          summary: intelligence.brand_summary,
          market_position: intelligence.market_position,
          target_audience: intelligence.target_audience,
          competitive_advantages: intelligence.competitive_advantages,
          voice_profile: intelligence.brand_voice_profile,
        } : null;

        // Fetch cross-entity insights (parent brand or sibling products)
        let crossEntityContext = '';
        const parentBrandId = (entityData as any).parent_brand_id || intelligence.parent_entity_id;
        
        if (parentBrandId && (entityType === 'product' || entityType === 'event')) {
          // Get parent brand intelligence
          const { data: parentIntel } = await supabase
            .from('brand_intelligence')
            .select('brand_summary, market_position, brand_voice_profile, competitive_advantages, knowledge_entries')
            .eq('entity_id', parentBrandId)
            .eq('entity_type', 'brand')
            .maybeSingle();
          
          if (parentIntel) {
            const parentInsights = (parentIntel.knowledge_entries as KnowledgeEntry[] || [])
              .filter((e: KnowledgeEntry) => e.source === 'ai')
              .slice(-5)
              .map((e: KnowledgeEntry) => e.content);
            
            crossEntityContext = `
PARENT BRAND CONTEXT:
- Brand Summary: ${parentIntel.brand_summary || 'N/A'}
- Market Position: ${parentIntel.market_position || 'N/A'}
- Voice Profile: ${JSON.stringify(parentIntel.brand_voice_profile || {})}
- Key Advantages: ${JSON.stringify(parentIntel.competitive_advantages || [])}
- Recent Insights: ${parentInsights.join('; ') || 'None'}

IMPORTANT: Ensure this ${entityType}'s analysis aligns with and extends the parent brand's positioning.`;
          }
        }

        // Build learning context section
        let learningSection = '';
        if (Object.keys(learningContext).length > 0) {
          const parts = [];
          if (learningContext.approved_insights?.length) {
            parts.push(`USER-APPROVED INSIGHTS (generate more like these):\n${learningContext.approved_insights.slice(-5).map(i => `  ✓ ${i}`).join('\n')}`);
          }
          if (learningContext.rejected_insights?.length) {
            parts.push(`USER-REJECTED INSIGHTS (avoid similar patterns):\n${learningContext.rejected_insights.slice(-5).map(i => `  ✗ ${i}`).join('\n')}`);
          }
          if (learningContext.user_corrections?.length) {
            parts.push(`USER CORRECTIONS (learn from these preferences):\n${learningContext.user_corrections.slice(-3).map(c => `  Original: "${c.original}"\n  Preferred: "${c.corrected}"`).join('\n')}`);
          }
          if (parts.length > 0) {
            learningSection = `\nLEARNING FROM USER FEEDBACK:\n${parts.join('\n\n')}`;
          }
        }

        // Build previous analysis context
        let previousAnalysisSection = '';
        if (previousAnalysis) {
          previousAnalysisSection = `
PREVIOUS ANALYSIS (for context and evolution):
- Previous Summary: ${previousAnalysis.summary}
- Previous Market Position: ${previousAnalysis.market_position}
- Previous Voice Profile: ${JSON.stringify(previousAnalysis.voice_profile)}

IMPORTANT: Build upon and refine the previous analysis. Note any evolution or changes based on new knowledge entries.`;
        }

        // Build comprehensive context for AI (handle both brand/product and event data)
        const isEvent = entityType === 'event';
        const eventDetails = isEvent ? guideData?.eventDetails : null;
        
        const analysisPrompt = `You are a ${isEvent ? 'event intelligence' : 'brand intelligence'} analyst with learning capabilities. Analyze the following ${entityType} data and generate comprehensive insights.

${isEvent ? 'EVENT' : 'BRAND/PRODUCT'} NAME: ${entityData.name}

${isEvent ? `EVENT DATA:
- Event Name: ${eventDetails?.eventName || entityData.name}
- Event Dates: ${eventDetails?.eventDates || 'Not specified'}
- Event Type: ${eventDetails?.eventType || 'Not specified'}
- Location: ${eventDetails?.location || 'Not specified'}
- Venue: ${eventDetails?.venue || 'Not specified'}
- Expected Attendees: ${eventDetails?.expectedAttendees || 'Not specified'}
- Hashtag: ${eventDetails?.hashtag || 'Not specified'}
- Tagline: ${eventDetails?.tagline || guideData?.hero?.tagline || 'Not specified'}
- Sponsors: ${JSON.stringify((guideData?.eventSponsors || []).map((s: any) => ({ name: s.name, tier: s.tier })))}
- Schedule Items: ${(guideData?.eventSchedule || []).length} sessions` : 
`BRAND DATA:
- Mission: ${guideData?.hero?.tagline || 'Not specified'}
- Description: ${guideData?.hero?.description || 'Not specified'}
- Values: ${JSON.stringify(guideData?.values || [])}
- Colors: ${JSON.stringify(guideData?.colors?.map((c: any) => c.name) || [])}
- Typography: ${JSON.stringify(guideData?.typography || {})}
- Services: ${JSON.stringify(guideData?.services || [])}`}

KNOWLEDGE BASE (${knowledgeEntries.length} entries):
${(knowledgeEntries as KnowledgeEntry[]).map((e: KnowledgeEntry) => `- [${e.type}] ${e.content}`).join('\n') || 'No entries yet'}
${crossEntityContext}
${previousAnalysisSection}
${learningSection}

ANALYSIS COUNT: ${intelligence.analysis_count}
LAST ANALYZED: ${intelligence.last_analyzed_at || 'Never'}

Generate a comprehensive analysis including:
1. ${isEvent ? 'Event' : 'Brand'} summary (2-3 sentences, incorporate learnings)
2. Market position assessment (evolved if previous exists)
3. Target audience identification (primary, secondary, demographics)
4. Competitive advantages (list 3-5)
5. ${isEvent ? 'Event' : 'Brand'} voice profile (tone, personality traits, communication style)
6. Growth recommendations (3-5 actionable items with priority and rationale)
7. New insights based on knowledge entries and learnings (3-5 observations that align with user preferences)

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
              { role: "system", content: "You are a brand intelligence analyst with learning capabilities. You improve based on user feedback and build upon previous analyses. Always respond with valid JSON." },
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
          had_learning_context: Object.keys(learningContext).length > 0,
          had_cross_entity_context: !!crossEntityContext,
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
            parent_entity_id: parentBrandId || intelligence.parent_entity_id,
          })
          .eq('id', intelligence.id);

        if (analysisError) {
          console.error("[brand-intelligence] Analysis save error:", analysisError);
          throw new Error("Failed to save analysis results");
        }

        return new Response(JSON.stringify({ 
          success: true, 
          analysis,
          insights_added: aiInsights.length,
          used_learning_context: Object.keys(learningContext).length > 0,
          used_cross_entity_context: !!crossEntityContext,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[brand-intelligence] Error:", error);
    // Return generic error to client, detailed error logged server-side
    const safeMessage = error instanceof Error && 
      ['Failed to retrieve intelligence data', 'Failed to create intelligence record', 
       'Failed to add entry', 'Failed to delete entry', 'Failed to save analysis results',
       'Entry is required for add_entry action', 'Entry ID is required for delete_entry action',
       'LOVABLE_API_KEY is not configured', 'Rate limit exceeded. Please try again later.',
       'AI credits exhausted. Please add funds.', 'Failed to parse AI analysis response',
       'Feedback is required', 'Failed to save feedback'].includes(error.message)
      ? error.message 
      : "Operation failed";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
