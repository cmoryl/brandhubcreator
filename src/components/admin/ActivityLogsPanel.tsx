/**
 * ActivityLogsPanel - Comprehensive admin activity logs with filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Search, Filter, Download, RefreshCw, 
  User, Building2, Palette, Package, Calendar, Settings,
  CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown,
  Monitor, Smartphone, Tablet, Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePersistedAdminData, formatLastRunMessage } from '@/hooks/usePersistedAdminData';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  brand_id: string | null;
  entity_type: string;
  action_type: string;
  entity_name: string | null;
  details: unknown;
  outcome: string | null;
  browser: string | null;
  device_type: string | null;
  session_id: string | null;
  target_user_id: string | null;
  target_user_email: string | null;
  organization_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'publish', label: 'Publish' },
  { value: 'unpublish', label: 'Unpublish' },
  { value: 'export', label: 'Export' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
  { value: 'role_change', label: 'Role Change' },
  { value: 'settings_change', label: 'Settings Change' },
  { value: 'invite', label: 'Invite' },
  { value: 'join', label: 'Join' },
  { value: 'member_remove', label: 'Member Remove' },
  { value: 'backup', label: 'Backup' },
  { value: 'restore', label: 'Restore' },
];

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entities' },
  { value: 'brand', label: 'Brands' },
  { value: 'product', label: 'Products' },
  { value: 'event', label: 'Events' },
  { value: 'organization', label: 'Organizations' },
  { value: 'user', label: 'Users' },
  { value: 'member', label: 'Members' },
  { value: 'role', label: 'Roles' },
  { value: 'settings', label: 'Settings' },
  { value: 'backup', label: 'Backups' },
  { value: 'demo', label: 'Demos' },
  { value: 'location', label: 'Locations' },
  { value: 'pdf', label: 'PDFs' },
];

const OUTCOME_TYPES = [
  { value: 'all', label: 'All Outcomes' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'partial', label: 'Partial' },
];

const DATE_RANGES = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

interface CachedActivityLogsData {
  logs: AuditLog[];
  dateRange: string;
  actionFilter: string;
  entityFilter: string;
  outcomeFilter: string;
}

export const ActivityLogsPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Use persisted data hook
  const { 
    data: cachedData, 
    lastRunLabel, 
    isExpired,
    saveData 
  } = usePersistedAdminData<CachedActivityLogsData>('activity_logs', { ttl: 15 * 60 * 1000 }); // 15 min cache
  
  const logs = cachedData?.logs || [];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Calculate date filter
      let dateFilter: string | null = null;
      const now = new Date();
      
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
        case '90d':
          dateFilter = subDays(now, 90).toISOString();
          break;
        case 'custom':
          if (customDateFrom) {
            dateFilter = startOfDay(customDateFrom).toISOString();
          }
          break;
      }

      // Build audit_logs query
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      if (dateRange === 'custom' && customDateTo) {
        query = query.lte('created_at', endOfDay(customDateTo).toISOString());
      }

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (outcomeFilter !== 'all') {
        query = query.eq('outcome', outcomeFilter);
      }

      // Also fetch entity-derived activity in parallel for richer data
      let brandsQuery = supabase
        .from('brands')
        .select('id, name, created_at, updated_at, is_public, user_id')
        .order('updated_at', { ascending: false })
        .limit(50);

      let productsQuery = supabase
        .from('products')
        .select('id, name, created_at, updated_at, is_public, user_id')
        .order('updated_at', { ascending: false })
        .limit(30);

      let eventsQuery = supabase
        .from('events')
        .select('id, name, created_at, updated_at, is_public, user_id')
        .order('updated_at', { ascending: false })
        .limit(30);

      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dateFilter) {
        brandsQuery = brandsQuery.gte('updated_at', dateFilter);
        productsQuery = productsQuery.gte('updated_at', dateFilter);
        eventsQuery = eventsQuery.gte('updated_at', dateFilter);
        profilesQuery = profilesQuery.gte('created_at', dateFilter);
      }

      const [auditRes, brandsRes, productsRes, eventsRes, profilesRes] = await Promise.all([
        query,
        brandsQuery,
        productsQuery,
        eventsQuery,
        profilesQuery,
      ]);

      if (auditRes.error) throw auditRes.error;

      const allLogs: AuditLog[] = [...(auditRes.data || [])];
      const seenIds = new Set(allLogs.map(l => l.id));

      // Build a user email lookup from profiles
      const emailLookup: Record<string, string> = {};
      profilesRes.data?.forEach(p => {
        if (p.email) emailLookup[p.user_id] = p.email;
      });

      // Add user signups as synthetic audit logs (only if not filtered to specific action/entity)
      if ((entityFilter === 'all' || entityFilter === 'user') && (actionFilter === 'all' || actionFilter === 'create')) {
        profilesRes.data?.forEach(p => {
          const id = `signup-${p.user_id}`;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            allLogs.push({
              id,
              user_id: p.user_id,
              user_email: p.email,
              brand_id: null,
              entity_type: 'user',
              action_type: 'create',
              entity_name: p.email || 'New User',
              details: { source: 'registration' },
              outcome: 'success',
              browser: null,
              device_type: null,
              session_id: null,
              target_user_id: null,
              target_user_email: null,
              organization_id: null,
              old_value: null,
              new_value: null,
              created_at: p.created_at,
            });
          }
        });
      }

      // Helper to add entity-derived logs
      const addEntityLogs = (
        entities: Array<{ id: string; name: string; created_at: string; updated_at: string; is_public: boolean | null; user_id: string }> | null,
        entityType: string
      ) => {
        if (!entities) return;
        if (entityFilter !== 'all' && entityFilter !== entityType) return;

        entities.forEach(e => {
          const isCreate = new Date(e.created_at).getTime() === new Date(e.updated_at).getTime();
          
          if (actionFilter === 'all' || actionFilter === (isCreate ? 'create' : 'update')) {
            const id = isCreate ? `${entityType}-create-${e.id}` : `${entityType}-update-${e.id}-${e.updated_at}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allLogs.push({
                id,
                user_id: e.user_id,
                user_email: emailLookup[e.user_id] || null,
                brand_id: entityType === 'brand' ? e.id : null,
                entity_type: entityType,
                action_type: isCreate ? 'create' : 'update',
                entity_name: e.name,
                details: null,
                outcome: 'success',
                browser: null,
                device_type: null,
                session_id: null,
                target_user_id: null,
                target_user_email: null,
                organization_id: null,
                old_value: null,
                new_value: null,
                created_at: isCreate ? e.created_at : e.updated_at,
              });
            }
          }

          if (e.is_public && (actionFilter === 'all' || actionFilter === 'publish')) {
            const pubId = `${entityType}-publish-${e.id}`;
            if (!seenIds.has(pubId)) {
              seenIds.add(pubId);
              allLogs.push({
                id: pubId,
                user_id: e.user_id,
                user_email: emailLookup[e.user_id] || null,
                brand_id: entityType === 'brand' ? e.id : null,
                entity_type: entityType,
                action_type: 'publish',
                entity_name: e.name,
                details: null,
                outcome: 'success',
                browser: null,
                device_type: null,
                session_id: null,
                target_user_id: null,
                target_user_email: null,
                organization_id: null,
                old_value: null,
                new_value: null,
                created_at: e.updated_at,
              });
            }
          }
        });
      };

      addEntityLogs(brandsRes.data, 'brand');
      addEntityLogs(productsRes.data, 'product');
      addEntityLogs(eventsRes.data, 'event');

      // Sort all combined logs
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Save to persistent cache
      saveData({
        logs: allLogs.slice(0, 500),
        dateRange,
        actionFilter,
        entityFilter,
        outcomeFilter,
      });

      toast.success(`Activity logs refreshed — ${allLogs.length} events found`);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Only auto-fetch if no cached data exists
  useEffect(() => {
    if (!cachedData) {
      fetchLogs();
    }
  }, []);

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.user_email?.toLowerCase().includes(term) ||
      log.entity_name?.toLowerCase().includes(term) ||
      log.target_user_email?.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      log.action_type.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Outcome', 'Device', 'Browser', 'Target User', 'Details'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email || 'Unknown',
        log.action_type,
        log.entity_type,
        `"${(log.entity_name || '').replace(/"/g, '""')}"`,
        log.outcome || 'success',
        log.device_type || '-',
        log.browser || '-',
        log.target_user_email || '-',
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create': return <span className="text-green-500">+</span>;
      case 'update': return <span className="text-blue-500">✎</span>;
      case 'delete': return <span className="text-red-500">×</span>;
      case 'publish': return <Globe className="h-3.5 w-3.5 text-green-500" />;
      case 'unpublish': return <Globe className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'export': return <Download className="h-3.5 w-3.5 text-blue-500" />;
      case 'approve': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'reject': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'role_change': return <User className="h-3.5 w-3.5 text-purple-500" />;
      case 'settings_change': return <Settings className="h-3.5 w-3.5 text-amber-500" />;
      case 'invite': return <User className="h-3.5 w-3.5 text-blue-500" />;
      case 'join': return <User className="h-3.5 w-3.5 text-green-500" />;
      default: return <Activity className="h-3.5 w-3.5" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'brand': return <Palette className="h-4 w-4 text-teal-500" />;
      case 'product': return <Package className="h-4 w-4 text-blue-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'organization': return <Building2 className="h-4 w-4 text-indigo-500" />;
      case 'user': case 'member': case 'role': return <User className="h-4 w-4 text-slate-500" />;
      case 'settings': return <Settings className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-3.5 w-3.5" />;
      case 'tablet': return <Tablet className="h-3.5 w-3.5" />;
      default: return <Monitor className="h-3.5 w-3.5" />;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'failure':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'partial':
        return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">Partial</Badge>;
      default:
        return null;
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const failures = filteredLogs.filter(l => l.outcome === 'failure').length;
    const uniqueUsers = new Set(filteredLogs.map(l => l.user_id)).size;
    const byAction = filteredLogs.reduce((acc, log) => {
      acc[log.action_type] = (acc[log.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topAction = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0];
    return { total, failures, uniqueUsers, topAction };
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.failures}</div>
            <p className="text-xs text-muted-foreground">Failed Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold capitalize">{stats.topAction?.[0] || '-'}</div>
            <p className="text-xs text-muted-foreground">Most Common Action</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Activity Logs</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            Comprehensive audit trail of all admin and user actions
            {lastRunLabel && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                <Clock className="h-3 w-3" />
                {formatLastRunMessage(lastRunLabel, isExpired)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, entity, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom date range */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customDateFrom ? format(customDateFrom, 'MMM d, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customDateTo ? format(customDateTo, 'MMM d, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Logs List */}
          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <Collapsible
                    key={log.id}
                    open={expandedLogs.has(log.id)}
                    onOpenChange={() => toggleExpanded(log.id)}
                  >
                    <div className={cn(
                      "rounded-lg border p-3 transition-colors hover:bg-muted/50",
                      log.outcome === 'failure' && "border-red-200 bg-red-50/50 dark:bg-red-950/20"
                    )}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start gap-3">
                          {/* Entity Icon */}
                          <div className="mt-0.5">
                            {getEntityIcon(log.entity_type)}
                          </div>
                          
                          {/* Main Content */}
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {log.user_email || 'Unknown user'}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                {getActionIcon(log.action_type)}
                                {log.action_type.replace('_', ' ')}
                              </span>
                              <span className="text-sm">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {log.entity_type}
                                </Badge>
                              </span>
                              {log.entity_name && (
                                <span className="text-sm font-medium text-foreground">
                                  {log.entity_name}
                                </span>
                              )}
                              {getOutcomeBadge(log.outcome)}
                            </div>
                            
                            {/* Target user if applicable */}
                            {log.target_user_email && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Target: {log.target_user_email}
                              </p>
                            )}
                          </div>
                          
                          {/* Right side: time and device */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                            <div className="flex items-center gap-1" title={log.device_type || 'Desktop'}>
                              {getDeviceIcon(log.device_type)}
                              {log.browser && <span>{log.browser}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), 'MMM d, HH:mm')}
                            </div>
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform",
                              expandedLogs.has(log.id) && "rotate-180"
                            )} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="ml-2 font-mono text-xs">{log.user_id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Session:</span>
                              <span className="ml-2 font-mono text-xs">{log.session_id || '-'}</span>
                            </div>
                            {log.organization_id && (
                              <div>
                                <span className="text-muted-foreground">Organization:</span>
                                <span className="ml-2 font-mono text-xs">{log.organization_id}</span>
                              </div>
                            )}
                            {log.brand_id && (
                              <div>
                                <span className="text-muted-foreground">Brand ID:</span>
                                <span className="ml-2 font-mono text-xs">{log.brand_id}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Old/New values for changes */}
                          {(log.old_value || log.new_value) && (
                            <div className="bg-muted/50 rounded p-2 space-y-1">
                              {log.old_value && (
                                <div>
                                  <span className="text-red-600 font-medium text-xs">- Old: </span>
                                  <code className="text-xs">{JSON.stringify(log.old_value)}</code>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <span className="text-green-600 font-medium text-xs">+ New: </span>
                                  <code className="text-xs">{JSON.stringify(log.new_value)}</code>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Details */}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="bg-muted/50 rounded p-2">
                              <span className="text-muted-foreground text-xs">Details: </span>
                              <code className="text-xs">{JSON.stringify(log.details, null, 2)}</code>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
