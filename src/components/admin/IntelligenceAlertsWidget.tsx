/**
 * Intelligence Alerts Widget
 * Shows unacknowledged intelligence alerts with acknowledge/dismiss actions
 */

import { useState } from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, Info, Check, CheckCheck, 
  Trash2, Loader2, ChevronDown, ChevronUp, Zap, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIntelligenceAlerts, type IntelligenceAlert } from '@/hooks/useIntelligenceAlerts';
import { formatDistanceToNow } from 'date-fns';

interface IntelligenceAlertsWidgetProps {
  organizationId?: string;
  compact?: boolean;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
};

const alertTypeLabels: Record<string, string> = {
  score_drop: 'Score Drop',
  synthesis_complete: 'Synthesis',
  health_warning: 'Health',
  compliance_drop: 'Compliance',
  bias_drop: 'Inclusion',
  new_insight: 'Insight',
};

export function IntelligenceAlertsWidget({ organizationId, compact = false }: IntelligenceAlertsWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const {
    alerts,
    unacknowledgedCount,
    isLoading,
    fetchAlerts,
    acknowledgeAlert,
    acknowledgeAll,
    deleteAlert,
    triggerScheduledRun,
  } = useIntelligenceAlerts(organizationId);

  if (!organizationId) return null;

  const displayAlerts = showAll ? alerts : alerts.filter(a => !a.acknowledged);

  if (compact) {
    return (
      <CompactWidget
        unacknowledgedCount={unacknowledgedCount}
        alerts={displayAlerts}
        onAcknowledge={acknowledgeAlert}
        onTriggerRun={triggerScheduledRun}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Intelligence Alerts</CardTitle>
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {unacknowledgedCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => { setShowAll(!showAll); fetchAlerts(!showAll); }}
            >
              <Eye className="h-3 w-3 mr-1" />
              {showAll ? 'Active' : 'All'}
            </Button>
            {unacknowledgedCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={acknowledgeAll}>
                <CheckCheck className="h-3 w-3 mr-1" />
                Ack All
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={triggerScheduledRun} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
              Run Now
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {isLoading && alerts.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading alerts...</span>
            </div>
          ) : displayAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No active alerts</p>
              <p className="text-xs">Intelligence is running smoothly</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {displayAlerts.map(alert => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                    onDelete={deleteAlert}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function AlertRow({
  alert,
  onAcknowledge,
  onDelete,
}: {
  alert: IntelligenceAlert;
  onAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors",
      alert.acknowledged ? "opacity-60 bg-muted/30" : config.bg,
      config.border,
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
            {alertTypeLabels[alert.alert_type] || alert.alert_type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!alert.acknowledged && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAcknowledge(alert.id)}>
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(alert.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function CompactWidget({
  unacknowledgedCount,
  alerts,
  onAcknowledge,
  onTriggerRun,
  isLoading,
}: {
  unacknowledgedCount: number;
  alerts: IntelligenceAlert[];
  onAcknowledge: (id: string) => void;
  onTriggerRun: () => void;
  isLoading: boolean;
}) {
  if (unacknowledgedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {unacknowledgedCount} intelligence alert{unacknowledgedCount > 1 ? 's' : ''}
        </p>
        {alerts[0] && (
          <p className="text-xs text-muted-foreground truncate">{alerts[0].title}</p>
        )}
      </div>
      <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={onTriggerRun} disabled={isLoading}>
        View
      </Button>
    </div>
  );
}
