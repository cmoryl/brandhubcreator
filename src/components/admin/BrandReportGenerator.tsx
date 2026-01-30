import { useState } from 'react';
import { FileText, Download, Loader2, Calendar, Filter, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import { CustomPromptRunner } from './CustomPromptRunner';

interface BrandReportData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  organization_id: string | null;
  sections_count: number;
  colors_count: number;
  fonts_count: number;
  has_logo: boolean;
  has_tagline: boolean;
  completeness_score: number;
}

interface ReportSummary {
  totalBrands: number;
  publicBrands: number;
  avgCompleteness: number;
  brandsWithLogos: number;
  topOrganizations: { name: string; brandCount: number }[];
  recentlyCreated: number;
  recentlyUpdated: number;
}

export function BrandReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<BrandReportData[] | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState<'all' | 'public' | 'private'>('all');

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let dateFilter = new Date();
      switch (dateRange) {
        case '7d':
          dateFilter = subDays(new Date(), 7);
          break;
        case '30d':
          dateFilter = subDays(new Date(), 30);
          break;
        case '90d':
          dateFilter = subDays(new Date(), 90);
          break;
        case '1y':
          dateFilter = subMonths(new Date(), 12);
          break;
        default:
          dateFilter = new Date(0); // All time
      }

      let query = supabase
        .from('brands')
        .select('id, name, created_at, updated_at, is_public, organization_id, guide_data')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (reportType === 'public') {
        query = query.eq('is_public', true);
      } else if (reportType === 'private') {
        query = query.eq('is_public', false);
      }

      const { data: brands, error } = await query;

      if (error) throw error;

      // Process brand data
      const processedBrands: BrandReportData[] = (brands || []).map(brand => {
        const guideData = brand.guide_data as Record<string, unknown> || {};
        const hero = guideData.hero as Record<string, unknown> || {};
        const colors = (guideData.colors as unknown[]) || [];
        const typography = (guideData.typography as unknown[]) || [];
        const logo = guideData.logo as Record<string, unknown> || {};

        // Calculate completeness score
        let score = 0;
        if (hero.name) score += 15;
        if (hero.tagline) score += 10;
        if (logo.primaryUrl) score += 20;
        if (colors.length > 0) score += 15;
        if (typography.length > 0) score += 15;
        if (guideData.identity) score += 10;
        if (guideData.values) score += 10;
        if (guideData.patterns) score += 5;

        return {
          id: brand.id,
          name: brand.name,
          created_at: brand.created_at,
          updated_at: brand.updated_at,
          is_public: brand.is_public,
          organization_id: brand.organization_id,
          sections_count: Object.keys(guideData).length,
          colors_count: colors.length,
          fonts_count: typography.length,
          has_logo: !!logo.primaryUrl,
          has_tagline: !!hero.tagline,
          completeness_score: score,
        };
      });

      // Get organization names
      const orgIds = [...new Set(processedBrands.filter(b => b.organization_id).map(b => b.organization_id))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds as string[]);

      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);

      // Calculate summary
      const weekAgo = subDays(new Date(), 7).toISOString();
      const recentlyCreated = processedBrands.filter(b => b.created_at >= weekAgo).length;
      const recentlyUpdated = processedBrands.filter(b => b.updated_at >= weekAgo).length;

      // Top organizations by brand count
      const orgCounts = new Map<string, number>();
      processedBrands.forEach(b => {
        if (b.organization_id) {
          orgCounts.set(b.organization_id, (orgCounts.get(b.organization_id) || 0) + 1);
        }
      });

      const topOrgs = Array.from(orgCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ name: orgMap.get(id) || 'Unknown', brandCount: count }));

      setSummary({
        totalBrands: processedBrands.length,
        publicBrands: processedBrands.filter(b => b.is_public).length,
        avgCompleteness: processedBrands.length > 0 
          ? Math.round(processedBrands.reduce((acc, b) => acc + b.completeness_score, 0) / processedBrands.length)
          : 0,
        brandsWithLogos: processedBrands.filter(b => b.has_logo).length,
        topOrganizations: topOrgs,
        recentlyCreated,
        recentlyUpdated,
      });

      setReportData(processedBrands);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;

    const headers = ['Name', 'Created', 'Updated', 'Public', 'Colors', 'Fonts', 'Has Logo', 'Has Tagline', 'Completeness Score'];
    const rows = reportData.map(b => [
      b.name,
      format(new Date(b.created_at), 'yyyy-MM-dd'),
      format(new Date(b.updated_at), 'yyyy-MM-dd'),
      b.is_public ? 'Yes' : 'No',
      b.colors_count.toString(),
      b.fonts_count.toString(),
      b.has_logo ? 'Yes' : 'No',
      b.has_tagline ? 'Yes' : 'No',
      b.completeness_score.toString() + '%',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Brand Reports
        </CardTitle>
        <CardDescription>Generate and download comprehensive brand analytics reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Controls */}
        <div className="flex flex-wrap gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={(v) => setReportType(v as 'all' | 'public' | 'private')}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="private">Private Only</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>

          {reportData && (
            <Button variant="outline" onClick={downloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.totalBrands}</p>
              <p className="text-sm text-muted-foreground">Total Brands</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.publicBrands}</p>
              <p className="text-sm text-muted-foreground">Public</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.avgCompleteness}%</p>
              <p className="text-sm text-muted-foreground">Avg Completeness</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.brandsWithLogos}</p>
              <p className="text-sm text-muted-foreground">With Logos</p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {summary && (
          <div className="flex gap-4 flex-wrap">
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              +{summary.recentlyCreated} created this week
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
              {summary.recentlyUpdated} updated this week
            </Badge>
          </div>
        )}

        {/* Top Organizations */}
        {summary && summary.topOrganizations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top Organizations by Brand Count</h4>
            <div className="flex flex-wrap gap-2">
              {summary.topOrganizations.map((org, i) => (
                <Badge key={i} variant="outline">
                  {org.name}: {org.brandCount} brands
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Brand Table */}
        {reportData && reportData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Brand Details ({reportData.length})</h4>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                {reportData.slice(0, 50).map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(brand.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={brand.is_public ? 'default' : 'secondary'}>
                        {brand.is_public ? 'Public' : 'Private'}
                      </Badge>
                      <Badge variant="outline" className={
                        brand.completeness_score >= 80 ? 'border-green-500 text-green-600' :
                        brand.completeness_score >= 50 ? 'border-yellow-500 text-yellow-600' :
                        'border-red-500 text-red-600'
                      }>
                        {brand.completeness_score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Custom AI Prompt Section */}
        {reportData && reportData.length > 0 && (
          <>
            <Separator className="my-6" />
            <CustomPromptRunner 
              brands={reportData.map(b => ({ id: b.id, name: b.name }))} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
