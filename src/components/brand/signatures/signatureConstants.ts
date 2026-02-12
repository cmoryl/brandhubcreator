// Default brand accent colors
export const DEFAULT_DARK = '#003b71';
export const DEFAULT_ACCENT = '#139cd8';

export const SOCIAL_PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', letter: 'in', icon: 'Linkedin' },
  { id: 'twitter', name: 'X (Twitter)', color: '#000000', letter: '𝕏', icon: 'Twitter' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', letter: 'f', icon: 'Facebook' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', letter: '✦', icon: 'Instagram' },
  { id: 'github', name: 'GitHub', color: '#181717', letter: 'GH', icon: 'Github' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', letter: '▶', icon: 'Youtube' },
  { id: 'dribbble', name: 'Dribbble', color: '#EA4C89', letter: 'D', icon: 'Dribbble' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', letter: '♪', icon: 'Music2' },
  { id: 'website', name: 'Website', color: '#139cd8', letter: '⊕', icon: 'Globe' },
] as const;

export const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: "'Lucida Sans', sans-serif", label: 'Lucida Sans' },
  { value: "'Segoe UI', sans-serif", label: 'Segoe UI' },
];

export const DIVIDER_STYLES = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
  { value: 'none', label: 'None' },
] as const;

export const LOGO_SIZE_PRESETS = [
  { name: 'Small', width: 60, height: 60 },
  { name: 'Default', width: 100, height: 100 },
  { name: 'Medium', width: 120, height: 120 },
  { name: 'Large', width: 150, height: 150 },
];

export const BANNER_SIZE_PRESETS = [
  { name: 'Standard Banner', width: 600, height: 150, description: 'Best for promotional campaigns' },
  { name: 'Compact Banner', width: 550, height: 100, description: 'Subtle promotional space' },
  { name: 'Wide Banner', width: 600, height: 200, description: 'High-impact visuals' },
  { name: 'Square Feature', width: 300, height: 300, description: 'Product spotlight' },
];

export const DEFAULT_CONFIDENTIALITY = `CONFIDENTIALITY NOTICE: The content of this email is confidential and intended for the recipient specified in message only. It is strictly forbidden to share any part of this message with any third party, without a written consent of the sender. If you received this message by mistake, please reply to this message and follow with its deletion, so that we can ensure such a mistake does not occur in the future.`;
