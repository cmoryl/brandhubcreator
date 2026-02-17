import { useState } from 'react';
import { Video, Plus, Trash2, ExternalLink, Play, Link2, Film, Clapperboard, Presentation, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EventVideo } from '@/types/event';
import { cn } from '@/lib/utils';
import { RichTextDisplay } from '@/components/ui/rich-text-editor';

interface EventVideosSectionProps {
  videos: EventVideo[];
  onUpdate: (videos: EventVideo[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const VIDEO_TYPES = [
  { value: 'promo', label: 'Promo', icon: Film },
  { value: 'recap', label: 'Recap', icon: Clapperboard },
  { value: 'speaker', label: 'Speaker', icon: Video },
  { value: 'stage', label: 'Stage Recording', icon: Tv },
  { value: 'testimonial', label: 'Testimonial', icon: Video },
  { value: 'teaser', label: 'Teaser', icon: Film },
  { value: 'slideshow', label: 'Slideshow', icon: Presentation },
  { value: 'livestream', label: 'Livestream', icon: Tv },
  { value: 'other', label: 'Other', icon: Video },
];

const getTypeColor = (type: EventVideo['type']) => {
  const colors: Record<string, string> = {
    'promo': 'bg-blue-100 text-blue-800',
    'recap': 'bg-green-100 text-green-800',
    'speaker': 'bg-purple-100 text-purple-800',
    'stage': 'bg-indigo-100 text-indigo-800',
    'testimonial': 'bg-pink-100 text-pink-800',
    'teaser': 'bg-orange-100 text-orange-800',
    'slideshow': 'bg-yellow-100 text-yellow-800',
    'livestream': 'bg-red-100 text-red-800',
    'other': 'bg-gray-100 text-gray-800',
  };
  return colors[type] || colors.other;
};

const extractVideoId = (url: string, platform: EventVideo['platform']): string | null => {
  if (platform === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }
  return null;
};

const detectPlatform = (url: string): EventVideo['platform'] => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('tv.transperfect.com')) return 'transperfect' as EventVideo['platform'];
  return 'direct';
};

const getEmbedUrl = (url: string, platform: EventVideo['platform']): string => {
  const videoId = extractVideoId(url, platform);
  if (platform === 'youtube' && videoId) return `https://www.youtube.com/embed/${videoId}`;
  if (platform === 'vimeo' && videoId) return `https://player.vimeo.com/video/${videoId}`;
  // TransPerfect TV public URLs work directly as iframe src
  if ((platform as string) === 'transperfect') return url;
  return url;
};

const getThumbnail = (url: string, platform: EventVideo['platform']): string | null => {
  if (platform === 'youtube') {
    const videoId = extractVideoId(url, platform);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  }
  return null;
};

export const EventVideosSection = ({ videos, onUpdate, isEditable = true, subtitle }: EventVideosSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newVideo, setNewVideo] = useState<Partial<EventVideo>>({
    title: '',
    url: '',
    type: 'promo',
    platform: 'youtube',
    description: '',
  });

  const handleAdd = () => {
    if (!newVideo.title || !newVideo.url) return;
    
    const platform = detectPlatform(newVideo.url || '');
    const video: EventVideo = {
      id: crypto.randomUUID(),
      title: newVideo.title,
      url: newVideo.url,
      type: newVideo.type as EventVideo['type'],
      platform,
      description: newVideo.description,
      thumbnailUrl: getThumbnail(newVideo.url, platform) || undefined,
      duration: newVideo.duration,
      year: newVideo.year,
    };
    
    onUpdate([...videos, video]);
    setNewVideo({ title: '', url: '', type: 'promo', platform: 'youtube', description: '' });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    onUpdate(videos.filter(v => v.id !== id));
  };

  // Group by type
  const groupedVideos = videos.reduce((acc, video) => {
    if (!acc[video.type]) acc[video.type] = [];
    acc[video.type].push(video);
    return acc;
  }, {} as Record<string, EventVideo[]>);

  const typeKeys = Object.keys(groupedVideos);
  const filteredVideos = activeTab === 'all' ? videos : groupedVideos[activeTab] || [];

  return (
    <section id="eventvideos" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Event Videos
          </h2>
          {subtitle ? (
            <RichTextDisplay html={subtitle} className="text-muted-foreground mt-1" />
          ) : (
            <p className="text-muted-foreground mt-1">Promo videos, stage recordings, recaps, and slideshows</p>
          )}
        </div>
        {isEditable && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Event Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newVideo.title || ''}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      placeholder="Opening Ceremony"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newVideo.type}
                      onValueChange={(value) => setNewVideo({ ...newVideo, type: value as EventVideo['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VIDEO_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={newVideo.url || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or tv.transperfect.com/..."
                  />
                  <p className="text-xs text-muted-foreground">Supports YouTube, Vimeo, TransPerfect TV, or direct video URLs</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (optional)</Label>
                    <Input
                      value={newVideo.duration || ''}
                      onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                      placeholder="5:30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year (optional)</Label>
                    <Input
                      type="number"
                      value={newVideo.year || ''}
                      onChange={(e) => setNewVideo({ ...newVideo, year: parseInt(e.target.value) })}
                      placeholder="2026"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newVideo.description || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!newVideo.title || !newVideo.url}>
                  Add Video
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Tabs */}
      {videos.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="all" className="text-xs">
              All ({videos.length})
            </TabsTrigger>
            {typeKeys.map((type) => {
              const typeInfo = VIDEO_TYPES.find(t => t.value === type);
              return (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {typeInfo?.label || type} ({groupedVideos[type].length})
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No event videos yet</h3>
            <p className="text-muted-foreground mb-4">Add promo videos, stage recordings, and recap content</p>
            {isEditable && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => {
            const embedUrl = getEmbedUrl(video.url, video.platform);
            const thumbnail = video.thumbnailUrl || getThumbnail(video.url, video.platform);
            
            return (
              <Card key={video.id} className="group overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {video.platform !== 'direct' && video.platform !== 'transperfect' ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                  ) : thumbnail ? (
                    <div className="relative w-full h-full">
                      <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => window.open(video.url, '_blank')}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                      >
                        <Play className="h-12 w-12 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => window.open(video.url, '_blank')}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                    >
                      <Link2 className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to open video</span>
                    </button>
                  )}
                  <Badge className={cn("absolute top-2 left-2", getTypeColor(video.type))}>
                    {VIDEO_TYPES.find(t => t.value === video.type)?.label}
                  </Badge>
                  {video.duration && (
                    <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white">
                      {video.duration}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{video.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="capitalize">{video.platform}</span>
                        {video.year && <span>• {video.year}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {isEditable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      {videos.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total Videos:</span>
              <span className="ml-2 font-medium">{videos.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Categories:</span>
              <span className="ml-2 font-medium">{typeKeys.length}</span>
            </div>
            {videos.some(v => v.year) && (
              <div>
                <span className="text-muted-foreground">Years:</span>
                <span className="ml-2 font-medium">
                  {[...new Set(videos.filter(v => v.year).map(v => v.year))].sort().join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
