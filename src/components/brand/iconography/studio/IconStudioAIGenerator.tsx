/**
 * IconStudioAIGenerator - AI-powered icon set generation tab
 * 
 * Implements the 100-Icon Taxonomy with 6 categories:
 * - Foundation: Navigation, UI states, basic logic
 * - Communication: Email, social, feedback, support  
 * - SaaS/Data: Analytics, security, settings, workflows
 * - E-Commerce: Payments, shipping, storefront, loyalty
 * - Marketing Hero: Growth, trophies, trust signals, abstract
 * - Industry Specific: Custom symbols based on user's niche
 * 
 * 3-Layer Robustness System:
 * - Layer 1: Semantic Prompting (handled at edge function)
 * - Layer 2: SVG Post-Processing ("The Wash")
 * - Layer 3: Icon Audit before export
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Wand2,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Compass,
  MessageCircle,
  BarChart3,
  ShoppingCart,
  Rocket,
  Building2,
  Sparkles,
  Grid3X3,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useIconOptimizer, IconAuditResult } from '@/hooks/useIconOptimizer';

// 6-Category Taxonomy for 100-icon library
const ICON_CATEGORIES = [
  { id: 'Foundation', label: 'Foundation', icon: Compass, description: 'Navigation, UI states, basic logic', count: 20 },
  { id: 'Communication', label: 'Communication', icon: MessageCircle, description: 'Email, social, feedback, support', count: 20 },
  { id: 'SaaS/Data', label: 'SaaS/Data', icon: BarChart3, description: 'Analytics, security, settings, workflows', count: 22 },
  { id: 'E-Commerce', label: 'E-Commerce', icon: ShoppingCart, description: 'Payments, shipping, storefront, loyalty', count: 18 },
  { id: 'Marketing Hero', label: 'Marketing Hero', icon: Rocket, description: 'Growth, trophies, trust signals, abstract', count: 17 },
  { id: 'Industry Specific', label: 'Industry', icon: Building2, description: 'Custom symbols for your niche', count: 14 },
];

// Section definitions per category
const CATEGORY_SECTIONS: Record<string, { name: string; count: number }[]> = {
  Foundation: [
    { name: "Navigation", count: 8 },
    { name: "UI States", count: 6 },
    { name: "Basic Logic", count: 6 },
  ],
  Communication: [
    { name: "Messaging", count: 6 },
    { name: "Notifications", count: 5 },
    { name: "Social", count: 5 },
    { name: "Support", count: 4 },
  ],
  "SaaS/Data": [
    { name: "Analytics", count: 7 },
    { name: "Security", count: 5 },
    { name: "Settings", count: 5 },
    { name: "Workflows", count: 5 },
  ],
  "E-Commerce": [
    { name: "Shopping", count: 5 },
    { name: "Payments", count: 5 },
    { name: "Shipping", count: 5 },
    { name: "Loyalty", count: 3 },
  ],
  "Marketing Hero": [
    { name: "Growth", count: 5 },
    { name: "Achievement", count: 4 },
    { name: "Trust", count: 4 },
    { name: "Abstract", count: 4 },
  ],
  "Industry Specific": [
    { name: "Professional", count: 5 },
    { name: "Technical", count: 5 },
    { name: "Domain", count: 4 },
  ],
};

// 10 Style Presets from the specification
const STYLE_PRESETS = [
  { id: 'outlined', name: 'Outlined', strokeWidth: 2, fill: false, corner: 'rounded' as const, description: 'Standard stroke-based icons' },
  { id: 'minimalist', name: 'Minimalist', strokeWidth: 1.25, fill: false, corner: 'rounded' as const, description: 'Ultra-clean thin lines' },
  { id: 'brutalist', name: 'Brutalist', strokeWidth: 2, fill: false, corner: 'sharp' as const, description: 'Strict 0°, 45°, 90° angles' },
  { id: 'hand-drawn', name: 'Hand-Drawn', strokeWidth: 1.75, fill: false, corner: 'rounded' as const, description: 'Subtle human imperfections' },
  { id: 'glassmorphic', name: 'Glassmorphic', strokeWidth: 1.5, fill: false, corner: 'rounded' as const, description: 'Layered background/foreground' },
  { id: 'duotone', name: 'Duotone', strokeWidth: 1.5, fill: true, corner: 'rounded' as const, description: 'Stroke with secondary fill' },
  { id: 'filled', name: 'Filled', strokeWidth: 0, fill: true, corner: 'rounded' as const, description: 'Solid filled icons' },
  { id: 'sharp', name: 'Sharp', strokeWidth: 2, fill: false, corner: 'sharp' as const, description: 'Square terminals and miter joins' },
  { id: 'soft', name: 'Soft Rounded', strokeWidth: 2, fill: false, corner: 'rounded' as const, description: 'Round terminals and joins' },
  { id: 'thick', name: 'Thick Stroke', strokeWidth: 3, fill: false, corner: 'rounded' as const, description: 'Heavy stroke weight' },
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
  'Media', 'Manufacturing', 'Real Estate', 'Travel', 'Food & Beverage',
  'Legal', 'Non-profit', 'Entertainment', 'Sports', 'Fashion', 'AI/ML',
];

interface IconStyle {
  strokeWidth: number;
  fill: boolean;
  cornerRadius: 'sharp' | 'rounded';
}

interface IconWithAudit extends BrandIconography {
  audit?: IconAuditResult;
}

interface GeneratedSection {
  name: string;
  icons: IconWithAudit[];
  status: 'pending' | 'generating' | 'complete' | 'error';
}

interface IconStudioAIGeneratorProps {
  organizationId: string;
  organizationName: string;
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

export const IconStudioAIGenerator = ({
  organizationId,
  organizationName,
  brandColors,
  libraries,
  onSaveIcons,
}: IconStudioAIGeneratorProps) => {
  // Configuration state
  const [selectedCategory, setSelectedCategory] = useState('Foundation');
  const [entityName, setEntityName] = useState(organizationName);
  const [industry, setIndustry] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('outlined');
  const [showAuditDetails, setShowAuditDetails] = useState(false);
  
  const [iconStyle, setIconStyle] = useState<IconStyle>({
    strokeWidth: 2,
    fill: false,
    cornerRadius: 'rounded',
  });
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());

  // Extract brand hex colors for audit
  const brandHexColors = useMemo(() => brandColors.map(c => c.hex), [brandColors]);

  // Layer 2 & 3: Icon Optimizer with audit capabilities
  const iconOptimizer = useIconOptimizer({
    strokeWidth: iconStyle.strokeWidth,
    forceStroke: !iconStyle.fill,
    forceFill: iconStyle.fill,
    cornerRadius: iconStyle.cornerRadius === 'rounded' ? 4 : 0,
    brandColors: brandHexColors,
    maxFileSizeBytes: 2048, // 2KB limit per spec
  });

  // Get current category info
  const currentCategoryInfo = ICON_CATEGORIES.find(c => c.id === selectedCategory);
  const sections = CATEGORY_SECTIONS[selectedCategory] || [];
  const totalIcons = sections.reduce((sum, s) => sum + s.count, 0);
  const completedSections = generatedSections.filter(s => s.status === 'complete').length;
  const progress = sections.length > 0 ? (completedSections / sections.length) * 100 : 0;
  const generatedIconCount = generatedSections.reduce((sum, s) => sum + s.icons.length, 0);

  // Audit statistics
  const auditStats = useMemo(() => {
    const allIcons = generatedSections.flatMap(s => s.icons);
    const audited = allIcons.filter(i => i.audit);
    const valid = audited.filter(i => i.audit?.isValid);
    const withIssues = audited.filter(i => !i.audit?.isValid);
    return {
      total: allIcons.length,
      audited: audited.length,
      valid: valid.length,
      withIssues: withIssues.length,
    };
  }, [generatedSections]);

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setIconStyle({
        strokeWidth: preset.strokeWidth,
        fill: preset.fill,
        cornerRadius: preset.corner,
      });
    }
  };

  /**
   * Layer 2: Post-process icons from AI with "The Wash"
   * - Sanitize SVG
   * - Normalize viewBox to 24x24
   * - Round decimals
   * - Apply consistent stroke/fill
   * - Run audit
   */
  const postProcessIcons = useCallback((icons: BrandIconography[]): IconWithAudit[] => {
    return icons.map(icon => {
      // Apply Layer 2 sanitization
      const optimizedSvg = iconOptimizer.sanitizeSVG(icon.svgPath);
      
      // Run Layer 3 audit
      const audit = iconOptimizer.auditIcon(optimizedSvg, brandHexColors);
      
      return {
        ...icon,
        svgPath: optimizedSvg,
        audit,
      };
    });
  }, [iconOptimizer, brandHexColors]);

  const generateSection = useCallback(async (sectionIndex: number): Promise<boolean> => {
    try {
      setGeneratedSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'generating' } : s
      ));

      const response = await supabase.functions.invoke('generate-icon-set', {
        body: { 
          entityName, 
          industry: industry || undefined, 
          category: selectedCategory,
          sectionIndex,
          style: iconStyle,
          preset: selectedPreset,
        },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.icons) {
        // Apply Layer 2 & 3 post-processing
        const processedIcons = postProcessIcons(response.data.icons);
        
        setGeneratedSections(prev => prev.map((s, i) => 
          i === sectionIndex ? { ...s, icons: processedIcons, status: 'complete' } : s
        ));
        setExpandedSections(prev => new Set([...prev, sections[sectionIndex].name]));
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error generating section ${sectionIndex}:`, error);
      setGeneratedSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'error' } : s
      ));
      return false;
    }
  }, [entityName, industry, selectedCategory, iconStyle, selectedPreset, sections, postProcessIcons]);

  const generateCategory = async () => {
    if (!entityName.trim()) {
      toast.error('Please enter a brand/entity name');
      return;
    }

    setIsGenerating(true);
    setGeneratedSections(sections.map(s => ({ name: s.name, icons: [], status: 'pending' })));
    setSelectedIcons(new Set());

    toast.info(`Generating ${currentCategoryInfo?.label} icons...`, {
      description: `Creating ${totalIcons} icons across ${sections.length} sections`,
    });

    for (let i = 0; i < sections.length; i++) {
      setCurrentSectionIndex(i);
      await generateSection(i);
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
    toast.success(`${currentCategoryInfo?.label} icons generated!`);
  };

  const toggleIconSelection = (iconId: string) => {
    setSelectedIcons(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) next.delete(iconId);
      else next.add(iconId);
      return next;
    });
  };

  const selectAllIcons = () => {
    const allIds = generatedSections.flatMap(s => s.icons.map(i => i.id));
    setSelectedIcons(new Set(allIds));
  };

  const handleSave = () => {
    const iconsToSave = generatedSections.flatMap(s => 
      s.icons.filter(icon => selectedIcons.has(icon.id))
    );

    if (iconsToSave.length === 0) {
      toast.error('Please select at least one icon');
      return;
    }

    // Strip audit data before saving (internal only)
    const cleanIcons: BrandIconography[] = iconsToSave.map(({ audit, ...icon }) => icon);

    onSaveIcons(cleanIcons, selectedLibraryId || undefined);
    toast.success(`Saved ${iconsToSave.length} icons`);
  };

  /**
   * Re-run optimization pass on icons with issues
   */
  const simplifyIconsWithIssues = useCallback(() => {
    setGeneratedSections(prev => prev.map(section => ({
      ...section,
      icons: section.icons.map(icon => {
        if (icon.audit && !icon.audit.isOptimalSize) {
          const simplified = iconOptimizer.simplifySVG(icon.svgPath);
          const newAudit = iconOptimizer.auditIcon(simplified, brandHexColors);
          return { ...icon, svgPath: simplified, audit: newAudit };
        }
        return icon;
      }),
    })));
    toast.success('Ran simplification pass on oversized icons');
  }, [iconOptimizer, brandHexColors]);

  const renderIcon = (svgPath: string, size: number = 20) => {
    const sanitized = DOMPurify.sanitize(svgPath, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
    });
    return (
      <div 
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Icon Set Generator
        </h3>
        <p className="text-sm text-muted-foreground">
          Generate professional icons using the 100-Icon Taxonomy
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-5">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Taxonomy Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {ICON_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setGeneratedSections([]);
                      setSelectedIcons(new Set());
                    }}
                    disabled={isGenerating}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                        : 'bg-card hover:bg-accent/50 border-border'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="min-w-0">
                      <span className={cn('text-sm font-medium block', isSelected && 'text-primary')}>{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{cat.description}</span>
                      <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0">{cat.count} icons</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Industry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Brand Name *</Label>
              <Input
                placeholder="Enter name..."
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                disabled={isGenerating}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Industry</Label>
              <Select value={industry || 'none'} onValueChange={(v) => setIndustry(v === 'none' ? '' : v)} disabled={isGenerating}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style Preset Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Style Preset</Label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    disabled={isGenerating}
                    className={cn(
                      'flex-shrink-0 px-3 py-2 rounded-lg border text-xs transition-all whitespace-nowrap',
                      selectedPreset === preset.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent border-border'
                    )}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <p className="text-[10px] text-muted-foreground">
              {STYLE_PRESETS.find(p => p.id === selectedPreset)?.description}
            </p>
          </div>

          {/* Fine-tune Style */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <Grid3X3 className="h-3 w-3" />
              Fine-tune style
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Stroke Width</span>
                  <span className="text-muted-foreground">{iconStyle.strokeWidth}px</span>
                </div>
                <Slider
                  value={[iconStyle.strokeWidth]}
                  onValueChange={([v]) => setIconStyle(s => ({ ...s, strokeWidth: v }))}
                  min={0.75}
                  max={4}
                  step={0.25}
                  disabled={isGenerating}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Filled Icons</span>
                <Switch
                  checked={iconStyle.fill}
                  onCheckedChange={(fill) => setIconStyle(s => ({ ...s, fill }))}
                  disabled={isGenerating}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Sharp Corners</span>
                <Switch
                  checked={iconStyle.cornerRadius === 'sharp'}
                  onCheckedChange={(sharp) => setIconStyle(s => ({ ...s, cornerRadius: sharp ? 'sharp' : 'rounded' }))}
                  disabled={isGenerating}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Target Library */}
          {libraries.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Save to Library</Label>
              <Select value={selectedLibraryId || 'auto'} onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)} disabled={isGenerating}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (first Core library)</SelectItem>
                  {libraries.filter(l => l.is_active).map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name} ({lib.icons.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateCategory}
            disabled={isGenerating || !entityName.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating {sections[currentSectionIndex]?.name}...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate {totalIcons} {currentCategoryInfo?.label} Icons
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Section {currentSectionIndex + 1} of {sections.length}
              </p>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="border rounded-lg overflow-hidden flex flex-col min-h-[400px]">
          {generatedSections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Wand2 className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No icons generated yet</p>
              <p className="text-sm">Select a category and click Generate</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b bg-muted/50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Check className="h-3 w-3 mr-1" />
                      {selectedIcons.size} selected
                    </Badge>
                    <span className="text-xs text-muted-foreground">of {generatedIconCount}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllIcons} disabled={generatedIconCount === 0}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIcons(new Set())} disabled={selectedIcons.size === 0}>
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Layer 3: Audit Summary Bar */}
                {auditStats.audited > 0 && (
                  <div className="flex items-center justify-between bg-background/50 rounded-md px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">{auditStats.valid}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Icons passing all quality checks</TooltipContent>
                      </Tooltip>
                      {auditStats.withIssues > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-help">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="text-xs font-medium text-amber-500">{auditStats.withIssues}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Icons with minor quality issues</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowAuditDetails(!showAuditDetails)}
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        {showAuditDetails ? 'Hide' : 'Show'} Audit
                      </Button>
                      {auditStats.withIssues > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={simplifyIconsWithIssues}
                        >
                          Auto-fix Issues
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {generatedSections.map((section) => (
                    <Collapsible
                      key={section.name}
                      open={expandedSections.has(section.name)}
                      onOpenChange={(open) => {
                        setExpandedSections(prev => {
                          const next = new Set(prev);
                          if (open) next.add(section.name);
                          else next.delete(section.name);
                          return next;
                        });
                      }}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            {expandedSections.has(section.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-medium text-sm">{section.name}</span>
                          </div>
                          {section.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                          {section.status === 'generating' && (
                            <Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Generating</Badge>
                          )}
                          {section.status === 'complete' && (
                            <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />{section.icons.length}</Badge>
                          )}
                          {section.status === 'error' && (
                            <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 border-l-2 border-primary/20 ml-4 mt-1">
                          {section.icons.map((icon) => {
                            const isSelected = selectedIcons.has(icon.id);
                            const hasIssues = icon.audit && !icon.audit.isValid;
                            return (
                              <Tooltip key={icon.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => toggleIconSelection(icon.id)}
                                    className={cn(
                                      'relative p-2 rounded-lg border flex flex-col items-center gap-1 transition-all group',
                                      isSelected
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/50',
                                      showAuditDetails && hasIssues && 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10'
                                    )}
                                  >
                                    {renderIcon(icon.svgPath, 24)}
                                    <span className="text-[9px] text-muted-foreground truncate max-w-full">
                                      {icon.name.split(' ').slice(0, 2).join(' ')}
                                    </span>
                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                      </div>
                                    )}
                                    {showAuditDetails && icon.audit && (
                                      <div className={cn(
                                        'absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center',
                                        icon.audit.isValid ? 'bg-green-600' : 'bg-amber-500'
                                      )}>
                                        {icon.audit.isValid 
                                          ? <ShieldCheck className="h-2.5 w-2.5 text-white" />
                                          : <AlertTriangle className="h-2.5 w-2.5 text-white" />
                                        }
                                      </div>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium text-xs">{icon.name}</p>
                                    {showAuditDetails && icon.audit && (
                                      <div className="text-[10px] space-y-0.5">
                                        <p className="text-muted-foreground">Size: {icon.audit.fileSizeBytes} bytes</p>
                                        {icon.audit.issues.length > 0 ? (
                                          <ul className="text-amber-600 dark:text-amber-400">
                                            {icon.audit.issues.map((issue, i) => (
                                              <li key={i}>• {issue}</li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <p className="text-green-600 dark:text-green-400">✓ Passes all checks</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>

              {selectedIcons.size > 0 && (
                <div className="p-3 border-t bg-muted/30">
                  <Button onClick={handleSave} className="w-full gap-2">
                    <Check className="h-4 w-4" />
                    Save {selectedIcons.size} Icons to Library
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
