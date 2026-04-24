/**
 * Types for Brand Creative Studio
 */

export interface BrandPrompt {
  id: string;
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string | null;
  
  name: string;
  category: PromptCategory;
  prompt_template: string;
  description: string | null;
  
  output_format: 'image' | 'video' | 'text';
  aspect_ratio: AspectRatio;
  style_preset: StylePreset | null;
  
  use_count: number;
  last_used_at: string | null;
  
  is_default: boolean;
  is_shared: boolean;
  
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneratedAsset {
  id: string;
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string | null;
  
  name: string;
  category: string;
  asset_type: 'image' | 'pattern' | 'gradient' | 'icon';
  
  image_url: string | null;
  thumbnail_url: string | null;
  prompt_used: string;
  prompt_id: string | null;
  
  model_used: string;
  generation_params: Record<string, unknown>;
  aspect_ratio: string | null;
  
  rating: number | null;
  is_approved: boolean;
  is_published: boolean;
  
  created_by: string | null;
  created_at: string;
}

export interface DesignTokenConfig {
  id: string;
  entity_id: string;
  entity_type: 'brand' | 'product' | 'event';
  organization_id: string | null;
  
  name: string;
  format: TokenFormat;
  tokens_data: Record<string, unknown>;
  css_output: string | null;
  
  include_colors: boolean;
  include_typography: boolean;
  include_spacing: boolean;
  include_shadows: boolean;
  prefix: string;
  
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PromptCategory = 
  | 'general'
  | 'social'
  | 'marketing'
  | 'product'
  | 'event'
  | 'pattern'
  | 'photography'
  | 'hero'
  | 'icon';

export type AspectRatio = '1:1' | '16:9' | '4:3' | '9:16' | 'custom';

export type StylePreset = 
  | 'photorealistic'
  | 'humanRealistic'
  | 'softTransition'
  | 'illustration'
  | 'minimal'
  | 'bold'
  | '3d'
  | 'abstract';

export type TokenFormat = 'css' | 'scss' | 'json' | 'figma' | 'tailwind';

export const PROMPT_CATEGORIES: Record<PromptCategory, { label: string; icon: string; description: string }> = {
  general: { label: 'General', icon: 'Sparkles', description: 'Multi-purpose creative assets' },
  social: { label: 'Social Media', icon: 'Share2', description: 'Posts, stories, banners' },
  marketing: { label: 'Marketing', icon: 'Megaphone', description: 'Ads, campaigns, promotions' },
  product: { label: 'Product', icon: 'Package', description: 'Product shots, mockups' },
  event: { label: 'Event', icon: 'Calendar', description: 'Event graphics, signage' },
  pattern: { label: 'Pattern', icon: 'Grid3X3', description: 'Seamless patterns, textures' },
  photography: { label: 'Photography', icon: 'Camera', description: 'Photo style guidance' },
  hero: { label: 'Hero', icon: 'Image', description: 'Hero images, banners' },
  icon: { label: 'Icon', icon: 'Hexagon', description: 'Icons, symbols' }
};

export const STYLE_PRESETS: Record<StylePreset, { label: string; description: string }> = {
  photorealistic: { label: 'Photorealistic', description: 'High-quality photography style' },
  humanRealistic: { label: 'Hyper-Realistic Human', description: 'Soft light, shallow DoF, authentic human moments' },
  softTransition: { label: 'Soft Transition', description: 'Progressive blur merging photo with brand gradient' },
  illustration: { label: 'Illustration', description: 'Clean vector/digital art style' },
  minimal: { label: 'Minimal', description: 'Clean, simple, elegant' },
  bold: { label: 'Bold', description: 'Strong contrasts, impactful' },
  '3d': { label: '3D Render', description: 'Modern CGI quality' },
  abstract: { label: 'Abstract', description: 'Artistic, expressive' }
};

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; dimensions: string }> = {
  '1:1': { label: 'Square', dimensions: '1024×1024' },
  '16:9': { label: 'Landscape', dimensions: '1920×1080' },
  '4:3': { label: 'Standard', dimensions: '1600×1200' },
  '9:16': { label: 'Portrait', dimensions: '1080×1920' },
  'custom': { label: 'Custom', dimensions: 'Variable' }
};

export const TOKEN_FORMATS: Record<TokenFormat, { label: string; extension: string }> = {
  css: { label: 'CSS Variables', extension: '.css' },
  scss: { label: 'SCSS Variables', extension: '.scss' },
  json: { label: 'JSON Tokens', extension: '.json' },
  figma: { label: 'Figma Tokens', extension: '.json' },
  tailwind: { label: 'Tailwind Config', extension: '.js' }
};

// Default prompts for each category
export const DEFAULT_PROMPTS: Array<Omit<BrandPrompt, 'id' | 'entity_id' | 'entity_type' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at'>> = [
  {
    name: 'Social Media Post',
    category: 'social',
    prompt_template: 'Create a visually engaging social media post image for {{brand_name}}. The image should reflect the brand identity and be suitable for Instagram/Facebook. Include subtle brand elements without text overlay.',
    description: 'Standard social media post image',
    output_format: 'image',
    aspect_ratio: '1:1',
    style_preset: 'photorealistic',
    is_default: true,
    is_shared: false
  },
  {
    name: 'Instagram Story',
    category: 'social',
    prompt_template: 'Create a vertical Instagram story background for {{brand_name}}. Modern, eye-catching design with space for text overlay. Use brand colors prominently.',
    description: 'Vertical story format',
    output_format: 'image',
    aspect_ratio: '9:16',
    style_preset: 'bold',
    is_default: true,
    is_shared: false
  },
  {
    name: 'Hero Banner',
    category: 'hero',
    prompt_template: 'Create a professional hero banner image for {{brand_name}} website. Wide format, atmospheric, premium quality. Should evoke the brand essence without logos or text.',
    description: 'Website hero section',
    output_format: 'image',
    aspect_ratio: '16:9',
    style_preset: 'photorealistic',
    is_default: true,
    is_shared: false
  },
  {
    name: 'Brand Pattern',
    category: 'pattern',
    prompt_template: 'Create a seamless tileable pattern for {{brand_name}}. Geometric, modern design using brand colors. Suitable for backgrounds and packaging.',
    description: 'Seamless brand pattern',
    output_format: 'image',
    aspect_ratio: '1:1',
    style_preset: 'minimal',
    is_default: true,
    is_shared: false
  },
  {
    name: 'Product Showcase',
    category: 'product',
    prompt_template: 'Create a professional product photography scene for {{brand_name}}. Clean background, professional lighting, premium feel. Focus on showcasing quality.',
    description: 'Product photography style',
    output_format: 'image',
    aspect_ratio: '4:3',
    style_preset: 'photorealistic',
    is_default: true,
    is_shared: false
  },
  {
    name: 'Event Graphic',
    category: 'event',
    prompt_template: 'Create an event promotional graphic for {{brand_name}}. Dynamic, celebratory atmosphere. Professional event imagery with brand colors.',
    description: 'Event promotion imagery',
    output_format: 'image',
    aspect_ratio: '16:9',
    style_preset: 'bold',
    is_default: true,
    is_shared: false
  }
];
