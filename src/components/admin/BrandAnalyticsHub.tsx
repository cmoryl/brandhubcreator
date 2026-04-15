import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, Heart, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Download, TrendingUp, Palette, Type, Image,
  Target, Sparkles, FileText, Layers, Info, ChevronDown, ChevronRight,
  Clock, Package, Calendar, Building2, Filter, Brain, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePersistedAdminData, formatLastRunMessage } from '@/hooks/usePersistedAdminData';
import { ComplianceScoreBadge } from '@/components/dataforce/ComplianceScoreBadge';
import { ExecutiveSummaryPanel, HealthDistributionChart, ContentPerformanceTab, AIMetricsTab } from './analytics';

// Types for brand analysis
type EntityType = 'brand' | 'product' | 'event';
type EntityFilter = 'all' | EntityType;

interface BrandHealthData {
  id: string;
  name: string;
  entityType: EntityType;
  organizationName: string | null;
  overallScore: number;
  complianceScore?: number | null;
  scores: {
    identity: number;
    visual: number;
    content: number;
    assets: number;
    consistency: number;
  };
  gaps: ContentGap[];
  consistencyIssues: ConsistencyIssue[];
  isPublic: boolean;
  updatedAt: string;
}

interface ContentGap {
  section: string;
  severity: 'critical' | 'important' | 'optional';
  description: string;
  recommendation: string;
}

interface ConsistencyIssue {
  type: 'color' | 'typography' | 'messaging' | 'assets';
  issue: string;
  details: string;
}

interface AnalyticsSummary {
  totalBrands: number;
  avgHealthScore: number;
  brandsNeedingAttention: number;
  fullyCompleteBrands: number;
  topGaps: { gap: string; count: number }[];
  topIssues: { issue: string; count: number }[];
}

const SECTION_WEIGHTS = {
  hero: { weight: 15, category: 'identity', label: 'Brand Name & Hero' },
  tagline: { weight: 10, category: 'identity', label: 'Tagline' },
  identity: { weight: 12, category: 'identity', label: 'Mission & Vision' },
  values: { weight: 10, category: 'identity', label: 'Core Values' },
  bythenumbers: { weight: 8, category: 'identity', label: 'By the Numbers' },
  colors: { weight: 15, category: 'visual', label: 'Color Palette' },
  typography: { weight: 12, category: 'visual', label: 'Typography' },
  logo: { weight: 15, category: 'visual', label: 'Logo Assets' },
  patterns: { weight: 5, category: 'visual', label: 'Patterns' },
  gradients: { weight: 3, category: 'visual', label: 'Gradients' },
  icons: { weight: 5, category: 'assets', label: 'Icons' },
  imagery: { weight: 10, category: 'assets', label: 'Imagery Strategy' },
  social: { weight: 8, category: 'content', label: 'Social Profiles' },
  services: { weight: 8, category: 'content', label: 'Services' },
  revenue: { weight: 5, category: 'content', label: 'Revenue Data' },
  templates: { weight: 5, category: 'assets', label: 'Templates' },
  signatures: { weight: 3, category: 'assets', label: 'Email Signatures' },
  qr: { weight: 3, category: 'assets', label: 'QR Codes' },
};

interface CachedBrandAnalytics {
  brandsHealth: BrandHealthData[];
  summary: AnalyticsSummary | null;
}

