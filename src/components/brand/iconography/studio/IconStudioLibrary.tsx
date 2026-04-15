/**
 * IconStudioLibrary - Library management tab for Icon Studio
 * Manages organization icon libraries with 3-level hierarchy
 * Enhanced with search, filtering, and bulk selection
 */

import { useState, useMemo } from 'react';
import { 
  Plus, 
  ChevronRight,
  Building2,
  Package,
  Layers,
  Pencil,
  Trash2,
  ChevronDown,
  Expand,
  Search,
  X,
  Grid3X3,
  LayoutList,
  CheckSquare,
  Square,
  Download,
  Wand2,
  ImageIcon,
  Globe,
  Code,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { IconStudioTab } from '../IconStudio';
import { IconPreviewDialog } from '../IconPreviewDialog';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';

type ViewMode = 'hierarchy' | 'grid';

interface IconStudioLibraryProps {
  organizationId: string;
  libraries: IconLibrary[];
  coreLibraries: IconLibrary[];
  productLineLibraries: IconLibrary[];
  brandLibraries: IconLibrary[];
  isLoading: boolean;
  createLibrary: any;
  updateLibrary: any;
  deleteLibrary: any;
  onNavigateToTab: (tab: IconStudioTab) => void;
}

export const IconStudioLibrary = ({
  organizationId,
  libraries,
  coreLibraries,
  productLineLibraries,
  brandLibraries,
  isLoading,
  createLibrary,
  updateLibrary,
  deleteLibrary,
  onNavigateToTab,
}: IconStudioLibraryProps) => {
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['core', 'product_line', 'brand']));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<IconLibrary | null>(null);
  const [previewIcon, setPreviewIcon] = useState<BrandIconography | null>(null);
  
  // Enhanced UX state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [selectedIcons, setSelectedIcons] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');
  const [formParentId, setFormParentId] = useState<string | null>(null);

  // Compute all icons across all libraries
  const allIcons = useMemo(() => {
    return libraries.flatMap(lib => 
      lib.icons.map(icon => ({ ...icon, libraryId: lib.id, libraryName: lib.name, level: lib.level }))
    );
  }, [libraries]);

  // Filter icons based on search and level filter
  const filteredIcons = useMemo(() => {
    let icons = allIcons;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(icon => 
        icon.name.toLowerCase().includes(query) ||
        icon.category?.toLowerCase().includes(query) ||
        icon.libraryName.toLowerCase().includes(query)
      );
    }
    
    if (filterLevel !== 'all') {
      icons = icons.filter(icon => icon.level === filterLevel);
    }
    
    return icons;
  }, [allIcons, searchQuery, filterLevel]);

  // Total icon count
  const totalIconCount = allIcons.length;

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormLevel('core');
    setFormParentId(null);
    setEditingLibrary(null);
  };

  const openCreateDialog = (level?: 'core' | 'product_line' | 'brand') => {
    resetForm();
    if (level) setFormLevel(level);
    setShowCreateDialog(true);
  };

  const openEditDialog = (library: IconLibrary) => {
    setEditingLibrary(library);
    setFormName(library.name);
    setFormDescription(library.description || '');
    setFormLevel(library.level);
    setFormParentId(library.parent_library_id);
    setShowCreateDialog(true);
  };

  const toggleIconSelection = (iconId: string) => {
    setSelectedIcons(prev => {
      const next = new Set(prev);
      if (next.has(iconId)) next.delete(iconId);
      else next.add(iconId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIcons(new Set(filteredIcons.map(i => i.id)));
  };

  const clearSelection = () => {
    setSelectedIcons(new Set());
  };

  const exportSelectedIcons = () => {
    const iconsToExport = allIcons.filter(i => selectedIcons.has(i.id));
    if (iconsToExport.length === 0) {
      toast.error('No icons selected');
      return;
    }
    
    const svgBundle = iconsToExport.map(icon => {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });
      return `<!-- ${icon.name} -->\n${sanitized}`;
    }).join('\n\n');
    
    const blob = new Blob([svgBundle], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icons-export-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${iconsToExport.length} icons`);
  };

  const handleSaveLibrary = async () => {
    if (!formName.trim()) return;

    try {
      const parentId = formParentId && formParentId.trim() !== '' ? formParentId : null;

      if (editingLibrary) {
        await updateLibrary.mutateAsync({
          id: editingLibrary.id,
          updates: {
            name: formName,
            description: formDescription || undefined,
            parent_library_id: parentId,
          },
        });
      } else {
        await createLibrary.mutateAsync({
          organization_id: organizationId,
          name: formName,
          level: formLevel,
          description: formDescription || undefined,
          parent_library_id: parentId,
          icons: [],
        });
      }

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Save library failed:', error);
    }
  };

  const renderIcon = (icon: BrandIconography, size: number = 20) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullSvg = icon.svgPath.trim().startsWith('<');

    if (isFullSvg) {
      // Full SVG content - render directly via dangerouslySetInnerHTML
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });

      // If it's a complete <svg> element, inject it directly (no wrapping SVG)
      if (sanitized.trim().startsWith('<svg')) {
        return (
          <div 
            className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        );
      }

      // It's inner SVG content (paths, groups, etc.) - wrap in an SVG
      return (
        <div className="flex items-center justify-center" style={{ width: size, height: size }}>
          <svg viewBox={viewBox} width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <g dangerouslySetInnerHTML={{ __html: sanitized }} />
          </svg>
        </div>
      );
    }

    // Path data only - render as proper SVG
    return (
      <svg
        viewBox={viewBox}
        style={{ width: size, height: size }}
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
        strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
      >
        <path d={icon.svgPath} />
      </svg>
    );
  };

  const renderLevelSection = (
    level: 'core' | 'product_line' | 'brand',
    levelLibraries: IconLibrary[],
    icon: React.ReactNode,
    title: string,
    color: string
  ) => (
    <Collapsible
      open={expandedLevels.has(level)}
      onOpenChange={() => toggleLevel(level)}
    >
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            {expandedLevels.has(level) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <div className={cn("p-1.5 rounded", color)}>
              {icon}
            </div>
            <span className="font-medium">{title}</span>
            <Badge variant="secondary">{levelLibraries.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openCreateDialog(level);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-8">
          {levelLibraries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No libraries at this level yet
            </p>
          ) : (
            levelLibraries.map((lib) => (
              <div
                key={lib.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lib.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {lib.icons.length} icons
                    </Badge>
                  </div>
                  {lib.description && (
                    <p className="text-xs text-muted-foreground mt-1">{lib.description}</p>
                  )}
                  {lib.icons.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {lib.icons.slice(0, 6).map((iconItem) => (
                        <button
                          key={iconItem.id}
                          onClick={() => setPreviewIcon(iconItem)}
                          className="p-1.5 rounded bg-background border hover:border-primary hover:bg-accent transition-colors group relative"
                          title={`Click to expand ${iconItem.name}`}
                        >
                          {renderIcon(iconItem, 16)}
                          <Expand className="h-2 w-2 absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                        </button>
                      ))}
                      {lib.icons.length > 6 && (
                        <div className="p-1.5 rounded bg-background border text-xs text-muted-foreground flex items-center">
                          +{lib.icons.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(lib)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLibrary.mutate(lib.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Grid view icon renderer
  const renderGridIcon = (icon: typeof filteredIcons[0]) => {
    const isSelected = selectedIcons.has(icon.id);
    return (
      <Tooltip key={icon.id}>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey) {
                toggleIconSelection(icon.id);
              } else {
                setPreviewIcon(icon);
              }
            }}
            className={cn(
              'relative p-3 rounded-lg border flex flex-col items-center gap-2 transition-all group',
              isSelected
                ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {renderIcon(icon, 28)}
            <span className="text-[10px] text-muted-foreground truncate max-w-full text-center leading-tight">
              {icon.name}
            </span>
            <Badge variant="outline" className="text-[8px] px-1 py-0">
              {icon.level === 'core' ? 'Core' : icon.level === 'product_line' ? 'Product' : 'Brand'}
            </Badge>
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <CheckSquare className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium">{icon.name}</p>
          <p className="text-xs text-muted-foreground">{icon.libraryName}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Empty state — no libraries and no icons at all
  const isEmpty = libraries.length === 0 && totalIconCount === 0;

  return (
    <div className="space-y-5">
      {isEmpty ? (
        /* ───── Friendly Empty-State Onboarding ───── */
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Layers className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-semibold">Start Your Icon Library</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Build a consistent icon system for your brand. Generate icons with AI, 
              upload your own, or create them from scratch.
            </p>
          </div>

          {/* Quick-start action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
            <button
              onClick={() => onNavigateToTab('ai-generator')}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Generate with AI</p>
                <p className="text-xs text-muted-foreground mt-0.5">Create a full icon set instantly</p>
              </div>
            </button>

            <button
              onClick={() => openCreateDialog('core')}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">New Library</p>
                <p className="text-xs text-muted-foreground mt-0.5">Organize icons manually</p>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('creator')}
              className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <ImageIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Upload & Convert</p>
                <p className="text-xs text-muted-foreground mt-0.5">Turn PNGs into clean SVGs</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* ───── Populated Library View ───── */
        <>
           {/* Header */}
           <div className="flex items-center justify-between flex-wrap gap-3">
             <div>
               <h3 className="text-lg font-semibold">Icon Library</h3>
               <p className="text-sm text-muted-foreground">
                 {totalIconCount} icon{totalIconCount !== 1 ? 's' : ''} across {libraries.length} librar{libraries.length !== 1 ? 'ies' : 'y'}
               </p>
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => onNavigateToTab('ai-generator')}>
                 Generate with AI
               </Button>
               <Button size="sm" onClick={() => openCreateDialog()}>
                 <Plus className="h-4 w-4 mr-1" />
                 New Library
               </Button>
             </div>
           </div>

           {/* Quick Add Icons Hero Card */}
           <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 p-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
               <div className="flex-1">
                 <h4 className="font-semibold text-sm flex items-center gap-2">
                   <Globe className="h-4 w-4 text-primary" />
                   Quick Add Icons
                 </h4>
                 <p className="text-xs text-muted-foreground mt-1">
                   Search 50,000+ icons, upload SVGs, paste code, or get AI recommendations
                 </p>
               </div>
               <div className="flex flex-wrap gap-2">
                 <Button
                   variant="default"
                   size="sm"
                   className="gap-1.5"
                   onClick={() => onNavigateToTab('creator')}
                 >
                   <Globe className="h-3.5 w-3.5" />
                   Browse 50K+ Icons
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-1.5"
                   onClick={() => onNavigateToTab('creator')}
                 >
                   <Upload className="h-3.5 w-3.5" />
                   Upload SVG
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-1.5"
                   onClick={() => onNavigateToTab('creator')}
                 >
                   <Code className="h-3.5 w-3.5" />
                   Paste Code
                 </Button>
               </div>
             </div>
           </div>

           {/* Search & Filter Toolbar — only show when there are icons to search */}
           {totalIconCount > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search icons by name, category, or library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="product_line">Product Line</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'hierarchy' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-r-none px-2"
                    onClick={() => setViewMode('hierarchy')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-l-none px-2"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Selection Actions Bar */}
          {selectedIcons.size > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {selectedIcons.size} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
              <Button size="sm" onClick={exportSelectedIcons}>
                <Download className="h-4 w-4 mr-1" />
                Export SVG
              </Button>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && totalIconCount > 0 && (
            <div className="space-y-3">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No icons found matching your search</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} 
                      {searchQuery && ' matching search'}
                    </span>
                    <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                      <Square className="h-3 w-3 mr-1" />
                      Select All
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {filteredIcons.map(renderGridIcon)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hierarchy View */}
          {viewMode === 'hierarchy' && (
            <div className="space-y-3">
              {renderLevelSection(
                'core',
                coreLibraries,
                <Building2 className="h-4 w-4 text-primary" />,
                'Core Libraries',
                'bg-primary/10'
              )}
              {renderLevelSection(
                'product_line',
                productLineLibraries,
                <Package className="h-4 w-4 text-primary" />,
                'Product Line Libraries',
                'bg-primary/10'
              )}
              {renderLevelSection(
                'brand',
                brandLibraries,
                <Layers className="h-4 w-4 text-primary" />,
                'Brand Libraries',
                'bg-primary/10'
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLibrary ? 'Edit Icon Library' : 'Create Icon Library'}
            </DialogTitle>
            <DialogDescription>
              {editingLibrary 
                ? 'Update the library details below'
                : 'Add a new icon library to your organization hierarchy'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Library Name</Label>
              <Input
                placeholder="e.g., Navigation Icons, Brand Marks"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What icons are in this library?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>

            {!editingLibrary && (
              <div className="space-y-2">
                <Label>Hierarchy Level</Label>
                <Select value={formLevel} onValueChange={(v) => setFormLevel(v as typeof formLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        Core - All brands inherit
                      </div>
                    </SelectItem>
                    <SelectItem value="product_line">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-500" />
                        Product Line - Division specific
                      </div>
                    </SelectItem>
                    <SelectItem value="brand">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-sky-500" />
                        Brand - Brand specific
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formLevel === 'product_line' && coreLibraries.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Core Library (Optional)</Label>
                <Select 
                  value={formParentId || 'none'} 
                  onValueChange={(v) => setFormParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {coreLibraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formLevel === 'brand' && productLineLibraries.length > 0 && (
              <div className="space-y-2">
                <Label>Parent Product Line (Optional)</Label>
                <Select 
                  value={formParentId || 'none'} 
                  onValueChange={(v) => setFormParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent library" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {productLineLibraries.map(lib => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLibrary}
              disabled={!formName.trim() || createLibrary.isPending || updateLibrary.isPending}
            >
              {editingLibrary ? 'Save Changes' : 'Create Library'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Icon Preview Dialog */}
      <IconPreviewDialog
        icon={previewIcon}
        open={!!previewIcon}
        onOpenChange={(open) => !open && setPreviewIcon(null)}
      />
    </div>
  );
};
