/**
 * IconKitTooltip - Contextual help tooltips for Icon Studio features
 * 
 * Links directly to specific sections in the IconKIT knowledge base.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, ExternalLink, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

// IconKIT FAQ section definitions with tooltips
export const iconKitHelpSections = {
  // Icon Studio Overview
  'icon-studio': {
    title: 'Icon Studio',
    description: 'A streamlined 4-tab hub: Library (browse & import), AI Generate, Style (colorize, brand rules, app icons), and Export.',
    category: 'Icon Studio Overview',
  },
  'library-tab': {
    title: 'Icon Libraries',
    description: 'Manage your organized icon collections with a 3-level hierarchy: Core (universal), Product Line (shared), and Brand (specific).',
    category: 'Icon Libraries & Organization',
  },
  'library-hierarchy': {
    title: '3-Level Hierarchy',
    description: 'Core icons are used everywhere. Product Line icons are shared across related products. Brand icons are specific to one brand.',
    category: 'Icon Libraries & Organization',
  },
  
  // AI Generation
  'ai-generator': {
    title: 'AI Icon Generation',
    description: 'Generate brand-consistent icons using AI. Select a style preset, describe what you need, and get production-ready SVGs.',
    category: 'AI Icon Generation',
  },
  'style-presets': {
    title: 'Style Presets',
    description: 'Choose from Minimal Line, Bold Filled, Duotone, Outlined, Gradient, or Custom to match your brand\'s visual language.',
    category: 'AI Icon Generation',
  },
  'batch-generation': {
    title: 'Batch Generation',
    description: 'Generate up to 100 icons at once. The AI maintains visual consistency across the entire batch.',
    category: 'AI Icon Generation',
  },
  'icon-quality-score': {
    title: 'Icon Quality Score (IQS)',
    description: 'A 1-100 rating evaluating optical weight, legibility, and production readiness. Scores above 70 are production-ready.',
    category: 'Icon Libraries & Organization',
  },
  
  // Stylizer
  'stylizer': {
    title: 'PNG to SVG Stylizer',
    description: 'Convert raster PNG images into brand-aligned vector SVGs using AI-powered path tracing and optimization.',
    category: 'PNG to SVG Stylizer',
  },
  'complexity-slider': {
    title: 'Complexity Slider',
    description: 'Control the level of detail in converted SVGs. Lower values create simpler icons; higher values preserve more detail.',
    category: 'PNG to SVG Stylizer',
  },
  'shadow-canvas': {
    title: 'Shadow Canvas Validation',
    description: 'Pre-validation that analyzes ink density and centering before conversion to ensure quality results.',
    category: 'PNG to SVG Stylizer',
  },
  
  // Advanced Features
  'optical-sizing': {
    title: 'Optical Sizing',
    description: 'Automatically adjusts icon details based on display size. Small icons get simplified; large icons show finer details.',
    category: 'Advanced Features',
  },
  'semantic-states': {
    title: 'Semantic States',
    description: 'Pre-generated variants for Hover, Active, Success, Error, Warning, Skeleton, and Disabled states.',
    category: 'Advanced Features',
  },
  'kinetic-branding': {
    title: 'Kinetic Branding',
    description: 'Physics-based animations with brand personality. Choose entrance effects and interaction animations.',
    category: 'Advanced Features',
  },
  'brand-personality': {
    title: 'Brand Personality',
    description: 'Animation physics based on personality: Professional (controlled), Playful (bouncy), Luxury (elegant), Tech (precise).',
    category: 'Advanced Features',
  },
  
  // Hierarchy
  'brand-dna': {
    title: 'Brand DNA Lock',
    description: 'Global rules that ALL icons must follow: stroke width, caps, and pixel snapping. Ensures visual consistency.',
    category: 'Brand Hierarchy',
  },
  'style-overrides': {
    title: 'Style Overrides',
    description: 'Let sub-brands customize icons (fill mode, corners, colors) while respecting the parent brand\'s DNA Lock.',
    category: 'Brand Hierarchy',
  },
  'event-overlays': {
    title: 'Event-Mode Overlays',
    description: 'Temporary themed styles for events (film grain, holiday accents). Toggle off to restore core brand state.',
    category: 'Brand Hierarchy',
  },
  'color-mapping': {
    title: 'Color Slot Mapping',
    description: 'Define Primary, Secondary, Accent slots. Icons auto-recolor based on which brand they\'re assigned to.',
    category: 'Brand Hierarchy',
  },
  
  // App Icons
  'app-icons': {
    title: 'App Icon Generation',
    description: 'Generate icons for iOS, Android (adaptive), PWA, macOS, Windows, and favicons from a single source.',
    category: 'App Icon Generation',
  },
  'safe-zone': {
    title: 'Safe Zone',
    description: 'The guaranteed visible area of your icon. Ensures critical elements are visible regardless of mask shape.',
    category: 'App Icon Generation',
  },
  'mask-shapes': {
    title: 'Mask Shapes',
    description: 'Choose from Squircle (iOS-style), Circle, Rounded Rectangle, or Square for platform-specific appearance.',
    category: 'App Icon Generation',
  },
  
  // Batch Processing
  'batch-processing': {
    title: 'Batch Processing',
    description: 'Apply optical sizing, states, and animations to all icons in a library with a single click.',
    category: 'Advanced Features',
  },
  
  // Creator
  'icon-creator': {
    title: 'Icon Creator',
    description: 'Built into the Library tab — search 50K+ icons, browse Lucide, paste custom SVGs, or upload images to add to your collections.',
    category: 'Icon Studio Overview',
  },
} as const;

export type IconKitHelpSectionId = keyof typeof iconKitHelpSections;

interface IconKitTooltipProps {
  /** The help section ID to display */
  sectionId: IconKitHelpSectionId;
  /** Additional className for the trigger */
  className?: string;
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Position of the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Whether to show as inline with text */
  inline?: boolean;
  /** Custom children to wrap */
  children?: React.ReactNode;
  /** Show as a lightbulb tip instead of help circle */
  asTip?: boolean;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * IconKitTooltip - Contextual help that links to IconKIT documentation.
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <IconKitTooltip sectionId="optical-sizing" />
 * 
 * // Inline with label
 * <Label>Optical Sizes <IconKitTooltip sectionId="optical-sizing" inline /></Label>
 * 
 * // As a tip indicator
 * <IconKitTooltip sectionId="batch-generation" asTip />
 * ```
 */
export const IconKitTooltip: React.FC<IconKitTooltipProps> = ({
  sectionId,
  className,
  size = 'sm',
  side = 'top',
  inline = false,
  children,
  asTip = false,
}) => {
  const section = iconKitHelpSections[sectionId];
  const Icon = asTip ? Lightbulb : HelpCircle;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full",
            inline && "inline-flex ml-1 align-middle",
            asTip && "text-amber-500 hover:text-amber-400",
            className
          )}
        >
          {children || <Icon className={sizeMap[size]} />}
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="p-3 max-w-xs">
        <div className="space-y-2">
          <p className="font-medium text-sm">{section.title}</p>
          <p className="text-xs text-muted-foreground">{section.description}</p>
          <Link 
            to="/help?tab=iconkit"
            className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 hover:underline"
          >
            View in IconKIT <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * Quick tooltip presets for common Icon Studio sections
 */
export const IconKitTooltips = {
  // Tabs
  Library: () => <IconKitTooltip sectionId="library-tab" inline />,
  AIGenerator: () => <IconKitTooltip sectionId="ai-generator" inline />,
  Stylizer: () => <IconKitTooltip sectionId="stylizer" inline />,
  Advanced: () => <IconKitTooltip sectionId="optical-sizing" inline />,
  Hierarchy: () => <IconKitTooltip sectionId="brand-dna" inline />,
  AppIcons: () => <IconKitTooltip sectionId="app-icons" inline />,
  Creator: () => <IconKitTooltip sectionId="icon-creator" inline />,
  
  // Features
  LibraryHierarchy: () => <IconKitTooltip sectionId="library-hierarchy" inline />,
  StylePresets: () => <IconKitTooltip sectionId="style-presets" inline />,
  BatchGeneration: () => <IconKitTooltip sectionId="batch-generation" inline />,
  IconQualityScore: () => <IconKitTooltip sectionId="icon-quality-score" inline />,
  ComplexitySlider: () => <IconKitTooltip sectionId="complexity-slider" inline />,
  OpticalSizing: () => <IconKitTooltip sectionId="optical-sizing" inline />,
  SemanticStates: () => <IconKitTooltip sectionId="semantic-states" inline />,
  KineticBranding: () => <IconKitTooltip sectionId="kinetic-branding" inline />,
  BrandPersonality: () => <IconKitTooltip sectionId="brand-personality" inline />,
  BrandDNA: () => <IconKitTooltip sectionId="brand-dna" inline />,
  StyleOverrides: () => <IconKitTooltip sectionId="style-overrides" inline />,
  EventOverlays: () => <IconKitTooltip sectionId="event-overlays" inline />,
  ColorMapping: () => <IconKitTooltip sectionId="color-mapping" inline />,
  SafeZone: () => <IconKitTooltip sectionId="safe-zone" inline />,
  MaskShapes: () => <IconKitTooltip sectionId="mask-shapes" inline />,
  BatchProcessing: () => <IconKitTooltip sectionId="batch-processing" inline />,
};

export default IconKitTooltip;
