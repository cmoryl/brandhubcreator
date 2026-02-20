import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Maximize, FileImage, Download, Eye, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { EventSignage } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { LayoutSelector, LayoutPreset, useLayoutClasses } from '@/components/brand/LayoutSelector';
import { PreviewDialog } from '@/components/ui/preview-dialog';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';
import { AddSignageDialog } from './AddSignageDialog';
import { EditSignageDialog } from './EditSignageDialog';

interface EventSignageSectionProps {
  signage: EventSignage[];
  onUpdate: (signage: EventSignage[]) => void;
  isEditable?: boolean;
  subtitle?: string;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
  brandName?: string;
  brandColors?: string[];
  eventId?: string;
}

const SIGNAGE_TYPES = [
  { value: 'booth-backdrop', label: 'Booth Backdrop' },
  { value: 'pull-up-banner', label: 'Pull-Up Banner' },
  { value: 'table-banner', label: 'Table Banner' },
  { value: 'hanging-sign', label: 'Hanging Sign' },
  { value: 'floor-graphic', label: 'Floor Graphic' },
  { value: 'directional', label: 'Directional Sign' },
  { value: 'podium-sign', label: 'Podium Sign' },
  { value: 'stage-backdrop', label: 'Stage Backdrop' },
  { value: 'outdoor-banner', label: 'Outdoor Banner' },
  { value: 'registration', label: 'Registration' },
  { value: 'technology-counter', label: 'Technology Counter' },
  { value: 'information-counter', label: 'Information Counter' },
  { value: 'large-backwall', label: 'Large Backwall' },
  { value: 'location-pillars', label: 'Location Pillars' },
  { value: 'map-pillars', label: 'Map Pillars' },
  { value: 'pillars', label: 'Pillars' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'other', label: 'Other' },
];

const getTypeColor = (type: EventSignage['type']) => {
  const colors: Record<string, string> = {
    'booth-backdrop': 'bg-blue-100 text-blue-800',
    'pull-up-banner': 'bg-green-100 text-green-800',
    'table-banner': 'bg-purple-100 text-purple-800',
    'hanging-sign': 'bg-orange-100 text-orange-800',
    'floor-graphic': 'bg-pink-100 text-pink-800',
    'directional': 'bg-cyan-100 text-cyan-800',
    'podium-sign': 'bg-amber-100 text-amber-800',
    'stage-backdrop': 'bg-indigo-100 text-indigo-800',
    'outdoor-banner': 'bg-yellow-100 text-yellow-800',
    'registration': 'bg-emerald-100 text-emerald-800',
    'technology-counter': 'bg-sky-100 text-sky-800',
    'information-counter': 'bg-teal-100 text-teal-800',
    'large-backwall': 'bg-violet-100 text-violet-800',
    'location-pillars': 'bg-rose-100 text-rose-800',
    'map-pillars': 'bg-lime-100 text-lime-800',
    'pillars': 'bg-stone-100 text-stone-800',
    'stairs': 'bg-fuchsia-100 text-fuchsia-800',
    'other': 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.other;
};

// Inline editable field component
const InlineEditField = ({ 
  value, 
  onSave, 
  className,
  inputClassName,
  isEditable 
}: { 
  value: string; 
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  isEditable: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) {
      onSave(editValue.trim());
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditable) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-6 py-0 px-1 text-sm", inputClassName)}
      />
    );
  }

  return (
    <span 
      className={cn(className, "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors")}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {value}
    </span>
  );
};

