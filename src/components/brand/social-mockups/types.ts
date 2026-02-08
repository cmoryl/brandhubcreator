// Social platform mockup types

export type SocialPlatform = 
  | 'Instagram' 
  | 'LinkedIn' 
  | 'X (Twitter)' 
  | 'Facebook' 
  | 'YouTube' 
  | 'TikTok' 
  | 'Pinterest' 
  | 'Threads';

export type PostFormat = 'feed' | 'story' | 'reel';

export interface MockupProps {
  imageUrl?: string;
  profileImageUrl?: string;
  brandName?: string;
  handle?: string;
  className?: string;
}

export interface PlatformMockupConfig {
  name: SocialPlatform;
  supportsStory: boolean;
  supportsReel: boolean;
  feedAspectRatio: string;
  storyAspectRatio: string;
  reelAspectRatio: string;
  primaryColor: string;
  secondaryColor: string;
}

export const platformConfigs: Record<SocialPlatform, PlatformMockupConfig> = {
  'Instagram': {
    name: 'Instagram',
    supportsStory: true,
    supportsReel: true,
    feedAspectRatio: '1:1',
    storyAspectRatio: '9:16',
    reelAspectRatio: '9:16',
    primaryColor: '#E1306C',
    secondaryColor: '#833AB4',
  },
  'LinkedIn': {
    name: 'LinkedIn',
    supportsStory: false,
    supportsReel: false,
    feedAspectRatio: '1.91:1',
    storyAspectRatio: 'N/A',
    reelAspectRatio: 'N/A',
    primaryColor: '#0A66C2',
    secondaryColor: '#0A66C2',
  },
  'X (Twitter)': {
    name: 'X (Twitter)',
    supportsStory: false,
    supportsReel: false,
    feedAspectRatio: '16:9',
    storyAspectRatio: 'N/A',
    reelAspectRatio: 'N/A',
    primaryColor: '#000000',
    secondaryColor: '#1DA1F2',
  },
  'Facebook': {
    name: 'Facebook',
    supportsStory: true,
    supportsReel: true,
    feedAspectRatio: '1.91:1',
    storyAspectRatio: '9:16',
    reelAspectRatio: '9:16',
    primaryColor: '#1877F2',
    secondaryColor: '#1877F2',
  },
  'YouTube': {
    name: 'YouTube',
    supportsStory: false,
    supportsReel: true,
    feedAspectRatio: '16:9',
    storyAspectRatio: 'N/A',
    reelAspectRatio: '9:16',
    primaryColor: '#FF0000',
    secondaryColor: '#282828',
  },
  'TikTok': {
    name: 'TikTok',
    supportsStory: false,
    supportsReel: true,
    feedAspectRatio: '9:16',
    storyAspectRatio: 'N/A',
    reelAspectRatio: '9:16',
    primaryColor: '#000000',
    secondaryColor: '#69C9D0',
  },
  'Pinterest': {
    name: 'Pinterest',
    supportsStory: true,
    supportsReel: false,
    feedAspectRatio: '2:3',
    storyAspectRatio: '9:16',
    reelAspectRatio: 'N/A',
    primaryColor: '#E60023',
    secondaryColor: '#E60023',
  },
  'Threads': {
    name: 'Threads',
    supportsStory: false,
    supportsReel: false,
    feedAspectRatio: '1:1',
    storyAspectRatio: 'N/A',
    reelAspectRatio: 'N/A',
    primaryColor: '#000000',
    secondaryColor: '#000000',
  },
};
