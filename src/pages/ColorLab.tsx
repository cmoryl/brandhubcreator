/**
 * Color Lab — Advanced Color Accessibility, Bias Analysis & Research Tool
 * 
 * Features:
 * - Manual color input (hex picker + text)
 * - Import colors from existing brand guides
 * - Image color extraction (k-means clustering)
 * - WCAG 2.2 + APCA contrast checking with font recommendations
 * - Colorblind simulations (4 types) with safety scoring
 * - Color harmony analysis + psychology
 * - AI-powered cultural bias & inclusivity analysis (auth required)
 * - AI-powered research report generation (auth required)
 * - Full color codes: HEX, RGB, HSL, CMYK, OKLCH, nearest Pantone
 * - Print vs digital suitability recommendations
 */

import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Palette, Eye, Printer, Monitor, Copy, Check,
  ArrowLeft, Droplets, Sun, Pipette, Import, AlertTriangle,
  CheckCircle2, Info, Shield, Globe, FileText, Image as ImageIcon,
  Lock, LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

// Color utilities
import {
  contrastRatio, wcagLevel, wcagLevelColor, wcagBadgeBg,
  simulateColorblind, colorblindLabels, colorblindSafetyScore,
  hexToOklch, formatOklch,
  type ColorblindType, type WcagLevel,
  suggestAccessibleColor,
} from '@/lib/oklchAccessibility';
import {
  analyzeColor, hexToRgb, hexToHsl, hexToCmyk, nearestPantone,
  type FullColorAnalysis,
} from '@/lib/colorConversions';

// New feature components
import { ImageColorExtractor } from '@/components/color-lab/ImageColorExtractor';
import { AdvancedAccessibilityPanel } from '@/components/color-lab/AdvancedAccessibilityPanel';
import { CulturalBiasPanel } from '@/components/color-lab/CulturalBiasPanel';
import { ColorResearchReport } from '@/components/color-lab/ColorResearchReport';

// ── Types ──────────────────────────────────────────────────────────

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

// ── Brand Import Dialog ────────────────────────────────────────────

