import { useState } from 'react';
import { usePortfolioInsights, PortfolioInsight } from '@/hooks/usePortfolioInsights';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Lightbulb, RefreshCw, ArrowRight, Check, X, Eye, Accessibility,
  Globe2, Shield, Zap, Target, Brain, Filter
} from 'lucide-react';

const moduleIcons: Record<string, React.ReactNode> = {
  bias_scan: <Shield className="h-3.5 w-3.5" />,
  localization: <Globe2 className="h-3.5 w-3.5" />,
  research: <Brain className="h-3.5 w-3.5" />,
  competitive: <Target className="h-3.5 w-3.5" />,
  website: <Eye className="h-3.5 w-3.5" />,
  booth: <Zap className="h-3.5 w-3.5" />,
};

const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  low: 'bg-muted text-muted-foreground',
};

const statusColors: Record<string, string> = {
  pending: 'bg-primary/10 text-primary',
  propagated: 'bg-green-500/15 text-green-700 dark:text-green-400',
  dismissed: 'bg-muted text-muted-foreground line-through',
};

const categoryLabels: Record<string, string> = {
  mobility: '♿ Mobility',
  vision: '👁 Vision',
  hearing: '👂 Hearing',
  cognitive: '🧠 Cognitive',
  language: '🗣 Language',
  cultural: '🌍 Cultural',
  universal: '✨ Universal',
};

export function PortfolioInsightsPanel() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');

  // Get user's organization
  const { data: orgData } = useQuery({
    queryKey: ['user-org-for-insights', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const orgId = orgData?.organization_id;
  const { insights, isLoading, isExtracting, extractInsights, updateStatus } = usePortfolioInsights(orgId);

  const filtered = insights.filter(i => {
    if (filterType !== 'all' && i.insight_type !== filterType) return false;
    if (filterStatus !== 'all' && i.propagation_status !== filterStatus) return false;
    if (filterModule !== 'all' && i.source_module !== filterModule) return false;
    return true;
  });

  const stats = {
    total: insights.length,
    pending: insights.filter(i => i.propagation_status === 'pending').length,
    propagated: insights.filter(i => i.propagation_status === 'propagated').length,
    highSeverity: insights.filter(i => i.severity === 'high' || i.severity === 'critical').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Portfolio Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-pollinated curb-cut insights from bias scans, localization, research, competitive analysis, and more
          </p>
        </div>
        <Button 
          onClick={() => extractInsights()} 
          disabled={isExtracting || !orgId}
          className="gap-2"
        >
          {isExtracting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {isExtracting ? 'Extracting…' : 'Extract Insights'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Insights</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.propagated}</p>
            <p className="text-xs text-muted-foreground">Propagated</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.highSeverity}</p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="accessibility">Accessibility</SelectItem>
            <SelectItem value="usability">Usability</SelectItem>
            <SelectItem value="localization">Localization</SelectItem>
            <SelectItem value="inclusive_design">Inclusive Design</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="competitive">Competitive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="propagated">Propagated</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="bias_scan">Bias Scans</SelectItem>
            <SelectItem value="localization">Localization</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="competitive">Competitive</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="booth">Booth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Insights List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading insights…</CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No insights found. Click "Extract Insights" to analyze your portfolio data.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((insight) => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onUpdateStatus={updateStatus}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function InsightCard({ insight, onUpdateStatus }: { 
  insight: PortfolioInsight; 
  onUpdateStatus: (params: { insightId: string; status: string; reason?: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Module icon */}
          <div className="mt-0.5 p-1.5 rounded-md bg-muted shrink-0">
            {moduleIcons[insight.source_module] || <Lightbulb className="h-3.5 w-3.5" />}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  From <span className="font-medium">{insight.source_entity_name}</span> ({insight.source_module.replace('_', ' ')})
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={`text-[10px] px-1.5 py-0 ${severityColors[insight.severity]}`}>
                  {insight.severity}
                </Badge>
                <Badge className={`text-[10px] px-1.5 py-0 ${statusColors[insight.propagation_status]}`}>
                  {insight.propagation_status}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{insight.description}</p>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1 mt-2">
              {insight.curb_cut_category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {categoryLabels[insight.curb_cut_category] || insight.curb_cut_category}
                </Badge>
              )}
              {insight.tags?.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
              ))}
              {insight.applicable_entity_ids?.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary">
                  → {insight.applicable_entity_ids.length} entities
                </Badge>
              )}
              {insight.confidence_score > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {Math.round(insight.confidence_score * 100)}% confidence
                </Badge>
              )}
            </div>

            {/* Expandable recommendations */}
            {expanded && insight.recommendations?.length > 0 && (
              <div className="mt-3 p-2 bg-muted/50 rounded-md space-y-1.5">
                <p className="text-xs font-medium">Recommendations:</p>
                {insight.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    <span>{rec.action}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 ml-auto">
                      {rec.priority} / {rec.effort}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Collapse' : 'Details'}
              </Button>
              {insight.propagation_status === 'pending' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-green-600 hover:text-green-700"
                    onClick={() => onUpdateStatus({ insightId: insight.id, status: 'propagated' })}
                  >
                    <Check className="h-3 w-3 mr-1" /> Propagate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-muted-foreground"
                    onClick={() => onUpdateStatus({ insightId: insight.id, status: 'dismissed', reason: 'Not applicable' })}
                  >
                    <X className="h-3 w-3 mr-1" /> Dismiss
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
