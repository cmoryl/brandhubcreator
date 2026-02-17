/**
 * AdminImageLibrary
 * Full admin page for managing organization image library
 * Supports bulk uploads, category management, search/filter
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useImageLibrary,
  OrganizationImage,
  ImageCategory,
  IMAGE_CATEGORIES,
} from '@/hooks/useImageLibrary';
import { supabase } from '@/integrations/supabase/client';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  MoreVertical,
  FolderOpen,
  Loader2,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  List,
  RefreshCw,
  Download,
  Tag,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UploadProgress {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  thumbnailUrl?: string;
}

type ViewMode = 'grid-lg' | 'grid-md' | 'grid-sm' | 'list';

interface OrgOption {
  id: string;
  name: string;
}

export function AdminImageLibrary() {
  const {
    images,
    isLoading,
    isUploading,
    fetchImages,
    uploadImage,
    deleteImage,
    updateImageCategory,
  } = useImageLibrary();

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ImageCategory | 'All'>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-md');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<ImageCategory>('General');
  const [previewImage, setPreviewImage] = useState<OrganizationImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      if (data) {
        setOrganizations(data);
        if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0].id);
          fetchImages(data[0].id);
        }
      }
    };
    fetchOrgs();
  }, []);

  // Fetch images when org changes
  const handleOrgChange = useCallback((orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedImages(new Set());
    fetchImages(orgId);
  }, [fetchImages]);

  // Filter images
  const filteredImages = images.filter((img) => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || img.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Category counts
  const categoryCounts = IMAGE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = images.filter((img) => img.category === cat).length;
    return acc;
  }, {} as Record<ImageCategory, number>);

  // Process files for upload (shared between input and drag-drop)
  const processFilesForUpload = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Initialize upload queue with thumbnails
    const initialQueue: UploadProgress[] = imageFiles.map(file => ({
      fileName: file.name,
      status: 'pending',
      progress: 0,
      thumbnailUrl: URL.createObjectURL(file),
    }));
    setUploadQueue(initialQueue);
    setShowUploadProgress(true);

    // Process uploads sequentially with progress tracking
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      // Update status to uploading
      setUploadQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'uploading', progress: 50 } : item
      ));

      try {
        const result = await uploadImage(file, 'General', undefined, selectedOrgId || undefined);
        
        // Update status to success or error
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i 
            ? { ...item, status: result ? 'success' : 'error', progress: 100, error: result ? undefined : 'Upload failed' } 
            : item
        ));
      } catch (err) {
        setUploadQueue(prev => prev.map((item, idx) => 
          idx === i 
            ? { ...item, status: 'error', progress: 100, error: 'Upload failed' } 
            : item
        ));
      }
    }
  }, [selectedOrgId, uploadImage]);

  // Handle bulk file upload from input
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFilesForUpload(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedOrgId || isUploading) return;
    setIsDragging(true);
  }, [selectedOrgId, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragging(false);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!selectedOrgId || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    await processFilesForUpload(files);
  }, [selectedOrgId, isUploading, processFilesForUpload]);

  // Clear completed uploads after delay and revoke object URLs
  const clearCompletedUploads = useCallback(() => {
    const allDone = uploadQueue.every(u => u.status === 'success' || u.status === 'error');
    if (allDone && uploadQueue.length > 0) {
      setTimeout(() => {
        // Revoke object URLs to prevent memory leaks
        uploadQueue.forEach(item => {
          if (item.thumbnailUrl) {
            URL.revokeObjectURL(item.thumbnailUrl);
          }
        });
        setShowUploadProgress(false);
        setUploadQueue([]);
      }, 3000);
    }
  }, [uploadQueue]);

  useEffect(() => {
    clearCompletedUploads();
  }, [uploadQueue, clearCompletedUploads]);

  // Toggle image selection
  const toggleImageSelection = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  // Select all visible images
  const selectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map((img) => img.id)));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedImages.size} selected images?`)) return;

    for (const id of selectedImages) {
      const img = images.find((i) => i.id === id);
      if (img) {
        await deleteImage(img);
      }
    }
    setSelectedImages(new Set());
  };

  // Bulk category update
  const handleBulkCategoryUpdate = async () => {
    for (const id of selectedImages) {
      await updateImageCategory(id, bulkCategory);
    }
    setSelectedImages(new Set());
    setBulkCategoryDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Image Library
              </CardTitle>
              <CardDescription>
                Manage organization images for use across brand guides
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchImages(selectedOrgId)}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent 
          ref={dropZoneRef}
          className={cn(
            "space-y-4 relative transition-all",
            isDragging && "ring-2 ring-primary ring-offset-2 rounded-lg"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-lg flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-background/95 shadow-xl border-2 border-primary border-dashed rounded-xl px-8 py-6 flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-primary animate-bounce" />
                <p className="text-lg font-semibold text-primary">Drop images to upload</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, WEBP, GIF, SVG supported</p>
              </div>
            </div>
          )}
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
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
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v as ImageCategory | 'All')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories ({images.length})</SelectItem>
                {IMAGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat} ({categoryCounts[cat]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5 border rounded-md p-1">
              {([
                { mode: 'grid-lg' as ViewMode, icon: LayoutGrid, title: 'Large Grid' },
                { mode: 'grid-md' as ViewMode, icon: Grid3X3, title: 'Medium Grid' },
                { mode: 'grid-sm' as ViewMode, icon: Grid2X2, title: 'Small Grid' },
                { mode: 'list' as ViewMode, icon: List, title: 'List' },
              ]).map(({ mode, icon: Icon, title }) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode(mode)}
                  title={title}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !selectedOrgId}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBulkUpload}
              className="hidden"
            />
          </div>

          {/* Upload Progress Panel */}
          {showUploadProgress && uploadQueue.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Uploading {uploadQueue.length} image{uploadQueue.length > 1 ? 's' : ''}
                </h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowUploadProgress(false);
                    setUploadQueue([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {uploadQueue.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                    {/* Thumbnail */}
                    {item.thumbnailUrl ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0 border">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.fileName}
                          className="h-full w-full object-cover"
                        />
                        {/* Status overlay */}
                        {item.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                        )}
                        {item.status === 'success' && (
                          <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="absolute inset-0 bg-destructive/40 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{item.fileName}</span>
                        {item.status === 'pending' && (
                          <span className="text-xs text-muted-foreground">Waiting...</span>
                        )}
                      </div>
                      {item.status === 'uploading' && (
                        <Progress value={item.progress} className="h-1 mt-1.5" />
                      )}
                      {item.status === 'success' && (
                        <span className="text-xs text-green-600">Uploaded successfully</span>
                      )}
                      {item.error && (
                        <span className="text-xs text-destructive">{item.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedImages.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedImages.size === filteredImages.length}
                onCheckedChange={selectAll}
              />
              <span className="text-sm font-medium">
                {selectedImages.size} selected
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkCategoryDialogOpen(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Change Category
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          {/* Image Grid/List */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedOrgId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Select an organization to view images</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div 
                className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">
                  {searchTerm || filterCategory !== 'All'
                    ? 'No images match your filters'
                    : 'Drop images here or click to upload'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PNG, JPG, WEBP, GIF, SVG
                </p>
              </div>
            ) : viewMode !== 'list' ? (
              <div className={cn(
                'grid gap-3',
                viewMode === 'grid-lg' && 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3',
                viewMode === 'grid-md' && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
                viewMode === 'grid-sm' && 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2',
              )}>
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                      viewMode === 'grid-lg' ? 'aspect-video' : 'aspect-square',
                      selectedImages.has(img.id)
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setPreviewImage(img)}
                  >
                    <img
                      src={img.public_url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div
                      className={cn("absolute top-2 left-2", viewMode === 'grid-sm' && 'top-1 left-1')}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleImageSelection(img.id);
                      }}
                    >
                      <Checkbox
                        checked={selectedImages.has(img.id)}
                        className={cn("bg-background/80", viewMode === 'grid-sm' && 'h-3.5 w-3.5')}
                      />
                    </div>
                    {viewMode !== 'grid-sm' && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{img.name}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {img.category}
                        </Badge>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(img.public_url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(img.public_url);
                          }}
                        >
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${img.name}"?`)) {
                              await deleteImage(img);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer',
                      selectedImages.has(img.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                    onClick={() => setPreviewImage(img)}
                  >
                    <Checkbox
                      checked={selectedImages.has(img.id)}
                      onCheckedChange={() => toggleImageSelection(img.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <img
                      src={img.public_url}
                      alt={img.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{img.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {img.file_size_bytes
                          ? `${(img.file_size_bytes / 1024).toFixed(1)} KB`
                          : 'Unknown size'}
                        {' • '}
                        {format(new Date(img.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">{img.category}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.open(img.public_url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(img.public_url)}
                        >
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            if (confirm(`Delete "${img.name}"?`)) {
                              await deleteImage(img);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Stats Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-4">
              <span>{filteredImages.length} images</span>
              {filterCategory !== 'All' && (
                <span>in {filterCategory}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {IMAGE_CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterCategory(filterCategory === cat ? 'All' : cat)}
                >
                  {cat}: {categoryCounts[cat]}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Category Dialog */}
      <Dialog open={bulkCategoryDialogOpen} onOpenChange={setBulkCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Update category for {selectedImages.size} selected images
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Category</Label>
              <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(v as ImageCategory)}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCategoryUpdate}>
              Update {selectedImages.size} Images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
            <DialogDescription>
              {previewImage?.category} • {previewImage?.mime_type}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <img
              src={previewImage?.public_url}
              alt={previewImage?.name}
              className="max-h-[60vh] rounded-lg object-contain"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(previewImage?.public_url || '')}
            >
              Copy URL
            </Button>
            <Button onClick={() => window.open(previewImage?.public_url, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
