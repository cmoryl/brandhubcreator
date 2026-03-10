/**
 * Realistic profile/page header mockups for each social platform.
 * Shows cover banners, profile photos, nav chrome, and page metadata
 * as they would appear on the actual platform.
 */
import { cn } from '@/lib/utils';
import {
  Globe, MoreHorizontal, Search, Bell, Home, User, Settings,
  Camera, Grid3X3, Play, Heart, Bookmark, Film, MapPin,
  ThumbsUp, MessageCircle, Share, Users, Star, ChevronDown,
  PlusSquare, Compass, PlaySquare, Music,
} from 'lucide-react';
import { SocialPlatform, PlatformSizeSpec } from '@/components/brand/social-mockups/types';

interface ProfilePageMockupProps {
  platform: SocialPlatform;
  coverImageUrl?: string;
  profileImageUrl?: string;
  brandName: string;
  handle: string;
  sizeSpec?: PlatformSizeSpec;
  className?: string;
}

// ─── Instagram Profile ──────────────────────────────
const InstagramProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 w-[320px]", className)}>
    {/* Status bar */}
    <div className="bg-white px-4 pt-2 pb-1 flex items-center justify-between text-xs text-gray-900">
      <span className="font-semibold">9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-2.5 border border-gray-900 rounded-sm"><div className="w-3/4 h-full bg-gray-900 rounded-sm" /></div>
      </div>
    </div>
    {/* Top nav */}
    <div className="px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span className="font-bold text-gray-900 text-base">{handle}</span>
        <ChevronDown className="w-4 h-4 text-gray-900" />
      </div>
      <div className="flex items-center gap-5">
        <PlusSquare className="w-6 h-6 text-gray-900" />
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/></svg>
      </div>
    </div>
    {/* Profile section */}
    <div className="px-4 py-3">
      <div className="flex items-center gap-6">
        {/* Profile photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-0.5 flex-shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Camera className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>
        {/* Stats */}
        <div className="flex-1 flex justify-around text-center">
          <div><p className="font-bold text-gray-900 text-lg">248</p><p className="text-xs text-gray-500">Posts</p></div>
          <div><p className="font-bold text-gray-900 text-lg">12.4K</p><p className="text-xs text-gray-500">Followers</p></div>
          <div><p className="font-bold text-gray-900 text-lg">892</p><p className="text-xs text-gray-500">Following</p></div>
        </div>
      </div>
      <div className="mt-3">
        <p className="font-semibold text-sm text-gray-900">{brandName}</p>
        <p className="text-xs text-gray-500">Business</p>
        <p className="text-sm text-gray-700 mt-1">Your bio goes here ✨<br/>Link in bio 👇</p>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-1.5 bg-[#0095F6] text-white text-sm font-semibold rounded-lg">Follow</button>
        <button className="flex-1 py-1.5 bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg">Message</button>
        <button className="py-1.5 px-3 bg-gray-100 rounded-lg"><ChevronDown className="w-4 h-4 text-gray-900" /></button>
      </div>
    </div>
    {/* Highlights */}
    <div className="px-4 py-2 flex gap-4 overflow-hidden">
      {['New', 'Sale', 'BTS', 'Team'].map(label => (
        <div key={label} className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
            {coverImageUrl ? (
              <img src={coverImageUrl} alt={label} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-gray-400 text-xs">+</span>
            )}
          </div>
          <span className="text-[10px] text-gray-900">{label}</span>
        </div>
      ))}
    </div>
    {/* Tab bar */}
    <div className="flex border-t border-gray-200">
      <div className="flex-1 py-2.5 flex justify-center border-b-2 border-gray-900"><Grid3X3 className="w-5 h-5 text-gray-900" /></div>
      <div className="flex-1 py-2.5 flex justify-center"><Film className="w-5 h-5 text-gray-400" /></div>
      <div className="flex-1 py-2.5 flex justify-center"><User className="w-5 h-5 text-gray-400" /></div>
    </div>
    {/* Grid preview */}
    <div className="grid grid-cols-3 gap-px bg-gray-200">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-100" />
      ))}
    </div>
  </div>
);

