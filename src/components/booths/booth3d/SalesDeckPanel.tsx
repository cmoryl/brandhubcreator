/**
 * SalesDeckPanel - One-click booth sales deck generator
 * Generates AI-powered presentation slides with PPT/PDF/Share export
 */
import { useState, useCallback, useRef } from 'react';
import {
  Loader2, FileText, Download, Share2, Copy, CheckCircle2,
  Presentation, Layout, Route, Layers, Monitor, DollarSign,
  Eye, ChevronDown, ChevronUp, Sparkles, FileDown, Link2,
  Users, RotateCcw, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PDF_COLORS, PDF_TYPOGRAPHY, PDF_SPACING, PDF_FONTS, PDF_HTML2PDF_BASE_OPTIONS, applyPdfContainerStyles, generatePdfFooter } from '@/lib/pdfStyleConfig';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { SalesDeckSlide, SalesDeckData, SalesDeckGenerateRequest } from './salesDeckTypes';

interface SalesDeckPanelProps {
  divisionName?: string;
  layoutName: string;
  boothSize: string;
  panelLabels: string[];
  furnitureList: string[];
  hasMonitors: boolean;
  crowdScore?: number;
  variantLabel: string;
  isAdmin: boolean;
  /** Callback to capture a screenshot of the current 3D scene */
  onCaptureScreenshot?: () => Promise<string | null>;
}

const SLIDE_ICONS: Record<string, React.ReactNode> = {
  overview: <Presentation className="h-4 w-4" />,
  perspective: <Eye className="h-4 w-4" />,
  layout: <Layout className="h-4 w-4" />,
  journey: <Route className="h-4 w-4" />,
  panels: <Layers className="h-4 w-4" />,
  hardware: <Monitor className="h-4 w-4" />,
  cost: <DollarSign className="h-4 w-4" />,
};

const SLIDE_COLORS: Record<string, string> = {
  overview: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  perspective: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  layout: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  journey: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  panels: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  hardware: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cost: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
};

