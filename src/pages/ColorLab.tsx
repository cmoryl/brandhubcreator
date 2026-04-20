/**
 * Color Lab — Guided Wizard Flow
 * Step 1: Build Your Palette (manual add, import, image extraction)
 * Step 2: Analyze (contrast, colorblind, APCA/WCAG, cultural & bias)
 * Step 3: Report & Export (research report, all color codes)
 */

import { useState, useCallback, useMemo, Suspense } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Palette, Eye, Printer, Monitor, Copy, Check,
  ArrowLeft, Droplets, Sun, Pipette, Import, AlertTriangle,
  CheckCircle2, Info, Shield, Globe, FileText, Image as ImageIcon,
  Lock, LogIn, ArrowRight, ChevronRight, Wand2, Replace, Save,
  FolderOpen, Clock, X, Share2, Grid3X3, MonitorSmartphone, Sparkles, Link2,
  Box, Zap, Layers, Filter, User, LogOut, Settings, LayoutDashboard, HelpCircle, Building2,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

import { ImageColorExtractor } from '@/components/color-lab/ImageColorExtractor';
import { AdvancedAccessibilityPanel } from '@/components/color-lab/AdvancedAccessibilityPanel';
import { CulturalBiasPanel } from '@/components/color-lab/CulturalBiasPanel';
import { ColorResearchReport } from '@/components/color-lab/ColorResearchReport';
import { PaletteGenerator } from '@/components/color-lab/PaletteGenerator';
import { ContrastMatrix } from '@/components/color-lab/ContrastMatrix';
import { ThemePreview } from '@/components/color-lab/ThemePreview';
import { lazy } from 'react';

const ColorSpaceExplorer = lazy(() => import('@/components/color-lab/ColorSpaceExplorer').then(m => ({ default: m.ColorSpaceExplorer })));
const PaletteAnimationPreview = lazy(() => import('@/components/color-lab/PaletteAnimationPreview').then(m => ({ default: m.PaletteAnimationPreview })));
const MaterialTexturePreview = lazy(() => import('@/components/color-lab/MaterialTexturePreview').then(m => ({ default: m.MaterialTexturePreview })));

// ── Types ──────────────────────────────────────────────────────────

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

// ── Wizard Steps ───────────────────────────────────────────────────

const STEPS = [
  { id: 'build', label: 'Build Palette', icon: Palette, description: 'Add colors manually, import from a brand, or extract from an image' },
  { id: 'analyze', label: 'Analyze', icon: Shield, description: 'Test contrast, colorblind safety, APCA compliance, and cultural bias' },
  { id: 'report', label: 'Report & Export', icon: FileText, description: 'Generate AI research reports and export all color codes' },
] as const;

type StepId = typeof STEPS[number]['id'];

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

// ── Small reusable components ──────────────────────────────────────

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

// ── Stepper Component ──────────────────────────────────────────────

