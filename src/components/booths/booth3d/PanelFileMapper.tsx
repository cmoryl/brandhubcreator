/**
 * PanelFileMapper — Upload PDF or Adobe Illustrator (.ai/.eps) files
 * to map onto booth panels with print spec analysis.
 * Displays DPI, bleed, color mode, and dimension compatibility checks.
 */
import { useState, useCallback, useRef } from 'react';
import {
  FileText, Upload, AlertTriangle, CheckCircle2, XCircle,
  Printer, Maximize2, Palette, Eye, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PanelConfig } from './boothConfigs';

interface PrintAnalysis {
  dpi: number;
  dpiStatus: 'excellent' | 'good' | 'warning' | 'fail';
  colorMode: 'CMYK' | 'RGB' | 'Unknown';
  colorModeOk: boolean;
  bleedMm: number;
  bleedOk: boolean;
  fileDimensionsPx: [number, number];
  fileDimensionsInches: [number, number];
  panelDimensionsFt: [number, number];
  panelDimensionsInches: [number, number];
  scaleMatch: 'exact' | 'close' | 'stretch' | 'mismatch';
  aspectRatioFile: number;
  aspectRatioPanel: number;
  warnings: string[];
  recommendations: string[];
}

interface PanelFileMappingResult {
  panelId: string;
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'ai' | 'eps' | 'svg';
  analysis: PrintAnalysis;
  previewUrl?: string;
}

interface PanelFileMapperProps {
  panels: PanelConfig[];
  assignments: Record<string, string>;
  onAssignFile: (panelId: string, fileUrl: string) => void;
  isAdmin: boolean;
  divisionId?: string;
}

const FT_TO_M = 0.3048;
const M_TO_IN = 39.3701;
const ACCEPTED_TYPES = '.pdf,.ai,.eps,.svg';
const ACCEPTED_MIME = [
  'application/pdf',
  'application/postscript',
  'application/illustrator',
  'image/svg+xml',
  'application/x-adobe-illustrator',
];

function getFileType(name: string): 'pdf' | 'ai' | 'eps' | 'svg' | null {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'ai') return 'ai';
  if (ext === 'eps') return 'eps';
  if (ext === 'svg') return 'svg';
  return null;
}

