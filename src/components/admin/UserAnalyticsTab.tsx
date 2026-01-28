/**
 * UserAnalyticsTab Component
 * Comprehensive user analytics dashboard for admins
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, Eye, Clock, TrendingUp, Activity, BarChart3,
  Download, RefreshCw, Filter, Calendar, ArrowUpRight,
  Smartphone, Monitor, Tablet, Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  totalPageViews: number;
  mostViewedType: string | null;
  mostViewedName: string | null;
}

interface ViewTrend {
  date: string;
  views: number;
  uniqueUsers: number;
}

interface TopContent {
  entityType: string;
  entityId: string;
  entityName: string;
  viewCount: number;
  uniqueViewers: number;
  avgDuration: number;
}

interface UserActivity {
  userId: string;
  userEmail: string;
  pageViews: number;
  sessions: number;
  totalTimeSeconds: number;
  lastActive: string | null;
  mostViewedType: string | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

export function UserAnalyticsTab() {
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [viewTrends, setViewTrends] = useState<ViewTrend[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    const days = parseInt(dateRange);

    try {
      // Fetch user stats using RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_admin_user_stats', { p_days: days });

      if (statsError) throw statsError;

      if (statsData && statsData.length > 0) {
        const s = statsData[0];
        setStats({
          totalUsers: Number(s.total_users) || 0,
          activeUsers: Number(s.active_users) || 0,
          newUsers: Number(s.new_users) || 0,
          totalSessions: Number(s.total_sessions) || 0,
          avgSessionDuration: Number(s.avg_session_duration) || 0,
          totalPageViews: Number(s.total_page_views) || 0,
          mostViewedType: s.most_viewed_entity_type,
          mostViewedName: s.most_viewed_entity_name,
        });
      }

      // Fetch view trends
      const { data: trendsData, error: trendsError } = await supabase
        .rpc('get_page_view_trends', { p_days: days });

      if (!trendsError && trendsData) {
        setViewTrends(trendsData.map((t: { view_date: string; view_count: number; unique_users: number }) => ({
          date: format(new Date(t.view_date), 'MMM d'),
          views: Number(t.view_count),
          uniqueUsers: Number(t.unique_users),
        })));
      }

      // Fetch top content
      const { data: contentData, error: contentError } = await supabase
        .rpc('get_top_viewed_content', { p_days: days, p_limit: 10 });

      if (!contentError && contentData) {
        setTopContent(contentData.map((c: { entity_type: string; entity_id: string; entity_name: string; view_count: number; unique_viewers: number; avg_duration: number }) => ({
          entityType: c.entity_type,
          entityId: c.entity_id,
          entityName: c.entity_name,
          viewCount: Number(c.view_count),
          uniqueViewers: Number(c.unique_viewers),
          avgDuration: Number(c.avg_duration),
        })));
      }

      // Fetch user activity breakdown
      const { data: activityData, error: activityError } = await supabase
        .rpc('get_user_activity_breakdown', { p_days: days });

      if (!activityError && activityData) {
        setUserActivity(activityData.map((a: { user_id: string; user_email: string; page_views: number; sessions: number; total_time_seconds: number; last_active: string | null; most_viewed_type: string | null }) => ({
          userId: a.user_id,
          userEmail: a.user_email || 'Unknown',
          pageViews: Number(a.page_views),
          sessions: Number(a.sessions),
          totalTimeSeconds: Number(a.total_time_seconds),
          lastActive: a.last_active,
          mostViewedType: a.most_viewed_type,
        })));
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const exportToCSV = () => {
    if (!userActivity.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['User Email', 'Page Views', 'Sessions', 'Total Time', 'Last Active', 'Most Viewed Type'];
    const rows = userActivity.map(u => [
      u.userEmail,
      u.pageViews.toString(),
      u.sessions.toString(),
      formatDuration(u.totalTimeSeconds),
      u.lastActive ? format(new Date(u.lastActive), 'yyyy-MM-dd HH:mm') : 'Never',
      u.mostViewedType || 'N/A',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  // Prepare data for pie chart
  const contentTypeData = topContent.reduce((acc, item) => {
    const existing = acc.find(a => a.name === item.entityType);
    if (existing) {
      existing.value += item.viewCount;
    } else {
      acc.push({ name: item.entityType, value: item.viewCount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Users
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" />
              Active Users
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              New Users
            </div>
            <p className="text-2xl font-bold mt-1 text-green-500">{stats?.newUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Eye className="h-4 w-4" />
              Page Views
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalPageViews || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Globe className="h-4 w-4" />
              Sessions
            </div>
            <p className="text-2xl font-bold mt-1">{stats?.totalSessions || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Avg Duration
            </div>
            <p className="text-2xl font-bold mt-1">{formatDuration(stats?.avgSessionDuration || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-tabs for detailed analytics */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="content">Content Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* View Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Page View Trends
              </CardTitle>
              <CardDescription>Daily page views and unique users over time</CardDescription>
            </CardHeader>
            <CardContent>
              {viewTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={viewTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name="Page Views"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uniqueUsers"
                      name="Unique Users"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent) / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No view data available for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Type Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>Views by content type</CardDescription>
              </CardHeader>
              <CardContent>
                {contentTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {contentTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No content data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Popular Content */}
            <Card>
              <CardHeader>
                <CardTitle>Most Viewed Content</CardTitle>
                <CardDescription>Top 5 most viewed items</CardDescription>
              </CardHeader>
              <CardContent>
                {topContent.length > 0 ? (
                  <div className="space-y-3">
                    {topContent.slice(0, 5).map((item, index) => (
                      <div key={item.entityId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{item.entityName}</p>
                            <Badge variant="outline" className="text-xs">{item.entityType}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.viewCount} views</p>
                          <p className="text-xs text-muted-foreground">{item.uniqueViewers} users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No content views recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-4">
          {/* User Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Activity Report
              </CardTitle>
              <CardDescription>Detailed activity breakdown per user</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-center">Page Views</TableHead>
                      <TableHead className="text-center">Sessions</TableHead>
                      <TableHead className="text-center">Total Time</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Most Viewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActivity.length > 0 ? (
                      userActivity.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div className="font-medium">{user.userEmail}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{user.pageViews}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{user.sessions}</TableCell>
                          <TableCell className="text-center">{formatDuration(user.totalTimeSeconds)}</TableCell>
                          <TableCell>
                            {user.lastActive ? (
                              <span className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.mostViewedType ? (
                              <Badge variant="outline">{user.mostViewedType}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No user activity data available for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 mt-4">
          {/* Content Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Content Performance Report
              </CardTitle>
              <CardDescription>Detailed views and engagement per content item</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-center">Unique Viewers</TableHead>
                      <TableHead className="text-center">Avg. Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topContent.length > 0 ? (
                      topContent.map((item) => (
                        <TableRow key={item.entityId}>
                          <TableCell>
                            <div className="font-medium">{item.entityName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                item.entityType === 'brand' ? 'border-primary text-primary' :
                                item.entityType === 'product' ? 'border-accent text-accent' :
                                'border-secondary text-secondary'
                              }
                            >
                              {item.entityType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold">{item.viewCount}</span>
                          </TableCell>
                          <TableCell className="text-center">{item.uniqueViewers}</TableCell>
                          <TableCell className="text-center">{formatDuration(item.avgDuration)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No content analytics available for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Content Views Bar Chart */}
          {topContent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Content Views Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topContent.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="entityName" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="viewCount" name="Views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
