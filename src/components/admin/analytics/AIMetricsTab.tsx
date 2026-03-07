/**
 * AIMetricsTab - AI & Intelligence usage metrics and performance tracking
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Brain, Shield, Scale, Sparkles, Bot, Globe, RefreshCw,
  CheckCircle, AlertTriangle, TrendingUp, Activity, Zap, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AIMetrics {
  intelligence: {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgSuccessRate: number;
    recentJobs: Array<{ id: string; status: string; entity_type: string; created_at: string }>;
  };
  compliance: {
    totalScans: number;
    avgScore: number;
    scoreDistribution: Array<{ range: string; count: number; color: string }>;
    recentScans: Array<{ entity_name: string; score: number | null; created_at: string }>;
  };
  bias: {
    totalScans: number;
    avgInclusion: number;
    avgLanguage: number;
    avgVisual: number;
    avgAccessibility: number;
  };
  research: {
    totalBriefings: number;
    recentBriefings: Array<{ id: string; created_at: string }>;
  };
  oracle: {
    totalRuns: number;
    lastRun: string | null;
  };
  bots: {
    total: number;
    active: number;
    totalConversations: number;
    avgSatisfaction: number;
  };
  localization: {
    totalJobs: number;
    targetLanguages: number;
  };
}

export function AIMetricsTab() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [
        intelligenceRes,
        complianceRes,
        biasRes,
        researchRes,
        oracleRes,
        botConfigRes,
        botConvRes,
        localizationRes,
      ] = await Promise.all([
        supabase.from('brand_intelligence_jobs').select('id, status, entity_type, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('dataforce_compliance_jobs').select('entity_name, compliance_score, created_at, status').order('created_at', { ascending: false }).limit(200),
        supabase.from('bias_awareness_scans').select('inclusion_score, language_score, visual_score, accessibility_score, status').eq('status', 'completed').order('created_at', { ascending: false }).limit(100),
        supabase.from('research_briefings').select('id, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('oracle_intelligence').select('id, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('bot_config').select('id, is_active, bot_type'),
        supabase.from('bot_conversations').select('id, satisfaction_rating').limit(500),
        supabase.from('localization_jobs').select('id, target_language').limit(500),
      ]);

      // Intelligence jobs
      const jobs = intelligenceRes.data || [];
      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;

      // Compliance distribution
      const compJobs = (complianceRes.data || []).filter(j => j.status === 'completed');
      const compScores = compJobs.map(j => j.compliance_score).filter((s): s is number => s != null);
      const compAvg = compScores.length ? Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length) : 0;
      const compDist = [
        { range: '0-39', count: compScores.filter(s => s < 40).length, color: 'hsl(0, 84%, 60%)' },
        { range: '40-59', count: compScores.filter(s => s >= 40 && s < 60).length, color: 'hsl(48, 96%, 53%)' },
        { range: '60-79', count: compScores.filter(s => s >= 60 && s < 80).length, color: 'hsl(84, 81%, 44%)' },
        { range: '80-100', count: compScores.filter(s => s >= 80).length, color: 'hsl(142, 76%, 36%)' },
      ];

      // Bias averages
      const biasData = biasRes.data || [];
      const avgField = (field: 'inclusion_score' | 'language_score' | 'visual_score' | 'accessibility_score') => {
        const vals = biasData.map(b => b[field]).filter((v): v is number => v != null);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      };

      // Bot metrics
      const botConvs = botConvRes.data || [];
      const ratings = botConvs.map(c => c.satisfaction_rating).filter((r): r is number => r != null);
      const avgSat = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

      // Localization
      const locJobs = localizationRes.data || [];
      const uniqueLangs = new Set(locJobs.map(j => j.target_language)).size;

      setMetrics({
        intelligence: {
          totalJobs: jobs.length,
          completedJobs: completed,
          failedJobs: failed,
          avgSuccessRate: jobs.length ? Math.round((completed / jobs.length) * 100) : 0,
          recentJobs: jobs.slice(0, 8),
        },
        compliance: {
          totalScans: compJobs.length,
          avgScore: compAvg,
          scoreDistribution: compDist,
          recentScans: compJobs.slice(0, 6).map(j => ({
            entity_name: j.entity_name,
            score: j.compliance_score,
            created_at: j.created_at,
          })),
        },
        bias: {
          totalScans: biasData.length,
          avgInclusion: avgField('inclusion_score'),
          avgLanguage: avgField('language_score'),
          avgVisual: avgField('visual_score'),
          avgAccessibility: avgField('accessibility_score'),
        },
        research: {
          totalBriefings: researchRes.data?.length || 0,
          recentBriefings: (researchRes.data || []).slice(0, 5),
        },
        oracle: {
          totalRuns: oracleRes.data?.length || 0,
          lastRun: oracleRes.data?.[0]?.created_at || null,
        },
        bots: {
          total: botConfigRes.data?.length || 0,
          active: (botConfigRes.data || []).filter(b => b.is_active).length,
          totalConversations: botConvs.length,
          avgSatisfaction: avgSat,
        },
        localization: {
          totalJobs: locJobs.length,
          targetLanguages: uniqueLangs,
        },
      });
    } catch (err) {
      console.error('AI metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-4 h-24" /></Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const { intelligence: ig, compliance: cp, bias: bi, research: rs, oracle: or, bots: bt, localization: lc } = metrics;

  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={Brain} color="text-purple-500" bg="bg-purple-500/10"
          label="Intelligence Jobs" value={ig.totalJobs}
          sub={`${ig.avgSuccessRate}% success rate`}
        />
        <KPICard icon={Shield} color="text-blue-500" bg="bg-blue-500/10"
          label="Compliance Avg" value={cp.avgScore ? `${cp.avgScore}%` : 'N/A'}
          sub={`${cp.totalScans} scans completed`}
        />
        <KPICard icon={Scale} color="text-teal-500" bg="bg-teal-500/10"
          label="Inclusion Avg" value={bi.avgInclusion ? `${bi.avgInclusion}%` : 'N/A'}
          sub={`${bi.totalScans} bias scans`}
        />
        <KPICard icon={Bot} color="text-amber-500" bg="bg-amber-500/10"
          label="Bot Conversations" value={bt.totalConversations}
          sub={bt.avgSatisfaction ? `${bt.avgSatisfaction}/5 avg rating` : `${bt.active} active bots`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance Score Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Compliance Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cp.totalScans > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cp.scoreDistribution} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Entities">
                    {cp.scoreDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No compliance scans yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bias Dimensions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-teal-500" />
              Bias & Inclusion Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <DimensionBar label="Inclusion" value={bi.avgInclusion} />
              <DimensionBar label="Language" value={bi.avgLanguage} />
              <DimensionBar label="Visual" value={bi.avgVisual} />
              <DimensionBar label="Accessibility" value={bi.avgAccessibility} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Pipeline + Research + Oracle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Intelligence Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Success Rate</span>
                <span className={cn('font-bold', ig.avgSuccessRate >= 80 ? 'text-green-600' : 'text-yellow-600')}>
                  {ig.avgSuccessRate}%
                </span>
              </div>
              <Progress value={ig.avgSuccessRate} className="h-2" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold">{ig.completedJobs}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold text-red-600">{ig.failedJobs}</p>
                  <p className="text-[10px] text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/30">
                  <p className="text-lg font-bold text-yellow-600">{ig.totalJobs - ig.completedJobs - ig.failedJobs}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" />
              Research & Oracle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground">Research Briefings</span>
                <span className="text-sm font-bold">{rs.totalBriefings}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground">Oracle Brain Runs</span>
                <span className="text-sm font-bold">{or.totalRuns}</span>
              </div>
              {or.lastRun && (
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground">Last Oracle Run</span>
                  <span className="text-xs">{format(new Date(or.lastRun), 'MMM d, HH:mm')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-500" />
              Localization & Bots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground">Translation Jobs</span>
                <span className="text-sm font-bold">{lc.totalJobs}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground">Target Languages</span>
                <span className="text-sm font-bold">{lc.targetLanguages}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                <span className="text-xs text-muted-foreground">Active Bots</span>
                <span className="text-sm font-bold">{bt.active}/{bt.total}</span>
              </div>
              {bt.avgSatisfaction > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-xs text-muted-foreground">Bot Satisfaction</span>
                  <span className="text-sm font-bold">{bt.avgSatisfaction}/5 ⭐</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, color, bg, label, value, sub }: {
  icon: React.ElementType; color: string; bg: string; label: string; value: string | number; sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', bg)}>
            <Icon className={cn('h-4 w-4', color)} />
          </div>
          <div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground/70">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium', color)}>{value || 'N/A'}%</span>
      </div>
      <Progress value={value || 0} className="h-1.5" />
    </div>
  );
}