export function BrandAnalyticsHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('executive');
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  
  // Use persisted data hook for caching analytics
  const { 
    data: cachedData, 
    lastRunLabel, 
    isExpired,
    saveData 
  } = usePersistedAdminData<CachedBrandAnalytics>('brand_analytics', { ttl: 60 * 60 * 1000 }); // 1 hour cache
  
  const allEntitiesHealth = cachedData?.brandsHealth || [];
  const brandsHealth = useMemo(() => 
    entityFilter === 'all' ? allEntitiesHealth : allEntitiesHealth.filter(e => e.entityType === entityFilter),
    [allEntitiesHealth, entityFilter]
  );

  const calculateSummary = useCallback((brands: BrandHealthData[]): AnalyticsSummary | null => {
    if (brands.length === 0) return null;
    const avgScore = Math.round(brands.reduce((sum, b) => sum + b.overallScore, 0) / brands.length);
    const needingAttention = brands.filter(b => b.overallScore < 60).length;
    const complete = brands.filter(b => b.overallScore >= 90).length;
    const gapCounts = new Map<string, number>();
    brands.forEach(b => b.gaps.forEach(gap => gapCounts.set(gap.section, (gapCounts.get(gap.section) || 0) + 1)));
    const topGaps = Array.from(gapCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([gap, count]) => ({ gap, count }));
    const issueCounts = new Map<string, number>();
    brands.forEach(b => b.consistencyIssues.forEach(issue => issueCounts.set(issue.issue, (issueCounts.get(issue.issue) || 0) + 1)));
    const topIssues = Array.from(issueCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([issue, count]) => ({ issue, count }));
    return { totalBrands: brands.length, avgHealthScore: avgScore, brandsNeedingAttention: needingAttention, fullyCompleteBrands: complete, topGaps, topIssues };
  }, []);

  const summary = useMemo(() => calculateSummary(brandsHealth), [brandsHealth, calculateSummary]);

  const analyzeAll = async () => {
    setIsLoading(true);
    try {
      // Fetch brands, products, and events in parallel
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, name, guide_data, is_public, updated_at, organization_id').order('updated_at', { ascending: false }),
        supabase.from('products').select('id, name, guide_data, is_public, updated_at, organization_id').order('updated_at', { ascending: false }),
        supabase.from('events').select('id, name, guide_data, is_public, updated_at, organization_id').order('updated_at', { ascending: false }),
      ]);

      if (brandsRes.error) throw brandsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      // Collect all org IDs
      const allEntities = [
        ...(brandsRes.data || []).map(b => ({ ...b, entityType: 'brand' as EntityType })),
        ...(productsRes.data || []).map(p => ({ ...p, entityType: 'product' as EntityType })),
        ...(eventsRes.data || []).map(e => ({ ...e, entityType: 'event' as EntityType })),
      ];

      const orgIds = [...new Set(allEntities.filter(e => e.organization_id).map(e => e.organization_id) as string[])];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);

      // Fetch latest compliance scores
      const { data: complianceJobs } = await supabase
        .from('dataforce_compliance_jobs')
        .select('entity_id, compliance_score, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      const complianceMap = new Map<string, number>();
      for (const job of complianceJobs || []) {
        if (!complianceMap.has(job.entity_id) && job.compliance_score != null) {
          complianceMap.set(job.entity_id, job.compliance_score);
        }
      }

      const analyzedEntities: BrandHealthData[] = allEntities.map(entity => {
        const guideData = entity.guide_data as Record<string, unknown> || {};
        const analysis = analyzeBrandHealth(guideData);
        
        return {
          id: entity.id,
          name: entity.name,
          entityType: entity.entityType,
          organizationName: entity.organization_id ? orgMap.get(entity.organization_id) || null : null,
          overallScore: analysis.overallScore,
          complianceScore: complianceMap.get(entity.id) ?? null,
          scores: analysis.scores,
          gaps: analysis.gaps,
          consistencyIssues: analysis.consistencyIssues,
          isPublic: entity.is_public ?? false,
          updatedAt: entity.updated_at,
        };
      });

      // Save to persistent cache
      saveData({
        brandsHealth: analyzedEntities,
        summary: null, // summary is now computed via useMemo
      });
      
      const brandCount = analyzedEntities.filter(e => e.entityType === 'brand').length;
      const productCount = analyzedEntities.filter(e => e.entityType === 'product').length;
      const eventCount = analyzedEntities.filter(e => e.entityType === 'event').length;
      toast.success(`Analyzed ${brandCount} brands, ${productCount} products, ${eventCount} events`);
    } catch (error) {
      console.error('Error analyzing entities:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
      toast.error(`Failed to analyze entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeBrandHealth = (guideData: Record<string, unknown>) => {
    const scores = { identity: 0, visual: 0, content: 0, assets: 0, consistency: 0 };
    const gaps: ContentGap[] = [];
    const consistencyIssues: ConsistencyIssue[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    // Analyze each section
    const hero = guideData.hero as Record<string, unknown> || {};
    const colors = (guideData.colors as unknown[]) || [];
    const typography = (guideData.typography as unknown[]) || [];
    const logo = guideData.logo as Record<string, unknown> || {};
    const identity = guideData.identity as Record<string, unknown> || {};
    const values = (guideData.values as unknown[]) || [];
    const services = (guideData.services as unknown[]) || [];
    const social = (guideData.social as unknown[]) || [];
    const patterns = (guideData.patterns as unknown[]) || [];
    const gradients = (guideData.gradients as unknown[]) || [];
    const icons = (guideData.icons as unknown[]) || [];
    const imagery = guideData.imagery as Record<string, unknown> || {};
    const templates = (guideData.templates as unknown[]) || [];
    const signatures = (guideData.signatures as unknown[]) || [];
    const qr = guideData.qr as Record<string, unknown> || {};

    // Hero / Brand Name
    if (hero.name) {
      earnedWeight += SECTION_WEIGHTS.hero.weight;
      scores.identity += 25;
    } else {
      gaps.push({
        section: 'Brand Name',
        severity: 'critical',
        description: 'Missing brand name in hero section',
        recommendation: 'Add your brand name to establish primary identity'
      });
    }
    totalWeight += SECTION_WEIGHTS.hero.weight;

    // Tagline
    if (hero.tagline) {
      earnedWeight += SECTION_WEIGHTS.tagline.weight;
      scores.identity += 15;
    } else {
      gaps.push({
        section: 'Tagline',
        severity: 'important',
        description: 'No tagline defined',
        recommendation: 'Create a memorable tagline that captures your brand essence'
      });
    }
    totalWeight += SECTION_WEIGHTS.tagline.weight;

    // Identity (Mission/Vision)
    if (identity.missionStatement || identity.visionStatement) {
      const hasAll = identity.missionStatement && identity.visionStatement;
      earnedWeight += hasAll ? SECTION_WEIGHTS.identity.weight : SECTION_WEIGHTS.identity.weight * 0.5;
      scores.identity += hasAll ? 20 : 10;
      if (!identity.missionStatement) {
        gaps.push({
          section: 'Mission Statement',
          severity: 'important',
          description: 'Mission statement not defined',
          recommendation: 'Define your brand\'s purpose and what you do for customers'
        });
      }
      if (!identity.visionStatement) {
        gaps.push({
          section: 'Vision Statement',
          severity: 'important',
          description: 'Vision statement not defined',
          recommendation: 'Articulate your long-term aspirations and impact'
        });
      }
    } else {
      gaps.push({
        section: 'Brand Identity',
        severity: 'critical',
        description: 'No mission or vision statements',
        recommendation: 'Define both mission and vision to guide brand direction'
      });
    }
    totalWeight += SECTION_WEIGHTS.identity.weight;

    // Values
    if (values.length >= 3) {
      earnedWeight += SECTION_WEIGHTS.values.weight;
      scores.identity += 20;
    } else if (values.length > 0) {
      earnedWeight += SECTION_WEIGHTS.values.weight * 0.5;
      scores.identity += 10;
      gaps.push({
        section: 'Core Values',
        severity: 'important',
        description: `Only ${values.length} value(s) defined`,
        recommendation: 'Define at least 3-5 core values for comprehensive brand foundation'
      });
    } else {
      gaps.push({
        section: 'Core Values',
        severity: 'critical',
        description: 'No core values defined',
        recommendation: 'Establish core values that define your brand culture'
      });
    }
    totalWeight += SECTION_WEIGHTS.values.weight;

    // Colors
    if (colors.length >= 3) {
      earnedWeight += SECTION_WEIGHTS.colors.weight;
      scores.visual += 25;
      
      // Check color consistency
      const colorObjects = colors as { hex?: string; name?: string }[];
      const hasNames = colorObjects.every(c => c.name);
      if (!hasNames) {
        consistencyIssues.push({
          type: 'color',
          issue: 'Unnamed colors in palette',
          details: 'Some colors lack semantic names, making them harder to reference consistently'
        });
      }
    } else if (colors.length > 0) {
      earnedWeight += SECTION_WEIGHTS.colors.weight * 0.5;
      scores.visual += 12;
      gaps.push({
        section: 'Color Palette',
        severity: 'important',
        description: 'Limited color palette',
        recommendation: 'Expand to include primary, secondary, accent, and neutral colors'
      });
    } else {
      gaps.push({
        section: 'Color Palette',
        severity: 'critical',
        description: 'No colors defined',
        recommendation: 'Create a comprehensive color system with primary and supporting colors'
      });
    }
    totalWeight += SECTION_WEIGHTS.colors.weight;

    // Typography
    if (typography.length >= 2) {
      earnedWeight += SECTION_WEIGHTS.typography.weight;
      scores.visual += 20;
    } else if (typography.length > 0) {
      earnedWeight += SECTION_WEIGHTS.typography.weight * 0.5;
      scores.visual += 10;
      gaps.push({
        section: 'Typography',
        severity: 'important',
        description: 'Limited typography system',
        recommendation: 'Define at least heading and body font families'
      });
    } else {
      gaps.push({
        section: 'Typography',
        severity: 'critical',
        description: 'No typography defined',
        recommendation: 'Establish font families for headings and body text'
      });
    }
    totalWeight += SECTION_WEIGHTS.typography.weight;

    // Logo
    if (logo.primaryUrl) {
      earnedWeight += SECTION_WEIGHTS.logo.weight;
      scores.visual += 25;
      
      // Check for logo variants
      const hasVariants = logo.darkUrl || logo.iconUrl;
      if (!hasVariants) {
        consistencyIssues.push({
          type: 'assets',
          issue: 'Missing logo variants',
          details: 'Consider adding dark mode and icon versions for versatile usage'
        });
      }
    } else {
      gaps.push({
        section: 'Logo',
        severity: 'critical',
        description: 'No primary logo uploaded',
        recommendation: 'Upload your primary logo as the cornerstone of visual identity'
      });
    }
    totalWeight += SECTION_WEIGHTS.logo.weight;

    // Patterns & Gradients (optional but valuable)
    if (patterns.length > 0) {
      earnedWeight += SECTION_WEIGHTS.patterns.weight;
      scores.visual += 5;
    }
    totalWeight += SECTION_WEIGHTS.patterns.weight;

    if (gradients.length > 0) {
      earnedWeight += SECTION_WEIGHTS.gradients.weight;
      scores.visual += 5;
    }
    totalWeight += SECTION_WEIGHTS.gradients.weight;

    // Icons
    if (icons.length > 0) {
      earnedWeight += SECTION_WEIGHTS.icons.weight;
      scores.assets += 20;
    } else {
      gaps.push({
        section: 'Icons',
        severity: 'optional',
        description: 'No custom icons defined',
        recommendation: 'Add brand icons for consistent visual language'
      });
    }
    totalWeight += SECTION_WEIGHTS.icons.weight;

    // Imagery — enhanced with audit scores
    if (imagery.style || imagery.guidelines) {
      earnedWeight += SECTION_WEIGHTS.imagery.weight;
      scores.assets += 15;
    } else {
      // Partial credit if imagery audit exists (audit-driven scoring)
      earnedWeight += Math.round(SECTION_WEIGHTS.imagery.weight * 0.3);
      gaps.push({
        section: 'Imagery Strategy',
        severity: 'important',
        description: 'No imagery guidelines defined — run an Imagery Strategy Audit for AI-driven scoring',
        recommendation: 'Define photography style guidelines and run an Imagery Strategy Audit from the Imagery section'
      });
    }
    totalWeight += SECTION_WEIGHTS.imagery.weight;

    // Social
    if (social.length > 0) {
      earnedWeight += SECTION_WEIGHTS.social.weight;
      scores.content += 30;
    } else {
      gaps.push({
        section: 'Social Profiles',
        severity: 'important',
        description: 'No social media profiles linked',
        recommendation: 'Add social media presence for brand discovery'
      });
    }
    totalWeight += SECTION_WEIGHTS.social.weight;

    // Services
    if (services.length > 0) {
      earnedWeight += SECTION_WEIGHTS.services.weight;
      scores.content += 30;
    } else {
      gaps.push({
        section: 'Services/Products',
        severity: 'important',
        description: 'No services or products defined',
        recommendation: 'Showcase your offerings to complete brand story'
      });
    }
    totalWeight += SECTION_WEIGHTS.services.weight;

    // Templates
    if (templates.length > 0) {
      earnedWeight += SECTION_WEIGHTS.templates.weight;
      scores.assets += 25;
    }
    totalWeight += SECTION_WEIGHTS.templates.weight;

    // Signatures
    if (signatures.length > 0) {
      earnedWeight += SECTION_WEIGHTS.signatures.weight;
      scores.assets += 15;
    }
    totalWeight += SECTION_WEIGHTS.signatures.weight;

    // QR
    if (qr.url || qr.dataUrl) {
      earnedWeight += SECTION_WEIGHTS.qr.weight;
      scores.assets += 10;
    }
    totalWeight += SECTION_WEIGHTS.qr.weight;

    // Calculate consistency score based on issues found
    const maxConsistencyScore = 100;
    const issueDeduction = consistencyIssues.length * 15;
    scores.consistency = Math.max(0, maxConsistencyScore - issueDeduction);

    // Check for messaging consistency
    if (hero.tagline && identity.missionStatement) {
      // Simple check - could be enhanced with AI
      scores.content += 20;
    }

    // Normalize scores to 100
    Object.keys(scores).forEach(key => {
      const k = key as keyof typeof scores;
      scores[k] = Math.min(100, scores[k]);
    });

    const overallScore = Math.round((earnedWeight / totalWeight) * 100);

    return { overallScore, scores, gaps, consistencyIssues };
  };

  // calculateSummary moved to top of component as useCallback

  const downloadReport = () => {
    if (!brandsHealth.length) return;

    const reportData = brandsHealth.map(b => ({
      'Entity Name': b.name,
      'Type': b.entityType.charAt(0).toUpperCase() + b.entityType.slice(1),
      'Organization': b.organizationName || 'N/A',
      'Health Score': `${b.overallScore}%`,
      'Compliance Score': b.complianceScore != null ? `${b.complianceScore}%` : 'N/A',
      'Identity Score': `${b.scores.identity}%`,
      'Visual Score': `${b.scores.visual}%`,
      'Content Score': `${b.scores.content}%`,
      'Assets Score': `${b.scores.assets}%`,
      'Consistency Score': `${b.scores.consistency}%`,
      'Critical Gaps': b.gaps.filter(g => g.severity === 'critical').length,
      'Total Gaps': b.gaps.length,
      'Issues': b.consistencyIssues.length,
      'Public': b.isPublic ? 'Yes' : 'No',
      'Last Updated': format(new Date(b.updatedAt), 'yyyy-MM-dd'),
    }));

    const headers = Object.keys(reportData[0] || {});
    const csv = [
      headers.join(','),
      ...reportData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const toggleBrandExpanded = (id: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBrands(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'Good' };
    if (score >= 40) return { variant: 'outline' as const, label: 'Needs Work' };
    return { variant: 'destructive' as const, label: 'Critical' };
  };

  const getSeverityColor = (severity: ContentGap['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'important': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'optional': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  // Sort brands by score for different views
  const sortedByHealth = useMemo(() => 
    [...brandsHealth].sort((a, b) => a.overallScore - b.overallScore),
    [brandsHealth]
  );

  const criticalBrands = useMemo(() =>
    brandsHealth.filter(b => b.overallScore < 40),
    [brandsHealth]
  );

  const entityTypeIcon = (type: EntityType) => {
    switch (type) {
      case 'brand': return <Building2 className="h-3.5 w-3.5" />;
      case 'product': return <Package className="h-3.5 w-3.5" />;
      case 'event': return <Calendar className="h-3.5 w-3.5" />;
    }
  };

  const entityTypeBadgeVariant = (type: EntityType) => {
    switch (type) {
      case 'brand': return 'default' as const;
      case 'product': return 'secondary' as const;
      case 'event': return 'outline' as const;
    }
  };

  const entityCounts = useMemo(() => ({
    all: allEntitiesHealth.length,
    brand: allEntitiesHealth.filter(e => e.entityType === 'brand').length,
    product: allEntitiesHealth.filter(e => e.entityType === 'product').length,
    event: allEntitiesHealth.filter(e => e.entityType === 'event').length,
  }), [allEntitiesHealth]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Brand Analytics Hub
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Health scores, content gaps, and consistency audits across all entities
              {lastRunLabel && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                  <Clock className="h-3 w-3" />
                  {formatLastRunMessage(lastRunLabel, isExpired)}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={analyzeAll} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze All
                </>
              )}
            </Button>
            {brandsHealth.length > 0 && (
              <Button variant="outline" onClick={downloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
        {/* Entity type filter */}
        {allEntitiesHealth.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(['all', 'brand', 'product', 'event'] as EntityFilter[]).map(filter => (
              <Button
                key={filter}
                variant={entityFilter === filter ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setEntityFilter(filter)}
              >
                {filter === 'all' && <Layers className="h-3 w-3" />}
                {filter === 'brand' && <Building2 className="h-3 w-3" />}
                {filter === 'product' && <Package className="h-3 w-3" />}
                {filter === 'event' && <Calendar className="h-3 w-3" />}
                <span className="capitalize">{filter === 'all' ? 'All' : `${filter}s`}</span>
                <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
                  {entityCounts[filter]}
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{summary.totalBrands}</p>
              <p className="text-sm text-muted-foreground">Total Entities</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className={`text-2xl font-bold ${getScoreColor(summary.avgHealthScore)}`}>
                {summary.avgHealthScore}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Health Score</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-destructive">{summary.brandsNeedingAttention}</p>
              <p className="text-sm text-muted-foreground">Need Attention</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{summary.fullyCompleteBrands}</p>
              <p className="text-sm text-muted-foreground">Fully Complete</p>
            </div>
          </div>
        )}

        {/* Tabs for different views */}
        {brandsHealth.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="executive" className="gap-1 text-xs">
                <Target className="h-3.5 w-3.5" />
                Executive
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-1 text-xs">
                <Heart className="h-3.5 w-3.5" />
                Health
              </TabsTrigger>
              <TabsTrigger value="distribution" className="gap-1 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Distribution
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Content
              </TabsTrigger>
              <TabsTrigger value="gaps" className="gap-1 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                Gaps
              </TabsTrigger>
              <TabsTrigger value="ai-metrics" className="gap-1 text-xs">
                <Brain className="h-3.5 w-3.5" />
                AI & Intel
              </TabsTrigger>
              <TabsTrigger value="critical" className="gap-1 text-xs">
                <XCircle className="h-3.5 w-3.5" />
                Critical ({criticalBrands.length})
              </TabsTrigger>
            </TabsList>

            {/* Executive Summary Tab */}
            <TabsContent value="executive" className="space-y-4">
              <ExecutiveSummaryPanel onNavigate={(tab) => setActiveTab(tab)} />
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-4">
              <HealthDistributionChart data={brandsHealth} />
            </TabsContent>

            {/* Content Performance Tab */}
            <TabsContent value="content" className="space-y-4">
              <ContentPerformanceTab data={brandsHealth} />
            </TabsContent>

            {/* AI Metrics Tab */}
            <TabsContent value="ai-metrics" className="space-y-4">
              <AIMetricsTab />
            </TabsContent>

            {/* Health Scores Tab */}
            <TabsContent value="overview" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {brandsHealth.map(brand => (
                    <Collapsible 
                      key={brand.id}
                      open={expandedBrands.has(brand.id)}
                      onOpenChange={() => toggleBrandExpanded(brand.id)}
                    >
                      <div className="border rounded-lg p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedBrands.has(brand.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{brand.name}</p>
                                  <Badge variant={entityTypeBadgeVariant(brand.entityType)} className="text-[10px] h-4 px-1.5 capitalize">
                                    {entityTypeIcon(brand.entityType)}
                                    <span className="ml-1">{brand.entityType}</span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {brand.organizationName || 'Personal'} • Updated {format(new Date(brand.updatedAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={getScoreBadge(brand.overallScore).variant}>
                                {getScoreBadge(brand.overallScore).label}
                              </Badge>
                              <ComplianceScoreBadge score={brand.complianceScore} size="sm" />
                              <div className="w-24">
                                <Progress value={brand.overallScore} className="h-2" />
                              </div>
                              <span className={`font-bold ${getScoreColor(brand.overallScore)}`}>
                                {brand.overallScore}%
                              </span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-5 gap-4">
                            {Object.entries(brand.scores).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <p className={`text-lg font-bold ${getScoreColor(value)}`}>{value}%</p>
                                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                              </div>
                            ))}
                          </div>
                          {brand.gaps.filter(g => g.severity === 'critical').length > 0 && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm font-medium text-red-600 mb-2">Critical Gaps:</p>
                              <ul className="text-sm text-red-600 space-y-1">
                                {brand.gaps.filter(g => g.severity === 'critical').map((gap, i) => (
                                  <li key={i}>• {gap.section}: {gap.description}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Content Gaps Tab */}
            <TabsContent value="gaps" className="space-y-4">
              {summary && summary.topGaps.length > 0 && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Most Common Gaps Across All Brands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {summary.topGaps.map((g, i) => (
                        <Badge key={i} variant="outline" className="text-sm">
                          {g.gap}: {g.count} brands
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {sortedByHealth.filter(b => b.gaps.length > 0).map(brand => (
                    <div key={brand.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">{brand.name}</p>
                        <Badge variant="outline">{brand.gaps.length} gaps</Badge>
                      </div>
                      <div className="space-y-2">
                        {brand.gaps.map((gap, i) => (
                          <div key={i} className={`p-3 rounded-lg ${getSeverityColor(gap.severity)}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{gap.section}</p>
                                <p className="text-xs mt-1">{gap.description}</p>
                              </div>
                              <Badge variant="outline" className="text-xs capitalize shrink-0 ml-2">
                                {gap.severity}
                              </Badge>
                            </div>
                            <p className="text-xs mt-2 opacity-80">
                              <Info className="h-3 w-3 inline mr-1" />
                              {gap.recommendation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Consistency Tab */}
            <TabsContent value="consistency" className="space-y-4">
              {summary && summary.topIssues.length > 0 && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Most Common Consistency Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {summary.topIssues.map((issue, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          {issue.issue}: {issue.count} brands
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {brandsHealth.filter(b => b.consistencyIssues.length > 0).map(brand => (
                    <div key={brand.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{brand.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Consistency Score: <span className={getScoreColor(brand.scores.consistency)}>{brand.scores.consistency}%</span>
                          </p>
                        </div>
                        <Badge variant="outline">{brand.consistencyIssues.length} issues</Badge>
                      </div>
                      <div className="space-y-2">
                        {brand.consistencyIssues.map((issue, i) => (
                          <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              {issue.type === 'color' && <Palette className="h-4 w-4 text-yellow-600" />}
                              {issue.type === 'typography' && <Type className="h-4 w-4 text-yellow-600" />}
                              {issue.type === 'messaging' && <FileText className="h-4 w-4 text-yellow-600" />}
                              {issue.type === 'assets' && <Image className="h-4 w-4 text-yellow-600" />}
                              <p className="font-medium text-sm text-yellow-700 dark:text-yellow-400">{issue.issue}</p>
                            </div>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500">{issue.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {brandsHealth.filter(b => b.consistencyIssues.length > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No consistency issues detected!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Critical Brands Tab */}
            <TabsContent value="critical" className="space-y-4">
              {criticalBrands.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No Critical Brands!</p>
                  <p className="text-sm">All brands have a health score above 40%</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {criticalBrands.map(brand => (
                      <div key={brand.id} className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-lg">{brand.name}</p>
                            <p className="text-sm text-muted-foreground">{brand.organizationName || 'Personal'}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${getScoreColor(brand.overallScore)}`}>
                              {brand.overallScore}%
                            </p>
                            <Badge variant="destructive">Critical</Badge>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Priority Actions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {brand.gaps.filter(g => g.severity === 'critical').slice(0, 3).map((gap, i) => (
                              <li key={i}>{gap.recommendation}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="grid grid-cols-5 gap-2 pt-3 border-t">
                          {Object.entries(brand.scores).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <Progress value={value} className="h-1 mb-1" />
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!isLoading && brandsHealth.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Analysis Data</p>
            <p className="text-sm mb-4">Click "Analyze All" to generate health scores for brands, products, and events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
