/**
 * useAICenterMetrics — Aggregated AI metrics hook for AI Center of Excellence
 * Enhanced: trend data, entity comparisons, Oracle auto-seed
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface AICenterMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  jobSuccessRate: number;
  totalComplianceScans: number;
  avgComplianceScore: number;
  totalBiasScans: number;
  avgInclusionScore: number;
  avgLanguageScore: number;
  avgVisualScore: number;
  avgAccessibilityScore: number;
  totalConversations: number;
  avgSatisfaction: number;
  totalVisibilityAudits: number;
  avgVisibilityScore: number;
  totalRecommendations: number;
  pendingRecommendations: number;
  inProgressRecommendations: number;
  completedRecommendations: number;
  aiQualityScore: number;
  ethicsCompliancePercent: number;
  resourceEfficiency: number;
  innovationIndex: number;
}

export interface TrendPoint {
  date: string;
  jobs: number;
  successRate: number;
  compliance: number;
  ethics: number;
}

export interface EntityComparison {
  entityId: string;
  entityName: string;
  entityType: string;
  intelligenceJobs: number;
  successRate: number;
  complianceScore: number;
  biasScore: number;
  visibilityScore: number;
  overallAiScore: number;
}

export interface QualityAlert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
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
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const [metrics, setMetrics] = useState<AICenterMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationAction[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [entityComparisons, setEntityComparisons] = useState<EntityComparison[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);

    try {
      const [jobsRes, complianceRes, biasRes, botsRes, visRes, recsRes, brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brand_intelligence_jobs').select('status, created_at, entity_id, entity_type').limit(500),
        supabase.from('dataforce_compliance_jobs').select('compliance_score, status, entity_id, entity_name, entity_type, created_at').eq('status', 'completed').limit(500),
        supabase.from('bias_awareness_scans').select('inclusion_score, language_score, visual_score, accessibility_score, status, entity_id, entity_name, entity_type, created_at').eq('status', 'completed').limit(500),
        supabase.from('bot_conversations').select('satisfaction_rating').limit(500),
        supabase.from('brand_visibility_audits').select('overall_visibility_score, status, entity_id, entity_name, entity_type, created_at').eq('status', 'completed').limit(500),
        supabase.from('recommendation_actions').select('*').eq('organization_id', orgId),
        supabase.from('brands').select('id, name').eq('organization_id', orgId),
        supabase.from('products').select('id, name').eq('organization_id', orgId),
        supabase.from('events').select('id, name').eq('organization_id', orgId),
      ]);

      const jobs = jobsRes.data || [];
      const compliance = complianceRes.data || [];
      const bias = biasRes.data || [];
      const bots = botsRes.data || [];
      const vis = visRes.data || [];
      const recs = (recsRes.data || []) as unknown as RecommendationAction[];

      // Build entity name lookup
      const entityNameMap = new Map<string, string>();
      (brandsRes.data || []).forEach(b => entityNameMap.set(b.id, b.name));
      (productsRes.data || []).forEach(p => entityNameMap.set(p.id, p.name));
      (eventsRes.data || []).forEach(e => entityNameMap.set(e.id, e.name));

      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const pending = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;
      const successRate = jobs.length > 0 ? (completed / jobs.length) * 100 : 0;

      const avgComp = compliance.length > 0 ? compliance.reduce((a, c) => a + (c.compliance_score || 0), 0) / compliance.length : 0;

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

      const aiQuality = Math.round((successRate * 0.4 + avgComp * 0.3 + (avgSat / 5) * 100 * 0.3));
      const ethicsPercent = Math.round((avgInclusion * 0.4 + avgLang * 0.3 + avgAcc * 0.3));
      const resEfficiency = Math.round(successRate * 0.6 + (100 - (failed / Math.max(jobs.length, 1)) * 100) * 0.4);
      const completedRecs = recs.filter(r => r.status === 'completed').length;
      const innovIdx = recs.length > 0 ? Math.round((completedRecs / recs.length) * 100) : 0;

      setMetrics({
        totalJobs: jobs.length, completedJobs: completed, failedJobs: failed, pendingJobs: pending,
        jobSuccessRate: successRate, totalComplianceScans: compliance.length, avgComplianceScore: avgComp,
        totalBiasScans: bias.length, avgInclusionScore: avgInclusion, avgLanguageScore: avgLang,
        avgVisualScore: avgVisual, avgAccessibilityScore: avgAcc, totalConversations: bots.length,
        avgSatisfaction: avgSat, totalVisibilityAudits: vis.length, avgVisibilityScore: avgVis,
        totalRecommendations: recs.length, pendingRecommendations: recs.filter(r => r.status === 'pending').length,
        inProgressRecommendations: recs.filter(r => r.status === 'in_progress').length,
        completedRecommendations: completedRecs, aiQualityScore: aiQuality,
        ethicsCompliancePercent: ethicsPercent, resourceEfficiency: resEfficiency, innovationIndex: innovIdx,
      });
      setRecommendations(recs);

      // ── Build 30-day trends ──
      const now = new Date();
      const trendPoints: TrendPoint[] = [];
      for (let d = 29; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        const dayJobs = jobs.filter(j => j.created_at?.startsWith(dateStr));
        const dayComp = compliance.filter(c => c.created_at?.startsWith(dateStr));
        const dayBias = bias.filter(b => b.created_at?.startsWith(dateStr));
        const dayCompleted = dayJobs.filter(j => j.status === 'completed').length;
        const daySR = dayJobs.length > 0 ? (dayCompleted / dayJobs.length) * 100 : 0;
        const dayCompScore = dayComp.length > 0 ? dayComp.reduce((a, c) => a + (c.compliance_score || 0), 0) / dayComp.length : 0;
        const dayEthics = dayBias.length > 0 ? avg(dayBias.map(b => b.inclusion_score)) : 0;
        trendPoints.push({ date: dateStr, jobs: dayJobs.length, successRate: daySR, compliance: dayCompScore, ethics: dayEthics });
      }
      setTrends(trendPoints);

      // ── Entity comparisons ──
      const entityMap = new Map<string, EntityComparison>();
      const ensureEntity = (id: string, name: string, type: string) => {
        if (!entityMap.has(id)) {
          entityMap.set(id, { entityId: id, entityName: name, entityType: type, intelligenceJobs: 0, successRate: 0, complianceScore: 0, biasScore: 0, visibilityScore: 0, overallAiScore: 0 });
        }
        return entityMap.get(id)!;
      };
      jobs.forEach(j => {
        if (!j.entity_id) return;
        const resolvedName = entityNameMap.get(j.entity_id) || j.entity_id;
        const e = ensureEntity(j.entity_id, resolvedName, j.entity_type || 'brand');
        e.intelligenceJobs++;
        if (j.status === 'completed') e.successRate++;
      });
      compliance.forEach(c => {
        const name = entityNameMap.get(c.entity_id) || c.entity_name;
        const e = ensureEntity(c.entity_id, name, c.entity_type);
        e.complianceScore = Math.max(e.complianceScore, c.compliance_score || 0);
      });
      bias.forEach(b => {
        const name = entityNameMap.get(b.entity_id) || b.entity_name;
        const e = ensureEntity(b.entity_id, name, b.entity_type);
        e.biasScore = Math.max(e.biasScore, b.inclusion_score || 0);
      });
      vis.forEach(v => {
        const name = entityNameMap.get(v.entity_id) || v.entity_name;
        const e = ensureEntity(v.entity_id, name, v.entity_type);
        e.visibilityScore = Math.max(e.visibilityScore, v.overall_visibility_score || 0);
      });
      entityMap.forEach(e => {
        if (e.intelligenceJobs > 0) e.successRate = (e.successRate / e.intelligenceJobs) * 100;
        e.overallAiScore = Math.round((e.successRate * 0.25 + e.complianceScore * 0.25 + e.biasScore * 0.25 + e.visibilityScore * 0.25));
      });
      setEntityComparisons(Array.from(entityMap.values()).sort((a, b) => b.overallAiScore - a.overallAiScore));

      // ── Quality alerts ──
      const newAlerts: QualityAlert[] = [];
      if (successRate < 70 && jobs.length > 0) newAlerts.push({ id: 'sr', type: successRate < 50 ? 'critical' : 'warning', message: `Job success rate is ${successRate.toFixed(0)}%`, metric: 'Success Rate', value: successRate, threshold: 70 });
      if (avgComp > 0 && avgComp < 60) newAlerts.push({ id: 'comp', type: avgComp < 40 ? 'critical' : 'warning', message: `Average compliance score is ${avgComp.toFixed(0)}%`, metric: 'Compliance', value: avgComp, threshold: 60 });
      if (avgInclusion > 0 && avgInclusion < 60) newAlerts.push({ id: 'incl', type: avgInclusion < 40 ? 'critical' : 'warning', message: `Inclusion score is ${avgInclusion.toFixed(0)}%`, metric: 'Inclusion', value: avgInclusion, threshold: 60 });
      if (avgVis > 0 && avgVis < 40) newAlerts.push({ id: 'vis', type: 'warning', message: `Visibility score is ${avgVis.toFixed(0)}%`, metric: 'Visibility', value: avgVis, threshold: 40 });
      if (failed > 3) newAlerts.push({ id: 'fail', type: failed > 10 ? 'critical' : 'warning', message: `${failed} failed AI jobs detected`, metric: 'Failed Jobs', value: failed, threshold: 3 });
      setAlerts(newAlerts);

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

  const seedFromOracle = useCallback(async (oracleRecs: Array<{ recommendation: string; rationale?: string; impact?: string; priority?: string }>) => {
    if (!orgId || oracleRecs.length === 0) return 0;
    const existingKeys = new Set(recommendations.map(r => r.recommendation_key));
    const newRecs = oracleRecs.filter(r => !existingKeys.has(`oracle-${r.recommendation?.slice(0, 50)}`));
    if (newRecs.length === 0) return 0;

    const inserts = newRecs.map(r => ({
      organization_id: orgId,
      recommendation_key: `oracle-${r.recommendation?.slice(0, 50)}`,
      recommendation_text: `${r.recommendation}${r.rationale ? ` — ${r.rationale}` : ''}${r.impact ? ` (Impact: ${r.impact})` : ''}`,
      source: 'oracle',
    }));

    const { error } = await supabase.from('recommendation_actions').insert(inserts);
    if (!error) fetchMetrics();
    return error ? 0 : newRecs.length;
  }, [orgId, recommendations, fetchMetrics]);

  return {
    metrics, recommendations, trends, entityComparisons, alerts,
    isLoading, refresh: fetchMetrics, updateRecommendation, addRecommendation, seedFromOracle,
  };
}
