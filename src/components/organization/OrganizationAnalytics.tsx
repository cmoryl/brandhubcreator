/**
 * OrganizationAnalytics Component
 * Displays analytics dashboard with brand views, user activity, and usage trends
 * Includes CSV and PDF export functionality
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart,
  Bar,
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
  Download,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { LocationAnalytics } from './LocationAnalytics';
import {
  PDF_FONTS,
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  PDF_SPACING,
  PDF_PAPER_CONFIGS,
  applyPdfContainerStyles,
} from '@/lib/pdfStyleConfig';

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [entityCounts, setEntityCounts] = useState<EntityCount>({ brands: 0, products: 0, events: 0, members: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [contentDistribution, setContentDistribution] = useState<ContentDistribution[]>([]);
  const [growthData, setGrowthData] = useState<{ date: string; total: number }[]>([]);
  const [publicVsPrivate, setPublicVsPrivate] = useState({ public: 0, private: 0 });
  const analyticsRef = useRef<HTMLDivElement>(null);

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

      // Fetch page_views for real view counts and audit_logs for edits/exports
      const [pageViewsRes, auditLogsRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('id, entity_type, entity_name, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('audit_logs_safe' as 'audit_logs')
          .select('id, action_type, entity_type, entity_name, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

      const pageViews = pageViewsRes.data || [];
      const auditLogs = auditLogsRes.data || [];

      // Process activity data by date
      const dateInterval = eachDayOfInterval({
        start: startDate,
        end: new Date(),
      });

      const activityByDate = dateInterval.map(date => {
        const dateStr = format(date, 'MMM dd');
        
        const dayViews = pageViews.filter(pv => {
          const pvDate = format(parseISO(pv.created_at), 'MMM dd');
          return pvDate === dateStr;
        });
        
        const dayLogs = auditLogs.filter(log => {
          const logDate = format(parseISO(log.created_at), 'MMM dd');
          return logDate === dateStr;
        });

        return {
          date: dateStr,
          views: dayViews.length,
          edits: dayLogs.filter(l => l.action_type === 'update' || l.action_type === 'create').length,
          exports: dayLogs.filter(l => l.action_type === 'export').length,
        };
      });

      setActivityData(activityByDate.slice(-14)); // Last 14 days for chart

      // Recent activity - combine page views and audit logs
      const combinedActivity: RecentActivity[] = [
        ...pageViews.slice(0, 20).map(pv => ({
          id: pv.id,
          actionType: 'view',
          entityType: pv.entity_type,
          entityName: pv.entity_name || 'Page',
          createdAt: pv.created_at,
        })),
        ...auditLogs.slice(0, 20).map(log => ({
          id: log.id,
          actionType: log.action_type,
          entityType: log.entity_type,
          entityName: log.entity_name || 'Unknown',
          createdAt: log.created_at,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
      
      setRecentActivity(combinedActivity);

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

  // CSV Export
  const exportToCSV = () => {
    if (!organization) return;
    
    setIsExporting(true);
    try {
      const reportDate = format(new Date(), 'yyyy-MM-dd');
      const dateRangeLabel = dateRange === '7' ? '7 days' : dateRange === '30' ? '30 days' : '90 days';
      
      // Build CSV content
      let csvContent = '';
      
      // Header
      csvContent += `Organization Analytics Report\n`;
      csvContent += `Organization: ${organization.name}\n`;
      csvContent += `Report Date: ${reportDate}\n`;
      csvContent += `Date Range: Last ${dateRangeLabel}\n\n`;
      
      // Summary Metrics
      csvContent += `SUMMARY METRICS\n`;
      csvContent += `Metric,Value\n`;
      csvContent += `Total Brands,${entityCounts.brands}\n`;
      csvContent += `Total Products,${entityCounts.products}\n`;
      csvContent += `Total Events,${entityCounts.events}\n`;
      csvContent += `Team Members,${entityCounts.members}\n`;
      csvContent += `Public Content,${publicVsPrivate.public}\n`;
      csvContent += `Private Content,${publicVsPrivate.private}\n\n`;
      
      // Daily Activity
      csvContent += `DAILY ACTIVITY\n`;
      csvContent += `Date,Views,Edits,Exports\n`;
      activityData.forEach(day => {
        csvContent += `${day.date},${day.views},${day.edits},${day.exports}\n`;
      });
      csvContent += `\n`;
      
      // Content Growth
      csvContent += `CONTENT GROWTH\n`;
      csvContent += `Date,Total Content\n`;
      growthData.forEach(day => {
        csvContent += `${day.date},${day.total}\n`;
      });
      csvContent += `\n`;
      
      // Recent Activity
      csvContent += `RECENT ACTIVITY\n`;
      csvContent += `Timestamp,Action,Entity Type,Entity Name\n`;
      recentActivity.forEach(activity => {
        const timestamp = format(parseISO(activity.createdAt), 'yyyy-MM-dd HH:mm');
        csvContent += `${timestamp},${activity.actionType},${activity.entityType},"${activity.entityName}"\n`;
      });
      
      // Create and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${organization.slug}-analytics-${reportDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'CSV Exported',
        description: 'Analytics data has been downloaded as CSV.',
      });
    } catch (error) {
      console.error('[Analytics] CSV export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export
  const exportToPDF = async () => {
    if (!organization) return;
    
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const reportDate = format(new Date(), 'MMMM d, yyyy');
      const dateRangeLabel = dateRange === '7' ? '7 days' : dateRange === '30' ? '30 days' : '90 days';
      
      // Create PDF content with consistent styling
      const pdfContent = document.createElement('div');
      applyPdfContainerStyles(pdfContent, 'letter');
      pdfContent.style.padding = PDF_SPACING['4xl'];
      pdfContent.style.fontFamily = PDF_FONTS.primary;
      pdfContent.style.color = PDF_COLORS.text.primary;
      pdfContent.style.backgroundColor = PDF_COLORS.background.white;
      
      pdfContent.innerHTML = `
        <div style="margin-bottom: ${PDF_SPACING['3xl']};">
          <h1 style="font-size: ${PDF_TYPOGRAPHY.h1.size}; font-weight: ${PDF_TYPOGRAPHY.h1.weight}; margin: 0 0 8px 0; color: ${PDF_COLORS.text.primary};">
            📊 Analytics Report
          </h1>
          <p style="font-size: ${PDF_TYPOGRAPHY.h4.size}; color: ${PDF_COLORS.text.muted}; margin: 0;">
            ${organization.name} • Last ${dateRangeLabel}
          </p>
          <p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.subtle}; margin-top: ${PDF_SPACING.xs};">
            Generated on ${reportDate}
          </p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${PDF_SPACING.lg}; margin-bottom: ${PDF_SPACING['3xl']};">
          <div style="background: ${PDF_COLORS.background.muted}; padding: ${PDF_SPACING.lg}; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; margin: 0; color: #6366f1;">${entityCounts.brands}</p>
            <p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.muted}; margin: ${PDF_SPACING.xs} 0 0 0;">Brands</p>
          </div>
          <div style="background: ${PDF_COLORS.background.muted}; padding: ${PDF_SPACING.lg}; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; margin: 0; color: #8b5cf6;">${entityCounts.products}</p>
            <p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.muted}; margin: ${PDF_SPACING.xs} 0 0 0;">Products</p>
          </div>
          <div style="background: ${PDF_COLORS.background.muted}; padding: ${PDF_SPACING.lg}; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; margin: 0; color: ${PDF_COLORS.accent.warning};">${entityCounts.events}</p>
            <p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.muted}; margin: ${PDF_SPACING.xs} 0 0 0;">Events</p>
          </div>
          <div style="background: ${PDF_COLORS.background.muted}; padding: ${PDF_SPACING.lg}; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; margin: 0; color: ${PDF_COLORS.accent.success};">${entityCounts.members}</p>
            <p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.muted}; margin: ${PDF_SPACING.xs} 0 0 0;">Team Members</p>
          </div>
        </div>
        
        <div style="margin-bottom: ${PDF_SPACING['3xl']};">
          <h2 style="font-size: ${PDF_TYPOGRAPHY.h3.size}; font-weight: ${PDF_TYPOGRAPHY.h3.weight}; margin: 0 0 ${PDF_SPACING.lg} 0; color: ${PDF_COLORS.text.primary};">
            Content Visibility
          </h2>
          <div style="display: flex; gap: ${PDF_SPACING['2xl']};">
            <div style="display: flex; align-items: center; gap: ${PDF_SPACING.sm};">
              <span style="width: 12px; height: 12px; background: ${PDF_COLORS.accent.success}; border-radius: 50%;"></span>
              <span style="font-size: ${PDF_TYPOGRAPHY.body.size};">Public: ${publicVsPrivate.public}</span>
            </div>
            <div style="display: flex; align-items: center; gap: ${PDF_SPACING.sm};">
              <span style="width: 12px; height: 12px; background: ${PDF_COLORS.text.muted}; border-radius: 50%;"></span>
              <span style="font-size: ${PDF_TYPOGRAPHY.body.size};">Private: ${publicVsPrivate.private}</span>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: ${PDF_SPACING['3xl']};">
          <h2 style="font-size: ${PDF_TYPOGRAPHY.h3.size}; font-weight: ${PDF_TYPOGRAPHY.h3.weight}; margin: 0 0 ${PDF_SPACING.lg} 0; color: ${PDF_COLORS.text.primary};">
            Daily Activity Summary
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: ${PDF_TYPOGRAPHY.small.size};">
            <thead>
              <tr style="background: ${PDF_COLORS.background.light};">
                <th style="text-align: left; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Date</th>
                <th style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Views</th>
                <th style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Edits</th>
                <th style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Exports</th>
              </tr>
            </thead>
            <tbody>
              ${activityData.slice(-7).map(day => `
                <tr>
                  <td style="padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${day.date}</td>
                  <td style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${day.views}</td>
                  <td style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${day.edits}</td>
                  <td style="text-align: right; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${day.exports}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-bottom: ${PDF_SPACING['3xl']};">
          <h2 style="font-size: ${PDF_TYPOGRAPHY.h3.size}; font-weight: ${PDF_TYPOGRAPHY.h3.weight}; margin: 0 0 ${PDF_SPACING.lg} 0; color: ${PDF_COLORS.text.primary};">
            Recent Activity
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: ${PDF_TYPOGRAPHY.small.size};">
            <thead>
              <tr style="background: ${PDF_COLORS.background.light};">
                <th style="text-align: left; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Time</th>
                <th style="text-align: left; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Action</th>
                <th style="text-align: left; padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.light};">Entity</th>
              </tr>
            </thead>
            <tbody>
              ${recentActivity.slice(0, 10).map(activity => `
                <tr>
                  <td style="padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${format(parseISO(activity.createdAt), 'MMM d, h:mm a')}</td>
                  <td style="padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter}; text-transform: capitalize;">${activity.actionType}</td>
                  <td style="padding: ${PDF_SPACING.sm} ${PDF_SPACING.md}; border-bottom: 1px solid ${PDF_COLORS.border.lighter};">${activity.entityName} (${activity.entityType})</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: ${PDF_SPACING['4xl']}; padding-top: ${PDF_SPACING.lg}; border-top: 1px solid ${PDF_COLORS.border.light}; text-align: center;">
          <p style="font-size: ${PDF_TYPOGRAPHY.tiny.size}; color: ${PDF_COLORS.text.subtle}; margin: 0;">
            Generated by BrandHub Analytics • ${reportDate}
          </p>
        </div>
      `;
      
      // Append to DOM for html2canvas to work properly
      document.body.appendChild(pdfContent);
      
      // Force layout calculation
      pdfContent.offsetHeight;
      
      const opt = {
        margin: PDF_PAPER_CONFIGS.letter.margins,
        filename: `${organization.slug}-analytics-report.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: PDF_COLORS.background.white },
        jsPDF: { ...PDF_PAPER_CONFIGS.letter.jsPDF, compress: true },
      };
      
      try {
        await html2pdf().set(opt).from(pdfContent).save();
      } finally {
        document.body.removeChild(pdfContent);
      }
      
      toast({
        title: 'PDF Exported',
        description: 'Analytics report has been downloaded as PDF.',
      });
    } catch (error) {
      console.error('[Analytics] PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
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
    <Card ref={analyticsRef}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>Track usage, activity, and growth metrics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting || isLoading}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
                <TabsTrigger value="growth" className="text-xs sm:text-sm">Growth</TabsTrigger>
                <TabsTrigger value="location" className="text-xs sm:text-sm">Location</TabsTrigger>
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

              <TabsContent value="location" className="pt-4">
                <LocationAnalytics organizationId={organization?.id} dateRange={dateRange} />
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
