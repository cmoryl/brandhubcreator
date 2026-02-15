import { 
  Palette, 
  Wand2, 
  Layers, 
  Sparkles, 
  GitBranch, 
  Smartphone, 
  PenTool,
  Upload,
  Download,
  Eye,
  Zap,
  Play,
  Settings2,
  FolderPlus,
  Search,
  MousePointer,
  Check,
  Shapes,
  Ruler
} from "lucide-react";

/**
 * Step-by-Step Guides for IconKIT
 * Comprehensive walkthroughs for each major workflow
 * Updated: 2026 — includes Shape Manager, SVG Architect, multi-scale previews
 */

export interface GuideStep {
  step: number;
  title: string;
  description: string;
  tip?: string;
}

export interface IconKitGuide {
  id: string;
  title: string;
  description: string;
  icon: typeof Palette;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: GuideStep[];
}

export const iconKitGuides: IconKitGuide[] = [
  {
    id: 'create-library',
    title: 'Create Your First Icon Library',
    description: 'Set up an organized icon collection with the 3-level hierarchy system.',
    icon: FolderPlus,
    duration: '3 min',
    difficulty: 'beginner',
    steps: [
      {
        step: 1,
        title: 'Open Icon Studio',
        description: 'Navigate to any brand guide, scroll to the Iconography section, and click "Open Icon Studio" button.',
        tip: 'The Icon Studio is your central hub for all icon operations.'
      },
      {
        step: 2,
        title: 'Go to Library Tab',
        description: 'Click on the "Library" tab (first tab) in the Icon Studio navigation.',
      },
      {
        step: 3,
        title: 'Click Create Library',
        description: 'Click the "Create Library" button in the top-right corner of the Library panel.',
      },
      {
        step: 4,
        title: 'Name Your Library',
        description: 'Enter a descriptive name like "Core Icons", "Product Navigation", or "Marketing Assets".',
        tip: 'Use clear names that indicate the library\'s purpose or scope.'
      },
      {
        step: 5,
        title: 'Select Hierarchy Level',
        description: 'Choose the appropriate level: Core (universal), Product Line (shared), or Brand (specific).',
        tip: 'Core icons are used everywhere. Brand icons are specific to one brand or sub-brand.'
      },
      {
        step: 6,
        title: 'Link to Parent (Optional)',
        description: 'If creating a Product or Brand library, optionally link it to a parent library for inheritance.',
      },
      {
        step: 7,
        title: 'Save & Start Adding Icons',
        description: 'Click Save to create your library. Now add icons via AI Generation, Creator, Stylizer, or the Shape Manager.',
      }
    ]
  },
  {
    id: 'ai-generate-batch',
    title: 'Generate Icons with AI',
    description: 'Use the SVG Architect AI to create brand-consistent icon sets in batch.',
    icon: Wand2,
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        step: 1,
        title: 'Open AI Generator Tab',
        description: 'In Icon Studio, click on the "AI Generator" tab (second tab).',
      },
      {
        step: 2,
        title: 'Select Style Preset',
        description: 'Choose from 17+ presets: Minimal Line, Bold Filled, Duotone, Outlined, Gradient, Flat, Isometric, Hand-Drawn, Pixel Art, Neon Glow, Glassmorphism, Brutalist, Retro, Corporate, Playful, Sketch, or Custom.',
        tip: 'Minimal Line works best for UI icons. Bold Filled is great for feature highlights.'
      },
      {
        step: 3,
        title: 'Configure Style Options',
        description: 'Adjust stroke width, corner radius, and fill mode. The AI enforces the SVG Architect spec: 24×24 grid, keyline geometry, and path-only construction.',
      },
      {
        step: 4,
        title: 'Set Icon Count',
        description: 'Use the slider to select how many icons to generate (1-100). The AI maintains consistency across the batch.',
      },
      {
        step: 5,
        title: 'Describe Your Icons',
        description: 'Enter prompts like "shopping cart, checkout bag, payment card, receipt" or describe a category like "e-commerce navigation icons".',
        tip: 'Be specific about concepts. Separate multiple icons with commas. Add style cues like "with rounded corners".'
      },
      {
        step: 6,
        title: 'Generate & Review',
        description: 'Click Generate. Review each icon in the preview grid. Each icon receives an IQS (Icon Quality Score) from 1-100. Use "View Larger" for multi-scale preview (16px-64px).',
      },
      {
        step: 7,
        title: 'Save to Library',
        description: 'Select the icons you want to keep, choose a destination library, and click "Add to Library".',
      }
    ]
  },
  {
    id: 'convert-png-svg',
    title: 'Convert PNG to SVG (Stylizer)',
    description: 'Transform raster images into clean, scalable vector icons meeting SVG Architect standards.',
    icon: Sparkles,
    duration: '4 min',
    difficulty: 'intermediate',
    steps: [
      {
        step: 1,
        title: 'Open Stylizer Tab',
        description: 'In Icon Studio, click on the "Stylizer" tab (third tab).',
      },
      {
        step: 2,
        title: 'Upload Your PNG',
        description: 'Drag and drop a PNG file or click to browse. Best results with clean, high-contrast images on transparent backgrounds.',
        tip: 'Simple icons with clear shapes convert best. Complex photos may not produce usable results.'
      },
      {
        step: 3,
        title: 'Pre-Validation Check',
        description: 'The Shadow Canvas analyzes your image for ink density, centering, and contrast. Check the validation score before proceeding.',
      },
      {
        step: 4,
        title: 'Select Style Preset',
        description: 'Choose a style preset that matches your brand: Minimal, Bold, Geometric, Organic, or any of the 17+ AI presets.',
      },
      {
        step: 5,
        title: 'Adjust Complexity',
        description: 'Use the complexity slider to control detail level. Lower = simpler (fewer path points). Use A/B comparison to preview.',
        tip: 'Start with medium complexity. The output follows SVG Architect specs: max 3 <path> elements, under 2KB.'
      },
      {
        step: 6,
        title: 'Review Quality Score',
        description: 'Check the IQS (Icon Quality Score). Scores above 70 are production-ready. Below 70 may need complexity adjustment or manual refinement.',
      },
      {
        step: 7,
        title: 'Multi-Scale Preview',
        description: 'Click "View Larger" to verify the icon at 16px, 24px, 32px, 48px, and 64px before saving.',
      },
      {
        step: 8,
        title: 'Export or Save',
        description: 'Download the SVG directly or save it to your icon library for future use.',
      }
    ]
  },
  {
    id: 'use-shape-manager',
    title: 'Browse & Customize Design Shapes',
    description: 'Explore 1,300+ SVG shapes across general and industry-specific categories.',
    icon: Shapes,
    duration: '3 min',
    difficulty: 'beginner',
    steps: [
      {
        step: 1,
        title: 'Open the Shape Manager',
        description: 'In the Design Elements section of your brand guide, click "Browse Shapes" to open the Shape Manager dialog.',
      },
      {
        step: 2,
        title: 'Choose a Category',
        description: 'Browse General shapes (600+ Geometric, Organic, Abstract, UI elements) or Industry shapes (700+ across 14 sectors like Technology, Healthcare, Finance).',
        tip: 'Each industry has 50 dedicated shapes tailored to that sector\'s visual language.'
      },
      {
        step: 3,
        title: 'Search & Preview',
        description: 'Use the search bar to find shapes by name. Click any shape to see a larger preview with details.',
      },
      {
        step: 4,
        title: 'Open Shape Editor',
        description: 'Click "Edit" on any shape to open the real-time editor. Adjust Fill color, Stroke color and width, and Opacity.',
        tip: 'The editor uses regex-based SVG attribute injection for instant preview — changes render in real-time.'
      },
      {
        step: 5,
        title: 'Save to Brand',
        description: 'Click "Add to Brand" to save the customized shape. It persists in the customShapes field of your brand\'s guide data.',
      }
    ]
  },
  {
    id: 'apply-advanced-features',
    title: 'Add Responsive Sizing & States',
    description: 'Apply optical sizing, semantic states, and kinetic animations to icons.',
    icon: Layers,
    duration: '6 min',
    difficulty: 'intermediate',
    steps: [
      {
        step: 1,
        title: 'Select an Icon',
        description: 'In the Library tab, click on any icon to select it. It will appear highlighted.',
      },
      {
        step: 2,
        title: 'Open Advanced Tab',
        description: 'Click on the "Advanced" tab (fourth tab) to access enhancement features.',
      },
      {
        step: 3,
        title: 'Generate Optical Sizes',
        description: 'Click "Optical Size" section. The system generates Micro (12-16px), Regular (24px), and Display (48-64px+) variants with automatically adjusted detail levels.',
        tip: 'Micro variants have thicker strokes for legibility. Display variants have finer details and thinner strokes.'
      },
      {
        step: 4,
        title: 'Create State Variants',
        description: 'Click "States" section. Generate variants for Default, Hover, Active, Disabled, Selected, Success, Error, Warning, and Skeleton loading states.',
      },
      {
        step: 5,
        title: 'Add Kinetic Animations',
        description: 'Click "Animation" section. Choose a brand personality (Professional, Playful, Energetic, Calm, Bold) and configure entrance, hover, interaction, and exit animations.',
      },
      {
        step: 6,
        title: 'Preview & Test',
        description: 'Use the preview area to test each variant. Click Play to see animations in action. Verify optical sizes at 16px through 64px.',
      },
      {
        step: 7,
        title: 'Export Assets',
        description: 'Export as JSON (all variants), CSS (keyframe animations and state classes), Lottie (complex animation data), or SVG (size variants).',
      }
    ]
  },
  {
    id: 'batch-processing',
    title: 'Batch Process an Entire Library',
    description: 'Apply optical sizing, states, and animations to all icons at once.',
    icon: Zap,
    duration: '3 min',
    difficulty: 'advanced',
    steps: [
      {
        step: 1,
        title: 'Select Your Library',
        description: 'In the Library tab, select the library you want to batch process by clicking its name in the sidebar.',
      },
      {
        step: 2,
        title: 'Open Advanced Tab',
        description: 'Switch to the "Advanced" tab to access batch processing options.',
      },
      {
        step: 3,
        title: 'Click "Batch Process Library"',
        description: 'Find the Batch Processing panel at the top of the Advanced tab. Click the main action button.',
      },
      {
        step: 4,
        title: 'Select Features to Apply',
        description: 'Check the features you want: Optical Sizes, State Variants, Kinetic Animations. Select all or just the ones you need.',
      },
      {
        step: 5,
        title: 'Configure Settings',
        description: 'Choose animation personality, entrance type, and interaction type. These apply to all icons uniformly.',
        tip: 'For consistency, use the same settings across your entire library. Batch supports up to 100 icons.'
      },
      {
        step: 6,
        title: 'Start Batch Processing',
        description: 'Click "Process All Icons". A progress bar shows the status as each icon is processed.',
      },
      {
        step: 7,
        title: 'Export Complete Package',
        description: 'Once complete, click "Export All" to download a ZIP containing all variants, CSS, Lottie animations, and documentation.',
      }
    ]
  },
  {
    id: 'setup-brand-hierarchy',
    title: 'Configure Brand DNA & Overrides',
    description: 'Set up parent-child icon inheritance for multi-brand organizations.',
    icon: GitBranch,
    duration: '8 min',
    difficulty: 'advanced',
    steps: [
      {
        step: 1,
        title: 'Open Hierarchy Tab',
        description: 'In Icon Studio, click on the "Hierarchy" tab (fifth tab).',
      },
      {
        step: 2,
        title: 'Define Brand DNA Lock',
        description: 'Set the immutable "DNA Lock" rules that ALL icons must follow: stroke width, stroke caps (round/square/butt), corner radius, and pixel snapping.',
        tip: 'These locked properties cannot be overridden by sub-brands — they ensure visual consistency everywhere.'
      },
      {
        step: 3,
        title: 'Add Sub-Brand Overrides',
        description: 'Click "Add Override" to create customization rules for sub-brands. Override fill mode, corner style, colors, or opacity while respecting the DNA Lock.',
      },
      {
        step: 4,
        title: 'Configure Color Slot Mapping',
        description: 'Define Primary, Secondary, and Accent color slots at the org level. Sub-brands map their palette to these slots automatically.',
        tip: 'Same icons, different palettes, zero redesign — Brand A uses Blue/Gold, Brand B uses Green/White.'
      },
      {
        step: 5,
        title: 'Create Event Overlays',
        description: 'Add temporary themed styles for events (e.g., film grain for a festival, holiday accents, launch spotlight effects). Toggle off to revert.',
      },
      {
        step: 6,
        title: 'Preview Hierarchy',
        description: 'Use the preview panel to see how icons appear across different brands, products, and events simultaneously.',
      },
      {
        step: 7,
        title: 'Export Brand Book',
        description: 'Generate a comprehensive PDF showing the master icon set, DNA rules, and how icons appear across all sub-brands and events.',
      }
    ]
  },
  {
    id: 'generate-app-icons',
    title: 'Create App Icon Package',
    description: 'Generate icons for iOS, Android, PWA, macOS, Windows, and favicons.',
    icon: Smartphone,
    duration: '4 min',
    difficulty: 'beginner',
    steps: [
      {
        step: 1,
        title: 'Open App Icons Tab',
        description: 'In Icon Studio, click on the "App Icons" tab (sixth tab).',
      },
      {
        step: 2,
        title: 'Select Source Icon',
        description: 'Choose an icon from your library or upload a new high-resolution image (1024×1024 recommended).',
        tip: 'Use a simple, recognizable design that works at small sizes (16px).'
      },
      {
        step: 3,
        title: 'Choose Target Platforms',
        description: 'Select the platforms you need: iOS (20pt-1024pt), Android Adaptive (with foreground/background), PWA (192px/512px), macOS (16px-1024px), Windows ICO, Favicon package.',
      },
      {
        step: 4,
        title: 'Select Mask Shape',
        description: 'Choose from Squircle (iOS continuous curve), Circle, Rounded Rectangle, or Square.',
      },
      {
        step: 5,
        title: 'Check Safe Zone',
        description: 'Toggle safe zone preview (inner 66%) to ensure critical elements are visible across all platform masks.',
        tip: 'Android adaptive icons can be masked differently by launchers — always respect the safe zone.'
      },
      {
        step: 6,
        title: 'Preview All Sizes',
        description: 'Review the icon at every target size to ensure legibility and visual appeal at small and large scales.',
      },
      {
        step: 7,
        title: 'Export Package',
        description: 'Click "Export All" to download a ZIP with all sizes, properly named for each platform, including contents.json for iOS asset catalogs.',
      }
    ]
  },
  {
    id: 'svg-architect-standards',
    title: 'Understanding SVG Architect Standards',
    description: 'Learn the professional icon standards enforced across all IconKIT outputs.',
    icon: Ruler,
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        step: 1,
        title: 'The 24×24 Grid',
        description: 'All icons use a 24×24 pixel canvas as the base grid. This is the most widely adopted icon size standard, compatible with Material Design, iOS SF Symbols guidelines, and web component libraries.',
      },
      {
        step: 2,
        title: 'Keyline Geometry',
        description: 'Icons align to keyline shapes: an 18×18 square and a 20px diameter circle centered on the canvas. Square icons fill the 18×18 area. Round icons fill the 20px circle. This ensures all icons appear optically consistent.',
        tip: 'Even organic shapes should roughly align to keylines for visual harmony in icon grids.'
      },
      {
        step: 3,
        title: 'Path-Only Construction',
        description: 'Icons use only <path> elements — no <rect>, <circle>, <line>, or other SVG primitives. Coordinates are baked directly into path data for maximum rendering compatibility.',
      },
      {
        step: 4,
        title: 'Coordinate Snapping',
        description: 'All coordinates snap to whole pixels or 0.5px increments. This prevents sub-pixel rendering artifacts that cause blurry icons on non-retina displays.',
        tip: 'Avoid coordinates like 12.33 — use 12 or 12.5 instead.'
      },
      {
        step: 5,
        title: 'Path Limits & File Size',
        description: 'Maximum 3 closed <path> elements per icon. Target file size under 2KB. These constraints ensure fast loading and clean rendering across all platforms.',
      },
      {
        step: 6,
        title: 'Quality Scoring (IQS)',
        description: 'The Icon Quality Score (1-100) evaluates: optical weight balance, legibility at 16px, production readiness (clean paths, small size), and brand alignment. Icons below 70 receive optimization recommendations.',
      }
    ]
  }
];

export const getGuideById = (id: string): IconKitGuide | undefined => {
  return iconKitGuides.find(guide => guide.id === id);
};

export const getGuidesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): IconKitGuide[] => {
  return iconKitGuides.filter(guide => guide.difficulty === difficulty);
};