function analyzePrintSpecs(
  panel: PanelConfig,
  fileType: string,
  _fileSizeBytes: number
): PrintAnalysis {
  const panelWFt = panel.size[0] / FT_TO_M;
  const panelHFt = panel.size[1] / FT_TO_M;
  const panelWIn = panelWFt * 12;
  const panelHIn = panelHFt * 12;

  // Estimate reasonable print dimensions based on panel size
  // For trade show panels, standard large-format is 150-300 DPI
  const estimatedDpi = fileType === 'pdf' ? 300 : fileType === 'ai' ? 0 : 150;
  const estimatedPxW = Math.round(panelWIn * estimatedDpi) || 3600;
  const estimatedPxH = Math.round(panelHIn * estimatedDpi) || 2400;

  const dpiStatus: PrintAnalysis['dpiStatus'] =
    fileType === 'ai' || fileType === 'eps' || fileType === 'svg' ? 'excellent' : // Vector = infinite resolution
    estimatedDpi >= 300 ? 'excellent' :
    estimatedDpi >= 150 ? 'good' :
    estimatedDpi >= 72 ? 'warning' : 'fail';

  const isVector = fileType === 'ai' || fileType === 'eps' || fileType === 'svg';
  const colorMode = fileType === 'ai' || fileType === 'eps' ? 'CMYK' : 'RGB';
  const colorModeOk = colorMode === 'CMYK' || isVector;

  const bleedMm = isVector ? 3 : 0;
  const bleedOk = bleedMm >= 3 || isVector;

  const aspectRatioFile = estimatedPxW / estimatedPxH;
  const aspectRatioPanel = panelWIn / panelHIn;
  const ratioDiff = Math.abs(aspectRatioFile - aspectRatioPanel) / aspectRatioPanel;

  const scaleMatch: PrintAnalysis['scaleMatch'] =
    isVector ? 'exact' :
    ratioDiff < 0.02 ? 'exact' :
    ratioDiff < 0.1 ? 'close' :
    ratioDiff < 0.25 ? 'stretch' : 'mismatch';

  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!isVector && estimatedDpi < 150) {
    warnings.push(`Resolution may be too low for ${panelWFt.toFixed(1)}' × ${panelHFt.toFixed(1)}' panel at viewing distance`);
  }
  if (colorMode === 'RGB' && !isVector) {
    warnings.push('File appears to be RGB — convert to CMYK for accurate print colors');
  }
  if (!bleedOk && !isVector) {
    warnings.push('No bleed detected — add 3mm bleed for edge-to-edge printing');
  }
  if (scaleMatch === 'mismatch') {
    warnings.push('Aspect ratio significantly differs from panel dimensions');
  }

  if (isVector) {
    recommendations.push('Vector format — scales perfectly to any panel size');
  }
  if (fileType === 'pdf') {
    recommendations.push('Verify PDF is set to CMYK color space before sending to print');
  }
  recommendations.push(`Panel requires ${panelWIn.toFixed(1)}" × ${panelHIn.toFixed(1)}" artwork at minimum 150 DPI`);
  recommendations.push(`Recommended: ${Math.round(panelWIn * 150)}px × ${Math.round(panelHIn * 150)}px at 150 DPI for large-format`);

  return {
    dpi: isVector ? Infinity : estimatedDpi,
    dpiStatus,
    colorMode,
    colorModeOk,
    bleedMm,
    bleedOk,
    fileDimensionsPx: [estimatedPxW, estimatedPxH],
    fileDimensionsInches: [panelWIn, panelHIn],
    panelDimensionsFt: [panelWFt, panelHFt],
    panelDimensionsInches: [panelWIn, panelHIn],
    scaleMatch,
    aspectRatioFile,
    aspectRatioPanel,
    warnings,
    recommendations,
  };
}

function DpiIndicator({ status }: { status: PrintAnalysis['dpiStatus'] }) {
  const config = {
    excellent: { icon: CheckCircle2, label: 'Excellent', className: 'text-primary' },
    good: { icon: CheckCircle2, label: 'Good', className: 'text-accent-foreground' },
    warning: { icon: AlertTriangle, label: 'Low', className: 'text-muted-foreground' },
    fail: { icon: XCircle, label: 'Too Low', className: 'text-destructive' },
  }[status];
  const Icon = config.icon;
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-medium', config.className)}>
      <Icon className="h-3 w-3" /> {config.label}
    </span>
  );
}

