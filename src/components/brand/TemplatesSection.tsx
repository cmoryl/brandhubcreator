import { useState, useRef } from 'react';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { X, Pencil, Upload, Download, FileType, Link, ExternalLink, Image, FileText, FolderOpen, Maximize2, Minimize2 } from 'lucide-react';
import { BrandTemplate } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';

interface TemplatesSectionProps {
  templates: BrandTemplate[];
  onTemplatesChange?: (templates: BrandTemplate[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileTypeIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('presentation') || lowerType.includes('ppt')) return '📊';
  if (lowerType.includes('document') || lowerType.includes('doc')) return '📝';
  if (lowerType.includes('spreadsheet') || lowerType.includes('xls')) return '📈';
  if (lowerType.includes('figma') || lowerType.includes('sketch')) return '🎨';
  if (lowerType.includes('photoshop') || lowerType.includes('psd')) return '🖼️';
  if (lowerType.includes('illustrator') || lowerType.includes('ai')) return '✏️';
  if (lowerType.includes('pdf')) return '📕';
  if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg')) return '🖼️';
  if (lowerType.includes('video') || lowerType.includes('mp4')) return '🎬';
  if (lowerType.includes('dropbox-folder')) return '📂';
  if (lowerType.includes('dropbox')) return '📦';
  if (lowerType.includes('drive-folder')) return '📂';
  if (lowerType.includes('drive')) return '☁️';
  if (lowerType.includes('folder')) return '📂';
  if (lowerType.includes('link')) return '🔗';
  return '📄';
};

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'pptx', label: 'PowerPoint' },
  { value: 'docx', label: 'Word Document' },
  { value: 'xlsx', label: 'Excel Spreadsheet' },
  { value: 'figma', label: 'Figma File' },
  { value: 'sketch', label: 'Sketch File' },
  { value: 'psd', label: 'Photoshop File' },
  { value: 'ai', label: 'Illustrator File' },
  { value: 'image', label: 'Image (PNG/JPG)' },
  { value: 'video', label: 'Video' },
  { value: 'dropbox', label: 'Dropbox Link' },
  { value: 'dropbox-folder', label: 'Dropbox Folder (Embedded)' },
  { value: 'drive', label: 'Google Drive Link' },
  { value: 'drive-folder', label: 'Google Drive Folder (Embedded)' },
  { value: 'link', label: 'External Link' },
];

// Convert Dropbox share URL to embeddable URL
const getDropboxEmbedUrl = (url: string): string => {
  // Convert www.dropbox.com/scl/fo/... or dropbox.com/sh/... to embeddable format
  let embedUrl = url
    .replace('www.dropbox.com', 'www.dropbox.com')
    .replace('?dl=0', '')
    .replace('?dl=1', '');
  
  // Add embed parameter
  if (embedUrl.includes('?')) {
    embedUrl += '&raw=1';
  } else {
    embedUrl += '?raw=1';
  }
  
  return embedUrl;
};

// Convert Google Drive folder URL to embeddable URL
const getDriveEmbedUrl = (url: string): string => {
  // Extract folder ID from various Drive URL formats
  const folderIdMatch = url.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderIdMatch) {
    return `https://drive.google.com/embeddedfolderview?id=${folderIdMatch[1]}#list`;
  }
  return url;
};

