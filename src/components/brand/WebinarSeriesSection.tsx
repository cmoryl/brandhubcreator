import { useState, useMemo } from 'react';
import {
  Plus, Video, Calendar, Users, ExternalLink, Trash2, Edit2, X, Search,
  ChevronDown, ChevronUp, Sparkles, Loader2, Check, ArrowUpDown, Type, Activity,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

interface DiscoveredWebinar extends Omit<WebinarItem, 'id'> {
  sourceNote?: string;
}

interface WebinarSeriesSectionProps {
  webinars: WebinarItem[];
  onWebinarsChange?: (webinars: WebinarItem[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** Entity context for AI discovery — required for the AI button to appear */
  entityName?: string;
  entityType?: 'brand' | 'product' | 'event';
  industry?: string;
  websiteUrl?: string;
}

export const WebinarSeriesSection = ({
  webinars = [],
  onWebinarsChange,
  customSubtitle,
  onSubtitleChange,
  entityName,
  entityType,
  industry,
  websiteUrl,
}: WebinarSeriesSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title' | 'status' | 'manual'>('date-desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'live' | 'recorded'>('all');
  const [newWebinar, setNewWebinar] = useState<Partial<WebinarItem>>({
    title: '',
    description: '',
    status: 'upcoming',
  });

  // AI discovery state
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredWebinar[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const canEdit = !!onWebinarsChange;
  const canDiscover = canEdit && !!entityName;

  // 3 columns × 2 rows = 6 items visible by default
  const INITIAL_VISIBLE = 6;

  const filteredWebinars = useMemo(() => {
    let list = webinars;
    if (statusFilter !== 'all') {
      list = list.filter(w => (w.status || 'upcoming') === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.date?.includes(q) ||
        w.speakers?.some(s => s.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'manual') return list;

    const sorted = [...list];
    const statusRank: Record<string, number> = { live: 0, upcoming: 1, recorded: 2 };
    const dateValue = (d?: string) => (d ? new Date(d).getTime() || 0 : 0);

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return dateValue(b.date) - dateValue(a.date);
        case 'date-asc': {
          const av = dateValue(a.date), bv = dateValue(b.date);
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          return av - bv;
        }
        case 'title': return a.title.localeCompare(b.title);
        case 'status': return (statusRank[a.status || 'upcoming'] ?? 99) - (statusRank[b.status || 'upcoming'] ?? 99);
        default: return 0;
      }
    });
    return sorted;
  }, [webinars, searchQuery, sortBy, statusFilter]);

  const visibleWebinars = showAll ? filteredWebinars : filteredWebinars.slice(0, INITIAL_VISIBLE);
  const hasMore = filteredWebinars.length > INITIAL_VISIBLE;

  const sortLabels: Record<typeof sortBy, string> = {
    'date-desc': 'Newest First',
    'date-asc': 'Oldest First',
    'title': 'Title A–Z',
    'status': 'Status (Live → Upcoming → Recorded)',
    'manual': 'Manual Order',
  };

  const statusCounts = useMemo(() => ({
    all: webinars.length,
    upcoming: webinars.filter(w => (w.status || 'upcoming') === 'upcoming').length,
    live: webinars.filter(w => w.status === 'live').length,
    recorded: webinars.filter(w => w.status === 'recorded').length,
  }), [webinars]);

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

  const runDiscovery = async () => {
    if (!entityName) return;
    setDiscovering(true);
    setDiscovered([]);
    setSelected({});
    try {
      const { data, error } = await supabase.functions.invoke('discover-webinars', {
        body: {
          entityName,
          entityType,
          industry,
          websiteUrl,
          existingWebinars: webinars.map(w => ({ title: w.title, date: w.date })),
          limit: 10,
        },
      });
      if (error) throw error;
      const found: DiscoveredWebinar[] = Array.isArray(data?.webinars) ? data.webinars : [];
      setDiscovered(found);
      // Pre-select all
      setSelected(Object.fromEntries(found.map((_, i) => [i, true])));
      if (found.length === 0) {
        toast.info('No new webinars found. Your list looks up to date!');
      } else {
        toast.success(`Found ${found.length} potential webinar${found.length === 1 ? '' : 's'}`);
      }
    } catch (e) {
      console.error('discover-webinars failed', e);
      const msg = e instanceof Error ? e.message : 'Discovery failed';
      toast.error(msg);
    } finally {
      setDiscovering(false);
    }
  };

  const importSelected = () => {
    if (!onWebinarsChange) return;
    const toAdd = discovered
      .filter((_, i) => selected[i])
      .map<WebinarItem>(w => ({
        id: crypto.randomUUID(),
        title: w.title,
        description: w.description,
        date: w.date,
        duration: w.duration,
        registrationUrl: w.registrationUrl,
        recordingUrl: w.recordingUrl,
        speakers: w.speakers,
        status: w.status || (w.date && new Date(w.date) > new Date() ? 'upcoming' : 'recorded'),
      }));
    if (!toAdd.length) {
      toast.info('Nothing selected');
      return;
    }
    onWebinarsChange([...webinars, ...toAdd]);
    toast.success(`Added ${toAdd.length} webinar${toAdd.length === 1 ? '' : 's'}`);
    setDiscoverOpen(false);
    setDiscovered([]);
    setSelected({});
  };

  const openDiscovery = () => {
    setDiscoverOpen(true);
    if (discovered.length === 0 && !discovering) {
      void runDiscovery();
    }
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

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Webinar Series"
            defaultSubtitle="On-demand and upcoming webinar content"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={canEdit ? () => setIsHeaderEditing(!isHeaderEditing) : undefined}
          />
        </div>
        {canDiscover && (
          <Button
            onClick={openDiscovery}
            size="sm"
            variant="outline"
            className="gap-2 shrink-0"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Discover with AI
          </Button>
        )}
      </div>

      {/* Search + Sort + Filter toolbar */}
      {webinars.length > 1 && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          {webinars.length > INITIAL_VISIBLE && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowAll(true); }}
                placeholder="Search by title, description, speaker, date..."
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter chips */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 border border-border/50">
              {(['all', 'upcoming', 'live', 'recorded'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded transition-colors capitalize",
                    statusFilter === s
                      ? "bg-background text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s} <span className="opacity-60 ml-0.5">({statusCounts[s]})</span>
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="text-xs">{sortLabels[sortBy]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Sort webinars</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('date-desc')} className="gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5" /> Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date-asc')} className="gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5" /> Oldest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('title')} className="gap-2 text-sm">
                  <Type className="h-3.5 w-3.5" /> Title A–Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('status')} className="gap-2 text-sm">
                  <Activity className="h-3.5 w-3.5" /> By status
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('manual')} className="gap-2 text-sm">
                      <ArrowUpDown className="h-3.5 w-3.5" /> Manual order
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            {webinar.thumbnailUrl ? (
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img src={webinar.thumbnailUrl} alt={webinar.title} className="w-full h-full object-cover" />
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
                  <Input value={webinar.title} onChange={(e) => updateWebinar(webinar.id, { title: e.target.value })} placeholder="Webinar title" className="h-8" />
                  <Input value={webinar.description || ''} onChange={(e) => updateWebinar(webinar.id, { description: e.target.value })} placeholder="Description" className="h-8" />
                  <Input type="date" value={webinar.date || ''} onChange={(e) => updateWebinar(webinar.id, { date: e.target.value })} className="h-8" />
                  <Input value={webinar.registrationUrl || ''} onChange={(e) => updateWebinar(webinar.id, { registrationUrl: e.target.value })} placeholder="Registration URL" className="h-8" />
                  <Input value={webinar.recordingUrl || ''} onChange={(e) => updateWebinar(webinar.id, { recordingUrl: e.target.value })} placeholder="Recording URL" className="h-8" />
                  <Input value={webinar.thumbnailUrl || ''} onChange={(e) => updateWebinar(webinar.id, { thumbnailUrl: e.target.value })} placeholder="Thumbnail URL" className="h-8" />
                  <div className="flex gap-2">
                    {(['upcoming', 'live', 'recorded'] as const).map((status) => (
                      <Button key={status} size="sm" variant={webinar.status === status ? 'default' : 'outline'} onClick={() => updateWebinar(webinar.id, { status })} className="flex-1 h-7 text-xs">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">Done</Button>
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
                        <a href={webinar.registrationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          Register <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {webinar.recordingUrl && (
                        <a href={webinar.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          Watch <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingId(webinar.id)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteWebinar(webinar.id)} className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors">
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
              <Input value={newWebinar.title || ''} onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })} placeholder="Webinar title" className="h-8" />
              <Input value={newWebinar.description || ''} onChange={(e) => setNewWebinar({ ...newWebinar, description: e.target.value })} placeholder="Description (optional)" className="h-8" />
              <Input type="date" value={newWebinar.date || ''} onChange={(e) => setNewWebinar({ ...newWebinar, date: e.target.value })} className="h-8" />
              <Input value={newWebinar.thumbnailUrl || ''} onChange={(e) => setNewWebinar({ ...newWebinar, thumbnailUrl: e.target.value })} placeholder="Thumbnail URL (optional)" className="h-8" />
              <div className="flex gap-2">
                {(['upcoming', 'live', 'recorded'] as const).map((status) => (
                  <Button key={status} size="sm" variant={newWebinar.status === status ? 'default' : 'outline'} onClick={() => setNewWebinar({ ...newWebinar, status })} className="flex-1 h-7 text-xs">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
              <Button onClick={addWebinar} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add Webinar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View More / View Less */}
      {hasMore && !searchQuery && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} className="gap-2">
            {showAll ? (
              <>Show Less <ChevronUp className="h-4 w-4" /></>
            ) : (
              <>View All {filteredWebinars.length} Webinars <ChevronDown className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}

      {webinars.length === 0 && !canEdit && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No webinars yet</h3>
            <p className="text-muted-foreground">No webinars have been added to this brand.</p>
          </CardContent>
        </Card>
      )}

      {/* AI Discovery dialog */}
      <Dialog open={discoverOpen} onOpenChange={setDiscoverOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Discover Webinars with AI
            </DialogTitle>
            <DialogDescription>
              AI will scan public sources for webinars hosted by{' '}
              <span className="font-medium text-foreground">{entityName}</span>{' '}
              that aren't already in your list. Review and select the ones to add.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[240px]">
            {discovering && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Searching for new webinars…</p>
              </div>
            )}

            {!discovering && discovered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No new webinars found. Your list looks up to date.
                </p>
                <Button size="sm" variant="outline" onClick={runDiscovery} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Search again
                </Button>
              </div>
            )}

            {!discovering && discovered.length > 0 && (
              <ScrollArea className="max-h-[420px] pr-3">
                <div className="space-y-2">
                  {discovered.map((w, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selected[i]
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={!!selected[i]}
                        onCheckedChange={(v) => setSelected(s => ({ ...s, [i]: !!v }))}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight">{w.title}</h4>
                          {w.status && (
                            <Badge variant="outline" className={cn("text-[10px] shrink-0", getStatusColor(w.status))}>
                              {getStatusLabel(w.status)}
                            </Badge>
                          )}
                        </div>
                        {w.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{w.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {w.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(w.date).toLocaleDateString()}
                            </span>
                          )}
                          {w.speakers && w.speakers.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {w.speakers.slice(0, 2).join(', ')}
                              {w.speakers.length > 2 ? ` +${w.speakers.length - 2}` : ''}
                            </span>
                          )}
                          {(w.registrationUrl || w.recordingUrl) && (
                            <a
                              href={w.recordingUrl || w.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              Source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDiscovery}
              disabled={discovering}
              className="gap-2"
            >
              {discovering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Re-scan
            </Button>
            <Button
              onClick={importSelected}
              disabled={discovering || selectedCount === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Add {selectedCount > 0 ? `${selectedCount} ` : ''}webinar{selectedCount === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
