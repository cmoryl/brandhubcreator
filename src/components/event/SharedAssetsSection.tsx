import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Download, ExternalLink, Trash2, Image, FileText, 
  Palette, Type, Layout, Share2, Copy, Check, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';

export interface SharedAsset {
  id: string;
  name: string;
  type: 'logo' | 'pattern' | 'template' | 'typography' | 'color-palette' | 'icon' | 'guideline' | 'other';
  url?: string;
  previewUrl?: string;
  description?: string;
  fileType?: string;
  isRequired?: boolean; // Must be used by all regional events
  tags?: string[];
}

interface SharedAssetsSectionProps {
  assets: SharedAsset[];
  onAssetsChange?: (assets: SharedAsset[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const ASSET_TYPES = [
  { value: 'logo', label: 'Logo', icon: Image },
  { value: 'pattern', label: 'Pattern', icon: Layout },
  { value: 'template', label: 'Template', icon: FileText },
  { value: 'typography', label: 'Typography', icon: Type },
  { value: 'color-palette', label: 'Color Palette', icon: Palette },
  { value: 'icon', label: 'Icon', icon: Image },
  { value: 'guideline', label: 'Guideline', icon: FileText },
  { value: 'other', label: 'Other', icon: FolderOpen },
];

const getTypeIcon = (type: SharedAsset['type']) => {
  const found = ASSET_TYPES.find(t => t.value === type);
  return found?.icon || FolderOpen;
};

const getTypeColor = (type: SharedAsset['type']) => {
  const colors: Record<string, string> = {
    'logo': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'pattern': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'template': 'bg-green-500/10 text-green-600 border-green-500/20',
    'typography': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'color-palette': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    'icon': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    'guideline': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'other': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  };
  return colors[type] || colors.other;
};

export const SharedAssetsSection = ({
  assets,
  onAssetsChange,
  isEditable = false,
  subtitle,
}: SharedAssetsSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState<Partial<SharedAsset>>({
    type: 'logo',
    isRequired: false,
  });

  const handleAdd = () => {
    if (!newAsset.name || !onAssetsChange) return;

    const asset: SharedAsset = {
      id: crypto.randomUUID(),
      name: newAsset.name,
      type: newAsset.type as SharedAsset['type'] || 'other',
      url: newAsset.url,
      previewUrl: newAsset.previewUrl,
      description: newAsset.description,
      fileType: newAsset.fileType,
      isRequired: newAsset.isRequired,
      tags: newAsset.tags,
    };

    onAssetsChange([...assets, asset]);
    setNewAsset({ type: 'logo', isRequired: false });
    setIsDialogOpen(false);
    toast.success('Shared asset added');
  };

  const handleDelete = (id: string) => {
    if (!onAssetsChange) return;
    onAssetsChange(assets.filter(a => a.id !== id));
    toast.success('Asset removed');
  };

  const handleCopyUrl = async (asset: SharedAsset) => {
    const url = asset.url || asset.previewUrl;
    if (!url) return;
    
    await navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group assets by type
  const groupedAssets = ASSET_TYPES.reduce((acc, type) => {
    acc[type.value] = assets.filter(a => a.type === type.value);
    return acc;
  }, {} as Record<string, SharedAsset[]>);

  const filteredAssets = activeTab === 'all' 
    ? assets 
    : assets.filter(a => a.type === activeTab);

  const requiredCount = assets.filter(a => a.isRequired).length;

  return (
    <section className="space-y-6">
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Shared Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Asset Name</Label>
                    <Input
                      value={newAsset.name || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="e.g., GlobalLink NEXT Primary Logo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newAsset.type}
                      onValueChange={(value) => setNewAsset({ ...newAsset, type: value as SharedAsset['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
          {subtitle || "Centralized assets that regional events inherit and reference"}
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
        </p>
      </div>

      {/* Filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All ({assets.length})
          </TabsTrigger>
          {ASSET_TYPES.map((type) => {
            const count = groupedAssets[type.value]?.length || 0;
            if (count === 0) return null;
            return (
              <TabsTrigger 
                key={type.value} 
                value={type.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {type.label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Assets grid */}
      {filteredAssets.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const TypeIcon = getTypeIcon(asset.type);
            const isCopied = copiedId === asset.id;

            return (
              <Card key={asset.id} className="group overflow-hidden">
                {/* Preview area */}
                <div className="relative h-32 bg-muted/50 flex items-center justify-center overflow-hidden">
                  {asset.previewUrl ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <TypeIcon className="h-12 w-12 text-muted-foreground/30" />
                  )}
                  
                  {/* Required badge */}
                  {asset.isRequired && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                      Required
                    </Badge>
                  )}

                  {/* Type badge */}
                  <Badge 
                    variant="outline" 
                    className={`absolute top-2 right-2 ${getTypeColor(asset.type)}`}
                  >
                    {ASSET_TYPES.find(t => t.value === asset.type)?.label}
                  </Badge>

                  {/* Hover actions */}
                  {isEditable && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleCopyUrl(asset)}
                        disabled={!asset.url && !asset.previewUrl}
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium line-clamp-1">{asset.name}</h3>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {asset.url && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5"
                          onClick={() => window.open(asset.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5"
                          asChild
                        >
                          <a href={asset.url} download>
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick stats */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
          {ASSET_TYPES.map((type) => {
            const count = groupedAssets[type.value]?.length || 0;
            if (count === 0) return null;
            return (
              <div key={type.value} className="flex items-center gap-1.5">
                <type.icon className="h-3 w-3" />
                <span>{count} {type.label.toLowerCase()}{count !== 1 ? 's' : ''}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
