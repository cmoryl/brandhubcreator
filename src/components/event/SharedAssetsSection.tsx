import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, Download, ExternalLink, Trash2, Image, FileText, 
  Palette, Type, Layout, Share2, Copy, Check, FolderOpen, Upload, Loader2,
  Monitor, Printer, Briefcase, ChevronDown, ChevronRight,
  Globe, Mail, Smartphone, Film, Megaphone, BookOpen,
  PanelTop, Tag, ShoppingBag, MapPin, Ticket, Presentation,
  Newspaper, Flag, Star, ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { cn } from '@/lib/utils';

export interface SharedAsset {
  id: string;
  name: string;
  type: string;
  category?: string;
  url?: string;
  previewUrl?: string;
  description?: string;
  fileType?: string;
  isRequired?: boolean;
  tags?: string[];
}

interface SharedAssetsSectionProps {
  assets: SharedAsset[];
  onAssetsChange?: (assets: SharedAsset[]) => void;
  isEditable?: boolean;
  subtitle?: string;
  eventId?: string;
}

// ── Category / Sub-category taxonomy ──────────────────────────────
interface AssetSubCategory {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface AssetCategoryGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  subCategories: AssetSubCategory[];
}

const ASSET_CATEGORY_GROUPS: AssetCategoryGroup[] = [
  {
    id: 'brand',
    label: 'Brand Identity',
    icon: Star,
    description: 'Core brand elements shared across events',
    subCategories: [
      { value: 'logo', label: 'Logos', icon: Image },
      { value: 'color-palette', label: 'Color Palettes', icon: Palette },
      { value: 'typography', label: 'Typography', icon: Type },
      { value: 'icon', label: 'Icons & Symbols', icon: Image },
      { value: 'pattern', label: 'Patterns & Textures', icon: Layout },
      { value: 'guideline', label: 'Brand Guidelines', icon: BookOpen },
    ],
  },
  {
    id: 'digital',
    label: 'Digital Assets',
    icon: Monitor,
    description: 'Web, social, email & screen-based materials',
    subCategories: [
      { value: 'social-media', label: 'Social Media Graphics', icon: Megaphone },
      { value: 'email-template', label: 'Email Templates', icon: Mail },
      { value: 'web-banner', label: 'Web Banners & Ads', icon: PanelTop },
      { value: 'presentation', label: 'Presentations & Decks', icon: Presentation },
      { value: 'video', label: 'Video & Motion', icon: Film },
      { value: 'mobile-asset', label: 'Mobile & App Assets', icon: Smartphone },
      { value: 'digital-signage', label: 'Digital Signage', icon: Monitor },
      { value: 'website-asset', label: 'Website Assets', icon: Globe },
    ],
  },
  {
    id: 'print',
    label: 'Print & Physical',
    icon: Printer,
    description: 'Printed materials, signage & physical assets',
    subCategories: [
      { value: 'brochure', label: 'Brochures & Flyers', icon: Newspaper },
      { value: 'poster', label: 'Posters & Banners', icon: Flag },
      { value: 'business-card', label: 'Business Cards', icon: Tag },
      { value: 'stationery', label: 'Stationery & Letterhead', icon: FileText },
      { value: 'signage', label: 'Event Signage', icon: MapPin },
      { value: 'badge-lanyard', label: 'Badges & Lanyards', icon: Ticket },
      { value: 'merchandise', label: 'Merchandise & Swag', icon: ShoppingBag },
      { value: 'print-ad', label: 'Print Advertisements', icon: Layout },
      { value: 'packaging', label: 'Packaging & Labels', icon: Tag },
    ],
  },
  {
    id: 'production',
    label: 'Production & Templates',
    icon: Briefcase,
    description: 'Source files, templates & production-ready assets',
    subCategories: [
      { value: 'template', label: 'Design Templates', icon: FileText },
      { value: 'source-file', label: 'Source Files (AI/PSD/INDD)', icon: FolderOpen },
      { value: 'photography', label: 'Photography', icon: Image },
      { value: 'illustration', label: 'Illustrations', icon: Image },
      { value: 'infographic', label: 'Infographics', icon: Layout },
      { value: 'other', label: 'Other', icon: FolderOpen },
    ],
  },
];

