import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Music, Home, Search, PlusSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

export const TikTokMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  handle = '@brandhandle',
  className 
}: FormatMockupProps) => {
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

      {/* TikTok content */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt="TikTok" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
            <span className="text-white/60 text-sm">Your TikTok</span>
          </div>
        )}
      </div>

      {/* Top navigation */}
      <div className="absolute top-12 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <div className="w-6" /> {/* Spacer */}
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-[15px] font-medium">Following</span>
          <span className="text-white text-[15px] font-semibold relative">
            For You
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full" />
          </span>
        </div>
        <Search className="w-6 h-6 text-white" />
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-4">
        {/* Profile */}
        <div className="relative mb-2">
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-600">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#69C9D0] to-[#EE1D52]" />
            )}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#EE1D52] flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-medium">87.2K</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-white drop-shadow-lg scale-x-[-1]" />
          </div>
          <span className="text-white text-xs font-medium">1,234</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-medium">8,421</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full flex items-center justify-center">
            <Share className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </div>

        {/* Spinning album */}
        <div className="w-11 h-11 rounded-full border-[3px] border-gray-700 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="Album" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#69C9D0] to-[#EE1D52]" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-black" />
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute left-3 right-16 bottom-24 z-20">
        <p className="text-white text-[15px] font-semibold drop-shadow-lg">{handle}</p>
        <p className="text-white text-sm drop-shadow-lg line-clamp-2 mt-1">
          Your caption goes here ✨ #trending #fyp #viral
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Music className="w-4 h-4 text-white" />
          <div className="overflow-hidden">
            <p className="text-white text-xs whitespace-nowrap animate-marquee">
              Original sound - {brandName}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black px-2 py-2 flex items-center justify-around">
        <div className="flex flex-col items-center gap-0.5">
          <Home className="w-6 h-6 text-white" fill="white" />
          <span className="text-white text-[10px]">Home</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Search className="w-6 h-6 text-white/60" />
          <span className="text-white/60 text-[10px]">Discover</span>
        </div>
        <div className="relative -mt-4">
          <div className="w-11 h-8 rounded-lg overflow-hidden flex">
            <div className="w-1/2 bg-[#69C9D0] rounded-l-lg" />
            <div className="w-1/2 bg-[#EE1D52] rounded-r-lg" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-7 bg-white rounded-lg flex items-center justify-center">
              <PlusSquare className="w-5 h-5 text-black" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <svg viewBox="0 0 48 48" className="w-6 h-6 text-white/60" fill="currentColor">
            <path d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4zm0 36c-8.837 0-16-7.163-16-16S15.163 8 24 8s16 7.163 16 16-7.163 16-16 16z" />
          </svg>
          <span className="text-white/60 text-[10px]">Inbox</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <User className="w-6 h-6 text-white/60" />
          <span className="text-white/60 text-[10px]">Profile</span>
        </div>
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
    </div>
  );
};
