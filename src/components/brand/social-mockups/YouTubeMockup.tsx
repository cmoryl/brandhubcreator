import { ThumbsUp, ThumbsDown, Share, MoreVertical, Bell, Play, Clock, ListVideo, Home, Compass, PlaySquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

export const YouTubeMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  handle = '@brandhandle',
  format,
  className 
}: FormatMockupProps) => {
  if (format === 'reel') {
    // YouTube Shorts
    return (
      <div className={cn(
        "relative bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] border-gray-800",
        "w-[280px] aspect-[9/19.5]",
        className
      )}>
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-3 flex items-center justify-between text-white text-xs">
          <span>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-white rounded-sm">
              <div className="w-3/4 h-full bg-white rounded-sm" />
            </div>
          </div>
        </div>

        {/* Shorts content */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Short" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF0000] to-[#282828] flex items-center justify-center">
              <span className="text-white/60 text-sm">Your Short</span>
            </div>
          )}
        </div>

        {/* YouTube Shorts branding */}
        <div className="absolute top-12 left-3 z-20">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
            <div className="w-5 h-5 bg-[#FF0000] rounded-sm flex items-center justify-center">
              <Play className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="text-white text-xs font-semibold">Shorts</span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">24K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ThumbsDown className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Dislike</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">842</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Share className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Share</span>
          </div>
          <div className="w-10 h-10 rounded border-2 border-white overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Audio" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#FF0000]" />
            )}
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute left-3 right-16 bottom-24 z-20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-600">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FF0000]" />
              )}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-lg">{handle}</span>
            <button className="px-3 py-1 text-xs font-semibold bg-white text-black rounded-full">Subscribe</button>
          </div>
          <p className="text-white text-sm drop-shadow-lg line-clamp-2">
            Your video title goes here #Shorts
          </p>
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#0f0f0f] px-6 py-2 flex items-center justify-between">
          <Home className="w-6 h-6 text-white/60" />
          <div className="relative">
            <div className="w-8 h-8 bg-[#FF0000] rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white" fill="white" />
            </div>
          </div>
          <Compass className="w-6 h-6 text-white/60" />
          <PlaySquare className="w-6 h-6 text-white/60" />
          <User className="w-6 h-6 text-white/60" />
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" />
      </div>
    );
  }

  // YouTube Thumbnail / Video Preview
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-xl overflow-hidden",
      "w-[400px]",
      className
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-900">
        {imageUrl ? (
          <img src={imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm bg-gradient-to-br from-[#FF0000]/20 to-[#282828]">
            Your Thumbnail (1280 x 720 px)
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1 py-0.5 rounded">
          10:24
        </div>
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      {/* Video info */}
      <div className="p-3 flex gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FF0000] flex items-center justify-center text-white font-bold text-sm">
              {brandName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            Your Video Title Goes Here - Make It Compelling and Click-Worthy
          </h3>
          <p className="text-[13px] text-gray-600 mt-1">{brandName}</p>
          <div className="flex items-center gap-1 text-[13px] text-gray-600">
            <span>1.2M views</span>
            <span>•</span>
            <span>2 days ago</span>
          </div>
        </div>
        <MoreVertical className="w-5 h-5 text-gray-600 flex-shrink-0" />
      </div>
    </div>
  );
};
