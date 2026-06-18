import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  diffSignatures,
  useSvgRenderSnapshot,
  type SnapshotVariant,
} from '@/hooks/useSvgRenderSnapshot';

export type SnapshotRenderStatus = 'pending' | 'ok' | 'fail';

interface Props {
  url: string;
  canEdit?: boolean;
  /** Auto-trigger a render once per session (cached per URL). Defaults to true. */
  autoRender?: boolean;
  /** Notified whenever the deterministic server-side render state changes. */
  onRenderStatus?: (status: SnapshotRenderStatus, detail?: string) => void;
}

// Module-level cache so the audit page doesn't re-render every SVG on every
// remount. Each URL is rendered at most once per session unless the user
// manually clicks "Re-render".
const sessionRendered = new Set<string>();


const VARIANTS: { key: SnapshotVariant; label: string; bg: string }[] = [
  { key: 'transparent', label: 'Transparent', bg: 'bg-[conic-gradient(at_25%_25%,#ddd_25%,#fff_0_50%,#ddd_0_75%,#fff_0)] bg-[length:12px_12px]' },
  { key: 'white', label: 'White', bg: 'bg-white' },
  { key: 'black', label: 'Black', bg: 'bg-black' },
];

const REGRESSION_THRESHOLD = 2; // % mean luminance delta — anything above flags as drift

function diffTone(pct: number) {
  if (pct < 0.1) return 'text-emerald-600';
  if (pct < REGRESSION_THRESHOLD) return 'text-amber-600';
  return 'text-red-600';
}

export function SvgSnapshotCell({ url, canEdit = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const {
    baseline,
    current,
    loading,
    saving,
    error,
    render,
    saveBaseline,
    clearBaseline,
  } = useSvgRenderSnapshot(url);

  const diffs = useMemo(() => {
    if (!current || !baseline) return null;
    return {
      transparent: diffSignatures(
        current.variants.transparent.signature,
        baseline.sig_transparent,
        current.variants.transparent.sha256,
        baseline.sha_transparent,
      ),
      white: diffSignatures(
        current.variants.white.signature,
        baseline.sig_white,
        current.variants.white.sha256,
        baseline.sha_white,
      ),
      black: diffSignatures(
        current.variants.black.signature,
        baseline.sig_black,
        current.variants.black.sha256,
        baseline.sha_black,
      ),
    };
  }, [current, baseline]);

  const overallStatus = useMemo(() => {
    if (!diffs) return null;
    const worst = Math.max(
      diffs.transparent.diffPercent,
      diffs.white.diffPercent,
      diffs.black.diffPercent,
    );
    if (
      diffs.transparent.shaEqual &&
      diffs.white.shaEqual &&
      diffs.black.shaEqual
    ) {
      return { label: 'Identical', tone: 'bg-emerald-100 text-emerald-700' };
    }
    if (worst < REGRESSION_THRESHOLD) {
      return { label: `Drift ${worst.toFixed(2)}%`, tone: 'bg-amber-100 text-amber-700' };
    }
    return { label: `Regression ${worst.toFixed(2)}%`, tone: 'bg-red-100 text-red-700' };
  }, [diffs]);

  return (
    <div className="mt-1.5 border border-border/50 rounded-md px-2 py-1.5 text-[10px]">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-medium text-foreground/80 hover:text-foreground"
        >
          Render snapshot {expanded ? '▾' : '▸'}
        </button>
        <div className="flex items-center gap-1.5">
          {baseline && (
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              baseline set
            </span>
          )}
          {overallStatus && (
            <span className={cn('px-1.5 py-0.5 rounded font-medium', overallStatus.tone)}>
              {overallStatus.label}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px]"
              onClick={render}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Camera className="h-3 w-3 mr-1" />
              )}
              {baseline ? 'Re-render & diff' : 'Render'}
            </Button>
            {canEdit && current && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px]"
                onClick={saveBaseline}
                disabled={saving}
              >
                <Save className="h-3 w-3 mr-1" />
                {baseline ? 'Update baseline' : 'Save as baseline'}
              </Button>
            )}
            {canEdit && baseline && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-red-600 hover:text-red-700"
                onClick={clearBaseline}
                disabled={saving}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear baseline
              </Button>
            )}
          </div>

          {error && <div className="text-red-600">{error}</div>}

          {(current || baseline) && (
            <div className="grid grid-cols-3 gap-2">
              {VARIANTS.map((v) => {
                const currentPng = current?.variants[v.key].pngBase64;
                const baselinePng =
                  v.key === 'transparent'
                    ? baseline?.png_transparent
                    : v.key === 'white'
                      ? baseline?.png_white
                      : baseline?.png_black;
                const d = diffs?.[v.key];
                return (
                  <div key={v.key} className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                      {v.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">Baseline</div>
                        <div
                          className={cn(
                            'aspect-square rounded border border-border/50 overflow-hidden',
                            v.bg,
                          )}
                        >
                          {baselinePng ? (
                            <img
                              src={`data:image/png;base64,${baselinePng}`}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted-foreground mb-0.5">Current</div>
                        <div
                          className={cn(
                            'aspect-square rounded border border-border/50 overflow-hidden',
                            v.bg,
                          )}
                        >
                          {currentPng ? (
                            <img
                              src={`data:image/png;base64,${currentPng}`}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      </div>
                    </div>
                    {d && (
                      <div className={cn('text-[9px] font-medium', diffTone(d.diffPercent))}>
                        Δ {d.diffPercent.toFixed(2)}% · max {d.maxDelta}
                        {d.shaEqual && ' · byte-identical'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!current && !baseline && !loading && (
            <div className="text-muted-foreground">
              No snapshot yet. Click Render to capture deterministic PNGs server-side.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
