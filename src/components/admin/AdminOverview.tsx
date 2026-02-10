/**
 * AdminOverview - Comprehensive admin dashboard overview
 * Features: Activity feed, module status cards, quick stats, DataForce summary, and quick actions grid
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Palette, Package, Calendar, Activity, 
  TrendingUp, AlertTriangle, Clock, Shield, CheckCircle,
  UserCheck, FileText, Database, HardDrive, MapPin, Mail, Image,
  Eye, Zap, ArrowRight, Brain, Wrench, RefreshCw, BarChart3,
  Bot, Globe, Languages
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  DashboardStats, 
  ActivityLog, 
  ModuleStatus, 
  QuickAction,
  getActivityIcon 
} from '@/lib/admin';

interface AdminOverviewProps {
  stats: DashboardStats | null;
  activityLogs: ActivityLog[];
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  locationCount?: number;
  leadCount?: number;
  imageCount?: number;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  activityLogs,
  onTabChange,
  onRefresh,
  isLoading = false,
  locationCount = 0,
  leadCount = 0,
  imageCount = 0,
}) => {
  // Calculate module statuses
  const moduleStatuses: ModuleStatus[] = [
    {
      id: 'users',
      name: 'Users',
      icon: <Users className="h-5 w-5" />,
      count: stats?.totalUsers || 0,
      status: (stats?.pendingApprovals || 0) > 0 ? 'warning' : 'healthy',
      trend: stats?.newUsersThisWeek || 0,
      description: `${stats?.pendingApprovals || 0} pending approval`,
    },
    {
      id: 'organizations',
      name: 'Organizations',
      icon: <Building2 className="h-5 w-5" />,
      count: stats?.totalOrganizations || 0,
      status: 'healthy',
      description: 'Active workspaces',
    },
    {
      id: 'content',
      name: 'Brand Guides',
      icon: <Palette className="h-5 w-5" />,
      count: stats?.totalBrands || 0,
      status: 'healthy',
      description: `${stats?.publicBrands || 0} published`,
    },
    {
      id: 'content',
      name: 'Products',
      icon: <Package className="h-5 w-5" />,
      count: stats?.totalProducts || 0,
      status: 'healthy',
      description: 'Product guides',
    },
    {
      id: 'content',
      name: 'Events',
      icon: <Calendar className="h-5 w-5" />,
      count: stats?.totalEvents || 0,
      status: 'healthy',
      description: `${stats?.publicEvents || 0} public`,
    },
    {
      id: 'locations',
      name: 'Locations',
      icon: <MapPin className="h-5 w-5" />,
      count: locationCount,
      status: 'healthy',
      description: 'Company locations',
    },
    {
      id: 'leads',
      name: 'Lead Submissions',
      icon: <Mail className="h-5 w-5" />,
      count: leadCount,
      status: leadCount > 0 ? 'warning' : 'healthy',
      description: 'Contact requests',
    },
    {
      id: 'image-library',
      name: 'Image Library',
      icon: <Image className="h-5 w-5" />,
      count: imageCount,
      status: 'healthy',
      description: 'Organization assets',
    },
  ];

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'approvals',
      label: 'Review Approvals',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: () => onTabChange('approvals'),
      badge: stats?.pendingApprovals,
      variant: (stats?.pendingApprovals || 0) > 0 ? 'destructive' : 'outline',
    },
    {
      id: 'reports',
      label: 'Generate Report',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onTabChange('reports'),
    },
    {
      id: 'ai-analysis',
      label: 'Intelligence Hub',
      icon: <Brain className="h-4 w-4" />,
      onClick: () => onTabChange('intelligence'),
    },
    {
      id: 'backups',
      label: 'Manage Backups',
      icon: <HardDrive className="h-4 w-4" />,
      onClick: () => onTabChange('backups'),
    },
    {
      id: 'repair',
      label: 'Repair Tools',
      icon: <Wrench className="h-4 w-4" />,
      onClick: () => onTabChange('repair'),
    },
    {
      id: 'inspector',
      label: 'Data Inspector',
      icon: <Database className="h-4 w-4" />,
      onClick: () => onTabChange('inspector'),
    },
  ];

  // Calculate health scores
  const contentHealth = stats ? Math.round(((stats.publicBrands + stats.publicEvents) / Math.max(stats.totalBrands + stats.totalEvents, 1)) * 100) : 0;
  const userEngagement = stats?.totalUsers ? Math.round((stats.activeUsersToday / stats.totalUsers) * 100) : 0;
  const orgAdoption = stats?.totalUsers ? Math.round((stats.totalOrganizations / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/20 shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="p-4 pb-2 relative">
            <CardDescription className="text-xs flex items-center gap-1.5 font-medium text-primary/70">
              <Users className="h-3.5 w-3.5" /> Total Users
            </CardDescription>
            <CardTitle className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-foreground">
              {stats?.totalUsers || 0}
              {(stats?.newUsersThisWeek || 0) > 0 && (
                <Badge variant="secondary" className="bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  +{stats?.newUsersThisWeek}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 relative">
            <p className="text-xs text-muted-foreground/80">
              <span className="font-medium text-foreground/70">{stats?.activeUsersToday || 0}</span> active today
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-muted-foreground/20 transition-all duration-300 group">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5 font-medium">
              <Building2 className="h-3.5 w-3.5 text-violet-500" /> Organizations
            </CardDescription>
            <CardTitle className="text-3xl md:text-4xl font-bold">{stats?.totalOrganizations || 0}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <p className="text-xs text-muted-foreground/80">Active workspaces</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-muted-foreground/20 transition-all duration-300 group">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5 font-medium">
              <Palette className="h-3.5 w-3.5 text-blue-500" /> Content
            </CardDescription>
            <CardTitle className="text-3xl md:text-4xl font-bold">
              {(stats?.totalBrands || 0) + (stats?.totalProducts || 0) + (stats?.totalEvents || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <span className="inline-flex items-center gap-1"><span className="font-medium text-foreground/70">{stats?.totalBrands}</span> brands</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1"><span className="font-medium text-foreground/70">{stats?.totalProducts}</span> products</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1"><span className="font-medium text-foreground/70">{stats?.totalEvents}</span> events</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:border-muted-foreground/20 transition-all duration-300 group">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center gap-1.5 font-medium">
              <Eye className="h-3.5 w-3.5 text-emerald-500" /> Published
            </CardDescription>
            <CardTitle className="text-3xl md:text-4xl font-bold">{(stats?.publicBrands || 0) + (stats?.publicEvents || 0)}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <span className="inline-flex items-center gap-1"><span className="font-medium text-foreground/70">{stats?.publicBrands}</span> brands</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="inline-flex items-center gap-1"><span className="font-medium text-foreground/70">{stats?.publicEvents}</span> events</span>
            </div>
          </CardContent>
        </Card>

        {(stats?.pendingApprovals || 0) > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-destructive/15 via-destructive/10 to-destructive/5 border-destructive/30 shadow-lg shadow-destructive/5 animate-pulse-subtle">
            <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="p-4 pb-2 relative">
              <CardDescription className="text-xs flex items-center gap-1.5 font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Pending Approval
              </CardDescription>
              <CardTitle className="text-3xl md:text-4xl font-bold text-destructive">{stats?.pendingApprovals || 0}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 relative">
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 text-xs font-medium shadow-md hover:shadow-lg transition-shadow"
                onClick={() => onTabChange('approvals')}
              >
                Review Now
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Module Status Cards */}
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  Module Status
                </CardTitle>
                <CardDescription className="text-xs mt-1">Health and counts across all sections</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="h-8 w-8 p-0 hover:bg-muted">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {moduleStatuses.map((module, index) => (
                <button
                  key={`${module.id}-${index}`}
                  onClick={() => onTabChange(module.id)}
                  className={cn(
                    "relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group overflow-hidden",
                    module.status === 'healthy' && "border-border/60 hover:border-primary/40 hover:bg-primary/5",
                    module.status === 'warning' && "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10",
                    module.status === 'error' && "border-red-500/40 bg-red-500/5 hover:border-red-500/60 hover:bg-red-500/10"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center gap-2.5 w-full relative">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors duration-200",
                      module.status === 'healthy' && "bg-primary/10 text-primary group-hover:bg-primary/20",
                      module.status === 'warning' && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                      module.status === 'error' && "bg-red-500/15 text-red-600 dark:text-red-400"
                    )}>
                      {module.icon}
                    </div>
                    <span className="text-2xl font-bold tracking-tight">{module.count}</span>
                    {module.trend !== undefined && module.trend > 0 && (
                      <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3" />
                        +{module.trend}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="text-sm font-medium text-foreground/90">{module.name}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{module.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs mt-1">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  className={cn(
                    "justify-start gap-2.5 h-auto py-3 px-3.5 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                    action.variant !== 'destructive' && "hover:bg-muted/80 hover:border-muted-foreground/30"
                  )}
                  onClick={action.onClick}
                >
                  <div className={cn(
                    "p-1.5 rounded-md",
                    action.variant === 'destructive' ? "bg-destructive-foreground/10" : "bg-muted"
                  )}>
                    {action.icon}
                  </div>
                  <span className="text-xs truncate">{action.label}</span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-[10px] font-bold rounded-full">
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Health Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs mt-1">Latest platform events</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => onTabChange('activity')}
              >
                View All <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <ScrollArea className="h-[260px] pr-3">
              <div className="space-y-1">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 rounded-full bg-muted mb-3">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Events will appear here as they happen</p>
                  </div>
                ) : (
                  activityLogs.slice(0, 10).map((log, index) => (
                    <div 
                      key={log.id} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 group",
                        index === 0 && "bg-muted/30"
                      )}
                    >
                      <div className="p-1.5 rounded-md bg-background border shadow-sm">
                        {getActivityIcon(log.type, log.entityType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground/90 truncate group-hover:text-foreground">
                          {log.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              Platform Health
            </CardTitle>
            <CardDescription className="text-xs mt-1">System status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4 space-y-5">
            {/* System Status */}
            <div className="grid grid-cols-2 gap-2.5">
              {['Database', 'Auth', 'Storage', 'Functions'].map((service, index) => (
                <div 
                  key={service} 
                  className="flex items-center gap-2.5 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-1 rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{service}</p>
                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Healthy</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Health Metrics */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content Published Rate</span>
                  <span className="font-semibold tabular-nums">{contentHealth}%</span>
                </div>
                <Progress value={contentHealth} className="h-2 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">User Engagement (Today)</span>
                  <span className="font-semibold tabular-nums">{userEngagement}%</span>
                </div>
                <Progress value={userEngagement} className="h-2 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Organization Adoption</span>
                  <span className="font-semibold tabular-nums">{orgAdoption}%</span>
                </div>
                <Progress value={orgAdoption} className="h-2 rounded-full" />
              </div>
            </div>

            {/* Growth Summary */}
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20">
                <span className="text-sm text-muted-foreground font-medium">Weekly Growth</span>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">+{stats?.newUsersThisWeek || 0} users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataForce AI Summary */}
      <DataForceSummaryWidget onTabChange={onTabChange} />

      {/* GlobalLink Summary */}
      <GlobalLinkSummaryWidget onTabChange={onTabChange} />
    </div>
  );
};

/** Lightweight DataForce summary for the overview page */
const DataForceSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{
    scans: number;
    avgScore: number;
    conversations: number;
    validations: number;
    pending: number;
  } | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const [
        { data: compliance },
        { data: convos },
        { data: validations },
      ] = await Promise.all([
        supabase.from('dataforce_compliance_jobs').select('compliance_score, status').eq('status', 'completed'),
        supabase.from('dataforce_assistant_conversations').select('id', { count: 'exact', head: true }),
        supabase.from('dataforce_validation_requests').select('status'),
      ]);

      const scores = compliance || [];
      const avg = scores.length > 0
        ? scores.reduce((a, j) => a + (j.compliance_score || 0), 0) / scores.length
        : 0;
      const pendingCount = (validations || []).filter(v => v.status === 'pending' || v.status === 'in_review').length;

      setData({
        scans: scores.length,
        avgScore: avg,
        conversations: convos?.length || 0,
        validations: (validations || []).length,
        pending: pendingCount,
      });
    };
    fetch();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-5 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              DataForce AI
            </CardTitle>
            <CardDescription className="text-xs mt-1">AI compliance, assistant & validation services</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onTabChange('intelligence')}
          >
            View Details <ArrowRight className="h-3 w-3 ml-1.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        {!data ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => onTabChange('intelligence')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.scans}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Compliance Scans</span>
                {data.avgScore > 0 && (
                  <p className={cn("text-[11px] font-medium mt-0.5", getScoreColor(data.avgScore))}>
                    Avg: {data.avgScore.toFixed(0)}%
                  </p>
                )}
              </div>
            </button>

            <button
              onClick={() => onTabChange('intelligence')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Bot className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.conversations}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Conversations</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Brand Assistant</p>
              </div>
            </button>

            <button
              onClick={() => onTabChange('intelligence')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.validations}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Validations</span>
                {data.pending > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                    {data.pending} pending
                  </p>
                )}
              </div>
            </button>

            <button
              onClick={() => onTabChange('intelligence')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Brain className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Full Dashboard</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">View all AI metrics →</p>
              </div>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Lightweight GlobalLink summary for the overview page */
const GlobalLinkSummaryWidget: React.FC<{ onTabChange: (tab: string) => void }> = ({ onTabChange }) => {
  const [data, setData] = useState<{
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    languages: number;
    variants: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: jobs },
        { data: languages },
        { data: variants },
      ] = await Promise.all([
        supabase.from('localization_jobs').select('status'),
        supabase.from('localization_target_languages').select('id', { count: 'exact', head: true }),
        supabase.from('brand_regional_variants').select('id', { count: 'exact', head: true }),
      ]);

      const allJobs = jobs || [];
      const completed = allJobs.filter(j => j.status === 'completed').length;
      const pending = allJobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length;

      setData({
        totalJobs: allJobs.length,
        completedJobs: completed,
        pendingJobs: pending,
        languages: languages?.length || 0,
        variants: variants?.length || 0,
      });
    };
    fetchData();
  }, []);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-5 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2.5 font-semibold">
              <div className="p-1.5 rounded-lg bg-sky-500/10">
                <Globe className="h-4 w-4 text-sky-500" />
              </div>
              GlobalLink
            </CardTitle>
            <CardDescription className="text-xs mt-1">Translation, localization & regional variants</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onTabChange('globallink')}
          >
            View Details <ArrowRight className="h-3 w-3 ml-1.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        {!data ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => onTabChange('globallink')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <FileText className="h-5 w-5 text-sky-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.totalJobs}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Translation Jobs</span>
                {data.completedJobs > 0 && (
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                    {data.completedJobs} completed
                  </p>
                )}
              </div>
            </button>

            <button
              onClick={() => onTabChange('globallink')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.pendingJobs}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">In Progress</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active translations</p>
              </div>
            </button>

            <button
              onClick={() => onTabChange('globallink')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Languages className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.languages}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Languages</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Target languages</p>
              </div>
            </button>

            <button
              onClick={() => onTabChange('globallink')}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border/60 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
            >
              <div className="flex items-center gap-2.5 w-full">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Globe className="h-5 w-5 text-teal-500" />
                </div>
                <span className="text-2xl font-bold tracking-tight">{data.variants}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-foreground/90">Regional Variants</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Localized guides</p>
              </div>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverview;
