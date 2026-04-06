import { useMemo } from 'react';
import { 
  Sun, Moon, Printer, List, Layout, ChevronDown, Image, Type, Calendar, Eye, EyeOff,
  Minus, Briefcase, Sparkles, Palette, Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PdfTheme, PaperSize, SECTION_METADATA, CATEGORY_LABELS } from '@/lib/exportPdf';
import { PdfLayoutPreset, PDF_PRESETS, CoverPageConfig, COVER_LAYOUTS, COVER_PATTERNS } from '@/lib/pdfPresets';
import { BaseGuide, SectionId } from '@/types/brand';
import { PdfExportSettings } from './types';

interface PdfSettingsSidebarProps {
  guide: BaseGuide;
  settings: PdfExportSettings;
  onSettingsChange: (settings: Partial<PdfExportSettings>) => void;
  hasSectionContent: (sectionId: SectionId) => boolean;
  primaryColor: string;
  expandedCategories: Set<string>;
  onExpandedCategoriesChange: (categories: Set<string>) => void;
  showCoverOptions: boolean;
  onShowCoverOptionsChange: (show: boolean) => void;
}

const PresetIcons: Record<PdfLayoutPreset, React.ComponentType<{ className?: string }>> = {
  minimal: Minus,
  professional: Briefcase,
  creative: Sparkles,
  magazine: Newspaper,
};

