import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, Building2, Palette, Package, Activity, Shield, 
  TrendingUp, TrendingDown, BarChart3, Clock, Brain,
  UserPlus, LogIn, Eye, Edit, Trash2, Download, RefreshCw,
  HardDrive, Crown, Search, MoreHorizontal, ArrowUpRight, Calendar,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { format, subDays } from 'date-fns';
import { useStableLoading } from '@/hooks/useStableLoading';

// Lazy-load ALL tab panel components to reduce 856KB monolith
const BrandReportGenerator = lazy(() => import('@/components/admin/BrandReportGenerator').then(m => ({ default: m.BrandReportGenerator })));
const ProductReportGenerator = lazy(() => import('@/components/admin/ProductReportGenerator').then(m => ({ default: m.ProductReportGenerator })));
const EventReportGenerator = lazy(() => import('@/components/admin/EventReportGenerator').then(m => ({ default: m.EventReportGenerator })));
const AIMarketAnalysis = lazy(() => import('@/components/admin/AIMarketAnalysis').then(m => ({ default: m.AIMarketAnalysis })));
const DataInspector = lazy(() => import('@/components/admin/DataInspector').then(m => ({ default: m.DataInspector })));
const DemoGuidesManager = lazy(() => import('@/components/admin/DemoGuidesManager').then(m => ({ default: m.DemoGuidesManager })));
const UserApprovalManager = lazy(() => import('@/components/admin/UserApprovalManager').then(m => ({ default: m.UserApprovalManager })));
const BrandAnalyticsHub = lazy(() => import('@/components/admin/BrandAnalyticsHub').then(m => ({ default: m.BrandAnalyticsHub })));
const BulkRepairTool = lazy(() => import('@/components/admin/BulkRepairTool').then(m => ({ default: m.BulkRepairTool })));
const HiddenSectionsScanner = lazy(() => import('@/components/admin/HiddenSectionsScanner').then(m => ({ default: m.HiddenSectionsScanner })));
const UserAnalyticsTab = lazy(() => import('@/components/admin/UserAnalyticsTab').then(m => ({ default: m.UserAnalyticsTab })));
const CompressedBackupManager = lazy(() => import('@/components/admin/CompressedBackupManager').then(m => ({ default: m.CompressedBackupManager })));
const UniverseBackupManager = lazy(() => import('@/components/admin/UniverseBackupManager').then(m => ({ default: m.UniverseBackupManager })));
const ProductSuiteBackupManager = lazy(() => import('@/components/admin/ProductSuiteBackupManager').then(m => ({ default: m.ProductSuiteBackupManager })));
const AdminImageLibrary = lazy(() => import('@/components/admin/AdminImageLibrary').then(m => ({ default: m.AdminImageLibrary })));
const GlobalLogoHub = lazy(() => import('@/components/admin/GlobalLogoHub').then(m => ({ default: m.GlobalLogoHub })));
const LeadSubmissionsPanel = lazy(() => import('@/components/admin/LeadSubmissionsPanel').then(m => ({ default: m.LeadSubmissionsPanel })));
const PeopleHub = lazy(() => import('@/components/admin/PeopleHub').then(m => ({ default: m.PeopleHub })));
const CompanyLocationsManager = lazy(() => import('@/components/admin/CompanyLocationsManager').then(m => ({ default: m.CompanyLocationsManager })));
const GlobalMapThemeEditor = lazy(() => import('@/components/admin/GlobalMapThemeEditor').then(m => ({ default: m.GlobalMapThemeEditor })));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const DownloadsReportPanel = lazy(() => import('@/components/admin/DownloadsReportPanel').then(m => ({ default: m.DownloadsReportPanel })));
const ActivityLogsPanel = lazy(() => import('@/components/admin/ActivityLogsPanel').then(m => ({ default: m.ActivityLogsPanel })));
const ActivityAnalyticsHub = lazy(() => import('@/components/admin/analytics/ActivityAnalyticsHub').then(m => ({ default: m.ActivityAnalyticsHub })));
const GlobalLinkAdminSection = lazy(() => import('@/components/admin/globallink').then(m => ({ default: m.GlobalLinkAdminSection })));
const ResearchBriefingsPanel = lazy(() => import('@/components/admin/ResearchBriefingsPanel').then(m => ({ default: m.ResearchBriefingsPanel })));
const MulticulturalIntelligencePanel = lazy(() => import('@/components/admin/MulticulturalIntelligencePanel').then(m => ({ default: m.MulticulturalIntelligencePanel })));
const DataForceAdminPanel = lazy(() => import('@/components/admin/DataForceAdminPanel').then(m => ({ default: m.DataForceAdminPanel })));
const BotManagementPanel = lazy(() => import('@/components/admin/BotManagementPanel').then(m => ({ default: m.BotManagementPanel })));
const OracleBrainPanel = lazy(() => import('@/components/admin/OracleBrainPanel').then(m => ({ default: m.OracleBrainPanel })));
const BiasAwarenessAdminPanel = lazy(() => import('@/components/admin/BiasAwarenessAdminPanel').then(m => ({ default: m.BiasAwarenessAdminPanel })));
const AccessibilityStandardsPanel = lazy(() => import('@/components/admin/AccessibilityStandardsPanel').then(m => ({ default: m.AccessibilityStandardsPanel })));
const HealthTimelinePanel = lazy(() => import('@/components/admin/HealthTimelinePanel').then(m => ({ default: m.HealthTimelinePanel })));
const PortfolioInsightsPanel = lazy(() => import('@/components/admin/PortfolioInsightsPanel').then(m => ({ default: m.PortfolioInsightsPanel })));
const AICenterOfExcellence = lazy(() => import('@/components/admin/AICenterOfExcellence').then(m => ({ default: m.AICenterOfExcellence })));
const VisibilityDashboard = lazy(() => import('@/components/admin/VisibilityDashboard').then(m => ({ default: m.VisibilityDashboard })));

