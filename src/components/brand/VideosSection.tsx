import { useState, useRef } from 'react';
import { Video, Plus, Trash2, ExternalLink, Play, Link2, ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrandVideo } from '@/types/brand';
import { SectionHeader } from './SectionHeader';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DiscoveredVideo {
  title: string;
  description?: string;
  url: string;
  type?: 'youtube' | 'vimeo' | 'direct';
  sourceNote?: string;
}

interface VideosSectionProps {
  videos: BrandVideo[];
  onVideosChange?: (videos: BrandVideo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  /** Entity context for AI discovery — required for the AI button to appear */
  entityName?: string;
  entityType?: 'brand' | 'product' | 'event';
  industry?: string;
  websiteUrl?: string;
}

type VideoType = 'youtube' | 'vimeo' | 'direct';

const extractVideoId = (url: string, type: VideoType): string | null => {
  if (type === 'youtube') {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  if (type === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }
  return null;
};

const detectVideoType = (url: string): VideoType => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
};

const getEmbedUrl = (url: string, type: VideoType): string => {
  const videoId = extractVideoId(url, type);
  if (type === 'youtube' && videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (type === 'vimeo' && videoId) {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  return url;
};

const getThumbnail = (url: string, type: VideoType): string | null => {
  if (type === 'youtube') {
    const videoId = extractVideoId(url, type);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  }
  return null;
};

export const VideosSection = ({ videos, onVideosChange, customSubtitle, onSubtitleChange, entityName, entityType, industry, websiteUrl }: VideosSectionProps) => {
  const canEdit = Boolean(onVideosChange);
  const canDiscover = canEdit && Boolean(entityName);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const targetVideoIdRef = useRef<string | null>(null);
  const [newVideo, setNewVideo] = useState<Partial<BrandVideo>>({
    title: '',
    url: '',
    type: 'youtube',
    description: ''
  });

  // AI discovery state
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredVideo[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const runDiscovery = async () => {
    if (!entityName) return;
    setDiscovering(true);
    setDiscovered([]);
    setSelected({});
    try {
      const { data, error } = await supabase.functions.invoke('discover-videos', {
        body: {
          entityName,
          entityType,
          industry,
          websiteUrl,
          existingVideos: videos.map((v) => ({ title: v.title, url: v.url })),
          limit: 10,
        },
      });
      if (error) throw error;
      const found: DiscoveredVideo[] = Array.isArray(data?.videos) ? data.videos : [];
      setDiscovered(found);
      setSelected(Object.fromEntries(found.map((_, i) => [i, true])));
      if (found.length === 0) {
        toast.info('No new videos found. Your list looks up to date!');
      } else {
        toast.success(`Found ${found.length} potential video${found.length === 1 ? '' : 's'}`);
      }
    } catch (e) {
      console.error('discover-videos failed', e);
      toast.error(e instanceof Error ? e.message : 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const importSelected = () => {
    if (!onVideosChange) return;
    const toAdd = discovered
      .filter((_, i) => selected[i])
      .map<BrandVideo>((v) => {
        const type = v.type || detectVideoType(v.url);
        return {
          id: crypto.randomUUID(),
          title: v.title,
          url: v.url,
          type,
          description: v.description || '',
          thumbnail: getThumbnail(v.url, type) || undefined,
        };
      });
    if (!toAdd.length) {
      toast.info('Nothing selected');
      return;
    }
    onVideosChange([...videos, ...toAdd]);
    toast.success(`Added ${toAdd.length} video${toAdd.length === 1 ? '' : 's'}`);
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

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url || !onVideosChange) return;

    const detectedType = detectVideoType(newVideo.url);
    const video: BrandVideo = {
      id: crypto.randomUUID(),
      title: newVideo.title,
      url: newVideo.url,
      type: detectedType,
      description: newVideo.description || '',
      thumbnail: getThumbnail(newVideo.url, detectedType) || undefined
    };

    onVideosChange([...videos, video]);
    setNewVideo({ title: '', url: '', type: 'youtube', description: '' });
    setIsDialogOpen(false);
  };

  const handleDeleteVideo = (id: string) => {
    if (!onVideosChange) return;
    onVideosChange(videos.filter(v => v.id !== id));
  };

  const openVideo = (video: BrandVideo) => {
    window.open(video.url, '_blank');
  };

  const handleCardImageClick = (videoId: string) => {
    targetVideoIdRef.current = videoId;
    imageInputRef.current?.click();
  };

  const handleCardImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const videoId = targetVideoIdRef.current;
    if (!file || !videoId || !onVideosChange) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingId(videoId);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const updated = videos.map(v =>
          v.id === videoId ? { ...v, thumbnail: dataUrl } : v
        );
        onVideosChange(updated);
        toast.success('Card image updated');
        setUploadingId(null);
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to update card image');
      setUploadingId(null);
    }

    // Reset input
    e.target.value = '';
    targetVideoIdRef.current = null;
  };

  return (
    <section className="space-y-6">
      {/* Hidden file input for card image replacement */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCardImageChange}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <SectionHeader
              title="Videos"
              defaultSubtitle="Brand video resources and tutorials"
              customSubtitle={customSubtitle}
              onSubtitleChange={canEdit ? onSubtitleChange : undefined}
              isEditing={isHeaderEditing}
              onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canDiscover && (
            <Button
              size="sm"
              variant="outline"
              onClick={openDiscovery}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Discover with AI
            </Button>
          )}
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title</Label>
                    <Input
                      id="video-title"
                      placeholder="Video title"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      placeholder="https://youtube.com/watch?v=... or direct .mp4 link"
                      value={newVideo.url}
                      onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports YouTube, Vimeo, or direct video URLs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-description">Description (optional)</Label>
                    <Textarea
                      id="video-description"
                      placeholder="Brief description of the video"
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddVideo} className="w-full">
                    Add Video
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No videos yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add YouTube, Vimeo, or direct video links to your brand resources
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const embedUrl = getEmbedUrl(video.url, video.type);
            const thumbnail = video.thumbnail || getThumbnail(video.url, video.type);
            const isUploading = uploadingId === video.id;
            
            return (
              <Card key={video.id} className="group overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail ? (
                    <div className="relative w-full h-full">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      <button
                        onClick={() => openVideo(video)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                      >
                        <Play className="h-12 w-12 text-white" />
                      </button>
                    </div>
                  ) : video.type !== 'direct' ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : thumbnail ? (
                    <div className="relative w-full h-full">
                      <img src={thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      <button
                        onClick={() => openVideo(video)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                      >
                        <Play className="h-12 w-12 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openVideo(video)}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                    >
                      <Link2 className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to open video</span>
                    </button>
                  )}

                  {/* Card image swap button for admins */}
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCardImageClick(video.id); }}
                      disabled={isUploading}
                      className="absolute top-2 left-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Change card image"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                          {video.type}
                        </span>
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
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteVideo(video.id)}
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
    </section>
  );
};
