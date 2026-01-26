/**
 * IconLibraryManager - Organization settings component for managing icon libraries
 * Supports 3-level hierarchy: Core → Product Line → Brand
 */

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ChevronDown, 
  ChevronRight,
  Library,
  Layers,
  Building2,
  Package,
  Check,
  X,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { IconCreatorDialog } from './IconCreatorDialog';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';

interface IconLibraryManagerProps {
  organizationId: string;
  brandColors?: Array<{ hex: string; name: string }>;
}

const LEVEL_CONFIG = {
  core: {
    label: 'Core Icons',
    description: 'Universal icons inherited by all brands in the organization',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  product_line: {
    label: 'Product Line Icons',
    description: 'Icons for specific product lines or divisions',
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  brand: {
    label: 'Brand-Specific Icons',
    description: 'Custom icons for individual brands',
    icon: Layers,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
};

export const IconLibraryManager = ({ organizationId, brandColors = [] }: IconLibraryManagerProps) => {
  const {
    libraries,
    coreLibraries,
    productLineLibraries,
    brandLibraries,
    isLoading,
    createLibrary,
    updateLibrary,
    deleteLibrary,
  } = useIconLibraries(organizationId);

  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['core', 'product_line', 'brand']));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showIconCreator, setShowIconCreator] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<IconLibrary | null>(null);
  const [activeLibraryForIcons, setActiveLibraryForIcons] = useState<IconLibrary | null>(null);

  // Form state for create/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');
  const [formParentId, setFormParentId] = useState<string | null>(null);

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
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

  const handleSaveLibrary = async () => {
    if (!formName.trim()) return;

    if (editingLibrary) {
      await updateLibrary.mutateAsync({
        id: editingLibrary.id,
        updates: {
          name: formName,
          description: formDescription || undefined,
          parent_library_id: formParentId,
        },
      });
    } else {
      await createLibrary.mutateAsync({
        organization_id: organizationId,
        name: formName,
        level: formLevel,
        description: formDescription || undefined,
        parent_library_id: formParentId,
        icons: [],
      });
    }

    setShowCreateDialog(false);
    resetForm();
  };

  const handleAddIcons = (library: IconLibrary) => {
    setActiveLibraryForIcons(library);
    setShowIconCreator(true);
  };

  const handleSaveIcons = async (newIcons: BrandIconography[]) => {
    if (!activeLibraryForIcons) return;
    
    await updateLibrary.mutateAsync({
      id: activeLibraryForIcons.id,
      updates: {
        icons: [...activeLibraryForIcons.icons, ...newIcons],
      },
    });
    
    setActiveLibraryForIcons(null);
  };

  const handleRemoveIcon = async (library: IconLibrary, iconId: string) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: {
        icons: library.icons.filter(i => i.id !== iconId),
      },
    });
  };

  const handleToggleActive = async (library: IconLibrary) => {
    await updateLibrary.mutateAsync({
      id: library.id,
      updates: { is_active: !library.is_active },
    });
  };

  const renderLibraryCard = (library: IconLibrary) => {
    const config = LEVEL_CONFIG[library.level];
    const IconComponent = config.icon;

    return (
      <Card 
        key={library.id} 
        className={cn(
          'transition-all',
          !library.is_active && 'opacity-50'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', config.bgColor)}>
                <IconComponent className={cn('h-4 w-4', config.color)} />
              </div>
              <div>
                <CardTitle className="text-base">{library.name}</CardTitle>
                {library.description && (
                  <CardDescription className="text-xs mt-0.5">
                    {library.description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {library.icons.length} icons
              </Badge>
              <Switch
                checked={library.is_active}
                onCheckedChange={() => handleToggleActive(library)}
                className="scale-75"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Icon Preview Grid */}
          {library.icons.length > 0 ? (
            <div className="grid grid-cols-8 gap-2 mb-3">
              {library.icons.slice(0, 16).map((icon) => (
                <div
                  key={icon.id}
                  className="group relative aspect-square border rounded-md flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors"
                  title={icon.name}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {icon.svgPath.includes('<') ? (
                      <div 
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: icon.svgPath }}
                      />
                    ) : (
                      <svg viewBox={icon.viewBox || '0 0 24 24'} className="w-full h-full">
                        <path 
                          d={icon.svgPath} 
                          fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
                          stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveIcon(library, icon.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {library.icons.length > 16 && (
                <div className="aspect-square border rounded-md flex items-center justify-center bg-muted/30 text-xs text-muted-foreground">
                  +{library.icons.length - 16}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg mb-3">
              No icons added yet
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddIcons(library)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Icons
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(library)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Icon Library</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{library.name}"? This will remove all {library.icons.length} icons in this library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteLibrary.mutate(library.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLevelSection = (
    level: 'core' | 'product_line' | 'brand',
    levelLibraries: IconLibrary[]
  ) => {
    const config = LEVEL_CONFIG[level];
    const IconComponent = config.icon;
    const isExpanded = expandedLevels.has(level);
    const totalIcons = levelLibraries.reduce((sum, lib) => sum + lib.icons.length, 0);

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleLevel(level)}>
        <div className={cn('rounded-lg border', config.borderColor)}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  <IconComponent className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Badge variant="secondary">{levelLibraries.length} libraries</Badge>
                  <Badge variant="outline">{totalIcons} icons</Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {levelLibraries.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {levelLibraries.map(renderLibraryCard)}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <Library className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No {config.label.toLowerCase()} yet</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => openCreateDialog(level)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add {level === 'core' ? 'Core' : level === 'product_line' ? 'Product Line' : 'Brand'} Library
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Icon Library Hierarchy</h2>
          <p className="text-sm text-muted-foreground">
            Manage organization-wide icon libraries with 3-level inheritance
          </p>
        </div>
        <Button onClick={() => openCreateDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          New Library
        </Button>
      </div>

      {/* Hierarchy Visualization */}
      <div className="p-4 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Core</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            <span>Product Line</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            <span>Brand</span>
          </div>
          <span className="text-muted-foreground ml-auto">
            Each level inherits icons from parent levels
          </span>
        </div>
      </div>

      {/* Level Sections */}
      <div className="space-y-4">
        {renderLevelSection('core', coreLibraries)}
        {renderLevelSection('product_line', productLineLibraries)}
        {renderLevelSection('brand', brandLibraries)}
      </div>

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
                        <Layers className="h-4 w-4 text-orange-500" />
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

      {/* Icon Creator Dialog */}
      <IconCreatorDialog
        open={showIconCreator}
        onOpenChange={setShowIconCreator}
        onSave={handleSaveIcons}
        brandColors={brandColors}
      />
    </div>
  );
};