import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminSidebar';
import { 
  DashboardStats, 
  ActivityLog, 
  UserData, 
  OrgData,
  getActivityIcon,
  getActionDescription 
} from '@/lib/admin';

/** Lightweight fallback for lazy-loaded admin tab panels */
const TabPanelFallback = () => (
  <div className="space-y-4 py-6">
    <div className="h-6 w-48 bg-muted animate-pulse rounded" />
    <div className="h-40 bg-muted/50 animate-pulse rounded-lg" />
    <div className="h-24 bg-muted/30 animate-pulse rounded-lg" />
  </div>
);

export default function AdminDashboard() {
  const { user, isAdmin, isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab') || 'overview';
    // Redirect legacy tab IDs to the unified People hub
    if (tab === 'users' || tab === 'approvals' || tab === 'leads') return 'people';
    return tab;
  });

  // Sync activeTab with URL query param on mount and when it changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
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

  // Ensure scroll resets to top whenever this dashboard mounts (covers the
  // case where users navigate here from a deeply scrolled editor page).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

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
    // Fetch counts from various tables including events
    const [
      { count: usersCount },
      { count: orgsCount },
      { count: brandsCount },
      { count: productsCount },
      { count: eventsCount },
      { count: publicBrandsCount },
      { count: publicEventsCount },
      { count: pendingApprovalsCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_public', true),
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
      totalEvents: eventsCount || 0,
      publicEvents: publicEventsCount || 0,
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

    // Get event counts per org
    const { data: events } = await supabase.from('events').select('organization_id');
    const eventCount = new Map<string, number>();
    events?.forEach(e => {
      if (e.organization_id) {
        eventCount.set(e.organization_id, (eventCount.get(e.organization_id) || 0) + 1);
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
        eventCount: eventCount.get(o.id) || 0,
        owner: ownerEmail || 'Unknown',
      };
    });

    setOrganizations(orgData);
  };

  const generateActivityLogs = async () => {
    const logs: ActivityLog[] = [];
    const seenIds = new Set<string>();
    
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

    // Fetch real audit logs
    let auditQuery = supabase
      .from('audit_logs')
      .select('id, user_id, user_email, brand_id, entity_type, action_type, entity_name, details, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (dateFilter) {
      auditQuery = auditQuery.gte('created_at', dateFilter);
    }

    // Also fetch entity-derived activity in parallel
    let brandsQuery = supabase
      .from('brands')
      .select('id, name, created_at, updated_at, is_public, user_id')
      .order('updated_at', { ascending: false })
      .limit(15);

    let productsQuery = supabase
      .from('products')
      .select('id, name, created_at, updated_at, is_public, user_id')
      .order('updated_at', { ascending: false })
      .limit(10);

    let eventsQuery = supabase
      .from('events')
      .select('id, name, created_at, updated_at, is_public, user_id')
      .order('updated_at', { ascending: false })
      .limit(10);

    let profilesQuery = supabase
      .from('profiles')
      .select('user_id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dateFilter) {
      brandsQuery = brandsQuery.gte('updated_at', dateFilter);
      productsQuery = productsQuery.gte('updated_at', dateFilter);
      eventsQuery = eventsQuery.gte('updated_at', dateFilter);
      profilesQuery = profilesQuery.gte('created_at', dateFilter);
    }

    const [auditRes, brandsRes, productsRes, eventsRes, profilesRes] = await Promise.all([
      auditQuery,
      brandsQuery,
      productsQuery,
      eventsQuery,
      profilesQuery,
    ]);

    // Build email lookup from profiles
    const emailLookup: Record<string, string> = {};
    profilesRes.data?.forEach(p => {
      if (p.email) emailLookup[p.user_id] = p.email;
    });

    // Convert audit logs
    auditRes.data?.forEach(log => {
      const actionText = getActionDescription(log.action_type);
      const entityName = log.entity_name || log.entity_type;
      const userEmail = log.user_email || emailLookup[log.user_id] || 'System';

      const id = `audit-${log.id}`;
      seenIds.add(id);
      logs.push({
        id,
        type: log.action_type as ActivityLog['type'],
        entityType: log.entity_type,
        entityName,
        description: `${userEmail} ${actionText} ${log.entity_type}: ${entityName}`,
        timestamp: log.created_at,
        user: userEmail,
        userEmail,
        userId: log.user_id,
        details: typeof log.details === 'object' ? log.details as Record<string, unknown> : {},
      });
    });

    // Add entity-derived activity (signups)
    profilesRes.data?.forEach(p => {
      const id = `signup-${p.user_id}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        logs.push({
          id,
          type: 'create',
          entityType: 'user',
          entityName: p.email || 'Unknown',
          description: `New user registered: ${p.email}`,
          timestamp: p.created_at,
          user: p.email || undefined,
          userEmail: p.email || undefined,
          userId: p.user_id,
        });
      }
    });

    // Add brands activity
    brandsRes.data?.forEach(b => {
      const isCreate = new Date(b.created_at).getTime() === new Date(b.updated_at).getTime();
      const id = isCreate ? `brand-create-${b.id}` : `brand-update-${b.id}-${b.updated_at}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        logs.push({
          id,
          type: isCreate ? 'create' : 'update',
          entityType: 'brand',
          entityName: b.name,
          description: `Brand ${isCreate ? 'created' : 'updated'}: ${b.name}`,
          timestamp: isCreate ? b.created_at : b.updated_at,
          userEmail: emailLookup[b.user_id] || undefined,
          userId: b.user_id,
        });
      }
      if (b.is_public) {
        const pubId = `brand-publish-${b.id}`;
        if (!seenIds.has(pubId)) {
          seenIds.add(pubId);
          logs.push({
            id: pubId,
            type: 'publish',
            entityType: 'brand',
            entityName: b.name,
            description: `Brand published: ${b.name}`,
            timestamp: b.updated_at,
            userEmail: emailLookup[b.user_id] || undefined,
            userId: b.user_id,
          });
        }
      }
    });

    // Add products activity
    productsRes.data?.forEach(p => {
      const isCreate = new Date(p.created_at).getTime() === new Date(p.updated_at).getTime();
      const id = isCreate ? `product-create-${p.id}` : `product-update-${p.id}-${p.updated_at}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        logs.push({
          id,
          type: isCreate ? 'create' : 'update',
          entityType: 'product',
          entityName: p.name,
          description: `Product ${isCreate ? 'created' : 'updated'}: ${p.name}`,
          timestamp: isCreate ? p.created_at : p.updated_at,
          userEmail: emailLookup[p.user_id] || undefined,
          userId: p.user_id,
        });
      }
    });

    // Add events activity
    eventsRes.data?.forEach(e => {
      const isCreate = new Date(e.created_at).getTime() === new Date(e.updated_at).getTime();
      const id = isCreate ? `event-create-${e.id}` : `event-update-${e.id}-${e.updated_at}`;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        logs.push({
          id,
          type: isCreate ? 'create' : 'update',
          entityType: 'event',
          entityName: e.name,
          description: `Event ${isCreate ? 'created' : 'updated'}: ${e.name}`,
          timestamp: isCreate ? e.created_at : e.updated_at,
          userEmail: emailLookup[e.user_id] || undefined,
          userId: e.user_id,
        });
      }
    });

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

  // Note: getActivityIcon is now imported from @/lib/admin

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stableLoading = useStableLoading(authLoading || isLoading, {
    showDelay: 100,
    minDisplayTime: 400,
    maxLoadingTime: 15000,
  });

  if (stableLoading) {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shrink-0">
        <div className="px-3 py-3 md:px-4 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {/* Mobile menu trigger */}
              <AdminMobileNav 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                pendingApprovals={stats?.pendingApprovals}
                isSuperAdmin={isSuperAdmin}
              />
              <div className="hidden md:block p-2 bg-primary/10 rounded-lg shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Platform management & analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-2 hidden sm:flex">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="icon" onClick={fetchDashboardData} className="sm:hidden">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden sm:flex">
                Back to App
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="sm:hidden">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical Sidebar Navigation (desktop only) */}
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          pendingApprovals={stats?.pendingApprovals}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <AdminOverview
                stats={stats}
                activityLogs={activityLogs}
                onTabChange={setActiveTab}
                onRefresh={fetchDashboardData}
                isLoading={isLoading}
                isSuperAdmin={isSuperAdmin}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="people" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <PeopleHub pendingApprovals={stats?.pendingApprovals} />
            </Suspense>
          </TabsContent>

          {/* Organizations Tab — inline, no heavy deps */}
          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Organization Management</CardTitle>
                    <CardDescription>{organizations.length} organizations</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search organizations..." 
                      className="pl-9 w-full sm:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ScrollArea className="h-[500px]">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Brands</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Events</TableHead>
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
                          <TableCell>{org.eventCount}</TableCell>
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

          <TabsContent value="inspector" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><DataInspector /></Suspense>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <Tabs defaultValue="brands" className="w-full">
                <TabsList className="mb-4 w-full flex-wrap h-auto gap-1">
                  <TabsTrigger value="brands" className="gap-1.5 text-xs sm:text-sm"><Palette className="h-4 w-4" />Brands</TabsTrigger>
                  <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm"><Package className="h-4 w-4" />Products</TabsTrigger>
                  <TabsTrigger value="events" className="gap-1.5 text-xs sm:text-sm"><CalendarDays className="h-4 w-4" />Events</TabsTrigger>
                </TabsList>
                <TabsContent value="brands"><BrandReportGenerator /></TabsContent>
                <TabsContent value="products"><ProductReportGenerator /></TabsContent>
                <TabsContent value="events"><EventReportGenerator /></TabsContent>
              </Tabs>
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><BrandAnalyticsHub /></Suspense>
          </TabsContent>

          <TabsContent value="user-analytics" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><UserAnalyticsTab /></Suspense>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><DownloadsReportPanel /></Suspense>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <Tabs defaultValue="oracle" className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto gap-1 w-full">
                  <TabsTrigger value="oracle" className="gap-2 text-xs sm:text-sm"><Brain className="h-4 w-4" />Oracle</TabsTrigger>
                  <TabsTrigger value="ai-analysis" className="gap-2 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" />AI Analysis</TabsTrigger>
                  <TabsTrigger value="multicultural" className="gap-2 text-xs sm:text-sm"><Users className="h-4 w-4" />Multicultural</TabsTrigger>
                  <TabsTrigger value="research" className="gap-2 text-xs sm:text-sm"><Eye className="h-4 w-4" />Research</TabsTrigger>
                  <TabsTrigger value="visibility" className="gap-2 text-xs sm:text-sm"><Eye className="h-4 w-4" />Visibility</TabsTrigger>
                </TabsList>
                <TabsContent value="oracle"><OracleBrainPanel organizationId={organizations[0]?.id} /></TabsContent>
                <TabsContent value="ai-analysis"><AIMarketAnalysis /></TabsContent>
                <TabsContent value="multicultural"><MulticulturalIntelligencePanel /></TabsContent>
                <TabsContent value="research"><ResearchBriefingsPanel /></TabsContent>
                <TabsContent value="visibility">
                  {organizations[0]?.id ? (
                    <VisibilityDashboard organizationId={organizations[0].id} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No organization found</p>
                  )}
                </TabsContent>
              </Tabs>
            </Suspense>
          </TabsContent>

          <TabsContent value="dataforce" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><DataForceAdminPanel /></Suspense>
          </TabsContent>

          <TabsContent value="bias-awareness" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><BiasAwarenessAdminPanel /></Suspense>
          </TabsContent>

          <TabsContent value="health-timeline" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><HealthTimelinePanel /></Suspense>
          </TabsContent>

          <TabsContent value="portfolio-insights" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><PortfolioInsightsPanel /></Suspense>
          </TabsContent>

          <TabsContent value="ai-center" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><AICenterOfExcellence /></Suspense>
          </TabsContent>

          <TabsContent value="bot-management" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><BotManagementPanel /></Suspense>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><AccessibilityStandardsPanel /></Suspense>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <Tabs defaultValue="analytics">
                <TabsList>
                  <TabsTrigger value="analytics">Analytics Hub</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="analytics" className="mt-4"><ActivityAnalyticsHub /></TabsContent>
                <TabsContent value="logs" className="mt-4"><ActivityLogsPanel /></TabsContent>
              </Tabs>
            </Suspense>
          </TabsContent>

          {isSuperAdmin && (
          <TabsContent value="repair" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <HiddenSectionsScanner />
              <BulkRepairTool />
            </Suspense>
          </TabsContent>
          )}

          <TabsContent value="image-library" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><AdminImageLibrary /></Suspense>
          </TabsContent>

          <TabsContent value="logo-hub" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><GlobalLogoHub /></Suspense>
          </TabsContent>

          <TabsContent value="backups" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <Tabs defaultValue="org-backups" className="w-full">
                <TabsList className="mb-4 w-full flex-wrap h-auto gap-1">
                  <TabsTrigger value="org-backups" className="gap-2 text-xs sm:text-sm"><HardDrive className="h-4 w-4" />Organization</TabsTrigger>
                  <TabsTrigger value="universe-backups" className="gap-2 text-xs sm:text-sm"><BarChart3 className="h-4 w-4" />Universe</TabsTrigger>
                  <TabsTrigger value="suite-backups" className="gap-2 text-xs sm:text-sm"><Package className="h-4 w-4" />Product Suite</TabsTrigger>
                </TabsList>
                <TabsContent value="org-backups">
                  <div className="grid gap-6">
                    {organizations.map((org) => (
                      <CompressedBackupManager key={org.id} organizationId={org.id} organizationName={org.name} />
                    ))}
                    {organizations.length === 0 && (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <HardDrive className="h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium">No organizations found</p>
                          <p className="text-sm">Organizations will appear here for backup management</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="universe-backups"><UniverseBackupManager /></TabsContent>
                <TabsContent value="suite-backups"><ProductSuiteBackupManager /></TabsContent>
              </Tabs>
            </Suspense>
          </TabsContent>

          <TabsContent value="demo-pages" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><DemoGuidesManager /></Suspense>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}>
              <GlobalMapThemeEditor />
              <CompanyLocationsManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="globallink" className="space-y-6">
            <Suspense fallback={<TabPanelFallback />}><GlobalLinkAdminSection /></Suspense>
          </TabsContent>

        </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}