const WizardStepper = ({ currentStep, onStepClick, colorCount }: {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
  colorCount: number;
}) => {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center gap-1 sm:gap-2 w-full">
      {STEPS.map((step, i) => {
        const isCurrent = step.id === currentStep;
        const isPast = i < currentIndex;
        const isDisabled = step.id !== 'build' && colorCount < 2;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => !isDisabled && onStepClick(step.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl w-full transition-all text-left",
                isCurrent && "bg-primary/10 ring-2 ring-primary/30",
                isPast && !isCurrent && "bg-primary/5",
                !isCurrent && !isPast && "hover:bg-muted/50",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-bold transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                isPast && !isCurrent && "bg-primary/20 text-primary",
                !isCurrent && !isPast && "bg-muted text-muted-foreground",
              )}>
                {isPast ? <Check className="h-4 w-4" /> : <span>{i + 1}</span>}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className={cn(
                  "text-xs font-semibold truncate",
                  isCurrent ? "text-primary" : "text-foreground",
                )}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{step.description}</p>
              </div>
              <span className="text-xs font-semibold sm:hidden truncate">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className={cn(
                "h-4 w-4 shrink-0 mx-1",
                isPast ? "text-primary" : "text-muted-foreground/40",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Fix Suggestions Card ───────────────────────────────────────────

interface ColorFix {
  colorId: string;
  colorName: string;
  originalHex: string;
  newHex: string;
  improvedPairs: number;
}

const FixSuggestionsCard = ({ colors, failingPairs, onApplyFix, onApplyAll }: {
  colors: LabColor[];
  failingPairs: Array<{ fg: LabColor; bg: LabColor; ratio: number; level: WcagLevel }>;
  onApplyFix: (colorId: string, newHex: string) => void;
  onApplyAll: (fixes: ColorFix[]) => void;
}) => {
  const fixes = useMemo(() => {
    // For each color that appears in failing pairs, compute the best single-color fix
    const colorFailCounts = new Map<string, number>();
    for (const p of failingPairs) {
      colorFailCounts.set(p.fg.id, (colorFailCounts.get(p.fg.id) || 0) + 1);
      colorFailCounts.set(p.bg.id, (colorFailCounts.get(p.bg.id) || 0) + 1);
    }

    // Sort by most failures — fix the worst offenders first
    const sorted = [...colorFailCounts.entries()].sort((a, b) => b[1] - a[1]);
    const result: ColorFix[] = [];
    const alreadyFixed = new Set<string>();

    for (const [colorId] of sorted) {
      if (alreadyFixed.has(colorId)) continue;
      const color = colors.find(c => c.id === colorId);
      if (!color) continue;

      // Find all partners this color fails with
      const partners = failingPairs
        .filter(p => p.fg.id === colorId || p.bg.id === colorId)
        .map(p => p.fg.id === colorId ? p.bg : p.fg);

      // Use suggestAccessibleColor against the first partner as primary target
      const uniquePartners = [...new Map(partners.map(p => [p.id, p])).values()];
      if (uniquePartners.length === 0) continue;

      const suggested = suggestAccessibleColor(color.hex, uniquePartners[0].hex);
      if (!suggested) continue;

      // Count how many pairs this single fix resolves
      let improved = 0;
      for (const partner of uniquePartners) {
        const newRatio = contrastRatio(suggested, partner.hex);
        if (newRatio >= 4.5) improved++;
      }

      if (improved > 0) {
        result.push({
          colorId: color.id,
          colorName: color.name,
          originalHex: color.hex,
          newHex: suggested,
          improvedPairs: improved,
        });
        alreadyFixed.add(colorId);
      }
    }

    return result;
  }, [colors, failingPairs]);

  if (fixes.length === 0) return null;

  const totalFixable = fixes.reduce((s, f) => s + f.improvedPairs, 0);

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Smart Fix Suggestions
          </h3>
          {fixes.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => onApplyAll(fixes)}
            >
              <Replace className="h-3.5 w-3.5" />
              Apply All ({totalFixable} fixes)
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust these colors to make {totalFixable} failing pair{totalFixable !== 1 ? 's' : ''} pass WCAG AA (4.5:1). 
          Hue and saturation are preserved — only lightness is shifted.
        </p>
        <div className="space-y-2">
          {fixes.map(fix => (
            <div key={fix.colorId} className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded border" style={{ backgroundColor: fix.originalHex }} />
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className="w-6 h-6 rounded border" style={{ backgroundColor: fix.newHex }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{fix.colorName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {fix.originalHex} → {fix.newHex}
                  <span className="ml-2 text-primary">fixes {fix.improvedPairs} pair{fix.improvedPairs !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs gap-1"
                onClick={() => onApplyFix(fix.colorId, fix.newHex)}
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ── Saved Palette Type ─────────────────────────────────────────────

interface SavedPalette {
  id: string;
  title: string;
  colors: LabColor[];
  created_at: string;
}

// ── Default colors ─────────────────────────────────────────────────

const DEFAULT_COLORS: LabColor[] = [
  { id: '1', hex: '#0033A0', name: 'Primary Blue' },
  { id: '2', hex: '#FFFFFF', name: 'White' },
  { id: '3', hex: '#2D2926', name: 'Dark' },
];

// ── Main Page ──────────────────────────────────────────────────────

export default function ColorLab() {
  const { user, signOut } = useAuth();
  const [colors, setColors] = useState<LabColor[]>(DEFAULT_COLORS);
  const [newHex, setNewHex] = useState('#');
  const [newName, setNewName] = useState('');
  const [expandedColor, setExpandedColor] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>('build');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [paletteTitle, setPaletteTitle] = useState('');
  const [contrastFilter, setContrastFilter] = useState<'all' | 'passing' | 'failing'>('all');
  const [savingPalette, setSavingPalette] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [palettesLoaded, setPalettesLoaded] = useState(false);

  const loadSavedPalettes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('color_lab_reports')
      .select('id, title, colors, created_at')
      .eq('user_id', user.id)
      .eq('report_type', 'palette')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setSavedPalettes(data.map(d => ({
        id: d.id,
        title: d.title,
        colors: (d.colors as any[]) || [],
        created_at: d.created_at,
      })));
    }
    setPalettesLoaded(true);
  }, [user]);

  const savePalette = useCallback(async () => {
    if (!user || !paletteTitle.trim()) return;
    setSavingPalette(true);
    const { error } = await supabase
      .from('color_lab_reports')
      .insert({
        user_id: user.id,
        title: paletteTitle.trim(),
        colors: colors.map(c => ({ hex: c.hex, name: c.name })) as any,
        report_type: 'palette',
        report_data: {} as any,
      });
    setSavingPalette(false);
    if (error) {
      toast.error('Failed to save palette');
    } else {
      toast.success('Palette saved');
      setSaveDialogOpen(false);
      setPaletteTitle('');
      loadSavedPalettes();
    }
  }, [user, paletteTitle, colors, loadSavedPalettes]);

  const loadPalette = useCallback((palette: SavedPalette) => {
    const loaded: LabColor[] = palette.colors.map((c: any) => ({
      id: crypto.randomUUID(),
      hex: c.hex,
      name: c.name || 'Unnamed',
    }));
    setColors(loaded);
    setLoadDialogOpen(false);
    setCurrentStep('build');
    toast.success(`Loaded "${palette.title}"`);
  }, []);

  const deletePalette = useCallback(async (id: string) => {
    await supabase.from('color_lab_reports').delete().eq('id', id);
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
    toast.success('Palette deleted');
  }, []);

  const sharePalette = useCallback(async (id: string) => {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const { error } = await supabase
      .from('color_lab_reports')
      .update({ share_token: token })
      .eq('id', id);
    if (error) {
      toast.error('Failed to generate share link');
      return;
    }
    const url = `${window.location.origin}/color-lab/share/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
    loadSavedPalettes();
  }, [loadSavedPalettes]);

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

  const analyses = useMemo(() => {
    const map = new Map<string, FullColorAnalysis>();
    for (const c of colors) {
      map.set(c.id, analyzeColor(c.hex));
    }
    return map;
  }, [colors]);

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  };

  const canAdvance = colors.length >= 2;

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header — matches portal nav style */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Droplets className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-none text-foreground">Color Lab</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block mt-0.5">Accessibility · Bias · Research · Production</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Badge variant="outline" className="gap-1 hidden sm:flex text-xs">
              <Droplets className="h-3 w-3" />
              Color Tool
            </Badge>
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium leading-none">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/help')} className="gap-2 cursor-pointer">
                    <HelpCircle className="h-4 w-4" />
                    Help Center
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Wizard Stepper */}
        <WizardStepper currentStep={currentStep} onStepClick={setCurrentStep} colorCount={colors.length} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── STEP 1: BUILD PALETTE ── */}
            {currentStep === 'build' && (
              <div className="space-y-6">
                {/* Palette strip preview */}
                {colors.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-muted/30">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold">Your Palette</span>
                      <Badge variant="secondary" className="text-[10px]">{colors.length} colors</Badge>
                    </div>
                    <div className="h-14 flex">
                      {colors.map(c => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger asChild>
                            <div className="flex-1 cursor-pointer hover:flex-[2] transition-all" style={{ backgroundColor: c.hex }} />
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            <p className="font-semibold">{c.name}</p>
                            <p className="font-mono text-muted-foreground">{c.hex}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Three-column tools grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Column 1: Add colors manually */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Add Colors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                      <BrandImportDialog onImport={handleImport} />
                    </CardContent>
                  </Card>

                  {/* Column 2: Palette Generator */}
                  <PaletteGenerator onAddColors={(generated) => setColors(prev => [...prev, ...generated])} />

                  {/* Column 3: Image extraction */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Extract from Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageColorExtractor
                        onAddColors={handleAddFromExtractor}
                        onReplaceColors={(extracted) => {
                          const newColors: LabColor[] = extracted.map(c => ({
                            id: crypto.randomUUID(),
                            hex: c.hex.toUpperCase(),
                            name: c.name,
                          }));
                          setColors(newColors);
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Color swatches grid — separated into its own card */}
                {colors.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-primary" />
                          Color Swatches
                        </CardTitle>
                        <span className="text-[10px] text-muted-foreground">Click to expand details</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
                                <div className="h-16 relative group" style={{ backgroundColor: color.hex }}>
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
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── STEP 2: ANALYZE ── */}
            {currentStep === 'analyze' && (
              <div className="space-y-6">
                {/* Compact palette context + stats */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Colors</p>
                        <p className="text-2xl font-bold text-primary">{colors.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pairs</p>
                        <p className="text-2xl font-bold">{contrastPairs.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Passing</p>
                        <p className="text-2xl font-bold text-primary">{passingPairs.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Failing</p>
                        <p className={cn("text-2xl font-bold", failingPairs.length > 0 ? "text-destructive" : "text-primary")}>
                          {failingPairs.length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Mini palette strip */}
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg overflow-hidden h-10 w-40 border">
                      {colors.map(c => (
                        <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Analysis tabs — grouped by category */}
                <Tabs defaultValue="contrast" className="space-y-4">
                  <div className="bg-card rounded-xl border p-1">
                    <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent">
                      <TabsTrigger value="contrast" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Sun className="h-3.5 w-3.5" />
                        Contrast
                        {failingPairs.length > 0 && (
                          <Badge variant="destructive" className="text-[9px] ml-1 h-4 px-1">{failingPairs.length}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="matrix" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Grid3X3 className="h-3.5 w-3.5" />
                        Matrix
                      </TabsTrigger>
                      <TabsTrigger value="colorblind" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Eye className="h-3.5 w-3.5" />
                        Colorblind
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Shield className="h-3.5 w-3.5" />
                        APCA / WCAG 2.2
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <MonitorSmartphone className="h-3.5 w-3.5" />
                        Theme Preview
                      </TabsTrigger>
                      <TabsTrigger value="cultural" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Globe className="h-3.5 w-3.5" />
                        Cultural & Bias
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </TabsTrigger>
                      <TabsTrigger value="3d" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Box className="h-3.5 w-3.5" />
                        3D Explorer
                      </TabsTrigger>
                      <TabsTrigger value="animation" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Zap className="h-3.5 w-3.5" />
                        Animation
                      </TabsTrigger>
                      <TabsTrigger value="materials" className="gap-1.5 text-xs data-[state=active]:bg-primary/10">
                        <Layers className="h-3.5 w-3.5" />
                        Materials
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="contrast" className="space-y-6">
                    {/* Filter toggle */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <div className="inline-flex items-center rounded-lg border bg-card p-0.5 gap-0.5">
                          {(['all', 'passing', 'failing'] as const).map(f => (
                            <button
                              key={f}
                              onClick={() => setContrastFilter(f)}
                              className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                                contrastFilter === f
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {f === 'all' ? `All (${contrastPairs.length})` : f === 'passing' ? `Passing (${passingPairs.length})` : `Failing (${failingPairs.length})`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {contrastFilter !== 'passing' && failingPairs.length > 0 && (
                      <FixSuggestionsCard
                        colors={colors}
                        failingPairs={failingPairs}
                        onApplyFix={(colorId, newHex) => {
                          setColors(prev => prev.map(c =>
                            c.id === colorId ? { ...c, hex: newHex } : c
                          ));
                        }}
                        onApplyAll={(fixes) => {
                          setColors(prev => prev.map(c => {
                            const fix = fixes.find(f => f.colorId === c.id);
                            return fix ? { ...c, hex: fix.newHex } : c;
                          }));
                        }}
                      />
                    )}

                    {contrastFilter !== 'passing' && failingPairs.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Failing Pairs
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {failingPairs.map((p, i) => <ContrastPairCard key={i} {...p} />)}
                        </div>
                      </div>
                    )}

                    {contrastFilter === 'passing' && failingPairs.length === 0 && passingPairs.length > 0 && (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="p-4 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">All pairs pass WCAG contrast</p>
                            <p className="text-xs text-muted-foreground">Every color combination meets AA requirements.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {contrastFilter === 'all' && failingPairs.length === 0 && (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="p-4 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">All pairs pass WCAG contrast</p>
                            <p className="text-xs text-muted-foreground">Every color combination meets AA requirements.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {contrastFilter !== 'failing' && passingPairs.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Passing Pairs
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {passingPairs.map((p, i) => <ContrastPairCard key={i} {...p} />)}
                        </div>
                      </div>
                    )}

                    {((contrastFilter === 'failing' && failingPairs.length === 0) || (contrastFilter === 'passing' && passingPairs.length === 0)) && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No {contrastFilter} pairs found.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="colorblind">
                    <ColorblindSimulations colors={colors} />
                  </TabsContent>

                  <TabsContent value="advanced">
                    <AdvancedAccessibilityPanel colors={colors} />
                  </TabsContent>

                  <TabsContent value="matrix">
                    <ContrastMatrix colors={colors} />
                  </TabsContent>

                  <TabsContent value="preview">
                    <ThemePreview colors={colors} />
                  </TabsContent>

                  <TabsContent value="cultural">
                    <AuthGate label="Cultural & Bias Analysis">
                      <CulturalBiasPanel colors={colors} />
                    </AuthGate>
                  </TabsContent>

                  <TabsContent value="3d">
                    <Suspense fallback={<div className="text-center py-12 text-muted-foreground text-sm">Loading 3D explorer…</div>}>
                      <ColorSpaceExplorer colors={colors} />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="animation">
                    <Suspense fallback={<div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>}>
                      <PaletteAnimationPreview colors={colors} />
                    </Suspense>
                  </TabsContent>

                  <TabsContent value="materials">
                    <Suspense fallback={<div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>}>
                      <MaterialTexturePreview colors={colors} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* ── STEP 3: REPORT & EXPORT ── */}
            {currentStep === 'report' && (
              <div className="space-y-6">
                <ColorResearchReport colors={colors} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 'build'}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {/* Load Palette */}
            {user && (
              <Dialog open={loadDialogOpen} onOpenChange={(open) => {
                setLoadDialogOpen(open);
                if (open && !palettesLoaded) loadSavedPalettes();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Load
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      Saved Palettes
                    </DialogTitle>
                  </DialogHeader>
                  {savedPalettes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No saved palettes yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {savedPalettes.map(p => (
                        <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex rounded overflow-hidden h-6 w-16 border shrink-0">
                            {p.colors.slice(0, 5).map((c: any, i: number) => (
                              <div key={i} className="flex-1" style={{ backgroundColor: c.hex }} />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {p.colors.length} colors · {new Date(p.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={() => loadPalette(p)}>
                            Load
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary" onClick={() => sharePalette(p.id)}>
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Share palette link</TooltipContent>
                          </Tooltip>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deletePalette(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* ── STEP 3: REPORT & EXPORT ── */}
            {currentStep === 'report' && (
              <div className="space-y-6">
                <ColorResearchReport colors={colors} />
              </div>
            )}

            {/* Save Palette */}
            {user && colors.length >= 2 && (
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Save className="h-3.5 w-3.5" />
                    Save Palette
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Save className="h-5 w-5 text-primary" />
                      Save Palette
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex rounded-lg overflow-hidden h-8 border">
                      {colors.map(c => (
                        <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                    <div>
                      <Label className="text-xs">Palette Name</Label>
                      <Input
                        placeholder="e.g. Brand Primary v2"
                        value={paletteTitle}
                        onChange={e => setPaletteTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && savePalette()}
                      />
                    </div>
                    <Button onClick={savePalette} disabled={savingPalette || !paletteTitle.trim()} className="w-full gap-1.5">
                      {savingPalette ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {currentStep === 'build' && !canAdvance && (
              <p className="text-xs text-muted-foreground">Add at least 2 colors to continue</p>
            )}
            <Button
              onClick={goNext}
              disabled={currentStep === 'report' || !canAdvance}
              className="gap-1.5"
            >
              {currentStep === 'analyze' ? 'View Reports' : 'Analyze Palette'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Colorblind Simulations (extracted to fix ref warning) ──────────

function ColorblindSimulations({ colors }: { colors: LabColor[] }) {
  const types: ColorblindType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
  const safetyScore = colorblindSafetyScore(colors.map(c => c.hex));

  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors for simulation</p>
      </div>
    );
  }

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
}
