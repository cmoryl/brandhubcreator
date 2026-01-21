import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, Palette, Package, Activity, Shield, 
  TrendingUp, TrendingDown, BarChart3, PieChart, Clock,
  UserPlus, LogIn, Eye, Edit, Trash2, Download, RefreshCw,
  Settings, Database, HardDrive, AlertTriangle, CheckCircle,
  Crown, Search, Filter, MoreHorizontal, ArrowUpRight, Calendar,
  FileText, Brain, UserCheck, Wrench
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BrandReportGenerator } from '@/components/admin/BrandReportGenerator';
import { AIMarketAnalysis } from '@/components/admin/AIMarketAnalysis';
import { DataInspector } from '@/components/admin/DataInspector';
import { DemoGuidesManager } from '@/components/admin/DemoGuidesManager';
import { UserApprovalManager } from '@/components/admin/UserApprovalManager';
import { BrandAnalyticsHub } from '@/components/admin/BrandAnalyticsHub';
import { BulkRepairTool } from '@/components/admin/BulkRepairTool';
import { HiddenSectionsScanner } from '@/components/admin/HiddenSectionsScanner';

interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalBrands: number;
  totalProducts: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  publicBrands: number;
  storageUsed: string;
  pendingApprovals: number;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  organizations: number;
  brands: number;
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  memberCount: number;
  brandCount: number;
  productCount: number;
  owner: string;
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

