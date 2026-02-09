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
  cultural_insights?: {
    global_readiness_score: number;
    primary_markets: string[];
    cultural_considerations: {
      region: string;
      considerations: string[];
      design_adaptations: string[];
      messaging_notes: string;
    }[];
    localization_priorities: string[];
    color_cultural_notes: string[];
    imagery_guidelines: string[];
  };
  globallink_recommendations?: {
    product: string;
    relevance: 'high' | 'medium' | 'low';
    use_case: string;
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

// NOTE: Heavy AI analysis is now delegated to brand-intelligence-worker function

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

    // Handle analyze action with background processing
    if (action === 'analyze') {
      if (!lovableApiKey) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      // Check if user has permission to use AI features
      const { data: canUseAI } = await supabase.rpc('can_use_ai_features', {
        _user_id: user.id,
        _entity_id: entityId,
        _entity_type: entityType
      });

      if (!canUseAI) {
        return new Response(
          JSON.stringify({ error: 'Organization admin role required for AI analysis' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create job record immediately
      const { data: job, error: jobError } = await supabase
        .from('brand_intelligence_jobs')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          organization_id: organizationId,
          user_id: user.id,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error("[brand-intelligence] Failed to create job:", jobError);
        throw new Error("Failed to create analysis job");
      }

      // Call the worker function to process the job asynchronously
      // Using EdgeRuntime.waitUntil to not block the response
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(
        fetch(`${supabaseUrl}/functions/v1/brand-intelligence-worker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ jobId: job.id }),
        }).catch((error) => {
          console.error("[brand-intelligence] Worker invocation error:", error);
          // Update job status to failed if worker can't be reached
          supabase
            .from('brand_intelligence_jobs')
            .update({ status: 'failed', error_message: 'Failed to start worker' })
            .eq('id', job.id);
        })
      );

      // Return immediately with job ID
      return new Response(JSON.stringify({ 
        success: true, 
        job_id: job.id,
        message: 'Analysis started. Poll for status using job_id.'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle job status check
    if (action === 'job_status') {
      const { job_id } = await req.json().catch(() => ({}));
      
      if (!job_id) {
        return new Response(
          JSON.stringify({ error: 'job_id is required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: job, error: jobError } = await supabase
        .from('brand_intelligence_jobs')
        .select('*')
        .eq('id', job_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch intelligence for other actions
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
        const updatedActions = [...currentActions, newAction].slice(-100);
        
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
       'Failed to create analysis job', 'AI analysis failed', 'Failed to fetch brand data',
       'Failed to fetch product data', 'Failed to fetch event data'].includes(error.message)
        ? error.message
        : 'Analysis failed';
    
    return new Response(JSON.stringify({ error: safeMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
