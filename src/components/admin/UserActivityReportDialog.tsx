/**
 * UserActivityReportDialog
 * In-depth per-user activity report with filtering, charts, and export options.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Eye, Clock, Activity, Download, RefreshCw, Search,
  Monitor, Smartphone, Tablet, FileText, Calendar,
  TrendingUp, BarChart3, User, Filter, Globe,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
];

// ── Types ────────────────────────────────────────────────
interface PageViewRecord {
  id: string;
  page_path: string;
  entity_type: string;
  entity_name: string | null;
  entity_id: string | null;
  device_type: string | null;
  duration_seconds: number | null;
  referrer: string | null;
  created_at: string;
}

interface SessionRecord {
  id: string;
  session_id: string;
  browser: string | null;
  device_type: string | null;
  duration_seconds: number | null;
  page_count: number | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean | null;
}

interface AuditRecord {
  id: string | null;
  action_type: string | null;
  entity_type: string | null;
  entity_name: string | null;
  outcome: string | null;
  created_at: string | null;
  details: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

// ── Helpers ──────────────────────────────────────────────
const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
};

const deviceIcon = (type: string | null) => {
  if (!type) return <Globe className="h-3.5 w-3.5" />;
  const t = type.toLowerCase();
  if (t.includes('mobile') || t.includes('phone')) return <Smartphone className="h-3.5 w-3.5" />;
  if (t.includes('tablet')) return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

// ── Component ────────────────────────────────────────────
export function UserActivityReportDialog({ open, onOpenChange, userId, userEmail }: Props) {
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');

  const [pageViews, setPageViews] = useState<PageViewRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const days = parseInt(dateRange);
      const since = subDays(new Date(), days).toISOString();

      const [pvRes, sessRes, auditRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('id, page_path, entity_type, entity_name, entity_id, device_type, duration_seconds, referrer, created_at')
          .eq('user_id', userId)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('user_sessions')
          .select('id, session_id, browser, device_type, duration_seconds, page_count, started_at, ended_at, is_active')
          .eq('user_id', userId)
          .gte('started_at', since)
          .order('started_at', { ascending: false })
          .limit(200),
        supabase
          .from('audit_logs_safe')
          .select('id, action_type, entity_type, entity_name, outcome, created_at, details')
          .eq('user_id', userId)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      setPageViews((pvRes.data as PageViewRecord[]) || []);
      setSessions((sessRes.data as SessionRecord[]) || []);
      setAuditLogs((auditRes.data as AuditRecord[]) || []);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
      toast.error('Failed to load user activity');
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRange]);

  useEffect(() => {
    if (open && userId) fetchData();
  }, [open, userId, fetchData]);

  // ── Computed Analytics ──────────────────────────────────
  const stats = useMemo(() => {
    const totalViews = pageViews.length;
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((a, s) => a + (s.duration_seconds || 0), 0);
    const avgSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0;
    const totalAuditActions = auditLogs.length;
    const activeSessions = sessions.filter(s => s.is_active).length;
    return { totalViews, totalSessions, totalTime, avgSessionTime, totalAuditActions, activeSessions };
  }, [pageViews, sessions, auditLogs]);

  // Daily activity trend
  const dailyTrend = useMemo(() => {
    const map = new Map<string, { views: number; sessions: number }>();
    pageViews.forEach(pv => {
      const day = format(new Date(pv.created_at), 'MMM d');
      const existing = map.get(day) || { views: 0, sessions: 0 };
      existing.views++;
      map.set(day, existing);
    });
    sessions.forEach(s => {
      const day = format(new Date(s.started_at), 'MMM d');
      const existing = map.get(day) || { views: 0, sessions: 0 };
      existing.sessions++;
      map.set(day, existing);
    });
    return Array.from(map.entries())
      .map(([date, data]) => ({ date, ...data }))
      .reverse();
  }, [pageViews, sessions]);

  // Content breakdown by entity type
  const contentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    pageViews.forEach(pv => {
      const type = pv.entity_type || 'other';
      map.set(type, (map.get(type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [pageViews]);

  // Device breakdown
  const deviceBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      const dt = s.device_type || 'Unknown';
      map.set(dt, (map.get(dt) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  // Browser breakdown
  const browserBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      const b = s.browser || 'Unknown';
      map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sessions]);

  // Top viewed content
  const topContent = useMemo(() => {
    const map = new Map<string, { name: string; type: string; count: number; totalDuration: number }>();
    pageViews.forEach(pv => {
      const key = pv.entity_id || pv.page_path;
      const existing = map.get(key) || { name: pv.entity_name || pv.page_path, type: pv.entity_type, count: 0, totalDuration: 0 };
      existing.count++;
      existing.totalDuration += pv.duration_seconds || 0;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [pageViews]);

  // Filtered page views
  const filteredPageViews = useMemo(() => {
    let filtered = pageViews;
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(pv => pv.entity_type === entityTypeFilter);
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(pv =>
        (pv.entity_name || '').toLowerCase().includes(q) ||
        pv.page_path.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [pageViews, entityTypeFilter, searchFilter]);

  // Entity type options for filter
  const entityTypes = useMemo(() => {
    const types = new Set(pageViews.map(pv => pv.entity_type));
    return Array.from(types).sort();
  }, [pageViews]);

  // ── Export ─────────────────────────────────────────────
  const exportCSV = (dataType: 'views' | 'sessions' | 'audit' | 'all') => {
    let csv = '';
    if (dataType === 'views' || dataType === 'all') {
      csv += 'Page Views\nDate,Path,Entity Type,Entity Name,Device,Duration (s)\n';
      filteredPageViews.forEach(pv => {
        csv += `${format(new Date(pv.created_at), 'yyyy-MM-dd HH:mm')},${pv.page_path},${pv.entity_type},${pv.entity_name || ''},${pv.device_type || ''},${pv.duration_seconds || ''}\n`;
      });
      csv += '\n';
    }
    if (dataType === 'sessions' || dataType === 'all') {
      csv += 'Sessions\nStarted,Browser,Device,Duration (s),Pages,Active\n';
      sessions.forEach(s => {
        csv += `${format(new Date(s.started_at), 'yyyy-MM-dd HH:mm')},${s.browser || ''},${s.device_type || ''},${s.duration_seconds || ''},${s.page_count || ''},${s.is_active ? 'Yes' : 'No'}\n`;
      });
      csv += '\n';
    }
    if (dataType === 'audit' || dataType === 'all') {
      csv += 'Audit Trail\nDate,Action,Entity Type,Entity Name,Outcome\n';
      auditLogs.forEach(a => {
        csv += `${a.created_at ? format(new Date(a.created_at), 'yyyy-MM-dd HH:mm') : ''},${a.action_type || ''},${a.entity_type || ''},${a.entity_name || ''},${a.outcome || ''}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${userEmail.split('@')[0]}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Activity Report
              </DialogTitle>
              <DialogDescription className="mt-1">
                {userEmail}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
              <Select defaultValue="all" onValueChange={(v) => exportCSV(v as any)}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Export All</SelectItem>
                  <SelectItem value="views">Page Views</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="audit">Audit Trail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'Page Views', value: stats.totalViews, icon: Eye, color: 'text-primary' },
              { label: 'Sessions', value: stats.totalSessions, icon: Activity, color: 'text-emerald-500' },
              { label: 'Total Time', value: formatDuration(stats.totalTime), icon: Clock, color: 'text-amber-500' },
              { label: 'Avg Session', value: formatDuration(stats.avgSessionTime), icon: TrendingUp, color: 'text-sky-500' },
              { label: 'Actions', value: stats.totalAuditActions, icon: FileText, color: 'text-purple-500' },
              { label: 'Active Now', value: stats.activeSessions, icon: Activity, color: 'text-emerald-500' },
            ].map(kpi => (
              <Card key={kpi.label} className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                  <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                </div>
                <span className="text-lg font-bold">{kpi.value}</span>
              </Card>
            ))}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="views" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Page Views</TabsTrigger>
              <TabsTrigger value="sessions" className="gap-1.5"><Monitor className="h-3.5 w-3.5" />Sessions</TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Audit Trail</TabsTrigger>
            </TabsList>

            {/* ── Overview ──────────────────────── */}
            <TabsContent value="overview" className="space-y-4">
              {/* Activity Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Daily Activity Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Area type="monotone" dataKey="views" name="Views" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                        <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No activity data</div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Content Breakdown Pie */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Content Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contentBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={contentBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2}>
                            {contentBreakdown.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No data</div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {contentBreakdown.slice(0, 5).map((item, i) => (
                        <Badge key={item.name} variant="outline" className="text-[10px]">
                          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {item.name}: {item.value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {deviceBreakdown.map(d => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {deviceIcon(d.name)}
                            <span className="text-sm">{d.name}</span>
                          </div>
                          <Badge variant="secondary">{d.value}</Badge>
                        </div>
                      ))}
                      {deviceBreakdown.length === 0 && (
                        <span className="text-muted-foreground text-sm">No session data</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Browser Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Browsers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {browserBreakdown.slice(0, 6).map(b => (
                        <div key={b.name} className="flex items-center justify-between">
                          <span className="text-sm truncate">{b.name}</span>
                          <Badge variant="secondary">{b.value}</Badge>
                        </div>
                      ))}
                      {browserBreakdown.length === 0 && (
                        <span className="text-muted-foreground text-sm">No session data</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Viewed Content */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Most Viewed Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {topContent.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.min(topContent.length * 32 + 20, 300)}>
                      <BarChart data={topContent.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">No content viewed</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Page Views ───────────────────── */}
            <TabsContent value="views" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search pages or content..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {entityTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-[10px]">{filteredPageViews.length} results</Badge>
              </div>

              <Card>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page / Content</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPageViews.length > 0 ? (
                        filteredPageViews.map(pv => (
                          <TableRow key={pv.id}>
                            <TableCell>
                              <div className="font-medium text-xs truncate max-w-[220px]">
                                {pv.entity_name || pv.page_path}
                              </div>
                              {pv.entity_name && (
                                <div className="text-[10px] text-muted-foreground truncate max-w-[220px]">{pv.page_path}</div>
                              )}
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{pv.entity_type}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {deviceIcon(pv.device_type)}
                                <span className="text-[10px] text-muted-foreground">{pv.device_type || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{formatDuration(pv.duration_seconds)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(pv.created_at), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No page views found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* ── Sessions ─────────────────────── */}
            <TabsContent value="sessions" className="space-y-4">
              <Card>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Started</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Pages</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.length > 0 ? (
                        sessions.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="text-xs">
                              {format(new Date(s.started_at), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell className="text-xs">{s.browser || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {deviceIcon(s.device_type)}
                                <span className="text-[10px]">{s.device_type || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{formatDuration(s.duration_seconds)}</TableCell>
                            <TableCell className="text-xs">{s.page_count ?? '—'}</TableCell>
                            <TableCell>
                              <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                {s.is_active ? 'Active' : 'Ended'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sessions found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>

            {/* ── Audit Trail ──────────────────── */}
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length > 0 ? (
                        auditLogs.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{a.action_type || '—'}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{a.entity_type || '—'}</TableCell>
                            <TableCell className="text-xs truncate max-w-[150px]">{a.entity_name || '—'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={a.outcome === 'success' ? 'default' : a.outcome === 'failure' ? 'destructive' : 'secondary'}
                                className="text-[10px]"
                              >
                                {a.outcome || '—'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit logs found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
