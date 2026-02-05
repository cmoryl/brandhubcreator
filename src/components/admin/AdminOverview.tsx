/**
 * AdminOverview - Comprehensive admin dashboard overview
 * Features: Activity feed, module status cards, quick stats, and quick actions grid
 */

import React from 'react';
import { 
  Users, Building2, Palette, Package, Calendar, Activity, 
  TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Clock,
  UserCheck, FileText, Database, HardDrive, MapPin, Mail, Image,
  Eye, Edit, Trash2, UserPlus, LogIn, Download, Zap, ArrowRight,
  Shield, Brain, Wrench, RefreshCw, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalBrands: number;
  totalProducts: number;
  totalEvents: number;
  publicEvents: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  publicBrands: number;
  storageUsed: string;
  pendingApprovals: number;
}

interface ActivityLog {
  id: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'publish' | 'unpublish' | 'export' | 'login' | 'logout' | 'invite' | 'join';
  entityType: string;
  entityName: string;
  description: string;
  timestamp: string;
  user?: string;
  details?: Record<string, unknown>;
}

interface ModuleStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  status: 'healthy' | 'warning' | 'error';
  trend?: number;
  description: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  badge?: number;
}

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

const getActivityIcon = (type: ActivityLog['type'], entityType?: string) => {
  switch (type) {
    case 'create': 
      if (entityType === 'user') return <UserPlus className="h-4 w-4 text-green-500" />;
      if (entityType === 'organization') return <Building2 className="h-4 w-4 text-purple-500" />;
      return <Palette className="h-4 w-4 text-blue-500" />;
    case 'update': return <Edit className="h-4 w-4 text-amber-500" />;
    case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'view': return <Eye className="h-4 w-4 text-gray-500" />;
    case 'publish': return <Eye className="h-4 w-4 text-green-500" />;
    case 'unpublish': return <Eye className="h-4 w-4 text-orange-500" />;
    case 'export': return <Download className="h-4 w-4 text-blue-500" />;
    case 'login': return <LogIn className="h-4 w-4 text-gray-500" />;
    case 'logout': return <LogIn className="h-4 w-4 text-gray-400" />;
    case 'invite': return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'join': return <UserPlus className="h-4 w-4 text-green-500" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

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
      label: 'AI Analysis',
      icon: <Brain className="h-4 w-4" />,
      onClick: () => onTabChange('ai-analysis'),
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
    <div className="space-y-6">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" /> Total Users
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
              {stats?.totalUsers || 0}
              {(stats?.newUsersThisWeek || 0) > 0 && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-[10px]">
                  +{stats?.newUsersThisWeek}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-[10px] text-muted-foreground">
              {stats?.activeUsersToday || 0} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Organizations
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{stats?.totalOrganizations || 0}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-[10px] text-muted-foreground">Workspaces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Palette className="h-3 w-3" /> Content
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl">
              {(stats?.totalBrands || 0) + (stats?.totalProducts || 0) + (stats?.totalEvents || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-[10px] text-muted-foreground">
              {stats?.totalBrands} brands · {stats?.totalProducts} products · {stats?.totalEvents} events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" /> Published
            </CardDescription>
            <CardTitle className="text-2xl md:text-3xl">{(stats?.publicBrands || 0) + (stats?.publicEvents || 0)}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-[10px] text-muted-foreground">
              {stats?.publicBrands} brands · {stats?.publicEvents} events
            </p>
          </CardContent>
        </Card>

        {(stats?.pendingApprovals || 0) > 0 && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="p-3 pb-1">
              <CardDescription className="text-xs flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" /> Pending
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl text-destructive">{stats?.pendingApprovals || 0}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-6 text-[10px]"
                onClick={() => onTabChange('approvals')}
              >
                Review Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Module Status Cards */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Module Status
                </CardTitle>
                <CardDescription className="text-xs">Health and counts across all sections</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {moduleStatuses.map((module, index) => (
                <button
                  key={`${module.id}-${index}`}
                  onClick={() => onTabChange(module.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-accent/50 text-left",
                    module.status === 'warning' && "border-amber-500/30 bg-amber-500/5",
                    module.status === 'error' && "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={cn(
                      "p-1.5 rounded",
                      module.status === 'healthy' && "bg-primary/10 text-primary",
                      module.status === 'warning' && "bg-amber-500/10 text-amber-500",
                      module.status === 'error' && "bg-red-500/10 text-red-500"
                    )}>
                      {module.icon}
                    </div>
                    <span className="text-lg font-semibold">{module.count}</span>
                    {module.trend !== undefined && module.trend > 0 && (
                      <TrendingUp className="h-3 w-3 text-green-500 ml-auto" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{module.name}</span>
                  <span className="text-[10px] text-muted-foreground">{module.description}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={action.onClick}
                >
                  {action.icon}
                  <span className="text-xs truncate">{action.label}</span>
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge variant="destructive" className="ml-auto h-4 px-1 text-[10px]">
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
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs">Latest platform events</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => onTabChange('activity')}
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <ScrollArea className="h-[240px]">
              <div className="space-y-3">
                {activityLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  activityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      {getActivityIcon(log.type, log.entityType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
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
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Platform Health
            </CardTitle>
            <CardDescription className="text-xs">System status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            {/* System Status */}
            <div className="grid grid-cols-2 gap-2">
              {['Database', 'Auth', 'Storage', 'Functions'].map((service) => (
                <div key={service} className="flex items-center gap-2 p-2 bg-green-500/5 rounded-lg border border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs font-medium">{service}</p>
                    <p className="text-[10px] text-muted-foreground">Healthy</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Health Metrics */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Content Published Rate</span>
                  <span className="font-medium">{contentHealth}%</span>
                </div>
                <Progress value={contentHealth} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>User Engagement (Today)</span>
                  <span className="font-medium">{userEngagement}%</span>
                </div>
                <Progress value={userEngagement} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Organization Adoption</span>
                  <span className="font-medium">{orgAdoption}%</span>
                </div>
                <Progress value={orgAdoption} className="h-1.5" />
              </div>
            </div>

            {/* Growth Summary */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Weekly Growth</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="font-medium text-green-600">+{stats?.newUsersThisWeek || 0} users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
