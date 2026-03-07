/**
 * ExecutiveSummaryPanel - High-level scorecard with drill-down capability
 * Covers: Brand Health, User Engagement, Content Performance, AI & Intelligence
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, FileText, Brain, TrendingUp, TrendingDown, Minus,
  ArrowRight, ChevronDown, ChevronUp, BarChart3, Eye, Zap,
  Shield, Globe, Activity, Clock, Target, Sparkles, Layers,
  CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ExecutiveMetrics {
  brandHealth: {
    avgScore: number;
    trend: number; // delta vs last period
    excellent: number;
    needsWork: number;
    critical: number;
    total: number;
  };
  engagement: {
    totalPageViews: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    trend: number;
    topEntity: string | null;
    externalViewers: number;
  };
  content: {
    totalEntities: number;
    publishedEntities: number;
    avgCompleteness: number;
    topGap: string | null;
    recentlyUpdated: number;
    staleCount: number;
  };
  intelligence: {
    totalAnalyses: number;
    complianceAvg: number;
    biasAvg: number;
    researchBriefings: number;
    oracleRuns: number;
    activeBots: number;
  };
}

interface ExecutiveSummaryPanelProps {
  onNavigate: (tab: string) => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
      <TrendingUp className="h-3 w-3" />+{value}{suffix}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
      <TrendingDown className="h-3 w-3" />{value}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />0{suffix}
    </span>
  );
}

function ScoreRing({ value, size = 56, color }: { value: number; size?: number; color: string }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  subtitle,
  trend,
  trendSuffix,
  children,
  onClick,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
  trendSuffix?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div variants={fadeIn}>
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-2 rounded-lg', iconBg)}>
              <Icon className={cn('h-4 w-4', iconColor)} />
            </div>
            {trend !== undefined && <TrendIndicator value={trend} suffix={trendSuffix} />}
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">{subtitle}</p>

          {children && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 h-6 text-[10px] gap-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Less' : 'Details'}
              </Button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 border-t mt-2 space-y-2">
                      {children}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {onClick && (
            <Button variant="ghost" size="sm" className="w-full mt-2 h-6 text-[10px] gap-1" onClick={onClick}>
              View Full Report <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', color)}>{value}</span>
    </div>
  );
}

export function ExecutiveSummaryPanel({ onNavigate }: ExecutiveSummaryPanelProps) {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

      // Parallel fetch all data sources
      const [
        brandsRes, productsRes, eventsRes,
        pageViewsRes, pageViewsPrevRes,
        sessionsRes,
        complianceRes, biasRes,
        intelligenceRes, researchRes, oracleRes,
        botConfigRes,
      ] = await Promise.all([
        supabase.from('brands').select('id, name, guide_data, is_public, updated_at').order('updated_at', { ascending: false }),
        supabase.from('products').select('id, name, guide_data, is_public, updated_at').order('updated_at', { ascending: false }),
        supabase.from('events').select('id, name, guide_data, is_public, updated_at').order('updated_at', { ascending: false }),
        supabase.from('page_views').select('id, user_id, entity_name', { count: 'exact' }).gte('created_at', thirtyDaysAgo),
        supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lte('created_at', thirtyDaysAgo),
        supabase.from('user_sessions').select('duration_seconds').gte('started_at', thirtyDaysAgo),
        supabase.from('dataforce_compliance_jobs').select('entity_id, compliance_score').eq('status', 'completed').order('created_at', { ascending: false }),
        supabase.from('bias_awareness_scans').select('inclusion_score').eq('status', 'completed').order('created_at', { ascending: false }).limit(50),
        supabase.from('brand_intelligence_jobs').select('id, status').order('created_at', { ascending: false }),
        supabase.from('research_briefings').select('id').gte('created_at', thirtyDaysAgo),
        supabase.from('oracle_intelligence').select('id').order('created_at', { ascending: false }).limit(10),
        supabase.from('bot_config').select('id, is_active'),
      ]);

      const brands = brandsRes.data || [];
      const products = productsRes.data || [];
      const events = eventsRes.data || [];
      const allEntities = [...brands, ...products, ...events];

      // Brand Health calculations
      const healthScores = allEntities.map(e => {
        const gd = (e.guide_data || {}) as Record<string, unknown>;
        let score = 0, max = 0;
        if ((gd.hero as any)?.name) score += 15; max += 15;
        if ((gd.hero as any)?.tagline) score += 10; max += 10;
        if ((gd.identity as any)?.missionStatement) score += 12; max += 12;
        if (Array.isArray(gd.colors) && gd.colors.length > 0) score += 15; max += 15;
        if (Array.isArray(gd.typography) && gd.typography.length > 0) score += 12; max += 12;
        if (Array.isArray(gd.logos) && gd.logos.length > 0) score += 15; max += 15;
        if (Array.isArray(gd.values) && gd.values.length > 0) score += 10; max += 10;
        if (Array.isArray(gd.social) && gd.social.length > 0) score += 8; max += 8;
        return max > 0 ? Math.round((score / max) * 100) : 0;
      });
      const avgHealth = healthScores.length ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 0;

      // Page views & engagement
      const currentViews = pageViewsRes.count || 0;
      const prevViews = pageViewsPrevRes.count || 0;
      const viewTrend = prevViews > 0 ? Math.round(((currentViews - prevViews) / prevViews) * 100) : 0;
      const uniqueUsers = new Set((pageViewsRes.data || []).map(v => v.user_id).filter(Boolean)).size;
      const sessions = sessionsRes.data || [];
      const avgDuration = sessions.length ? Math.round(sessions.reduce((s, d) => s + (d.duration_seconds || 0), 0) / sessions.length) : 0;

      // Top entity
      const entityCounts = new Map<string, number>();
      (pageViewsRes.data || []).forEach(v => {
        if (v.entity_name) entityCounts.set(v.entity_name, (entityCounts.get(v.entity_name) || 0) + 1);
      });
      const topEntity = entityCounts.size ? [...entityCounts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;

      // Content performance
      const published = allEntities.filter(e => e.is_public).length;
      const recentlyUpdated = allEntities.filter(e => new Date(e.updated_at) > new Date(thirtyDaysAgo)).length;
      const stale = allEntities.filter(e => new Date(e.updated_at) < new Date(sixtyDaysAgo)).length;

      // Common gap detection
      let missingLogos = 0, missingColors = 0, missingIdentity = 0;
      allEntities.forEach(e => {
        const gd = (e.guide_data || {}) as Record<string, unknown>;
        if (!Array.isArray(gd.logos) || gd.logos.length === 0) missingLogos++;
        if (!Array.isArray(gd.colors) || gd.colors.length === 0) missingColors++;
        if (!(gd.identity as any)?.missionStatement) missingIdentity++;
      });
      const topGap = missingLogos >= missingColors && missingLogos >= missingIdentity
        ? `Logos (${missingLogos})`
        : missingColors >= missingIdentity
          ? `Colors (${missingColors})`
          : `Identity (${missingIdentity})`;

      // Compliance & Bias averages
      const compScores = new Map<string, number>();
      (complianceRes.data || []).forEach(j => {
        if (!compScores.has(j.entity_id) && j.compliance_score != null) compScores.set(j.entity_id, j.compliance_score);
      });
      const compArr = [...compScores.values()];
      const compAvg = compArr.length ? Math.round(compArr.reduce((a, b) => a + b, 0) / compArr.length) : 0;

      const biasScores = (biasRes.data || []).map(s => s.inclusion_score).filter((s): s is number => s != null);
      const biasAvg = biasScores.length ? Math.round(biasScores.reduce((a, b) => a + b, 0) / biasScores.length) : 0;

      // Intelligence counts
      const totalAnalyses = (intelligenceRes.data || []).filter(j => j.status === 'completed').length;
      const activeBots = (botConfigRes.data || []).filter(b => b.is_active).length;

      setMetrics({
        brandHealth: {
          avgScore: avgHealth,
          trend: 0, // Would need historical snapshots for real delta
          excellent: healthScores.filter(s => s >= 80).length,
          needsWork: healthScores.filter(s => s >= 40 && s < 80).length,
          critical: healthScores.filter(s => s < 40).length,
          total: allEntities.length,
        },
        engagement: {
          totalPageViews: currentViews,
          uniqueUsers,
          avgSessionDuration: avgDuration,
          trend: viewTrend,
          topEntity,
          externalViewers: 0,
        },
        content: {
          totalEntities: allEntities.length,
          publishedEntities: published,
          avgCompleteness: avgHealth,
          topGap,
          recentlyUpdated,
          staleCount: stale,
        },
        intelligence: {
          totalAnalyses,
          complianceAvg: compAvg,
          biasAvg,
          researchBriefings: researchRes.data?.length || 0,
          oracleRuns: oracleRes.data?.length || 0,
          activeBots,
        },
      });
    } catch (err) {
      console.error('Executive metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const { brandHealth: bh, engagement: eg, content: ct, intelligence: ai } = metrics;

  const healthColor = bh.avgScore >= 80 ? 'hsl(142, 76%, 36%)' : bh.avgScore >= 60 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)';
  const compColor = ai.complianceAvg >= 80 ? 'hsl(142, 76%, 36%)' : ai.complianceAvg >= 60 ? 'hsl(48, 96%, 53%)' : 'hsl(0, 84%, 60%)';

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Executive Dashboard
          </h3>
          <p className="text-xs text-muted-foreground">30-day performance snapshot across all dimensions</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={fetchMetrics}>
          <Activity className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Top-level KPI Scorecards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      >
        {/* Brand Health */}
        <MetricCard
          icon={Heart}
          iconColor="text-rose-500"
          iconBg="bg-rose-500/10"
          title="Avg Brand Health"
          value={`${bh.avgScore}%`}
          subtitle={`${bh.total} entities analyzed`}
          onClick={() => onNavigate('analytics')}
        >
          <div className="flex items-center justify-center">
            <ScoreRing value={bh.avgScore} color={healthColor} />
          </div>
          <DetailRow label="Excellent (80+)" value={bh.excellent} color="text-green-600" />
          <DetailRow label="Needs Work (40-79)" value={bh.needsWork} color="text-yellow-600" />
          <DetailRow label="Critical (<40)" value={bh.critical} color="text-red-600" />
        </MetricCard>

        {/* User Engagement */}
        <MetricCard
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
          title="Page Views (30d)"
          value={eg.totalPageViews.toLocaleString()}
          subtitle={`${eg.uniqueUsers} unique users`}
          trend={eg.trend}
          onClick={() => onNavigate('user-analytics')}
        >
          <DetailRow label="Unique Users" value={eg.uniqueUsers} />
          <DetailRow label="Avg Session" value={`${Math.round(eg.avgSessionDuration / 60)}m`} />
          {eg.topEntity && <DetailRow label="Top Content" value={eg.topEntity} />}
        </MetricCard>

        {/* Content Performance */}
        <MetricCard
          icon={FileText}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
          title="Published Entities"
          value={`${ct.publishedEntities}/${ct.totalEntities}`}
          subtitle={`${ct.recentlyUpdated} updated this month`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Publish Rate</span>
              <span className="font-medium">{ct.totalEntities ? Math.round((ct.publishedEntities / ct.totalEntities) * 100) : 0}%</span>
            </div>
            <Progress value={ct.totalEntities ? (ct.publishedEntities / ct.totalEntities) * 100 : 0} className="h-1.5" />
          </div>
          <DetailRow label="Avg Completeness" value={`${ct.avgCompleteness}%`} />
          <DetailRow label="Top Gap" value={ct.topGap || 'None'} />
          <DetailRow label="Stale (60d+)" value={ct.staleCount} color={ct.staleCount > 0 ? 'text-amber-600' : undefined} />
        </MetricCard>

        {/* AI & Intelligence */}
        <MetricCard
          icon={Brain}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
          title="AI Analyses"
          value={ai.totalAnalyses}
          subtitle={`${ai.activeBots} active bot(s)`}
          onClick={() => onNavigate('intelligence')}
        >
          <div className="flex items-center justify-center">
            <ScoreRing value={ai.complianceAvg} size={48} color={compColor} />
          </div>
          <DetailRow label="Compliance Avg" value={ai.complianceAvg ? `${ai.complianceAvg}%` : 'N/A'} />
          <DetailRow label="Inclusion Avg" value={ai.biasAvg ? `${ai.biasAvg}%` : 'N/A'} />
          <DetailRow label="Research Briefs" value={ai.researchBriefings} />
          <DetailRow label="Oracle Runs" value={ai.oracleRuns} />
        </MetricCard>
      </motion.div>

      {/* Distribution Strip */}
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Excellent</span>
              <span className="font-semibold">{bh.excellent}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Needs Work</span>
              <span className="font-semibold">{bh.needsWork}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Critical</span>
              <span className="font-semibold">{bh.critical}</span>
            </div>
            <div className="flex-1">
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                {bh.total > 0 && (
                  <>
                    <div className="bg-green-500 transition-all" style={{ width: `${(bh.excellent / bh.total) * 100}%` }} />
                    <div className="bg-yellow-500 transition-all" style={{ width: `${(bh.needsWork / bh.total) * 100}%` }} />
                    <div className="bg-red-500 transition-all" style={{ width: `${(bh.critical / bh.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickInsight
          icon={CheckCircle}
          color="text-green-500"
          label="Compliance"
          value={ai.complianceAvg ? `${ai.complianceAvg}%` : 'N/A'}
          status={ai.complianceAvg >= 80 ? 'good' : ai.complianceAvg >= 60 ? 'warn' : 'critical'}
        />
        <QuickInsight
          icon={Shield}
          color="text-blue-500"
          label="Inclusion"
          value={ai.biasAvg ? `${ai.biasAvg}%` : 'N/A'}
          status={ai.biasAvg >= 80 ? 'good' : ai.biasAvg >= 60 ? 'warn' : 'critical'}
        />
        <QuickInsight
          icon={Eye}
          color="text-emerald-500"
          label="Portal Activity"
          value={`${eg.totalPageViews.toLocaleString()} views`}
          status={eg.totalPageViews > 100 ? 'good' : eg.totalPageViews > 10 ? 'warn' : 'critical'}
        />
        <QuickInsight
          icon={Clock}
          color="text-amber-500"
          label="Stale Content"
          value={`${ct.staleCount} entities`}
          status={ct.staleCount === 0 ? 'good' : ct.staleCount <= 3 ? 'warn' : 'critical'}
        />
      </div>
    </div>
  );
}

function QuickInsight({ icon: Icon, color, label, value, status }: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  status: 'good' | 'warn' | 'critical';
}) {
  const statusColors = {
    good: 'border-green-500/20 bg-green-500/5',
    warn: 'border-yellow-500/20 bg-yellow-500/5',
    critical: 'border-red-500/20 bg-red-500/5',
  };
  const dotColors = {
    good: 'bg-green-500',
    warn: 'bg-yellow-500',
    critical: 'bg-red-500',
  };
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', statusColors[status])}>
      <Icon className={cn('h-4 w-4 shrink-0', color)} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
      <div className={cn('w-2 h-2 rounded-full shrink-0', dotColors[status])} />
    </div>
  );
}