export const TemplatesSection = ({ templates: templatesProp, onTemplatesChange, customSubtitle, onSubtitleChange, layout = 'grid-2', onLayoutChange, entityId, entityType = 'brand' }: TemplatesSectionProps) => {
  const canEdit = Boolean(onTemplatesChange);
  const { uploadFile } = useStorageUpload({ entityType, entityId });
  // Defensive: ensure templates is always an array
  const templates = Array.isArray(templatesProp) ? templatesProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, string>>({});
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [pendingThumbnailId, setPendingThumbnailId] = useState<string | null>(null);
  
  const { gridClass } = useLayoutClasses(layout);
  
  // Link form state
  const [linkForm, setLinkForm] = useState({
    name: '',
    externalUrl: '',
    fileType: 'link',
    description: '',
    isEmbeddedFolder: false,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onTemplatesChange) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newTemplate: BrandTemplate = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileType: file.name.split('.').pop() || 'unknown',
        fileSize: formatFileSize(file.size),
      };
      setFileData(prev => ({ ...prev, [newTemplate.id]: url }));
      onTemplatesChange([...templates, newTemplate]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingThumbnailId) return;
    const currentPendingId = pendingThumbnailId;
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    setPendingThumbnailId(null);

    let url: string;
    if (entityId) {
      const result = await uploadFile(file, 'asset', `template-thumb-${crypto.randomUUID()}`);
      if (!result) return;
      url = result.url;
    } else {
      const reader = new FileReader();
      url = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    updateTemplate(currentPendingId, { thumbnailUrl: url });
  };

  const handleAddExternalLink = () => {
    if (!linkForm.name.trim() || !linkForm.externalUrl.trim() || !onTemplatesChange) return;

    const isFolder = linkForm.fileType.includes('folder');
    
    const newTemplate: BrandTemplate = {
      id: crypto.randomUUID(),
      name: linkForm.name.trim(),
      fileType: linkForm.fileType,
      fileSize: isFolder ? 'Folder' : 'External',
      externalUrl: linkForm.externalUrl.trim(),
      description: linkForm.description.trim() || undefined,
      isEmbeddedFolder: isFolder,
    };

    onTemplatesChange([...templates, newTemplate]);
    setLinkForm({ name: '', externalUrl: '', fileType: 'link', description: '', isEmbeddedFolder: false });
    setIsLinkDialogOpen(false);
  };

  const updateTemplate = (id: string, updates: Partial<BrandTemplate>) => {
    if (!onTemplatesChange) return;
    onTemplatesChange(templates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTemplate = (id: string) => {
    if (!onTemplatesChange) return;
    onTemplatesChange(templates.filter(t => t.id !== id));
    setFileData(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (editingId === id) setEditingId(null);
    if (expandedFolderId === id) setExpandedFolderId(null);
  };

  const downloadTemplate = (template: BrandTemplate) => {
    if (template.externalUrl) {
      window.open(template.externalUrl, '_blank');
      return;
    }
    
    const url = fileData[template.id];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}.${template.fileType}`;
      link.click();
    }
  };

  const triggerThumbnailUpload = (id: string) => {
    setPendingThumbnailId(id);
    thumbnailInputRef.current?.click();
  };

  const getEmbedUrl = (template: BrandTemplate): string => {
    if (!template.externalUrl) return '';
    
    if (template.fileType.includes('dropbox')) {
      return getDropboxEmbedUrl(template.externalUrl);
    }
    if (template.fileType.includes('drive')) {
      return getDriveEmbedUrl(template.externalUrl);
    }
    return template.externalUrl;
  };

  // Separate embedded folders from regular templates
  const embeddedFolders = templates.filter(t => t.isEmbeddedFolder);
  const regularTemplates = templates.filter(t => !t.isEmbeddedFolder);

  // Group regular templates by file type
  const groupedTemplates = regularTemplates.reduce((acc, template) => {
    const category = template.externalUrl ? 'EXTERNAL LINKS' : (template.fileType?.toUpperCase() || 'OTHER');
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, BrandTemplate[]>);

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Section header - always full width on its own row */}
      <SectionHeader
        title="Master Scaffolds"
        defaultSubtitle="Presentation decks, document templates, design files, and external resources"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />
      
      {/* Controls row - separate from header */}
      <div className="flex items-center gap-2 flex-wrap">
            {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
            {canEdit && (
              <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Link className="h-4 w-4" />
                    Add Link
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add External Resource</DialogTitle>
                <DialogDescription>
                  Link to Dropbox, Google Drive, or any external resource. Choose a folder type to embed and browse files directly.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="link-name">Name</Label>
                  <Input
                    id="link-name"
                    placeholder="e.g., Brand Assets Folder"
                    value={linkForm.name}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    placeholder="https://www.dropbox.com/scl/fo/... or https://drive.google.com/drive/folders/..."
                    value={linkForm.externalUrl}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, externalUrl: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    For Dropbox folders, use the shared folder link. For Google Drive, use the folder URL.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-type">Resource Type</Label>
                  <Select
                    value={linkForm.fileType}
                    onValueChange={(value) => setLinkForm(prev => ({ 
                      ...prev, 
                      fileType: value,
                      isEmbeddedFolder: value.includes('folder')
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {getFileTypeIcon(type.value)} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {linkForm.fileType.includes('folder') && (
                    <p className="text-xs text-accent">
                      📂 This will show an embedded folder browser in your brand guide
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-description">Description (optional)</Label>
                  <Textarea
                    id="link-description"
                    placeholder="Brief description of this resource..."
                    value={linkForm.description}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddExternalLink}
                  disabled={!linkForm.name.trim() || !linkForm.externalUrl.trim()}
                >
                  Add Resource
                </Button>
              </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
            {canEdit && (
              <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2 shrink-0">
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
        className="hidden"
      />

      {/* Embedded Folders Section */}
      {embeddedFolders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Embedded Folders
            </h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {embeddedFolders.length}
            </span>
          </div>
          
          <div className="space-y-4">
            {embeddedFolders.map((folder) => (
              <div
                key={folder.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Folder Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileTypeIcon(folder.fileType)}</span>
                    <div>
                      {editingId === folder.id ? (
                        <Input
                          value={folder.name}
                          onChange={(e) => updateTemplate(folder.id, { name: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                          className="h-8 w-64"
                          autoFocus
                        />
                      ) : (
                        <p className="font-medium text-foreground">{folder.name}</p>
                      )}
                      {folder.description && (
                        <p className="text-sm text-muted-foreground">{folder.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedFolderId(expandedFolderId === folder.id ? null : folder.id)}
                      className="gap-2"
                    >
                      {expandedFolderId === folder.id ? (
                        <>
                          <Minimize2 className="h-4 w-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4" />
                          Expand
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(folder.externalUrl, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in {folder.fileType.includes('dropbox') ? 'Dropbox' : 'Drive'}
                    </Button>
                    <button
                      onClick={() => setEditingId(folder.id)}
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(folder.id)}
                      className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Embedded Folder View */}
                <div 
                  className={`transition-all duration-300 overflow-hidden ${
                    expandedFolderId === folder.id ? 'h-[500px]' : 'h-48'
                  }`}
                >
                  {folder.fileType.includes('dropbox') ? (
                    <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center p-6 text-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="font-medium text-foreground mb-2">Dropbox Folder</p>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Due to Dropbox's embed limitations, click the button below to view this folder's contents in a new tab.
                      </p>
                      <Button
                        onClick={() => window.open(folder.externalUrl, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in Dropbox
                      </Button>
                    </div>
                  ) : folder.fileType.includes('drive') ? (
                    <iframe
                      src={getEmbedUrl(folder)}
                      className="w-full h-full border-0"
                      title={folder.name}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  ) : (
                    <iframe
                      src={folder.externalUrl}
                      className="w-full h-full border-0"
                      title={folder.name}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Templates */}
      {Object.keys(groupedTemplates).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                {type === 'EXTERNAL LINKS' ? (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileType className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {type === 'EXTERNAL LINKS' ? 'External Resources' : `${type} Files`}
                </h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {typeTemplates.length}
                </span>
              </div>
              <div className={gridClass}>
                {typeTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Thumbnail or placeholder */}
                    <div className="relative h-32 bg-muted/50 flex items-center justify-center overflow-hidden">
                      {template.thumbnailUrl ? (
                        <img 
                          src={template.thumbnailUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-5xl">{getFileTypeIcon(template.fileType)}</span>
                      )}
                      {/* Thumbnail upload button - Admin only */}
                      {canEdit && (
                        <button
                          onClick={() => triggerThumbnailUpload(template.id)}
                          className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                          title="Add thumbnail"
                        >
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      {/* External link badge */}
                      {template.externalUrl && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-accent/90 text-accent-foreground text-xs font-medium rounded-md flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          External
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          {editingId === template.id ? (
                            <Input
                              value={template.name}
                              onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              className="h-8"
                              autoFocus
                            />
                          ) : (
                            <p className="font-medium text-foreground truncate">{template.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {template.fileSize} • {template.externalUrl ? 'External Link' : `.${template.fileType}`}
                          </p>
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTemplate(template)}
                          className="flex-1 gap-2"
                        >
                          {template.externalUrl ? (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          )}
                        </Button>
                        <button
                          onClick={() => setEditingId(template.id)}
                          className="p-2 rounded-md hover:bg-secondary transition-colors"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : embeddedFolders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <FileText className="h-10 w-10" />
            <div className="text-center">
              <p className="font-medium">Upload design templates</p>
              <p className="text-sm">PPTX, DOCX, Figma, Sketch, PSD files</p>
            </div>
          </button>
          <button
            onClick={() => setIsLinkDialogOpen(true)}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <FolderOpen className="h-10 w-10" />
            <div className="text-center">
              <p className="font-medium">Connect a folder</p>
              <p className="text-sm">Dropbox or Google Drive folders</p>
            </div>
          </button>
        </div>
      ) : null}
    </section>
  );
};