import { useState } from 'react';
import { Plus, Trash2, Check, X, FileText, Monitor, Smartphone, Presentation, IdCard, Map, Calendar, Download, ExternalLink, FolderOpen, BookOpen, File } from 'lucide-react';
import { EventDigitalMaterial } from '@/types/event';
import { BrandTemplate, BrandBrochure } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { toast } from 'sonner';

interface EventDigitalSectionProps {
  materials: EventDigitalMaterial[];
  onUpdate: (materials: EventDigitalMaterial[]) => void;
  templates?: BrandTemplate[];
  onTemplatesChange?: (templates: BrandTemplate[]) => void;
  brochures?: BrandBrochure[];
  onBrochuresChange?: (brochures: BrandBrochure[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const MATERIAL_TYPES = [
  { value: 'email-template', label: 'Email Template', icon: FileText },
  { value: 'landing-page', label: 'Landing Page', icon: Monitor },
  { value: 'social-post', label: 'Social Post', icon: FileText },
  { value: 'virtual-background', label: 'Virtual Background', icon: Monitor },
  { value: 'presentation-template', label: 'Presentation', icon: Presentation },
  { value: 'name-badge', label: 'Name Badge', icon: IdCard },
  { value: 'agenda', label: 'Agenda', icon: Calendar },
  { value: 'map', label: 'Venue Map', icon: Map },
  { value: 'mobile-app', label: 'Mobile App', icon: Smartphone },
  { value: 'other', label: 'Other', icon: FileText },
];

const TEMPLATE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'spreadsheet', label: 'Spreadsheet' },
  { value: 'design', label: 'Design File' },
  { value: 'other', label: 'Other' },
];

const getTypeIcon = (type: EventDigitalMaterial['type']) => {
  return MATERIAL_TYPES.find(t => t.value === type)?.icon || FileText;
};

export const EventDigitalSection = ({
  materials,
  onUpdate,
  templates = [],
  onTemplatesChange,
  brochures = [],
  onBrochuresChange,
  isEditable = true,
  subtitle,
}: EventDigitalSectionProps) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'templates' | 'brochures'>('materials');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Material form state
  const [newMaterial, setNewMaterial] = useState<Partial<EventDigitalMaterial>>({
    name: '',
    type: 'email-template',
    description: '',
  });
  
  // Template form state
  const [newTemplate, setNewTemplate] = useState<Partial<BrandTemplate>>({
    name: '',
    fileType: 'document',
    fileSize: '',
  });
  
  // Brochure form state
  const [newBrochure, setNewBrochure] = useState<{ title: string; category: string }>({
    title: '',
    category: 'event',
  });

  // Material handlers
  const handleAddMaterial = () => {
    if (!newMaterial.name) return;
    
    const item: EventDigitalMaterial = {
      id: crypto.randomUUID(),
      name: newMaterial.name,
      type: newMaterial.type as EventDigitalMaterial['type'],
      previewUrl: newMaterial.previewUrl,
      templateUrl: newMaterial.templateUrl,
      fileType: newMaterial.fileType,
      description: newMaterial.description,
    };
    
    onUpdate([...materials, item]);
    setNewMaterial({ name: '', type: 'email-template', description: '' });
    setIsAddingNew(false);
    toast.success('Material added');
  };

  const handleDeleteMaterial = (id: string) => {
    onUpdate(materials.filter(m => m.id !== id));
    toast.success('Material removed');
  };

  // Template handlers
  const handleAddTemplate = () => {
    if (!newTemplate.name || !onTemplatesChange) return;
    
    const item: BrandTemplate = {
      id: crypto.randomUUID(),
      name: newTemplate.name,
      fileType: newTemplate.fileType || 'document',
      fileSize: newTemplate.fileSize || '',
      externalUrl: newTemplate.externalUrl,
      thumbnailUrl: newTemplate.thumbnailUrl,
      description: newTemplate.description,
    };
    
    onTemplatesChange([...templates, item]);
    setNewTemplate({ name: '', fileType: 'document', fileSize: '' });
    setIsAddingNew(false);
    toast.success('Template added');
  };

  const handleDeleteTemplate = (id: string) => {
    if (!onTemplatesChange) return;
    onTemplatesChange(templates.filter(t => t.id !== id));
    toast.success('Template removed');
  };

  // Brochure handlers
  const handleAddBrochure = (previewUrl: string) => {
    if (!newBrochure.title || !onBrochuresChange) return;
    
    const item: BrandBrochure = {
      id: crypto.randomUUID(),
      title: newBrochure.title,
      category: newBrochure.category || 'event',
      previewUrl,
    };
    
    onBrochuresChange([...brochures, item]);
    setNewBrochure({ title: '', category: 'event' });
    setIsAddingNew(false);
    toast.success('Brochure added');
  };

  const handleDeleteBrochure = (id: string) => {
    if (!onBrochuresChange) return;
    onBrochuresChange(brochures.filter(b => b.id !== id));
    toast.success('Brochure removed');
  };

  const hasTemplatesSection = !!onTemplatesChange;
  const hasBrochuresSection = !!onBrochuresChange;

