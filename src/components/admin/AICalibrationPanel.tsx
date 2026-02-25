/**
 * AI Calibration Dashboard
 * Visualizes confidence trends, feedback metrics, and decay tuning controls
 * Reads from brand_intelligence JSONB fields: confidence_history, insight_actions, decay_config
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, Activity, Timer, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AICalibrationPanelProps {
  organizationId: string;
}

interface IntelligenceRow {
  entity_id: string;
  entity_type: string;
  confidence_history: any;
  insight_actions: any;
  decay_config: any;
  feedback_score: number | null;
  analysis_count: number;
  last_analyzed_at: string | null;
  brand_summary: string | null;
}

export function AICalibrationPanel({ organizationId }: AICalibrationPanelProps) {
  const [entities, setEntities] = useState<IntelligenceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decayHalfLife, setDecayHalfLife] = useState(30);
  const [confidenceThreshold, setConfidenceThreshold] = useState(60);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_intelligence')
        .select('entity_id, entity_type, confidence_history, insight_actions, decay_config, feedback_score, analysis_count, last_analyzed_at, brand_summary')
        .eq('organization_id', organizationId)
        .order('last_analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const rows = (data || []) as unknown as IntelligenceRow[];
      setEntities(rows);

      // Load decay config from first entity that has it
      const withConfig = rows.find(r => r.decay_config);
      if (withConfig?.decay_config) {
        const dc = withConfig.decay_config as any;
        if (dc.half_life_days) setDecayHalfLife(dc.half_life_days);
        if (dc.confidence_threshold) setConfidenceThreshold(dc.confidence_threshold);
      }
    } catch (err) {
      console.error('[AICalibration] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalApproved = 0, totalRejected = 0, totalPending = 0;
    const confidenceTrend: { date: string; avg: number }[] = [];
    const dateMap = new Map<string, number[]>();

    for (const entity of entities) {
      // Insight actions (feedback)
      const actions = Array.isArray(entity.insight_actions) ? entity.insight_actions : [];
      for (const a of actions) {
        if (a?.status === 'approved') totalApproved++;
        else if (a?.status === 'rejected') totalRejected++;
        else totalPending++;
      }

      // Confidence history
      const history = Array.isArray(entity.confidence_history) ? entity.confidence_history : [];
      for (const h of history) {
        if (h?.date && h?.score != null) {
          const d = String(h.date).slice(0, 10);
          if (!dateMap.has(d)) dateMap.set(d, []);
          dateMap.get(d)!.push(Number(h.score));
        }
      }
    }

    // Build trend data sorted by date
    for (const [date, scores] of [...dateMap.entries()].sort()) {
      confidenceTrend.push({ date, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) });
    }

    const totalFeedback = totalApproved + totalRejected;
    const accuracyRate = totalFeedback > 0 ? Math.round((totalApproved / totalFeedback) * 100) : null;
    const avgFeedbackScore = entities.length > 0
      ? Math.round(entities.reduce((s, e) => s + (e.feedback_score || 0), 0) / entities.length)
      : 0;

    return { totalApproved, totalRejected, totalPending, accuracyRate, avgFeedbackScore, confidenceTrend };
  }, [entities]);

  // Decay curve visualization data
  const decayCurve = useMemo(() => {
    const points: { day: number; weight: number }[] = [];
    for (let d = 0; d <= 90; d += 1) {
      const weight = Math.round(Math.pow(0.5, d / decayHalfLife) * 100);
      points.push({ day: d, weight });
    }
    return points;
  }, [decayHalfLife]);

  const saveDecayConfig = async () => {
    setIsSaving(true);
    try {
      const config = { half_life_days: decayHalfLife, confidence_threshold: confidenceThreshold };
      // Update all entities in this org
      const { error } = await supabase
        .from('brand_intelligence')
        .update({ decay_config: config as any })
        .eq('organization_id', organizationId);
      if (error) throw error;
      toast.success('Decay configuration saved');
    } catch (err) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (entities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No intelligence data yet</p>
          <p className="text-sm">Run Brand Intelligence analyses to populate calibration data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="AI Accuracy"
          value={metrics.accuracyRate != null ? `${metrics.accuracyRate}%` : 'N/A'}
          color={metrics.accuracyRate != null ? (metrics.accuracyRate >= 75 ? 'text-emerald-500' : metrics.accuracyRate >= 50 ? 'text-amber-500' : 'text-red-500') : 'text-muted-foreground'}
        />
        <MetricCard
          icon={<ThumbsUp className="h-4 w-4" />}
          label="Approved Insights"
          value={metrics.totalApproved}
          color="text-emerald-500"
        />
        <MetricCard
          icon={<ThumbsDown className="h-4 w-4" />}
          label="Rejected Insights"
          value={metrics.totalRejected}
          color="text-red-500"
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Feedback Score"
          value={metrics.avgFeedbackScore}
          color={metrics.avgFeedbackScore >= 50 ? 'text-emerald-500' : metrics.avgFeedbackScore >= 0 ? 'text-amber-500' : 'text-red-500'}
        />
      </div>

      {/* Confidence Trends Chart */}
      {metrics.confidenceTrend.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Confidence Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.confidenceTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Avg Confidence" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decay Curve & Controls */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Temporal Decay Configuration
            </CardTitle>
            <Button size="sm" variant="outline" onClick={saveDecayConfig} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Decay Half-Life</label>
                  <span className="text-sm font-semibold">{decayHalfLife} days</span>
                </div>
                <Slider
                  value={[decayHalfLife]}
                  onValueChange={([v]) => setDecayHalfLife(v)}
                  min={7}
                  max={90}
                  step={1}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  After {decayHalfLife} days, an insight's weight drops to 50%
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Confidence Threshold</label>
                  <span className="text-sm font-semibold">{confidenceThreshold}%</span>
                </div>
                <Slider
                  value={[confidenceThreshold]}
                  onValueChange={([v]) => setConfidenceThreshold(v)}
                  min={20}
                  max={95}
                  step={5}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Insights below {confidenceThreshold}% confidence are deprioritized
                </p>
              </div>
            </div>

            {/* Decay Curve Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={decayCurve}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Days', position: 'insideBottom', offset: -5, fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Weight %', angle: -90, position: 'insideLeft', fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} name="Weight" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Entity Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Entity Intelligence Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {entities.map(entity => {
                const actions = Array.isArray(entity.insight_actions) ? entity.insight_actions : [];
                const approved = actions.filter((a: any) => a?.status === 'approved').length;
                const rejected = actions.filter((a: any) => a?.status === 'rejected').length;
                const total = approved + rejected;
                const rate = total > 0 ? Math.round((approved / total) * 100) : null;
                const name = entity.brand_summary?.split('.')[0]?.slice(0, 40) || entity.entity_id.slice(0, 8);

                return (
                  <div key={entity.entity_id} className="flex items-center gap-3 p-2 rounded-lg border bg-card/60">
                    <Badge variant="outline" className="text-[10px] shrink-0">{entity.entity_type}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{entity.analysis_count} analyses</span>
                        {entity.feedback_score != null && (
                          <span className={cn("text-[10px] font-medium", entity.feedback_score >= 50 ? 'text-emerald-500' : 'text-amber-500')}>
                            Score: {entity.feedback_score}
                          </span>
                        )}
                      </div>
                    </div>
                    {rate != null && (
                      <div className="text-right shrink-0">
                        <p className={cn("text-xs font-semibold", rate >= 75 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-red-500')}>
                          {rate}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">{total} reviews</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background/60 border">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-semibold", color)}>{value}</p>
      </div>
    </div>
  );
}
