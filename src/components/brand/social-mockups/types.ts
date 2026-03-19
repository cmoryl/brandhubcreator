// Social platform mockup types

export type SocialPlatform = 
  | 'Instagram' 
  | 'LinkedIn' 
  | 'X'
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
  sizeSpec?: PlatformSizeSpec;
}

export interface FormatMockupProps extends MockupProps {
  format: PostFormat;
}

export interface PlatformSizeSpec {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  description?: string;
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
  sizes: {
    feed: PlatformSizeSpec[];
    story?: PlatformSizeSpec[];
    reel?: PlatformSizeSpec[];
  };
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
    sizes: {
      feed: [
        { name: 'Square Post', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Standard feed post' },
        { name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5', description: 'Vertical feed post' },
        { name: 'Landscape Post', width: 1080, height: 566, aspectRatio: '1.91:1', description: 'Horizontal feed post' },
        { name: 'Carousel', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Multi-image carousel' },
        { name: 'Profile Photo', width: 320, height: 320, aspectRatio: '1:1', description: 'Profile picture' },
        { name: 'Highlight Cover', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Story highlight icon' },
      ],
      story: [
        { name: 'Story', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen story' },
      ],
      reel: [
        { name: 'Reel', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Short-form vertical video' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Shared Image', width: 1200, height: 627, aspectRatio: '1.91:1', description: 'Link preview image' },
        { name: 'Square Post', width: 1200, height: 1200, aspectRatio: '1:1', description: 'Standard post' },
        { name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5', description: 'Vertical post' },
        { name: 'Company Cover', width: 1128, height: 191, aspectRatio: '5.91:1', description: 'Company page banner' },
        { name: 'Profile Banner', width: 1584, height: 396, aspectRatio: '4:1', description: 'Personal profile banner' },
        { name: 'Life Tab Header', width: 1128, height: 376, aspectRatio: '3:1', description: 'Life tab hero image' },
        { name: 'Company Logo', width: 300, height: 300, aspectRatio: '1:1', description: 'Company page logo' },
        { name: 'Profile Photo', width: 400, height: 400, aspectRatio: '1:1', description: 'Personal profile photo' },
        { name: 'Carousel', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Document carousel' },
      ],
    },
  },
  'X': {
    name: 'X',
    supportsStory: false,
    supportsReel: false,
    feedAspectRatio: '16:9',
    storyAspectRatio: 'N/A',
    reelAspectRatio: 'N/A',
    primaryColor: '#000000',
    secondaryColor: '#1DA1F2',
    sizes: {
      feed: [
        { name: 'Single Image', width: 1600, height: 900, aspectRatio: '16:9', description: 'Standard tweet image' },
        { name: 'Two Images', width: 700, height: 800, aspectRatio: '7:8', description: 'Side by side' },
        { name: 'Three Images', width: 700, height: 800, aspectRatio: '7:8', description: 'One large + two small' },
        { name: 'Four Images', width: 600, height: 600, aspectRatio: '1:1', description: 'Grid layout' },
        { name: 'Header Photo', width: 1500, height: 500, aspectRatio: '3:1', description: 'Profile header banner' },
        { name: 'Profile Photo', width: 400, height: 400, aspectRatio: '1:1', description: 'Profile picture' },
        { name: 'In-stream Video', width: 1920, height: 1080, aspectRatio: '16:9', description: 'Landscape video' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Shared Image', width: 1200, height: 630, aspectRatio: '1.91:1', description: 'Link preview' },
        { name: 'Square Post', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Photo post' },
        { name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5', description: 'Vertical photo' },
        { name: 'Cover Photo', width: 820, height: 312, aspectRatio: '2.63:1', description: 'Page cover banner' },
        { name: 'Event Cover', width: 1920, height: 1005, aspectRatio: '1.91:1', description: 'Event banner' },
        { name: 'Group Cover', width: 1640, height: 856, aspectRatio: '1.91:1', description: 'Group header image' },
        { name: 'Profile Photo', width: 170, height: 170, aspectRatio: '1:1', description: 'Page profile picture' },
      ],
      story: [
        { name: 'Story', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen story' },
      ],
      reel: [
        { name: 'Reel', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Short-form video' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Video Thumbnail', width: 1280, height: 720, aspectRatio: '16:9', description: 'Standard thumbnail' },
        { name: 'Channel Banner', width: 2560, height: 1440, aspectRatio: '16:9', description: 'Channel art header' },
        { name: 'Channel Icon', width: 800, height: 800, aspectRatio: '1:1', description: 'Profile picture' },
        { name: 'End Screen', width: 1920, height: 1080, aspectRatio: '16:9', description: 'End card' },
        { name: 'Community Post', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Community tab image' },
      ],
      reel: [
        { name: 'Short', width: 1080, height: 1920, aspectRatio: '9:16', description: 'YouTube Short' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Video', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Standard TikTok' },
        { name: 'Profile Photo', width: 200, height: 200, aspectRatio: '1:1', description: 'Avatar' },
        { name: 'Shop Header', width: 1200, height: 628, aspectRatio: '1.91:1', description: 'TikTok Shop banner' },
      ],
      reel: [
        { name: 'TikTok Video', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen video' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Standard Pin', width: 1000, height: 1500, aspectRatio: '2:3', description: 'Optimal pin size' },
        { name: 'Square Pin', width: 1000, height: 1000, aspectRatio: '1:1', description: 'Square format' },
        { name: 'Long Pin', width: 1000, height: 2100, aspectRatio: '1:2.1', description: 'Infographic style' },
        { name: 'Board Cover', width: 600, height: 600, aspectRatio: '1:1', description: 'Board thumbnail' },
        { name: 'Profile Photo', width: 165, height: 165, aspectRatio: '1:1', description: 'Profile picture' },
      ],
      story: [
        { name: 'Idea Pin', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Multi-page story' },
      ],
    },
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
    sizes: {
      feed: [
        { name: 'Square Post', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Standard thread' },
        { name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5', description: 'Vertical image' },
        { name: 'Landscape Post', width: 1080, height: 566, aspectRatio: '1.91:1', description: 'Wide image' },
        { name: 'Profile Photo', width: 320, height: 320, aspectRatio: '1:1', description: 'Profile picture' },
      ],
    },
  },
};
