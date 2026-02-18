import { useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Download, User, Linkedin, Twitter, Globe, Upload, X, GripVertical } from 'lucide-react';
import { EventSpeaker } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { toast } from 'sonner';

interface EventSpeakersSectionProps {
  speakers: EventSpeaker[];
  onUpdate: (speakers: EventSpeaker[]) => void;
  isEditable: boolean;
  eventId?: string;
}

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'twitter', label: 'X / Twitter', icon: Twitter },
  { value: 'website', label: 'Website', icon: Globe },
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'linkedin': return <Linkedin className="h-4 w-4" />;
    case 'twitter': return <Twitter className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
};

const emptySpeaker: Omit<EventSpeaker, 'id'> = {
  name: '',
  title: '',
  company: '',
  bio: '',
  photoUrl: '',
  socialLinks: [],
};

export function EventSpeakersSection({
  speakers,
  onUpdate,
  isEditable,
  eventId,
}: EventSpeakersSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<EventSpeaker, 'id'>>(emptySpeaker);
  const [newSocialPlatform, setNewSocialPlatform] = useState('linkedin');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const { uploadFile, isUploading } = useStorageUpload({ entityType: 'event', entityId: eventId });

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      const result = await uploadFile(file, 'asset', `speaker-${Date.now()}`);
      if (result) {
        setDraft(prev => ({ ...prev, photoUrl: result.url }));
      }
    } catch {
      toast.error('Failed to upload photo');
    }
  }, [uploadFile]);

  const openAdd = () => {
    setDraft({ ...emptySpeaker, socialLinks: [] });
    setEditingId(null);
    setIsAdding(true);
  };

  const openEdit = (speaker: EventSpeaker) => {
    setDraft({
      name: speaker.name,
      title: speaker.title,
      company: speaker.company || '',
      bio: speaker.bio || '',
      photoUrl: speaker.photoUrl || '',
      socialLinks: speaker.socialLinks || [],
    });
    setEditingId(speaker.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!draft.name.trim() || !draft.title.trim()) {
      toast.error('Name and title are required');
      return;
    }
    if (editingId) {
      onUpdate(speakers.map(s => s.id === editingId ? { ...s, ...draft } : s));
    } else {
      onUpdate([...speakers, { id: crypto.randomUUID(), ...draft }]);
    }
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(speakers.filter(s => s.id !== id));
  };

  const addSocialLink = () => {
    if (!newSocialUrl.trim()) return;
    setDraft(prev => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { platform: newSocialPlatform, url: newSocialUrl.trim() }],
    }));
    setNewSocialUrl('');
  };

  const removeSocialLink = (idx: number) => {
    setDraft(prev => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((_, i) => i !== idx),
    }));
  };

  const handleDownloadVCard = (speaker: EventSpeaker) => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${speaker.name}`,
      `TITLE:${speaker.title}`,
      speaker.company ? `ORG:${speaker.company}` : null,
      speaker.bio ? `NOTE:${speaker.bio.replace(/\n/g, '\\n')}` : null,
      speaker.photoUrl ? `PHOTO;VALUE=uri:${speaker.photoUrl}` : null,
      ...(speaker.socialLinks || []).map(sl => `URL;type=${sl.platform}:${sl.url}`),
      'END:VCARD',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([lines], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${speaker.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded contact card for ${speaker.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-serif font-semibold">Speakers</h2>
        {isEditable && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Speaker
          </Button>
        )}
      </div>

      {speakers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No speakers added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {speakers.map((speaker) => (
            <Card key={speaker.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
              {/* Photo area */}
              <div className="relative h-48 bg-muted flex items-center justify-center overflow-hidden">
                {speaker.photoUrl ? (
                  <img
                    src={speaker.photoUrl}
                    alt={speaker.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                      {getInitials(speaker.name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => handleDownloadVCard(speaker)}
                    title="Download contact"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {isEditable && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => openEdit(speaker)}
                        title="Edit speaker"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDelete(speaker.id)}
                        title="Remove speaker"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-base leading-tight">{speaker.name}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{speaker.title}</p>
                {speaker.company && (
                  <p className="text-xs text-muted-foreground">{speaker.company}</p>
                )}
                {speaker.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{speaker.bio}</p>
                )}
                {speaker.socialLinks && speaker.socialLinks.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {speaker.socialLinks.map((sl, i) => (
                      <a
                        key={i}
                        href={sl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {getSocialIcon(sl.platform)}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding} onOpenChange={(open) => { if (!open) { setIsAdding(false); setEditingId(null); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Speaker' : 'Add Speaker'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                {draft.photoUrl ? (
                  <AvatarImage src={draft.photoUrl} alt="Speaker" />
                ) : (
                  <AvatarFallback className="bg-muted">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" asChild disabled={isUploading}>
                    <span><Upload className="h-3 w-3 mr-1" />{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                  </Button>
                </label>
                {draft.photoUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setDraft(prev => ({ ...prev, photoUrl: '' }))}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
              {/* Or paste URL */}
              <Input
                placeholder="Or paste image URL..."
                value={draft.photoUrl || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, photoUrl: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={draft.name} onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Speaker name" />
            </div>
            <div className="space-y-2">
              <Label>Title / Role *</Label>
              <Input value={draft.title} onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. VP of Marketing" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={draft.company || ''} onChange={(e) => setDraft(prev => ({ ...prev, company: e.target.value }))} placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={draft.bio || ''}
                onChange={(e) => setDraft(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief speaker bio..."
                rows={3}
              />
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <Label>Social Links</Label>
              {draft.socialLinks && draft.socialLinks.length > 0 && (
                <div className="space-y-1">
                  {draft.socialLinks.map((sl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {getSocialIcon(sl.platform)}
                      <span className="truncate flex-1">{sl.url}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSocialLink(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="URL"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8" onClick={addSocialLink}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Speaker'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
