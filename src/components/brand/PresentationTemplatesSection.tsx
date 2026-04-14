/**
 * PresentationTemplatesSection - Unified template section for all document types
 * Includes: PowerPoint, PDFs, design files, cloud folders, and external links
 * Persists to database via presentation_templates table
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Upload, Download, Trash2, Loader2, Eye, Presentation, ExternalLink, 
  ImagePlus, FileText, X, Maximize2, Minimize2, Link, FolderOpen, Filter,
  Grid3X3, List, Search, FileType, Image
} from 'lucide-react';
import { PresentationTemplate, PresentationFileType, PresentationCategory } from '@/types/brand';
import { PdfThumbnailCard } from './PdfThumbnailCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { usePresentationTemplates } from '@/hooks/usePresentationTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PresentationTemplatesSectionProps {
  presentations?: PresentationTemplate[];
  onUpdate?: (presentations: PresentationTemplate[]) => void;
  isEditable?: boolean;
  subtitle?: string;
  entityType?: 'brand' | 'event' | 'product';
  entityId?: string;
}

// Categories for filtering
const CATEGORIES: { value: PresentationCategory; label: string; icon: string }[] = [
  { value: 'presentations', label: 'Presentations', icon: '📊' },
  { value: 'documents', label: 'Documents', icon: '📝' },
  { value: 'design-files', label: 'Design Files', icon: '🎨' },
  { value: 'spreadsheets', label: 'Spreadsheets', icon: '📈' },
  { value: 'pdf', label: 'PDFs', icon: '📕' },
  { value: 'cloud-folders', label: 'Cloud Folders', icon: '📂' },
  { value: 'external-links', label: 'External Links', icon: '🔗' },
  { value: 'sales', label: 'Sales', icon: '💼' },
  { value: 'marketing', label: 'Marketing', icon: '📣' },
  { value: 'corporate', label: 'Corporate', icon: '🏢' },
  { value: 'event', label: 'Event', icon: '🎉' },
  { value: 'training', label: 'Training', icon: '📚' },
  { value: 'other', label: 'Other', icon: '📄' },
];

// File types for upload dialog
const FILE_TYPES: { value: PresentationFileType; label: string; icon: string }[] = [
  { value: 'pptx', label: 'PowerPoint', icon: '📊' },
  { value: 'pdf', label: 'PDF Document', icon: '📕' },
  { value: 'docx', label: 'Word Document', icon: '📝' },
  { value: 'xlsx', label: 'Excel Spreadsheet', icon: '📈' },
  { value: 'figma', label: 'Figma File', icon: '🎨' },
  { value: 'sketch', label: 'Sketch File', icon: '✏️' },
  { value: 'psd', label: 'Photoshop File', icon: '🖼️' },
  { value: 'ai', label: 'Illustrator File', icon: '✏️' },
  { value: 'image', label: 'Image (PNG/JPG)', icon: '🖼️' },
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'dropbox', label: 'Dropbox Link', icon: '📦' },
  { value: 'dropbox-folder', label: 'Dropbox Folder', icon: '📂' },
  { value: 'drive', label: 'Google Drive Link', icon: '☁️' },
  { value: 'drive-folder', label: 'Google Drive Folder', icon: '📂' },
  { value: 'link', label: 'External Link', icon: '🔗' },
];

const getFileTypeIcon = (type?: string) => {
  const found = FILE_TYPES.find(ft => ft.value === type);
  return found?.icon || '📄';
};

const getCategoryColor = (category?: string) => {
  const colors: Record<string, string> = {
    presentations: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    documents: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'design-files': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    spreadsheets: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pdf: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'cloud-folders': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'external-links': 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300',
    sales: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    marketing: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    corporate: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    event: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    training: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    other: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300',
  };
  return colors[category || 'other'] || colors.other;
};

// Generate Microsoft Office Online embed URL
const getOfficeEmbedUrl = (fileUrl: string): string => {
  const encodedUrl = encodeURIComponent(fileUrl);
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
};

// Convert cloud URLs to embeddable URLs
const getDropboxEmbedUrl = (url: string): string => {
  let embedUrl = url.replace('?dl=0', '').replace('?dl=1', '');
  return embedUrl.includes('?') ? `${embedUrl}&raw=1` : `${embedUrl}?raw=1`;
};

const getDriveEmbedUrl = (url: string): string => {
  const folderIdMatch = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderIdMatch) {
    return `https://drive.google.com/embeddedfolderview?id=${folderIdMatch[1]}#list`;
  }
  return url;
};

// Office Online embed viewer component
const OfficeEmbed = ({ fileUrl, fileName }: { fileUrl: string; fileName: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const embedUrl = getOfficeEmbedUrl(fileUrl);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ height: '60vh', minHeight: '400px', maxHeight: '600px' }}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading document...</p>
          </div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 p-4 text-center">
          <Presentation className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium mb-1">Preview unavailable</p>
          <Button variant="outline" size="sm" asChild>
            <a href={embedUrl.replace('/embed.aspx', '/view.aspx')} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in Office Online
            </a>
          </Button>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title={`Preview: ${fileName}`}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      )}
    </div>
  );
};

// Folder embed component
const FolderEmbed = ({ template, expanded, onToggle }: { template: PresentationTemplate; expanded: boolean; onToggle: () => void }) => {
  const getEmbedUrl = () => {
    if (!template.externalUrl) return '';
    if (template.fileType?.includes('dropbox')) return getDropboxEmbedUrl(template.externalUrl);
    if (template.fileType?.includes('drive')) return getDriveEmbedUrl(template.externalUrl);
    return template.externalUrl;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileTypeIcon(template.fileType)}</span>
          <div>
            <p className="font-medium text-foreground">{template.name}</p>
            {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggle} className="gap-2">
            {expanded ? <><Minimize2 className="h-4 w-4" />Collapse</> : <><Maximize2 className="h-4 w-4" />Expand</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(template.externalUrl, '_blank')} className="gap-2">
            <ExternalLink className="h-4 w-4" />Open
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="h-[400px] bg-muted">
          <iframe src={getEmbedUrl()} className="w-full h-full border-0" title={template.name} />
        </div>
      )}
    </div>
  );
};


export const PresentationTemplatesSection = ({
  presentations: propPresentations,
  onUpdate,
  isEditable,
  subtitle,
  entityType = 'brand',
  entityId,
}: PresentationTemplatesSectionProps) => {
  // Default to false for public view; only editable if explicitly enabled
  const canEdit = isEditable ?? false;
  const { organization } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState<PresentationTemplate | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  
  const { 
    presentations: dbPresentations, 
    isLoading: isLoadingPresentations,
    addPresentation,
    deletePresentation,
    updatePresentation,
  } = usePresentationTemplates(entityType, entityId);
  
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const [replacingImageForId, setReplacingImageForId] = useState<string | null>(null);
  const replacingImageForIdRef = useRef<string | null>(null);
  const [isUploadingCardImage, setIsUploadingCardImage] = useState(false);
  
  const presentations = dbPresentations.length > 0 ? dbPresentations : (propPresentations || []);
  
  // Form state for file upload
  const [newPresentation, setNewPresentation] = useState({
    name: '',
    description: '',
    category: 'presentations' as PresentationCategory,
  });

  // Form state for external link
  const [linkForm, setLinkForm] = useState({
    name: '',
    externalUrl: '',
    fileType: 'link' as PresentationFileType,
    description: '',
    category: 'external-links' as PresentationCategory,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');

  // Filter presentations
  const filteredPresentations = useMemo(() => {
    return presentations.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [presentations, searchQuery, categoryFilter]);

  // Separate embedded folders from regular templates
  const embeddedFolders = filteredPresentations.filter(t => t.isEmbeddedFolder);
  const regularTemplates = filteredPresentations.filter(t => !t.isEmbeddedFolder);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File must be under 100MB');
      return;
    }

    setSelectedFile(file);
    if (!newPresentation.name) {
      setNewPresentation(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
    }

    // Auto-detect category from file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pptx' || ext === 'ppt') {
      setNewPresentation(prev => ({ ...prev, category: 'presentations' }));
    } else if (ext === 'pdf') {
      setNewPresentation(prev => ({ ...prev, category: 'pdf' }));
    } else if (ext === 'docx' || ext === 'doc') {
      setNewPresentation(prev => ({ ...prev, category: 'documents' }));
    } else if (ext === 'xlsx' || ext === 'xls') {
      setNewPresentation(prev => ({ ...prev, category: 'spreadsheets' }));
    } else if (['figma', 'sketch', 'psd', 'ai'].includes(ext || '')) {
      setNewPresentation(prev => ({ ...prev, category: 'design-files' }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !organization?.id || !entityId) {
      toast.error('Missing required information');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const loadingToast = toast.loading(`Uploading ${selectedFile.name}...`);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'bin';
      const isPptx = ext === 'pptx';
      
      if (isPptx) {
        // Use parse-presentation for PowerPoint files
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('organizationId', organization.id);

        setUploadProgress(30);
        toast.loading(`Processing presentation...`, { id: loadingToast });

        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-presentation`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
            body: formData,
          }
        );

        setUploadProgress(70);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process presentation');
        }

        const result = await response.json();
        setUploadProgress(90);

        toast.loading(`Saving to database...`, { id: loadingToast });

        await addPresentation({
          name: newPresentation.name || selectedFile.name.replace('.pptx', ''),
          description: newPresentation.description,
          fileUrl: result.fileUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          fileType: 'pptx',
          slides: result.slides,
          category: newPresentation.category,
        });
      } else {
        // Direct upload for other file types
        const storagePath = `${organization.id}/templates/${entityId}/${crypto.randomUUID()}.${ext}`;
        
        setUploadProgress(40);
        toast.loading(`Uploading file...`, { id: loadingToast });

        const { error: uploadError } = await supabase.storage
          .from('organization-assets')
          .upload(storagePath, selectedFile, { contentType: selectedFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('organization-assets')
          .getPublicUrl(storagePath);

        setUploadProgress(80);
        toast.loading(`Saving to database...`, { id: loadingToast });

        await addPresentation({
          name: newPresentation.name || selectedFile.name.replace(/\.[^/.]+$/, ''),
          description: newPresentation.description,
          fileUrl: urlData.publicUrl,
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
          fileType: ext as PresentationFileType,
          slides: [],
          category: newPresentation.category,
        });
      }
      
      setUploadProgress(100);
      toast.dismiss(loadingToast);
      toast.success('Template uploaded successfully');
      
      setSelectedFile(null);
      setNewPresentation({ name: '', description: '', category: 'presentations' });
      setIsDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('[TemplateUpload] Error:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to upload template');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddExternalLink = async () => {
    if (!linkForm.name.trim() || !linkForm.externalUrl.trim() || !entityId) return;

    const isFolder = linkForm.fileType.includes('folder');
    
    try {
      await addPresentation({
        name: linkForm.name.trim(),
        description: linkForm.description.trim() || undefined,
        fileUrl: linkForm.externalUrl.trim(),
        fileName: linkForm.name.trim(),
        fileSize: isFolder ? 'Folder' : 'External',
        fileType: linkForm.fileType,
        slides: [],
        category: isFolder ? 'cloud-folders' : linkForm.category,
        externalUrl: linkForm.externalUrl.trim(),
        isEmbeddedFolder: isFolder,
      });

      toast.success('Link added successfully');
      setLinkForm({ name: '', externalUrl: '', fileType: 'link', description: '', category: 'external-links' });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add link');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePresentation(id);
    } catch (error) {
      console.error('[TemplateDelete] Error:', error);
    }
  };

  const handleReplaceCardImage = async (file: File, templateId: string) => {
    if (!organization?.id) return;

    setIsUploadingCardImage(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const storagePath = `${organization.id}/templates/cards/${templateId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(storagePath);

      const cardImageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updatePresentation({ id: templateId, updates: { cardImageUrl } });
      toast.success('Card image updated');
    } catch (error) {
      toast.error('Failed to upload card image');
    } finally {
      setIsUploadingCardImage(false);
      setReplacingImageForId(null);
      replacingImageForIdRef.current = null;
    }
  };

  const onCardImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = replacingImageForIdRef.current;
    if (!file || !targetId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    handleReplaceCardImage(file, targetId);
    e.target.value = '';
  };

  const getPreviewThumbnail = (template: PresentationTemplate) => {
    if (template.cardImageUrl) return template.cardImageUrl;
    if (template.thumbnailUrl) return template.thumbnailUrl;
    if (template.slides?.[0]?.thumbnailUrl) return template.slides[0].thumbnailUrl;
    return null;
  };

  return (
    <section id="presentations" className="scroll-mt-24 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Presentation Templates</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">
              PowerPoint decks, documents, design files, and external resources
            </p>
          )}
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Template</DialogTitle>
                <DialogDescription>
                  Upload a file or add an external link
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'link')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="link" className="gap-2">
                    <Link className="h-4 w-4" />
                    External Link
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4 pt-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>File</Label>
                    {!selectedFile ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload any file</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Max 50MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newPresentation.name}
                      onChange={(e) => setNewPresentation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Template name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newPresentation.category}
                      onValueChange={(v) => setNewPresentation(prev => ({ ...prev, category: v as PresentationCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={newPresentation.description}
                      onChange={(e) => setNewPresentation(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Processing...</p>
                    </div>
                  )}

                  <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
                    {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : 'Upload Template'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="link" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={linkForm.name}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Brand Assets Folder"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={linkForm.externalUrl}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, externalUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Resource Type</Label>
                    <Select
                      value={linkForm.fileType}
                      onValueChange={(v) => setLinkForm(prev => ({ 
                        ...prev, 
                        fileType: v as PresentationFileType,
                        category: v.includes('folder') ? 'cloud-folders' : 'external-links',
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILE_TYPES.filter(t => ['dropbox', 'dropbox-folder', 'drive', 'drive-folder', 'link'].includes(t.value)).map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {linkForm.fileType.includes('folder') && (
                      <p className="text-xs text-accent">📂 This will show an embedded folder browser</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={linkForm.description}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleAddExternalLink} 
                    disabled={!linkForm.name.trim() || !linkForm.externalUrl.trim()}
                    className="w-full"
                  >
                    Add Link
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input for card image replacement */}
      <input
        ref={cardImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCardImageSelect}
      />

      {/* Embedded Folders */}
      {embeddedFolders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Cloud Folders
            </h3>
            <Badge variant="secondary" className="text-xs">{embeddedFolders.length}</Badge>
          </div>
          {embeddedFolders.map(folder => (
            <FolderEmbed
              key={folder.id}
              template={folder}
              expanded={expandedFolderId === folder.id}
              onToggle={() => setExpandedFolderId(expandedFolderId === folder.id ? null : folder.id)}
            />
          ))}
        </div>
      )}

      {/* Templates Grid/List */}
      {isLoadingPresentations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : regularTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileType className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{searchQuery || categoryFilter !== 'all' ? 'No templates match your search' : 'No templates added yet'}</p>
          {canEdit && !searchQuery && categoryFilter === 'all' && (
            <p className="text-sm mt-2">Click "Add Template" to upload files or add external links</p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularTemplates.map(template => {
            const thumbnail = getPreviewThumbnail(template);
            return (
              <Card key={template.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative bg-muted/30 overflow-hidden flex items-center justify-center p-3 min-h-[120px] max-h-[280px]">
                  {thumbnail ? (
                    <OptimizedImage
                      src={thumbnail}
                      alt={template.name}
                      className="max-w-full max-h-[260px] w-auto h-auto object-contain rounded"
                    />
                  ) : template.fileType === 'pdf' && template.fileUrl ? (
                    <PdfThumbnailCard url={template.fileUrl} name={template.name} />
                  ) : template.fileType === 'pptx' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                      <Presentation className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">PPTX</span>
                      {template.slides && template.slides.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{template.slides.length} slides</span>
                      )}
                      <span className="text-[10px] text-muted-foreground max-w-[80%] truncate text-center">{template.name}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">{getFileTypeIcon(template.fileType)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button size="icon" variant="secondary" onClick={() => setPreviewTemplate(template)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {template.externalUrl ? (
                      <Button size="icon" variant="secondary" asChild>
                        <a href={template.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button size="icon" variant="secondary" asChild>
                        <a href={template.fileUrl} download={template.fileName}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => {
                            setReplacingImageForId(template.id);
                            replacingImageForIdRef.current = template.id;
                            cardImageInputRef.current?.click();
                          }}
                        >
                          <ImagePlus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(template.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{template.name}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{template.description}</p>
                      )}
                    </div>
                    <Badge className={cn('shrink-0 text-[10px]', getCategoryColor(template.category))}>
                      {template.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{getFileTypeIcon(template.fileType)}</span>
                    {template.fileSize && <span>{template.fileSize}</span>}
                    {template.slides?.length > 0 && <span>• {template.slides.length} slides</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {regularTemplates.map(template => {
            const thumbnail = getPreviewThumbnail(template);
            return (
              <div
                key={template.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="w-16 h-12 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {thumbnail ? (
                    <OptimizedImage src={thumbnail} alt={template.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{getFileTypeIcon(template.fileType)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{template.name}</p>
                    <Badge className={cn('shrink-0 text-[10px]', getCategoryColor(template.category))}>
                      {template.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {template.fileSize && <span>{template.fileSize}</span>}
                    {template.slides?.length > 0 && <span>• {template.slides.length} slides</span>}
                    {template.description && <span className="truncate">• {template.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => setPreviewTemplate(template)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {template.externalUrl ? (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={template.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={template.fileUrl} download={template.fileName}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {canEdit && (
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className={cn("max-w-4xl p-0", isFullscreen && "max-w-none w-screen h-screen")}>
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="truncate pr-4">{previewTemplate?.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              {previewTemplate?.externalUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewTemplate.externalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
              ) : previewTemplate && (
                <Button variant="outline" size="sm" asChild>
                  <a href={previewTemplate.fileUrl} download={previewTemplate.fileName}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className={cn("p-4", isFullscreen ? "h-[calc(100vh-80px)]" : "max-h-[70vh]")}>
            {previewTemplate?.fileType === 'pptx' && previewTemplate?.fileUrl ? (
              <OfficeEmbed fileUrl={previewTemplate.fileUrl} fileName={previewTemplate.fileName} />
            ) : previewTemplate?.slides && previewTemplate.slides.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewTemplate.slides.map(slide => (
                  <div key={slide.id} className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <OptimizedImage
                      src={slide.thumbnailUrl}
                      alt={slide.title || `Slide ${slide.slideNumber}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : previewTemplate?.externalUrl ? (
              <div className="text-center py-8">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">External resource</p>
                <Button asChild>
                  <a href={previewTemplate.externalUrl} target="_blank" rel="noopener noreferrer">
                    Open Link
                  </a>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileType className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No preview available for this file type</p>
                {previewTemplate && (
                  <Button asChild className="mt-4">
                    <a href={previewTemplate.fileUrl} download={previewTemplate.fileName}>
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </a>
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </section>
  );
};
