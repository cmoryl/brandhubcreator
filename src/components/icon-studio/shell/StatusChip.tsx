/**
 * StatusChip — premium status pill driven by TransPerfect tokens.
 *
 * Variants: queued / generating / review / approved / failed / locked / idle.
 * Uses inline color-mix on a TP token so we don't bloat the Tailwind config.
 */

import { Loader2, CheckCircle2, AlertCircle, Lock, Clock, Eye, Circle } from 'lucide-react';
import { SectionStatus, STATUS_META } from './studioData';

interface Props {
  status: SectionStatus;
  /** Override the label (default: status meta label) */
  label?: string;
  /** Add a leading dot indicator only (no icon) */
  compact?: boolean;
}

const ICONS: Record<SectionStatus, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  idle: Circle,
  queued: Clock,
  generating: Loader2,
  review: Eye,
  approved: CheckCircle2,
  failed: AlertCircle,
  locked: Lock,
};

export const StatusChip = ({ status, label, compact }: Props) => {
  const meta = STATUS_META[status];
  const Icon = ICONS[status];
  const spin = status === 'generating';

  const style: React.CSSProperties = {
    color: `hsl(${meta.tokenVar})`,
    borderColor: `hsl(${meta.tokenVar} / 0.4)`,
    background: `hsl(${meta.tokenVar} / 0.1)`,
  };

  return (
    <span className="tp-chip" style={style} aria-label={`Status: ${meta.label}`}>
      {compact ? (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: `hsl(${meta.tokenVar})` }}
          aria-hidden
        />
      ) : (
        <Icon className={`h-3 w-3 ${spin ? 'animate-spin' : ''}`} aria-hidden />
      )}
      <span>{label ?? meta.label}</span>
    </span>
  );
};
