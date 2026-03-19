import { useState } from 'react';
import { Plus, Building2, Globe, Mail, Phone, Trash2, MapPin, Calendar, Users, Pencil, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { BrandStudio } from '@/types/brand';
import { safeUUID } from '@/lib/safeUUID';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudiosSectionProps {
  studios: BrandStudio[];
  onStudiosChange?: (studios: BrandStudio[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  'coming-soon': { label: 'Coming Soon', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  archived: { label: 'Archived', className: 'bg-muted text-muted-foreground border-border' },
};

const emptyStudio = (): BrandStudio => ({
  id: safeUUID(),
  name: '',
  location: '',
  description: '',
  specialties: [],
  status: 'active',
});

export const StudiosSection = ({
  studios,
  onStudiosChange,
  customSubtitle,
  onSubtitleChange,
}: StudiosSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<BrandStudio | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState('');

  const canEdit = !!onStudiosChange;

  const openAdd = () => {
    setEditingStudio(emptyStudio());
    setSpecialtyInput('');
    setDialogOpen(true);
  };

  const openEdit = (studio: BrandStudio) => {
    setEditingStudio({ ...studio });
    setSpecialtyInput('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingStudio || !onStudiosChange) return;
    const exists = studios.find(s => s.id === editingStudio.id);
    if (exists) {
      onStudiosChange(studios.map(s => s.id === editingStudio.id ? editingStudio : s));
    } else {
      onStudiosChange([...studios, editingStudio]);
    }
    setDialogOpen(false);
    setEditingStudio(null);
  };

  const handleDelete = (id: string) => {
    onStudiosChange?.(studios.filter(s => s.id !== id));
  };

  const addSpecialty = () => {
    if (!editingStudio || !specialtyInput.trim()) return;
    setEditingStudio({
      ...editingStudio,
      specialties: [...(editingStudio.specialties || []), specialtyInput.trim()],
    });
    setSpecialtyInput('');
  };

  const removeSpecialty = (index: number) => {
    if (!editingStudio) return;
    setEditingStudio({
      ...editingStudio,
      specialties: (editingStudio.specialties || []).filter((_, i) => i !== index),
    });
  };

  const updateField = (field: keyof BrandStudio, value: string) => {
    if (!editingStudio) return;
    setEditingStudio({ ...editingStudio, [field]: value });
  };

  return (
    <div>
      <SectionHeader
        title="Our Studios"
        defaultSubtitle="The creative spaces and facilities we own and operate around the world."
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      {/* Studio cards */}
      {studios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {studios.map((studio) => {
            const statusStyle = STATUS_STYLES[studio.status || 'active'];
            return (
              <Card
                key={studio.id}
                className="group relative overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                {/* Image banner */}
                {studio.imageUrl ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={studio.imageUrl}
                      alt={studio.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary/30" />
                  </div>
                )}

                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-lg leading-tight">{studio.name}</h3>
                    {statusStyle && (
                      <Badge variant="outline" className={cn('text-[10px] shrink-0', statusStyle.className)}>
                        {statusStyle.label}
                      </Badge>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{studio.location}</span>
                  </div>

                  {/* Description */}
                  {studio.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {studio.description}
                    </p>
                  )}

                  {/* Specialties */}
                  {studio.specialties && studio.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {studio.specialties.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[11px] px-2 py-0.5">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    {studio.established && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Est. {studio.established}
                      </span>
                    )}
                    {studio.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {studio.capacity}
                      </span>
                    )}
                  </div>

                  {/* Contact links */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {studio.website && (
                      <a href={studio.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                    {studio.email && (
                      <a href={`mailto:${studio.email}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Mail className="h-3 w-3" /> Email
                      </a>
                    )}
                    {studio.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {studio.phone}
                      </span>
                    )}
                  </div>

                  {/* Edit/Delete controls - always visible for admins */}
                  {canEdit && (
                    <div className="flex gap-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openEdit(studio)}>
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(studio.id)}>
                        <Trash2 className="h-3 w-3" /> Remove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border/60 p-12 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">No studios added yet.</p>
          {canEdit && (
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" /> Add Your First Studio
            </Button>
          )}
        </div>
      )}

      {/* Add button when studios exist */}
      {canEdit && studios.length > 0 && (
        <div className="mt-4">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Studio
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudio && studios.find(s => s.id === editingStudio.id) ? 'Edit Studio' : 'Add Studio'}</DialogTitle>
          </DialogHeader>

          {editingStudio && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input value={editingStudio.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. London Post Production" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Location *</label>
                <Input value={editingStudio.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g. London, UK" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={editingStudio.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="What makes this studio special..." rows={3} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Image URL</label>
                <Input value={editingStudio.imageUrl || ''} onChange={e => updateField('imageUrl', e.target.value)} placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Established</label>
                  <Input value={editingStudio.established || ''} onChange={e => updateField('established', e.target.value)} placeholder="e.g. 2015" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Capacity</label>
                  <Input value={editingStudio.capacity || ''} onChange={e => updateField('capacity', e.target.value)} placeholder="e.g. 50 people" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={editingStudio.status || 'active'} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Specialties</label>
                <div className="flex gap-2">
                  <Input
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    placeholder="e.g. Post Production"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  />
                  <Button variant="outline" size="sm" onClick={addSpecialty} disabled={!specialtyInput.trim()}>Add</Button>
                </div>
                {editingStudio.specialties && editingStudio.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editingStudio.specialties.map((s, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {s}
                        <button onClick={() => removeSpecialty(i)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Website</label>
                  <Input value={editingStudio.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input value={editingStudio.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="studio@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <Input value={editingStudio.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editingStudio?.name || !editingStudio?.location}>Save Studio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
