import { useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Upload, Loader2, Link2, FileText,
  ChevronDown, Download
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { EventPrintMaterial } from '@/types/event';

// Extended interface for the print collateral section
export interface PrintCollateralItem extends EventPrintMaterial {
  liveFileUrl?: string;   // Live design file (Figma, Drive, Dropbox, etc.)
  printType?: string;     // More granular sub-type
}

interface EventPrintCollateralSectionProps {
  items: PrintCollateralItem[];
  onItemsChange?: (items: PrintCollateralItem[]) => void;
  isEditable?: boolean;
  eventId?: string;
}

// Sub-sections / categories grouping related types
const PRINT_SUBSECTIONS = [
  {
    id: 'collateral',
    label: 'Printed Collateral',
    types: ['brochure', 'flyer', 'poster', 'catalog', 'postcard', 'folder'] as const,
  },
  {
    id: 'event',
    label: 'Event Specifics',
    types: ['program', 'agenda', 'name-badge', 'ticket', 'lanyard', 'wristband'] as const,
  },
  {
    id: 'other',
    label: 'Other',
    types: ['other'] as const,
  },
] as const;

const PRINT_TYPES: Record<string, string> = {
  // Signage
  'booth-backdrop': 'Booth Backdrop',
  'pull-up-banner': 'Pull-Up Banner',
  'table-banner': 'Table Banner',
  'hanging-sign': 'Hanging Sign',
  'floor-graphic': 'Floor Graphic',
  'directional': 'Directional Sign',
  'podium-sign': 'Podium Sign',
  'stage-backdrop': 'Stage Backdrop',
  'outdoor-banner': 'Outdoor Banner',
  'registration': 'Registration Desk',
  'a-frame': 'A-Frame Sign',
  'step-repeat': 'Step & Repeat',
  'ceiling-banner': 'Ceiling Banner',
  'kiosk-wrap': 'Kiosk Wrap',
  'pop-up-display': 'Pop-Up Display',
  'feather-flag': 'Feather Flag',
  'canopy-tent': 'Canopy / Tent',
  'window-cling': 'Window Cling',
  'counter-display': 'Counter Display',
  // Collateral
  'brochure': 'Brochure',
  'flyer': 'Flyer',
  'poster': 'Poster',
  'catalog': 'Catalog',
  'postcard': 'Postcard',
  'folder': 'Presentation Folder',
  // Identity
  'business-card': 'Business Card',
  'badge': 'Badge',
  'letterhead': 'Letterhead',
  'envelope': 'Envelope',
  'sticker': 'Sticker / Label',
  // Event
  'program': 'Program / Booklet',
  'agenda': 'Agenda Card',
  'name-badge': 'Name Badge',
  'ticket': 'Ticket',
  'lanyard': 'Lanyard',
  'wristband': 'Wristband',
  // Other
  'other': 'Other',
};

const ALL_TYPE_OPTIONS = Object.entries(PRINT_TYPES).map(([value, label]) => ({ value, label }));

const getSubsectionForType = (type: string) => {
  for (const sub of PRINT_SUBSECTIONS) {
    if ((sub.types as readonly string[]).includes(type)) return sub.id;
  }
  return 'other';
};

const SUBSECTION_COLORS: Record<string, string> = {
  signage: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  collateral: 'bg-green-500/10 text-green-600 border-green-500/20',
  identity: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  event: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  other: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

// ── Empty / add dialog form state
interface FormState {
  name: string;
  type: string;
  dimensions: string;
  description: string;
  fileUrl: string;
  liveFileUrl: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'flyer',
  dimensions: '',
  description: '',
  fileUrl: '',
  liveFileUrl: '',
};

// ── Individual card
const PrintCard = ({
  item,
  canEdit,
  onDelete,
  onPreviewUpload,
  isUploadingPreview,
}: {
  item: PrintCollateralItem;
  canEdit: boolean;
  onDelete: (id: string) => void;
  onPreviewUpload: (id: string) => void;
  isUploadingPreview: boolean;
}) => {
  const label = PRINT_TYPES[item.type] || item.type;
  const subsection = getSubsectionForType(item.type);
  const colorCls = SUBSECTION_COLORS[subsection] || SUBSECTION_COLORS.other;

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {/* Preview image / placeholder */}
      <div className="relative aspect-[4/3] bg-muted/40 flex items-center justify-center overflow-hidden">
        {item.previewUrl ? (
          <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-muted-foreground/30" />
        )}

        {isUploadingPreview && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary-foreground animate-spin" />
          </div>
        )}

        {/* Hover overlay */}
        {canEdit && !isUploadingPreview && (
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              title="Upload preview image"
              onClick={() => onPreviewUpload(item.id)}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Type badge */}
        <Badge variant="outline" className={`absolute top-2 left-2 text-[10px] ${colorCls}`}>
          {label}
        </Badge>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-medium line-clamp-1">{item.name}</p>

        {item.dimensions && (
          <p className="text-xs text-muted-foreground">{item.dimensions}</p>
        )}

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5 pt-1 flex-wrap">
          {item.liveFileUrl && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 flex-1"
              onClick={() => window.open(item.liveFileUrl, '_blank')}
            >
              <Link2 className="h-3 w-3" />
              Live File
            </Button>
          )}
          {item.fileUrl && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 flex-1"
              asChild
            >
              <a href={item.fileUrl} download target="_blank" rel="noreferrer">
                <Download className="h-3 w-3" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const EventPrintCollateralSection = ({
  items,
  onItemsChange,
  isEditable = false,
  eventId,
}: EventPrintCollateralSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploadingPreviewId, setUploadingPreviewId] = useState<string | null>(null);
  const [targetPreviewId, setTargetPreviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useStorageUpload({ entityType: 'event', entityId: eventId || '' });

  const grouped = PRINT_SUBSECTIONS.map((sub) => ({
    ...sub,
    items: items.filter((it) => getSubsectionForType(it.type) === sub.id),
  })).filter((sub) => sub.items.length > 0 || isEditable);

  const handleAdd = () => {
    if (!form.name || !onItemsChange) return;
    const newItem: PrintCollateralItem = {
      id: crypto.randomUUID(),
      name: form.name,
      type: form.type as PrintCollateralItem['type'],
      dimensions: form.dimensions || undefined,
      description: form.description || undefined,
      fileUrl: form.fileUrl || undefined,
      liveFileUrl: form.liveFileUrl || undefined,
    };
    onItemsChange([...items, newItem]);
    setForm(EMPTY_FORM);
    setIsDialogOpen(false);
    toast.success('Print collateral item added');
  };

  const handleDelete = (id: string) => {
    if (!onItemsChange) return;
    onItemsChange(items.filter((it) => it.id !== id));
    toast.success('Item removed');
  };

  const handlePreviewUpload = (id: string) => {
    setTargetPreviewId(id);
    fileInputRef.current?.click();
  };

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPreviewId || !onItemsChange || !eventId) return;

    setUploadingPreviewId(targetPreviewId);
    try {
      const result = await uploadFile(file, 'asset', `print-preview-${targetPreviewId}`);
      if (result?.url) {
        onItemsChange(items.map((it) => it.id === targetPreviewId ? { ...it, previewUrl: result.url } : it));
        toast.success('Preview image updated');
      }
    } catch {
      toast.error('Failed to upload preview image');
    } finally {
      setUploadingPreviewId(null);
      setTargetPreviewId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [targetPreviewId, onItemsChange, items, eventId, uploadFile]);


  return (
    <section className="space-y-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
            Print Collateral
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Signage, printed materials, identity collateral, and event-specific print assets
          </p>
        </div>
        {isEditable && onItemsChange && (
          <Button size="sm" className="gap-2 shrink-0" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-lg border border-primary/20">
          <FileText className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{items.length} print item{items.length !== 1 ? 's' : ''}</span>
            {' across '}
            <span className="font-medium text-foreground">
              {PRINT_SUBSECTIONS.filter(sub => items.some(it => getSubsectionForType(it.type) === sub.id)).length} categories
            </span>
          </p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-30" />
          <div className="text-center">
            <p className="text-sm font-medium">No print collateral yet</p>
            {isEditable && <p className="text-xs">Add signage, brochures, badges, and more</p>}
          </div>
        </div>
      )}

      {/* Sub-sections – accordion style matching EventSignageSection */}
      <div className="space-y-3">
        {grouped.map((sub) => (
          <Collapsible key={sub.id} defaultOpen={false}>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors group/trigger">
              <div className="flex items-center gap-3">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]/trigger:-rotate-90" />
                <h3 className="font-semibold text-base">{sub.label}</h3>
                <Badge variant="secondary" className="font-normal text-xs">
                  {sub.items.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 group-data-[state=open]/trigger:hidden">
                {sub.items.slice(0, 4).map((item) => (
                  item.previewUrl ? (
                    <div key={item.id} className="h-8 w-12 rounded border border-border/40 overflow-hidden bg-muted shrink-0">
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div key={item.id} className="h-8 w-12 rounded border border-border/40 bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )
                ))}
                {sub.items.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">+{sub.items.length - 4}</span>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sub.items.map((item) => (
                  <PrintCard
                    key={item.id}
                    item={item}
                    canEdit={isEditable}
                    onDelete={handleDelete}
                    onPreviewUpload={handlePreviewUpload}
                    isUploadingPreview={uploadingPreviewId === item.id}
                  />
                ))}
                {isEditable && onItemsChange && (
                  <button
                    onClick={() => {
                      setForm({ ...EMPTY_FORM, type: (sub.types as readonly string[])[0] || 'other' });
                      setIsDialogOpen(true);
                    }}
                    className="aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Add</span>
                  </button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>


      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">
            Print Collateral
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Signage, printed materials, identity collateral, and event-specific print assets
          </p>
        </div>
        {isEditable && onItemsChange && (
          <Button size="sm" className="gap-2 shrink-0" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-lg border border-primary/20">
          <FileText className="h-4 w-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{items.length} print item{items.length !== 1 ? 's' : ''}</span>
            {' across '}
            <span className="font-medium text-foreground">
              {PRINT_SUBSECTIONS.filter(sub => items.some(it => getSubsectionForType(it.type) === sub.id)).length} categories
            </span>
          </p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-30" />
          <div className="text-center">
            <p className="text-sm font-medium">No print collateral yet</p>
            {isEditable && <p className="text-xs">Add signage, brochures, badges, and more</p>}
          </div>
        </div>
      )}



      {/* Add dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Print Collateral</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Event Main Backdrop"
                />
              </div>

              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {PRINT_SUBSECTIONS.map((sub) => (
                      <div key={sub.id}>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {sub.label}
                        </div>
                        {(sub.types as readonly string[]).map((t) => (
                          <SelectItem key={t} value={t}>{PRINT_TYPES[t] || t}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dimensions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={form.dimensions}
                  onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  placeholder="e.g. 10ft × 8ft, A3"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Usage context, print specs, material notes…"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Live File URL
                  <span className="text-muted-foreground font-normal text-xs">(Figma, Drive, Dropbox…)</span>
                </Label>
                <Input
                  value={form.liveFileUrl}
                  onChange={(e) => setForm({ ...form, liveFileUrl: e.target.value })}
                  placeholder="https://www.figma.com/file/..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download / Export URL
                  <span className="text-muted-foreground font-normal text-xs">(PDF, print-ready file…)</span>
                </Label>
                <Input
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
              💡 After adding, hover any card to upload a preview image from your device.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
