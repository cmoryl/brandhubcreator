/**
 * AI Center of Excellence — Centralized AI governance, quality, ethics & innovation hub
 * Enhanced: trend sparklines, quality alerts, entity comparison, PDF export, Oracle auto-seed, Imagery Strategy
 */

import React, { useState, useRef } from 'react';
import {
  Brain, Shield, BarChart3, Zap, Lightbulb, CheckCircle,
  Clock, AlertTriangle, Bot, Eye, TrendingUp, Activity,
  ArrowRight, RefreshCw, Plus, FileText, Sparkles,
  Download, Users, Bell, ArrowUp, ArrowDown, Camera,
  XCircle, CheckCircle2
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
import { useAICenterMetrics, type TrendPoint, type EntityComparison, type QualityAlert } from '@/hooks/useAICenterMetrics';
import { usePortfolioImageryAudits, type ImageryAuditResult } from '@/hooks/useImageryStrategyAudit';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { AIActivityPanel } from './AIActivityPanel';

// ─── Mini Sparkline SVG ─────────────────────────────────────
function Sparkline({ data, color = 'hsl(var(--primary))', height = 28, width = 100 }: {
  data: number[]; color?: string; height?: number; width?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5" fill={color} />
    </svg>
  );
}

// ─── Score Ring ─────────────────────────────────────────────
function ScoreRing({ value, label, size = 72, color }: { value: number; label: string; size?: number; color: string }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color, bg, sparkData }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; bg: string;
  sparkData?: number[];
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">{value}</p>
            {sparkData && sparkData.length > 2 && <Sparkline data={sparkData} width={60} height={20} />}
          </div>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const scoreColor = (v: number) => v >= 75 ? 'text-emerald-500' : v >= 50 ? 'text-amber-500' : 'text-destructive';
const scoreHsl = (v: number) => v >= 75 ? 'hsl(var(--chart-2))' : v >= 50 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))';

