/**
 * IconSetGeneratorDialog - AI-powered full icon set generator
 * Generates 50 organized icons across relevant sections for brands, products, or events
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Sparkles,
  AlertCircle,
  X,
  Package,
  Building2,
  Calendar,
  // Preview icons
  Home,
  Settings,
  User,
  Bell,
  Search,
  Heart,
  Star,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { IconLibrary } from '@/hooks/useIconLibraries';

// Entity type configurations
const ENTITY_TYPES = [
  { id: 'brand', label: 'Company/Brand', icon: Building2, description: 'Corporate identity icons' },
  { id: 'product', label: 'Product', icon: Package, description: 'Product feature icons' },
  { id: 'event', label: 'Event', icon: Calendar, description: 'Event-specific icons' },
];

// Section configurations by entity type (must match edge function)
const ENTITY_SECTIONS: Record<string, { name: string; description: string; count: number }[]> = {
  brand: [
    { name: "Core Identity", description: "Logo marks, brand symbols, identity elements", count: 6 },
    { name: "Navigation", description: "Menu, arrows, wayfinding icons", count: 6 },
    { name: "Actions", description: "Edit, save, delete, share operations", count: 6 },
    { name: "Communication", description: "Messages, notifications, contact icons", count: 6 },
    { name: "Commerce", description: "Shopping, payments, transactions", count: 5 },
    { name: "Users & Teams", description: "People, profiles, collaboration", count: 5 },
    { name: "Data & Analytics", description: "Charts, metrics, reporting", count: 5 },
    { name: "Settings & Security", description: "Configuration, privacy, locks", count: 5 },
    { name: "Files & Media", description: "Documents, images, attachments", count: 4 },
    { name: "Status & Feedback", description: "Alerts, success, error states", count: 2 },
  ],
  product: [
    { name: "Product Features", description: "Core functionality and capabilities", count: 8 },
    { name: "User Actions", description: "Primary interactions and operations", count: 7 },
    { name: "Navigation", description: "Menu, tabs, breadcrumbs, arrows", count: 6 },
    { name: "Data Display", description: "Tables, lists, grids, views", count: 5 },
    { name: "Input & Forms", description: "Fields, selections, uploads", count: 5 },
    { name: "Feedback & Status", description: "Loading, success, error, progress", count: 5 },
    { name: "Settings", description: "Preferences, configuration, toggles", count: 5 },
    { name: "Help & Support", description: "Documentation, tooltips, guides", count: 4 },
    { name: "Social & Sharing", description: "Share, connect, collaborate", count: 3 },
    { name: "Utilities", description: "Search, filter, sort, refresh", count: 2 },
  ],
  event: [
    { name: "Event Identity", description: "Event logo, badges, marks", count: 6 },
    { name: "Schedule & Time", description: "Calendar, clock, timeline icons", count: 7 },
    { name: "Venue & Location", description: "Maps, directions, places", count: 6 },
    { name: "Speakers & People", description: "Presenters, attendees, teams", count: 6 },
    { name: "Sessions & Content", description: "Talks, workshops, panels", count: 6 },
    { name: "Registration", description: "Tickets, badges, check-in", count: 5 },
    { name: "Networking", description: "Connect, chat, meet", count: 5 },
    { name: "Sponsors & Partners", description: "Exhibitors, partners, booths", count: 4 },
    { name: "Amenities", description: "Food, parking, facilities", count: 3 },
    { name: "Feedback", description: "Ratings, surveys, comments", count: 2 },
  ],
};

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
  'Media', 'Manufacturing', 'Real Estate', 'Travel', 'Food & Beverage',
  'Legal', 'Non-profit', 'Entertainment', 'Sports', 'Fashion',
];

interface IconStyle {
  strokeWidth: number;
  fill: boolean;
  cornerRadius: 'sharp' | 'rounded' | 'soft';
}

interface GeneratedSection {
  name: string;
  description: string;
  icons: BrandIconography[];
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

interface IconSetGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (icons: BrandIconography[], libraryId?: string) => void;
  libraries?: IconLibrary[];
  entityType?: 'brand' | 'product' | 'event';
  entityName?: string;
  industry?: string;
}

export const IconSetGeneratorDialog = ({
  open,
  onOpenChange,
  onSave,
  libraries = [],
  entityType: initialEntityType = 'brand',
  entityName: initialEntityName = '',
  industry: initialIndustry,
}: IconSetGeneratorDialogProps) => {
  // Configuration state
  const [entityType, setEntityType] = useState<'brand' | 'product' | 'event'>(initialEntityType);
  const [entityName, setEntityName] = useState(initialEntityName);
  const [industry, setIndustry] = useState(initialIndustry || '');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  
  // Style state
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

  // Get sections for current entity type
  const sections = ENTITY_SECTIONS[entityType] || ENTITY_SECTIONS.brand;
  const totalIcons = sections.reduce((sum, s) => sum + s.count, 0);

  // Calculate progress
  const completedSections = generatedSections.filter(s => s.status === 'complete').length;
  const progress = sections.length > 0 ? (completedSections / sections.length) * 100 : 0;
  const generatedIconCount = generatedSections.reduce(
    (sum, s) => sum + (s.status === 'complete' ? s.icons.length : 0), 
    0
  );

  // Initialize sections for generation
  const initializeSections = useCallback(() => {
    const initialSections: GeneratedSection[] = sections.map(s => ({
      name: s.name,
      description: s.description,
      icons: [],
      status: 'pending',
    }));
    setGeneratedSections(initialSections);
    setCurrentSectionIndex(0);
    setExpandedSections(new Set());
    setSelectedIcons(new Set());
  }, [sections]);

  // Generate icons for a single section
  const generateSection = useCallback(async (sectionIndex: number): Promise<boolean> => {
    try {
      setGeneratedSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'generating' } : s
      ));

      const response = await supabase.functions.invoke('generate-icon-set', {
        body: {
          entityType,
          entityName,
          industry: industry || undefined,
          style: iconStyle,
          sectionIndex,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate icons');
      }

      if (response.data?.icons) {
        setGeneratedSections(prev => prev.map((s, i) => 
          i === sectionIndex 
            ? { ...s, icons: response.data.icons, status: 'complete' }
            : s
        ));
        
        // Auto-expand the newly generated section
        setExpandedSections(prev => new Set([...prev, sections[sectionIndex].name]));
        
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error generating section ${sectionIndex}:`, error);
      setGeneratedSections(prev => prev.map((s, i) => 
        i === sectionIndex 
          ? { ...s, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : s
      ));
      return false;
    }
  }, [entityType, entityName, industry, iconStyle, sections]);

  // Generate all sections sequentially
  const generateAllSections = async () => {
    if (!entityName.trim()) {
      toast.error('Please enter a name for your brand/product/event');
      return;
    }

    setIsGenerating(true);
    initializeSections();

    toast.info(`Starting icon set generation for ${entityName}...`, {
      description: `Generating ${totalIcons} icons across ${sections.length} sections`,
    });

    for (let i = 0; i < sections.length; i++) {
      setCurrentSectionIndex(i);
      const success = await generateSection(i);
      
      if (!success) {
        toast.warning(`Section "${sections[i].name}" had issues, continuing...`);
      }

      // Small delay between sections to avoid rate limiting
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
    
    const successfulSections = generatedSections.filter(s => s.status === 'complete').length;
    toast.success(`Icon set generation complete!`, {
      description: `Generated icons across ${successfulSections} sections`,
    });
  };

  // Toggle icon selection
  const toggleIconSelection = (iconId: string) => {
    setSelectedIcons(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) {
        next.delete(iconId);
      } else {
        next.add(iconId);
      }
      return next;
    });
  };

  // Select all icons in a section
  const selectAllInSection = (sectionName: string) => {
    const section = generatedSections.find(s => s.name === sectionName);
    if (!section) return;
    
    setSelectedIcons(prev => {
      const next = new Set(prev);
      section.icons.forEach(icon => next.add(icon.id));
      return next;
    });
  };

  // Deselect all icons in a section
  const deselectAllInSection = (sectionName: string) => {
    const section = generatedSections.find(s => s.name === sectionName);
    if (!section) return;
    
    setSelectedIcons(prev => {
      const next = new Set(prev);
      section.icons.forEach(icon => next.delete(icon.id));
      return next;
    });
  };

  // Select all generated icons
  const selectAllIcons = () => {
    const allIds = generatedSections.flatMap(s => s.icons.map(i => i.id));
    setSelectedIcons(new Set(allIds));
  };

  // Save selected icons
  const handleSave = () => {
    const iconsToSave = generatedSections.flatMap(s => 
      s.icons.filter(icon => selectedIcons.has(icon.id))
    );

    if (iconsToSave.length === 0) {
      toast.error('Please select at least one icon to save');
      return;
    }

    onSave(iconsToSave, selectedLibraryId || undefined);
    onOpenChange(false);
    
    const libraryName = libraries.find(l => l.id === selectedLibraryId)?.name;
    toast.success(`Added ${iconsToSave.length} icons${libraryName ? ` to "${libraryName}"` : ''}`);
  };

  // Reset state when dialog closes
  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedSections([]);
      setSelectedIcons(new Set());
      setExpandedSections(new Set());
    }
    onOpenChange(open);
  };

  // Render SVG icon safely
  const renderIcon = (svgPath: string, size: number = 24) => {
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Icon Set Generator
          </DialogTitle>
          <DialogDescription>
            Generate a complete set of 50 organized icons for your {entityType}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Entity Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Entity Type</Label>
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

            {/* Entity Name */}
            <div className="space-y-2">
              <Label htmlFor="entity-name">Name *</Label>
              <Input
                id="entity-name"
                placeholder={`Enter ${entityType} name...`}
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Industry */}
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

            {/* Target Library Selector */}
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
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1">
                            {lib.level === 'core' ? 'Core' : lib.level === 'product_line' ? 'Product' : 'Brand'}
                          </Badge>
                          {lib.name}
                          <span className="text-muted-foreground text-xs">
                            ({lib.icons.length} icons)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Choose where to add the generated icons
                </p>
              </div>
            )}

            {/* Style Controls */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Icon Style</Label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
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
                  className="justify-start"
                  disabled={isGenerating}
                >
                  <ToggleGroupItem value="sharp" className="gap-1.5">
                    <Square className="h-4 w-4" />
                    <span className="text-xs">Sharp</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="rounded" className="gap-1.5">
                    <Circle className="h-4 w-4" />
                    <span className="text-xs">Rounded</span>
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
                    <div 
                      key={idx}
                      className="flex items-center justify-center p-2 rounded bg-background"
                    >
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
                <p className="text-[10px] text-muted-foreground text-center">
                  Preview of how your icons will look
                </p>
              </div>
            </div>

            {/* Section Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sections ({sections.length})</Label>
              <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                {sections.map((section, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{section.name}</span>
                    <Badge variant="outline" className="text-[10px]">{section.count}</Badge>
                  </div>
                ))}
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

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Generating: {sections[currentSectionIndex]?.name}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Generated Icons */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden border rounded-lg">
            {generatedSections.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No icons generated yet</p>
                <p className="text-sm">Configure your settings and click Generate to create your icon set</p>
              </div>
            ) : (
              <>
                {/* Selection Header */}
                <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      {selectedIcons.size} selected
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      of {generatedIconCount} icons
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={selectAllIcons}
                      disabled={generatedIconCount === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedIcons(new Set())}
                      disabled={selectedIcons.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Sections List */}
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
                          <button className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {expandedSections.has(section.name) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div className="text-left">
                                <div className="font-medium text-sm">{section.name}</div>
                                <div className="text-xs text-muted-foreground">{section.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.status === 'pending' && (
                                <Badge variant="outline">Pending</Badge>
                              )}
                              {section.status === 'generating' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Generating
                                </Badge>
                              )}
                              {section.status === 'complete' && (
                                <Badge variant="default" className="gap-1 bg-green-600">
                                  <Check className="h-3 w-3" />
                                  {section.icons.length}
                                </Badge>
                              )}
                              {section.status === 'error' && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Error
                                </Badge>
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {section.icons.length > 0 && (
                            <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {section.icons.filter(i => selectedIcons.has(i.id)).length} of {section.icons.length} selected
                                </span>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => selectAllInSection(section.name)}
                                  >
                                    Select All
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => deselectAllInSection(section.name)}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {section.icons.map((icon) => {
                                  const isSelected = selectedIcons.has(icon.id);
                                  return (
                                    <button
                                      key={icon.id}
                                      onClick={() => toggleIconSelection(icon.id)}
                                      className={cn(
                                        'relative p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all group',
                                        isSelected
                                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                      )}
                                      title={icon.name}
                                    >
                                      {renderIcon(icon.svgPath, 20)}
                                      {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                        </div>
                                      )}
                                      <span className="text-[9px] text-muted-foreground truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {icon.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {section.status === 'error' && (
                            <div className="mt-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                              <AlertCircle className="h-4 w-4 inline mr-2" />
                              {section.error || 'Failed to generate icons for this section'}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {generatedIconCount > 0 && (
              <span>{generatedIconCount} icons generated across {completedSections} sections</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedIcons.size === 0 || isGenerating}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Add {selectedIcons.size} Icons
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
