/**
 * ActivityAnalyticsHub - Comprehensive infographic-style analytics dashboard
 * Combines heatmaps, trend charts, engagement scoring, session analytics, and exports
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity, Download, RefreshCw, Clock, Eye, Users, TrendingUp,
  BarChart3, Calendar, Flame, Target, Zap, FileDown, Filter,
  Monitor, Smartphone, Tablet, Globe, Map
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, getDay, getHours } from 'date-fns';
import { toast } from 'sonner';
import { usePersistedAdminData, formatLastRunMessage } from '@/hooks/usePersistedAdminData';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, ComposedChart, Line,
} from 'recharts';
import { ActivityHeatmap } from './ActivityHeatmap';
import { EngagementScoreCard } from './EngagementScoreCard';

// Types
interface HeatmapPoint { hour: number; day: number; count: number }
interface TrendPoint { date: string; pageViews: number; downloads: number; sessions: number }
interface ActionBreakdown { action: string; count: number; fill: string }
interface EntityBreakdown { entity: string; count: number }
interface SessionMetrics {
  totalSessions: number;
  avgDuration: number;
  bounceRate: number;
  returningRate: number;
  avgPagesPerSession: number;
}
interface EngagementMetrics {
  overallScore: number;
  viewEngagement: number;
  downloadEngagement: number;
  returnVisitorScore: number;
  contentDepthScore: number;
}

interface CachedAnalyticsData {
  heatmapData: HeatmapPoint[];
  trends: TrendPoint[];
  actionBreakdown: ActionBreakdown[];
  entityBreakdown: EntityBreakdown[];
  sessionMetrics: SessionMetrics;
  engagement: EngagementMetrics;
  topPages: { name: string; views: number; avgTime: number }[];
  deviceBreakdown: { device: string; count: number }[];
  browserBreakdown: { browser: string; count: number }[];
  totalEvents: number;
  totalPageViews: number;
  totalDownloads: number;
  uniqueUsers: number;
  dateRange: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'hsl(142, 71%, 45%)',
  update: 'hsl(217, 91%, 60%)',
  delete: 'hsl(0, 84%, 60%)',
  export: 'hsl(262, 83%, 58%)',
  publish: 'hsl(160, 84%, 39%)',
  view: 'hsl(38, 92%, 50%)',
  login: 'hsl(199, 89%, 48%)',
  other: 'hsl(var(--muted-foreground))',
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
];

export function ActivityAnalyticsHub() {
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: cachedData,
    lastRunLabel,
    isExpired,
    saveData,
  } = usePersistedAdminData<CachedAnalyticsData>('activity_analytics_hub', { ttl: 20 * 60 * 1000 });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const days = parseInt(dateRange);
    const startDate = subDays(new Date(), days).toISOString();

    try {
      // Parallel fetch: audit_logs, page_views, user_sessions
      const [auditRes, viewsRes, sessionsRes, trendViewsRes] = await Promise.all([
        supabase
          .from('audit_logs')
          .select('action_type, entity_type, entity_name, created_at, browser, device_type, user_id, user_email, details')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('page_views')
          .select('created_at, entity_type, entity_name, user_id, duration_seconds')
          .gte('created_at', startDate)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('user_sessions')
          .select('started_at, duration_seconds, pages_viewed, user_id')
          .gte('started_at', startDate)
          .limit(1000),
        supabase.rpc('get_page_view_trends', { p_days: days }),
      ]);

      const auditLogs = auditRes.data || [];
      const pageViews = viewsRes.data || [];
      const sessions = sessionsRes.data || [];

      // Build heatmap from page_views + audit_logs
      const heatmapData: HeatmapPoint[] = [];
      const heatmapMap = new Map<string, number>();
      
      [...pageViews, ...auditLogs].forEach((item: any) => {
        const ts = new Date(item.created_at || item.started_at);
        const day = getDay(ts);
        const hour = getHours(ts);
        const key = `${day}-${hour}`;
        heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
      });

      heatmapMap.forEach((count, key) => {
        const [day, hour] = key.split('-').map(Number);
        heatmapData.push({ day, hour, count });
      });

      // Build trends
      const trendMap = new Map<string, { pageViews: number; downloads: number; sessions: number }>();
      
      pageViews.forEach((pv: any) => {
        const day = format(new Date(pv.created_at), 'MMM d');
        const entry = trendMap.get(day) || { pageViews: 0, downloads: 0, sessions: 0 };
        entry.pageViews++;
        trendMap.set(day, entry);
      });

      auditLogs.filter((l: any) => l.action_type === 'export').forEach((l: any) => {
        const day = format(new Date(l.created_at), 'MMM d');
        const entry = trendMap.get(day) || { pageViews: 0, downloads: 0, sessions: 0 };
        entry.downloads++;
        trendMap.set(day, entry);
      });

      sessions.forEach((s: any) => {
        const day = format(new Date(s.started_at), 'MMM d');
        const entry = trendMap.get(day) || { pageViews: 0, downloads: 0, sessions: 0 };
        entry.sessions++;
        trendMap.set(day, entry);
      });

      const trends = Array.from(trendMap.entries())
        .map(([date, vals]) => ({ date, ...vals }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Action breakdown
      const actionMap = new Map<string, number>();
      auditLogs.forEach((l: any) => {
        const action = l.action_type || 'other';
        actionMap.set(action, (actionMap.get(action) || 0) + 1);
      });
      const actionBreakdown: ActionBreakdown[] = Array.from(actionMap.entries())
        .map(([action, count]) => ({ action, count, fill: ACTION_COLORS[action] || ACTION_COLORS.other }))
        .sort((a, b) => b.count - a.count);

      // Entity breakdown
      const entityMap = new Map<string, number>();
      auditLogs.forEach((l: any) => {
        const entity = l.entity_type || 'unknown';
        entityMap.set(entity, (entityMap.get(entity) || 0) + 1);
      });
      const entityBreakdown = Array.from(entityMap.entries())
        .map(([entity, count]) => ({ entity, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Session metrics
      const totalSessions = sessions.length;
      const avgDuration = totalSessions > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / totalSessions
        : 0;
      const avgPages = totalSessions > 0
        ? sessions.reduce((sum: number, s: any) => sum + (s.pages_viewed || 0), 0) / totalSessions
        : 0;
      const singlePageSessions = sessions.filter((s: any) => (s.pages_viewed || 0) <= 1).length;
      const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;
      const uniqueSessionUsers = new Set(sessions.map((s: any) => s.user_id).filter(Boolean));
      const returningRate = uniqueSessionUsers.size > 0
        ? ((sessions.length - uniqueSessionUsers.size) / sessions.length) * 100
        : 0;

      const sessionMetrics: SessionMetrics = {
        totalSessions,
        avgDuration,
        bounceRate,
        returningRate,
        avgPagesPerSession: avgPages,
      };

      // Engagement scoring
      const viewEngagement = Math.min(100, Math.round((pageViews.length / Math.max(1, days)) * 10));
      const downloadEngagement = Math.min(100, Math.round(
        (auditLogs.filter((l: any) => l.action_type === 'export').length / Math.max(1, pageViews.length)) * 200
      ));
      const returnVisitorScore = Math.min(100, Math.round(returningRate));
      const contentDepthScore = Math.min(100, Math.round(avgPages * 25));
      const overallScore = Math.round((viewEngagement + downloadEngagement + returnVisitorScore + contentDepthScore) / 4);

      const engagement: EngagementMetrics = {
        overallScore,
        viewEngagement,
        downloadEngagement,
        returnVisitorScore,
        contentDepthScore,
      };

      // Top pages
      const pageMap = new Map<string, { views: number; totalTime: number }>();
      pageViews.forEach((pv: any) => {
        const name = pv.entity_name || pv.entity_type || 'Unknown';
        const entry = pageMap.get(name) || { views: 0, totalTime: 0 };
        entry.views++;
        entry.totalTime += pv.duration_seconds || 0;
        pageMap.set(name, entry);
      });
      const topPages = Array.from(pageMap.entries())
        .map(([name, { views, totalTime }]) => ({ name, views, avgTime: views > 0 ? totalTime / views : 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Device breakdown
      const deviceMap = new Map<string, number>();
      auditLogs.forEach((l: any) => {
        const d = l.device_type || 'desktop';
        deviceMap.set(d, (deviceMap.get(d) || 0) + 1);
      });
      const deviceBreakdown = Array.from(deviceMap.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);

      // Browser breakdown
      const browserMap = new Map<string, number>();
      auditLogs.forEach((l: any) => {
        if (l.browser) browserMap.set(l.browser, (browserMap.get(l.browser) || 0) + 1);
      });
      const browserBreakdown = Array.from(browserMap.entries())
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count);

      const uniqueUsers = new Set([
        ...auditLogs.map((l: any) => l.user_id),
        ...pageViews.map((p: any) => p.user_id),
      ].filter(Boolean)).size;

      const totalDownloads = auditLogs.filter((l: any) => l.action_type === 'export').length;

      saveData({
        heatmapData,
        trends,
        actionBreakdown,
        entityBreakdown,
        sessionMetrics,
        engagement,
        topPages,
        deviceBreakdown,
        browserBreakdown,
        totalEvents: auditLogs.length,
        totalPageViews: pageViews.length,
        totalDownloads,
        uniqueUsers,
        dateRange,
      });

      toast.success('Analytics refreshed');
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, saveData]);

  useEffect(() => {
    if (!cachedData) fetchData();
  }, []);

  const d = cachedData;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const exportFullReport = () => {
    if (!d) return;
    
    const sections = [
      '=== ACTIVITY ANALYTICS REPORT ===',
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      `Period: Last ${d.dateRange} days`,
      '',
      '--- SUMMARY ---',
      `Total Events: ${d.totalEvents}`,
      `Total Page Views: ${d.totalPageViews}`,
      `Total Downloads: ${d.totalDownloads}`,
      `Unique Users: ${d.uniqueUsers}`,
      `Engagement Score: ${d.engagement.overallScore}/100`,
      '',
      '--- SESSION METRICS ---',
      `Total Sessions: ${d.sessionMetrics.totalSessions}`,
      `Avg Duration: ${formatDuration(d.sessionMetrics.avgDuration)}`,
      `Bounce Rate: ${d.sessionMetrics.bounceRate.toFixed(1)}%`,
      `Return Visitor Rate: ${d.sessionMetrics.returningRate.toFixed(1)}%`,
      `Avg Pages/Session: ${d.sessionMetrics.avgPagesPerSession.toFixed(1)}`,
      '',
      '--- ACTION BREAKDOWN ---',
      ...d.actionBreakdown.map(a => `${a.action}: ${a.count}`),
      '',
      '--- ENTITY BREAKDOWN ---',
      ...d.entityBreakdown.map(e => `${e.entity}: ${e.count}`),
      '',
      '--- TOP PAGES ---',
      'Page,Views,Avg Time',
      ...d.topPages.map(p => `"${p.name}",${p.views},${formatDuration(p.avgTime)}`),
      '',
      '--- DEVICE BREAKDOWN ---',
      ...d.deviceBreakdown.map(d2 => `${d2.device}: ${d2.count}`),
      '',
      '--- BROWSER BREAKDOWN ---',
      ...d.browserBreakdown.map(b => `${b.browser}: ${b.count}`),
      '',
      '--- HEATMAP DATA ---',
      'Day,Hour,Count',
      ...d.heatmapData.map(h => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][h.day]},${h.hour}:00,${h.count}`),
    ];

    const blob = new Blob([sections.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full analytics report exported');
  };

  if (isLoading && !cachedData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {lastRunLabel && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatLastRunMessage(lastRunLabel, isExpired)}
            </span>
          )}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={exportFullReport}>
          <FileDown className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{d?.totalEvents || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{d?.totalPageViews || 0}</p>
                <p className="text-[10px] text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Download className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{d?.totalDownloads || 0}</p>
                <p className="text-[10px] text-muted-foreground">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{d?.uniqueUsers || 0}</p>
                <p className="text-[10px] text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Flame className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{d?.sessionMetrics.bounceRate.toFixed(0) || 0}%</p>
                <p className="text-[10px] text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Combined Trend Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Activity Trends
              </CardTitle>
              <CardDescription className="text-xs">Page views, downloads, and sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {d?.trends && d.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={d.trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="pageViews" name="Page Views" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" />
                    <Bar dataKey="downloads" name="Downloads" fill="hsl(262, 83%, 58%)" radius={[2, 2, 0, 0]} />
                    <Line type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  No trend data available. Click Refresh to load.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini heatmap + Action pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityHeatmap data={d?.heatmapData || []} />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Action Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {d?.actionBreakdown && d.actionBreakdown.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={d.actionBreakdown.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="count"
                        >
                          {d.actionBreakdown.slice(0, 6).map((entry, i) => (
                            <Cell key={entry.action} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1">
                      {d.actionBreakdown.slice(0, 6).map((a, i) => (
                        <div key={a.action} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.fill || CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-muted-foreground capitalize">{a.action}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{a.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-6 mt-4">
          <ActivityHeatmap
            data={d?.heatmapData || []}
            title="Page View & Activity Heatmap"
            description="Combined page views and audit events by hour of day and day of week"
          />

          {/* Top Pages Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Viewed Pages</CardTitle>
              <CardDescription className="text-xs">Top content by view count with average time on page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(d?.topPages || []).map((page, i) => {
                  const maxViews = d?.topPages[0]?.views || 1;
                  const widthPct = (page.views / maxViews) * 100;
                  return (
                    <div key={page.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium truncate">{page.name}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground">{formatDuration(page.avgTime)}</span>
                            <Badge variant="secondary" className="text-xs">{page.views}</Badge>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!d?.topPages || d.topPages.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No page view data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{d?.sessionMetrics.totalSessions || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{formatDuration(d?.sessionMetrics.avgDuration || 0)}</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{(d?.sessionMetrics.avgPagesPerSession || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Pages/Session</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{(d?.sessionMetrics.bounceRate || 0).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold text-green-500">{(d?.sessionMetrics.returningRate || 0).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Return Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Session trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sessions Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {d?.trends && d.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={d.trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No session data</div>
              )}
            </CardContent>
          </Card>

          {/* Device & Browser split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d?.deviceBreakdown && d.deviceBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {d.deviceBreakdown.map(dev => {
                      const total = d.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                      const pct = total > 0 ? (dev.count / total) * 100 : 0;
                      return (
                        <div key={dev.device} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="capitalize flex items-center gap-1.5 text-muted-foreground">
                              {dev.device === 'mobile' ? <Smartphone className="h-3 w-3" /> :
                               dev.device === 'tablet' ? <Tablet className="h-3 w-3" /> :
                               <Monitor className="h-3 w-3" />}
                              {dev.device}
                            </span>
                            <span className="font-medium">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No device data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Browser Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d?.browserBreakdown && d.browserBreakdown.length > 0 ? (
                  <div className="space-y-2">
                    {d.browserBreakdown.map(br => {
                      const total = d.browserBreakdown.reduce((s, x) => s + x.count, 0);
                      const pct = total > 0 ? (br.count / total) * 100 : 0;
                      return (
                        <div key={br.browser} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{br.browser}</span>
                            <span className="font-medium">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No browser data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <EngagementScoreCard score={d?.engagement.overallScore || 0} label="Overall" subtitle="Engagement Score" />
            <EngagementScoreCard score={d?.engagement.viewEngagement || 0} label="Views" subtitle="View depth" size="sm" />
            <EngagementScoreCard score={d?.engagement.downloadEngagement || 0} label="Downloads" subtitle="Export activity" size="sm" />
            <EngagementScoreCard score={d?.engagement.returnVisitorScore || 0} label="Retention" subtitle="Return visitors" size="sm" />
            <EngagementScoreCard score={d?.engagement.contentDepthScore || 0} label="Depth" subtitle="Pages per session" size="sm" />
          </div>

          {/* Entity engagement chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Entity Engagement</CardTitle>
              <CardDescription className="text-xs">Activity distribution across entity types</CardDescription>
            </CardHeader>
            <CardContent>
              {d?.entityBreakdown && d.entityBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={d.entityBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="entity" className="text-xs capitalize" width={80} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" name="Events" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No entity data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {d?.actionBreakdown && d.actionBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={d.actionBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="action" className="text-xs capitalize" />
                      <YAxis className="text-xs" />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                        {d.actionBreakdown.map((entry, i) => (
                          <Cell key={entry.action} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>

            {/* Entity Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Events by Entity</CardTitle>
              </CardHeader>
              <CardContent>
                {d?.entityBreakdown && d.entityBreakdown.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={280}>
                      <PieChart>
                        <Pie
                          data={d.entityBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={50}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="entity"
                        >
                          {d.entityBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1">
                      {d.entityBreakdown.map((e, i) => (
                        <div key={e.entity} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-muted-foreground capitalize">{e.entity}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">{e.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
