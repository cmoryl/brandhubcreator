/**
 * IconStudioLibrary - Library management tab for Icon Studio
 * Manages organization icon libraries with 3-level hierarchy
 */

import { useState } from 'react';
import { 
  Plus, 
  ChevronRight,
  Building2,
  Package,
  Layers,
  Pencil,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { IconStudioTab } from '../IconStudio';
import DOMPurify from 'dompurify';

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

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');
  const [formParentId, setFormParentId] = useState<string | null>(null);

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
                      {lib.icons.slice(0, 6).map((icon) => (
                        <div key={icon.id} className="p-1.5 rounded bg-background border">
                          {renderIcon(icon.svgPath, 16)}
                        </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold">Icon Library Hierarchy</h3>
          <p className="text-sm text-muted-foreground">
            Manage organization-wide icon libraries with 3-level inheritance
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

      {/* Hierarchy Visualization */}
      <div className="p-4 rounded-lg bg-muted/30 border">
        <div className="flex items-center gap-4 text-sm flex-wrap">
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
          <span className="text-muted-foreground ml-auto hidden sm:inline">
            Each level inherits icons from parent levels
          </span>
        </div>
      </div>

      {/* Level Sections */}
      <div className="space-y-3">
        {renderLevelSection(
          'core',
          coreLibraries,
          <Building2 className="h-4 w-4 text-blue-500" />,
          'Core Libraries',
          'bg-blue-500/10'
        )}
        {renderLevelSection(
          'product_line',
          productLineLibraries,
          <Package className="h-4 w-4 text-purple-500" />,
          'Product Line Libraries',
          'bg-purple-500/10'
        )}
        {renderLevelSection(
          'brand',
          brandLibraries,
          <Layers className="h-4 w-4 text-orange-500" />,
          'Brand Libraries',
          'bg-orange-500/10'
        )}
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
    </div>
  );
};
