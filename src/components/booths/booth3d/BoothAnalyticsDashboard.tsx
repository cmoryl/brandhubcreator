/**
 * BoothAnalyticsDashboard — Post-show performance analytics with predicted vs actual comparison.
 * Upload real data after the show and compare against simulation predictions.
 * Supports CSV/Excel import alongside manual entry.
 */
import { useState, useMemo, useCallback } from 'react';
import {
  BarChart3, Users, Clock, Zap, TrendingUp, TrendingDown,
  Target, Upload, Save, Plus, Minus, FileSpreadsheet,
  Eye, ArrowUpRight, ArrowDownRight, Equal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type BoothAnalyticsRecord } from '@/hooks/useBoothAnalytics';
import { PostShowDataImport } from './PostShowDataImport';

/* ─── Types ──────────────────────────────────────── */

interface BoothAnalyticsDashboardProps {
  analytics: BoothAnalyticsRecord | null;
  onSave: (data: Partial<BoothAnalyticsRecord>) => void;
  isAdmin: boolean;
  /** Current simulation data for auto-populating predictions */
  simulationPredictions?: {
    traffic?: number;
    dwellTime?: number;
    peakCapacity?: number;
    visibilityScore?: number;
  };
}

interface KpiCardProps {
  label: string;
  icon: React.ReactNode;
  predicted: number | null | undefined;
  actual: number | null | undefined;
  format?: 'number' | 'seconds' | 'percent' | 'score';
  invertDelta?: boolean;
}

/* ─── Helpers ──────────────────────────────────────── */

function formatValue(val: number | null | undefined, format: string): string {
  if (val == null) return '—';
  switch (format) {
    case 'seconds':
      return val >= 3600 ? `${Math.round(val / 3600)}h ${Math.round((val % 3600) / 60)}m`
        : val >= 60 ? `${Math.round(val / 60)}m ${val % 60}s`
        : `${val}s`;
    case 'percent':
      return `${val.toFixed(1)}%`;
    case 'score':
      return `${val}/100`;
    default:
      return val.toLocaleString();
  }
}

function getDelta(predicted: number | null | undefined, actual: number | null | undefined): { pct: number; direction: 'up' | 'down' | 'equal' } | null {
  if (predicted == null || actual == null || predicted === 0) return null;
  const pct = ((actual - predicted) / predicted) * 100;
  return {
    pct: Math.abs(pct),
    direction: Math.abs(pct) < 2 ? 'equal' : pct > 0 ? 'up' : 'down',
  };
}

/* ─── KPI Card ──────────────────────────────────────── */

function KpiCard({ label, icon, predicted, actual, format = 'number', invertDelta }: KpiCardProps) {
  const delta = getDelta(predicted, actual);
  const isPositive = delta ? (invertDelta ? delta.direction === 'down' : delta.direction === 'up') : null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] text-muted-foreground">Predicted</p>
          <p className="text-sm font-bold text-muted-foreground">{formatValue(predicted, format)}</p>
        </div>
        <div>
          <p className="text-[9px] text-muted-foreground">Actual</p>
          <p className="text-sm font-bold text-foreground">{formatValue(actual, format)}</p>
        </div>
      </div>

      {delta && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit",
          delta.direction === 'equal' ? "bg-muted text-muted-foreground" :
          isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
        )}>
          {delta.direction === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
           delta.direction === 'down' ? <ArrowDownRight className="h-3 w-3" /> :
           <Equal className="h-3 w-3" />}
          {delta.pct.toFixed(1)}% {delta.direction === 'equal' ? 'on target' : delta.direction === 'up' ? 'above' : 'below'}
        </div>
      )}
    </div>
  );
}

/* ─── Comparison Bar ──────────────────────────────────── */

