/**
 * useAICenterMetrics — Aggregated AI metrics hook for AI Center of Excellence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface AICenterMetrics {
  // Intelligence Jobs
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  jobSuccessRate: number;

  // Compliance
  totalComplianceScans: number;
  avgComplianceScore: number;

  // Bias & Ethics
  totalBiasScans: number;
  avgInclusionScore: number;
  avgLanguageScore: number;
  avgVisualScore: number;
  avgAccessibilityScore: number;

  // Bot Conversations
  totalConversations: number;
  avgSatisfaction: number;

  // Visibility
  totalVisibilityAudits: number;
  avgVisibilityScore: number;

  // Recommendations
  totalRecommendations: number;
  pendingRecommendations: number;
  inProgressRecommendations: number;
  completedRecommendations: number;

  // Computed
  aiQualityScore: number;
  ethicsCompliancePercent: number;
  resourceEfficiency: number;
  innovationIndex: number;
}

interface RecommendationAction {
  id: string;
  recommendation_key: string;
  recommendation_text: string;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAICenterMetrics() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [metrics, setMetrics] = useState<AICenterMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);

    try {
      const [jobsRes, complianceRes, biasRes, botsRes, visRes, recsRes] = await Promise.all([
        supabase.from('brand_intelligence_jobs').select('status').limit(500),
        supabase.from('dataforce_compliance_jobs').select('overall_score, status').eq('status', 'completed').limit(500),
        supabase.from('bias_awareness_scans').select('inclusion_score, language_score, visual_score, accessibility_score, status').eq('status', 'completed').limit(500),
        supabase.from('bot_conversations').select('satisfaction_rating').limit(500),
        supabase.from('brand_visibility_audits').select('overall_visibility_score, status').eq('status', 'completed').limit(500),
        supabase.from('recommendation_actions').select('*').eq('organization_id', orgId),
      ]);

      const jobs = jobsRes.data || [];
      const compliance = complianceRes.data || [];
      const bias = biasRes.data || [];
      const bots = botsRes.data || [];
      const vis = visRes.data || [];
      const recs = (recsRes.data || []) as unknown as RecommendationAction[];

      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const pending = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
      const successRate = jobs.length > 0 ? (completed / jobs.length) * 100 : 0;

      const avgComp = compliance.length > 0 ? compliance.reduce((a, c) => a + (c.overall_score || 0), 0) / compliance.length : 0;

      const avg = (arr: (number | null)[]) => {
        const valid = arr.filter((v): v is number => v !== null && v > 0);
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      };

      const avgInclusion = avg(bias.map(b => b.inclusion_score));
      const avgLang = avg(bias.map(b => b.language_score));
      const avgVisual = avg(bias.map(b => b.visual_score));
      const avgAcc = avg(bias.map(b => b.accessibility_score));

      const ratings = bots.map(b => b.satisfaction_rating).filter((v): v is number => v !== null);
      const avgSat = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const visScores = vis.map(v => v.overall_visibility_score).filter((v): v is number => v !== null);
      const avgVis = visScores.length > 0 ? visScores.reduce((a, b) => a + b, 0) / visScores.length : 0;

      // Computed scores
      const aiQuality = Math.round((successRate * 0.4 + avgComp * 0.3 + (avgSat / 5) * 100 * 0.3));
      const ethicsPercent = Math.round((avgInclusion * 0.4 + avgLang * 0.3 + avgAcc * 0.3));
      const resEfficiency = Math.round(successRate * 0.6 + (100 - (failed / Math.max(jobs.length, 1)) * 100) * 0.4);
      const completedRecs = recs.filter(r => r.status === 'completed').length;
      const innovIdx = recs.length > 0 ? Math.round((completedRecs / recs.length) * 100) : 0;

      setMetrics({
        totalJobs: jobs.length,
        completedJobs: completed,
        failedJobs: failed,
        pendingJobs: pending,
        jobSuccessRate: successRate,
        totalComplianceScans: compliance.length,
        avgComplianceScore: avgComp,
        totalBiasScans: bias.length,
        avgInclusionScore: avgInclusion,
        avgLanguageScore: avgLang,
        avgVisualScore: avgVisual,
        avgAccessibilityScore: avgAcc,
        totalConversations: bots.length,
        avgSatisfaction: avgSat,
        totalVisibilityAudits: vis.length,
        avgVisibilityScore: avgVis,
        totalRecommendations: recs.length,
        pendingRecommendations: recs.filter(r => r.status === 'pending').length,
        inProgressRecommendations: recs.filter(r => r.status === 'in_progress').length,
        completedRecommendations: completedRecs,
        aiQualityScore: aiQuality,
        ethicsCompliancePercent: ethicsPercent,
        resourceEfficiency: resEfficiency,
        innovationIndex: innovIdx,
      });
      setRecommendations(recs);
    } catch (err) {
      console.error('[useAICenterMetrics] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const updateRecommendation = useCallback(async (id: string, status: string, notes?: string) => {
    const update: Record<string, string> = { status };
    if (notes !== undefined) update.notes = notes;
    const { error } = await supabase.from('recommendation_actions').update(update).eq('id', id);
    if (!error) {
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status, notes: notes ?? r.notes } : r));
      fetchMetrics();
    }
    return !error;
  }, [fetchMetrics]);

  const addRecommendation = useCallback(async (key: string, text: string, source = 'oracle') => {
    if (!orgId) return false;
    const { error } = await supabase.from('recommendation_actions').insert({
      organization_id: orgId,
      recommendation_key: key,
      recommendation_text: text,
      source,
    });
    if (!error) fetchMetrics();
    return !error;
  }, [orgId, fetchMetrics]);

  return { metrics, recommendations, isLoading, refresh: fetchMetrics, updateRecommendation, addRecommendation };
}
