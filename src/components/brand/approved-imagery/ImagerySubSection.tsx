import { useState } from 'react';
import { Search, Trash2, Edit2, Check, X, ImageIcon, ZoomIn, FolderOpen, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ApprovedImagerySubSection } from '@/types/brand';
import { ImageryPreviewDialog } from './ImageryPreviewDialog';

interface ImagerySubSectionProps {
  section: ApprovedImagerySubSection;
  canEdit: boolean;
  onSearchClick: () => void;
  onDropboxClick: () => void;
  onRemoveImage: (imageId: string) => void;
  onRemoveSection: () => void;
  onRename: (newName: string) => void;
}

export const ImagerySubSection = ({
  section,
  canEdit,
  onSearchClick,
  onDropboxClick,
  onRemoveImage,
  onRemoveSection,
  onRename,
}: ImagerySubSectionProps) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [previewImage, setPreviewImage] = useState<{
    id: string; url: string; thumbnailUrl?: string; title: string; source?: string; category?: string;
  } | null>(null);

  const handleSaveRename = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setEditing(false);
  };

  const dropboxCount = section.images.filter(img => img.source === 'dropbox').length;
  const shutterstockCount = section.images.filter(img => img.source === 'shutterstock').length;

  return (
    <AccordionItem value={section.id} className="border rounded-lg bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 flex-1 text-left">
          {editing ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-7 w-48 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveRename}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="font-medium text-foreground">{section.name}</span>
              <Badge variant="secondary" className="text-xs">{section.images.length}</Badge>
              {section.dropboxFolderPath && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <FolderOpen className="h-2.5 w-2.5" />
                      Dropbox
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {section.dropboxFolderPath}
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
        {canEdit && !editing && (
          <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditName(section.name); setEditing(true); }}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDropboxClick}>
                  <FolderOpen className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Import from Dropbox</TooltipContent>
            </Tooltip>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSearchClick}>
              <Search className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{section.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the category and all {section.images.length} approved images within it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemoveSection}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {section.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="h-8 w-8 opacity-30 mb-2" />
            <p className="text-sm">No images in this category</p>
            {canEdit && (
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={onSearchClick}>
                  <Search className="h-3 w-3 mr-1" /> Shutterstock
                </Button>
                <Button variant="outline" size="sm" onClick={onDropboxClick}>
                  <FolderOpen className="h-3 w-3 mr-1" /> Dropbox
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {section.images.map((image) => (
              <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30">
                <div
                  className="cursor-pointer relative"
                  onClick={() => setPreviewImage({
                    id: image.id,
                    url: image.url,
                    thumbnailUrl: image.thumbnailUrl,
                    title: image.title,
                    source: image.source,
                    category: image.category,
                  })}
                >
                  <img
                    src={image.thumbnailUrl || image.url}
                    alt={image.title}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
                {/* Top-right action buttons */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {isAuthenticated && (
                    <a
                      href={image.url}
                      download={image.title || 'image'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 flex items-center justify-center rounded bg-background/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
                      title="Download image"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  )}
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => { e.stopPropagation(); onRemoveImage(image.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="px-2 py-1.5 flex items-center gap-1">
                  {image.source === 'dropbox' && (
                    <FolderOpen className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                  )}
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{image.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <ImageryPreviewDialog
          open={!!previewImage}
          onOpenChange={(open) => !open && setPreviewImage(null)}
          image={previewImage}
          canDownload={canEdit}
        />
      </AccordionContent>
    </AccordionItem>
  );
};
