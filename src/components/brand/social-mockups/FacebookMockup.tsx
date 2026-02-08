import { ThumbsUp, MessageCircle, Share, MoreHorizontal, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

// Helper to convert aspect ratio string like "1.91:1" or "4:5" to a CSS value
const getAspectRatioStyle = (aspectRatio?: string): string => {
  if (!aspectRatio) return '1.91/1';
  const parts = aspectRatio.split(':').map(Number);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }
  return '1.91/1';
};

export const FacebookMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  format,
  sizeSpec,
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
            <div className="w-full h-full bg-gradient-to-br from-[#1877F2] to-[#0A66C2] flex items-center justify-center">
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
          </div>
        )}

        {/* Header */}
        <div className="absolute top-14 left-0 right-0 z-20 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-600">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1877F2]" />
              )}
            </div>
            <div>
              <span className="text-white text-sm font-semibold drop-shadow-lg block">{brandName}</span>
              <span className="text-white/70 text-xs">2 hours ago</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MoreHorizontal className="w-5 h-5 text-white drop-shadow-lg" />
            <X className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Reel actions */}
        {format === 'reel' && (
          <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <ThumbsUp className="w-7 h-7 text-white drop-shadow-lg" />
              <span className="text-white text-xs font-medium">2.4K</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
              <span className="text-white text-xs font-medium">142</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Share className="w-7 h-7 text-white drop-shadow-lg" />
              <span className="text-white text-xs font-medium">Share</span>
            </div>
          </div>
        )}

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
      </div>
    );
  }

  // Feed post - Dynamic aspect ratio
  const aspectRatio = getAspectRatioStyle(sizeSpec?.aspectRatio);
  const sizeLabel = sizeSpec ? `${sizeSpec.width} x ${sizeSpec.height} px` : '1200 x 630 px';

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200",
      "w-[400px]",
      className
    )}>
      {/* Header */}
      <div className="p-3 flex items-start gap-2">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1877F2] flex items-center justify-center text-white font-bold">
              {brandName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-gray-900 text-[15px]">{brandName}</p>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.97 11.03a.75.75 0 0 0 1.07 0l4-4a.75.75 0 0 0-1.08-1.04L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06l2.647 2.647z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>2h</span>
            <span>·</span>
            <Globe className="w-3 h-3" />
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </div>

      {/* Post content */}
      <div className="px-3 pb-2">
        <p className="text-[15px] text-gray-900">
          Excited to share our latest update! 🚀 We're constantly innovating to bring you the best experience.
        </p>
      </div>

      {/* Image - Dynamic aspect ratio */}
      <div 
        className="bg-gray-100"
        style={{ aspectRatio }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Your Content ({sizeLabel})
          </div>
        )}
      </div>

      {/* Engagement stats */}
      <div className="px-3 py-2 flex items-center justify-between text-sm text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" fill="white" />
            </div>
            <div className="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center text-[10px]">
              ❤️
            </div>
          </div>
          <span className="text-gray-500 text-[13px]">1,234</span>
        </div>
        <span className="text-[13px]">42 comments · 12 shares</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        {[
          { icon: ThumbsUp, label: 'Like' },
          { icon: MessageCircle, label: 'Comment' },
          { icon: Share, label: 'Share' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[15px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
