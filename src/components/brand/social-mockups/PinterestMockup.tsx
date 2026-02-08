import { Heart, Share, MoreHorizontal, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

// Helper to convert aspect ratio string like "2:3" or "1:1" to a CSS value
const getAspectRatioStyle = (aspectRatio?: string): string => {
  if (!aspectRatio) return '2/3';
  const parts = aspectRatio.split(':').map(Number);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }
  return '2/3';
};

export const PinterestMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  format,
  sizeSpec,
  className 
}: FormatMockupProps) => {
  if (format === 'story') {
    // Pinterest Idea Pin
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
          <div className="w-4 h-2 border border-white rounded-sm">
            <div className="w-3/4 h-full bg-white rounded-sm" />
          </div>
        </div>

        {/* Idea Pin content */}
        <div className="absolute inset-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Idea Pin" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E60023] to-[#BD081C] flex items-center justify-center">
              <span className="text-white/60 text-sm">Your Idea Pin</span>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="absolute top-12 left-0 right-0 z-20 flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>

        {/* Top actions */}
        <div className="absolute top-12 left-3 right-3 z-20 flex items-center justify-between">
          <X className="w-6 h-6 text-white drop-shadow-lg" />
          <MoreHorizontal className="w-6 h-6 text-white drop-shadow-lg" />
        </div>

        {/* Bottom info */}
        <div className="absolute left-0 right-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-8 px-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-600">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#E60023]" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{brandName}</p>
              <p className="text-white/70 text-xs">123K followers</p>
            </div>
            <button className="px-4 py-2 bg-[#E60023] text-white text-sm font-semibold rounded-full">
              Follow
            </button>
          </div>
          <p className="text-white text-sm font-medium mb-2">Your Idea Pin Title</p>
          <p className="text-white/80 text-xs">Tap to see more details about this idea</p>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
      </div>
    );
  }

  // Pinterest Pin (Feed) - Dynamic aspect ratio
  const aspectRatio = getAspectRatioStyle(sizeSpec?.aspectRatio);
  const sizeLabel = sizeSpec ? `${sizeSpec.width} x ${sizeSpec.height} px` : '1000 x 1500 px';

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-xl overflow-hidden",
      "w-[280px]",
      className
    )}>
      {/* Pin image - Dynamic aspect ratio */}
      <div 
        className="relative bg-gray-100 group"
        style={{ aspectRatio }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Pin" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-[#E60023]/10 to-[#E60023]/5">
            Your Pin ({sizeLabel})
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Save button */}
          <button className="absolute top-3 right-3 px-4 py-2 bg-[#E60023] text-white text-sm font-semibold rounded-full hover:bg-[#BD081C] transition-colors">
            Save
          </button>
          
          {/* Board selector */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white rounded-full px-3 py-2">
            <span className="text-sm font-medium text-gray-900">Board</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div>

          {/* Bottom actions */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
              <Share className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Pin info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
          Your Pin Title - Make It Descriptive
        </p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#E60023] flex items-center justify-center text-white font-bold text-xs">
                {brandName.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600 truncate">{brandName}</span>
        </div>
      </div>
    </div>
  );
};
