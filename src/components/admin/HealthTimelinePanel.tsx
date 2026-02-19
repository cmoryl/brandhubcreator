/**
 * Health Timeline Panel
 * Unified longitudinal analytics dashboard for tracking brand health over time.
 * Shows trend charts, monthly comparisons, and delta indicators.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Camera, Loader2, CalendarDays, Activity, Shield, Users, Globe, Swords } from 'lucide-react';
import { useHealthSnapshots } from '@/hooks/useHealthSnapshots';
import { useOrganization } from '@/contexts/OrganizationContext';

const chartConfig = {
  health: { label: 'Brand Health', color: 'hsl(var(--primary))' },
  compliance: { label: 'Compliance', color: 'hsl(220, 70%, 55%)' },
  bias: { label: 'Inclusion', color: 'hsl(280, 60%, 55%)' },
  website: { label: 'Website', color: 'hsl(150, 60%, 45%)' },
  competitive: { label: 'Competitive', color: 'hsl(35, 80%, 50%)' },
};

interface HealthTimelinePanelProps {
  entityId?: string;
  entityType?: string;
  compact?: boolean;
}

export const HealthTimelinePanel = ({ entityId, entityType = 'brand', compact = false }: HealthTimelinePanelProps) => {
  const { organization } = useOrganization();
  const { trends, orgSummary, isLoading, isCapturing, captureSnapshot } = useHealthSnapshots(entityId, entityType);
  const [view, setView] = useState<'entity' | 'org'>('org');

  const data = view === 'entity' ? trends : orgSummary;
  const hasData = data.length > 0;

  // Format chart data
  const chartData = view === 'entity'
    ? trends.map(t => ({
        date: new Date(t.snapshot_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        health: t.brand_health_score ? Math.round(t.brand_health_score) : null,
        compliance: t.compliance_score ? Math.round(t.compliance_score) : null,
        bias: t.bias_inclusion_score ? Math.round(t.bias_inclusion_score) : null,
        website: t.website_score ? Math.round(t.website_score) : null,
        competitive: t.competitive_score ? Math.round(t.competitive_score) : null,
      }))
    : orgSummary.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        health: s.avg_health_score ? Math.round(s.avg_health_score) : null,
        compliance: s.avg_compliance_score ? Math.round(s.avg_compliance_score) : null,
        bias: s.avg_bias_score ? Math.round(s.avg_bias_score) : null,
        website: s.avg_website_score ? Math.round(s.avg_website_score) : null,
        entities: s.entity_count,
      }));

  // Latest snapshot for KPI cards
  const latest = trends.length > 0 ? trends[trends.length - 1] : null;

  const renderDelta = (value: number | null | undefined) => {
    if (value === null || value === undefined) return null;
    const rounded = Math.round(value * 10) / 10;
    if (rounded > 0) return <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium"><TrendingUp className="h-3 w-3" />+{rounded}</span>;
    if (rounded < 0) return <span className="flex items-center gap-0.5 text-destructive text-xs font-medium"><TrendingDown className="h-3 w-3" />{rounded}</span>;
    return <span className="flex items-center gap-0.5 text-muted-foreground text-xs"><Minus className="h-3 w-3" />0</span>;
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Health Trends
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => captureSnapshot(entityId, entityType)} disabled={isCapturing}>
              {isCapturing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-xs text-muted-foreground text-center py-4">No snapshots yet. Capture your first snapshot to start tracking.</p>
          ) : (
            <div className="h-[120px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={chartData}>
                  <Area type="monotone" dataKey="health" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </AreaChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Longitudinal Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Track scores and improvements over time</p>
        </div>
        <div className="flex items-center gap-3">
          {entityId && (
            <Select value={view} onValueChange={(v) => setView(v as 'entity' | 'org')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entity">This Entity</SelectItem>
                <SelectItem value="org">Organization</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => captureSnapshot(entityId, entityType)} disabled={isCapturing} className="gap-2">
            {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Capture Snapshot
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {latest && view === 'entity' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'brand_health', label: 'Health', icon: Activity, score: latest.brand_health_score, delta: latest.score_deltas?.brand_health },
            { key: 'compliance', label: 'Compliance', icon: Shield, score: latest.compliance_score, delta: latest.score_deltas?.compliance },
            { key: 'bias', label: 'Inclusion', icon: Users, score: latest.bias_inclusion_score, delta: latest.score_deltas?.bias },
            { key: 'website', label: 'Website', icon: Globe, score: latest.website_score, delta: latest.score_deltas?.website },
            { key: 'competitive', label: 'Competitive', icon: Swords, score: latest.competitive_score, delta: latest.score_deltas?.competitive },
          ].map(({ key, label, icon: Icon, score, delta }) => (
            <Card key={key}>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon className="h-3 w-3" />{label}
                  </span>
                  {renderDelta(delta)}
                </div>
                <p className="text-2xl font-bold">
                  {score !== null ? `${Math.round(score)}%` : 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Score Timeline
          </CardTitle>
          <CardDescription>
            {view === 'entity' ? 'Individual entity scores over time' : 'Organization-wide averages over time'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasData ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No data yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Capture Snapshot" to record your first set of scores.
                <br />Monthly snapshots will also run automatically.
              </p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="health" stroke={chartConfig.health.color} strokeWidth={2.5} dot={{ r: 4 }} name="Brand Health" />
                  <Line type="monotone" dataKey="compliance" stroke={chartConfig.compliance.color} strokeWidth={1.5} dot={{ r: 3 }} name="Compliance" />
                  <Line type="monotone" dataKey="bias" stroke={chartConfig.bias.color} strokeWidth={1.5} dot={{ r: 3 }} name="Inclusion" />
                  <Line type="monotone" dataKey="website" stroke={chartConfig.website.color} strokeWidth={1.5} dot={{ r: 3 }} name="Website" />
                  {view === 'entity' && (
                    <Line type="monotone" dataKey="competitive" stroke={chartConfig.competitive.color} strokeWidth={1.5} dot={{ r: 3 }} name="Competitive" />
                  )}
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshot History Table */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Snapshot History</CardTitle>
            <CardDescription>All recorded measurement points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(view === 'entity' ? trends : []).slice().reverse().map((snap, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{new Date(snap.snapshot_date).toLocaleDateString()}</span>
                      <Badge variant="outline" className="ml-2 text-xs capitalize">{snap.triggered_by}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {snap.brand_health_score !== null && (
                      <div className="text-right">
                        <span className="font-semibold">{Math.round(snap.brand_health_score)}%</span>
                        <span className="text-xs text-muted-foreground ml-1">health</span>
                        {renderDelta(snap.score_deltas?.brand_health)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {view === 'org' && orgSummary.slice().reverse().map((snap, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{new Date(snap.snapshot_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {snap.avg_health_score !== null && (
                      <span className="font-semibold">{Math.round(snap.avg_health_score)}% avg</span>
                    )}
                    <Badge variant="secondary">{snap.entity_count} entities</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
