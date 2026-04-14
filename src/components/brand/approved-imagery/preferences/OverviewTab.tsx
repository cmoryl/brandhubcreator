import { TrendingUp, TrendingDown, EyeOff, Database, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VisualDNA } from '@/hooks/useImageryPreferenceLearning';

interface OverviewTabProps {
  visualDna: VisualDNA;
}

const sourceLabels: Record<string, string> = {
  interaction_signals: 'Interactions',
  vault_assets: 'Vault Assets',
  approved_imagery: 'Approved Imagery',
  brand_colors: 'Brand Colors',
  collateral_items: 'Collateral',
  // logos intentionally excluded — brand marks aren't imagery preferences
  patterns: 'Patterns',
  gradients: 'Gradients',
};

const boolSourceLabels: Record<string, string> = {
  has_visual_analysis: 'Visual Audit',
  has_inclusive_assessment: 'Inclusion Audit',
};

export const OverviewTab = ({ visualDna }: OverviewTabProps) => {
  const patterns = visualDna.approval_patterns || {};
  const confidence = Math.round(visualDna.confidence_score || 0);
  const total = (visualDna.total_approved || 0) + (visualDna.total_skipped || 0) + (visualDna.total_removed || 0);
  const ds = visualDna.data_sources;

  // Count active sources
  const activeSources = ds ? Object.entries(sourceLabels).filter(([k]) => (ds as any)[k] > 0).length +
    Object.entries(boolSourceLabels).filter(([k]) => (ds as any)[k]).length : 0;

  return (
    <div className="space-y-4">
      {/* Confidence Ring + Stats */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(confidence / 100) * 188.5} 188.5`}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground">{confidence}%</span>
            <span className="text-[9px] text-muted-foreground">confidence</span>
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_approved}</span>
            <span className="text-muted-foreground">approved</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_skipped}</span>
            <span className="text-muted-foreground">skipped</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="font-medium text-foreground">{visualDna.total_removed}</span>
            <span className="text-muted-foreground">removed</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{total} total interactions</p>
        </div>
      </div>

      {/* Summary */}
      {patterns.summary && (
        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-xs leading-relaxed text-foreground">{patterns.summary}</p>
        </div>
      )}

      {/* Data Sources Feeding DNA */}
      {ds && activeSources > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Database className="h-3 w-3" /> Data Sources ({activeSources} active)
          </p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(sourceLabels).map(([key, label]) => {
              const count = (ds as any)[key] as number;
              if (!count || count === 0) return null;
              return (
                <Badge key={key} variant="secondary" className="text-[10px] gap-1 h-5">
                  <CheckCircle2 className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                  {label} ({count})
                </Badge>
              );
            })}
            {Object.entries(boolSourceLabels).map(([key, label]) => {
              const active = (ds as any)[key] as boolean;
              return (
                <Badge key={key} variant={active ? 'secondary' : 'outline'} className="text-[10px] gap-1 h-5">
                  {active ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};