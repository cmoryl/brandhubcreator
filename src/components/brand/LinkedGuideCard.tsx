import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Trash2, GripVertical, Layers, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackgroundImage } from '@/components/ui/optimized-image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface GuideItem {
  id: string;
  name: string;
  guide_data?: unknown;
  type: 'brand' | 'product' | 'event';
}

interface LinkedGuideCardProps {
  guide: GuideItem;
  index: number;
  onOpen: (guide: GuideItem) => void;
  onUnlink: (guide: GuideItem) => void;
}

// Helper to resolve image paths - handles both public and src/assets paths
const resolveImagePath = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  
  // If it's already a full URL or data URL, return as-is
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  
  // If it starts with /, it's a public folder path - use as-is
  if (path.startsWith('/')) {
    return path;
  }
  
  // Otherwise, assume it's relative and add leading slash
  return `/${path}`;
};

export const LinkedGuideCard = ({ guide, index, onOpen, onUnlink }: LinkedGuideCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: guide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const guideData = guide.guide_data as any;
  const cardImage = resolveImagePath(guideData?.hero?.cardImage);
  const coverImage = resolveImagePath(guideData?.hero?.coverImage);
  const logoUrl = resolveImagePath(guideData?.hero?.logoUrl);
  const heroImage = cardImage || coverImage || logoUrl;
  const tagline = guideData?.hero?.tagline;
  const primaryColor = guideData?.colors?.[0]?.hex;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300 animate-scale-in touch-manipulation ${
        isDragging ? 'opacity-90 shadow-2xl ring-2 ring-primary/50' : ''
      }`}
      {...attributes}
    >
      {/* Drag Handle - Always visible on mobile for better discoverability */}
      <div
        {...listeners}
        className="absolute top-2 left-2 z-20 p-2 sm:p-1.5 bg-white/20 sm:bg-white/10 backdrop-blur-sm border border-white/30 sm:border-white/20 rounded-lg cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30 active:bg-white/40"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 sm:h-4 sm:w-4 text-white" />
      </div>

      {/* Clickable card area */}
      <div 
        className="cursor-pointer"
        onClick={() => onOpen(guide)}
      >
        {/* Guide Image/Cover - Optimized with lazy loading */}
        <BackgroundImage
          src={heroImage || ''}
          fallbackSrc="/placeholder.svg"
          className="relative h-48 sm:h-40"
          overlayClassName="bg-gradient-to-t from-black/60 via-transparent to-transparent"
        >
          {/* Fallback gradient if no image */}
          {!heroImage && (
            <div 
              className="absolute inset-0 -z-10"
              style={{ 
                background: primaryColor 
                  ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)` 
                  : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
              }}
            />
          )}
          
          {/* Type badge */}
          <div className="absolute top-2 left-12 z-20">
            <Badge 
              variant={guide.type === 'brand' ? 'default' : guide.type === 'event' ? 'outline' : 'secondary'}
              className={`text-xs ${guide.type === 'event' ? 'bg-primary/90 text-primary-foreground border-primary' : ''}`}
            >
              {guide.type === 'brand' ? (
                <><Layers className="h-3 w-3 mr-1" />Brand</>
              ) : guide.type === 'event' ? (
                <><Calendar className="h-3 w-3 mr-1" />Event</>
              ) : (
                <><Package className="h-3 w-3 mr-1" />Product</>
              )}
            </Badge>
          </div>
          
          {/* Logo overlay if different from cover */}
          {logoUrl && heroImage !== logoUrl && (
            <div className="absolute bottom-3 left-3 w-12 h-12 bg-white backdrop-blur-sm rounded-xl p-2 shadow-lg z-20">
              <img 
                src={logoUrl} 
                alt="" 
                className="w-full h-full object-contain" 
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          
          {/* Actions - Always visible on mobile, hover on desktop */}
          <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 bg-white/20 sm:bg-white/10 backdrop-blur-sm border border-white/30 sm:border-white/20 text-white hover:bg-white/30 active:bg-white/40"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(guide);
              }}
              aria-label="Open guide"
            >
              <ExternalLink className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-8 sm:w-8 bg-white/20 sm:bg-white/10 backdrop-blur-sm border border-white/30 sm:border-white/20 text-white hover:bg-destructive active:bg-destructive hover:text-white hover:border-destructive"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Unlink guide"
                >
                  <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unlink {guide.type === 'brand' ? 'Brand' : guide.type === 'event' ? 'Event' : 'Product'} Guide</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{guide.name}" from this brand guide. The {guide.type} guide itself will not be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onUnlink(guide)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Unlink
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </BackgroundImage>

        {/* Guide Info - Better spacing on mobile */}
        <div className="p-5 sm:p-4">
          <h3 className="font-semibold text-foreground text-lg sm:text-base truncate group-hover:text-primary transition-colors">
            {guide.name}
          </h3>
          {tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 sm:mt-1">
              {tagline}
            </p>
          )}
          
          {/* Color swatches preview */}
          {guideData?.colors?.length > 0 && (
            <div className="flex gap-1 mt-3">
              {guideData.colors.slice(0, 5).map((color: any, i: number) => (
                <div 
                  key={i}
                  className="w-5 h-5 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {guideData.colors.length > 5 && (
                <span className="text-xs text-muted-foreground self-center ml-1">
                  +{guideData.colors.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
