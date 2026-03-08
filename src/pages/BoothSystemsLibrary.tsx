/**
 * BoothSystemsLibrary — Master booth system library page.
 * One base design powers multiple events with variant size configurations.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Building2, Layers, Box, Calendar,
  Trash2, Edit2, Check, X, ChevronRight, Loader2,
  BookTemplate, Copy, Save, AlertTriangle, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { BrandHubLogo } from '@/components/BrandHubLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBoothSystems, type BoothSystem, type BoothSystemVariant } from '@/hooks/useBoothSystems';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

const VARIANT_TYPES = [
  { value: 'inline', label: 'Inline' },
  { value: 'island', label: 'Island' },
  { value: 'l-shape', label: 'L-Shape' },
  { value: 'u-shape', label: 'U-Shape' },
  { value: 'peninsula', label: 'Peninsula' },
  { value: 'custom', label: 'Custom' },
];

function VariantTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'island': return <Box className="h-4 w-4" />;
    case 'l-shape': return <Layers className="h-4 w-4" />;
    default: return <Building2 className="h-4 w-4" />;
  }
}

export default function BoothSystemsLibrary() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [isAdmin, setIsAdmin] = useState(false);
  const { systems, isLoading, createSystem, updateSystem, deleteSystem, addVariant, deleteVariant } =
    useBoothSystems(organization?.id);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  // Add variant dialog
  const [showAddVariant, setShowAddVariant] = useState<string | null>(null);
  const [variantName, setVariantName] = useState('');
  const [variantType, setVariantType] = useState('inline');
  const [variantDims, setVariantDims] = useState('');

  // Edit system
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
    };
    check();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createSystem(newName.trim(), newDesc.trim());
    if (id) {
      setShowCreateDialog(false);
      setNewName('');
      setNewDesc('');
      setExpandedSystem(id);
    }
  };

  const handleAddVariant = async () => {
    if (!showAddVariant || !variantName.trim()) return;
    await addVariant(showAddVariant, variantName.trim(), variantType, variantDims.trim(), {});
    setShowAddVariant(null);
    setVariantName('');
    setVariantType('inline');
    setVariantDims('');
  };

  const handleSaveEdit = async (systemId: string) => {
    await updateSystem(systemId, { name: editName, description: editDesc });
    setEditingSystem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate('/booths')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Booth Catalog
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BookTemplate className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground font-heading">
                Booth System Library
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" /> New System
              </Button>
            )}
            <ThemeToggle />
            <div className="cursor-pointer" onClick={() => navigate('/org/transperfect')}>
              <BrandHubLogo size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create master booth structures and reuse them across events. Each system supports
            multiple size variants — swap graphics and messaging per division while maintaining
            consistent structural branding.
          </p>
        </div>
      </div>

      <Separator className="mx-6 max-w-7xl" />

      {/* Systems list */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : systems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookTemplate className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No booth systems yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Create a master booth system to start reusing designs across multiple events and divisions.
              </p>
              {isAdmin && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create First System
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {systems.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                isExpanded={expandedSystem === system.id}
                isEditing={editingSystem === system.id}
                editName={editName}
                editDesc={editDesc}
                isAdmin={isAdmin}
                onToggle={() => setExpandedSystem(expandedSystem === system.id ? null : system.id)}
                onStartEdit={() => { setEditingSystem(system.id); setEditName(system.name); setEditDesc(system.description); }}
                onSaveEdit={() => handleSaveEdit(system.id)}
                onCancelEdit={() => setEditingSystem(null)}
                onEditNameChange={setEditName}
                onEditDescChange={setEditDesc}
                onDelete={() => deleteSystem(system.id)}
                onAddVariant={() => setShowAddVariant(system.id)}
                onDeleteVariant={(vId) => deleteVariant(vId)}
                onNavigateToMapper={(variant) => {
                  navigate(`/booths/system-preview?systemId=${system.id}&variantId=${variant.id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create System Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Booth System</DialogTitle>
            <DialogDescription>
              Create a master booth system that can be reused across events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">System Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., TransPerfect Standard Booth Kit"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What booth configurations does this system cover?"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create System</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Variant Dialog */}
      <Dialog open={!!showAddVariant} onOpenChange={() => setShowAddVariant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Booth Variant</DialogTitle>
            <DialogDescription>
              Define a new size variant for this system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Variant Name</label>
              <Input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g., 20×20 Island"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Booth Type</label>
                <Select value={variantType} onValueChange={setVariantType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VARIANT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Dimensions</label>
                <Input
                  value={variantDims}
                  onChange={(e) => setVariantDims(e.target.value)}
                  placeholder="e.g., 20' × 20'"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddVariant(null)}>Cancel</Button>
              <Button onClick={handleAddVariant} disabled={!variantName.trim()}>Add Variant</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── System Card ── */

interface SystemCardProps {
  system: BoothSystem;
  isExpanded: boolean;
  isEditing: boolean;
  editName: string;
  editDesc: string;
  isAdmin: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (v: string) => void;
  onEditDescChange: (v: string) => void;
  onDelete: () => void;
  onAddVariant: () => void;
  onDeleteVariant: (id: string) => void;
  onNavigateToMapper: (variant: BoothSystemVariant) => void;
}

function SystemCard({
  system, isExpanded, isEditing, editName, editDesc, isAdmin,
  onToggle, onStartEdit, onSaveEdit, onCancelEdit,
  onEditNameChange, onEditDescChange, onDelete, onAddVariant, onDeleteVariant,
  onNavigateToMapper,
}: SystemCardProps) {
  return (
    <Card className={cn(
      'transition-all',
      isExpanded && 'ring-1 ring-primary/20'
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onToggle} className="flex items-center gap-3 flex-1 text-left min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookTemplate className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  className="h-7 text-sm font-semibold"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <h3 className="text-sm font-semibold text-foreground truncate">{system.name}</h3>
              )}
              {isEditing ? (
                <Input
                  value={editDesc}
                  onChange={(e) => onEditDescChange(e.target.value)}
                  className="h-6 text-xs mt-1"
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Description..."
                />
              ) : (
                <p className="text-xs text-muted-foreground truncate">{system.description || 'No description'}</p>
              )}
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px]">
              {system.variants.length} variant{system.variants.length !== 1 ? 's' : ''}
            </Badge>
            {isAdmin && !isEditing && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onStartEdit}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={onSaveEdit}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <ChevronRight className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )} />
          </div>
        </div>

        {/* Expanded: Variants */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border">
            {system.variants.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No variants yet. Add your first booth size configuration.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {system.variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    isAdmin={isAdmin}
                    onOpen={() => onNavigateToMapper(variant)}
                    onDelete={() => onDeleteVariant(variant.id)}
                  />
                ))}
              </div>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5 text-xs w-full"
                onClick={onAddVariant}
              >
                <Plus className="h-3.5 w-3.5" /> Add Variant
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Variant Card ── */

function VariantCard({
  variant, isAdmin, onOpen, onDelete,
}: {
  variant: BoothSystemVariant;
  isAdmin: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const hasSnapshot = Object.keys(variant.snapshotData).length > 0;

  return (
    <Card className="group hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer" onClick={onOpen}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
            <VariantTypeIcon type={variant.variantType} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">{variant.variantName}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="text-[9px] py-0 px-1">
                {VARIANT_TYPES.find(t => t.value === variant.variantType)?.label || variant.variantType}
              </Badge>
              {variant.dimensions && (
                <span className="text-[9px] text-muted-foreground">{variant.dimensions}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {hasSnapshot ? (
                <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30 py-0 px-1.5">
                  <Save className="h-2.5 w-2.5 mr-0.5" /> Snapshot saved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-muted-foreground">
                  Empty — open to configure
                </Badge>
              )}
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="ghost" size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
