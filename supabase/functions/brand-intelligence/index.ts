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
  confidence?: number;
  semantic_hash?: string;
}

interface InsightFeedback {
  id: string;
  insight_id: string;
  status: 'approved' | 'rejected' | 'corrected';
  correction_text?: string;
  user_id: string;
  timestamp: string;
}

interface InsightAction {
  id: string;
  insight_id: string;
  action_type: 'export' | 'share' | 'reference' | 'copy';
  user_id: string;
  timestamp: string;
  context?: string;
}

interface ConfidenceRecord {
  insight_id: string;
  predicted_confidence: number;
  actual_outcome?: 'validated' | 'invalidated' | 'pending';
  validation_timestamp?: string;
  accuracy_delta?: number;
}

interface DecayConfig {
  halfLifeDays: number;
  minWeight: number;
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
    confidence: number;
  }[];
  new_insights: {
    content: string;
    confidence: number;
  }[];
}

interface LearningContext {
  approved_insights: string[];
  rejected_insights: string[];
  user_corrections: Array<{ original: string; corrected: string }>;
  cross_entity_insights: string[];
  analysis_improvements: string[];
  high_engagement_insights: string[];
  confidence_calibration: number;
}

// Calculate temporal decay weight for feedback
function calculateDecayWeight(timestamp: string, config: DecayConfig): number {
  const now = Date.now();
  const feedbackTime = new Date(timestamp).getTime();
  const ageInDays = (now - feedbackTime) / (1000 * 60 * 60 * 24);
  const weight = Math.pow(0.5, ageInDays / config.halfLifeDays);
  return Math.max(weight, config.minWeight);
}

// Generate a simple semantic hash for deduplication
function generateSemanticHash(content: string): string {
  const normalized = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .sort()
    .slice(0, 10)
    .join('_');
  return normalized;
}

// Check if insight is semantically similar to existing ones
function isDuplicate(newHash: string, existingHashes: string[], threshold = 0.7): boolean {
  for (const existingHash of existingHashes) {
    const newWords = new Set(newHash.split('_'));
    const existingWords = new Set(existingHash.split('_'));
    const intersection = new Set([...newWords].filter(x => existingWords.has(x)));
    const union = new Set([...newWords, ...existingWords]);
    const similarity = intersection.size / union.size;
    if (similarity >= threshold) return true;
  }
  return false;
}

// Calculate weighted learning context with temporal decay
function buildWeightedLearningContext(
  feedback: InsightFeedback[],
  actions: InsightAction[],
  entries: KnowledgeEntry[],
  decayConfig: DecayConfig
): LearningContext {
  const approvedInsights: Array<{ content: string; weight: number }> = [];
  const rejectedInsights: Array<{ content: string; weight: number }> = [];
  const corrections: Array<{ original: string; corrected: string; weight: number }> = [];
  
  // Process feedback with decay weighting
  for (const fb of feedback) {
    const weight = calculateDecayWeight(fb.timestamp, decayConfig);
    const entry = entries.find(e => e.id === fb.insight_id);
    if (!entry) continue;
    
    if (fb.status === 'approved') {
      approvedInsights.push({ content: entry.content, weight });
    } else if (fb.status === 'rejected') {
      rejectedInsights.push({ content: entry.content, weight });
    } else if (fb.status === 'corrected' && fb.correction_text) {
      corrections.push({ original: entry.content, corrected: fb.correction_text, weight });
    }
  }
  
  // Track high-engagement insights from actions
  const actionCounts = new Map<string, number>();
  for (const action of actions) {
    const weight = calculateDecayWeight(action.timestamp, decayConfig);
    const current = actionCounts.get(action.insight_id) || 0;
    actionCounts.set(action.insight_id, current + weight);
  }
  
  const highEngagement = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => entries.find(e => e.id === id)?.content)
    .filter(Boolean) as string[];
  
  // Sort by weight and take top items
  approvedInsights.sort((a, b) => b.weight - a.weight);
  rejectedInsights.sort((a, b) => b.weight - a.weight);
  corrections.sort((a, b) => b.weight - a.weight);
  
  return {
    approved_insights: approvedInsights.slice(0, 10).map(i => i.content),
    rejected_insights: rejectedInsights.slice(0, 10).map(i => i.content),
    user_corrections: corrections.slice(0, 5).map(c => ({ original: c.original, corrected: c.corrected })),
    cross_entity_insights: [],
    analysis_improvements: [],
    high_engagement_insights: highEngagement,
    confidence_calibration: 0,
  };
}

