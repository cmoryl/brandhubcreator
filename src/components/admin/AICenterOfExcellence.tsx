/**
 * AI Center of Excellence — Centralized AI governance, quality, ethics & innovation hub
 */

import React, { useState } from 'react';
import {
  Brain, Shield, BarChart3, Zap, Lightbulb, CheckCircle,
  Clock, AlertTriangle, Bot, Eye, TrendingUp, Activity,
  ArrowRight, RefreshCw, Plus, FileText, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAICenterMetrics } from '@/hooks/useAICenterMetrics';
import { toast } from 'sonner';

// ─── Score Ring ─────────────────────────────────────────────
function ScoreRing({ value, label, size = 72, color }: { value: number; label: string; size?: number; color: string }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold">{Math.round(value)}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const scoreColor = (v: number) => v >= 75 ? 'text-emerald-500' : v >= 50 ? 'text-amber-500' : 'text-destructive';
const scoreHsl = (v: number) => v >= 75 ? 'hsl(var(--chart-2))' : v >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))';

// ─── Overview Tab ───────────────────────────────────────────
function OverviewTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']> }) {
  return (
    <div className="space-y-6">
      {/* Score Rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: metrics.aiQualityScore, label: 'AI Quality', color: scoreHsl(metrics.aiQualityScore) },
          { value: metrics.ethicsCompliancePercent, label: 'Ethics', color: scoreHsl(metrics.ethicsCompliancePercent) },
          { value: metrics.resourceEfficiency, label: 'Efficiency', color: scoreHsl(metrics.resourceEfficiency) },
          { value: metrics.innovationIndex, label: 'Innovation', color: scoreHsl(metrics.innovationIndex) },
        ].map(s => (
          <Card key={s.label} className="flex items-center justify-center py-4">
            <div className="relative">
              <ScoreRing value={s.value} label={s.label} color={s.color} />
            </div>
          </Card>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Brain} label="Intelligence Jobs" value={metrics.totalJobs}
          sub={`${metrics.completedJobs} completed`} color="text-violet-500" bg="bg-violet-500/10" />
        <MetricCard icon={Shield} label="Compliance Scans" value={metrics.totalComplianceScans}
          sub={`Avg: ${metrics.avgComplianceScore.toFixed(0)}%`} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={Activity} label="Bias Scans" value={metrics.totalBiasScans}
          sub={`Inclusion: ${metrics.avgInclusionScore.toFixed(0)}%`} color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={Bot} label="Bot Conversations" value={metrics.totalConversations}
          sub={`Satisfaction: ${metrics.avgSatisfaction.toFixed(1)}/5`} color="text-orange-500" bg="bg-orange-500/10" />
      </div>

      {/* Job Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Job Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Success Rate', value: metrics.jobSuccessRate, color: 'bg-emerald-500' },
              { label: 'Visibility Avg', value: metrics.avgVisibilityScore, color: 'bg-cyan-500' },
              { label: 'Ethics Score', value: metrics.ethicsCompliancePercent, color: 'bg-violet-500' },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className={cn("text-xs font-bold", scoreColor(item.value))}>{item.value.toFixed(0)}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Governance Tab ─────────────────────────────────────────
function GovernanceTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> Ethics Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Inclusion Score', value: metrics.avgInclusionScore },
              { label: 'Language Score', value: metrics.avgLanguageScore },
              { label: 'Visual Score', value: metrics.avgVisualScore },
              { label: 'Accessibility', value: metrics.avgAccessibilityScore },
            ].map(dim => (
              <div key={dim.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{dim.label}</span>
                  <span className={cn("text-xs font-bold", scoreColor(dim.value))}>{dim.value > 0 ? `${dim.value.toFixed(0)}%` : '—'}</span>
                </div>
                <Progress value={dim.value} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Compliance Scans</span>
              <Badge variant="secondary">{metrics.totalComplianceScans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Average Score</span>
              <span className={cn("text-sm font-bold", scoreColor(metrics.avgComplianceScore))}>
                {metrics.avgComplianceScore > 0 ? `${metrics.avgComplianceScore.toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Bias Scans</span>
              <Badge variant="secondary">{metrics.totalBiasScans}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Visibility Audits</span>
              <Badge variant="secondary">{metrics.totalVisibilityAudits}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Visibility</span>
              <span className={cn("text-sm font-bold", scoreColor(metrics.avgVisibilityScore))}>
                {metrics.avgVisibilityScore > 0 ? `${metrics.avgVisibilityScore.toFixed(0)}%` : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Governance Policies</CardTitle>
          <CardDescription className="text-xs">Active policies and standards enforced across your AI services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Bias Detection', desc: 'Language, visual, and inclusion screening', active: metrics.totalBiasScans > 0 },
              { label: 'Compliance Checks', desc: 'Brand alignment and guideline adherence', active: metrics.totalComplianceScans > 0 },
              { label: 'Bot Monitoring', desc: 'Satisfaction tracking and response quality', active: metrics.totalConversations > 0 },
              { label: 'Visibility Audits', desc: 'Search, social, and AI platform presence', active: metrics.totalVisibilityAudits > 0 },
              { label: 'Cultural Validation', desc: 'Regional sensitivity and adaptation checks', active: true },
              { label: 'Data Privacy', desc: 'No PII in prompts, JWT-verified endpoints', active: true },
            ].map(p => (
              <div key={p.label} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card">
                <CheckCircle className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", p.active ? 'text-emerald-500' : 'text-muted-foreground/40')} />
                <div>
                  <p className="text-xs font-medium">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Quality Tab ────────────────────────────────────────────
function QualityTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={TrendingUp} label="Success Rate" value={`${metrics.jobSuccessRate.toFixed(0)}%`}
          color="text-emerald-500" bg="bg-emerald-500/10" />
        <MetricCard icon={AlertTriangle} label="Failed Jobs" value={metrics.failedJobs}
          sub={`of ${metrics.totalJobs} total`} color="text-destructive" bg="bg-destructive/10" />
        <MetricCard icon={Clock} label="Pending" value={metrics.pendingJobs}
          color="text-amber-500" bg="bg-amber-500/10" />
        <MetricCard icon={Bot} label="Avg Satisfaction" value={`${metrics.avgSatisfaction.toFixed(1)}/5`}
          color="text-blue-500" bg="bg-blue-500/10" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Service Quality Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Brand Intelligence', value: metrics.jobSuccessRate, desc: `${metrics.completedJobs}/${metrics.totalJobs} jobs` },
            { label: 'DataForce Compliance', value: metrics.avgComplianceScore, desc: `${metrics.totalComplianceScans} scans` },
            { label: 'Bias Awareness', value: metrics.avgInclusionScore, desc: `${metrics.totalBiasScans} scans` },
            { label: 'Visibility Audits', value: metrics.avgVisibilityScore, desc: `${metrics.totalVisibilityAudits} audits` },
            { label: 'Bot Satisfaction', value: (metrics.avgSatisfaction / 5) * 100, desc: `${metrics.totalConversations} conversations` },
          ].map(svc => (
            <div key={svc.label} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">{svc.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{svc.desc}</span>
                  <span className={cn("text-xs font-bold", scoreColor(svc.value))}>{svc.value > 0 ? `${svc.value.toFixed(0)}%` : '—'}</span>
                </div>
              </div>
              <Progress value={svc.value} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Resources Tab ──────────────────────────────────────────
function ResourcesTab({ metrics }: { metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']> }) {
  const totalOperations = metrics.totalJobs + metrics.totalComplianceScans + metrics.totalBiasScans + metrics.totalVisibilityAudits + metrics.totalConversations;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Zap} label="Total AI Operations" value={totalOperations}
          color="text-yellow-500" bg="bg-yellow-500/10" />
        <MetricCard icon={Brain} label="Intelligence" value={metrics.totalJobs}
          sub={`${metrics.jobSuccessRate.toFixed(0)}% success`} color="text-violet-500" bg="bg-violet-500/10" />
        <MetricCard icon={Shield} label="Compliance + Bias" value={metrics.totalComplianceScans + metrics.totalBiasScans}
          color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard icon={Eye} label="Visibility" value={metrics.totalVisibilityAudits}
          color="text-cyan-500" bg="bg-cyan-500/10" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Resource Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Brand Intelligence', value: metrics.totalJobs, color: 'bg-violet-500' },
            { label: 'Compliance Scans', value: metrics.totalComplianceScans, color: 'bg-blue-500' },
            { label: 'Bias Scans', value: metrics.totalBiasScans, color: 'bg-emerald-500' },
            { label: 'Visibility Audits', value: metrics.totalVisibilityAudits, color: 'bg-cyan-500' },
            { label: 'Bot Conversations', value: metrics.totalConversations, color: 'bg-orange-500' },
          ].map(item => {
            const pct = totalOperations > 0 ? (item.value / totalOperations) * 100 : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium">{item.value} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Innovation Pipeline Tab ────────────────────────────────
function InnovationTab({ recommendations, updateRecommendation, addRecommendation }: {
  recommendations: ReturnType<typeof useAICenterMetrics>['recommendations'];
  updateRecommendation: ReturnType<typeof useAICenterMetrics>['updateRecommendation'];
  addRecommendation: ReturnType<typeof useAICenterMetrics>['addRecommendation'];
}) {
  const [newKey, setNewKey] = useState('');
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'completed': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'deferred': return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Sparkles className="h-3.5 w-3.5 text-violet-500" />;
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', deferred: 'Deferred' };
    const variant = s === 'completed' ? 'default' : s === 'in_progress' ? 'secondary' : 'outline';
    return <Badge variant={variant as any} className="text-[10px]">{map[s] || s}</Badge>;
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newText.trim()) return;
    setAdding(true);
    const ok = await addRecommendation(newKey.trim(), newText.trim());
    if (ok) { setNewKey(''); setNewText(''); toast.success('Recommendation added'); }
    else toast.error('Failed to add');
    setAdding(false);
  };

  const grouped = {
    pending: recommendations.filter(r => r.status === 'pending'),
    in_progress: recommendations.filter(r => r.status === 'in_progress'),
    completed: recommendations.filter(r => r.status === 'completed'),
    deferred: recommendations.filter(r => r.status === 'deferred'),
  };

  return (
    <div className="space-y-6">
      {/* Add New */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Strategic Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Recommendation key (e.g. ai-center-of-excellence)" value={newKey}
            onChange={e => setNewKey(e.target.value)} className="text-sm" />
          <Textarea placeholder="Describe the recommendation..." value={newText}
            onChange={e => setNewText(e.target.value)} rows={2} className="text-sm" />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newKey.trim() || !newText.trim()}>
            {adding ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Add
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['pending', 'in_progress', 'completed', 'deferred'] as const).map(status => (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b">
              {statusIcon(status)}
              <span className="text-xs font-semibold capitalize">{status.replace('_', ' ')}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">{grouped[status].length}</Badge>
            </div>
            {grouped[status].length === 0 && (
              <p className="text-[10px] text-muted-foreground py-4 text-center">No items</p>
            )}
            {grouped[status].map(rec => (
              <Card key={rec.id} className="p-3 space-y-2">
                <p className="text-xs font-medium leading-snug">{rec.recommendation_text}</p>
                <p className="text-[10px] text-muted-foreground">{rec.recommendation_key}</p>
                {rec.notes && <p className="text-[10px] text-muted-foreground italic">{rec.notes}</p>}
                <Select value={rec.status} onValueChange={v => updateRecommendation(rec.id, v)}>
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function AICenterOfExcellence() {
  const { metrics, recommendations, isLoading, refresh, updateRecommendation, addRecommendation } = useAICenterMetrics();

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Brain className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No AI Data Available</p>
          <p className="text-sm">Run intelligence, compliance, or bias scans to populate metrics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI Center of Excellence
          </h2>
          <p className="text-sm text-muted-foreground">Centralized AI governance, quality, ethics & innovation</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1 text-xs">
            <BarChart3 className="h-3 w-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-1 text-xs">
            <Shield className="h-3 w-3" /> Governance
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-1 text-xs">
            <TrendingUp className="h-3 w-3" /> Quality
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1 text-xs">
            <Zap className="h-3 w-3" /> Resources
          </TabsTrigger>
          <TabsTrigger value="innovation" className="gap-1 text-xs">
            <Lightbulb className="h-3 w-3" /> Innovation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab metrics={metrics} /></TabsContent>
        <TabsContent value="governance"><GovernanceTab metrics={metrics} /></TabsContent>
        <TabsContent value="quality"><QualityTab metrics={metrics} /></TabsContent>
        <TabsContent value="resources"><ResourcesTab metrics={metrics} /></TabsContent>
        <TabsContent value="innovation">
          <InnovationTab recommendations={recommendations} updateRecommendation={updateRecommendation} addRecommendation={addRecommendation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
