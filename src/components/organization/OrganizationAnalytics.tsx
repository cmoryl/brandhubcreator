/**
 * OrganizationAnalytics Component
 * Displays analytics dashboard with brand views, user activity, and usage trends
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Users, 
  FileText, 
  Package, 
  Calendar,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';

interface ActivityData {
  date: string;
  views: number;
  edits: number;
  exports: number;
}

interface EntityCount {
  brands: number;
  products: number;
  events: number;
  members: number;
}

interface RecentActivity {
  id: string;
  actionType: string;
  entityType: string;
  entityName: string;
  createdAt: string;
  userEmail?: string;
}

interface ContentDistribution {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted-foreground))',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899'];

export const OrganizationAnalytics = () => {
  const { organization, members } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [entityCounts, setEntityCounts] = useState<EntityCount>({ brands: 0, products: 0, events: 0, members: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [contentDistribution, setContentDistribution] = useState<ContentDistribution[]>([]);
  const [growthData, setGrowthData] = useState<{ date: string; total: number }[]>([]);
  const [publicVsPrivate, setPublicVsPrivate] = useState({ public: 0, private: 0 });

  useEffect(() => {
    if (organization?.id) {
      fetchAnalytics();
    }
  }, [organization?.id, dateRange]);

  const fetchAnalytics = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);

      // Fetch entity counts
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, is_public, created_at', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('products').select('id, is_public, created_at', { count: 'exact' }).eq('organization_id', organization.id),
        supabase.from('events').select('id, is_public, created_at', { count: 'exact' }).eq('organization_id', organization.id),
      ]);

      const brands = brandsRes.data || [];
      const products = productsRes.data || [];
      const events = eventsRes.data || [];

      setEntityCounts({
        brands: brands.length,
        products: products.length,
        events: events.length,
        members: members.length,
      });

      // Calculate public vs private
      const publicCount = 
        brands.filter(b => b.is_public).length + 
        products.filter(p => p.is_public).length + 
        events.filter(e => e.is_public).length;
      const privateCount = brands.length + products.length + events.length - publicCount;
      setPublicVsPrivate({ public: publicCount, private: privateCount });

      // Content distribution for pie chart
      setContentDistribution([
        { name: 'Brands', value: brands.length, color: PIE_COLORS[0] },
        { name: 'Products', value: products.length, color: PIE_COLORS[1] },
        { name: 'Events', value: events.length, color: PIE_COLORS[2] },
      ].filter(item => item.value > 0));

      // Fetch audit logs for activity data
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Process activity data by date
      const dateInterval = eachDayOfInterval({
        start: startDate,
        end: new Date(),
      });

      const activityByDate = dateInterval.map(date => {
        const dateStr = format(date, 'MMM dd');
        const dayLogs = auditLogs?.filter(log => {
          const logDate = format(parseISO(log.created_at), 'MMM dd');
          return logDate === dateStr;
        }) || [];

        return {
          date: dateStr,
          views: dayLogs.filter(l => l.action_type === 'view').length,
          edits: dayLogs.filter(l => l.action_type === 'update' || l.action_type === 'create').length,
          exports: dayLogs.filter(l => l.action_type === 'export').length,
        };
      });

      setActivityData(activityByDate.slice(-14)); // Last 14 days for chart

      // Recent activity
      const formattedActivity: RecentActivity[] = (auditLogs || []).slice(0, 10).map(log => ({
        id: log.id,
        actionType: log.action_type,
        entityType: log.entity_type,
        entityName: log.entity_name || 'Unknown',
        createdAt: log.created_at,
        userEmail: log.user_email || undefined,
      }));
      setRecentActivity(formattedActivity);

      // Growth data - cumulative content creation
      const allContent = [...brands, ...products, ...events].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const growthByDate = dateInterval.map(date => {
        const dateEnd = endOfDay(date);
        const total = allContent.filter(item => new Date(item.created_at) <= dateEnd).length;
        return {
          date: format(date, 'MMM dd'),
          total,
        };
      });
      setGrowthData(growthByDate.slice(-14));

    } catch (error) {
      console.error('[Analytics] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'view': return <Eye className="h-3 w-3" />;
      case 'create': return <FileText className="h-3 w-3" />;
      case 'update': return <Activity className="h-3 w-3" />;
      case 'export': return <ArrowUpRight className="h-3 w-3" />;
      case 'delete': return <ArrowDownRight className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'view': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'create': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'update': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'export': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'delete': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const totalContent = entityCounts.brands + entityCounts.products + entityCounts.events;
  const totalActivity = activityData.reduce((sum, d) => sum + d.views + d.edits + d.exports, 0);

  if (!organization) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>Track usage, activity, and growth metrics</CardDescription>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Brands"
                value={entityCounts.brands}
                icon={<FileText className="h-4 w-4" />}
                trend={entityCounts.brands > 0 ? '+' + entityCounts.brands : undefined}
                trendUp={true}
              />
              <MetricCard
                title="Products"
                value={entityCounts.products}
                icon={<Package className="h-4 w-4" />}
                trend={entityCounts.products > 0 ? '+' + entityCounts.products : undefined}
                trendUp={true}
              />
              <MetricCard
                title="Events"
                value={entityCounts.events}
                icon={<Calendar className="h-4 w-4" />}
                trend={entityCounts.events > 0 ? '+' + entityCounts.events : undefined}
                trendUp={true}
              />
              <MetricCard
                title="Team Members"
                value={entityCounts.members}
                icon={<Users className="h-4 w-4" />}
              />
            </div>

            {/* Charts */}
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
                <TabsTrigger value="growth" className="text-xs sm:text-sm">Growth</TabsTrigger>
                <TabsTrigger value="distribution" className="text-xs sm:text-sm">Distribution</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="pt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }} 
                        tickLine={false}
                        axisLine={false}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }} 
                        tickLine={false}
                        axisLine={false}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="views" name="Views" fill={CHART_COLORS.info} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="edits" name="Edits" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="exports" name="Exports" fill={CHART_COLORS.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Edits
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Exports
                  </span>
                </div>
              </TabsContent>

              <TabsContent value="growth" className="pt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }} 
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        name="Total Content"
                        stroke={CHART_COLORS.primary} 
                        fillOpacity={1} 
                        fill="url(#colorTotal)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Cumulative content growth over time
                </p>
              </TabsContent>

              <TabsContent value="distribution" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Content Type Distribution */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-center">Content Types</h4>
                    <div className="h-48">
                      {contentDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={contentDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {contentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          No content yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Public vs Private */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-center">Visibility</h4>
                    <div className="h-48">
                      {publicVsPrivate.public + publicVsPrivate.private > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Public', value: publicVsPrivate.public, color: '#22c55e' },
                                { name: 'Private', value: publicVsPrivate.private, color: '#6b7280' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#6b7280" />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          No content yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Recent Activity Feed */}
            <div className="pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h4>
              {recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Badge 
                        variant="outline" 
                        className={`${getActionColor(activity.actionType)} text-xs flex items-center gap-1`}
                      >
                        {getActionIcon(activity.actionType)}
                        {activity.actionType}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{activity.entityName}</span>
                          <span className="text-muted-foreground ml-1">({activity.entityType})</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(activity.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const MetricCard = ({ title, value, icon, trend, trendUp }: MetricCardProps) => (
  <div className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-muted-foreground">{icon}</span>
      {trend && (
        <span className={`text-xs flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{title}</p>
  </div>
);

export default OrganizationAnalytics;