// ─── LinkedIn Profile ──────────────────────────────
const LinkedInProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 w-[420px]", className)}>
    {/* Cover banner */}
    <div className="relative h-[110px] bg-gradient-to-r from-[#0A66C2]/20 to-[#0A66C2]/40">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          <Camera className="w-5 h-5 mr-1" /> Cover Banner (1128×191)
        </div>
      )}
      {/* Profile photo overlay */}
      <div className="absolute -bottom-12 left-4">
        <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-md">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-2xl">
              {brandName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Profile info */}
    <div className="pt-14 px-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{handle} · Company Page</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> San Francisco, CA · 23,456 followers · 501-1000 employees
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="px-5 py-1.5 bg-[#0A66C2] text-white text-sm font-semibold rounded-full flex items-center gap-1">
          <span>+ Follow</span>
        </button>
        <button className="px-5 py-1.5 border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold rounded-full">Visit website</button>
        <button className="px-3 py-1.5 border border-gray-300 rounded-full"><MoreHorizontal className="w-4 h-4 text-gray-600" /></button>
      </div>
    </div>
    {/* Nav tabs */}
    <div className="border-t border-gray-200 px-4 flex gap-6 text-sm">
      {['Home', 'About', 'Posts', 'Jobs', 'People'].map((tab, i) => (
        <button key={tab} className={cn("py-3 font-medium border-b-2", i === 0 ? "text-green-700 border-green-700" : "text-gray-500 border-transparent")}>{tab}</button>
      ))}
    </div>
  </div>
);

// ─── X (Twitter) Profile ──────────────────────────────
const TwitterProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-800 w-[400px]", className)}>
    {/* Cover banner */}
    <div className="relative h-[130px] bg-gray-800">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="Header" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
          <Camera className="w-5 h-5 mr-1" /> Header Photo (1500×500)
        </div>
      )}
      {/* Profile photo */}
      <div className="absolute -bottom-10 left-4">
        <div className="w-20 h-20 rounded-full border-4 border-black overflow-hidden bg-gray-900">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400"><User className="w-8 h-8" /></div>
          )}
        </div>
      </div>
    </div>
    {/* Actions row */}
    <div className="flex justify-end px-4 py-2 gap-2">
      <button className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center"><MoreHorizontal className="w-4 h-4 text-white" /></button>
      <button className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center"><Bell className="w-4 h-4 text-white" /></button>
      <button className="px-4 py-1.5 bg-white text-black text-sm font-bold rounded-full">Follow</button>
    </div>
    {/* Profile info */}
    <div className="px-4 pb-3">
      <div className="flex items-center gap-1">
        <h2 className="text-xl font-bold text-white">{brandName}</h2>
        <svg viewBox="0 0 22 22" className="w-5 h-5 text-[#1D9BF0]" fill="currentColor">
          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm">@{handle}</p>
      <p className="text-white text-sm mt-2">Your bio goes here. Building the future ✨🚀</p>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> San Francisco</span>
        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> yourwebsite.com</span>
      </div>
      <div className="flex gap-4 mt-2 text-sm">
        <span><strong className="text-white">1,234</strong> <span className="text-gray-500">Following</span></span>
        <span><strong className="text-white">45.6K</strong> <span className="text-gray-500">Followers</span></span>
      </div>
    </div>
    {/* Nav tabs */}
    <div className="border-t border-gray-800 flex">
      {['Posts', 'Replies', 'Highlights', 'Media'].map((tab, i) => (
        <button key={tab} className={cn("flex-1 py-3 text-sm font-medium text-center border-b-2", i === 0 ? "text-white border-[#1D9BF0]" : "text-gray-500 border-transparent")}>{tab}</button>
      ))}
    </div>
  </div>
);

// ─── Facebook Page ──────────────────────────────
const FacebookProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 w-[420px]", className)}>
    {/* Cover photo */}
    <div className="relative h-[160px] bg-gradient-to-r from-[#1877F2]/10 to-[#1877F2]/30">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          <Camera className="w-5 h-5 mr-1" /> Cover Photo (820×312)
        </div>
      )}
      <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 text-sm font-medium rounded-lg flex items-center gap-1 shadow-sm">
        <Camera className="w-4 h-4" /> Edit Cover Photo
      </button>
    </div>
    {/* Profile section */}
    <div className="relative px-4 pb-3">
      <div className="flex items-end gap-4 -mt-8">
        <div className="w-[100px] h-[100px] rounded-full border-4 border-white overflow-hidden bg-white shadow-lg flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-3xl">
              {brandName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 pb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">{brandName}</h2>
            <svg viewBox="0 0 16 16" className="w-5 h-5 text-[#1877F2]" fill="currentColor">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.97 11.03a.75.75 0 0 0 1.07 0l4-4a.75.75 0 0 0-1.08-1.04L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06l2.647 2.647z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">23.4K followers · 1.2K likes</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-2 bg-[#1877F2] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1">
          <ThumbsUp className="w-4 h-4" /> Like
        </button>
        <button className="flex-1 py-2 bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-1">
          <MessageCircle className="w-4 h-4" /> Message
        </button>
        <button className="py-2 px-3 bg-gray-100 rounded-lg"><MoreHorizontal className="w-4 h-4 text-gray-600" /></button>
      </div>
    </div>
    {/* Nav tabs */}
    <div className="border-t border-gray-200 px-4 flex gap-1 overflow-hidden">
      {['Posts', 'About', 'Photos', 'Videos', 'Reviews', 'More'].map((tab, i) => (
        <button key={tab} className={cn("py-3 px-3 text-sm font-medium border-b-2 whitespace-nowrap", i === 0 ? "text-[#1877F2] border-[#1877F2]" : "text-gray-500 border-transparent")}>{tab}</button>
      ))}
    </div>
  </div>
);

