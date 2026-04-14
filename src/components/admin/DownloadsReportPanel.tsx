/**
 * DownloadsReportPanel - Enhanced admin component for viewing export/download activity
 * Tracks PDF exports, asset downloads, backups, icons, and all file exports
 * Shows browser, device, file size, and detailed metadata per download
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Download, 
  FileText, 
  Image, 
  Archive, 
  RefreshCw, 
  Search,
  Calendar,
  Filter,
  FileDown,
  Clock,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Palette,
  Box,
  FileJson,
  FileCode,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { usePersistedAdminData, formatLastRunMessage } from '@/hooks/usePersistedAdminData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DownloadLog {
  id: string;
  user_id: string;
  user_email: string | null;
  entity_type: string;
  entity_name: string | null;
  action_type: string;
  browser: string | null;
  device_type: string | null;
  session_id: string | null;
  organization_id: string | null;
  details: {
    download_type?: string;
    format?: string;
    file_name?: string;
    file_size_bytes?: number;
    file_size_display?: string;
    sections_count?: number;
    paper_size?: string;
    theme?: string;
    source_section?: string;
    item_count?: number;
    resolution?: string;
    tracked_at?: string;
  } | null;
  created_at: string;
}

interface DownloadStats {
  total: number;
  pdf: number;
  asset: number;
  backup: number;
  icon: number;
  other: number;
  byDay: { date: string; count: number }[];
  byBrowser: Record<string, number>;
  byDevice: Record<string, number>;
  topUsers: { email: string; count: number }[];
  totalSizeBytes: number;
}

interface CachedDownloadsData {
  downloads: DownloadLog[];
  stats: DownloadStats | null;
  dateRange: string;
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDownloadCategory(log: DownloadLog): string {
  const dt = log.details?.download_type || '';
  const et = log.entity_type || '';
  if (dt === 'pdf' || et === 'pdf') return 'pdf';
  if (dt === 'backup' || et === 'backup') return 'backup';
  if (['icon', 'svg'].includes(dt) || et === 'icon') return 'icon';
  if (['asset', 'logo', 'pattern', 'image'].includes(dt) || ['logo', 'pattern', 'icon', 'image_asset'].includes(et)) return 'asset';
  return 'other';
}

const DeviceIcon = ({ type }: { type: string | null }) => {
  if (type === 'mobile') return <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />;
  if (type === 'tablet') return <Tablet className="h-3.5 w-3.5 text-muted-foreground" />;
  return <Monitor className="h-3.5 w-3.5 text-muted-foreground" />;
};

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
    case 'asset': return <Image className="h-4 w-4 text-blue-500" />;
    case 'backup': return <Archive className="h-4 w-4 text-amber-500" />;
    case 'icon': return <Palette className="h-4 w-4 text-purple-500" />;
    default: return <Download className="h-4 w-4 text-muted-foreground" />;
  }
};

const CategoryBadge = ({ category }: { category: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    pdf: { label: 'PDF', className: 'text-red-600 border-red-200 dark:border-red-800' },
    asset: { label: 'Asset', className: 'text-blue-600 border-blue-200 dark:border-blue-800' },
    backup: { label: 'Backup', className: 'text-amber-600 border-amber-200 dark:border-amber-800' },
    icon: { label: 'Icon', className: 'text-purple-600 border-purple-200 dark:border-purple-800' },
    other: { label: 'Export', className: 'text-muted-foreground border-border' },
  };
  const c = config[category] || config.other;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
};

export function DownloadsReportPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { 
    data: cachedData, 
    lastRunLabel, 
    isExpired,
    saveData 
  } = usePersistedAdminData<CachedDownloadsData>('downloads_report', { ttl: 30 * 60 * 1000 });
  
  const downloads = cachedData?.downloads || [];
  const stats = cachedData?.stats || null;

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchDownloads = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(dateRange.replace('d', ''));
      const startDate = subDays(new Date(), days).toISOString();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, user_email, entity_type, entity_name, action_type, details, created_at, browser, device_type, session_id, organization_id')
        .eq('action_type', 'export')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const logs: DownloadLog[] = (data || []).map(log => ({
        ...log,
        details: log.details as DownloadLog['details'],
      }));

      // Calculate enriched stats
      const byBrowser: Record<string, number> = {};
      const byDevice: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      let totalSizeBytes = 0;
      let pdfCount = 0, assetCount = 0, backupCount = 0, iconCount = 0, otherCount = 0;

      logs.forEach(log => {
        const cat = getDownloadCategory(log);
        if (cat === 'pdf') pdfCount++;
        else if (cat === 'asset') assetCount++;
        else if (cat === 'backup') backupCount++;
        else if (cat === 'icon') iconCount++;
        else otherCount++;

        if (log.browser) byBrowser[log.browser] = (byBrowser[log.browser] || 0) + 1;
        if (log.device_type) byDevice[log.device_type] = (byDevice[log.device_type] || 0) + 1;
        if (log.user_email) byUser[log.user_email] = (byUser[log.user_email] || 0) + 1;
        if (log.details?.file_size_bytes) totalSizeBytes += log.details.file_size_bytes;
      });

      // Group by day
      const byDayMap = new Map<string, number>();
      logs.forEach(log => {
        const day = format(new Date(log.created_at), 'yyyy-MM-dd');
        byDayMap.set(day, (byDayMap.get(day) || 0) + 1);
      });
      const byDay = Array.from(byDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topUsers = Object.entries(byUser)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const calculatedStats: DownloadStats = {
        total: logs.length,
        pdf: pdfCount,
        asset: assetCount,
        backup: backupCount,
        icon: iconCount,
        other: otherCount,
        byDay,
        byBrowser,
        byDevice,
        topUsers,
        totalSizeBytes,
      };

      saveData({
        downloads: logs,
        stats: calculatedStats,
        dateRange,
      });

      toast.success('Downloads report refreshed');
    } catch (error) {
      console.error('Error fetching downloads:', error);
      toast.error('Failed to load download history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedData) {
      fetchDownloads();
    }
  }, []);

  const filteredDownloads = useMemo(() => {
    return downloads.filter(log => {
      const matchesSearch = !searchTerm || 
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.browser?.toLowerCase().includes(searchTerm.toLowerCase());

      const cat = getDownloadCategory(log);
      const matchesType = filterType === 'all' || filterType === cat;

      return matchesSearch && matchesType;
    });
  }, [downloads, searchTerm, filterType]);

  const handleExportCSV = () => {
    const headers = ['Date', 'User', 'Type', 'Category', 'Content', 'File Name', 'Format', 'File Size', 'Browser', 'Device', 'Source Section'];
    const rows = filteredDownloads.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_email || 'Unknown',
      log.entity_type,
      getDownloadCategory(log),
      log.entity_name || '',
      log.details?.file_name || '',
      log.details?.format || '',
      log.details?.file_size_display || formatBytes(log.details?.file_size_bytes),
      log.browser || '',
      log.device_type || '',
      log.details?.source_section || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `download-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.total || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.pdf || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Image className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.asset || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Palette className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.icon || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Icons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Archive className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats?.backup || 0}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted">
                <Box className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatBytes(stats?.totalSizeBytes)}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser & Device breakdown + Top users */}
      {stats && (stats.topUsers.length > 0 || Object.keys(stats.byBrowser).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Downloaders */}
          {stats.topUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Top Downloaders</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1.5">
                {stats.topUsers.map(u => (
                  <div key={u.email} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[180px]">{u.email}</span>
                    <Badge variant="secondary" className="text-xs">{u.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Browser Breakdown */}
          {Object.keys(stats.byBrowser).length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Browsers
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1.5">
                {Object.entries(stats.byBrowser).sort(([,a],[,b]) => b - a).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{browser}</span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Device Breakdown */}
          {Object.keys(stats.byDevice).length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-1.5">
                {Object.entries(stats.byDevice).sort(([,a],[,b]) => b - a).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between text-sm capitalize">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <DeviceIcon type={device} /> {device}
                    </span>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Download History
              </CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                Track all exports and downloads across the platform
                {lastRunLabel && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                    <Clock className="h-3 w-3" />
                    {formatLastRunMessage(lastRunLabel, isExpired)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredDownloads.length === 0}>
                <FileDown className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDownloads} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, user, file, or browser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF Exports</SelectItem>
                <SelectItem value="asset">Asset Downloads</SelectItem>
                <SelectItem value="icon">Icon Downloads</SelectItem>
                <SelectItem value="backup">Backups</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Downloads Table */}
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDownloads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? 'Loading...' : 'No download history found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDownloads.map((log) => {
                    const cat = getDownloadCategory(log);
                    const isExpanded = expandedRows.has(log.id);
                    const hasDetails = log.details && Object.keys(log.details).length > 0;

                    return (
                      <Collapsible key={log.id} asChild open={isExpanded} onOpenChange={() => toggleRow(log.id)}>
                        <>
                          <TableRow 
                            className={hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''}
                            onClick={() => hasDetails && toggleRow(log.id)}
                          >
                            <TableCell className="w-[30px] px-2">
                              {hasDetails && (
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}>
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </TableCell>
                            <TableCell>
                              <CategoryIcon category={cat} />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{log.entity_name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{log.user_email || 'Unknown user'}</span>
                                {(log.browser || log.device_type) && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    {log.device_type && <DeviceIcon type={log.device_type} />}
                                    {log.browser}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <CategoryBadge category={cat} />
                                {log.details?.format && (
                                  <Badge variant="secondary" className="text-xs">
                                    {log.details.format.toUpperCase()}
                                  </Badge>
                                )}
                                {log.details?.paper_size && (
                                  <Badge variant="secondary" className="text-xs">
                                    {log.details.paper_size.toUpperCase()}
                                  </Badge>
                                )}
                                {log.details?.source_section && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[10px] opacity-60">
                                        {log.details.source_section.replace(/_/g, ' ')}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Source section</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {log.details?.file_size_display || formatBytes(log.details?.file_size_bytes)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.created_at), 'MMM d, h:mm a')}
                            </TableCell>
                          </TableRow>
                          {hasDetails && (
                            <CollapsibleContent asChild>
                              <TableRow className="bg-muted/30 border-0">
                                <TableCell colSpan={7} className="py-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pl-8">
                                    {log.details?.file_name && (
                                      <div>
                                        <span className="text-muted-foreground">File Name</span>
                                        <p className="font-medium truncate">{log.details.file_name}</p>
                                      </div>
                                    )}
                                    {log.details?.sections_count != null && (
                                      <div>
                                        <span className="text-muted-foreground">Sections</span>
                                        <p className="font-medium">{log.details.sections_count}</p>
                                      </div>
                                    )}
                                    {log.details?.item_count != null && (
                                      <div>
                                        <span className="text-muted-foreground">Items</span>
                                        <p className="font-medium">{log.details.item_count}</p>
                                      </div>
                                    )}
                                    {log.details?.theme && (
                                      <div>
                                        <span className="text-muted-foreground">Theme</span>
                                        <p className="font-medium capitalize">{log.details.theme}</p>
                                      </div>
                                    )}
                                    {log.details?.resolution && (
                                      <div>
                                        <span className="text-muted-foreground">Resolution</span>
                                        <p className="font-medium">{log.details.resolution}</p>
                                      </div>
                                    )}
                                    {log.browser && (
                                      <div>
                                        <span className="text-muted-foreground">Browser</span>
                                        <p className="font-medium">{log.browser}</p>
                                      </div>
                                    )}
                                    {log.device_type && (
                                      <div>
                                        <span className="text-muted-foreground">Device</span>
                                        <p className="font-medium capitalize">{log.device_type}</p>
                                      </div>
                                    )}
                                    {log.session_id && (
                                      <div>
                                        <span className="text-muted-foreground">Session</span>
                                        <p className="font-medium font-mono text-[10px]">{log.session_id.slice(0, 8)}…</p>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          )}
                        </>
                      </Collapsible>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {filteredDownloads.length > 0 && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Showing {filteredDownloads.length} of {downloads.length} downloads
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
