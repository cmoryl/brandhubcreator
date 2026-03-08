/**
 * PanelDesigner — In-booth graphic panel composition tool.
 * Lets users design panel artwork with text, logos, images, and brand colors
 * directly inside the booth mapper, with live 3D preview and readability analysis.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Type, Image as ImageIcon, Palette, Move, Trash2, Plus,
  AlertTriangle, CheckCircle2, Eye, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  ZoomIn, ZoomOut, RotateCcw, Download, Copy, Layers,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { checkReadability, getRecommendedSizes, type ReadabilityResult } from './panelReadability';

/* ─── Types ────────────────────────────────────────────── */

interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'logo' | 'shape';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  // Text props
  text?: string;
  fontSize?: number; // pt
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  // Image props
  imageUrl?: string;
  objectFit?: 'cover' | 'contain';
  // Shape props
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
}

interface PanelDesignerProps {
  open: boolean;
  onClose: () => void;
  panelId: string;
  panelLabel: string;
  /** Physical size in feet [width, height] */
  panelSizeFt: [number, number];
  /** Brand colors (HSL strings) */
  brandColors?: string[];
  /** Existing image library URLs for logo/image placement */
  imageLibrary?: string[];
  /** Called with the generated panel image data URL */
  onApply: (imageDataUrl: string) => void;
  /** Existing design elements to restore */
  initialElements?: DesignElement[];
}

/* ─── Constants ────────────────────────────────────────── */

const CANVAS_HEIGHT = 600;
const SAFE_ZONE_INSET = 5; // 5% from edges

const DEFAULT_BRAND_COLORS = [
  'hsl(221, 83%, 53%)', // blue
  'hsl(0, 0%, 100%)',   // white
  'hsl(0, 0%, 0%)',     // black
  'hsl(0, 0%, 20%)',    // dark gray
  'hsl(48, 96%, 53%)',  // gold
];

/* ─── Component ────────────────────────────────────────── */