// Calculate confidence calibration from historical data
function calculateConfidenceCalibration(history: ConfidenceRecord[]): number {
  const validated = history.filter(h => h.actual_outcome && h.actual_outcome !== 'pending');
  if (validated.length < 3) return 0;
  
  let totalError = 0;
  for (const record of validated) {
    const actualScore = record.actual_outcome === 'validated' ? 1 : 0;
    totalError += Math.abs(record.predicted_confidence - actualScore);
  }
  
  return 1 - (totalError / validated.length);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, entityType, entityId, entry, organizationId, feedback, insightAction } = await req.json();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (entityId && !uuidRegex.test(entityId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entityId format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error("[brand-intelligence] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[brand-intelligence] User authenticated:", user.id, "Action:", action);
    
    const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
    
    // Build select query - brands don't have parent_brand_id
    const selectColumns = entityType === 'brand' 
      ? 'id, user_id, organization_id'
      : 'id, user_id, organization_id, parent_brand_id';
    
    const { data: entityAccessData, error: entityError } = await userSupabase
      .from(tableName)
      .select(selectColumns)
      .eq('id', entityId)
      .maybeSingle();
    
    console.log("[brand-intelligence] Entity access check:", { 
      tableName, 
      entityId, 
      found: !!entityAccessData, 
      error: entityError?.message 
    });
    
    if (entityError || !entityAccessData) {
      return new Response(
        JSON.stringify({ error: 'Entity not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          insight_actions: [],
          confidence_history: [],
          semantic_hashes: [],
          learning_context: {},
          decay_config: { halfLifeDays: 30, minWeight: 0.1 },
        })
        .select()
        .single();

      if (createError) {
        console.error("[brand-intelligence] Create error:", createError);
        throw new Error("Failed to create intelligence record");
      }
      intelligence = newIntel;
    }

    const decayConfig = (intelligence.decay_config || { halfLifeDays: 30, minWeight: 0.1 }) as DecayConfig;

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
          confidence: entry.confidence,
          semantic_hash: generateSemanticHash(entry.content),
        };

        const updatedEntries = [...(intelligence.knowledge_entries || []), newEntry];
        const updatedHashes = [...(intelligence.semantic_hashes || []), newEntry.semantic_hash];
        
        const { error: updateError } = await supabase
          .from('brand_intelligence')
          .update({ 
            knowledge_entries: updatedEntries,
            semantic_hashes: updatedHashes,
          })
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
        
        const entryToDelete = (intelligence.knowledge_entries || []).find((e: KnowledgeEntry) => e.id === entry.id);
        const filteredEntries = (intelligence.knowledge_entries || [])
          .filter((e: KnowledgeEntry) => e.id !== entry.id);
        const filteredHashes = (intelligence.semantic_hashes || [])
          .filter((h: string) => h !== entryToDelete?.semantic_hash);
        
        const { error: deleteError } = await supabase
          .from('brand_intelligence')
          .update({ 
            knowledge_entries: filteredEntries,
            semantic_hashes: filteredHashes,
          })
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
        const filteredFeedback = currentFeedback.filter(
          (f: InsightFeedback) => !(f.insight_id === feedback.insight_id && f.user_id === user.id)
        );
        const updatedFeedbackList = [...filteredFeedback, newFeedback];
        
        // Update confidence history if validating a prediction
        const confidenceHistory = (intelligence.confidence_history || []) as ConfidenceRecord[];
        const insightEntry = (intelligence.knowledge_entries || []).find((e: KnowledgeEntry) => e.id === feedback.insight_id);
        if (insightEntry?.confidence) {
          const existingRecord = confidenceHistory.find(c => c.insight_id === feedback.insight_id);
          if (existingRecord) {
            existingRecord.actual_outcome = feedback.status === 'approved' ? 'validated' : 'invalidated';
            existingRecord.validation_timestamp = new Date().toISOString();
            existingRecord.accuracy_delta = Math.abs(existingRecord.predicted_confidence - (feedback.status === 'approved' ? 1 : 0));
          }
        }
        
        const { error: feedbackError } = await supabase
          .from('brand_intelligence')
          .update({ 
            insight_feedback: updatedFeedbackList,
            confidence_history: confidenceHistory,
          })
          .eq('id', intelligence.id);

        if (feedbackError) {
          console.error("[brand-intelligence] Feedback error:", feedbackError);
          throw new Error("Failed to save feedback");
        }

        return new Response(JSON.stringify({ success: true, feedback: newFeedback }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'track_action':
        if (!insightAction) throw new Error("Action data is required");
        
        const newAction: InsightAction = {
          id: crypto.randomUUID(),
          insight_id: insightAction.insight_id,
          action_type: insightAction.action_type,
          user_id: user.id,
          timestamp: new Date().toISOString(),
          context: insightAction.context,
        };
        
        const currentActions = (intelligence.insight_actions || []) as InsightAction[];
        const updatedActions = [...currentActions, newAction].slice(-100); // Keep last 100 actions
        
        const { error: actionError } = await supabase
          .from('brand_intelligence')
          .update({ insight_actions: updatedActions })
          .eq('id', intelligence.id);

        if (actionError) {
          console.error("[brand-intelligence] Action tracking error:", actionError);
          throw new Error("Failed to track action");
        }

        return new Response(JSON.stringify({ success: true, action: newAction }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      case 'analyze':
        if (!lovableApiKey) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }

        // Check if user has permission to use AI features (org admin or higher)
        const { data: canUseAI } = await supabase.rpc('can_use_ai_features', {
          _user_id: user.id,
          _entity_id: entityId,
          _entity_type: entityType
        });

        if (!canUseAI) {
          console.log("[brand-intelligence] User lacks AI permissions:", user.id);
          return new Response(
            JSON.stringify({ error: 'Organization admin role required for AI analysis' }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const table = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
        
        // Fetch entity data - brands don't have parent_brand_id column
        let entityData: { name: string; guide_data: unknown; parent_brand_id?: string } | null = null;
        
        if (entityType === 'brand') {
          const { data, error } = await supabase
            .from('brands')
            .select('name, guide_data')
            .eq('id', entityId)
            .single();
          if (error) {
            console.error(`[brand-intelligence] Failed to fetch brand:`, error);
            throw new Error('Failed to fetch brand data');
          }
          entityData = { ...data, parent_brand_id: undefined };
        } else if (entityType === 'product') {
          const { data, error } = await supabase
            .from('products')
            .select('name, guide_data, parent_brand_id')
            .eq('id', entityId)
            .single();
          if (error) {
            console.error(`[brand-intelligence] Failed to fetch product:`, error);
            throw new Error('Failed to fetch product data');
          }
          entityData = data;
        } else {
          const { data, error } = await supabase
            .from('events')
            .select('name, guide_data, parent_brand_id')
            .eq('id', entityId)
            .single();
          if (error) {
            console.error(`[brand-intelligence] Failed to fetch event:`, error);
            throw new Error('Failed to fetch event data');
          }
          entityData = data;
        }

        const guideData = entityData.guide_data as any;
        const knowledgeEntries = (intelligence.knowledge_entries || []) as KnowledgeEntry[];
        const insightFeedback = (intelligence.insight_feedback || []) as InsightFeedback[];
        const insightActions = (intelligence.insight_actions || []) as InsightAction[];
        const confidenceHist = (intelligence.confidence_history || []) as ConfidenceRecord[];
        const existingHashes = (intelligence.semantic_hashes || []) as string[];
        
        // Build weighted learning context with temporal decay
        const learningContext = buildWeightedLearningContext(
          insightFeedback,
          insightActions,
          knowledgeEntries,
          decayConfig
        );
        
        // Add confidence calibration
        learningContext.confidence_calibration = calculateConfidenceCalibration(confidenceHist);
        
        const previousAnalysis = intelligence.brand_summary ? {
          summary: intelligence.brand_summary,
          market_position: intelligence.market_position,
          target_audience: intelligence.target_audience,
          competitive_advantages: intelligence.competitive_advantages,
          voice_profile: intelligence.brand_voice_profile,
        } : null;

        // Fetch cross-entity insights
        let crossEntityContext = '';
        const parentBrandId = (entityData as any).parent_brand_id || intelligence.parent_entity_id;
        
        if (parentBrandId && (entityType === 'product' || entityType === 'event')) {
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
            
            learningContext.cross_entity_insights = parentInsights;
          }
        }

        // Build learning context section with temporal weighting info
        let learningSection = '';
        const parts = [];
        
        if (learningContext.approved_insights.length) {
          parts.push(`USER-APPROVED INSIGHTS (generate more like these, weighted by recency):\n${learningContext.approved_insights.map(i => `  ✓ ${i}`).join('\n')}`);
        }
        if (learningContext.rejected_insights.length) {
          parts.push(`USER-REJECTED INSIGHTS (avoid similar patterns):\n${learningContext.rejected_insights.map(i => `  ✗ ${i}`).join('\n')}`);
        }
        if (learningContext.user_corrections.length) {
          parts.push(`USER CORRECTIONS (learn from these preferences):\n${learningContext.user_corrections.map(c => `  Original: "${c.original}"\n  Preferred: "${c.corrected}"`).join('\n')}`);
        }
        if (learningContext.high_engagement_insights.length) {
          parts.push(`HIGH-ENGAGEMENT INSIGHTS (users actively use these):\n${learningContext.high_engagement_insights.map(i => `  ★ ${i}`).join('\n')}`);
        }
        if (learningContext.confidence_calibration > 0) {
          parts.push(`CONFIDENCE CALIBRATION: Your historical accuracy is ${Math.round(learningContext.confidence_calibration * 100)}%. Adjust confidence scores accordingly.`);
        }
        
        if (parts.length > 0) {
          learningSection = `\nLEARNING FROM USER FEEDBACK (temporally weighted - recent feedback matters more):\n${parts.join('\n\n')}`;
        }

        let previousAnalysisSection = '';
        if (previousAnalysis) {
          previousAnalysisSection = `
PREVIOUS ANALYSIS (for context and evolution):
- Previous Summary: ${previousAnalysis.summary}
- Previous Market Position: ${previousAnalysis.market_position}
- Previous Voice Profile: ${JSON.stringify(previousAnalysis.voice_profile)}

IMPORTANT: Build upon and refine the previous analysis. Note any evolution or changes based on new knowledge entries.`;
        }

        // Build semantic deduplication context
        const deduplicationNote = existingHashes.length > 0 
          ? `\nIMPORTANT: Avoid generating insights similar to existing ones. Generate fresh, unique perspectives.`
          : '';

        const isEvent = entityType === 'event';
        const eventDetails = isEvent ? guideData?.eventDetails : null;
        
        const analysisPrompt = `You are a ${isEvent ? 'event intelligence' : 'brand intelligence'} analyst with advanced learning capabilities. Analyze the following ${entityType} data and generate comprehensive insights.

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
${knowledgeEntries.map((e: KnowledgeEntry) => `- [${e.type}]${e.confidence ? ` (conf: ${Math.round(e.confidence * 100)}%)` : ''} ${e.content}`).join('\n') || 'No entries yet'}
${crossEntityContext}
${previousAnalysisSection}
${learningSection}
${deduplicationNote}

ANALYSIS COUNT: ${intelligence.analysis_count}
LAST ANALYZED: ${intelligence.last_analyzed_at || 'Never'}

Generate a comprehensive analysis including:
1. ${isEvent ? 'Event' : 'Brand'} summary (2-3 sentences, incorporate learnings)
2. Market position assessment (evolved if previous exists)
3. Target audience identification (primary, secondary, demographics)
4. Competitive advantages (list 3-5)
5. ${isEvent ? 'Event' : 'Brand'} voice profile (tone, personality traits, communication style)
6. Growth recommendations (3-5 actionable items with priority, rationale, AND confidence score 0-1)
7. New insights with confidence scores (3-5 unique observations that align with user preferences)

CRITICAL: For each insight and recommendation, include a confidence score (0-1) indicating how certain you are about this assessment.

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
      "rationale": "string",
      "confidence": 0.0-1.0
    }
  ],
  "new_insights": [
    {
      "content": "string",
      "confidence": 0.0-1.0
    }
  ]
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
              { role: "system", content: "You are a brand intelligence analyst with advanced learning capabilities. You improve based on user feedback, temporal patterns, and engagement signals. Always respond with valid JSON and include confidence scores." },
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

        let analysis: AnalysisResult;
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          const jsonStr = jsonMatch[1].trim();
          analysis = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("Failed to parse AI response:", content);
          throw new Error("Failed to parse AI analysis response");
        }

        // Filter out duplicate insights using semantic hashing
        const newConfidenceRecords: ConfidenceRecord[] = [];
        const aiInsights: KnowledgeEntry[] = [];
        const newHashes: string[] = [];
        
        for (const insight of analysis.new_insights) {
          const insightContent = typeof insight === 'string' ? insight : insight.content;
          const confidence = typeof insight === 'string' ? 0.7 : insight.confidence;
          const hash = generateSemanticHash(insightContent);
          
          if (!isDuplicate(hash, [...existingHashes, ...newHashes])) {
            const insightId = crypto.randomUUID();
            aiInsights.push({
              id: insightId,
              type: 'insight',
              content: insightContent,
              source: 'ai',
              category: 'ai-analysis',
              created_at: new Date().toISOString(),
              confidence,
              semantic_hash: hash,
            });
            newHashes.push(hash);
            
            // Track confidence for future calibration
            newConfidenceRecords.push({
              insight_id: insightId,
              predicted_confidence: confidence,
              actual_outcome: 'pending',
            });
          }
        }

        const analysisRecord = {
          timestamp: new Date().toISOString(),
          summary: analysis.brand_summary.substring(0, 200),
          insights_count: aiInsights.length,
          duplicates_filtered: analysis.new_insights.length - aiInsights.length,
          had_learning_context: parts.length > 0,
          had_cross_entity_context: !!crossEntityContext,
          confidence_calibration: learningContext.confidence_calibration,
        };

        const { error: analysisError } = await supabase
          .from('brand_intelligence')
          .update({
            brand_summary: analysis.brand_summary,
            market_position: analysis.market_position,
            target_audience: analysis.target_audience,
            competitive_advantages: analysis.competitive_advantages,
            brand_voice_profile: analysis.brand_voice_profile,
            growth_recommendations: analysis.growth_recommendations,
            knowledge_entries: [...knowledgeEntries, ...aiInsights],
            semantic_hashes: [...existingHashes, ...newHashes],
            confidence_history: [...confidenceHist, ...newConfidenceRecords],
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
          duplicates_filtered: analysis.new_insights.length - aiInsights.length,
          used_learning_context: parts.length > 0,
          used_cross_entity_context: !!crossEntityContext,
          confidence_calibration: learningContext.confidence_calibration,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[brand-intelligence] Error:", error);
    const safeMessage = error instanceof Error && 
      ['Failed to retrieve intelligence data', 'Failed to create intelligence record', 
       'Failed to add entry', 'Failed to delete entry', 'Failed to save analysis results',
       'Entry is required for add_entry action', 'Entry ID is required for delete_entry action',
       'LOVABLE_API_KEY is not configured', 'Rate limit exceeded. Please try again later.',
       'AI credits exhausted. Please add funds.', 'Failed to parse AI analysis response',
       'Feedback is required', 'Failed to save feedback', 'Action data is required',
       'Failed to track action'].includes(error.message)
      ? error.message 
      : "Operation failed";
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
