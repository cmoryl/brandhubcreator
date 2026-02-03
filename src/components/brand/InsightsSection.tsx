import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, FileText, BarChart2, Newspaper, 
  Bell, AlertCircle, Calendar, ExternalLink, Plus, Trash2, Pencil,
  LayoutGrid, LayoutList, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import type { InsightItem, InsightsLayout } from '@/types/brand';

interface InsightsSectionProps {
  insights: InsightItem[];
  layout?: InsightsLayout;
  onInsightsChange?: (insights: InsightItem[]) => void;
  onLayoutChange?: (layout: InsightsLayout) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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
  update: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
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
  canEdit 
}: { 
  insight: InsightItem; 
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}) => {
  const Icon = typeIcons[insight.type] || FileText;
  const TrendIcon = insight.trend === 'up' ? TrendingUp : insight.trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-accent/30">
      {/* Accent top bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        insight.type === 'report' && "bg-gradient-to-r from-blue-500 to-blue-400",
        insight.type === 'analytics' && "bg-gradient-to-r from-emerald-500 to-emerald-400",
        insight.type === 'news' && "bg-gradient-to-r from-purple-500 to-purple-400",
        insight.type === 'update' && "bg-gradient-to-r from-amber-500 to-amber-400",
        insight.type === 'alert' && "bg-gradient-to-r from-red-500 to-red-400",
      )} />

      {/* Edit/Delete controls */}
      {canEdit && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

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
}: InsightsSectionProps) => {
  const canEdit = Boolean(onInsightsChange);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = (id: string) => {
    if (!onInsightsChange) return;
    onInsightsChange(insights.filter(i => i.id !== id));
  };

  const handleAddSample = () => {
    if (!onInsightsChange) return;
    const newInsight: InsightItem = {
      id: `insight-${Date.now()}`,
      type: 'update',
      title: 'New Update',
      summary: 'Add your insight summary here...',
      date: new Date().toISOString(),
      priority: 'medium',
    };
    onInsightsChange([...insights, newInsight]);
  };

  if (insights.length === 0 && !canEdit) {
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
          <Button variant="outline" size="sm" onClick={handleAddSample} className="ml-auto gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Insight
          </Button>
        </div>
      )}

      {/* Empty state */}
      {insights.length === 0 && canEdit && (
        <div className="text-center py-12 px-6 rounded-xl border-2 border-dashed border-border/50 bg-muted/10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Share reports, analytics, and important updates with your team and stakeholders.
          </p>
          <Button onClick={handleAddSample} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Insight
          </Button>
        </div>
      )}

      {/* Content based on layout */}
      {insights.length > 0 && (
        <>
          {(layout === 'infographic' || layout === 'dashboard') ? (
            <InfographicLayout insights={insights} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  canEdit={canEdit && isEditing}
                  onDelete={() => handleDelete(insight.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
