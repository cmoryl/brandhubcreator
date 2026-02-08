import { ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

export const LinkedInMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  handle = 'Company Page',
  className 
}: FormatMockupProps) => {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200",
      "w-[400px]",
      className
    )}>
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg">
                {brandName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-gray-900 text-sm">{brandName}</p>
              <span className="text-[#0A66C2] text-xs">• Follow</span>
            </div>
            <p className="text-xs text-gray-500 truncate">23,456 followers</p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>2h</span>
              <span>•</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </div>
      </div>

      {/* Post content */}
      <div className="px-3 pb-2">
        <p className="text-sm text-gray-900 leading-relaxed">
          Excited to share our latest update! 🚀 We're constantly innovating to bring you the best experience.
          <span className="text-gray-500"> ...see more</span>
        </p>
      </div>

      {/* Image - LinkedIn uses 1.91:1 aspect ratio for link previews */}
      <div className="relative aspect-[1.91/1] bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-[#0A66C2]/10 to-[#0A66C2]/5">
            Your Content (1200 x 627 px)
          </div>
        )}
      </div>

      {/* Engagement stats */}
      <div className="px-3 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center">
              <ThumbsUp className="w-2.5 h-2.5 text-white" fill="white" />
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px]">
              ❤️
            </div>
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px]">
              👏
            </div>
          </div>
          <span>1,234</span>
        </div>
        <span>42 comments • 12 reposts</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        {[
          { icon: ThumbsUp, label: 'Like' },
          { icon: MessageSquare, label: 'Comment' },
          { icon: Repeat2, label: 'Repost' },
          { icon: Send, label: 'Send' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
