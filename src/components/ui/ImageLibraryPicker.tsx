/**
 * ImageLibraryPicker Component
 * Modal dialog to browse and select images from the organization image library
 * Can also upload new images directly
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useImageLibrary,
  OrganizationImage,
  ImageCategory,
  IMAGE_CATEGORIES,
} from '@/hooks/useImageLibrary';
import { useProjectImages } from '@/hooks/useProjectImages';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Check,
  Loader2,
  FolderOpen,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLibraryPickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
  defaultCategory?: ImageCategory;
  allowUpload?: boolean;
  className?: string;
}

export const ImageLibraryPicker: React.FC<ImageLibraryPickerProps> = ({
  onSelect,
  trigger,
  defaultCategory = 'General',
  allowUpload = true,
  className,
}) => {
  const { organization } = useOrganization();
  const {
    images,
    isLoading,
    isUploading,
    fetchImages,
    uploadImage,
    deleteImage,
  } = useImageLibrary();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | 'All'>('All');
  const [selectedImage, setSelectedImage] = useState<OrganizationImage | null>(null);
  const [uploadCategory, setUploadCategory] = useState<ImageCategory>(defaultCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectImages = useProjectImages(searchTerm);

  useEffect(() => {
    if (open && organization?.id) {
      fetchImages();
    }
  }, [open, organization?.id, fetchImages]);

  const filteredImages = images.filter((img) => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || img.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    const result = await uploadImage(file, uploadCategory);
    if (result) {
      setSelectedImage(result);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmSelection = () => {
    if (selectedImage) {
      onSelect(selectedImage.public_url);
      setOpen(false);
      setSelectedImage(null);
    }
  };

  const handleDeleteImage = async (img: OrganizationImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${img.name}"?`)) {
      await deleteImage(img);
      if (selectedImage?.id === img.id) {
        setSelectedImage(null);
      }
    }
  };

  const categoryCounts = IMAGE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = images.filter((img) => img.category === cat).length;
    return acc;
  }, {} as Record<ImageCategory, number>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className={cn('gap-2', className)}
            onClick={(e) => e.stopPropagation()}
          >
            <FolderOpen className="h-4 w-4" />
            Choose from Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Image Library
          </DialogTitle>
          <DialogDescription>
            Select an image from your organization's library or upload a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="browse" className="flex-1 flex flex-col min-h-0">
          <TabsList className={cn('grid w-full', allowUpload ? 'grid-cols-3' : 'grid-cols-2')}>
            <TabsTrigger value="browse">Org Library</TabsTrigger>
            <TabsTrigger value="project">Project Assets</TabsTrigger>
            {allowUpload && <TabsTrigger value="upload">Upload New</TabsTrigger>}
          </TabsList>

          <TabsContent value="browse" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as ImageCategory | 'All')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {IMAGE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat} ({categoryCounts[cat]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Grid */}
            <ScrollArea className="flex-1 -mx-2 px-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm || selectedCategory !== 'All'
                      ? 'No images match your filters'
                      : 'No images in library yet'}
                  </p>
                  {allowUpload && (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => {
                        const tab = document.querySelector('[data-state="inactive"][value="upload"]');
                        if (tab) (tab as HTMLButtonElement).click();
                      }}
                    >
                      Upload your first image
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        'relative group aspect-square rounded-lg overflow-hidden border-2 transition-all',
                        selectedImage?.id === img.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <img
                        src={img.public_url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedImage?.id === img.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{img.name}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {img.category}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => handleDeleteImage(img, e)}
                        className="absolute top-1 right-1 p-1 bg-destructive/80 text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Selected Preview & Confirm */}
            {selectedImage && (
              <div className="mt-4 pt-4 border-t flex items-center gap-4">
                <img
                  src={selectedImage.public_url}
                  alt={selectedImage.name}
                  className="h-16 w-16 rounded object-cover border"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedImage.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedImage.category}
                  </Badge>
                </div>
                <Button onClick={handleConfirmSelection}>
                  <Check className="h-4 w-4 mr-2" />
                  Use This Image
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="project" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search project images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary" className="h-10 px-3 flex items-center">
                {projectImages.length} assets
              </Badge>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
              {projectImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No project images match your search' : 'No project images found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {projectImages.map((img) => (
                    <button
                      key={img.path}
                      onClick={() => {
                        onSelect(img.url);
                        setOpen(false);
                        setSelectedImage(null);
                      }}
                      className={cn(
                        'relative group aspect-square rounded-lg overflow-hidden border-2 transition-all',
                        'border-border hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      )}
                      title={img.name}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{img.name}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          Project
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {allowUpload && (
            <TabsContent value="upload" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={uploadCategory}
                    onValueChange={(v) => setUploadCategory(v as ImageCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image File</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                      'hover:border-primary/50 hover:bg-primary/5',
                      isUploading && 'pointer-events-none opacity-50'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, WEBP up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedImage && (
                  <div className="p-4 border rounded-lg flex items-center gap-4 bg-muted/50">
                    <img
                      src={selectedImage.public_url}
                      alt={selectedImage.name}
                      className="h-16 w-16 rounded object-cover border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedImage.name}</p>
                      <p className="text-sm text-muted-foreground">Just uploaded</p>
                    </div>
                    <Button onClick={handleConfirmSelection}>
                      <Check className="h-4 w-4 mr-2" />
                      Use This Image
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
