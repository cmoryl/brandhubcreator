import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, BarChart2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormatMockupProps } from './types';

// Helper to convert aspect ratio string like "16:9" or "1:1" to a CSS value
const getAspectRatioStyle = (aspectRatio?: string): string => {
  if (!aspectRatio) return '16/9';
  const parts = aspectRatio.split(':').map(Number);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[0]}/${parts[1]}`;
  }
  return '16/9';
};

export const TwitterMockup = ({ 
  imageUrl, 
  profileImageUrl, 
  brandName = 'Brand Name',
  handle = 'brandhandle',
  sizeSpec,
  className 
}: FormatMockupProps) => {
  const aspectRatio = getAspectRatioStyle(sizeSpec?.aspectRatio);
  const sizeLabel = sizeSpec ? `${sizeSpec.width} x ${sizeSpec.height} px` : '1600 x 900 px';

  return (
    <div className={cn(
      "bg-black rounded-2xl shadow-xl overflow-hidden border border-gray-800",
      "w-[380px]",
      className
    )}>
      {/* Header */}
      <div className="p-3 flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-white text-[15px]">{brandName}</span>
              <svg viewBox="0 0 22 22" className="w-4 h-4 text-[#1D9BF0]" fill="currentColor">
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
              </svg>
              <span className="text-gray-500 text-[15px]">@{handle}</span>
              <span className="text-gray-500 text-[15px]">· 2h</span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </div>
          
          {/* Tweet content */}
          <p className="text-white text-[15px] leading-5 mt-1 mb-3">
            Excited to share our latest update! 🚀 We're constantly innovating to bring you the best experience.
          </p>

          {/* Image - Dynamic aspect ratio based on sizeSpec */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-800">
            <div 
              className="bg-gray-800"
              style={{ aspectRatio }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  Your Content ({sizeLabel})
                </div>
              )}
            </div>
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-4 mt-3 text-[13px] text-gray-500">
            <span><strong className="text-white">1.2K</strong> views</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 max-w-[425px] text-gray-500">
            <button className="flex items-center gap-1 hover:text-[#1D9BF0] transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -m-2">
                <MessageCircle className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">42</span>
            </button>
            <button className="flex items-center gap-1 hover:text-green-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 -m-2">
                <Repeat2 className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">128</span>
            </button>
            <button className="flex items-center gap-1 hover:text-pink-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-pink-500/10 -m-2">
                <Heart className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">1.2K</span>
            </button>
            <button className="flex items-center gap-1 hover:text-[#1D9BF0] transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -m-2">
                <BarChart2 className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[13px]">45K</span>
            </button>
            <div className="flex items-center gap-2">
              <button className="hover:text-[#1D9BF0] transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -m-2">
                  <Bookmark className="w-[18px] h-[18px]" />
                </div>
              </button>
              <button className="hover:text-[#1D9BF0] transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-[#1D9BF0]/10 -m-2">
                  <Share className="w-[18px] h-[18px]" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