export default function AdminDashboard() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    
    if (user && isAdmin) {
      fetchDashboardData();
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Re-fetch activity logs when date range changes
  useEffect(() => {
    if (user && isAdmin && !isLoading) {
      generateActivityLogs();
    }
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchOrganizations(),
        generateActivityLogs(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    // Fetch counts from various tables
    const [
      { count: usersCount },
      { count: orgsCount },
      { count: brandsCount },
      { count: productsCount },
      { count: publicBrandsCount },
      { count: pendingApprovalsCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    ]);

    // Get new users this week
    const weekAgo = subDays(new Date(), 7).toISOString();
    const { count: newUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    setStats({
      totalUsers: usersCount || 0,
      totalOrganizations: orgsCount || 0,
      totalBrands: brandsCount || 0,
      totalProducts: productsCount || 0,
      activeUsersToday: Math.floor((usersCount || 0) * 0.3), // Estimated
      newUsersThisWeek: newUsersCount || 0,
      publicBrands: publicBrandsCount || 0,
      storageUsed: 'N/A',
      pendingApprovals: pendingApprovalsCount || 0,
    });
  };

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    // Get roles for each user
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    // Get org memberships count
    const { data: memberships } = await supabase.from('organization_members').select('user_id');
    const membershipCount = new Map<string, number>();
    memberships?.forEach(m => {
      if (m.user_id) {
        membershipCount.set(m.user_id, (membershipCount.get(m.user_id) || 0) + 1);
      }
    });

    // Get brand counts
    const { data: brands } = await supabase.from('brands').select('user_id');
    const brandCount = new Map<string, number>();
    brands?.forEach(b => {
      brandCount.set(b.user_id, (brandCount.get(b.user_id) || 0) + 1);
    });

    const userData: UserData[] = (profiles || []).map(p => ({
      id: p.user_id,
      email: p.email || 'Unknown',
      created_at: p.created_at,
      last_sign_in_at: null, // Would need auth.users access
      role: roleMap.get(p.user_id) || 'user',
      organizations: membershipCount.get(p.user_id) || 0,
      brands: brandCount.get(p.user_id) || 0,
    }));

    setUsers(userData);
  };

  const fetchOrganizations = async () => {
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return;
    }

    // Get member counts and owner user IDs
    const { data: members } = await supabase.from('organization_members').select('organization_id, role, user_id');
    const memberCount = new Map<string, number>();
    const ownerUserIdMap = new Map<string, string>();
    
    members?.forEach(m => {
      memberCount.set(m.organization_id, (memberCount.get(m.organization_id) || 0) + 1);
      if (m.role === 'owner' && m.user_id) {
        ownerUserIdMap.set(m.organization_id, m.user_id);
      }
    });

    // Get profiles to map user IDs to emails
    const { data: profiles } = await supabase.from('profiles').select('user_id, email');
    const emailMap = new Map<string, string>();
    profiles?.forEach(p => {
      if (p.user_id && p.email) {
        emailMap.set(p.user_id, p.email);
      }
    });

    // Get brand counts per org
    const { data: brands } = await supabase.from('brands').select('organization_id');
    const brandCount = new Map<string, number>();
    brands?.forEach(b => {
      if (b.organization_id) {
        brandCount.set(b.organization_id, (brandCount.get(b.organization_id) || 0) + 1);
      }
    });

    // Get product counts per org
    const { data: products } = await supabase.from('products').select('organization_id');
    const productCount = new Map<string, number>();
    products?.forEach(p => {
      if (p.organization_id) {
        productCount.set(p.organization_id, (productCount.get(p.organization_id) || 0) + 1);
      }
    });

    const orgData: OrgData[] = (orgs || []).map(o => {
      const ownerUserId = ownerUserIdMap.get(o.id);
      const ownerEmail = ownerUserId ? emailMap.get(ownerUserId) : undefined;
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        created_at: o.created_at,
        memberCount: memberCount.get(o.id) || 0,
        brandCount: brandCount.get(o.id) || 0,
        productCount: productCount.get(o.id) || 0,
        owner: ownerEmail || 'Unknown',
      };
    });

    setOrganizations(orgData);
  };

  const generateActivityLogs = async () => {
    const logs: ActivityLog[] = [];
    
    // Calculate date filter based on dateRange
    const now = new Date();
    let dateFilter: string | null = null;
    switch (dateRange) {
      case '24h':
        dateFilter = subDays(now, 1).toISOString();
        break;
      case '7d':
        dateFilter = subDays(now, 7).toISOString();
        break;
      case '30d':
        dateFilter = subDays(now, 30).toISOString();
        break;
      default:
        dateFilter = null;
    }

    // Fetch real audit logs from the database
    let auditQuery = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (dateFilter) {
      auditQuery = auditQuery.gte('created_at', dateFilter);
    }

    const { data: auditLogs } = await auditQuery;

    // Convert audit logs to ActivityLog format
    auditLogs?.forEach(log => {
      const actionDescriptions: Record<string, string> = {
        create: 'created',
        update: 'updated',
        delete: 'deleted',
        view: 'viewed',
        publish: 'published',
        unpublish: 'unpublished',
        export: 'exported',
        login: 'logged in',
        logout: 'logged out',
        invite: 'invited member to',
        join: 'joined',
      };

      const actionText = actionDescriptions[log.action_type] || log.action_type;
      const entityName = log.entity_name || 'Unknown';
      const userEmail = log.user_email || 'Unknown user';

      logs.push({
        id: log.id,
        type: log.action_type as ActivityLog['type'],
        entityType: log.entity_type,
        entityName,
        description: `${userEmail} ${actionText} ${log.entity_type}: ${entityName}`,
        timestamp: log.created_at,
        user: userEmail,
        details: typeof log.details === 'object' ? log.details as Record<string, unknown> : {},
      });
    });

    // If no audit logs exist yet, fall back to generated activity from entity creation dates
    if (logs.length === 0) {
      // Recent profiles (signups)
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (dateFilter) {
        profilesQuery = profilesQuery.gte('created_at', dateFilter);
      }
      
      const { data: recentProfiles } = await profilesQuery;

      recentProfiles?.forEach(p => {
        logs.push({
          id: `signup-${p.user_id}`,
          type: 'create',
          entityType: 'user',
          entityName: p.email || 'Unknown',
          description: `New user registered: ${p.email}`,
          timestamp: p.created_at,
          user: p.email || undefined,
        });
      });

      // Recent brands
      let brandsQuery = supabase
        .from('brands')
        .select('id, name, created_at, updated_at, is_public')
        .order('updated_at', { ascending: false })
        .limit(15);
      
      if (dateFilter) {
        brandsQuery = brandsQuery.gte('updated_at', dateFilter);
      }

      const { data: recentBrands } = await brandsQuery;

      recentBrands?.forEach(b => {
        // Check if this is a create or update based on timestamps
        const isCreate = new Date(b.created_at).getTime() === new Date(b.updated_at).getTime();
        
        if (isCreate) {
          logs.push({
            id: `brand-create-${b.id}`,
            type: 'create',
            entityType: 'brand',
            entityName: b.name,
            description: `Brand created: ${b.name}`,
            timestamp: b.created_at,
          });
        } else {
          logs.push({
            id: `brand-update-${b.id}-${b.updated_at}`,
            type: 'update',
            entityType: 'brand',
            entityName: b.name,
            description: `Brand updated: ${b.name}`,
            timestamp: b.updated_at,
          });
        }

        // If published, add a publish event
        if (b.is_public) {
          logs.push({
            id: `brand-publish-${b.id}`,
            type: 'publish',
            entityType: 'brand',
            entityName: b.name,
            description: `Brand published: ${b.name}`,
            timestamp: b.updated_at,
          });
        }
      });

      // Recent organizations
      let orgsQuery = supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (dateFilter) {
        orgsQuery = orgsQuery.gte('created_at', dateFilter);
      }

      const { data: recentOrgs } = await orgsQuery;

      recentOrgs?.forEach(o => {
        logs.push({
          id: `org-${o.id}`,
          type: 'create',
          entityType: 'organization',
          entityName: o.name,
          description: `Organization created: ${o.name}`,
          timestamp: o.created_at,
        });
      });
    }

    // Sort by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivityLogs(logs.slice(0, 30));
  };

  const promoteToAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });

    if (error) {
      toast.error('Failed to promote user');
      return;
    }
    
    toast.success('User promoted to admin');
    fetchUsers();
  };

  const demoteFromAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: 'user' })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to demote user');
      return;
    }
    
    toast.success('User demoted to regular user');
    fetchUsers();
  };

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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Platform management & analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs: horizontally scrollable on small screens, wraps on larger to prevent misalignment */}
          <TabsList className="w-full justify-start gap-1 overflow-x-auto flex flex-nowrap md:flex-wrap md:overflow-visible">
            <TabsTrigger value="overview" className="gap-2 shrink-0">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2 relative shrink-0">
              <UserCheck className="h-4 w-4" />
              Approvals
              {(stats?.pendingApprovals ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats?.pendingApprovals}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 shrink-0">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2 shrink-0">
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2 shrink-0">
              <Palette className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="inspector" className="gap-2 shrink-0">
              <Database className="h-4 w-4" />
              Inspector
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 shrink-0">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 shrink-0">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-2 shrink-0">
              <Brain className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 shrink-0">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="repair" className="gap-2 shrink-0">
              <Wrench className="h-4 w-4" />
              Repair
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    {stats?.totalUsers || 0}
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.newUsersThisWeek || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Organizations</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalOrganizations || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Active workspaces
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Brand Guides</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalBrands || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {stats?.publicBrands || 0} public
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Products</CardDescription>
                  <CardTitle className="text-3xl">{stats?.totalProducts || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Product guides created
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Growth & Engagement */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Growth Metrics
                  </CardTitle>
                  <CardDescription>Platform growth indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Growth (7d)</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      +{stats?.newUsersThisWeek || 0} users
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Brands per User</span>
                    <span className="font-medium">
                      {stats?.totalUsers ? (stats.totalBrands / stats.totalUsers).toFixed(1) : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Public Content Rate</span>
                    <span className="font-medium">
                      {stats?.totalBrands ? Math.round((stats.publicBrands / stats.totalBrands) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Org Adoption Rate</span>
                    <span className="font-medium">
                      {stats?.totalUsers ? Math.round((stats.totalOrganizations / stats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest platform events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {activityLogs.slice(0, 8).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 text-sm">
                          {getActivityIcon(log.type)}
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{log.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>Platform status and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Database</p>
                      <p className="text-xs text-muted-foreground">Healthy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Auth</p>
                      <p className="text-xs text-muted-foreground">Operational</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Storage</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Edge Functions</p>
                      <p className="text-xs text-muted-foreground">Running</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <UserApprovalManager />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>{users.length} total users</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-9 w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organizations</TableHead>
                        <TableHead>Brands</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.organizations}</TableCell>
                          <TableCell>{u.brands}</TableCell>
                          <TableCell>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {u.role === 'admin' ? (
                                  <DropdownMenuItem onClick={() => demoteFromAdmin(u.id)}>
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    Demote to User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => promoteToAdmin(u.id)}>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Management</CardTitle>
                    <CardDescription>{organizations.length} organizations</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search organizations..." 
                      className="pl-9 w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Brands</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell className="text-muted-foreground">/{org.slug}</TableCell>
                          <TableCell>{org.memberCount}</TableCell>
                          <TableCell>{org.brandCount}</TableCell>
                          <TableCell>{org.productCount}</TableCell>
                          <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/org/${org.slug}`)}
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Demo Guides Manager */}
            <DemoGuidesManager />
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Guides
                  </CardTitle>
                  <CardDescription>{stats?.totalBrands || 0} total brands</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{stats?.publicBrands || 0}</p>
                      <p className="text-sm text-muted-foreground">Public</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{(stats?.totalBrands || 0) - (stats?.publicBrands || 0)}</p>
                      <p className="text-sm text-muted-foreground">Private</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Publish Rate</span>
                    <Badge variant="outline">
                      {stats?.totalBrands ? Math.round((stats.publicBrands / stats.totalBrands) * 100) : 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Guides
                  </CardTitle>
                  <CardDescription>{stats?.totalProducts || 0} total products</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {stats?.totalBrands ? (stats.totalProducts / stats.totalBrands).toFixed(1) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Products per Brand</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Inspector Tab */}
          <TabsContent value="inspector" className="space-y-6">
            <DataInspector />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <BrandReportGenerator />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <BrandAnalyticsHub />
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-6">
            <AIMarketAnalysis />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Recent platform activity</CardDescription>
                  </div>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[130px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {activityLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Activity className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No activity recorded yet</p>
                        <p className="text-sm">Activity will appear here as users interact with the platform</p>
                      </div>
                    ) : (
                      activityLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="p-2 bg-background rounded-full">
                            {getActivityIcon(log.type, log.entityType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(log.timestamp), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                              </p>
                              {log.user && (
                                <Badge variant="secondary" className="text-xs">
                                  {log.user}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge variant="outline">
                              {log.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {log.entityType}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repair Tab */}
          <TabsContent value="repair" className="space-y-6">
            <HiddenSectionsScanner />
            <BulkRepairTool />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}