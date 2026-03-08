/**
 * BoothPresetPicker - Dialog for browsing and applying industry booth design presets
 */
import { useState, useMemo } from 'react';
import {
  Cpu, Heart, Landmark, Palette, Factory, ShoppingBag, GraduationCap,
  Hotel, Building, Grid3X3, Check, Lightbulb, Monitor, Layout, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BOOTH_DESIGN_PRESETS, PRESET_CATEGORIES, type BoothDesignPreset } from './boothPresets';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  all: <Grid3X3 className="h-4 w-4" />,
  technology: <Cpu className="h-4 w-4" />,
  healthcare: <Heart className="h-4 w-4" />,
  finance: <Landmark className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  industrial: <Factory className="h-4 w-4" />,
  retail: <ShoppingBag className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  hospitality: <Hotel className="h-4 w-4" />,
  government: <Building className="h-4 w-4" />,
};

const LAYOUT_LABELS: Record<string, string> = {
  'inline': "10'×8' Inline",
  'inline-10x10': "10'×10' Inline Tall",
  'inline-10x20': "10'×20' Double Inline",
  'inline-10x30': "10'×30' Triple Inline",
  'l-shape': "10'×10' L-Shape",
  'l-shape-10x20': "10'×20' L-Shape Wide",
  'u-shape': "10'×10' U-Shape",
  'u-shape-10x20': "10'×20' U-Shape Wide",
  't-shape-10x20': "10'×20' T-Shape",
  'peninsula-20x20': "20'×20' Peninsula",
  'island': "20'×20' Island",
  'island-20x30': "20'×30' Island",
  'island-30x30': "30'×30' Island",
  'island-40x40': "40'×40' Island",
};

interface BoothPresetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyPreset: (preset: BoothDesignPreset) => void;
}

function PresetCard({ preset, selected, onSelect, onApply }: {
  preset: BoothDesignPreset;
  selected: boolean;
  onSelect: () => void;
  onApply: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/40 hover:shadow-sm"
      )}
      onClick={onSelect}
    >
      {/* Color preview bar */}
      <div className="flex gap-1 mb-3">
        <div className="h-2 flex-1 rounded-full" style={{ background: preset.primaryColor }} />
        <div className="h-2 w-1/3 rounded-full" style={{ background: preset.accentColor }} />
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm text-foreground leading-tight">{preset.name}</h4>
        {selected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{preset.description}</p>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          <Layout className="h-3 w-3 mr-1" />
          {LAYOUT_LABELS[preset.layout] || preset.layout}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {preset.panelGuides.length} panel{preset.panelGuides.length > 1 ? 's' : ''}
        </Badge>
        {(preset.placedAssets?.length ?? 0) > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary">
            {preset.placedAssets!.length} furniture
          </Badge>
        )}
      </div>

      {selected && (
        <Button size="sm" className="w-full mt-1 gap-1.5" onClick={(e) => { e.stopPropagation(); onApply(); }}>
          Apply Preset
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function PresetDetail({ preset }: { preset: BoothDesignPreset }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">{preset.industry}</Badge>
          <Badge variant="outline" className="text-xs">{preset.lighting.replace('-', ' ')}</Badge>
        </div>
        <h3 className="text-lg font-bold text-foreground">{preset.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
      </div>

      {/* Color scheme */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Color Scheme</h4>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md border" style={{ background: preset.primaryColor }} />
            <div>
              <p className="text-xs font-medium text-foreground">Primary</p>
              <p className="text-[10px] text-muted-foreground font-mono">{preset.primaryColor}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md border" style={{ background: preset.accentColor }} />
            <div>
              <p className="text-xs font-medium text-foreground">Accent</p>
              <p className="text-[10px] text-muted-foreground font-mono">{preset.accentColor}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Panel guides */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Panel Content Guide</h4>
        <div className="space-y-3">
          {preset.panelGuides.map((guide) => (
            <div key={guide.panelId} className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{guide.panelId}</Badge>
                <span className="text-xs font-semibold text-foreground">{guide.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{guide.description}</p>
              {guide.colorTreatment && (
                <p className="text-[10px] text-primary mt-1 italic">🎨 {guide.colorTreatment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Fixtures */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggested Fixtures</h4>
        <div className="grid grid-cols-1 gap-1.5">
          {preset.fixtures.map((fix, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{fix.name}</span>
              <span className="text-muted-foreground">· {fix.position}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Design tips */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" /> Design Tips
        </h4>
        <ul className="space-y-1.5">
          {preset.designTips.map((tip, i) => (
            <li key={i} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function BoothPresetPicker({ open, onOpenChange, onApplyPreset }: BoothPresetPickerProps) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return BOOTH_DESIGN_PRESETS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.industry.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.includes(q))
        );
      }
      return true;
    });
  }, [category, search]);

  const selectedPreset = selectedId ? BOOTH_DESIGN_PRESETS.find(p => p.id === selectedId) : null;

  const handleApply = () => {
    if (selectedPreset) {
      onApplyPreset(selectedPreset);
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">Booth Design Presets</DialogTitle>
          <DialogDescription>
            Choose an industry-specific booth design template with layout, color scheme, and content guides
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[65vh]">
          {/* Left sidebar - categories */}
          <div className="w-48 border-r bg-muted/30 p-3 shrink-0">
            <div className="space-y-0.5">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={cn(
                    "w-full flex items-center gap-2 text-xs px-2.5 py-2 rounded-md transition-colors text-left",
                    category === cat.value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setCategory(cat.value)}
                >
                  {CATEGORY_ICONS[cat.value]}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center - preset grid */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b">
              <Input
                placeholder="Search presets by name, industry, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  No presets match your search
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      selected={selectedId === preset.id}
                      onSelect={() => setSelectedId(preset.id)}
                      onApply={handleApply}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right panel - preset detail */}
          {selectedPreset ? (
            <div className="w-72 border-l bg-muted/20 shrink-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <PresetDetail preset={selectedPreset} />
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="w-72 border-l bg-muted/20 shrink-0 flex items-center justify-center p-6">
              <p className="text-sm text-muted-foreground text-center">Select a preset to view details and content guides</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
