import { useState, useMemo } from 'react';
import { Plus, Video, Calendar, Users, ExternalLink, Trash2, Edit2, X, Link2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface WebinarItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  registrationUrl?: string;
  recordingUrl?: string;
  thumbnailUrl?: string;
  speakers?: string[];
  status?: 'upcoming' | 'live' | 'recorded';
  attendees?: number;
}

interface WebinarSeriesSectionProps {
  webinars: WebinarItem[];
  onWebinarsChange?: (webinars: WebinarItem[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const WebinarSeriesSection = ({
  webinars = [],
  onWebinarsChange,
  customSubtitle,
  onSubtitleChange,
}: WebinarSeriesSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [newWebinar, setNewWebinar] = useState<Partial<WebinarItem>>({
    title: '',
    description: '',
    status: 'upcoming',
  });

  const canEdit = !!onWebinarsChange;

  // 3 columns × 2 rows = 6 items visible by default
  const INITIAL_VISIBLE = 6;

  const filteredWebinars = useMemo(() => {
    if (!searchQuery.trim()) return webinars;
    const q = searchQuery.toLowerCase();
    return webinars.filter(w =>
      w.title.toLowerCase().includes(q) ||
      w.description?.toLowerCase().includes(q) ||
      w.date?.includes(q)
    );
  }, [webinars, searchQuery]);

  const visibleWebinars = showAll ? filteredWebinars : filteredWebinars.slice(0, INITIAL_VISIBLE);
  const hasMore = filteredWebinars.length > INITIAL_VISIBLE;

  const addWebinar = () => {
    if (!onWebinarsChange || !newWebinar.title?.trim()) {
      toast.error('Please enter a webinar title');
      return;
    }

    const webinar: WebinarItem = {
      id: crypto.randomUUID(),
      title: newWebinar.title.trim(),
      description: newWebinar.description?.trim(),
      date: newWebinar.date,
      duration: newWebinar.duration,
      registrationUrl: newWebinar.registrationUrl,
      recordingUrl: newWebinar.recordingUrl,
      thumbnailUrl: newWebinar.thumbnailUrl,
      speakers: newWebinar.speakers,
      status: newWebinar.status || 'upcoming',
      attendees: newWebinar.attendees,
    };

    onWebinarsChange([...webinars, webinar]);
    setNewWebinar({ title: '', description: '', status: 'upcoming' });
    toast.success('Webinar added');
  };

  const updateWebinar = (id: string, updates: Partial<WebinarItem>) => {
    if (!onWebinarsChange) return;
    onWebinarsChange(webinars.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWebinar = (id: string) => {
    if (!onWebinarsChange) return;
    onWebinarsChange(webinars.filter(w => w.id !== id));
    toast.success('Webinar removed');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'live': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'recorded': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Recorded';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Webinar Series"
        defaultSubtitle="On-demand and upcoming webinar content"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isHeaderEditing}
        onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
      />

      {/* Search bar */}
      {webinars.length > INITIAL_VISIBLE && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowAll(true); }}
            placeholder="Search webinars..."
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Webinar grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleWebinars.map((webinar, index) => (
          <Card
            key={webinar.id}
            className="group overflow-hidden hover:border-primary/50 transition-colors animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Thumbnail */}
            {webinar.thumbnailUrl ? (
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={webinar.thumbnailUrl}
                  alt={webinar.title}
                  className="w-full h-full object-cover"
                />
                <Badge className={cn("absolute top-2 left-2 text-xs", getStatusColor(webinar.status))}>
                  {webinar.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />}
                  {getStatusLabel(webinar.status)}
                </Badge>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                <Video className="h-12 w-12 text-primary/40" />
                <Badge className={cn("absolute top-2 left-2 text-xs", getStatusColor(webinar.status))}>
                  {webinar.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5" />}
                  {getStatusLabel(webinar.status)}
                </Badge>
              </div>
            )}

            <CardContent className="p-4">
              {editingId === webinar.id && canEdit ? (
                <div className="space-y-3">
                  <Input
                    value={webinar.title}
                    onChange={(e) => updateWebinar(webinar.id, { title: e.target.value })}
                    placeholder="Webinar title"
                    className="h-8"
                  />
                  <Input
                    value={webinar.description || ''}
                    onChange={(e) => updateWebinar(webinar.id, { description: e.target.value })}
                    placeholder="Description"
                    className="h-8"
                  />
                  <Input
                    type="date"
                    value={webinar.date || ''}
                    onChange={(e) => updateWebinar(webinar.id, { date: e.target.value })}
                    className="h-8"
                  />
                  <Input
                    value={webinar.registrationUrl || ''}
                    onChange={(e) => updateWebinar(webinar.id, { registrationUrl: e.target.value })}
                    placeholder="Registration URL"
                    className="h-8"
                  />
                  <Input
                    value={webinar.recordingUrl || ''}
                    onChange={(e) => updateWebinar(webinar.id, { recordingUrl: e.target.value })}
                    placeholder="Recording URL"
                    className="h-8"
                  />
                  <Input
                    value={webinar.thumbnailUrl || ''}
                    onChange={(e) => updateWebinar(webinar.id, { thumbnailUrl: e.target.value })}
                    placeholder="Thumbnail URL"
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    {(['upcoming', 'live', 'recorded'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={webinar.status === status ? 'default' : 'outline'}
                        onClick={() => updateWebinar(webinar.id, { status })}
                        className="flex-1 h-7 text-xs"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">{webinar.title}</h4>
                  {webinar.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{webinar.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {webinar.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(webinar.date).toLocaleDateString()}
                      </span>
                    )}
                    {webinar.attendees && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {webinar.attendees}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {webinar.registrationUrl && (
                        <a
                          href={webinar.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Register <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {webinar.recordingUrl && (
                        <a
                          href={webinar.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Watch <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(webinar.id)}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteWebinar(webinar.id)}
                          className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Add webinar card */}
        {canEdit && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Plus className="h-4 w-4" />
                Add Webinar
              </div>
              <Input
                value={newWebinar.title || ''}
                onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })}
                placeholder="Webinar title"
                className="h-8"
              />
              <Input
                value={newWebinar.description || ''}
                onChange={(e) => setNewWebinar({ ...newWebinar, description: e.target.value })}
                placeholder="Description (optional)"
                className="h-8"
              />
              <Input
                type="date"
                value={newWebinar.date || ''}
                onChange={(e) => setNewWebinar({ ...newWebinar, date: e.target.value })}
                className="h-8"
              />
              <Input
                value={newWebinar.thumbnailUrl || ''}
                onChange={(e) => setNewWebinar({ ...newWebinar, thumbnailUrl: e.target.value })}
                placeholder="Thumbnail URL (optional)"
                className="h-8"
              />
              <div className="flex gap-2">
                {(['upcoming', 'live', 'recorded'] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={newWebinar.status === status ? 'default' : 'outline'}
                    onClick={() => setNewWebinar({ ...newWebinar, status })}
                    className="flex-1 h-7 text-xs"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
      </div>

      {/* View More / View Less */}
      {hasMore && !searchQuery && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? (
              <>Show Less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View All {filteredWebinars.length} Webinars <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}
              <Button onClick={addWebinar} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Webinar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {webinars.length === 0 && !canEdit && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No webinars yet</h3>
            <p className="text-muted-foreground">No webinars have been added to this brand.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