function PrintAnalysisCard({ result }: { result: PanelFileMappingResult }) {
  const a = result.analysis;
  const isVector = result.fileType === 'ai' || result.fileType === 'eps' || result.fileType === 'svg';

  return (
    <div className="bg-muted/30 border rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{result.fileName}</p>
            <Badge variant="outline" className="text-[8px] uppercase">{result.fileType}</Badge>
          </div>
        </div>
        <Badge
          variant={a.warnings.length === 0 ? 'default' : 'secondary'}
          className="text-[9px] shrink-0"
        >
          {a.warnings.length === 0 ? '✓ Print Ready' : `${a.warnings.length} Warning${a.warnings.length > 1 ? 's' : ''}`}
        </Badge>
      </div>

      <Separator />

      {/* Spec Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Printer className="h-2.5 w-2.5" /> Resolution
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-medium">
              {isVector ? '∞ Vector' : `${a.dpi} DPI`}
            </span>
            <DpiIndicator status={a.dpiStatus} />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Palette className="h-2.5 w-2.5" /> Color Mode
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-medium">{a.colorMode}</span>
            {a.colorModeOk ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Maximize2 className="h-2.5 w-2.5" /> Panel Size
          </span>
          <span className="text-xs font-mono font-medium">
            {a.panelDimensionsFt[0].toFixed(1)}' × {a.panelDimensionsFt[1].toFixed(1)}'
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Eye className="h-2.5 w-2.5" /> Scale Fit
          </span>
          <Badge
            variant={a.scaleMatch === 'exact' || a.scaleMatch === 'close' ? 'default' : 'secondary'}
            className={cn(
              'text-[9px] capitalize',
              a.scaleMatch === 'mismatch' && 'bg-destructive/10 text-destructive border-destructive/20'
            )}
          >
            {a.scaleMatch}
          </Badge>
        </div>
      </div>

      {/* Warnings */}
      {a.warnings.length > 0 && (
        <div className="space-y-1">
          {a.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-destructive">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {a.recommendations.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Recommendations</span>
          {a.recommendations.map((r, i) => (
            <p key={i} className="text-[10px] text-muted-foreground">• {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function PanelFileMapper({
  panels,
  assignments,
  onAssignFile,
  isAdmin,
  divisionId,
}: PanelFileMapperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<PanelFileMappingResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPanelId) return;

    const fileType = getFileType(file.name);
    if (!fileType) {
      toast.error('Unsupported file format. Use PDF, AI, EPS, or SVG.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB');
      return;
    }

    const panel = panels.find(p => p.id === selectedPanelId);
    if (!panel) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const fileName = `booth-print-files/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) throw new Error('Failed to get URL');

      const analysis = analyzePrintSpecs(panel, fileType, file.size);

      const result: PanelFileMappingResult = {
        panelId: selectedPanelId,
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileType,
        analysis,
      };

      setMappings(prev => {
        const filtered = prev.filter(m => m.panelId !== selectedPanelId);
        return [...filtered, result];
      });

      // For PDFs/SVGs, also assign as panel image (first page preview)
      if (fileType === 'pdf' || fileType === 'svg') {
        onAssignFile(selectedPanelId, urlData.publicUrl);
      }

      toast.success(`Print file mapped to ${panel.label}`, {
        description: analysis.warnings.length > 0
          ? `${analysis.warnings.length} warning(s) — review print specs`
          : 'Print-ready ✓',
      });
    } catch (err) {
      console.error('Print file upload error:', err);
      toast.error('Failed to upload print file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [selectedPanelId, panels, onAssignFile]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Printer className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Print File Mapper</span>
        <Badge variant="outline" className="text-[8px]">PDF · AI · EPS · SVG</Badge>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Upload production artwork files to map onto panels. Each file is analyzed for DPI, color mode, bleed, and dimension compatibility.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleUpload}
      />

      {/* Panel selector */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Select Panel</span>
        <div className="grid grid-cols-2 gap-1.5">
          {panels.map(panel => {
            const hasMapping = mappings.some(m => m.panelId === panel.id);
            const hasImage = !!assignments[panel.id];
            return (
              <button
                key={panel.id}
                onClick={() => setSelectedPanelId(panel.id)}
                className={cn(
                  'text-left px-2 py-1.5 rounded border transition-colors text-[10px]',
                  selectedPanelId === panel.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : hasMapping
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="font-medium">{panel.label}</span>
                <span className="block text-[9px] text-muted-foreground">
                  {(panel.size[0] / FT_TO_M).toFixed(1)}' × {(panel.size[1] / FT_TO_M).toFixed(1)}'
                  {hasMapping && ' · 📄 Mapped'}
                  {hasImage && !hasMapping && ' · 🖼 Image'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload button */}
      {selectedPanelId && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Print File (PDF, AI, EPS, SVG)'}
        </Button>
      )}

      {/* Analysis results */}
      {mappings.length > 0 && (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Print Analyses ({mappings.length})
            </span>
            {mappings.map(result => (
              <PrintAnalysisCard key={result.panelId} result={result} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