export function PanelDesigner({
  open,
  onClose,
  panelId,
  panelLabel,
  panelSizeFt,
  brandColors = DEFAULT_BRAND_COLORS,
  imageLibrary = [],
  onApply,
  initialElements = [],
}: PanelDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DesignElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('hsl(0, 0%, 100%)');
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showReadability, setShowReadability] = useState(true);
  const [zoom, setZoom] = useState(1);

  const [widthFt, heightFt] = panelSizeFt;
  const aspect = widthFt / heightFt;
  const canvasWidth = Math.round(CANVAS_HEIGHT * aspect);

  const selectedElement = useMemo(
    () => elements.find(e => e.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const recommended = useMemo(
    () => getRecommendedSizes(heightFt, CANVAS_HEIGHT),
    [heightFt]
  );

  // Readability analysis for all text elements
  const readabilityWarnings = useMemo(() => {
    if (!showReadability) return [];
    const warnings: { elementId: string; text: string; results: ReadabilityResult[] }[] = [];
    elements.forEach(el => {
      if (el.type !== 'text' || !el.fontSize) return;
      const results = checkReadability(el.fontSize, heightFt, CANVAS_HEIGHT);
      const hasIssue = results.some(r => !r.readable);
      if (hasIssue) {
        warnings.push({ elementId: el.id, text: el.text?.substring(0, 30) || 'Text', results });
      }
    });
    return warnings;
  }, [elements, heightFt, showReadability]);

  // Reset state when opening with new panel
  useEffect(() => {
    if (open) {
      if (initialElements.length > 0) {
        setElements(initialElements);
      } else {
        setElements([]);
      }
      setSelectedId(null);
      setZoom(1);
    }
  }, [open, panelId]);

  /* ── Element CRUD ── */
  const addElement = useCallback((type: DesignElement['type']) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const base: DesignElement = {
      id, type,
      x: 10, y: 10, width: 80, height: type === 'text' ? 12 : 30,
      opacity: 1,
    };

    if (type === 'text') {
      Object.assign(base, {
        text: 'Your headline here',
        fontSize: recommended.headline,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textAlign: 'center',
        color: 'hsl(0, 0%, 0%)',
      });
    } else if (type === 'shape') {
      Object.assign(base, {
        backgroundColor: brandColors[0] || 'hsl(221, 83%, 53%)',
        borderRadius: 0,
      });
    } else if (type === 'image' || type === 'logo') {
      Object.assign(base, {
        width: type === 'logo' ? 20 : 60,
        height: type === 'logo' ? 15 : 40,
        x: type === 'logo' ? 40 : 20,
        y: type === 'logo' ? 5 : 30,
        objectFit: type === 'logo' ? 'contain' : 'cover',
      });
    }

    setElements(prev => [...prev, base]);
    setSelectedId(id);
  }, [recommended, brandColors]);

  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const moveElementOrder = useCallback((id: string, direction: 'up' | 'down') => {
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setElements(prev => [...prev, { ...el, id: newId, x: el.x + 3, y: el.y + 3 }]);
    setSelectedId(newId);
  }, [elements]);

  /* ── Canvas rendering ── */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-res render (2x for quality)
    const scale = 2;
    canvas.width = canvasWidth * scale;
    canvas.height = CANVAS_HEIGHT * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT);

    // Render elements in order (back to front)
    elements.forEach(el => {
      const x = (el.x / 100) * canvasWidth;
      const y = (el.y / 100) * CANVAS_HEIGHT;
      const w = (el.width / 100) * canvasWidth;
      const h = (el.height / 100) * CANVAS_HEIGHT;

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.type === 'shape') {
        ctx.fillStyle = el.backgroundColor || 'hsl(221, 83%, 53%)';
        if (el.borderRadius) {
          roundRect(ctx, x, y, w, h, el.borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, h);
        }
      } else if (el.type === 'text' && el.text) {
        const style = `${el.fontStyle === 'italic' ? 'italic ' : ''}${el.fontWeight === 'bold' ? 'bold ' : ''}`;
        const fsize = el.fontSize || 24;
        ctx.font = `${style}${fsize * 1.333}px Poppins, sans-serif`;
        ctx.fillStyle = el.color || 'hsl(0, 0%, 0%)';
        ctx.textAlign = (el.textAlign || 'center') as CanvasTextAlign;
        ctx.textBaseline = 'top';

        const textX = el.textAlign === 'left' ? x : el.textAlign === 'right' ? x + w : x + w / 2;
        
        // Word wrap
        const words = el.text.split(' ');
        let line = '';
        let lineY = y + 4;
        const lineHeight = fsize * 1.333 * 1.3;

        words.forEach(word => {
          const testLine = line + (line ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > w && line) {
            ctx.fillText(line, textX, lineY);
            line = word;
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, textX, lineY);
      }

      ctx.restore();
    });

    // Safe zone guides
    if (showSafeZones) {
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      const inset = SAFE_ZONE_INSET / 100;
      ctx.strokeRect(
        canvasWidth * inset,
        CANVAS_HEIGHT * inset,
        canvasWidth * (1 - 2 * inset),
        CANVAS_HEIGHT * (1 - 2 * inset)
      );
      // Cut line (amber)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      const cut = inset * 0.6;
      ctx.strokeRect(
        canvasWidth * cut,
        CANVAS_HEIGHT * cut,
        canvasWidth * (1 - 2 * cut),
        CANVAS_HEIGHT * (1 - 2 * cut)
      );
      // Bleed line (red)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.strokeRect(0, 0, canvasWidth, CANVAS_HEIGHT);
      ctx.restore();
    }
  }, [elements, bgColor, canvasWidth, showSafeZones]);

  // Re-render on every change
  useEffect(() => {
    if (open) renderCanvas();
  }, [open, renderCanvas]);

  /* ── Export ── */
  const handleApply = useCallback(() => {
    renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    onApply(dataUrl);
    toast.success('Panel design applied to 3D preview');
    onClose();
  }, [renderCanvas, onApply, onClose]);

  /* ── Image picker for elements ── */
  const handlePickImage = useCallback((elementId: string, url: string) => {
    updateElement(elementId, { imageUrl: url });
  }, [updateElement]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Panel Designer — {panelLabel}
            <Badge variant="outline" className="text-xs ml-2">{widthFt}' × {heightFt}'</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left: Element tools */}
          <div className="w-[200px] shrink-0 border-r flex flex-col">
            <div className="p-2 border-b">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Add Element</p>
              <div className="grid grid-cols-2 gap-1">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1" onClick={() => addElement('text')}>
                  <Type className="h-3 w-3" /> Text
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1" onClick={() => addElement('image')}>
                  <ImageIcon className="h-3 w-3" /> Image
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1" onClick={() => addElement('logo')}>
                  <ImageIcon className="h-3 w-3" /> Logo
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1" onClick={() => addElement('shape')}>
                  <Layers className="h-3 w-3" /> Shape
                </Button>
              </div>
            </div>

            {/* Element layers list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Layers</p>
                {elements.length === 0 && (
                  <p className="text-[10px] text-muted-foreground py-3 text-center">Click above to add elements</p>
                )}
                {[...elements].reverse().map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors text-left",
                      selectedId === el.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                    )}
                  >
                    {el.type === 'text' ? <Type className="h-3 w-3 shrink-0" /> :
                     el.type === 'shape' ? <Layers className="h-3 w-3 shrink-0" /> :
                     <ImageIcon className="h-3 w-3 shrink-0" />}
                    <span className="truncate flex-1">
                      {el.type === 'text' ? (el.text?.substring(0, 18) || 'Text') :
                       el.type === 'logo' ? 'Logo' :
                       el.type === 'image' ? 'Image' : 'Shape'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Brand colors */}
            <div className="p-2 border-t">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">Brand Colors</p>
              <div className="flex flex-wrap gap-1">
                {brandColors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (selectedId) {
                        const el = elements.find(e => e.id === selectedId);
                        if (el?.type === 'text') updateElement(selectedId, { color });
                        else if (el?.type === 'shape') updateElement(selectedId, { backgroundColor: color });
                      } else {
                        setBgColor(color);
                      }
                    }}
                    className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                {selectedId ? 'Click to apply to selected' : 'Click to set background'}
              </p>
            </div>
          </div>

          {/* Center: Canvas preview */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Canvas toolbar */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20 shrink-0">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle pressed={showSafeZones} onPressedChange={setShowSafeZones} size="sm" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>Safe Zones</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Toggle pressed={showReadability} onPressedChange={setShowReadability} size="sm" className="h-7 w-7">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>Readability Check</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-5" />

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px]">
                  {widthFt}' × {heightFt}' ({Math.round(widthFt * 12)}" × {Math.round(heightFt * 12)}")
                </Badge>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
              <div
                className="relative border border-border shadow-lg bg-card"
                style={{
                  width: canvasWidth * zoom,
                  height: CANVAS_HEIGHT * zoom,
                }}
              >
                {/* Hidden canvas for rendering */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Visual preview */}
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: bgColor }}
                  onClick={() => setSelectedId(null)}
                >
                  {/* Elements overlay */}
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                      className={cn(
                        "absolute cursor-pointer transition-shadow",
                        selectedId === el.id && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        width: `${el.width}%`,
                        height: `${el.height}%`,
                        opacity: el.opacity ?? 1,
                      }}
                    >
                      {el.type === 'text' && (
                        <div
                          className="w-full h-full flex items-start overflow-hidden"
                          style={{
                            color: el.color || 'hsl(0, 0%, 0%)',
                            fontSize: `${(el.fontSize || 24) * zoom * 1.333}px`,
                            fontWeight: el.fontWeight || 'normal',
                            fontStyle: el.fontStyle || 'normal',
                            textAlign: el.textAlign || 'center',
                            fontFamily: 'Poppins, sans-serif',
                            lineHeight: 1.3,
                            padding: '2%',
                          }}
                        >
                          {el.text}
                        </div>
                      )}
                      {el.type === 'shape' && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: el.backgroundColor || 'hsl(221, 83%, 53%)',
                            borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                          }}
                        />
                      )}
                      {(el.type === 'image' || el.type === 'logo') && (
                        el.imageUrl ? (
                          <img
                            src={el.imageUrl}
                            alt=""
                            className="w-full h-full"
                            style={{ objectFit: el.objectFit || 'cover' }}
                          />
                        ) : (
                          <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50 rounded">
                            <div className="text-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                              <p className="text-[9px] text-muted-foreground">
                                {el.type === 'logo' ? 'Drop Logo' : 'Drop Image'}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ))}

                  {/* Safe zone overlays */}
                  {showSafeZones && (
                    <>
                      <div
                        className="absolute pointer-events-none border-2 border-dashed"
                        style={{
                          left: `${SAFE_ZONE_INSET}%`,
                          top: `${SAFE_ZONE_INSET}%`,
                          width: `${100 - SAFE_ZONE_INSET * 2}%`,
                          height: `${100 - SAFE_ZONE_INSET * 2}%`,
                          borderColor: 'rgba(34, 197, 94, 0.5)',
                        }}
                      >
                        <span className="absolute -top-4 left-1 text-[8px] font-mono" style={{ color: 'rgba(34, 197, 94, 0.8)' }}>
                          SAFE ZONE
                        </span>
                      </div>
                      <div
                        className="absolute pointer-events-none border border-dashed"
                        style={{
                          left: `${SAFE_ZONE_INSET * 0.6}%`,
                          top: `${SAFE_ZONE_INSET * 0.6}%`,
                          width: `${100 - SAFE_ZONE_INSET * 1.2}%`,
                          height: `${100 - SAFE_ZONE_INSET * 1.2}%`,
                          borderColor: 'rgba(245, 158, 11, 0.4)',
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Readability warnings bar */}
            {showReadability && readabilityWarnings.length > 0 && (
              <div className="border-t bg-destructive/5 px-3 py-2 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[11px] font-semibold text-destructive">Readability Issues</span>
                </div>
                <div className="space-y-1">
                  {readabilityWarnings.map(w => (
                    <div key={w.elementId} className="text-[10px]">
                      <span className="font-medium">"{w.text}"</span>
                      {w.results.filter(r => !r.readable).map((r, i) => (
                        <span key={i} className={cn(
                          "ml-2",
                          r.severity === 'error' ? "text-destructive" : "text-amber-600"
                        )}>
                          ⚠ {r.message}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showReadability && readabilityWarnings.length === 0 && elements.some(e => e.type === 'text') && (
              <div className="border-t bg-primary/5 px-3 py-1.5 shrink-0 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-primary font-medium">All text readable at standard distances</span>
              </div>
            )}
          </div>

          {/* Right: Properties inspector */}
          <div className="w-[220px] shrink-0 border-l overflow-y-auto">
            {selectedElement ? (
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold capitalize">{selectedElement.type}</p>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateElement(selectedElement.id)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveElementOrder(selectedElement.id, 'up')}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveElementOrder(selectedElement.id, 'down')}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeElement(selectedElement.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Position & Size */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Position & Size</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">X %</Label>
                      <Input type="number" value={selectedElement.x} min={0} max={100}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Y %</Label>
                      <Input type="number" value={selectedElement.y} min={0} max={100}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Width %</Label>
                      <Input type="number" value={selectedElement.width} min={1} max={100}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Height %</Label>
                      <Input type="number" value={selectedElement.height} min={1} max={100}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                        className="h-7 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">Opacity</Label>
                    <Slider
                      value={[selectedElement.opacity ?? 1]}
                      min={0} max={1} step={0.05}
                      onValueChange={([v]) => updateElement(selectedElement.id, { opacity: v })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Text properties */}
                {selectedElement.type === 'text' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Text</p>
                      <div>
                        <Label className="text-[10px]">Content</Label>
                        <Input
                          value={selectedElement.text || ''}
                          onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                          className="h-7 text-xs"
                          placeholder="Enter text..."
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">
                          Font Size (pt)
                          <span className="text-muted-foreground ml-1">
                            min {recommended.body}pt body
                          </span>
                        </Label>
                        <Input type="number" value={selectedElement.fontSize || 24} min={8} max={400}
                          onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                          className="h-7 text-xs" />
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-[8px] cursor-pointer hover:bg-primary/10"
                            onClick={() => updateElement(selectedElement.id, { fontSize: recommended.headline })}>
                            Headline {recommended.headline}pt
                          </Badge>
                          <Badge variant="outline" className="text-[8px] cursor-pointer hover:bg-primary/10"
                            onClick={() => updateElement(selectedElement.id, { fontSize: recommended.subhead })}>
                            Sub {recommended.subhead}pt
                          </Badge>
                          <Badge variant="outline" className="text-[8px] cursor-pointer hover:bg-primary/10"
                            onClick={() => updateElement(selectedElement.id, { fontSize: recommended.body })}>
                            Body {recommended.body}pt
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Toggle pressed={selectedElement.fontWeight === 'bold'}
                          onPressedChange={(v) => updateElement(selectedElement.id, { fontWeight: v ? 'bold' : 'normal' })}
                          size="sm" className="h-7 w-7">
                          <Bold className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle pressed={selectedElement.fontStyle === 'italic'}
                          onPressedChange={(v) => updateElement(selectedElement.id, { fontStyle: v ? 'italic' : 'normal' })}
                          size="sm" className="h-7 w-7">
                          <Italic className="h-3.5 w-3.5" />
                        </Toggle>
                        <Separator orientation="vertical" className="h-5 mx-1" />
                        <Toggle pressed={selectedElement.textAlign === 'left'}
                          onPressedChange={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                          size="sm" className="h-7 w-7">
                          <AlignLeft className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle pressed={selectedElement.textAlign === 'center'}
                          onPressedChange={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                          size="sm" className="h-7 w-7">
                          <AlignCenter className="h-3.5 w-3.5" />
                        </Toggle>
                        <Toggle pressed={selectedElement.textAlign === 'right'}
                          onPressedChange={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                          size="sm" className="h-7 w-7">
                          <AlignRight className="h-3.5 w-3.5" />
                        </Toggle>
                      </div>
                    </div>
                  </>
                )}

                {/* Shape properties */}
                {selectedElement.type === 'shape' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Shape</p>
                      <div>
                        <Label className="text-[10px]">Corner Radius</Label>
                        <Slider
                          value={[selectedElement.borderRadius || 0]}
                          min={0} max={50} step={1}
                          onValueChange={([v]) => updateElement(selectedElement.id, { borderRadius: v })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Image properties */}
                {(selectedElement.type === 'image' || selectedElement.type === 'logo') && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Image</p>
                      <div>
                        <Label className="text-[10px]">Image URL</Label>
                        <Input
                          value={selectedElement.imageUrl || ''}
                          onChange={(e) => updateElement(selectedElement.id, { imageUrl: e.target.value })}
                          className="h-7 text-xs"
                          placeholder="Paste URL or pick from library..."
                        />
                      </div>
                      <Select value={selectedElement.objectFit || 'cover'} onValueChange={(v) => updateElement(selectedElement.id, { objectFit: v as 'cover' | 'contain' })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Fill (Cover)</SelectItem>
                          <SelectItem value="contain">Fit (Contain)</SelectItem>
                        </SelectContent>
                      </Select>
                      {imageLibrary.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Library</p>
                          <div className="grid grid-cols-3 gap-1 max-h-[120px] overflow-y-auto">
                            {imageLibrary.slice(0, 12).map((url, i) => (
                              <button
                                key={i}
                                onClick={() => handlePickImage(selectedElement.id, url)}
                                className="h-10 rounded border overflow-hidden hover:ring-2 hover:ring-primary transition-shadow"
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Readability for this text element */}
                {selectedElement.type === 'text' && selectedElement.fontSize && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Readability</p>
                      {checkReadability(selectedElement.fontSize, heightFt, CANVAS_HEIGHT).map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {r.readable ? (
                            <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                          ) : r.severity === 'error' ? (
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          <span className={cn(
                            "text-[10px]",
                            r.readable ? "text-muted-foreground" : r.severity === 'error' ? "text-destructive" : "text-amber-600"
                          )}>
                            {r.distance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <p className="text-xs font-semibold">Background</p>
                <div className="flex flex-wrap gap-1">
                  {brandColors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setBgColor(color)}
                      className={cn(
                        "h-7 w-7 rounded border transition-all",
                        bgColor === color && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Recommended Sizes</p>
                  <p className="text-[10px] text-muted-foreground">For a {heightFt}' tall panel:</p>
                  <div className="space-y-0.5">
                    <p className="text-[10px]">📢 Headline: <span className="font-bold">{recommended.headline}pt+</span> <span className="text-muted-foreground">· visible at 20ft</span></p>
                    <p className="text-[10px]">📝 Subhead: <span className="font-bold">{recommended.subhead}pt+</span> <span className="text-muted-foreground">· visible at 12ft</span></p>
                    <p className="text-[10px]">📄 Body: <span className="font-bold">{recommended.body}pt+</span> <span className="text-muted-foreground">· visible at 6ft</span></p>
                  </div>
                </div>
                <Separator />
                <p className="text-[10px] text-muted-foreground">
                  Safe zones show the industry-standard 2" margin for production cut and bleed areas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{elements.length} elements</Badge>
            {readabilityWarnings.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{readabilityWarnings.length} readability issues</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleApply} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Apply to Panel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
