import { forwardRef } from 'react';
import { ImageIcon, Video, Move, Upload, Loader2, Check, FolderOpen } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { cn } from '@/lib/utils';

interface HeroEditToolbarProps {
  useVideo: boolean;
  kenBurnsEffect: boolean;
  kenBurnsPreview: boolean;
  isUploading: boolean;
  onMediaTypeChange: (type: 'image' | 'video') => void;
  onKenBurnsToggle: () => void;
  onKenBurnsPreviewStart: () => void;
  onKenBurnsPreviewEnd: () => void;
  onUploadClick: () => void;
  onVideoUrlClick: () => void;
  onLibrarySelect: (url: string) => void;
}

export const HeroEditToolbar = forwardRef<HTMLDivElement, HeroEditToolbarProps>(
  function HeroEditToolbar({
    useVideo,
    kenBurnsEffect,
    kenBurnsPreview,
    isUploading,
    onMediaTypeChange,
    onKenBurnsToggle,
    onKenBurnsPreviewStart,
    onKenBurnsPreviewEnd,
    onUploadClick,
    onVideoUrlClick,
    onLibrarySelect,
  }, ref) {
    return (
      <div 
        ref={ref}
        className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity"
      >
        {/* Consolidated toolbar container */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl max-w-md w-full mx-4 space-y-3 pointer-events-auto">
          {/* Row 1: Media Type Toggle */}
          <div className="flex items-center justify-center">
            <ToggleGroup 
              type="single" 
              value={useVideo ? 'video' : 'image'} 
              onValueChange={(val) => val && onMediaTypeChange(val as 'image' | 'video')}
              className="bg-white/10 rounded-xl p-1 border border-white/10"
            >
              <ToggleGroupItem 
                value="image" 
                className="text-white data-[state=on]:bg-white/20 data-[state=on]:text-white rounded-lg px-4 py-2 text-sm gap-2"
                title="Use static image background"
              >
                <ImageIcon className="h-4 w-4" />
                Image
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="video" 
                className="text-white data-[state=on]:bg-white/20 data-[state=on]:text-white rounded-lg px-4 py-2 text-sm gap-2"
                title="Use looping video background"
              >
                <Video className="h-4 w-4" />
                Video
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Row 2: Upload & Library Actions */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium transition-all",
                isUploading ? "opacity-70 cursor-wait bg-white/5" : "hover:bg-white/15 bg-white/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isUploading) onUploadClick();
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {useVideo ? 'Video' : 'Image'}
                </>
              )}
            </button>

            {!useVideo && (
              <ImageLibraryPicker
                onSelect={onLibrarySelect}
                defaultCategory="Backgrounds"
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/15 bg-white/10 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Library
                  </button>
                }
              />
            )}

            {useVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoUrlClick();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/15 bg-white/10 transition-all"
              >
                Paste URL
              </button>
            )}
          </div>

          {/* Row 3: Ken Burns Effect (only for images) */}
          {!useVideo && (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onKenBurnsToggle();
                  }}
                  onMouseEnter={onKenBurnsPreviewStart}
                  onMouseLeave={onKenBurnsPreviewEnd}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium",
                    kenBurnsEffect
                      ? "bg-accent/30 border-accent/50 text-white" 
                      : kenBurnsPreview
                        ? "bg-white/20 border-white/30 text-white ring-2 ring-accent/40"
                        : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15 hover:text-white"
                  )}
                  title="Ken Burns: Slow cinematic pan and zoom effect (hover to preview)"
                >
                  <Move className="h-4 w-4" />
                  <span>
                    {kenBurnsPreview ? 'Preview...' : 'Ken Burns Effect'}
                  </span>
                  {kenBurnsEffect && <Check className="h-3 w-3 text-accent" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

HeroEditToolbar.displayName = 'HeroEditToolbar';
