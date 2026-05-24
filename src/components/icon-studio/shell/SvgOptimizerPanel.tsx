/**
 * SvgOptimizerPanel — Batch SVG optimization with SVGO.
 *
 * Features:
 * - 3 presets (Safe, Default, Aggressive)
 * - Before/after diff preview with side-by-side SVG render
 * - Per-icon and aggregate savings stats
 * - Download optimized set as ZIP
 * - Revert / apply controls
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Zap, Download, RotateCcw, Check, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Eye, Package, FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { useSvgOptimizer, SVGO_PRESETS, type IconOptimizationResult } from '@/hooks/useSvgOptimizer';
import type { IconLibrary } from '@/hooks/useIconLibraries';
import type { BrandIconography } from '@/types/brand';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Props {
  libraries: IconLibrary[];
  organizationName: string;
}

function extractSvgString(icon: BrandIconography): string {
  if (icon.svgPath) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${icon.svgPath}</svg>`;
  }
  if (icon.svgUrl) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><!-- ${icon.svgUrl} --></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><!-- no path --></svg>`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export const SvgOptimizerPanel = ({ libraries, organizationName }: Props) => {
  const { toast } = useToast();
  const { presets, isOptimizing, latestRun, optimizeBatch, abort } = useSvgOptimizer();
  const [selectedPreset, setSelectedPreset] = useState<'safe' | 'default' | 'aggressive'>('default');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewResult, setPreviewResult] = useState<IconOptimizationResult | null>(null);

  const allIcons = useMemo(() => {
    const items: { id: string; name: string; svg: string; libraryName: string }[] = [];
    libraries.forEach((lib) => {
      lib.icons.forEach((icon, idx) => {
        items.push({
          id: `${lib.id}::${idx}`,
          name: icon.name || `icon-${idx + 1}`,
          svg: extractSvgString(icon),
          libraryName: lib.name,
        });
      });
    });
    return items;
  }, [libraries]);

  const filteredIcons = useMemo(() => {
    if (selectedIds.size === 0) return allIcons;
    return allIcons.filter((i) => selectedIds.has(i.id));
  }, [allIcons, selectedIds]);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => (prev.size === allIcons.length ? new Set() : new Set(allIcons.map((i) => i.id))));
  }, [allIcons]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRun = useCallback(async () => {
    if (filteredIcons.length === 0) {
      toast({ title: 'No icons selected', description: 'Select at least one icon to optimize.' });
      return;
    }
    setPreviewResult(null);
    const run = await optimizeBatch(filteredIcons, selectedPreset);
    toast({
      title: `Optimized ${run.results.length} icons`,
      description: `${run.totalSavingsPercent}% smaller · ${formatBytes(run.totalBefore)} → ${formatBytes(run.totalAfter)} · ${run.durationMs}ms`,
    });
  }, [filteredIcons, selectedPreset, optimizeBatch, toast]);

  const handlePreview = useCallback(async (icon: typeof allIcons[number]) => {
    const run = await optimizeBatch([icon], selectedPreset);
    if (run.results[0]) {
      setPreviewResult(run.results[0]);
      setExpandedRows((prev) => {
        const next = new Set(prev);
        next.add(icon.id);
        return next;
      });
    }
  }, [optimizeBatch, selectedPreset]);

  const downloadZip = useCallback(async () => {
    if (!latestRun) return;
    const zip = new JSZip();
    const folder = zip.folder(`${organizationName}-optimized-icons`.replace(/\s+/g, '-').toLowerCase());
    if (!folder) return;

    latestRun.results.forEach((r) => {
      if (r.success) {
        folder.file(`${r.name}.svg`, r.afterSvg);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${organizationName}-optimized-icons.zip`);
    toast({ title: 'Download started', description: `${latestRun.results.filter((r) => r.success).length} icons exported.` });
  }, [latestRun, organizationName, toast]);

  const downloadManifest = useCallback(() => {
    if (!latestRun) return;
    const manifest = {
      preset: selectedPreset,
      totalBefore: latestRun.totalBefore,
      totalAfter: latestRun.totalAfter,
      totalSavingsPercent: latestRun.totalSavingsPercent,
      durationMs: latestRun.durationMs,
      icons: latestRun.results.map((r) => ({
        name: r.name,
        beforeBytes: r.beforeBytes,
        afterBytes: r.afterBytes,
        savingsPercent: r.savingsPercent,
        success: r.success,
        warnings: r.warnings,
      })),
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    saveAs(blob, 'optimization-manifest.json');
  }, [latestRun, selectedPreset]);

  if (allIcons.length === 0) {
    return (
      <div className="tp-card p-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">No icons to optimize</h3>
        <p className="text-sm text-muted-foreground">
          Add icons to your libraries first, then return here to optimize them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="tp-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, hsl(var(--tp-teal)), hsl(var(--tp-green)))' }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold">SVG Optimizer</h3>
              <p className="text-xs text-muted-foreground">
                {allIcons.length} icon{allIcons.length !== 1 ? 's' : ''} across {libraries.length} librar{libraries.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Preset selector */}
            <div className="flex items-center gap-1 rounded-md border bg-secondary/40 px-2 py-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id as any)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    selectedPreset === p.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={p.description}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              className="gap-2 h-8"
              disabled={isOptimizing || filteredIcons.length === 0}
              onClick={handleRun}
            >
              {isOptimizing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {isOptimizing ? 'Optimizing…' : 'Run Optimization'}
            </Button>
            {isOptimizing && (
              <Button size="sm" variant="outline" className="h-8" onClick={abort}>
                Abort
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        {latestRun && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Before" value={formatBytes(latestRun.totalBefore)} />
            <StatBox label="Total After" value={formatBytes(latestRun.totalAfter)} />
            <StatBox
              label="Savings"
              value={`${latestRun.totalSavingsPercent}%`}
              accent={latestRun.totalSavingsPercent > 20}
            />
            <StatBox label="Failed" value={String(latestRun.failedCount)} danger={latestRun.failedCount > 0} />
          </div>
        )}

        {/* Download actions */}
        {latestRun && latestRun.results.some((r) => r.success) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={downloadZip}>
              <Download className="h-3.5 w-3.5" />
              Download ZIP
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={downloadManifest}>
              <FileDown className="h-3.5 w-3.5" />
              Manifest JSON
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 h-8" onClick={() => setLatestRun(null)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Icon list */}
      <div className="tp-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <Checkbox
            checked={selectedIds.size === allIcons.length && allIcons.length > 0}
            onCheckedChange={toggleAll}
            aria-label="Select all icons"
          />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select icons to optimize'}
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {allIcons.map((icon) => {
            const result = latestRun?.results.find((r) => r.id === icon.id);
            const isExpanded = expandedRows.has(icon.id);
            const isSelected = selectedIds.has(icon.id) || selectedIds.size === 0;

            return (
              <div key={icon.id}>
                <button
                  onClick={() => toggleExpand(icon.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(icon.id)}
                    onCheckedChange={() => toggleOne(icon.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${icon.name}`}
                  />
                  <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded border bg-background">
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(icon.svg)}`}
                      alt={icon.name}
                      className="h-5 w-5"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{icon.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{icon.libraryName}</div>
                  </div>

                  {result ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {result.success ? (
                        <Badge variant="outline" className="gap-1 text-xs h-5" style={{ color: 'hsl(var(--tp-green))' }}>
                          <Check className="h-3 w-3" />
                          {result.savingsPercent > 0 ? `-${result.savingsPercent}%` : '0%'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs h-5 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground w-20 text-right tabular-nums">
                        {formatBytes(result.afterBytes)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(icon);
                        }}
                        disabled={isOptimizing}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded diff */}
                {isExpanded && (result || previewResult) && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20">
                    {(result || previewResult) && (
                      <>
                        <DiffCard
                          label="Before"
                          bytes={(result || previewResult)?.beforeBytes ?? 0}
                          svg={(result || previewResult)?.beforeSvg ?? ''}
                        />
                        <DiffCard
                          label="After"
                          bytes={(result || previewResult)?.afterBytes ?? 0}
                          svg={(result || previewResult)?.afterSvg ?? ''}
                          savings={(result || previewResult)?.savingsPercent ?? 0}
                          warnings={(result || previewResult)?.warnings ?? []}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function StatBox({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          'text-lg font-semibold tabular-nums',
          danger && 'text-destructive',
          accent && 'text-primary'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DiffCard({
  label,
  bytes,
  svg,
  savings,
  warnings,
}: {
  label: string;
  bytes: number;
  svg: string;
  savings?: number;
  warnings?: string[];
}) {
  return (
    <div className="rounded-lg border bg-background p-4 space-y-3" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{formatBytes(bytes)}</span>
      </div>
      <div className="flex items-center justify-center h-24 bg-secondary/30 rounded-md border" style={{ borderColor: 'hsl(var(--border))' }}>
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
          alt={`${label} preview`}
          className="h-16 w-16"
        />
      </div>
      {savings !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Saved {savings}%</span>
          {savings > 0 && (
            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(savings, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
      {warnings && warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