// Flat lookup helpers
const ALL_SUB_CATEGORIES = ASSET_CATEGORY_GROUPS.flatMap(g =>
  g.subCategories.map(s => ({ ...s, groupId: g.id, groupLabel: g.label }))
);

const getSubCatMeta = (type: string) =>
  ALL_SUB_CATEGORIES.find(s => s.value === type) || { value: type, label: type, icon: FolderOpen, groupId: 'production', groupLabel: 'Other' };

const TYPE_COLORS: Record<string, string> = {
  brand: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  digital: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  print: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  production: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export const SharedAssetsSection = ({
  assets,
  onAssetsChange,
  isEditable = false,
  subtitle,
  eventId,
}: SharedAssetsSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingAssetId, setUploadingAssetId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(ASSET_CATEGORY_GROUPS.map(g => g.id)));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetAssetId, setTargetAssetId] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState<Partial<SharedAsset>>({
    type: 'logo',
    category: 'brand',
    isRequired: false,
  });

  const { uploadFile } = useStorageUpload({
    entityType: 'event',
    entityId: eventId || '',
  });

  const handleAdd = () => {
    if (!newAsset.name || !onAssetsChange) return;

    const asset: SharedAsset = {
      id: crypto.randomUUID(),
      name: newAsset.name,
      type: newAsset.type || 'other',
      category: newAsset.category || getSubCatMeta(newAsset.type || 'other').groupId,
      url: newAsset.url,
      previewUrl: newAsset.previewUrl,
      description: newAsset.description,
      fileType: newAsset.fileType,
      isRequired: newAsset.isRequired,
      tags: newAsset.tags,
    };

    onAssetsChange([...assets, asset]);
    setNewAsset({ type: 'logo', category: 'brand', isRequired: false });
    setIsDialogOpen(false);
    toast.success('Shared asset added');
  };

  const handleDelete = (id: string) => {
    if (!onAssetsChange) return;
    onAssetsChange(assets.filter(a => a.id !== id));
    toast.success('Asset removed');
  };

  const handleMoveAsset = (id: string, newCategory: string, newType: string) => {
    if (!onAssetsChange) return;
    const updated = assets.map(a =>
      a.id === id ? { ...a, category: newCategory, type: newType } : a
    );
    onAssetsChange(updated);
    const subMeta = getSubCatMeta(newType);
    const groupMeta = ASSET_CATEGORY_GROUPS.find(g => g.id === newCategory);
    toast.success(`Moved to ${groupMeta?.label || newCategory} → ${subMeta.label}`);
  };

  const handleCopyUrl = async (asset: SharedAsset) => {
    const url = asset.url || asset.previewUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateCardImage = (assetId: string) => {
    setTargetAssetId(assetId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAssetId || !onAssetsChange || !eventId) return;

    setUploadingAssetId(targetAssetId);
    try {
      const result = await uploadFile(file, 'asset', `shared-asset-${targetAssetId}`);
      if (result?.url) {
        const updated = assets.map(a =>
          a.id === targetAssetId ? { ...a, previewUrl: result.url } : a
        );
        onAssetsChange(updated);
        toast.success('Card image updated');
      }
    } catch (err) {
      console.error('Failed to upload card image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAssetId(null);
      setTargetAssetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Resolve each asset's group (backward compat: use `category` if set, else infer from `type`)
  const resolveGroup = (a: SharedAsset) => a.category || getSubCatMeta(a.type).groupId;

  // Group assets
  const groupedData = ASSET_CATEGORY_GROUPS.map(group => {
    const items = assets.filter(a => resolveGroup(a) === group.id);
    return { group, items };
  }).filter(g => activeGroupFilter === 'all' || g.group.id === activeGroupFilter);

  const requiredCount = assets.filter(a => a.isRequired).length;

  // Handle category group change in dialog
  const handleGroupChange = (groupId: string) => {
    const group = ASSET_CATEGORY_GROUPS.find(g => g.id === groupId);
    const firstSub = group?.subCategories[0]?.value || 'other';
    setNewAsset(prev => ({ ...prev, category: groupId, type: firstSub }));
  };

  return (
    <section className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
            Shared Asset Library
          </h2>
          {isEditable && onAssetsChange && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Shared Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Asset Name</Label>
                    <Input
                      value={newAsset.name || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="e.g., Event Primary Logo Pack"
                    />
                  </div>

                  {/* Category group */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newAsset.category || 'brand'} onValueChange={handleGroupChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ASSET_CATEGORY_GROUPS.map(g => (
                          <SelectItem key={g.id} value={g.id}>
                            <span className="flex items-center gap-2">
                              <g.icon className="h-3.5 w-3.5" />
                              {g.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sub-category type */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newAsset.type}
                      onValueChange={(value) => setNewAsset({ ...newAsset, type: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(ASSET_CATEGORY_GROUPS.find(g => g.id === (newAsset.category || 'brand'))?.subCategories || []).map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="flex items-center gap-2">
                              <s.icon className="h-3.5 w-3.5" />
                              {s.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preview/Download URL</Label>
                    <Input
                      value={newAsset.url || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value, previewUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newAsset.description || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                      placeholder="Usage guidelines..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRequired"
                      checked={newAsset.isRequired || false}
                      onChange={(e) => setNewAsset({ ...newAsset, isRequired: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isRequired" className="text-sm font-normal cursor-pointer">
                      Required for all regional events
                    </Label>
                  </div>
                  <Button onClick={handleAdd} disabled={!newAsset.name} className="w-full">
                    Add Asset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          {subtitle || 'Centralized assets that regional events inherit and reference'}
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-lg border border-primary/20">
        <Share2 className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{assets.length} shared assets</span>
          {requiredCount > 0 && (
            <> • <span className="text-primary">{requiredCount} required</span> for all regions</>
          )}
          {' • '}
          {ASSET_CATEGORY_GROUPS.map(g => {
            const c = assets.filter(a => resolveGroup(a) === g.id).length;
            return c > 0 ? `${c} ${g.label.toLowerCase()}` : null;
          }).filter(Boolean).join(', ')}
        </p>
      </div>

      {/* Category group filter pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeGroupFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveGroupFilter('all')}
          className="gap-1.5 h-8 text-xs"
        >
          All ({assets.length})
        </Button>
        {ASSET_CATEGORY_GROUPS.map(g => {
          const count = assets.filter(a => resolveGroup(a) === g.id).length;
          return (
            <Button
              key={g.id}
              size="sm"
              variant={activeGroupFilter === g.id ? 'default' : 'outline'}
              onClick={() => setActiveGroupFilter(g.id)}
              className="gap-1.5 h-8 text-xs"
            >
              <g.icon className="h-3.5 w-3.5" />
              {g.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Grouped collapsible sections */}
      {groupedData.map(({ group, items }) => {
        const isExpanded = expandedGroups.has(group.id);
        const colorClass = TYPE_COLORS[group.id] || TYPE_COLORS.production;

        // Group items by sub-category
        const subGrouped = group.subCategories
          .map(sub => ({
            sub,
            subItems: items.filter(a => a.type === sub.value),
          }))
          .filter(sg => sg.subItems.length > 0);

        // Items with unknown sub-types
        const knownTypes = new Set(group.subCategories.map(s => s.value));
        const uncategorized = items.filter(a => !knownTypes.has(a.type));

        return (
          <Collapsible key={group.id} open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:bg-muted/50",
                colorClass
              )}>
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <group.icon className="h-4.5 w-4.5" />
                <div className="flex-1 text-left">
                  <span className="font-semibold text-sm">{group.label}</span>
                  <span className="text-xs ml-2 opacity-70">{group.description}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2 space-y-4 pl-2">
              {items.length === 0 ? (
                <div className="py-6 text-center">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No {group.label.toLowerCase()} assets yet</p>
                </div>
              ) : (
                <>
                  {subGrouped.map(({ sub, subItems }) => (
                    <div key={sub.value} className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <sub.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{sub.label}</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{subItems.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subItems.map(asset => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            isEditable={isEditable}
                            isUploading={uploadingAssetId === asset.id}
                            isCopied={copiedId === asset.id}
                            colorClass={colorClass}
                            eventId={eventId}
                            onCopy={handleCopyUrl}
                            onDelete={handleDelete}
                            onUploadImage={handleUpdateCardImage}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {uncategorized.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Other</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{uncategorized.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {uncategorized.map(asset => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            isEditable={isEditable}
                            isUploading={uploadingAssetId === asset.id}
                            isCopied={copiedId === asset.id}
                            colorClass={colorClass}
                            eventId={eventId}
                            onCopy={handleCopyUrl}
                            onDelete={handleDelete}
                            onUploadImage={handleUpdateCardImage}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {assets.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No shared assets yet</p>
            {isEditable && (
              <p className="text-sm text-muted-foreground mt-1">
                Add logos, templates, and guidelines for regional events to use
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
          {ASSET_CATEGORY_GROUPS.map(g => {
            const count = assets.filter(a => resolveGroup(a) === g.id).length;
            if (count === 0) return null;
            return (
              <div key={g.id} className="flex items-center gap-1.5">
                <g.icon className="h-3 w-3" />
                <span>{count} {g.label.toLowerCase()}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ── Asset Card (extracted for clarity) ─────────────────────────────
interface AssetCardProps {
  asset: SharedAsset;
  isEditable: boolean;
  isUploading: boolean;
  isCopied: boolean;
  colorClass: string;
  eventId?: string;
  onCopy: (asset: SharedAsset) => void;
  onDelete: (id: string) => void;
  onUploadImage: (id: string) => void;
  onMove?: (id: string, newCategory: string, newType: string) => void;
}

const AssetCard = ({ asset, isEditable, isUploading, isCopied, colorClass, eventId, onCopy, onDelete, onUploadImage, onMove }: AssetCardProps) => {
  const meta = getSubCatMeta(asset.type);
  const TypeIcon = meta.icon;
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <Card className="group overflow-hidden">
      <div className="relative h-28 bg-muted/50 flex items-center justify-center overflow-hidden">
        {asset.previewUrl ? (
          <img src={asset.previewUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
        )}

        {asset.isRequired && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">Required</Badge>
        )}

        <Badge variant="outline" className={cn("absolute top-2 right-2 text-[10px]", colorClass)}>
          {meta.label}
        </Badge>

        {isEditable && !isUploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="icon" variant="secondary" title="Update card image" onClick={() => onUploadImage(asset.id)} disabled={!eventId}>
              <Upload className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary" onClick={() => onCopy(asset)} disabled={!asset.url && !asset.previewUrl}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            {onMove && (
              <Popover open={moveOpen} onOpenChange={setMoveOpen}>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="secondary" title="Move to another category">
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 max-h-80 overflow-y-auto" align="center" side="top">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs font-semibold text-muted-foreground">Move to…</p>
                  </div>
                  {ASSET_CATEGORY_GROUPS.map(group => (
                    <div key={group.id}>
                      <div className="px-3 py-1.5 bg-muted/50 flex items-center gap-2">
                        <group.icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</span>
                      </div>
                      {group.subCategories.map(sub => {
                        const isCurrentSpot = asset.type === sub.value && (asset.category || meta.groupId) === group.id;
                        return (
                          <button
                            key={`${group.id}-${sub.value}`}
                            disabled={isCurrentSpot}
                            onClick={() => {
                              onMove(asset.id, group.id, sub.value);
                              setMoveOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-1.5 text-left text-xs hover:bg-accent transition-colors",
                              isCurrentSpot && "opacity-40 cursor-not-allowed bg-accent/50"
                            )}
                          >
                            <sub.icon className="h-3 w-3 text-muted-foreground" />
                            <span>{sub.label}</span>
                            {isCurrentSpot && <Badge variant="outline" className="ml-auto text-[8px] h-4 px-1">Current</Badge>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            )}
            <Button size="icon" variant="destructive" onClick={() => onDelete(asset.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm line-clamp-1">{asset.name}</h3>
        {asset.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{asset.description}</p>
        )}
        {asset.url && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-7 text-xs" onClick={() => window.open(asset.url, '_blank')}>
              <ExternalLink className="h-3 w-3" /> View
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-7 text-xs" asChild>
              <a href={asset.url} download><Download className="h-3 w-3" /> Download</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
