/**
 * IconStudioAIGenerator - AI-powered icon set generation tab
 * Generates complete icon sets organized by sections
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Wand2,
  Loader2,
  Check,
  Square,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Package,
  Building2,
  Calendar,
  Home,
  Settings,
  User,
  Bell,
  Search,
  Heart,
  Star,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const ENTITY_TYPES = [
  { id: 'brand', label: 'Company/Brand', icon: Building2 },
  { id: 'product', label: 'Product', icon: Package },
  { id: 'event', label: 'Event', icon: Calendar },
];

const ENTITY_SECTIONS: Record<string, { name: string; count: number }[]> = {
  brand: [
    { name: "Core Identity", count: 6 },
    { name: "Navigation", count: 6 },
    { name: "Actions", count: 6 },
    { name: "Communication", count: 6 },
    { name: "Commerce", count: 5 },
    { name: "Users & Teams", count: 5 },
    { name: "Data & Analytics", count: 5 },
    { name: "Settings & Security", count: 5 },
    { name: "Files & Media", count: 4 },
    { name: "Status & Feedback", count: 2 },
  ],
  product: [
    { name: "Product Features", count: 8 },
    { name: "User Actions", count: 7 },
    { name: "Navigation", count: 6 },
    { name: "Data Display", count: 5 },
    { name: "Input & Forms", count: 5 },
    { name: "Feedback & Status", count: 5 },
    { name: "Settings", count: 5 },
    { name: "Help & Support", count: 4 },
    { name: "Social & Sharing", count: 3 },
    { name: "Utilities", count: 2 },
  ],
  event: [
    { name: "Event Identity", count: 6 },
    { name: "Schedule & Time", count: 7 },
    { name: "Venue & Location", count: 6 },
    { name: "Speakers & People", count: 6 },
    { name: "Sessions & Content", count: 6 },
    { name: "Registration", count: 5 },
    { name: "Networking", count: 5 },
    { name: "Sponsors & Partners", count: 4 },
    { name: "Amenities", count: 3 },
    { name: "Feedback", count: 2 },
  ],
};

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
  'Media', 'Manufacturing', 'Real Estate', 'Travel', 'Food & Beverage',
];

interface IconStyle {
  strokeWidth: number;
  fill: boolean;
  cornerRadius: 'sharp' | 'rounded';
}

interface GeneratedSection {
  name: string;
  icons: BrandIconography[];
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
  const [entityType, setEntityType] = useState<'brand' | 'product' | 'event'>('brand');
  const [entityName, setEntityName] = useState(organizationName);
  const [industry, setIndustry] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  
  const [iconStyle, setIconStyle] = useState<IconStyle>({
    strokeWidth: 2,
    fill: false,
    cornerRadius: 'rounded',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());

  const sections = ENTITY_SECTIONS[entityType];
  const totalIcons = sections.reduce((sum, s) => sum + s.count, 0);
  const completedSections = generatedSections.filter(s => s.status === 'complete').length;
  const progress = sections.length > 0 ? (completedSections / sections.length) * 100 : 0;

  const generateSection = useCallback(async (sectionIndex: number): Promise<boolean> => {
    try {
      setGeneratedSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'generating' } : s
      ));

      const response = await supabase.functions.invoke('generate-icon-set', {
        body: { entityType, entityName, industry: industry || undefined, style: iconStyle, sectionIndex },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.icons) {
        setGeneratedSections(prev => prev.map((s, i) => 
          i === sectionIndex ? { ...s, icons: response.data.icons, status: 'complete' } : s
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
  }, [entityType, entityName, industry, iconStyle, sections]);

  const generateAllSections = async () => {
    if (!entityName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsGenerating(true);
    setGeneratedSections(sections.map(s => ({ name: s.name, icons: [], status: 'pending' })));
    setSelectedIcons(new Set());

    for (let i = 0; i < sections.length; i++) {
      setCurrentSectionIndex(i);
      await generateSection(i);
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
    toast.success('Icon set generation complete!');
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

    onSaveIcons(iconsToSave, selectedLibraryId || undefined);
    toast.success(`Saved ${iconsToSave.length} icons`);
  };

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

  const generatedIconCount = generatedSections.reduce((sum, s) => sum + s.icons.length, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Configuration */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">AI Icon Set Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate {totalIcons} icons across {sections.length} sections
          </p>
        </div>

        {/* Entity Type */}
        <div className="space-y-3">
          <Label>Entity Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {ENTITY_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setEntityType(type.id as typeof entityType)}
                  disabled={isGenerating}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all',
                    entityType === type.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent border-border'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name & Industry */}
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            placeholder={`Enter ${entityType} name...`}
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label>Industry (optional)</Label>
          <Select value={industry || 'none'} onValueChange={(v) => setIndustry(v === 'none' ? '' : v)} disabled={isGenerating}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target Library */}
        {libraries.length > 0 && (
          <div className="space-y-2">
            <Label>Save to Library</Label>
            <Select value={selectedLibraryId || 'auto'} onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Select target library..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (first Core library)</SelectItem>
                {libraries.filter(l => l.is_active).map((lib) => (
                  <SelectItem key={lib.id} value={lib.id}>
                    {lib.name} ({lib.icons.length} icons)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Style Controls */}
        <div className="space-y-4">
          <Label>Icon Style</Label>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stroke Width</span>
              <span className="text-muted-foreground">{iconStyle.strokeWidth}</span>
            </div>
            <Slider
              value={[iconStyle.strokeWidth]}
              onValueChange={([v]) => setIconStyle(s => ({ ...s, strokeWidth: v }))}
              min={1}
              max={3}
              step={0.5}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm">Corner Style</span>
            <ToggleGroup
              type="single"
              value={iconStyle.cornerRadius}
              onValueChange={(v) => v && setIconStyle(s => ({ ...s, cornerRadius: v as any }))}
              disabled={isGenerating}
            >
              <ToggleGroupItem value="sharp" className="gap-1.5">
                <Square className="h-4 w-4" />
                Sharp
              </ToggleGroupItem>
              <ToggleGroupItem value="rounded" className="gap-1.5">
                <Circle className="h-4 w-4" />
                Rounded
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Filled Icons</span>
            <Switch
              checked={iconStyle.fill}
              onCheckedChange={(fill) => setIconStyle(s => ({ ...s, fill }))}
              disabled={isGenerating}
            />
          </div>

          {/* Style Preview */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Style Preview</Label>
            <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50 border">
              {[Home, Settings, User, Bell, Search, Heart, Star, Mail].map((IconComponent, idx) => (
                <div key={idx} className="flex items-center justify-center p-2 rounded bg-background">
                  <IconComponent
                    size={20}
                    strokeWidth={iconStyle.strokeWidth}
                    fill={iconStyle.fill ? 'currentColor' : 'none'}
                    strokeLinecap={iconStyle.cornerRadius === 'sharp' ? 'square' : 'round'}
                    strokeLinejoin={iconStyle.cornerRadius === 'sharp' ? 'miter' : 'round'}
                    className="text-foreground"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateAllSections}
          disabled={isGenerating || !entityName.trim()}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating ({currentSectionIndex + 1}/{sections.length})...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate {totalIcons} Icons
            </>
          )}
        </Button>

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Generating: {sections[currentSectionIndex]?.name}
            </p>
          </div>
        )}
      </div>

      {/* Right: Results */}
      <div className="border rounded-lg overflow-hidden flex flex-col">
        {generatedSections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Wand2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No icons generated yet</p>
            <p className="text-sm">Configure settings and click Generate</p>
          </div>
        ) : (
          <>
            <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    {section.icons.length > 0 && (
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                        <div className="grid grid-cols-6 gap-2">
                          {section.icons.map((icon) => {
                            const isSelected = selectedIcons.has(icon.id);
                            return (
                              <button
                                key={icon.id}
                                onClick={() => toggleIconSelection(icon.id)}
                                className={cn(
                                  'relative p-2.5 rounded-lg border flex items-center justify-center transition-all',
                                  isSelected
                                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                                )}
                                title={icon.name}
                              >
                                {renderIcon(icon.svgPath, 20)}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            <div className="p-3 border-t">
              <Button
                onClick={handleSave}
                disabled={selectedIcons.size === 0 || isGenerating}
                className="w-full gap-2"
              >
                <Check className="h-4 w-4" />
                Save {selectedIcons.size} Icons
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
