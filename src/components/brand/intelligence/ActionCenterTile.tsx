/**
 * Unified Action Center tile for BrandIntelligencePanel.
 * Aggregates recommendation_actions, competitive_recommendation_actions, and intelligence_alerts.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Loader2, Sparkles, Trophy, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnifiedActions, type BrandAction, type ActionSource } from '@/hooks/useUnifiedActions';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  entityId?: string | null;
  entityType?: string | null;
  organizationId?: string | null;
  canEdit?: boolean;
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  high: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  medium: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  low: 'bg-muted text-muted-foreground border-border',
  info: 'bg-muted text-muted-foreground border-border',
};

const SOURCE_LABEL: Record<ActionSource, string> = {
  competitive: 'Competitive',
  compliance: 'Compliance',
  audit: 'Audit',
  alert: 'Alert',
  recommendation: 'Recommendation',
};

export function ActionCenterTile({ entityId, entityType, organizationId, canEdit }: Props) {
  const { actions, isLoading, openCount, markDone } = useUnifiedActions({ entityId, entityType, organizationId });
  const [tab, setTab] = useState<'all' | ActionSource>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return actions;
    return actions.filter(a => a.source === tab);
  }, [actions, tab]);

  const renderItem = (a: BrandAction) => (
    <div
      key={a.id}
      className={`p-3 rounded-md border flex items-start gap-3 transition-colors ${
        a.status === 'done' ? 'opacity-60 bg-muted/30' : 'bg-card hover:bg-accent/40'
      }`}
    >
      <div className="mt-0.5">
        {a.status === 'done' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : a.severity === 'critical' || a.severity === 'high' ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ) : (
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{a.title}</span>
          <Badge variant="outline" className={`text-[10px] py-0 ${SEVERITY_BADGE[a.severity]}`}>
            {a.severity}
          </Badge>
          <Badge variant="outline" className="text-[10px] py-0">
            {SOURCE_LABEL[a.source]}
          </Badge>
        </div>
        {a.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
        </p>
      </div>
      {canEdit && a.status !== 'done' && (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markDone(a)}>
          Mark done
        </Button>
      )}
    </div>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          Action Center
          {openCount > 0 && (
            <Badge variant="default" className="ml-auto">{openCount} open</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-5 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="competitive" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />Comp
            </TabsTrigger>
            <TabsTrigger value="alert" className="text-xs">
              <Bell className="h-3 w-3 mr-1" />Alerts
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
            <TabsTrigger value="recommendation" className="text-xs">Recs</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading actions…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No actions in this category. The brain will surface new items as audits and intelligence runs complete.
              </div>
            ) : (
              <ScrollArea className="max-h-[380px] pr-2">
                <div className="space-y-2">
                  {filtered.map(renderItem)}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
