/**
 * Generated Assets Gallery
 * Display and manage AI-generated assets history
 */

import { useState } from 'react';
import { 
  Image, Download, Trash2, Star, Check, RefreshCw, 
  ExternalLink, Info, Filter, Grid3X3, List 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import type { GeneratedAsset } from '@/types/creativeStudio';

interface GeneratedAssetsGalleryProps {
  assets: GeneratedAsset[];
  isLoading: boolean;
  onRate: (assetId: string, rating: number) => Promise<boolean>;
  onApprove: (assetId: string, approve: boolean) => Promise<boolean>;
  onDelete: (assetId: string) => Promise<boolean>;
  onRefresh: () => void;
}

export const GeneratedAssetsGallery = ({
  assets,
  isLoading,
  onRate,
  onApprove,
  onDelete,
  onRefresh
}: GeneratedAssetsGalleryProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  const filteredAssets = assets.filter(a => {
    if (filterApproved === 'approved') return a.is_approved;
    if (filterApproved === 'pending') return !a.is_approved;
    return true;
  });

  const downloadAsset = (asset: GeneratedAsset) => {
    if (asset.image_url) {
      const link = document.createElement('a');
      link.href = asset.image_url;
      link.download = `${asset.name.slice(0, 30).replace(/\s+/g, '-')}-${asset.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="aspect-square">
            <Skeleton className="w-full h-full rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium mb-2">No generated assets yet</h3>
        <p className="text-sm text-muted-foreground">
          Your AI-generated images will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterApproved} onValueChange={(v) => setFilterApproved(v as 'all' | 'approved' | 'pending')}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({assets.length})</SelectItem>
              <SelectItem value="approved">Approved ({assets.filter(a => a.is_approved).length})</SelectItem>
              <SelectItem value="pending">Pending ({assets.filter(a => !a.is_approved).length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="border rounded-md flex">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className="group relative overflow-hidden cursor-pointer"
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="aspect-square bg-muted">
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                <div className="p-3 w-full">
                  <p className="text-white text-sm font-medium line-clamp-1">{asset.name}</p>
                  <p className="text-white/70 text-xs">
                    {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Status badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {asset.is_approved && (
                  <Badge className="bg-green-500 text-white text-[10px] h-5">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
                {asset.rating && (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-0.5">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {asset.rating}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className="flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{asset.category}</span>
                  <span>•</span>
                  <span>{asset.aspect_ratio}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {asset.is_approved && (
                  <Badge className="bg-green-500 text-white text-xs">Approved</Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                  e.stopPropagation();
                  downloadAsset(asset);
                }}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Asset Detail Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedAsset.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedAsset.image_url ? (
                    <img
                      src={selectedAsset.image_url}
                      alt={selectedAsset.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium capitalize">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Aspect Ratio</p>
                    <p className="font-medium">{selectedAsset.aspect_ratio}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-medium">{selectedAsset.model_used}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(selectedAsset.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Prompt Used
                  </p>
                  <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selectedAsset.prompt_used}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">Rating:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRate(selectedAsset.id, star)}
                      >
                        <Star 
                          className={`h-5 w-5 ${
                            selectedAsset.rating && star <= selectedAsset.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant={selectedAsset.is_approved ? "secondary" : "default"}
                    onClick={() => onApprove(selectedAsset.id, !selectedAsset.is_approved)}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {selectedAsset.is_approved ? 'Remove Approval' : 'Approve'}
                  </Button>
                  <Button variant="outline" onClick={() => downloadAsset(selectedAsset)} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {selectedAsset.image_url && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(selectedAsset.image_url!, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2 ml-auto">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this generated image. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          onDelete(selectedAsset.id);
                          setSelectedAsset(null);
                        }}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