export function SalesDeckPanel({
  divisionName = 'Booth',
  layoutName,
  boothSize,
  panelLabels,
  furnitureList,
  hasMonitors,
  crowdScore,
  variantLabel,
  isAdmin,
  onCaptureScreenshot,
}: SalesDeckPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [deckData, setDeckData] = useState<SalesDeckData | null>(null);
  const [expandedSlide, setExpandedSlide] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('slides');
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const payload: SalesDeckGenerateRequest = {
        divisionName,
        layoutName,
        boothSize,
        panelCount: panelLabels.length,
        furnitureList,
        hasMonitors,
        panelLabels,
        variantLabel,
        crowdScore,
      };

      const { data, error } = await supabase.functions.invoke('booth-sales-deck', {
        body: payload,
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const slides: SalesDeckSlide[] = (data.slides || []).map((s: any, i: number) => ({
        id: `slide-${i}`,
        title: s.title,
        slideType: s.slideType,
        content: {
          headline: s.headline,
          bullets: s.bullets || [],
          notes: s.notes,
        },
        included: true,
      }));

      setDeckData({
        title: data.title || `${divisionName} Booth Deck`,
        subtitle: data.subtitle || `${layoutName} ${boothSize}`,
        slides,
        generatedAt: new Date().toISOString(),
        boothSize,
        layoutName,
      });

      toast.success('Sales deck generated!');
    } catch (err: any) {
      console.error('Sales deck generation failed:', err);
      toast.error(err?.message || 'Failed to generate sales deck');
    } finally {
      setIsGenerating(false);
    }
  }, [divisionName, layoutName, boothSize, panelLabels, furnitureList, hasMonitors, variantLabel, crowdScore]);

  const toggleSlideIncluded = (slideId: string) => {
    if (!deckData) return;
    setDeckData({
      ...deckData,
      slides: deckData.slides.map(s =>
        s.id === slideId ? { ...s, included: !s.included } : s
      ),
    });
  };

  const handleExportPDF = useCallback(async () => {
    if (!deckData) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:0;left:0;width:800px;z-index:-1;opacity:0.01;pointer-events:none;background:#fff;color:#111;';
      
      const includedSlides = deckData.slides.filter(s => s.included);
      
      container.innerHTML = `
        <div style="font-family:'Segoe UI',system-ui,sans-serif;padding:40px;">
          <div style="text-align:center;margin-bottom:60px;padding:60px 40px;background:linear-gradient(135deg,#1e293b,#334155);border-radius:16px;">
            <h1 style="font-size:36px;font-weight:700;color:#fff;margin:0 0 12px;">${deckData.title}</h1>
            <p style="font-size:18px;color:#94a3b8;margin:0;">${deckData.subtitle}</p>
            <p style="font-size:13px;color:#64748b;margin-top:24px;">${new Date(deckData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          ${includedSlides.map((slide, i) => `
            <div style="page-break-inside:avoid;margin-bottom:40px;${i > 0 ? 'page-break-before:always;' : ''}">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <span style="background:#3b82f6;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${i + 1}</span>
                <h2 style="font-size:24px;font-weight:600;color:#1e293b;margin:0;">${slide.title}</h2>
              </div>
              <div style="background:#f8fafc;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
                <p style="font-size:18px;font-weight:600;color:#334155;margin:0 0 16px;">${slide.content.headline}</p>
                <ul style="margin:0;padding-left:20px;list-style:disc;">
                  ${slide.content.bullets.map(b => `<li style="font-size:14px;color:#475569;margin-bottom:8px;line-height:1.6;">${b}</li>`).join('')}
                </ul>
                ${slide.content.notes ? `<p style="font-size:12px;color:#94a3b8;margin-top:16px;font-style:italic;border-top:1px solid #e2e8f0;padding-top:12px;">Speaker Notes: ${slide.content.notes}</p>` : ''}
              </div>
            </div>
          `).join('')}
          <div style="text-align:center;padding-top:20px;border-top:1px solid #e2e8f0;margin-top:40px;">
            <p style="font-size:11px;color:#94a3b8;">Generated by BrandHub • ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${divisionName.replace(/\s+/g, '_')}_Booth_Sales_Deck.pdf`,
        image: { type: 'jpeg', quality: 0.85 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      }).from(container).save();

      document.body.removeChild(container);
      toast.success('PDF exported!');
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [deckData, divisionName]);

  const handleExportPPT = useCallback(async () => {
    if (!deckData) return;
    setIsExporting(true);
    try {
      // Generate a simple HTML-based presentation file that can be opened in PowerPoint
      const includedSlides = deckData.slides.filter(s => s.included);
      
      const pptHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{margin:0;font-family:'Segoe UI',sans-serif;}
  .slide{width:960px;height:540px;page-break-after:always;position:relative;padding:40px;box-sizing:border-box;}
  .title-slide{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
  .content-slide{background:#fff;color:#1e293b;}
  h1{font-size:36px;margin:0 0 16px;}
  h2{font-size:28px;margin:0 0 24px;color:#1e293b;}
  .headline{font-size:20px;font-weight:600;color:#334155;margin-bottom:20px;}
  ul{font-size:16px;line-height:1.8;color:#475569;}
  .slide-num{position:absolute;bottom:16px;right:24px;font-size:12px;color:#94a3b8;}
  .subtitle{font-size:18px;color:#94a3b8;}
</style></head><body>
<div class="slide title-slide">
  <h1>${deckData.title}</h1>
  <p class="subtitle">${deckData.subtitle}</p>
</div>
${includedSlides.map((s, i) => `
<div class="slide content-slide">
  <h2>${s.title}</h2>
  <p class="headline">${s.content.headline}</p>
  <ul>${s.content.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
  <span class="slide-num">${i + 2}</span>
</div>`).join('')}
</body></html>`;

      const blob = new Blob([pptHtml], { type: 'application/vnd.ms-powerpoint' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${divisionName.replace(/\s+/g, '_')}_Booth_Sales_Deck.ppt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PowerPoint exported!');
    } catch (err) {
      console.error('PPT export failed:', err);
      toast.error('Failed to export PPT');
    } finally {
      setIsExporting(false);
    }
  }, [deckData, divisionName]);

  const handleCopyShareLink = useCallback(() => {
    // Generate a temporary share summary
    if (!deckData) return;
    const includedSlides = deckData.slides.filter(s => s.included);
    const summary = `${deckData.title}\n${deckData.subtitle}\n\n${includedSlides.map((s, i) => `${i + 1}. ${s.title}: ${s.content.headline}`).join('\n')}`;
    navigator.clipboard.writeText(summary);
    toast.success('Deck summary copied to clipboard!');
  }, [deckData]);

  // Empty state - generate button
  if (!deckData && !isGenerating) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Presentation className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Sales Deck Generator</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Auto-generate a professional presentation deck from your booth configuration.
          Includes overview, perspectives, layout, visitor journey, panels, hardware, and cost estimate.
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {['overview', 'perspective', 'layout', 'journey', 'panels', 'hardware', 'cost'].map(type => (
            <div key={type} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border", SLIDE_COLORS[type])}>
              {SLIDE_ICONS[type]}
              <span className="text-[9px] font-medium capitalize">{type}</span>
            </div>
          ))}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={!isAdmin}
          className="w-full gap-2"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          Generate Sales Deck
        </Button>
        {!isAdmin && (
          <p className="text-[10px] text-muted-foreground text-center">Admin access required</p>
        )}
      </div>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Generating sales deck...</p>
        <p className="text-xs text-muted-foreground">AI is crafting 7 slides for your booth</p>
      </div>
    );
  }

  if (!deckData) return null;

  const includedCount = deckData.slides.filter(s => s.included).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">{deckData.title}</h3>
            <p className="text-[10px] text-muted-foreground">{deckData.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {includedCount}/{deckData.slides.length} slides
          </Badge>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleGenerate}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="slides" className="text-xs gap-1">
            <Layers className="h-3 w-3" />
            Slides
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs gap-1">
            <Download className="h-3 w-3" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slides" className="mt-2">
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-2">
              {deckData.slides.map((slide, index) => (
                <Card
                  key={slide.id}
                  className={cn(
                    "p-3 transition-all cursor-pointer",
                    !slide.included && "opacity-40",
                    expandedSlide === slide.id && "ring-1 ring-primary/40"
                  )}
                  onClick={() => setExpandedSlide(expandedSlide === slide.id ? null : slide.id)}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSlideIncluded(slide.id); }}
                      className="mt-0.5 shrink-0"
                    >
                      {slide.included
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <div className={cn("p-1.5 rounded shrink-0", SLIDE_COLORS[slide.slideType])}>
                      {SLIDE_ICONS[slide.slideType]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">#{index + 1}</span>
                        <span className="text-xs font-semibold truncate">{slide.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{slide.content.headline}</p>
                    </div>
                    {expandedSlide === slide.id
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>

                  {expandedSlide === slide.id && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                      <ul className="space-y-1.5 pl-4">
                        {slide.content.bullets.map((bullet, bi) => (
                          <li key={bi} className="text-xs text-muted-foreground list-disc leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                      {slide.content.notes && (
                        <div className="bg-muted/50 rounded-md p-2 mt-2">
                          <p className="text-[10px] text-muted-foreground italic">
                            <span className="font-medium not-italic">Speaker Notes:</span> {slide.content.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="export" className="mt-2 space-y-3">
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleExportPPT}
              disabled={isExporting || includedCount === 0}
            >
              <div className="p-1.5 rounded bg-orange-500/10">
                <Presentation className="h-4 w-4 text-orange-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">PowerPoint (.ppt)</p>
                <p className="text-[10px] text-muted-foreground">Open in PowerPoint, Keynote, Google Slides</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleExportPDF}
              disabled={isExporting || includedCount === 0}
            >
              <div className="p-1.5 rounded bg-red-500/10">
                <FileText className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">PDF Document</p>
                <p className="text-[10px] text-muted-foreground">Print-ready landscape presentation</p>
              </div>
            </Button>

            <Separator />

            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={handleCopyShareLink}
              disabled={includedCount === 0}
            >
              <div className="p-1.5 rounded bg-blue-500/10">
                <Copy className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">Copy Summary</p>
                <p className="text-[10px] text-muted-foreground">Copy slide outline to clipboard for sharing</p>
              </div>
            </Button>
          </div>

          {isExporting && (
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs text-muted-foreground">Exporting...</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
