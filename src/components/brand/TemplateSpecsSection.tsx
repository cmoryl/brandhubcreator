import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, GripVertical, Eye, EyeOff, FileText, BookOpen, File, Newspaper, Settings2, Move, Loader2, Download, ExternalLink, Pencil, Link, Star, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { TemplateSpec, TemplateSpecItem, TemplateSpecSpotlight, BrandColor } from '@/types/brand';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable callout component for the preview image
interface DraggableCalloutProps {
  item: TemplateSpecItem;
  primaryColor: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPositionChange: (itemId: string, position: { x: number; y: number }) => void;
}

const DraggableCallout = ({ item, primaryColor, containerRef, onPositionChange }: DraggableCalloutProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Use useEffect for global event listeners during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

      // Clamp to bounds
      const clampedX = Math.max(2, Math.min(98, x));
      const clampedY = Math.max(2, Math.min(98, y));

      onPositionChange(item.id, { x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, containerRef, item.id, onPositionChange]);

  const pos = item.position || { x: 5, y: 10 };

  return (
    <div
      className={cn(
        "absolute w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg cursor-grab transition-all select-none",
        isDragging ? "cursor-grabbing scale-125 ring-2 ring-white/50 z-50" : "hover:scale-110 hover:ring-2 hover:ring-white/30"
      )}
      style={{
        backgroundColor: primaryColor,
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      title={`${item.number}. ${item.title} — Drag to reposition`}
      onMouseDown={handleMouseDown}
    >
      {item.number}
    </div>
  );
};

interface TemplateSpecsSectionProps {
  templateSpecs: TemplateSpec[];
  onTemplateSpecsChange?: (specs: TemplateSpec[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandColors?: BrandColor[];
  entityId?: string;
  entityType?: 'brand' | 'event' | 'product';
}

const CATEGORY_OPTIONS: { value: TemplateSpec['category']; label: string; icon: React.ElementType }[] = [
  { value: 'case-study', label: 'Case Study', icon: BookOpen },
  { value: 'brochure', label: 'Brochure', icon: Newspaper },
  { value: 'whitepaper', label: 'White Paper', icon: FileText },
  { value: 'template', label: 'Template', icon: File },
  { value: 'other', label: 'Other', icon: Settings2 },
];

// Sortable spec item component
const SortableSpecItem = ({
  item,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDoneEditing,
  primaryColor,
}: {
  item: TemplateSpecItem;
  isEditing: boolean;
  onEdit?: () => void;
  onUpdate?: (updates: Partial<TemplateSpecItem>) => void;
  onDelete?: () => void;
  onDoneEditing: () => void;
  primaryColor: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Only apply transform styles when actively dragging to prevent continuous repaints
  const style: React.CSSProperties = transform ? {
    transform: CSS.Translate.toString(transform),
    transition,
    willChange: 'transform',
  } : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-lg border transition-all",
        isDragging ? "opacity-50 bg-muted shadow-lg" : "bg-card hover:bg-muted/50",
        isEditing && "ring-2 ring-primary"
      )}
    >
      {/* Drag handle */}
      {onEdit && (
        <button
          {...attributes}
          {...listeners}
          className="mt-1 p-1 rounded hover:bg-secondary cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Number badge */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {item.number}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={item.title}
              onChange={(e) => onUpdate?.({ title: e.target.value })}
              placeholder="Section title (e.g., CLIENT LOGO)"
              className="font-semibold"
            />
            <Textarea
              value={item.description}
              onChange={(e) => onUpdate?.({ description: e.target.value })}
              placeholder="Description or guidelines"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={item.dimensions || ''}
                onChange={(e) => onUpdate?.({ dimensions: e.target.value })}
                placeholder="Dimensions (e.g., 1500 x 500 pixels)"
              />
              <Input
                value={item.fileFormats || ''}
                onChange={(e) => onUpdate?.({ fileFormats: e.target.value })}
                placeholder="File formats (e.g., JPEG or PNG)"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onDoneEditing} className="gap-1">
                <Check className="h-3 w-3" /> Done
              </Button>
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm uppercase tracking-wide" style={{ color: primaryColor }}>
                {item.title || 'Untitled Section'}
              </h4>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{item.description || 'No description'}</p>
            {(item.dimensions || item.fileFormats) && (
              <p className="text-xs text-muted-foreground/70">
                {item.dimensions && <span className="font-medium">Dimensions:</span>} {item.dimensions}
                {item.dimensions && item.fileFormats && ' • '}
                {item.fileFormats && <span className="font-medium">Formats:</span>} {item.fileFormats}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const TemplateSpecsSection = ({
  templateSpecs: templateSpecsProp,
  onTemplateSpecsChange,
  customSubtitle,
  onSubtitleChange,
  brandColors = [],
  entityId,
  entityType = 'brand',
}: TemplateSpecsSectionProps) => {
  // Defensive: ensure templateSpecs is always an array
  const templateSpecs = Array.isArray(templateSpecsProp) ? templateSpecsProp : [];
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editSpecId, setEditSpecId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isDragMode, setIsDragMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const spotlightInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const [newSpecForm, setNewSpecForm] = useState({
    name: '',
    category: 'case-study' as TemplateSpec['category'],
  });

  const [editSpecForm, setEditSpecForm] = useState({
    name: '',
    category: 'case-study' as TemplateSpec['category'],
    downloadUrl: '',
  });

  // Get primary brand color
  const primaryColor = useMemo(() => {
    const primary = brandColors.find(c => c.role === 'primary') || brandColors[0];
    return primary?.hex || '#0066cc';
  }, [brandColors]);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedSpec = templateSpecs.find(s => s.id === selectedSpecId);
  
  // Defensive: ensure items is always an array to prevent crashes on malformed data
  const selectedSpecItems = selectedSpec?.items ?? [];

  // Auto-select first spec on load or when current selection becomes invalid
  useEffect(() => {
    if (templateSpecs.length > 0 && (!selectedSpecId || !templateSpecs.find(s => s.id === selectedSpecId))) {
      setSelectedSpecId(templateSpecs[0].id);
    }
  }, [templateSpecs, selectedSpecId]);

  // Add new template spec
  const handleAddSpec = () => {
    if (!newSpecForm.name.trim() || !onTemplateSpecsChange) return;

    const newSpec: TemplateSpec = {
      id: crypto.randomUUID(),
      name: newSpecForm.name.trim(),
      category: newSpecForm.category,
      items: [
        { id: crypto.randomUUID(), number: 1, title: 'CLIENT LOGO', description: 'Dimensions: 000 x 000 pixels' },
        { id: crypto.randomUUID(), number: 2, title: 'COVER IMAGE', description: 'Dimensions: 1500 x 500 pixels', dimensions: '1500 x 500 pixels', fileFormats: 'JPEG or PNG under 2MB' },
        { id: crypto.randomUUID(), number: 3, title: 'SPOTLIGHT HEADER', description: 'Client project header' },
        { id: crypto.randomUUID(), number: 4, title: 'THE CHALLENGE', description: 'What was the project challenge?' },
        { id: crypto.randomUUID(), number: 5, title: 'THE SOLUTION', description: 'What was the solution?' },
        { id: crypto.randomUUID(), number: 6, title: 'THE RESULTS', description: 'What were the project results?' },
        { id: crypto.randomUUID(), number: 7, title: 'CONTACT INFORMATION', description: 'TransPerfect contact information' },
      ],
    };

    onTemplateSpecsChange([...templateSpecs, newSpec]);
    setSelectedSpecId(newSpec.id);
    setNewSpecForm({ name: '', category: 'case-study' });
    setIsAddDialogOpen(false);
  };

  // Delete spec
  const handleDeleteSpec = (id: string) => {
    if (!onTemplateSpecsChange) return;
    onTemplateSpecsChange(templateSpecs.filter(s => s.id !== id));
    if (selectedSpecId === id) {
      setSelectedSpecId(templateSpecs.length > 1 ? templateSpecs[0].id : null);
    }
  };

  // Open edit dialog for spec
  const openEditDialog = (spec: TemplateSpec) => {
    setEditSpecId(spec.id);
    setEditSpecForm({ name: spec.name, category: spec.category, downloadUrl: spec.downloadUrl || '' });
    setIsEditDialogOpen(true);
  };

  // Save edited spec
  const handleSaveEditSpec = () => {
    if (!editSpecId || !onTemplateSpecsChange || !editSpecForm.name.trim()) return;
    onTemplateSpecsChange(templateSpecs.map(s => s.id === editSpecId ? { ...s, name: editSpecForm.name.trim(), category: editSpecForm.category, downloadUrl: editSpecForm.downloadUrl.trim() || undefined } : s));
    setIsEditDialogOpen(false);
    setEditSpecId(null);
  };

  // Add item to spec
  const handleAddItem = () => {
    if (!selectedSpec || !onTemplateSpecsChange) return;

    const maxNumber = Math.max(0, ...selectedSpecItems.map(i => i.number));
    const newItem: TemplateSpecItem = {
      id: crypto.randomUUID(),
      number: maxNumber + 1,
      title: 'NEW SECTION',
      description: 'Describe this section',
    };

    const updatedSpec = {
      ...selectedSpec,
      items: [...selectedSpecItems, newItem],
    };
    onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
    setEditingItemId(newItem.id);
  };

  // Update item
  const handleUpdateItem = (itemId: string, updates: Partial<TemplateSpecItem>) => {
    if (!selectedSpec || !onTemplateSpecsChange) return;

    const updatedSpec = {
      ...selectedSpec,
      items: selectedSpecItems.map(i => i.id === itemId ? { ...i, ...updates } : i),
    };
    onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    if (!selectedSpec || !onTemplateSpecsChange) return;

    const filteredItems = selectedSpecItems.filter(i => i.id !== itemId);
    // Renumber items
    const renumberedItems = filteredItems.map((item, idx) => ({
      ...item,
      number: idx + 1,
    }));

    const updatedSpec = {
      ...selectedSpec,
      items: renumberedItems,
    };
    onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
    setEditingItemId(null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!selectedSpec || !over || active.id === over.id || !onTemplateSpecsChange) return;

    const oldIndex = selectedSpecItems.findIndex(i => i.id === active.id);
    const newIndex = selectedSpecItems.findIndex(i => i.id === over.id);

    const reorderedItems = arrayMove(selectedSpecItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      number: idx + 1,
    }));

    const updatedSpec = {
      ...selectedSpec,
      items: reorderedItems,
    };
    onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
  };

  // Cloud storage upload for preview images — prevents base64 stripping on save
  const { uploadFile, isUploading: isUploadingPreview } = useStorageUpload({ entityType, entityId });

  const handlePreviewImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSpec || !onTemplateSpecsChange) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    // If we have entityId, upload to cloud storage for persistence
    if (entityId) {
      const result = await uploadFile(file, 'asset', `template-spec-${selectedSpec.id}`);
      if (result) {
        const updatedSpec = { ...selectedSpec, previewImageUrl: result.url };
        onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
      }
    } else {
      // Fallback to base64 for unsaved entities (will be stripped on save — user should save entity first)
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const updatedSpec = { ...selectedSpec, previewImageUrl: url };
        onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
      };
      reader.readAsDataURL(file);
    }
  }, [selectedSpec, templateSpecs, onTemplateSpecsChange, entityId, uploadFile]);

  // Handle callout position change from drag
  const handleCalloutPositionChange = useCallback((itemId: string, position: { x: number; y: number }) => {
    if (!selectedSpec || !onTemplateSpecsChange) return;

    const updatedSpec = {
      ...selectedSpec,
      items: selectedSpecItems.map(item => 
        item.id === itemId ? { ...item, position } : item
      ),
    };
    onTemplateSpecsChange(templateSpecs.map(s => s.id === selectedSpec.id ? updatedSpec : s));
  }, [selectedSpec, templateSpecs, onTemplateSpecsChange]);

  const canEdit = !!onTemplateSpecsChange;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <SectionHeader
            title="Template Specifications"
            defaultSubtitle="Visual guidelines for case studies, brochures, and document templates"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
          />
        </div>
        {canEdit && (
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Template Spec
          </Button>
        )}
      </div>

      {/* Add Template Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Template Specification</DialogTitle>
            <DialogDescription>
              Create a new template specification with visual annotations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newSpecForm.name}
                onChange={(e) => setNewSpecForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Client Case Study Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newSpecForm.category}
                onValueChange={(v) => setNewSpecForm(prev => ({ ...prev, category: v as TemplateSpec['category'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSpec} disabled={!newSpecForm.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template Specification</DialogTitle>
            <DialogDescription>
              Update name, category, and download link for this template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={editSpecForm.name}
                onChange={(e) => setEditSpecForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Client Case Study Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editSpecForm.category}
                onValueChange={(v) => setEditSpecForm(prev => ({ ...prev, category: v as TemplateSpec['category'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Download / Asset URL (optional)</Label>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={editSpecForm.downloadUrl}
                  onChange={(e) => setEditSpecForm(prev => ({ ...prev, downloadUrl: e.target.value }))}
                  placeholder="https://dropbox.com/... or https://figma.com/..."
                />
              </div>
              <p className="text-xs text-muted-foreground">Link to the downloadable template file (Dropbox, Figma, Google Drive, etc.)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditSpec} disabled={!editSpecForm.name.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {templateSpecs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {templateSpecs.map(spec => {
            const CategoryIcon = CATEGORY_OPTIONS.find(o => o.value === spec.category)?.icon || File;
            const isSelected = selectedSpecId === spec.id;
            return (
              <div
                key={spec.id}
                className={cn(
                  "group relative rounded-lg border-2 overflow-hidden transition-all text-left",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <button
                  onClick={() => setSelectedSpecId(spec.id)}
                  className="w-full text-left"
                >
                  {/* Card thumbnail */}
                  <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                    {spec.previewImageUrl ? (
                      <img
                        src={spec.previewImageUrl}
                        alt={spec.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                        <CategoryIcon className="h-8 w-8" />
                        <span className="text-[10px]">No preview</span>
                      </div>
                    )}
                  </div>
                  {/* Card label */}
                  <div className={cn(
                    "px-3 py-2 flex items-center gap-2 text-sm font-medium",
                    isSelected ? "bg-primary/10 text-primary" : "bg-card text-foreground"
                  )}>
                    <CategoryIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{spec.name}</span>
                  </div>
                </button>
                {/* Admin actions overlay */}
                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditDialog(spec); }}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background"
                  >
                    <Pencil className="h-3 w-3 text-foreground" />
                  </button>
                )}
                {/* Download link */}
                {spec.downloadUrl && (
                  <a
                    href={spec.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute top-1.5 h-6 w-6 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-background",
                      canEdit ? "right-9" : "right-1.5"
                    )}
                    title="Download template"
                  >
                    <Download className="h-3 w-3 text-foreground" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Builder UI */}
      {selectedSpec ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Spec Items */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Specification Items</h3>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(selectedSpec)} className="gap-1">
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleAddItem} className="gap-1">
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSpec(selectedSpec.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Download link bar */}
              {selectedSpec.downloadUrl && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                  <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a href={selectedSpec.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                    {selectedSpec.downloadUrl}
                  </a>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-shrink-0" asChild>
                    <a href={selectedSpec.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />Open
                    </a>
                  </Button>
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedSpecItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedSpecItems.map(item => (
                      <SortableSpecItem
                        key={item.id}
                        item={item}
                        isEditing={canEdit && editingItemId === item.id}
                        onEdit={canEdit ? () => setEditingItemId(item.id) : undefined}
                        onUpdate={canEdit ? (updates) => handleUpdateItem(item.id, updates) : undefined}
                        onDelete={canEdit ? () => handleDeleteItem(item.id) : undefined}
                        onDoneEditing={() => setEditingItemId(null)}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {selectedSpecItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{canEdit ? 'No items yet. Click "Add Item" to get started.' : 'No items defined.'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel - Visual Preview */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Visual Preview</h3>
                <div className="flex gap-2">
                  {selectedSpec.previewImageUrl && (
                    <Button
                      size="sm"
                      variant={isDragMode ? "default" : "outline"}
                      onClick={() => setIsDragMode(!isDragMode)}
                      className="gap-1"
                    >
                      <Move className="h-3 w-3" />
                      {isDragMode ? 'Done Positioning' : 'Position Callouts'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-1"
                  >
                    {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showPreview ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1"
                    disabled={isUploadingPreview}
                  >
                    {isUploadingPreview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {isUploadingPreview ? 'Uploading…' : 'Upload Preview'}
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePreviewImageUpload}
                className="hidden"
              />

              {showPreview && (
                <div 
                  ref={previewContainerRef}
                  className={cn(
                    "relative bg-muted rounded-lg overflow-hidden",
                    isDragMode && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {selectedSpec.previewImageUrl ? (
                    <div className="relative w-full">
                      <img
                        src={selectedSpec.previewImageUrl}
                        alt={selectedSpec.name}
                        className="w-full h-auto object-contain pointer-events-none select-none"
                        draggable={false}
                      />
                      {/* Hint overlay when in drag mode */}
                      {isDragMode && (
                        <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-end justify-center pb-4">
                          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                            Drag callouts to reposition them
                          </div>
                        </div>
                      )}
                      {/* Overlay callout badges - draggable when in drag mode */}
                      {selectedSpecItems.map((item, idx) => {
                        // Default positions spread vertically on the left side
                        const defaultY = 10 + (idx * (80 / Math.max(selectedSpecItems.length, 1)));
                        const itemWithDefaultPos = {
                          ...item,
                          position: item.position || { x: 5 + (idx % 3) * 5, y: defaultY }
                        };
                        
                        if (isDragMode) {
                          return (
                            <DraggableCallout
                              key={item.id}
                              item={itemWithDefaultPos}
                              primaryColor={primaryColor}
                              containerRef={previewContainerRef}
                              onPositionChange={handleCalloutPositionChange}
                            />
                          );
                        }
                        
                        const pos = itemWithDefaultPos.position;
                        return (
                          <div
                            key={item.id}
                            className="absolute w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-transform hover:scale-110"
                            style={{
                              backgroundColor: primaryColor,
                              left: `${pos.x}%`,
                              top: `${pos.y}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            title={item.title}
                          >
                            {item.number}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-[400px] text-muted-foreground cursor-pointer hover:text-accent transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 mb-2" />
                      <p className="text-sm font-medium">Upload a template preview image</p>
                      <p className="text-xs">The numbered callouts will overlay on this image</p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Reference Legend */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2" style={{ color: primaryColor }}>
                  Quick Reference
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedSpecItems.slice(0, 8).map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {item.number}
                      </span>
                      <span className="text-muted-foreground truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : templateSpecs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Template Specifications</h3>
            <p className="text-muted-foreground mb-4">
              {canEdit 
                ? 'Create visual specifications for your case studies, brochures, and document templates.'
                : 'No template specifications have been added yet.'}
            </p>
            {canEdit && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Template Spec
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a template specification above to edit.
          </CardContent>
        </Card>
      )}
    </section>
  );
};
