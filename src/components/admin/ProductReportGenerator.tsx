import { useState } from 'react';
import { Package, Download, Loader2, Calendar, Filter, BarChart3 } from 'lucide-react';
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

interface ProductReportData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  organization_id: string | null;
  parent_brand_id: string | null;
  parent_brand_name: string | null;
  is_suite_master: boolean;
  sections_count: number;
  colors_count: number;
  fonts_count: number;
  has_logo: boolean;
  has_tagline: boolean;
  completeness_score: number;
}

interface ReportSummary {
  totalProducts: number;
  publicProducts: number;
  avgCompleteness: number;
  productsWithLogos: number;
  suiteMasters: number;
  topBrands: { name: string; productCount: number }[];
  recentlyCreated: number;
  recentlyUpdated: number;
}

export function ProductReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ProductReportData[] | null>(null);
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
          dateFilter = new Date(0);
      }

      let query = supabase
        .from('products')
        .select('id, name, created_at, updated_at, is_public, organization_id, parent_brand_id, is_suite_master, guide_data')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (reportType === 'public') {
        query = query.eq('is_public', true);
      } else if (reportType === 'private') {
        query = query.eq('is_public', false);
      }

      const { data: products, error } = await query;

      if (error) throw error;

      // Fetch parent brand names
      const brandIds = [...new Set((products || []).filter(p => p.parent_brand_id).map(p => p.parent_brand_id))];
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .in('id', brandIds as string[]);

      const brandMap = new Map(brands?.map(b => [b.id, b.name]) || []);

      // Process product data
      const processedProducts: ProductReportData[] = (products || []).map(product => {
        const guideData = product.guide_data as Record<string, unknown> || {};
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
          id: product.id,
          name: product.name,
          created_at: product.created_at,
          updated_at: product.updated_at,
          is_public: product.is_public,
          organization_id: product.organization_id,
          parent_brand_id: product.parent_brand_id,
          parent_brand_name: product.parent_brand_id ? brandMap.get(product.parent_brand_id) || null : null,
          is_suite_master: product.is_suite_master,
          sections_count: Object.keys(guideData).length,
          colors_count: colors.length,
          fonts_count: typography.length,
          has_logo: !!logo.primaryUrl,
          has_tagline: !!hero.tagline,
          completeness_score: score,
        };
      });

      // Calculate summary
      const weekAgo = subDays(new Date(), 7).toISOString();
      const recentlyCreated = processedProducts.filter(p => p.created_at >= weekAgo).length;
      const recentlyUpdated = processedProducts.filter(p => p.updated_at >= weekAgo).length;

      // Top brands by product count
      const brandCounts = new Map<string, number>();
      processedProducts.forEach(p => {
        if (p.parent_brand_name) {
          brandCounts.set(p.parent_brand_name, (brandCounts.get(p.parent_brand_name) || 0) + 1);
        }
      });

      const topBrands = Array.from(brandCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, productCount: count }));

      setSummary({
        totalProducts: processedProducts.length,
        publicProducts: processedProducts.filter(p => p.is_public).length,
        avgCompleteness: processedProducts.length > 0 
          ? Math.round(processedProducts.reduce((acc, p) => acc + p.completeness_score, 0) / processedProducts.length)
          : 0,
        productsWithLogos: processedProducts.filter(p => p.has_logo).length,
        suiteMasters: processedProducts.filter(p => p.is_suite_master).length,
        topBrands,
        recentlyCreated,
        recentlyUpdated,
      });

      setReportData(processedProducts);
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

    const headers = ['Name', 'Parent Brand', 'Created', 'Updated', 'Public', 'Suite Master', 'Colors', 'Fonts', 'Has Logo', 'Completeness Score'];
    const rows = reportData.map(p => [
      p.name,
      p.parent_brand_name || 'None',
      format(new Date(p.created_at), 'yyyy-MM-dd'),
      format(new Date(p.updated_at), 'yyyy-MM-dd'),
      p.is_public ? 'Yes' : 'No',
      p.is_suite_master ? 'Yes' : 'No',
      p.colors_count.toString(),
      p.fonts_count.toString(),
      p.has_logo ? 'Yes' : 'No',
      p.completeness_score.toString() + '%',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Reports
        </CardTitle>
        <CardDescription>Generate and download comprehensive product analytics reports</CardDescription>
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
              <SelectItem value="all">All Products</SelectItem>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.publicProducts}</p>
              <p className="text-sm text-muted-foreground">Public</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.avgCompleteness}%</p>
              <p className="text-sm text-muted-foreground">Avg Completeness</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.productsWithLogos}</p>
              <p className="text-sm text-muted-foreground">With Logos</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.suiteMasters}</p>
              <p className="text-sm text-muted-foreground">Suite Masters</p>
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

        {/* Top Brands */}
        {summary && summary.topBrands.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Top Brands by Product Count</h4>
            <div className="flex flex-wrap gap-2">
              {summary.topBrands.map((brand, i) => (
                <Badge key={i} variant="outline">
                  {brand.name}: {brand.productCount} products
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Product Table */}
        {reportData && reportData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Product Details ({reportData.length})</h4>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-4 space-y-2">
                {reportData.slice(0, 50).map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.name}</p>
                        {product.is_suite_master && (
                          <Badge variant="secondary" className="text-xs">Suite Master</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {product.parent_brand_name ? `${product.parent_brand_name} • ` : ''}
                        Created {format(new Date(product.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.is_public ? 'default' : 'secondary'}>
                        {product.is_public ? 'Public' : 'Private'}
                      </Badge>
                      <Badge variant="outline" className={
                        product.completeness_score >= 80 ? 'border-green-500 text-green-600' :
                        product.completeness_score >= 50 ? 'border-yellow-500 text-yellow-600' :
                        'border-red-500 text-red-600'
                      }>
                        {product.completeness_score}%
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
              brands={reportData.map(p => ({ id: p.id, name: p.name }))} 
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