function ComparisonBar({ label, predicted, actual, max }: { label: string; predicted: number; actual: number; max: number }) {
  const pPct = max > 0 ? (predicted / max) * 100 : 0;
  const aPct = max > 0 ? (actual / max) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium">{label}</span>
        <span className="text-[9px] text-muted-foreground">{actual} / {predicted} predicted</span>
      </div>
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded-full"
          style={{ width: `${Math.min(pPct, 100)}%` }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all",
            actual >= predicted ? "bg-primary/70" : "bg-amber-500/70"
          )}
          style={{ width: `${Math.min(aPct, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Traffic by Hour Chart ──────────────────────────── */

function TrafficByHourChart({ data }: { data: Array<{ hour: string; count: number }> }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Traffic by Hour</p>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-primary/60 rounded-t-sm transition-all hover:bg-primary/80"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '1px' }}
              title={`${d.hour}: ${d.count} visitors`}
            />
            <span className="text-[7px] text-muted-foreground leading-none">{d.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────── */

export function BoothAnalyticsDashboard({
  analytics,
  onSave,
  isAdmin,
  simulationPredictions,
}: BoothAnalyticsDashboardProps) {
  // Local draft state for editing
  const [draft, setDraft] = useState<Partial<BoothAnalyticsRecord>>({});
  const [editing, setEditing] = useState(false);

  const merged = useMemo(() => ({
    ...analytics,
    ...draft,
  }), [analytics, draft]);

  const handleSave = useCallback(() => {
    onSave(draft);
    setDraft({});
    setEditing(false);
  }, [draft, onSave]);

  const updateDraft = useCallback((field: string, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasAnyData = analytics && (
    analytics.actual_leads_captured > 0 ||
    analytics.actual_demos_given > 0 ||
    analytics.actual_traffic_estimate != null
  );

  const hasSimulation = simulationPredictions && (
    simulationPredictions.traffic || simulationPredictions.visibilityScore
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Booth Performance Analytics</h3>
          {analytics?.event_name && (
            <Badge variant="outline" className="text-[10px]">{analytics.event_name}</Badge>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            {!editing ? (
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setEditing(true)}>
                <FileSpreadsheet className="h-3 w-3" /> Enter Post-Show Data
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => { setEditing(false); setDraft({}); }}>
                  Cancel
                </Button>
                <Button size="sm" className="h-7 text-[10px] gap-1" onClick={handleSave}>
                  <Save className="h-3 w-3" /> Save Data
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Data entry form */}
      {editing && isAdmin && (
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-[10px]">Event Name</Label>
              <Input
                value={merged.event_name || ''}
                onChange={(e) => updateDraft('event_name', e.target.value)}
                className="h-7 text-xs" placeholder="EXHIBITORLIVE 2026"
              />
            </div>
            <div>
              <Label className="text-[10px]">Event Date</Label>
              <Input
                type="date"
                value={merged.event_date || ''}
                onChange={(e) => updateDraft('event_date', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">Total Leads Captured</Label>
              <Input
                type="number" min={0}
                value={merged.actual_leads_captured ?? ''}
                onChange={(e) => updateDraft('actual_leads_captured', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[10px]">Demos Given</Label>
              <Input
                type="number" min={0}
                value={merged.actual_demos_given ?? ''}
                onChange={(e) => updateDraft('actual_demos_given', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[10px]">Est. Total Traffic</Label>
              <Input
                type="number" min={0}
                value={merged.actual_traffic_estimate ?? ''}
                onChange={(e) => updateDraft('actual_traffic_estimate', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[10px]">Peak Visitors (simultaneous)</Label>
              <Input
                type="number" min={0}
                value={merged.actual_peak_visitors ?? ''}
                onChange={(e) => updateDraft('actual_peak_visitors', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[10px]">Avg Dwell Time (seconds)</Label>
              <Input
                type="number" min={0}
                value={merged.actual_dwell_time_seconds ?? ''}
                onChange={(e) => updateDraft('actual_dwell_time_seconds', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[10px]">Engagement Rate (%)</Label>
              <Input
                type="number" min={0} max={100} step={0.1}
                value={merged.actual_engagement_rate ?? ''}
                onChange={(e) => updateDraft('actual_engagement_rate', Number(e.target.value))}
                className="h-7 text-xs" placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Notes</Label>
            <Textarea
              value={merged.notes || ''}
              onChange={(e) => updateDraft('notes', e.target.value)}
              className="text-xs min-h-[60px] resize-none"
              placeholder="Post-show observations, team feedback, key takeaways..."
              rows={2}
            />
          </div>

          {/* Auto-populate predictions from simulation */}
          {hasSimulation && !analytics?.predicted_traffic && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                onClick={() => {
                  setDraft(prev => ({
                    ...prev,
                    predicted_traffic: simulationPredictions?.traffic || null,
                    predicted_dwell_time_seconds: simulationPredictions?.dwellTime || null,
                    predicted_peak_capacity: simulationPredictions?.peakCapacity || null,
                    predicted_visibility_score: simulationPredictions?.visibilityScore || null,
                  }));
                }}
              >
                <Zap className="h-3 w-3 text-primary" />
                Auto-fill Predictions from Simulation
              </Button>
              <span className="text-[9px] text-muted-foreground">Uses your latest simulation data</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards — Predicted vs Actual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Traffic"
          icon={<Users className="h-3.5 w-3.5 text-primary" />}
          predicted={analytics?.predicted_traffic ?? simulationPredictions?.traffic}
          actual={analytics?.actual_traffic_estimate}
        />
        <KpiCard
          label="Leads Captured"
          icon={<Target className="h-3.5 w-3.5 text-primary" />}
          predicted={analytics?.predicted_traffic ? Math.round(analytics.predicted_traffic * 0.15) : undefined}
          actual={analytics?.actual_leads_captured}
        />
        <KpiCard
          label="Avg Dwell Time"
          icon={<Clock className="h-3.5 w-3.5 text-primary" />}
          predicted={analytics?.predicted_dwell_time_seconds ?? simulationPredictions?.dwellTime}
          actual={analytics?.actual_dwell_time_seconds}
          format="seconds"
        />
        <KpiCard
          label="Visibility Score"
          icon={<Eye className="h-3.5 w-3.5 text-primary" />}
          predicted={analytics?.predicted_visibility_score ?? simulationPredictions?.visibilityScore}
          actual={analytics?.actual_engagement_rate ? Math.round(analytics.actual_engagement_rate) : null}
          format="score"
        />
      </div>

      {/* Comparison bars when we have both predicted and actual */}
      {hasAnyData && analytics?.predicted_traffic && (
        <>
          <Separator />
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Predicted vs Actual Comparison
            </p>
            <div className="space-y-2">
              <ComparisonBar
                label="Foot Traffic"
                predicted={analytics.predicted_traffic || 0}
                actual={analytics.actual_traffic_estimate || 0}
                max={Math.max(analytics.predicted_traffic || 0, analytics.actual_traffic_estimate || 0)}
              />
              {analytics.predicted_peak_capacity && (
                <ComparisonBar
                  label="Peak Visitors"
                  predicted={analytics.predicted_peak_capacity}
                  actual={analytics.actual_peak_visitors || 0}
                  max={Math.max(analytics.predicted_peak_capacity, analytics.actual_peak_visitors || 0)}
                />
              )}
              <ComparisonBar
                label="Demo Engagement"
                predicted={Math.round((analytics.predicted_traffic || 0) * 0.08)}
                actual={analytics.actual_demos_given || 0}
                max={Math.max(Math.round((analytics.predicted_traffic || 0) * 0.08), analytics.actual_demos_given || 0)}
              />
            </div>
          </div>
        </>
      )}

      {/* Traffic by hour chart */}
      {analytics?.traffic_by_hour && Array.isArray(analytics.traffic_by_hour) && analytics.traffic_by_hour.length > 0 && (
        <>
          <Separator />
          <TrafficByHourChart data={analytics.traffic_by_hour} />
        </>
      )}

      {/* Performance insights */}
      {hasAnyData && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Performance Insights</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Lead conversion rate */}
              {analytics!.actual_traffic_estimate && analytics!.actual_traffic_estimate > 0 && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[9px] text-muted-foreground uppercase">Lead Conversion</p>
                  <p className="text-lg font-bold text-foreground">
                    {((analytics!.actual_leads_captured / analytics!.actual_traffic_estimate) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {analytics!.actual_leads_captured} leads from {analytics!.actual_traffic_estimate} visitors
                  </p>
                </div>
              )}
              {/* Demo rate */}
              {analytics!.actual_traffic_estimate && analytics!.actual_traffic_estimate > 0 && analytics!.actual_demos_given > 0 && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[9px] text-muted-foreground uppercase">Demo Rate</p>
                  <p className="text-lg font-bold text-foreground">
                    {((analytics!.actual_demos_given / analytics!.actual_traffic_estimate) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {analytics!.actual_demos_given} demos given
                  </p>
                </div>
              )}
              {/* Engagement quality */}
              {analytics!.actual_dwell_time_seconds && analytics!.actual_dwell_time_seconds > 0 && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[9px] text-muted-foreground uppercase">Engagement Quality</p>
                  <p className="text-lg font-bold text-foreground">
                    {analytics!.actual_dwell_time_seconds >= 180 ? '🔥 High' :
                     analytics!.actual_dwell_time_seconds >= 60 ? '✅ Good' : '⚡ Quick'}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatValue(analytics!.actual_dwell_time_seconds, 'seconds')} avg dwell
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {analytics?.notes && !editing && (
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-[10px] font-bold text-muted-foreground mb-1">📝 Post-Show Notes</p>
          <p className="text-xs text-foreground leading-relaxed">{analytics.notes}</p>
        </div>
      )}

      {/* Empty state */}
      {!hasAnyData && !editing && (
        <div className="text-center py-8 border rounded-lg bg-muted/10">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No Post-Show Data Yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-md mx-auto">
            After your event, enter real performance data to compare against simulation predictions
            and build a booth performance history.
          </p>
          {isAdmin && (
            <Button variant="outline" size="sm" className="mt-3 text-[10px] gap-1" onClick={() => setEditing(true)}>
              <FileSpreadsheet className="h-3 w-3" /> Enter Post-Show Data
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