  return (
    <section id="eventdigital" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Digital Collateral</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">Digital materials, templates, and downloadable assets</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Tabs for different asset types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="materials" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Materials
            {materials.length > 0 && <span className="text-xs text-muted-foreground">({materials.length})</span>}
          </TabsTrigger>
          {hasTemplatesSection && (
            <TabsTrigger value="templates" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              Templates
              {templates.length > 0 && <span className="text-xs text-muted-foreground">({templates.length})</span>}
            </TabsTrigger>
          )}
          {hasBrochuresSection && (
            <TabsTrigger value="brochures" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Brochures
              {brochures.length > 0 && <span className="text-xs text-muted-foreground">({brochures.length})</span>}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials">
          {isAddingNew && activeTab === 'materials' && (
            <Card className="mb-6 border-dashed border-primary">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newMaterial.name || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="Invitation Email Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value as EventDigitalMaterial['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File Type (optional)</Label>
                    <Input
                      value={newMaterial.fileType || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, fileType: e.target.value })}
                      placeholder="HTML, PPTX, PDF, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preview URL (optional)</Label>
                    <Input
                      value={newMaterial.previewUrl || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, previewUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template URL (optional)</Label>
                    <Input
                      value={newMaterial.templateUrl || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, templateUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={newMaterial.description || ''}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      placeholder="Brief description..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleAddMaterial} disabled={!newMaterial.name}>
                    <Check className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {materials.length === 0 && !isAddingNew ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No digital materials yet</h3>
                <p className="text-muted-foreground mb-4">Add email templates, presentations, and other digital assets</p>
                {isEditable && (
                  <Button onClick={() => { setActiveTab('materials'); setIsAddingNew(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Material
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {materials.map((material) => {
                const Icon = getTypeIcon(material.type);
                return (
                  <Card key={material.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
                        {material.previewUrl ? (
                          <img 
                            src={material.previewUrl} 
                            alt={material.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                            <Icon className="h-8 w-8" />
                            {material.fileType && (
                              <span className="text-[10px] font-medium uppercase tracking-wider">
                                {material.fileType}
                              </span>
                            )}
                          </div>
                        )}
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteMaterial(material.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <h4 className="font-medium text-xs truncate">{material.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {MATERIAL_TYPES.find(t => t.value === material.type)?.label}
                        </p>
                        {material.templateUrl && (
                          <Button variant="outline" size="sm" className="w-full h-6 text-[10px] mt-1" asChild>
                            <a href={material.templateUrl} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        {hasTemplatesSection && (
          <TabsContent value="templates">
            {isAddingNew && activeTab === 'templates' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="PowerPoint Template"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newTemplate.fileType}
                        onValueChange={(value) => setNewTemplate({ ...newTemplate, fileType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>File Size (optional)</Label>
                      <Input
                        value={newTemplate.fileSize || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, fileSize: e.target.value })}
                        placeholder="2.5 MB"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>External URL</Label>
                      <Input
                        value={newTemplate.externalUrl || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, externalUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        value={newTemplate.description || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleAddTemplate} disabled={!newTemplate.name}>
                      <Check className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {templates.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">Add downloadable templates for your event</p>
                  {isEditable && (
                    <Button onClick={() => { setActiveTab('templates'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded">
                          <File className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {template.fileType} {template.fileSize && `• ${template.fileSize}`}
                          </p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                          )}
                        </div>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {template.externalUrl && (
                        <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" asChild>
                          <a href={template.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Brochures Tab */}
        {hasBrochuresSection && (
          <TabsContent value="brochures">
            {isAddingNew && activeTab === 'brochures' && (
              <Card className="mb-6 border-dashed border-primary">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={newBrochure.title}
                        onChange={(e) => setNewBrochure({ ...newBrochure, title: e.target.value })}
                        placeholder="Event Brochure 2026"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={newBrochure.category}
                        onChange={(e) => setNewBrochure({ ...newBrochure, category: e.target.value })}
                        placeholder="event, sponsorship, etc."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Cover Image</Label>
                      <ImageLibraryPicker
                        onSelect={(url) => handleAddBrochure(url)}
                        trigger={
                          <Button variant="outline" className="w-full gap-2" disabled={!newBrochure.title}>
                            <Plus className="h-4 w-4" />
                            Select Cover & Add Brochure
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {brochures.length === 0 && !isAddingNew ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No brochures yet</h3>
                  <p className="text-muted-foreground mb-4">Add event brochures and flyers</p>
                  {isEditable && (
                    <Button onClick={() => { setActiveTab('brochures'); setIsAddingNew(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Brochure
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {brochures.map((brochure) => (
                  <Card key={brochure.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
                        {brochure.previewUrl ? (
                          <img 
                            src={brochure.previewUrl} 
                            alt={brochure.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                        )}
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteBrochure(brochure.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <h4 className="font-medium text-xs truncate">{brochure.title}</h4>
                        {brochure.category && (
                          <p className="text-[10px] text-muted-foreground truncate">{brochure.category}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
};
