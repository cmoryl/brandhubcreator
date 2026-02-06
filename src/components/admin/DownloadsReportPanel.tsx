/**
 * DownloadsReportPanel - Admin component for viewing export/download activity
 * Tracks PDF exports, asset downloads, and backup downloads across the platform
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
  Download, 
  FileText, 
  Image, 
  Archive, 
  RefreshCw, 
  Search,
  TrendingUp,
  Calendar,
  User,
  Filter,
  BarChart3,
  FileDown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

interface DownloadLog {
  id: string;
  user_id: string;
  user_email: string | null;
  entity_type: string;
  entity_name: string | null;
  action_type: string;
  details: {
    download_type?: string;
    format?: string;
    file_name?: string;
    sections_count?: number;
    paper_size?: string;
    theme?: string;
  } | null;
  created_at: string;
}

interface DownloadStats {
  total: number;
  pdf: number;
  asset: number;
  backup: number;
  byDay: { date: string; count: number }[];
}

export function DownloadsReportPanel() {
  const [downloads, setDownloads] = useState<DownloadLog[]>([]);
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchDownloads = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(dateRange.replace('d', ''));
      const startDate = subDays(new Date(), days).toISOString();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, user_email, entity_type, entity_name, action_type, details, created_at')
        .eq('action_type', 'export')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const logs = (data || []).map(log => ({
        ...log,
        details: log.details as DownloadLog['details'],
      }));

      setDownloads(logs);

      // Calculate stats
      const pdfCount = logs.filter(l => l.details?.download_type === 'pdf' || l.entity_type === 'pdf').length;
      const assetCount = logs.filter(l => l.details?.download_type === 'asset' || ['logo', 'pattern', 'icon'].includes(l.entity_type)).length;
      const backupCount = logs.filter(l => l.details?.download_type === 'backup' || l.entity_type === 'backup').length;

      // Group by day
      const byDayMap = new Map<string, number>();
      logs.forEach(log => {
        const day = format(new Date(log.created_at), 'yyyy-MM-dd');
        byDayMap.set(day, (byDayMap.get(day) || 0) + 1);
      });
      const byDay = Array.from(byDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        total: logs.length,
        pdf: pdfCount,
        asset: assetCount,
        backup: backupCount,
        byDay,
      });
    } catch (error) {
      console.error('Error fetching downloads:', error);
      toast.error('Failed to load download history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [dateRange]);

  const filteredDownloads = useMemo(() => {
    return downloads.filter(log => {
      // Search filter
      const matchesSearch = !searchTerm || 
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' ||
        (filterType === 'pdf' && (log.details?.download_type === 'pdf' || log.entity_type === 'pdf')) ||
        (filterType === 'asset' && (log.details?.download_type === 'asset' || ['logo', 'pattern', 'icon'].includes(log.entity_type))) ||
        (filterType === 'backup' && (log.details?.download_type === 'backup' || log.entity_type === 'backup'));

      return matchesSearch && matchesType;
    });
  }, [downloads, searchTerm, filterType]);

  const getDownloadIcon = (log: DownloadLog) => {
    const type = log.details?.download_type || log.entity_type;
    if (type === 'pdf' || log.entity_type === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['logo', 'pattern', 'icon', 'asset'].includes(type)) return <Image className="h-4 w-4 text-blue-500" />;
    if (type === 'backup') return <Archive className="h-4 w-4 text-amber-500" />;
    return <Download className="h-4 w-4 text-muted-foreground" />;
  };

  const getDownloadBadge = (log: DownloadLog) => {
    const type = log.details?.download_type || log.entity_type;
    if (type === 'pdf' || log.entity_type === 'pdf') {
      return <Badge variant="outline" className="text-red-600 border-red-200">PDF</Badge>;
    }
    if (['logo', 'pattern', 'icon'].includes(log.entity_type)) {
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Asset</Badge>;
    }
    if (log.details?.download_type === 'asset') {
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Asset</Badge>;
    }
    if (type === 'backup') {
      return <Badge variant="outline" className="text-amber-600 border-amber-200">Backup</Badge>;
    }
    return <Badge variant="outline">Export</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <FileText className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pdf || 0}</p>
                <p className="text-xs text-muted-foreground">PDF Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Image className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.asset || 0}</p>
                <p className="text-xs text-muted-foreground">Asset Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Archive className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.backup || 0}</p>
                <p className="text-xs text-muted-foreground">Backup Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Download History
              </CardTitle>
              <CardDescription>
                Track all exports and downloads across the platform
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDownloads} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, user, or type..."
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
                <SelectItem value="backup">Backups</SelectItem>
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
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDownloads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {isLoading ? 'Loading...' : 'No download history found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDownloads.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDownloadIcon(log)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.entity_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground capitalize">{log.entity_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{log.user_email || 'Unknown user'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDownloadBadge(log)}
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
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </TableCell>
                    </TableRow>
                  ))
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
