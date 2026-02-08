import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Home, Search, PlusSquare, Play, User, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

export const InstagramMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  handle = 'brandhandle',
  format,
  className 
}: FormatMockupProps) => {
  const isStoryOrReel = format === 'story' || format === 'reel';
  
  if (isStoryOrReel) {
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

        {/* Story/Reel content */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Story" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <span className="text-white/60 text-sm">Your Content</span>
            </div>
          )}
        </div>

        {/* Story progress bars */}
        {format === 'story' && (
          <div className="absolute top-10 left-3 right-3 z-20 flex gap-1">
            <div className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-white rounded-full" />
            </div>
            <div className="flex-1 h-0.5 bg-white/30 rounded-full" />
            <div className="flex-1 h-0.5 bg-white/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="absolute top-14 left-0 right-0 z-20 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-600">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
              )}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-lg">{handle}</span>
            <span className="text-white/70 text-xs">• 2h</span>
          </div>
          <div className="flex items-center gap-3">
            <MoreHorizontal className="w-5 h-5 text-white drop-shadow-lg" />
            <X className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Reel UI elements */}
        {format === 'reel' && (
          <>
            {/* Right side actions */}
            <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
              <div className="flex flex-col items-center gap-1">
                <Heart className="w-7 h-7 text-white drop-shadow-lg" />
                <span className="text-white text-xs font-medium">24.5K</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
                <span className="text-white text-xs font-medium">842</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Send className="w-7 h-7 text-white drop-shadow-lg" />
                <span className="text-white text-xs font-medium">Share</span>
              </div>
              <MoreHorizontal className="w-7 h-7 text-white drop-shadow-lg" />
              <div className="w-8 h-8 rounded border-2 border-white overflow-hidden mt-2">
                {imageUrl ? (
                  <img src={imageUrl} alt="Audio" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute left-3 right-16 bottom-20 z-20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-600">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  )}
                </div>
                <span className="text-white text-sm font-semibold drop-shadow-lg">{handle}</span>
                <button className="px-3 py-1 text-xs font-semibold text-white border border-white rounded">Follow</button>
              </div>
              <p className="text-white text-sm drop-shadow-lg line-clamp-2">
                Your caption goes here ✨ #brand #marketing
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded bg-white/20" />
                <span className="text-white text-xs">Original audio</span>
              </div>
            </div>
          </>
        )}

        {/* Story input */}
        {format === 'story' && (
          <div className="absolute left-3 right-3 bottom-8 z-20">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white/70 text-sm">
                Send message
              </div>
              <Heart className="w-6 h-6 text-white" />
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Bottom nav for reels */}
        {format === 'reel' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-black px-6 py-2 flex items-center justify-between">
            <Home className="w-6 h-6 text-white" />
            <Search className="w-6 h-6 text-white/60" />
            <PlusSquare className="w-6 h-6 text-white/60" />
            <Play className="w-6 h-6 text-white" fill="white" />
            <User className="w-6 h-6 text-white/60" />
          </div>
        )}

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
      </div>
    );
  }

  // Feed post
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200",
      "w-[320px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{handle}</p>
            <p className="text-xs text-gray-500">Sponsored</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-900" />
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Your Content
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-gray-900" />
            <MessageCircle className="w-6 h-6 text-gray-900" />
            <Send className="w-6 h-6 text-gray-900" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-900" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">1,234 likes</p>
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{handle}</span>{' '}
          <span className="text-gray-600">Your caption goes here ✨</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">View all 42 comments</p>
        <p className="text-xs text-gray-400 uppercase mt-1">2 hours ago</p>
      </div>
    </div>
  );
};