export const EventSignageSection = ({
  signage,
  onUpdate,
  isEditable = true,
  subtitle,
  layout = 'grid-3',
  onLayoutChange,
  brandName,
  brandColors,
  eventId,
}: EventSignageSectionProps) => {
  const { gridClass, cardClass, isListView } = useLayoutClasses(layout);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventSignage | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventSignage | null>(null);

  const openPreview = (item: EventSignage) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  const openEditDialog = (item: EventSignage) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleInlineUpdate = (id: string, field: 'name' | 'dimensions', value: string) => {
    onUpdate(signage.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAddSignage = (item: EventSignage) => {
    onUpdate([...signage, item]);
  };

  const handleEditSignage = (updatedItem: EventSignage) => {
    onUpdate(signage.map(s => s.id === updatedItem.id ? updatedItem : s));
  };

  const handleDelete = (id: string) => {
    onUpdate(signage.filter(s => s.id !== id));
  };

  // Group by type
  const groupedSignage = signage.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, EventSignage[]>);

  return (
    <section id="eventsignage" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold">Event Signage</h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">Physical signage specifications for booth, banners, and venue graphics</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditable && onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          {isEditable && (
            <AddSignageDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              onAdd={handleAddSignage}
              brandName={brandName}
              brandColors={brandColors}
              eventId={eventId}
            />
          )}
        </div>
      </div>

      {signage.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Maximize className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No signage specifications yet</h3>
            <p className="text-muted-foreground mb-4">Add booth backdrops, banners, and other physical event signage</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Signage
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedSignage).map(([type, items]) => (
            <Collapsible key={type} defaultOpen={false}>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors group/trigger">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]/trigger:-rotate-90" />
                  <h3 className="font-semibold text-base">
                    {SIGNAGE_TYPES.find(t => t.value === type)?.label || type}
                  </h3>
                  <Badge variant="secondary" className="font-normal text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 group-data-[state=open]/trigger:hidden">
                  {items.slice(0, 4).map((item) => (
                    item.previewUrl ? (
                      <div key={item.id} className="h-8 w-12 rounded border border-border/40 overflow-hidden bg-muted shrink-0">
                        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div key={item.id} className="h-8 w-12 rounded border border-border/40 bg-muted flex items-center justify-center shrink-0">
                        <FileImage className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )
                  ))}
                  {items.length > 4 && (
                    <span className="text-xs text-muted-foreground ml-1">+{items.length - 4}</span>
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className={gridClass}>
                  {items.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden hover:border-primary/50 transition-colors">
                      {item.previewUrl ? (
                        <div className="aspect-[16/9] bg-muted relative">
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                            {item.dimensions}
                          </Badge>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                          <div className="text-center">
                            <FileImage className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm font-mono text-muted-foreground">{item.dimensions}</p>
                          </div>
                          <Badge className={cn("absolute top-2 left-2", getTypeColor(item.type))}>
                            {SIGNAGE_TYPES.find(t => t.value === item.type)?.label}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">
                              <InlineEditField
                                value={item.name}
                                onSave={(v) => handleInlineUpdate(item.id, 'name', v)}
                                isEditable={isEditable}
                                inputClassName="font-semibold"
                              />
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              <InlineEditField
                                value={item.dimensions}
                                onSave={(v) => handleInlineUpdate(item.id, 'dimensions', v)}
                                isEditable={isEditable}
                                className="text-sm text-muted-foreground"
                              />
                            </p>
                          </div>
                          {isEditable && (
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.notes}</p>
                        )}
                        
                        {/* Action Buttons - Always visible */}
                        <div className="flex gap-2">
                          {item.previewUrl && (
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openPreview(item)}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              Preview
                            </Button>
                          )}
                          {item.templateUrl && (
                            <Button variant="default" size="sm" className="flex-1" asChild>
                              <a href={item.templateUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Download
                              </a>
                            </Button>
                          )}
                          {isEditable && !item.previewUrl && !item.templateUrl && (
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {signage.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Items:</span>
              <span className="ml-2 font-medium">{signage.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Types:</span>
              <span className="ml-2 font-medium">{Object.keys(groupedSignage).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">With Templates:</span>
              <span className="ml-2 font-medium">{signage.filter(s => s.templateUrl).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewItem?.name || 'Signage Preview'}
        previewUrl={previewItem?.previewUrl}
        externalUrl={previewItem?.previewUrl}
        type="image"
      />

      {/* Edit Dialog */}
      {editingItem && (
        <EditSignageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          signage={editingItem}
          onSave={handleEditSignage}
          onDelete={handleDelete}
          brandName={brandName}
          brandColors={brandColors}
          eventId={eventId}
        />
      )}
    </section>
  );
};
