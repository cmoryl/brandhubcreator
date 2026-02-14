import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { useCompetitiveInsights, type CompetitiveInsightItem } from '@/hooks/useCompetitiveInsights';
import { useBrandIntelligenceInsights } from '@/hooks/useBrandIntelligenceInsights';
import { useComplianceAuditInsights } from '@/hooks/useComplianceAuditInsights';
import { useSocialMetricsInsights } from '@/hooks/useSocialMetricsInsights';
import { 
  TrendingUp, TrendingDown, Minus, FileText, BarChart2, Newspaper, 
  Bell, AlertCircle, Calendar, ExternalLink, Plus, Trash2, Pencil,
  LayoutGrid, LayoutList, Sparkles, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { InsightEditorModal } from './InsightEditorModal';
import { InsightsAccessGate } from './InsightsAccessGate';
import { WebsiteAnalysisCard } from './WebsiteAnalysisCard';
import { cn } from '@/lib/utils';
import type { InsightItem, InsightsLayout, BrandWebsiteLink } from '@/types/brand';

const CompetitiveAnalysisDialog = lazy(() => 
  import('./CompetitiveAnalysisDialog').then(m => ({ default: m.CompetitiveAnalysisDialog }))
);
const BrandIntelligenceDetailDialog = lazy(() =>
  import('./BrandIntelligenceDetailDialog').then(m => ({ default: m.BrandIntelligenceDetailDialog }))
);
const WebsiteReportDetailDialog = lazy(() =>
  import('./WebsiteReportDetailDialog').then(m => ({ default: m.WebsiteReportDetailDialog }))
);

interface InsightsSectionProps {
  insights: InsightItem[];
  layout?: InsightsLayout;
  onInsightsChange?: (insights: InsightItem[]) => void;
  onLayoutChange?: (layout: InsightsLayout) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** Entity context for auto-fetching competitive analysis reports */
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  /** Website links for analysis cards */
  websites?: BrandWebsiteLink[];
  entityName?: string;
  industry?: string;
  organizationId?: string | null;
  brandContext?: {
    colors?: string[];
    archetype?: string;
    mission?: string;
    tagline?: string;
    competitors?: string[];
  };
  /** Access code to protect this section for public/anonymous users */
  insightsAccessCode?: string;
  onAccessCodeChange?: (code: string) => void;
}

const typeIcons = {
  report: FileText,
  analytics: BarChart2,
  news: Newspaper,
  update: Bell,
  alert: AlertCircle,
};

const typeColors = {
  report: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  analytics: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  news: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  update: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  alert: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-red-500/10 text-red-600',
};

const InsightCard = ({ 
  insight, 
  onEdit, 
  onDelete,
  onClick,
  canEdit 
}: { 
  insight: InsightItem; 
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  canEdit?: boolean;
}) => {
  const Icon = typeIcons[insight.type] || FileText;
  const TrendIcon = insight.trend === 'up' ? TrendingUp : insight.trend === 'down' ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-accent/30",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Accent top bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        insight.type === 'report' && "bg-gradient-to-r from-blue-500 to-blue-400",
        insight.type === 'analytics' && "bg-gradient-to-r from-emerald-500 to-emerald-400",
        insight.type === 'news' && "bg-gradient-to-r from-purple-500 to-purple-400",
        insight.type === 'update' && "bg-gradient-to-r from-sky-500 to-sky-400",
        insight.type === 'alert' && "bg-gradient-to-r from-red-500 to-red-400",
      )} />

      {/* Edit/Delete/View controls */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onClick && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
        {canEdit && onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <CardHeader className="pb-2 pt-5">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg border",
            typeColors[insight.type]
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                {insight.type}
              </Badge>
              {insight.priority && (
                <Badge className={cn("text-[10px]", priorityColors[insight.priority])}>
                  {insight.priority}
                </Badge>
              )}
              {insight.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {insight.category}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-semibold leading-tight">
              {insight.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric display */}
        {insight.value && (
          <div className="flex items-baseline gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-3xl font-bold text-foreground">{insight.value}</span>
            {insight.valueLabel && (
              <span className="text-sm text-muted-foreground">{insight.valueLabel}</span>
            )}
            {insight.trend && (
              <div className={cn(
                "flex items-center gap-1 ml-auto text-sm font-medium",
                insight.trend === 'up' && "text-emerald-500",
                insight.trend === 'down' && "text-red-500",
                insight.trend === 'neutral' && "text-muted-foreground"
              )}>
                <TrendIcon className="h-4 w-4" />
                {insight.trendValue}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {insight.summary}
        </p>

        {/* Image preview */}
        {insight.imageUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src={insight.imageUrl} 
              alt={insight.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(insight.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          {insight.linkUrl && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
              <a href={insight.linkUrl} target="_blank" rel="noopener noreferrer">
                {insight.linkLabel || 'View Details'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Infographic-style layout component
const InfographicLayout = ({ insights }: { insights: InsightItem[] }) => {
  const analyticsItems = insights.filter(i => i.type === 'analytics' || i.value);
  const newsItems = insights.filter(i => i.type === 'news' || i.type === 'update');
  const alertItems = insights.filter(i => i.type === 'alert' || i.priority === 'high');

  return (
    <div className="space-y-8">
      {/* Key Metrics Banner */}
      {analyticsItems.length > 0 && (
        <div className="relative p-6 rounded-2xl bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border border-accent/20 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, hsl(var(--accent)) 50px, hsl(var(--accent)) 51px)',
            }} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold">Key Metrics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analyticsItems.slice(0, 4).map((item) => {
                const TrendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
                return (
                  <div key={item.id} className="text-center p-4 rounded-xl bg-background/80 border border-border/50">
                    <div className="text-3xl font-bold text-foreground mb-1">{item.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{item.valueLabel || item.title}</div>
                    {item.trend && (
                      <div className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        item.trend === 'up' && "bg-emerald-500/10 text-emerald-500",
                        item.trend === 'down' && "bg-red-500/10 text-red-500",
                        item.trend === 'neutral' && "bg-muted text-muted-foreground"
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        {item.trendValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Alerts section */}
      {alertItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Important Alerts</h3>
          <div className="space-y-2">
            {alertItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* News & Updates */}
      {newsItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Latest Updates</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {newsItems.map((item) => (
              <InsightCard key={item.id} insight={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const InsightsSection = ({
  insights,
  layout = 'cards',
  onInsightsChange,
  onLayoutChange,
  customSubtitle,
  onSubtitleChange,
  entityType,
  entityId,
  websites,
  entityName,
  industry,
  organizationId,
  brandContext,
  insightsAccessCode,
  onAccessCodeChange,
}: InsightsSectionProps) => {
  const canEdit = Boolean(onInsightsChange);
  const [isEditing, setIsEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState<InsightItem | null>(null);
  const [competitiveDialogOpen, setCompetitiveDialogOpen] = useState(false);
  const [intelligenceDialogOpen, setIntelligenceDialogOpen] = useState(false);
  const [websiteReportOpen, setWebsiteReportOpen] = useState(false);
  const [selectedWebsiteReport, setSelectedWebsiteReport] = useState<{ url: string; report: any } | null>(null);

  // Auto-fetch competitive analysis reports when entity context is provided
  const { competitiveInsights, deleteReport: deleteCompetitiveReport } = useCompetitiveInsights({
    entityType: entityType || 'brand',
    entityId: entityId || '',
    enabled: Boolean(entityType && entityId),
  });

  // Auto-fetch brand intelligence stats when entity context is provided
  const { intelligenceInsights, intelligenceDetail } = useBrandIntelligenceInsights({
    entityType: entityType || 'brand',
    entityId: entityId || '',
    enabled: Boolean(entityType && entityId),
  });

  // Auto-fetch compliance audit data when entity context is provided
  const { complianceInsights } = useComplianceAuditInsights({
    entityType: entityType || 'brand',
    entityId: entityId || '',
    enabled: Boolean(entityType && entityId),
  });

  // Auto-fetch social metrics insights
  const { socialInsights } = useSocialMetricsInsights({
    entityType: entityType || 'brand',
    entityId: entityId || '',
    enabled: Boolean(entityType && entityId),
  });

  // Merge manual insights with auto-fetched competitive, intelligence, compliance, and social insights
  const allInsights = useMemo(() => {
    return [...insights, ...competitiveInsights, ...intelligenceInsights, ...complianceInsights, ...socialInsights];
  }, [insights, competitiveInsights, intelligenceInsights, complianceInsights, socialInsights]);

  const handleDelete = (id: string) => {
    if (!onInsightsChange) return;
    onInsightsChange(insights.filter(i => i.id !== id));
  };

  const handleEdit = (insight: InsightItem) => {
    setEditingInsight(insight);
    setEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingInsight(null);
    setEditorOpen(true);
  };

  const handleSaveInsight = (insight: InsightItem) => {
    if (!onInsightsChange) return;
    
    const existingIndex = insights.findIndex(i => i.id === insight.id);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...insights];
      updated[existingIndex] = insight;
      onInsightsChange(updated);
    } else {
      // Add new
      onInsightsChange([...insights, insight]);
    }
  };

  // Save/update website analysis as a persistent insight
  const handleAnalysisComplete = (url: string, report: any) => {
    if (!onInsightsChange) return;
    const insightId = `site-analysis-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const analysisInsight: InsightItem = {
      id: insightId,
      type: 'analytics',
      title: `Website Analysis: ${url}`,
      summary: report.summary || `Overall score: ${report.overallScore}/100 (Grade ${report.grade})`,
      value: String(report.overallScore),
      valueLabel: `Grade ${report.grade}`,
      trend: report.overallScore >= 70 ? 'up' : report.overallScore >= 50 ? 'neutral' : 'down',
      trendValue: `${report.overallScore}/100`,
      date: new Date().toISOString(),
      priority: report.overallScore >= 70 ? 'low' : report.overallScore >= 50 ? 'medium' : 'high',
      category: 'Website Analysis',
      // Store full report in content as JSON for restoration
      content: JSON.stringify(report),
    };
    // Replace existing analysis for same URL or add new
    const filtered = insights.filter(i => i.id !== insightId);
    onInsightsChange([...filtered, analysisInsight]);
  };

  // Extract saved reports for WebsiteAnalysisCards
  const getSavedReport = (url: string) => {
    const insightId = `site-analysis-${url.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const saved = insights.find(i => i.id === insightId);
    if (saved?.content) {
      try {
        return JSON.parse(saved.content);
      } catch { return null; }
    }
    return null;
  };

  const websitesWithUrls = (websites || []).filter(w => w.url);
  const hasWebsiteAnalysis = websitesWithUrls.length > 0;

  // For admins: hide if empty. For public users: always show (gate will be displayed)
  if (allInsights.length === 0 && canEdit && !hasWebsiteAnalysis) {
    return null;
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Insights & Updates"
        defaultSubtitle="Latest reports, analytics, and important updates for stakeholders"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <InsightsAccessGate
        accessCode={insightsAccessCode}
        onAccessCodeChange={canEdit ? onAccessCodeChange : undefined}
        canEdit={canEdit}
      >
        {/* Layout controls for admins */}
        {canEdit && isEditing && (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-sm font-medium text-muted-foreground">Layout:</span>
            <div className="flex gap-2">
              {(['cards', 'infographic', 'dashboard'] as InsightsLayout[]).map((l) => (
                <Button
                  key={l}
                  variant={layout === l ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onLayoutChange?.(l)}
                  className="gap-1.5 capitalize"
                >
                  {l === 'cards' && <LayoutGrid className="h-3.5 w-3.5" />}
                  {l === 'infographic' && <BarChart2 className="h-3.5 w-3.5" />}
                  {l === 'dashboard' && <LayoutList className="h-3.5 w-3.5" />}
                  {l}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddNew} className="ml-auto gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Insight
            </Button>
          </div>
        )}

        {/* Editor Modal */}
        <InsightEditorModal
          open={editorOpen}
          onOpenChange={setEditorOpen}
          insight={editingInsight}
          onSave={handleSaveInsight}
        />

        {/* Empty state */}
        {allInsights.length === 0 && canEdit && (
          <div className="text-center py-12 px-6 rounded-xl border-2 border-dashed border-border/50 bg-muted/10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Share reports, analytics, and important updates with your team and stakeholders.
            </p>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Insight
            </Button>
          </div>
        )}

        {/* Content based on layout */}
        {(() => {
          // For admins, filter out site-analysis insights (shown via WebsiteAnalysisCard below).
          // For public users, include them as read-only insight cards so they can see the results.
          const displayInsights = canEdit
            ? allInsights.filter(i => !i.id.startsWith('site-analysis-'))
            : allInsights;
          if (displayInsights.length === 0) {
            // Show a public-facing empty state when no insights are available after unlock
            if (!canEdit) {
              return (
                <div className="text-center py-12 px-6 rounded-xl border border-border/30 bg-muted/10">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Insights Coming Soon</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Brand analytics, intelligence reports, and competitive insights will appear here once generated.
                  </p>
                </div>
              );
            }
            return null;
          }
          return (
            <>
              {(layout === 'infographic' || layout === 'dashboard') ? (
                <InfographicLayout insights={displayInsights} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayInsights.map((insight) => {
                    const isCompetitive = insight.id.startsWith('competitive-');
                    const isBrain = insight.id.startsWith('brain-');
                    const competitiveItem = isCompetitive 
                      ? competitiveInsights.find(ci => ci.id === insight.id)
                      : undefined;
                    return (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        canEdit={canEdit && isEditing && !isCompetitive && !isBrain}
                        onEdit={!isCompetitive && !isBrain ? () => handleEdit(insight) : undefined}
                        onDelete={
                          isCompetitive && competitiveItem
                            ? () => deleteCompetitiveReport(competitiveItem.reportId)
                            : !isCompetitive && !isBrain && canEdit && isEditing
                              ? () => handleDelete(insight.id)
                              : undefined
                        }
                        onClick={
                          isCompetitive ? () => setCompetitiveDialogOpen(true) :
                          isBrain ? () => setIntelligenceDialogOpen(true) :
                          insight.id.startsWith('site-analysis-') ? () => {
                            try {
                              const report = insight.content ? JSON.parse(insight.content) : null;
                              if (report) {
                                const url = insight.title?.replace('Website Analysis: ', '') || '';
                                setSelectedWebsiteReport({ url, report });
                                setWebsiteReportOpen(true);
                              }
                            } catch { /* ignore parse errors */ }
                          } :
                          undefined
                        }
                      />
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* Website Analysis Cards - admin only */}
        {canEdit && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Website Analysis</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {websitesWithUrls.map((link) => (
                <WebsiteAnalysisCard
                  key={`analysis-${link.id}`}
                  websiteUrl={link.url}
                  websiteLabel={link.label}
                  entityName={entityName}
                  industry={industry}
                  entityId={entityId}
                  entityType={entityType}
                  organizationId={organizationId}
                  brandContext={brandContext}
                  onAnalysisComplete={handleAnalysisComplete}
                  savedReport={getSavedReport(link.url)}
                />
              ))}
              <WebsiteAnalysisCard
                key="analysis-custom"
                websiteUrl=""
                websiteLabel="Custom"
                entityName={entityName}
                industry={industry}
                entityId={entityId}
                entityType={entityType}
                organizationId={organizationId}
                brandContext={brandContext}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        )}
      </InsightsAccessGate>

      {/* Competitive Analysis Dialog */}
      {entityType && entityId && (
        <Suspense fallback={null}>
          <CompetitiveAnalysisDialog
            open={competitiveDialogOpen}
            onOpenChange={setCompetitiveDialogOpen}
            entityType={entityType}
            entityId={entityId}
            entityName=""
            defaultTab="results"
          />
          <BrandIntelligenceDetailDialog
            open={intelligenceDialogOpen}
            onOpenChange={setIntelligenceDialogOpen}
            detail={intelligenceDetail}
          />
        </Suspense>
      )}

      {/* Website Analysis Detail Dialog */}
      {websiteReportOpen && selectedWebsiteReport && (
        <Suspense fallback={null}>
          <WebsiteReportDetailDialog
            open={websiteReportOpen}
            onOpenChange={setWebsiteReportOpen}
            url={selectedWebsiteReport.url}
            report={selectedWebsiteReport.report}
          />
        </Suspense>
      )}
    </section>
  );
};