// ─── Quality Alerts Banner ──────────────────────────────────
function AlertsBanner({ alerts }: { alerts: QualityAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map(a => (
        <div key={a.id} className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm",
          a.type === 'critical' ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
        )}>
          <Bell className="h-4 w-4 shrink-0" />
          <span className="flex-1">{a.message}</span>
          <Badge variant="outline" className="text-[10px]">{a.metric}: {typeof a.value === 'number' ? a.value.toFixed(0) : a.value}</Badge>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────
function OverviewTab({ metrics, trends, alerts }: {
  metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']>;
  trends: TrendPoint[];
  alerts: QualityAlert[];
}) {
  return (
    <div className="space-y-6">
      <AlertsBanner alerts={alerts} />

      {/* Score Rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: metrics.aiQualityScore, label: 'AI Quality', color: scoreHsl(metrics.aiQualityScore) },
          { value: metrics.ethicsCompliancePercent, label: 'Ethics', color: scoreHsl(metrics.ethicsCompliancePercent) },
          { value: metrics.resourceEfficiency, label: 'Efficiency', color: scoreHsl(metrics.resourceEfficiency) },
          { value: metrics.innovationIndex, label: 'Innovation', color: scoreHsl(metrics.innovationIndex) },
        ].map(s => (
          <Card key={s.label} className="flex items-center justify-center py-4">
            <ScoreRing value={s.value} label={s.label} color={s.color} />
          </Card>
        ))}
      </div>

      {/* Key Metrics with Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Brain} label="Intelligence Jobs" value={metrics.totalJobs}
          sub={`${metrics.completedJobs} completed`} color="text-violet-500" bg="bg-violet-500/10"
          sparkData={trends.map(t => t.jobs)} />
        <MetricCard icon={Shield} label="Compliance Scans" value={metrics.totalComplianceScans}
          sub={`Avg: ${metrics.avgComplianceScore.toFixed(0)}%`} color="text-blue-500" bg="bg-blue-500/10"
          sparkData={trends.map(t => t.compliance)} />
        <MetricCard icon={Activity} label="Bias Scans" value={metrics.totalBiasScans}
          sub={`Inclusion: ${metrics.avgInclusionScore.toFixed(0)}%`} color="text-emerald-500" bg="bg-emerald-500/10"
          sparkData={trends.map(t => t.ethics)} />
        <MetricCard icon={Bot} label="Bot Conversations" value={metrics.totalConversations}
          sub={`Satisfaction: ${metrics.avgSatisfaction.toFixed(1)}/5`} color="text-orange-500" bg="bg-orange-500/10" />
      </div>

      {/* 30-Day Trend Chart */}
      {trends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">30-Day AI Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Daily Jobs', data: trends.map(t => t.jobs), color: 'hsl(var(--chart-1))' },
                { label: 'Success Rate', data: trends.map(t => t.successRate), color: 'hsl(var(--chart-2))' },
                { label: 'Compliance', data: trends.map(t => t.compliance), color: 'hsl(var(--chart-3))' },
                { label: 'Ethics', data: trends.map(t => t.ethics), color: 'hsl(var(--chart-4))' },
              ].map(item => {
                const last = item.data[item.data.length - 1] || 0;
                const prev = item.data[item.data.length - 2] || 0;
                const diff = last - prev;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      {diff !== 0 && (
                        <span className={cn("text-[10px] flex items-center gap-0.5", diff > 0 ? 'text-emerald-500' : 'text-destructive')}>
                          {diff > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                          {Math.abs(diff).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <Sparkline data={item.data} color={item.color} width={140} height={32} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Job Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Success Rate', value: metrics.jobSuccessRate },
              { label: 'Visibility Avg', value: metrics.avgVisibilityScore },
              { label: 'Ethics Score', value: metrics.ethicsCompliancePercent },
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
            {[
              { label: 'Total Compliance Scans', value: metrics.totalComplianceScans },
              { label: 'Average Score', value: metrics.avgComplianceScore > 0 ? `${metrics.avgComplianceScore.toFixed(0)}%` : '—', isScore: true, raw: metrics.avgComplianceScore },
              { label: 'Total Bias Scans', value: metrics.totalBiasScans },
              { label: 'Visibility Audits', value: metrics.totalVisibilityAudits },
              { label: 'Avg Visibility', value: metrics.avgVisibilityScore > 0 ? `${metrics.avgVisibilityScore.toFixed(0)}%` : '—', isScore: true, raw: metrics.avgVisibilityScore },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                {'isScore' in item && item.isScore ? (
                  <span className={cn("text-sm font-bold", scoreColor(item.raw as number))}>{item.value}</span>
                ) : (
                  <Badge variant="secondary">{item.value}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AI Governance Policies</CardTitle>
          <CardDescription className="text-xs">Active policies enforced across AI services</CardDescription>
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

// ─── Entity Comparison Tab ──────────────────────────────────
function EntityComparisonTab({ entities }: { entities: EntityComparison[] }) {
  if (entities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No entity data yet</p>
          <p className="text-sm">Run AI analyses on brands, products, or events to see comparisons.</p>
        </CardContent>
      </Card>
    );
  }

  const typeIcon = (t: string) => t === 'brand' ? '🏢' : t === 'product' ? '📦' : '📅';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entity AI Performance Comparison</CardTitle>
          <CardDescription className="text-xs">Side-by-side view of AI metrics per brand, product, and event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Entity</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Jobs</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Success</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Compliance</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Bias</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Visibility</th>
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground">Overall</th>
                </tr>
              </thead>
              <tbody>
                {entities.slice(0, 20).map(e => (
                  <tr key={e.entityId} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="py-2 pr-3 font-medium truncate max-w-[180px]">{e.entityName}</td>
                    <td className="text-center py-2 px-2">{typeIcon(e.entityType)}</td>
                    <td className="text-center py-2 px-2">{e.intelligenceJobs}</td>
                    <td className="text-center py-2 px-2">
                      <span className={scoreColor(e.successRate)}>{e.successRate > 0 ? `${e.successRate.toFixed(0)}%` : '—'}</span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={scoreColor(e.complianceScore)}>{e.complianceScore > 0 ? `${e.complianceScore.toFixed(0)}%` : '—'}</span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={scoreColor(e.biasScore)}>{e.biasScore > 0 ? `${e.biasScore.toFixed(0)}%` : '—'}</span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <span className={scoreColor(e.visibilityScore)}>{e.visibilityScore > 0 ? `${e.visibilityScore.toFixed(0)}%` : '—'}</span>
                    </td>
                    <td className="text-center py-2 px-2">
                      <Badge variant={e.overallAiScore >= 70 ? 'default' : e.overallAiScore >= 40 ? 'secondary' : 'destructive'} className="text-[10px]">
                        {e.overallAiScore}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top/Bottom performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
              <ArrowUp className="h-4 w-4" /> Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entities.slice(0, 5).map(e => (
              <div key={e.entityId} className="flex items-center justify-between p-2 rounded-lg border bg-card/60">
                <span className="text-xs font-medium truncate max-w-[150px]">{typeIcon(e.entityType)} {e.entityName}</span>
                <Badge variant="default" className="text-[10px]">{e.overallAiScore}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <ArrowDown className="h-4 w-4" /> Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entities.slice(-5).reverse().map(e => (
              <div key={e.entityId} className="flex items-center justify-between p-2 rounded-lg border bg-card/60">
                <span className="text-xs font-medium truncate max-w-[150px]">{typeIcon(e.entityType)} {e.entityName}</span>
                <Badge variant="destructive" className="text-[10px]">{e.overallAiScore}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Innovation Pipeline Tab ────────────────────────────────
function InnovationTab({ recommendations, updateRecommendation, addRecommendation, seedFromOracle }: {
  recommendations: ReturnType<typeof useAICenterMetrics>['recommendations'];
  updateRecommendation: ReturnType<typeof useAICenterMetrics>['updateRecommendation'];
  addRecommendation: ReturnType<typeof useAICenterMetrics>['addRecommendation'];
  seedFromOracle: ReturnType<typeof useAICenterMetrics>['seedFromOracle'];
}) {
  const [newKey, setNewKey] = useState('');
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const statusIcon = (s: string) => {
    switch (s) {
      case 'completed': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'deferred': return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Sparkles className="h-3.5 w-3.5 text-violet-500" />;
    }
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newText.trim()) return;
    setAdding(true);
    const ok = await addRecommendation(newKey.trim(), newText.trim());
    if (ok) { setNewKey(''); setNewText(''); toast.success('Recommendation added'); }
    else toast.error('Failed to add');
    setAdding(false);
  };

  const handleSeedFromOracle = async () => {
    setSeeding(true);
    try {
      const { data } = await (await import('@/integrations/supabase/client')).supabase
        .from('oracle_intelligence')
        .select('strategic_recommendations')
        .limit(1)
        .maybeSingle();
      
      const recs = Array.isArray(data?.strategic_recommendations) ? data.strategic_recommendations as any[] : [];
      if (recs.length === 0) {
        toast.info('No Oracle recommendations found. Run Oracle synthesis first.');
        setSeeding(false);
        return;
      }
      const count = await seedFromOracle(recs);
      if (count > 0) toast.success(`Imported ${count} recommendations from Oracle Brain`);
      else toast.info('All Oracle recommendations already imported');
    } catch {
      toast.error('Failed to fetch Oracle recommendations');
    }
    setSeeding(false);
  };

  const grouped = {
    pending: recommendations.filter(r => r.status === 'pending'),
    in_progress: recommendations.filter(r => r.status === 'in_progress'),
    completed: recommendations.filter(r => r.status === 'completed'),
    deferred: recommendations.filter(r => r.status === 'deferred'),
  };

  return (
    <div className="space-y-6">
      {/* Actions Row */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleSeedFromOracle} disabled={seeding} className="gap-1.5">
          {seeding ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
          Import from Oracle Brain
        </Button>
      </div>

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
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px]">{rec.source}</Badge>
                </div>
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

// ─── PDF Export ──────────────────────────────────────────────
function useAICenterPDFExport(
  metrics: NonNullable<ReturnType<typeof useAICenterMetrics>['metrics']> | null,
  recommendations: ReturnType<typeof useAICenterMetrics>['recommendations'],
  entityComparisons: EntityComparison[],
  alerts: QualityAlert[]
) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    if (!metrics) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = doc.internal.pageSize.getWidth();
      let y = 20;

      const addText = (text: string, size: number, bold = false, color: [number, number, number] = [30, 30, 30]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        doc.text(text, 15, y);
        y += size * 0.5 + 2;
      };

      const addBar = (label: string, value: number, maxWidth = 100) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(label, 15, y);
        doc.text(`${value.toFixed(0)}%`, w - 20, y, { align: 'right' });
        doc.setFillColor(value >= 75 ? 34 : value >= 50 ? 180 : 220, value >= 75 ? 197 : value >= 50 ? 130 : 53, value >= 75 ? 94 : value >= 50 ? 20 : 69);
        doc.rect(55, y - 3, (maxWidth * Math.min(value, 100)) / 100, 3, 'F');
        doc.setFillColor(230, 230, 230);
        doc.rect(55 + (maxWidth * Math.min(value, 100)) / 100, y - 3, maxWidth - (maxWidth * Math.min(value, 100)) / 100, 3, 'F');
        y += 7;
      };

      // Title
      addText('AI Center of Excellence Report', 18, true);
      addText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 9, false, [120, 120, 120]);
      y += 5;

      // Scores
      addText('Core Metrics', 12, true);
      y += 2;
      addBar('AI Quality Score', metrics.aiQualityScore);
      addBar('Ethics Compliance', metrics.ethicsCompliancePercent);
      addBar('Resource Efficiency', metrics.resourceEfficiency);
      addBar('Innovation Index', metrics.innovationIndex);
      y += 3;

      addText('Service Performance', 12, true);
      y += 2;
      addBar('Job Success Rate', metrics.jobSuccessRate);
      addBar('Compliance Score', metrics.avgComplianceScore);
      addBar('Inclusion Score', metrics.avgInclusionScore);
      addBar('Visibility Score', metrics.avgVisibilityScore);
      y += 3;

      // Alerts
      if (alerts.length > 0) {
        addText('Quality Alerts', 12, true, [200, 50, 50]);
        y += 2;
        alerts.forEach(a => {
          addText(`⚠ ${a.message}`, 8, false, a.type === 'critical' ? [200, 30, 30] : [180, 130, 20]);
        });
        y += 3;
      }

      // Stats summary
      addText('Operations Summary', 12, true);
      y += 2;
      const stats = [
        `Intelligence Jobs: ${metrics.totalJobs} (${metrics.completedJobs} completed, ${metrics.failedJobs} failed)`,
        `Compliance Scans: ${metrics.totalComplianceScans}`,
        `Bias Scans: ${metrics.totalBiasScans}`,
        `Visibility Audits: ${metrics.totalVisibilityAudits}`,
        `Imagery Strategy Audits: Active`,
        `Bot Conversations: ${metrics.totalConversations} (Avg satisfaction: ${metrics.avgSatisfaction.toFixed(1)}/5)`,
      ];
      stats.forEach(s => addText(s, 8));
      y += 3;

      // Recommendations
      if (recommendations.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        addText('Innovation Pipeline', 12, true);
        y += 2;
        const statusCounts = { pending: metrics.pendingRecommendations, in_progress: metrics.inProgressRecommendations, completed: metrics.completedRecommendations };
        addText(`Pending: ${statusCounts.pending} | In Progress: ${statusCounts.in_progress} | Completed: ${statusCounts.completed}`, 8);
        y += 2;
        recommendations.slice(0, 10).forEach(r => {
          if (y > 270) { doc.addPage(); y = 20; }
          addText(`[${r.status.replace('_', ' ')}] ${r.recommendation_text.slice(0, 90)}`, 7);
        });
        y += 3;
      }

      // Entity comparison
      if (entityComparisons.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        addText('Entity AI Performance', 12, true);
        y += 2;
        entityComparisons.slice(0, 10).forEach(e => {
          if (y > 270) { doc.addPage(); y = 20; }
          addText(`${e.entityName} (${e.entityType}) — Overall: ${e.overallAiScore}% | Jobs: ${e.intelligenceJobs} | Compliance: ${e.complianceScore.toFixed(0)}%`, 7);
        });
      }

      doc.save('AI-Center-of-Excellence-Report.pdf');
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    }
    setExporting(false);
  };

  return { exportPDF, exporting };
}

// ─── Imagery Strategy Tab ───────────────────────────────────
function ImageryStrategyTab({ organizationId }: { organizationId: string }) {
  const {
    audits, isLoading, avgOverall, avgDiversity, avgAuthenticity,
    avgCultural, avgAction, avgPrompting, stopFrequency, goFrequency, refresh,
  } = usePortfolioImageryAudits(organizationId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Camera className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No Imagery Audits Yet</p>
          <p className="text-sm">Run imagery audits from individual brand, product, or event editors to populate portfolio-wide scores.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedStop = Object.entries(stopFrequency).sort((a, b) => b[1] - a[1]);
  const sortedGo = Object.entries(goFrequency).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Score Rings */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { value: avgOverall, label: 'Overall', color: scoreHsl(avgOverall) },
          { value: avgDiversity, label: 'Diversity', color: scoreHsl(avgDiversity) },
          { value: avgAuthenticity, label: 'Authenticity', color: scoreHsl(avgAuthenticity) },
          { value: avgCultural, label: 'Cultural Context', color: scoreHsl(avgCultural) },
          { value: avgAction, label: 'Action Oriented', color: scoreHsl(avgAction) },
          { value: avgPrompting, label: 'Inclusive Prompting', color: scoreHsl(avgPrompting) },
        ].map(s => (
          <Card key={s.label} className="flex items-center justify-center py-4">
            <ScoreRing value={s.value} label={s.label} color={s.color} size={64} />
          </Card>
        ))}
      </div>

      {/* Entity Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Per-Entity Imagery Scores</CardTitle>
            <Button variant="ghost" size="sm" onClick={refresh} className="gap-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Entity</th>
                  <th className="text-center py-2 px-1 font-medium">Type</th>
                  <th className="text-center py-2 px-1 font-medium">Overall</th>
                  <th className="text-center py-2 px-1 font-medium">Diversity</th>
                  <th className="text-center py-2 px-1 font-medium">Authenticity</th>
                  <th className="text-center py-2 px-1 font-medium">Cultural</th>
                  <th className="text-center py-2 px-1 font-medium">Action</th>
                  <th className="text-center py-2 px-1 font-medium">Prompting</th>
                  <th className="text-center py-2 px-1 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium truncate max-w-[160px]">{a.entity_id.slice(0, 8)}...</td>
                    <td className="text-center py-2 px-1">
                      <Badge variant="outline" className="text-[10px]">{a.entity_type}</Badge>
                    </td>
                    {[a.overall_score, a.diversity_score, a.authenticity_score, a.cultural_context_score, a.action_orientation_score, a.inclusive_prompting_score].map((score, i) => (
                      <td key={i} className="text-center py-2 px-1">
                        <span className={cn("font-semibold", scoreColor(score || 0))}>{Math.round(score || 0)}%</span>
                      </td>
                    ))}
                    <td className="text-center py-2 px-1">
                      <Badge variant={a.stock_dependency === 'low' ? 'default' : a.stock_dependency === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {a.stock_dependency}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stop/Go Signal Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm">Stop Signals Detected</CardTitle>
            </div>
            <CardDescription className="text-xs">Most frequently detected across portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedStop.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No stop signals detected — great!</p>
            ) : (
              <div className="space-y-2">
                {sortedStop.slice(0, 6).map(([signal, count]) => (
                  <div key={signal} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="flex-1 text-foreground/80">{signal}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{count}×</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm">Go Signals Present</CardTitle>
            </div>
            <CardDescription className="text-xs">Inclusive practices observed across portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedGo.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No go signals found yet — run audits to populate.</p>
            ) : (
              <div className="space-y-2">
                {sortedGo.slice(0, 6).map(([signal, count]) => (
                  <div key={signal} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="flex-1 text-foreground/80">{signal}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{count}×</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function AICenterOfExcellence() {
  const { metrics, recommendations, trends, entityComparisons, alerts, isLoading, refresh, updateRecommendation, addRecommendation, seedFromOracle } = useAICenterMetrics();
  const { exportPDF, exporting } = useAICenterPDFExport(metrics, recommendations, entityComparisons, alerts);
  const { organization } = useOrganization();

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI Center of Excellence
          </h2>
          <p className="text-sm text-muted-foreground">Centralized AI governance, quality, ethics & innovation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting} className="gap-1">
            {exporting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
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
          <TabsTrigger value="entities" className="gap-1 text-xs">
            <Users className="h-3 w-3" /> Entities
          </TabsTrigger>
          <TabsTrigger value="imagery" className="gap-1 text-xs">
            <Camera className="h-3 w-3" /> Imagery
          </TabsTrigger>
          <TabsTrigger value="innovation" className="gap-1 text-xs">
            <Lightbulb className="h-3 w-3" /> Innovation
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1 text-xs">
            <Activity className="h-3 w-3" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab metrics={metrics} trends={trends} alerts={alerts} /></TabsContent>
        <TabsContent value="governance"><GovernanceTab metrics={metrics} /></TabsContent>
        <TabsContent value="quality"><QualityTab metrics={metrics} /></TabsContent>
        <TabsContent value="resources"><ResourcesTab metrics={metrics} /></TabsContent>
        <TabsContent value="entities"><EntityComparisonTab entities={entityComparisons} /></TabsContent>
        <TabsContent value="imagery">
          {organization?.id ? <ImageryStrategyTab organizationId={organization.id} /> : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Select an organization to view imagery audits.</CardContent></Card>
          )}
        </TabsContent>
        <TabsContent value="innovation">
          <InnovationTab recommendations={recommendations} updateRecommendation={updateRecommendation} addRecommendation={addRecommendation} seedFromOracle={seedFromOracle} />
        </TabsContent>
        <TabsContent value="activity"><AIActivityPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
