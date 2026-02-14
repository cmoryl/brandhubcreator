/**
 * AdminReportingWidgets - Reporting charts and KPIs for Admin Overview
 * Includes: Weekly Activity Chart, Content Health Summary, Growth KPIs
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, PieChart, Target,
  Palette, Package, Calendar, Users, Eye, FileText, ArrowUpRight,
  Activity, CheckCircle2, AlertCircle, XCircle, HardDrive, Clock,
  CheckCircle, AlertTriangle, Search, Image as ImageIcon, ExternalLink,
  ArrowRight, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DashboardStats } from '@/lib/admin/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RechartsPie, Pie, Cell
} from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

// ─── Types ──────────────────────────────────────────────────
interface ReportingWidgetsProps {
  stats: DashboardStats | null;
  onTabChange: (tab: string) => void;
}

interface WeeklyData {
  day: string;
  brands: number;
  products: number;
  events: number;
}

interface GrowthKPI {
  label: string;
  current: number;
  previous: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  suffix?: string;
}

// ─── Weekly Activity Chart ──────────────────────────────────
const WeeklyActivityChart: React.FC = () => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const days: WeeklyData[] = [];
        const queries = [];

        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dayLabel = format(date, 'EEE');
          const start = startOfDay(date).toISOString();
          const end = endOfDay(date).toISOString();

          queries.push(
            Promise.all([
              supabase.from('brands').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
              supabase.from('products').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
              supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
            ]).then(([b, p, e]) => ({
              day: dayLabel,
              brands: b.count || 0,
              products: p.count || 0,
              events: e.count || 0,
            }))
          );
        }

        const results = await Promise.all(queries);
        setWeeklyData(results);
      } catch (err) {
        console.error('Weekly activity fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totalThisWeek = weeklyData.reduce((a, d) => a + d.brands + d.products + d.events, 0);

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <CardTitle className="text-sm font-semibold">Weekly Content Activity</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">
            {totalThisWeek} items this week
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[180px]">
            <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={24} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
              <Bar dataKey="brands" name="Brands" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="products" name="Products" fill="hsl(217 91% 60%)" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="events" name="Events" fill="hsl(142 76% 36%)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { name: 'Brands', color: 'bg-primary' },
            { name: 'Products', color: 'bg-blue-500' },
            { name: 'Events', color: 'bg-emerald-500' },
          ].map(l => (
            <div key={l.name} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-sm", l.color)} />
              <span className="text-[10px] text-muted-foreground">{l.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Content Health Summary ─────────────────────────────────
const ContentHealthSummary: React.FC<{ stats: DashboardStats | null; onTabChange: (tab: string) => void }> = ({ stats, onTabChange }) => {
  const [healthData, setHealthData] = useState<{ published: number; draft: number; total: number; complianceAvg: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: totalBrands }, { count: publicBrands }, { data: compliance }] = await Promise.all([
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('is_public', true),
        supabase.from('dataforce_compliance_jobs').select('compliance_score').eq('status', 'completed').order('created_at', { ascending: false }).limit(50),
      ]);
      const pub = publicBrands || 0;
      const tot = totalBrands || 0;
      const scores = (compliance || []).map(c => c.compliance_score || 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      setHealthData({ published: pub, draft: tot - pub, total: tot, complianceAvg: avg });
    })();
  }, []);

  const publishRate = healthData ? Math.round((healthData.published / Math.max(healthData.total, 1)) * 100) : 0;

  const pieData = healthData ? [
    { name: 'Published', value: healthData.published, color: 'hsl(142 76% 36%)' },
    { name: 'Draft', value: healthData.draft, color: 'hsl(var(--muted))' },
  ] : [];

  const healthItems = [
    {
      label: 'Publish Rate',
      value: publishRate,
      status: publishRate >= 70 ? 'good' : publishRate >= 40 ? 'warning' : 'poor',
      icon: Eye,
    },
    {
      label: 'Compliance Avg',
      value: Math.round(healthData?.complianceAvg || 0),
      status: (healthData?.complianceAvg || 0) >= 80 ? 'good' : (healthData?.complianceAvg || 0) >= 60 ? 'warning' : 'poor',
      icon: CheckCircle2,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5 text-emerald-500" />
            <CardTitle className="text-sm font-semibold">Content Health</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!healthData ? (
          <div className="flex items-center justify-center h-[180px]">
            <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={100} height={100}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={45}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-3 mt-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[9px] text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Metrics */}
            <div className="flex-1 space-y-3">
              {healthItems.map(item => {
                const StatusIcon = item.status === 'good' ? CheckCircle2 : item.status === 'warning' ? AlertCircle : XCircle;
                const statusColor = item.status === 'good' ? 'text-emerald-500' : item.status === 'warning' ? 'text-amber-500' : 'text-destructive';
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <item.icon className="h-3 w-3" />
                        {item.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={cn("h-3 w-3", statusColor)} />
                        <span className="text-xs font-bold tabular-nums">{item.value}%</span>
                      </div>
                    </div>
                    <Progress value={item.value} className="h-1.5" />
                  </div>
                );
              })}

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
                {[
                  { label: 'Brands', value: stats?.totalBrands || 0, icon: Palette },
                  { label: 'Products', value: stats?.totalProducts || 0, icon: Package },
                  { label: 'Events', value: stats?.totalEvents || 0, icon: Calendar },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <s.icon className="h-3 w-3 text-muted-foreground mx-auto mb-0.5" />
                    <span className="text-sm font-bold tabular-nums block">{s.value}</span>
                    <span className="text-[9px] text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Growth KPIs ────────────────────────────────────────────
const GrowthKPIPanel: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => {
  const [prevWeek, setPrevWeek] = useState<{ users: number; brands: number; products: number; events: number } | null>(null);

  useEffect(() => {
    (async () => {
      const weekAgo = subDays(new Date(), 14).toISOString();
      const weekEnd = subDays(new Date(), 7).toISOString();

      const [{ count: users }, { count: brands }, { count: products }, { count: events }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).lte('created_at', weekEnd),
        supabase.from('brands').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).lte('created_at', weekEnd),
        supabase.from('products').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).lte('created_at', weekEnd),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo).lte('created_at', weekEnd),
      ]);

      setPrevWeek({
        users: users || 0,
        brands: brands || 0,
        products: products || 0,
        events: events || 0,
      });
    })();
  }, []);

  const kpis: GrowthKPI[] = [
    { label: 'New Users (week)', current: stats?.newUsersThisWeek || 0, previous: prevWeek?.users || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Brands Created', current: stats?.totalBrands || 0, previous: prevWeek?.brands || 0, icon: Palette, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Products Added', current: stats?.totalProducts || 0, previous: prevWeek?.products || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Events Launched', current: stats?.totalEvents || 0, previous: prevWeek?.events || 0, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <Card>
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-amber-500" />
          <CardTitle className="text-sm font-semibold">Growth KPIs</CardTitle>
          <Badge variant="outline" className="text-[10px] h-5 ml-auto">Week over Week</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.map(kpi => {
            const diff = kpi.current - kpi.previous;
            const pct = kpi.previous > 0 ? Math.round((diff / kpi.previous) * 100) : diff > 0 ? 100 : 0;
            const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
            const trendColor = diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';

            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", kpi.bg)}>
                    <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  </div>
                </div>
                <span className="text-xl font-bold tabular-nums block">{kpi.current}</span>
                <span className="text-[10px] text-muted-foreground block mb-1.5">{kpi.label}</span>
                <div className={cn("flex items-center gap-1 text-[10px] font-medium", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{diff >= 0 ? '+' : ''}{diff}</span>
                  {pct !== 0 && <span className="text-muted-foreground">({pct}%)</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Backup Status Widget ───────────────────────────────────
const BackupStatusWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{ total: number; completed: number; failed: number; lastBackup: string | null; totalSize: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: jobs } = await supabase
        .from('backup_jobs')
        .select('status, completed_at, file_size_bytes')
        .order('created_at', { ascending: false })
        .limit(50);

      const allJobs = jobs || [];
      const completed = allJobs.filter(j => j.status === 'completed');
      const failed = allJobs.filter(j => j.status === 'failed');
      const lastCompleted = completed.find(j => j.completed_at);
      const totalSize = completed.reduce((a, j) => a + (j.file_size_bytes || 0), 0);

      setData({
        total: allJobs.length,
        completed: completed.length,
        failed: failed.length,
        lastBackup: lastCompleted?.completed_at || null,
        totalSize,
      });
    })();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-3.5 w-3.5 text-sky-500" />
            <CardTitle className="text-sm font-semibold">Backup Status</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7" onClick={() => onTabChange('backups')}>
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!data ? (
          <div className="flex items-center justify-center h-[120px]">
            <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status badges row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: data.total, icon: HardDrive, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                { label: 'Completed', value: data.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Failed', value: data.failed, icon: AlertTriangle, color: data.failed > 0 ? 'text-destructive' : 'text-muted-foreground', bg: data.failed > 0 ? 'bg-destructive/10' : 'bg-muted/60' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg border border-border/50">
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", item.bg)}>
                    <item.icon className={cn("h-3 w-3", item.color)} />
                  </div>
                  <div>
                    <span className="text-sm font-bold tabular-nums block leading-none">{item.value}</span>
                    <span className="text-[9px] text-muted-foreground">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Last backup + size */}
            <div className="flex items-center justify-between px-2 py-2 rounded-md bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Last backup</span>
              </div>
              <span className="text-[11px] font-medium">
                {data.lastBackup ? format(new Date(data.lastBackup), 'MMM d, h:mm a') : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-2 rounded-md bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Total size</span>
              </div>
              <span className="text-[11px] font-medium">{formatBytes(data.totalSize)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Logo Hub Search Widget ─────────────────────────────────
const LogoHubSearchWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [logos, setLogos] = useState<Array<{ id: string; name: string; category: string; files: any }>>([]);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, count } = await supabase
          .from('global_client_logos')
          .select('id, name, category, files', { count: 'exact' })
          .order('name')
          .limit(100);
        setLogos(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error('Logo fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return logos.slice(0, 8);
    const q = search.toLowerCase();
    return logos.filter(l => l.name.toLowerCase().includes(q) || l.category.toLowerCase().includes(q)).slice(0, 8);
  }, [logos, search]);

  const categories = useMemo(() => {
    const cats: Record<string, number> = {};
    logos.forEach(l => { cats[l.category] = (cats[l.category] || 0) + 1; });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logos]);

  const getFileCount = (files: any) => {
    if (!files || typeof files !== 'object') return 0;
    return Object.values(files).filter(Boolean).length;
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-violet-500" />
            <CardTitle className="text-sm font-semibold">Logo Hub</CardTitle>
            <Badge variant="outline" className="text-[10px] h-5">{totalCount} logos</Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground h-7" onClick={() => onTabChange('logo-hub')}>
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-[120px]">
            <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search logos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(([cat, count]) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="text-[9px] h-5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setSearch(cat)}
                >
                  {cat} ({count})
                </Badge>
              ))}
            </div>

            {/* Logo List */}
            <ScrollArea className="h-[140px]">
              <div className="space-y-1">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/20 mb-2" />
                    <p className="text-[11px] text-muted-foreground">
                      {search ? 'No logos match your search' : 'No logos in library'}
                    </p>
                  </div>
                ) : (
                  filtered.map(logo => (
                    <motion.div
                      key={logo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/40 transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0 border border-border/50">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium block truncate">{logo.name}</span>
                        <span className="text-[10px] text-muted-foreground">{logo.category} · {getFileCount(logo.files)} variants</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Export ─────────────────────────────────────────────
export const AdminReportingWidgets: React.FC<ReportingWidgetsProps> = ({ stats, onTabChange }) => {
  return (
    <motion.div variants={fadeUp} className="space-y-4">
      {/* Growth KPIs */}
      <GrowthKPIPanel stats={stats} />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <WeeklyActivityChart />
        <ContentHealthSummary stats={stats} onTabChange={onTabChange} />
      </div>

      {/* Backup & Logo Hub Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <BackupStatusWidget onTabChange={onTabChange} />
        <LogoHubSearchWidget onTabChange={onTabChange} />
      </div>
    </motion.div>
  );
};

export default AdminReportingWidgets;