const BrandImportDialog = ({ onImport }: { onImport: (colors: LabColor[]) => void }) => {
  const [brandSlug, setBrandSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleImport = async () => {
    if (!brandSlug.trim()) return;
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .rpc('get_public_brand_data', { p_slug: brandSlug.trim().toLowerCase() })
        .single();

      if (!data?.guide_data) {
        toast.error('Brand not found or not public');
        return;
      }

      const guideData = data.guide_data as any;
      const colors = Array.isArray(guideData.colors) ? guideData.colors : [];
      if (colors.length === 0) {
        toast.error('No colors found in this brand guide');
        return;
      }

      const imported: LabColor[] = colors.map((c: any, i: number) => ({
        id: crypto.randomUUID(),
        hex: (c.hex || '#000000').toUpperCase(),
        name: c.name || `Color ${i + 1}`,
      }));

      onImport(imported);
      setOpen(false);
      toast.success(`Imported ${imported.length} colors from "${data.name}"`);
    } catch {
      toast.error('Failed to import brand colors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Import className="h-3.5 w-3.5" />
          Import from Brand
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Import Brand Colors</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Brand Slug</Label>
            <Input
              placeholder="e.g. transperfect"
              value={brandSlug}
              onChange={e => setBrandSlug(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Enter the URL slug of a public brand guide
            </p>
          </div>
          <Button onClick={handleImport} disabled={loading || !brandSlug.trim()} className="w-full">
            {loading ? 'Importing...' : 'Import Colors'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Color Code Card ────────────────────────────────────────────────

const ColorCodeRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <code className={cn("text-xs flex-1 truncate", mono && "font-mono")}>{value}</code>
      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={copy}>
        {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
};

// ── Contrast Pair Card ─────────────────────────────────────────────

const ContrastPairCard = ({ fg, bg, ratio, level }: {
  fg: LabColor; bg: LabColor; ratio: number; level: WcagLevel;
}) => {
  const suggestion = level === 'Fail' ? suggestAccessibleColor(fg.hex, bg.hex) : null;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded border" style={{ backgroundColor: fg.hex }} />
        <span className="text-[10px] text-muted-foreground">on</span>
        <div className="w-6 h-6 rounded border" style={{ backgroundColor: bg.hex }} />
        <span className="text-xs truncate flex-1">{fg.name} / {bg.name}</span>
        <Badge variant="outline" className={cn("text-[10px] border", wcagBadgeBg(level))}>
          <span className={wcagLevelColor(level)}>{level}</span>
        </Badge>
      </div>
      <div className="rounded-md p-2 text-xs font-medium" style={{ backgroundColor: bg.hex, color: fg.hex }}>
        Sample Text — {ratio.toFixed(2)}:1
      </div>
      {suggestion && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Suggested fix:</span>
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: suggestion }} />
          <code className="font-mono">{suggestion}</code>
        </div>
      )}
    </div>
  );
};

// ── Colorblind Simulation Strip ────────────────────────────────────

const ColorblindStrip = ({ colors }: { colors: LabColor[] }) => {
  const types: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
  const safetyScore = colorblindSafetyScore(colors.map(c => c.hex));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Colorblind Simulations
        </h3>
        <Badge variant={safetyScore >= 70 ? 'default' : 'destructive'} className="text-xs">
          Safety Score: {safetyScore}%
        </Badge>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1 font-medium">Original</p>
        <div className="flex rounded-lg overflow-hidden h-10 border">
          {colors.map(c => (
            <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>
      </div>

      {types.map(type => (
        <div key={type}>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">{colorblindLabels[type]}</p>
          <div className="flex rounded-lg overflow-hidden h-10 border">
            {colors.map(c => (
              <div key={c.id} className="flex-1" style={{ backgroundColor: simulateColorblind(c.hex, type) }} title={c.name} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Medium Suitability Badge ───────────────────────────────────────

const MediumBadge = ({ score, medium }: { score: number; medium: string }) => {
  const Icon = medium === 'Print' ? Printer : Monitor;
  const color = score >= 80 ? 'text-primary' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive';
  return (
    <div className="flex items-center gap-1">
      <Icon className={cn("h-3 w-3", color)} />
      <span className={cn("text-[10px] font-medium", color)}>{score}%</span>
    </div>
  );
};

// ── Auth Gate ──────────────────────────────────────────────────────

const AuthGate = ({ children, label }: { children: React.ReactNode; label: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">Sign in to access this feature</p>
        </div>
        <Button onClick={() => navigate('/auth')} className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

// ── Main Page ──────────────────────────────────────────────────────

const DEFAULT_COLORS: LabColor[] = [
  { id: '1', hex: '#0033A0', name: 'Primary Blue' },
  { id: '2', hex: '#FFFFFF', name: 'White' },
  { id: '3', hex: '#2D2926', name: 'Dark' },
];

export default function ColorLab() {
  const [colors, setColors] = useState<LabColor[]>(DEFAULT_COLORS);
  const [newHex, setNewHex] = useState('#');
  const [newName, setNewName] = useState('');
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  const addColor = useCallback(() => {
    const hex = newHex.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(hex)) {
      toast.error('Enter a valid 6-digit hex color');
      return;
    }
    setColors(prev => [...prev, {
      id: crypto.randomUUID(),
      hex,
      name: newName.trim() || `Color ${prev.length + 1}`,
    }]);
    setNewHex('#');
    setNewName('');
  }, [newHex, newName]);

  const removeColor = useCallback((id: string) => {
    setColors(prev => prev.filter(c => c.id !== id));
    if (expandedColor === id) setExpandedColor(null);
  }, [expandedColor]);

  const handleImport = useCallback((imported: LabColor[]) => {
    setColors(prev => [...prev, ...imported]);
  }, []);

  const handleAddFromExtractor = useCallback((extracted: Array<{ hex: string; name: string }>) => {
    const newColors: LabColor[] = extracted.map(c => ({
      id: crypto.randomUUID(),
      hex: c.hex.toUpperCase(),
      name: c.name,
    }));
    setColors(prev => [...prev, ...newColors]);
  }, []);

  // All contrast pairs
  const contrastPairs = useMemo(() => {
    const pairs: Array<{ fg: LabColor; bg: LabColor; ratio: number; level: WcagLevel }> = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors.length; j++) {
        if (i === j) continue;
        const ratio = contrastRatio(colors[i].hex, colors[j].hex);
        pairs.push({ fg: colors[i], bg: colors[j], ratio, level: wcagLevel(ratio) });
      }
    }
    return pairs.sort((a, b) => a.ratio - b.ratio);
  }, [colors]);

  const failingPairs = contrastPairs.filter(p => p.level === 'Fail');
  const passingPairs = contrastPairs.filter(p => p.level !== 'Fail');

  // Per-color analysis
  const analyses = useMemo(() => {
    const map = new Map<string, FullColorAnalysis>();
    for (const c of colors) {
      map.set(c.id, analyzeColor(c.hex));
    }
    return map;
  }, [colors]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">Color Lab</h1>
                <p className="text-[10px] text-muted-foreground">Accessibility · Bias · Research · Production</p>
              </div>
            </div>
          </div>
          <BrandImportDialog onImport={handleImport} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Color Palette Builder */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Your Palette ({colors.length})
            </h2>
          </div>

          {/* Add Color Row */}
          <div className="flex gap-2 items-end flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={newHex.length === 7 ? newHex : '#000000'}
                  onChange={e => setNewHex(e.target.value.toUpperCase())}
                  className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                />
                <div
                  className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
                  style={{ backgroundColor: newHex.length === 7 ? newHex : '#000000' }}
                />
              </div>
              <Input
                placeholder="#0033A0"
                value={newHex}
                onChange={e => setNewHex(e.target.value.toUpperCase())}
                className="w-28 font-mono text-sm"
                onKeyDown={e => e.key === 'Enter' && addColor()}
              />
            </div>
            <Input
              placeholder="Color name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-40 text-sm"
              onKeyDown={e => e.key === 'Enter' && addColor()}
            />
            <Button size="sm" onClick={addColor} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          {/* Color Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <AnimatePresence mode="popLayout">
              {colors.map(color => {
                const analysis = analyses.get(color.id);
                const isExpanded = expandedColor === color.id;

                return (
                  <motion.div
                    key={color.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    layout
                    className={cn(
                      "rounded-xl border overflow-hidden transition-shadow cursor-pointer",
                      isExpanded ? "col-span-2 sm:col-span-3 shadow-lg ring-2 ring-primary/30" : "hover:shadow-md"
                    )}
                    onClick={() => setExpandedColor(isExpanded ? null : color.id)}
                  >
                    <div className="h-20 relative group" style={{ backgroundColor: color.hex }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/70 hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); removeColor(color.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="p-2 bg-card">
                      <p className="text-xs font-medium truncate">{color.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <code className="text-[10px] font-mono text-muted-foreground">{color.hex}</code>
                        <div className="flex gap-1">
                          {analysis && (
                            <>
                              <MediumBadge score={analysis.printSuitability.score} medium="Print" />
                              <MediumBadge score={analysis.digitalSuitability.score} medium="Digital" />
                            </>
                          )}
                        </div>
                      </div>

                      {isExpanded && analysis && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-3 space-y-1 border-t pt-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <ColorCodeRow label="HEX" value={analysis.hex} mono />
                          <ColorCodeRow label="RGB" value={`rgb(${analysis.rgb.r}, ${analysis.rgb.g}, ${analysis.rgb.b})`} mono />
                          <ColorCodeRow label="HSL" value={`hsl(${analysis.hsl.h}, ${analysis.hsl.s}%, ${analysis.hsl.l}%)`} mono />
                          <ColorCodeRow label="CMYK" value={`C${analysis.cmyk.c} M${analysis.cmyk.m} Y${analysis.cmyk.y} K${analysis.cmyk.k}`} mono />
                          <ColorCodeRow label="OKLCH" value={formatOklch(hexToOklch(color.hex))} mono />
                          <Separator className="my-1" />
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-[10px] text-muted-foreground w-16">Pantone</span>
                            <div className="w-4 h-4 rounded border" style={{ backgroundColor: analysis.pantone.hex }} />
                            <span className="text-xs">{analysis.pantone.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">Δ{analysis.pantone.distance}</span>
                          </div>
                          <Separator className="my-1" />
                          {analysis.printSuitability.notes.map((n, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                              <Printer className="h-3 w-3 mt-0.5 shrink-0" />
                              {n}
                            </p>
                          ))}
                          {analysis.digitalSuitability.notes.map((n, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                              <Monitor className="h-3 w-3 mt-0.5 shrink-0" />
                              {n}
                            </p>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        <Separator />

        {/* Analysis Tabs */}
        <Tabs defaultValue="contrast" className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="contrast" className="gap-1.5">
              <Sun className="h-3.5 w-3.5" />
              Contrast
              {failingPairs.length > 0 && (
                <Badge variant="destructive" className="text-[9px] ml-1 h-4 px-1">
                  {failingPairs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="colorblind" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Colorblind
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              APCA / WCAG 2.2
            </TabsTrigger>
            <TabsTrigger value="extract" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Image Extract
            </TabsTrigger>
            <TabsTrigger value="cultural" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Cultural & Bias
              <Lock className="h-3 w-3 text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="report" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Research Report
              <Lock className="h-3 w-3 text-muted-foreground" />
            </TabsTrigger>
            <TabsTrigger value="codes" className="gap-1.5">
              <Pipette className="h-3.5 w-3.5" />
              All Codes
            </TabsTrigger>
          </TabsList>

          {/* Contrast Tab */}
          <TabsContent value="contrast" className="space-y-6">
            {colors.length < 2 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sun className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add at least 2 colors to check contrast</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">{passingPairs.length} passing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{failingPairs.length} failing</span>
                  </div>
                </div>

                {failingPairs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Failing Pairs
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {failingPairs.map((p, i) => (
                        <ContrastPairCard key={i} {...p} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passing Pairs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {passingPairs.map((p, i) => (
                      <ContrastPairCard key={i} {...p} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Colorblind Tab */}
          <TabsContent value="colorblind">
            {colors.length < 2 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add at least 2 colors for simulation</p>
              </div>
            ) : (
              <ColorblindStrip colors={colors} />
            )}
          </TabsContent>

          {/* Advanced Accessibility (APCA + WCAG 2.2) */}
          <TabsContent value="advanced">
            <AdvancedAccessibilityPanel colors={colors} />
          </TabsContent>

          {/* Image Color Extraction */}
          <TabsContent value="extract">
            <AuthGate label="Image Color Extraction">
              <ImageColorExtractor onAddColors={handleAddFromExtractor} />
            </AuthGate>
          </TabsContent>

          {/* Cultural & Bias Analysis */}
          <TabsContent value="cultural">
            <AuthGate label="Cultural & Bias Analysis">
              <CulturalBiasPanel colors={colors} />
            </AuthGate>
          </TabsContent>

          {/* Research Report */}
          <TabsContent value="report">
            <AuthGate label="Color Research Report">
              <ColorResearchReport colors={colors} />
            </AuthGate>
          </TabsContent>

          {/* Codes Tab */}
          <TabsContent value="codes">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {colors.map(color => {
                const a = analyses.get(color.id);
                if (!a) return null;
                const oklch = hexToOklch(color.hex);

                return (
                  <Card key={color.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color.hex }} />
                        <div>
                          <CardTitle className="text-sm">{color.name}</CardTitle>
                          <p className="text-[10px] text-muted-foreground font-mono">{a.hex}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      <ColorCodeRow label="HEX" value={a.hex} mono />
                      <ColorCodeRow label="RGB" value={`rgb(${a.rgb.r}, ${a.rgb.g}, ${a.rgb.b})`} mono />
                      <ColorCodeRow label="HSL" value={`hsl(${a.hsl.h}, ${a.hsl.s}%, ${a.hsl.l}%)`} mono />
                      <ColorCodeRow label="CMYK" value={`C${a.cmyk.c} M${a.cmyk.m} Y${a.cmyk.y} K${a.cmyk.k}`} mono />
                      <ColorCodeRow label="OKLCH" value={formatOklch(oklch)} mono />
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-[10px] text-muted-foreground w-16">Pantone</span>
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: a.pantone.hex }} />
                        <span className="text-xs font-medium">{a.pantone.name}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] flex items-center gap-1"><Printer className="h-3 w-3" /> Print</span>
                          <MediumBadge score={a.printSuitability.score} medium="Print" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] flex items-center gap-1"><Monitor className="h-3 w-3" /> Digital</span>
                          <MediumBadge score={a.digitalSuitability.score} medium="Digital" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