export const PdfSettingsSidebar = ({
  guide,
  settings,
  onSettingsChange,
  hasSectionContent,
  primaryColor,
  expandedCategories,
  onExpandedCategoriesChange,
  showCoverOptions,
  onShowCoverOptionsChange,
}: PdfSettingsSidebarProps) => {
  const { theme, paperSize, layoutPreset, coverConfig, includeToc, selectedSections } = settings;
  const sectionOrder = guide.sectionOrder || [];

  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof SECTION_METADATA> = {};
    SECTION_METADATA.forEach(section => {
      if (!groups[section.category]) groups[section.category] = [];
      groups[section.category].push(section);
    });
    return groups;
  }, []);

  const totalWithContent = sectionOrder.filter(id => hasSectionContent(id)).length;
  const selectedCount = Array.from(selectedSections).filter(id => hasSectionContent(id)).length;

  const toggleSection = (sectionId: SectionId) => {
    const next = new Set(selectedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    onSettingsChange({ selectedSections: next });
  };

  const toggleCategory = (category: string) => {
    const categorySections = SECTION_METADATA.filter(s => s.category === category).map(s => s.id as SectionId);
    const allSelected = categorySections.every(id => selectedSections.has(id) || !hasSectionContent(id));
    
    const next = new Set(selectedSections);
    categorySections.forEach(id => {
      if (allSelected) {
        next.delete(id);
      } else if (hasSectionContent(id)) {
        next.add(id);
      }
    });
    onSettingsChange({ selectedSections: next });
  };

  const selectAll = () => {
    const sectionsWithContent = sectionOrder.filter(id => hasSectionContent(id));
    onSettingsChange({ selectedSections: new Set(sectionsWithContent) });
  };

  const selectNone = () => onSettingsChange({ selectedSections: new Set() });

  const setCoverConfig = (update: Partial<CoverPageConfig>) => {
    onSettingsChange({ coverConfig: { ...coverConfig, ...update } });
  };

  return (
    <div className="w-80 flex-shrink-0 border-r bg-muted/30 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Export Settings</h3>
          </div>

          {/* Preset Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Style Preset</Label>
            <RadioGroup value={layoutPreset} onValueChange={(v) => onSettingsChange({ layoutPreset: v as PdfLayoutPreset })}>
              <div className="grid gap-2">
                {Object.values(PDF_PRESETS).map((preset) => {
                  const PresetIcon = PresetIcons[preset.id];
                  return (
                    <label
                      key={preset.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                        layoutPreset === preset.id 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-card hover:border-border"
                      )}
                    >
                      <RadioGroupItem value={preset.id} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <PresetIcon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{preset.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quick Settings */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Appearance</Label>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Theme */}
              <div className="space-y-1.5">
                <Label className="text-xs">Theme</Label>
                <ToggleGroup 
                  type="single" 
                  value={theme} 
                  onValueChange={(v) => v && onSettingsChange({ theme: v as PdfTheme })} 
                  className="justify-start"
                >
                  <ToggleGroupItem value="light" aria-label="Light" size="sm" className="gap-1 flex-1">
                    <Sun className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" aria-label="Dark" size="sm" className="gap-1 flex-1">
                    <Moon className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              {/* Paper Size */}
              <div className="space-y-1.5">
                <Label className="text-xs">Paper</Label>
                <ToggleGroup 
                  type="single" 
                  value={paperSize} 
                  onValueChange={(v) => v && onSettingsChange({ paperSize: v as PaperSize })} 
                  className="justify-start"
                >
                  <ToggleGroupItem value="a4" aria-label="A4" size="sm" className="gap-1 flex-1">
                    A4
                  </ToggleGroupItem>
                  <ToggleGroupItem value="letter" aria-label="Letter" size="sm" className="gap-1 flex-1">
                    US
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Table of Contents Toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="toc-toggle" className="text-xs font-medium cursor-pointer">
                  Table of Contents
                </Label>
              </div>
              <Switch
                id="toc-toggle"
                checked={includeToc}
                onCheckedChange={(v) => onSettingsChange({ includeToc: v })}
              />
            </div>
          </div>

          <Separator />

          {/* Cover Page Options */}
          <Collapsible open={showCoverOptions} onOpenChange={onShowCoverOptionsChange}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-card border cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-medium cursor-pointer">Cover Page</Label>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showCoverOptions && "rotate-180")} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {/* Layout Selection */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Layout</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {COVER_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setCoverConfig({ layout: layout.id })}
                      className={cn(
                        "text-xs py-2 px-3 rounded-lg border transition-all text-left",
                        coverConfig.layout === layout.id 
                          ? "border-primary bg-primary/10 text-primary font-medium" 
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pattern Selection */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Pattern</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COVER_PATTERNS.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => setCoverConfig({ pattern: pattern.id })}
                      className={cn(
                        "text-xs py-1.5 px-2.5 rounded-md border transition-all",
                        coverConfig.pattern === pattern.id 
                          ? "border-primary bg-primary/10 text-primary font-medium" 
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      {pattern.label}
                    </button>
                  ))}
                </div>
                {coverConfig.pattern !== 'none' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Opacity</Label>
                      <span className="text-xs text-muted-foreground">{Math.round(coverConfig.patternOpacity * 100)}%</span>
                    </div>
                    <Slider
                      value={[coverConfig.patternOpacity * 100]}
                      onValueChange={([v]) => setCoverConfig({ patternOpacity: v / 100 })}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              
              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Background</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-9 rounded-lg border bg-card flex items-center gap-2 px-3 hover:border-primary/50 transition-colors">
                        <div 
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: coverConfig.backgroundColor || (theme === 'dark' ? '#111827' : '#ffffff') }}
                        />
                        <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                          {coverConfig.backgroundColor || 'Auto'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="space-y-2">
                        <button
                          onClick={() => setCoverConfig({ backgroundColor: '' })}
                          className={cn("w-full text-xs py-1.5 px-2 rounded border text-left", !coverConfig.backgroundColor && "border-primary bg-primary/10")}
                        >
                          Auto (theme default)
                        </button>
                        <div className="grid grid-cols-5 gap-1">
                          {['#ffffff', '#f8fafc', '#1e293b', '#0f172a', '#111827', '#18181b', '#003b71', '#139cd8', '#0ea5e9', '#8b5cf6'].map((color) => (
                            <button
                              key={color}
                              onClick={() => setCoverConfig({ backgroundColor: color })}
                              className={cn("w-7 h-7 rounded border-2 transition-transform hover:scale-110", coverConfig.backgroundColor === color && "border-primary ring-2 ring-primary/30")}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={coverConfig.backgroundColor || '#ffffff'}
                          onChange={(e) => setCoverConfig({ backgroundColor: e.target.value })}
                          className="w-full h-8 cursor-pointer rounded"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Accent</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-9 rounded-lg border bg-card flex items-center gap-2 px-3 hover:border-primary/50 transition-colors">
                        <div 
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: coverConfig.accentColor || primaryColor }}
                        />
                        <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                          {coverConfig.accentColor ? 'Custom' : 'Brand'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="start">
                      <div className="space-y-2">
                        <button
                          onClick={() => setCoverConfig({ accentColor: '' })}
                          className={cn("w-full text-xs py-1.5 px-2 rounded border text-left", !coverConfig.accentColor && "border-primary bg-primary/10")}
                        >
                          Brand Primary
                        </button>
                        <div className="grid grid-cols-5 gap-1">
                          {guide.colors.slice(0, 10).map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setCoverConfig({ accentColor: color.hex })}
                              className={cn("w-7 h-7 rounded border-2 transition-transform hover:scale-110", coverConfig.accentColor === color.hex && "border-primary ring-2 ring-primary/30")}
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={coverConfig.accentColor || primaryColor}
                          onChange={(e) => setCoverConfig({ accentColor: e.target.value })}
                          className="w-full h-8 cursor-pointer rounded"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Element Toggles */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Show Elements</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'showLogo', label: 'Logo', icon: Image },
                    { key: 'showTagline', label: 'Tagline', icon: Type },
                    { key: 'showDate', label: 'Date', icon: Calendar },
                    { key: 'showCoverImage', label: 'Cover', icon: Image },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setCoverConfig({ [key]: !coverConfig[key as keyof CoverPageConfig] })}
                      className={cn(
                        "flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg border transition-all",
                        coverConfig[key as keyof CoverPageConfig]
                          ? "border-primary/50 bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {coverConfig[key as keyof CoverPageConfig] ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sections ({selectedCount}/{totalWithContent})
              </Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>All</Button>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectNone}>None</Button>
              </div>
            </div>
            
            <div className="space-y-1">
              {Object.entries(groupedSections).map(([category, sections]) => {
                const categorySections = sections.map(s => s.id as SectionId);
                const sectionsWithContent = categorySections.filter(id => hasSectionContent(id));
                const selectedInCategory = sectionsWithContent.filter(id => selectedSections.has(id)).length;
                const allSelected = sectionsWithContent.length > 0 && selectedInCategory === sectionsWithContent.length;
                const someSelected = selectedInCategory > 0 && !allSelected;
                
                return (
                  <Collapsible 
                    key={category} 
                    open={expandedCategories.has(category)}
                    onOpenChange={(open) => {
                      const next = new Set(expandedCategories);
                      if (open) next.add(category);
                      else next.delete(category);
                      onExpandedCategoriesChange(next);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-card border hover:bg-accent/50 cursor-pointer group">
                        <Checkbox 
                          checked={allSelected || (someSelected ? 'indeterminate' : false)}
                          onCheckedChange={() => toggleCategory(category)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-1 text-xs font-medium">{CATEGORY_LABELS[category]}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{selectedInCategory}/{sectionsWithContent.length}</span>
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          expandedCategories.has(category) && "rotate-180"
                        )} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-4 pr-2 py-1 space-y-0.5">
                        {sections.map((section) => {
                          const sectionId = section.id as SectionId;
                          const hasContent = hasSectionContent(sectionId);
                          return (
                            <div 
                              key={section.id}
                              className={cn(
                                "flex items-center gap-2 py-1.5 px-2 rounded-md",
                                hasContent ? "hover:bg-accent/50 cursor-pointer" : "opacity-40 cursor-not-allowed"
                              )}
                              onClick={() => hasContent && toggleSection(sectionId)}
                            >
                              <Checkbox 
                                checked={selectedSections.has(sectionId)}
                                disabled={!hasContent}
                                onCheckedChange={() => hasContent && toggleSection(sectionId)}
                              />
                              <span className="text-xs flex-1">{section.label}</span>
                              {!hasContent && <span className="text-xs text-muted-foreground">(empty)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
