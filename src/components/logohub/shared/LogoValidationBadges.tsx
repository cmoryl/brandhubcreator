import { useEffect, useState, useCallback } from 'react';
import { Loader2, ShieldCheck, ShieldAlert, Eye, EyeOff, Download, Upload, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { validateLogoFiles, ISSUE_LABELS, type LogoValidationResult } from '@/lib/logoValidation';
import type { ClientLogoFile } from '@/types/brand';

interface BadgeProps {
  files: ClientLogoFile[];
  isExempt?: boolean;
  isResyncing?: boolean;
  onResync?: () => void;
  onEdit?: () => void;
  onToggleExempt?: () => void;
  /** Trigger validation on mount automatically */
  autoValidate?: boolean;
}

/** Hub-style validation badge. Lift-and-shift from GlobalLogoHub.ValidationBadge. */
export function LogoValidationBadge({
  files,
  isExempt = false,
  isResyncing = false,
  onResync,
  onEdit,
  onToggleExempt,
  autoValidate = false,
}: BadgeProps) {
  const [validation, setValidation] = useState<LogoValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const run = useCallback(async () => {
    setIsValidating(true);
    try {
      const r = await validateLogoFiles(files);
      setValidation(r);
    } finally {
      setIsValidating(false);
    }
  }, [files]);

  useEffect(() => {
    if (autoValidate && files.length) run();
  }, [autoValidate, files, run]);

  if (!files.length) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">No files uploaded</span>
        </div>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
          onValidate={run}
          isValidating={isValidating}
        />
      </div>
    );
  }

  if (!validation) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {isValidating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 opacity-40" />
          )}
          <span>{isValidating ? 'Validating files…' : 'Not validated'}</span>
        </div>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
          onValidate={run}
          isValidating={isValidating}
        />
      </div>
    );
  }

  if (validation.ok) {
    const variants = Array.from(new Set(validation.files.map((f) => f.variant))).sort();
    const sizes = validation.files
      .filter((f) => f.format === 'png' && f.width)
      .map((f) => `${f.variant} ${f.width}×${f.height}`);
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-emerald-600 dark:text-emerald-400" title={sizes.join(' · ')}>
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">All {validation.files.length} files valid · {variants.join(' / ')}</span>
        </div>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
          onValidate={run}
          isValidating={isValidating}
        />
      </div>
    );
  }

  const failingFiles = validation.files.filter((f) => !f.ok);

  if (isExempt) {
    return (
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground italic">
        <div className="flex items-center gap-1.5 min-w-0">
          <EyeOff className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {failingFiles.length} issue{failingFiles.length !== 1 ? 's' : ''} — exempt
          </span>
        </div>
        {onToggleExempt && (
          <button
            type="button"
            onClick={onToggleExempt}
            className="p-1 rounded hover:bg-secondary"
            title="Un-exempt — re-enable alerts"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center justify-between gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] text-destructive hover:underline min-w-0"
            >
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {failingFiles.length} file{failingFiles.length !== 1 ? 's' : ''} failed validation
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs space-y-2">
            {failingFiles.map((f, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-medium capitalize">
                  {f.variant} · {f.format.toUpperCase()}
                  {f.width ? ` · ${f.width}×${f.height}` : ''}
                </div>
                <ul className="list-disc pl-4 text-muted-foreground">
                  {f.issues.map((issue) => (
                    <li key={issue}>{ISSUE_LABELS[issue]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
        <ActionStrip
          isResyncing={isResyncing}
          isExempt={isExempt}
          onResync={onResync}
          onEdit={onEdit}
          onToggleExempt={onToggleExempt}
          onValidate={run}
          isValidating={isValidating}
        />
      </div>
    </TooltipProvider>
  );
}

function ActionStrip({
  isResyncing,
  isExempt,
  onResync,
  onEdit,
  onToggleExempt,
  onValidate,
  isValidating,
}: {
  isResyncing: boolean;
  isExempt: boolean;
  onResync?: () => void;
  onEdit?: () => void;
  onToggleExempt?: () => void;
  onValidate?: () => void;
  isValidating?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {onValidate && (
        <button
          type="button"
          onClick={onValidate}
          disabled={isValidating}
          className="p-1 rounded hover:bg-secondary disabled:opacity-50"
          title="Re-validate files"
        >
          {isValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </button>
      )}
      {onResync && (
        <button
          type="button"
          onClick={onResync}
          disabled={isResyncing}
          className="p-1 rounded hover:bg-secondary disabled:opacity-50"
          title="Re-download files from source"
        >
          {isResyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1 rounded hover:bg-secondary"
          title="Edit / upload manually"
        >
          <Upload className="h-3 w-3" />
        </button>
      )}
      {onToggleExempt && (
        <button
          type="button"
          onClick={onToggleExempt}
          className="p-1 rounded hover:bg-secondary"
          title={isExempt ? 'Re-enable alerts' : 'Mark as exempt'}
        >
          {isExempt ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}
