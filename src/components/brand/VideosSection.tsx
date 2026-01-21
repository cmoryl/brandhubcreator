import { useState } from 'react';
import { Video, Plus, Trash2, ExternalLink, Play, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BrandVideo } from '@/types/brand';
import { SectionHeader } from './SectionHeader';

interface VideosSectionProps {
  videos: BrandVideo[];
  onVideosChange: (videos: BrandVideo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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

export const VideosSection = ({ videos, onVideosChange, customSubtitle, onSubtitleChange }: VideosSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [newVideo, setNewVideo] = useState<Partial<BrandVideo>>({
    title: '',
    url: '',
    type: 'youtube',
    description: ''
  });

  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) return;

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
    onVideosChange(videos.filter(v => v.id !== id));
  };

  const openVideo = (video: BrandVideo) => {
    if (video.type === 'direct') {
      window.open(video.url, '_blank');
    } else {
      window.open(video.url, '_blank');
    }
  };

  return (
    <section className="space-y-6">
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
              onSubtitleChange={onSubtitleChange}
              isEditing={isHeaderEditing}
              onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
            />
          </div>
        </div>
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
            
            return (
              <Card key={video.id} className="group overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {video.type !== 'direct' ? (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