// ─── YouTube Channel ──────────────────────────────
const YouTubeProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 w-[440px]", className)}>
    {/* Channel banner */}
    <div className="relative h-[100px] bg-gradient-to-r from-[#FF0000]/10 to-[#282828]/20">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="Banner" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          <Camera className="w-5 h-5 mr-1" /> Channel Banner (2560×1440)
        </div>
      )}
    </div>
    {/* Channel info */}
    <div className="px-4 py-3 flex items-start gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#FF0000] flex items-center justify-center text-white font-bold text-2xl">
            {brandName.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500">@{handle} · 1.2M subscribers · 456 videos</p>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">Your channel description goes here. We create amazing content about...</p>
        <div className="flex gap-2 mt-3">
          <button className="px-5 py-2 bg-[#0f0f0f] text-white text-sm font-medium rounded-full flex items-center gap-1">Subscribe</button>
          <button className="px-4 py-2 bg-gray-100 text-sm font-medium rounded-full flex items-center gap-1"><Bell className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
    {/* Nav tabs */}
    <div className="border-t border-gray-200 px-4 flex gap-6 text-sm">
      {['Home', 'Videos', 'Shorts', 'Playlists', 'Community', 'About'].map((tab, i) => (
        <button key={tab} className={cn("py-3 font-medium border-b-2 whitespace-nowrap", i === 0 ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent")}>{tab}</button>
      ))}
    </div>
  </div>
);

// ─── TikTok Profile ──────────────────────────────
const TikTokProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-black rounded-[2rem] overflow-hidden shadow-2xl border-[6px] border-gray-800 w-[300px]", className)}>
    {/* Status bar */}
    <div className="px-6 pt-2 pb-1 flex items-center justify-between text-xs text-white">
      <span className="font-semibold">9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-2.5 border border-white rounded-sm"><div className="w-3/4 h-full bg-white rounded-sm" /></div>
      </div>
    </div>
    {/* Profile */}
    <div className="flex flex-col items-center pt-4 pb-3 px-4">
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#69C9D0] to-[#EE1D52] flex items-center justify-center text-white font-bold text-2xl">
            {brandName.charAt(0)}
          </div>
        )}
      </div>
      <p className="text-white font-bold text-base mt-3">@{handle}</p>
      <div className="flex gap-6 mt-3 text-center">
        <div><p className="text-white font-bold text-lg">128</p><p className="text-gray-400 text-xs">Following</p></div>
        <div><p className="text-white font-bold text-lg">45.2K</p><p className="text-gray-400 text-xs">Followers</p></div>
        <div><p className="text-white font-bold text-lg">1.2M</p><p className="text-gray-400 text-xs">Likes</p></div>
      </div>
      <div className="flex gap-2 mt-3 w-full">
        <button className="flex-1 py-2 bg-[#EE1D52] text-white text-sm font-semibold rounded-md">Follow</button>
        <button className="py-2 px-4 bg-gray-800 text-white text-sm rounded-md border border-gray-700">
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-300 text-xs text-center mt-3 px-2">Your bio goes here ✨ Link in bio 👇</p>
    </div>
    {/* Tabs */}
    <div className="flex border-t border-gray-800">
      <div className="flex-1 py-2.5 flex justify-center border-b-2 border-white"><Grid3X3 className="w-5 h-5 text-white" /></div>
      <div className="flex-1 py-2.5 flex justify-center"><Heart className="w-5 h-5 text-gray-500" /></div>
    </div>
    {/* Grid */}
    <div className="grid grid-cols-3 gap-px bg-gray-800">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[9/16] bg-gray-900 flex items-center justify-center">
          <Play className="w-4 h-4 text-gray-600" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Pinterest Profile ──────────────────────────────
const PinterestProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200 w-[400px]", className)}>
    {/* Profile section */}
    <div className="flex flex-col items-center pt-6 pb-4 px-6">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
        {profileImageUrl ? (
          <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#E60023] flex items-center justify-center text-white font-bold text-2xl">
            {brandName.charAt(0)}
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mt-3">{brandName}</h2>
      <p className="text-sm text-gray-500">@{handle} · pinterest.com/{handle}</p>
      <p className="text-sm text-gray-600 mt-2 text-center">Your bio goes here ✨ Curating inspiration for the world.</p>
      <p className="text-xs text-gray-500 mt-1">123 followers · 456 following</p>
      <div className="flex gap-2 mt-3">
        <button className="px-5 py-2 bg-[#E60023] text-white text-sm font-semibold rounded-full">Follow</button>
        <button className="px-5 py-2 bg-gray-100 text-gray-900 text-sm font-semibold rounded-full">Share</button>
      </div>
    </div>
    {/* Tabs */}
    <div className="border-t border-gray-200 flex justify-center gap-6 text-sm">
      <button className="py-3 font-semibold text-gray-900 border-b-2 border-gray-900">Created</button>
      <button className="py-3 font-medium text-gray-500 border-b-2 border-transparent">Saved</button>
    </div>
    {/* Board grid */}
    <div className="grid grid-cols-2 gap-2 p-3">
      {['Inspiration', 'Products', 'Lifestyle', 'Design'].map(board => (
        <div key={board} className="rounded-xl overflow-hidden">
          <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">{board}</div>
          <p className="text-xs font-medium text-gray-900 p-1.5">{board}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Threads Profile ──────────────────────────────
const ThreadsProfile = ({ coverImageUrl, profileImageUrl, brandName, handle, className }: ProfilePageMockupProps) => (
  <div className={cn("bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-800 w-[380px]", className)}>
    {/* Top nav */}
    <div className="px-4 py-3 flex items-center justify-between">
      <Globe className="w-5 h-5 text-white" />
      <span className="text-white font-semibold text-base">Profile</span>
      <Settings className="w-5 h-5 text-white" />
    </div>
    {/* Profile */}
    <div className="px-4 pb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{brandName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-gray-400 text-sm">{handle}</p>
            <span className="px-2 py-0.5 bg-gray-800 text-gray-500 text-[10px] rounded-full">threads.net</span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {brandName.charAt(0)}
            </div>
          )}
        </div>
      </div>
      <p className="text-white text-sm mt-3">Your bio goes here ✨</p>
      <p className="text-gray-500 text-sm mt-2">45.6K followers</p>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-2 border border-gray-700 text-white text-sm font-semibold rounded-xl">Follow</button>
        <button className="flex-1 py-2 border border-gray-700 text-white text-sm font-semibold rounded-xl">Mention</button>
      </div>
    </div>
    {/* Tabs */}
    <div className="flex border-t border-gray-800">
      <button className="flex-1 py-3 text-sm font-semibold text-white text-center border-b border-white">Threads</button>
      <button className="flex-1 py-3 text-sm font-medium text-gray-500 text-center">Replies</button>
      <button className="flex-1 py-3 text-sm font-medium text-gray-500 text-center">Reposts</button>
    </div>
    {/* Thread preview */}
    <div className="p-4 border-t border-gray-800">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
        <div>
          <div className="flex items-center gap-1"><span className="text-white text-sm font-semibold">{handle}</span><span className="text-gray-500 text-sm">· 2h</span></div>
          <p className="text-gray-300 text-sm mt-1">Your first thread post appears here...</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Export ──────────────────────────────
export const ProfilePageMockup = (props: ProfilePageMockupProps) => {
  switch (props.platform) {
    case 'Instagram': return <InstagramProfile {...props} />;
    case 'LinkedIn': return <LinkedInProfile {...props} />;
    case 'X (Twitter)': return <TwitterProfile {...props} />;
    case 'Facebook': return <FacebookProfile {...props} />;
    case 'YouTube': return <YouTubeProfile {...props} />;
    case 'TikTok': return <TikTokProfile {...props} />;
    case 'Pinterest': return <PinterestProfile {...props} />;
    case 'Threads': return <ThreadsProfile {...props} />;
    default: return null;
  }
};
