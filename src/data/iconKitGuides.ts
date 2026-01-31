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
  Check
} from "lucide-react";

/**
 * Step-by-Step Guides for IconKIT
 * Comprehensive walkthroughs for each major workflow
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
        description: 'Click Save to create your library. Now add icons via AI Generation, Creator, or Stylizer tabs.',
      }
    ]
  },
  {
    id: 'ai-generate-batch',
    title: 'Generate Icons with AI',
    description: 'Use AI to create brand-consistent icon sets in batch.',
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
        description: 'Choose from: Minimal Line, Bold Filled, Duotone, Outlined, Gradient, or Custom.',
        tip: 'Minimal Line works best for UI icons. Bold Filled is great for feature highlights.'
      },
      {
        step: 3,
        title: 'Configure Style Options',
        description: 'Adjust stroke width, corner radius, and fill mode to match your brand guidelines.',
      },
      {
        step: 4,
        title: 'Set Icon Count',
        description: 'Use the slider to select how many icons to generate (1-100). The AI maintains consistency across the batch.',
      },
      {
        step: 5,
        title: 'Describe Your Icons',
        description: 'Enter prompts like "shopping cart, checkout bag, payment card, receipt" or describe a category like "e-commerce icons".',
        tip: 'Be specific about the concepts. Separate multiple icons with commas.'
      },
      {
        step: 6,
        title: 'Generate & Review',
        description: 'Click Generate. Review each icon in the preview grid. Icons receive an IQS (Icon Quality Score).',
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
    description: 'Transform raster images into clean, scalable vector icons.',
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
        description: 'Drag and drop a PNG file or click to browse. Best results with clean, high-contrast images.',
        tip: 'Simple icons with clear shapes convert best. Complex photos may not work well.'
      },
      {
        step: 3,
        title: 'Pre-Validation Check',
        description: 'The Shadow Canvas analyzes your image for ink density and centering. Check the validation score.',
      },
      {
        step: 4,
        title: 'Select Style Preset',
        description: 'Choose a style preset that matches your brand: Minimal, Bold, Geometric, or Organic.',
      },
      {
        step: 5,
        title: 'Adjust Complexity',
        description: 'Use the complexity slider to control detail level. Lower = simpler. Use A/B preview to compare.',
        tip: 'Start with medium complexity and adjust based on the preview.'
      },
      {
        step: 6,
        title: 'Review Quality Score',
        description: 'Check the IQS (Icon Quality Score). Scores above 70 are production-ready. Below 70 may need tweaking.',
      },
      {
        step: 7,
        title: 'Export or Save',
        description: 'Download the SVG directly or save it to your icon library for future use.',
      }
    ]
  },
  {
    id: 'apply-advanced-features',
    title: 'Add Responsive Sizing & States',
    description: 'Apply optical sizing, semantic states, and animations to icons.',
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
        description: 'Click "Optical Size" section. The system generates Micro (12px), Regular (24px), and Display (64px+) variants.',
        tip: 'Micro variants have thicker strokes for legibility. Display variants have finer details.'
      },
      {
        step: 4,
        title: 'Create State Variants',
        description: 'Click "States" section. Generate variants for Default, Hover, Active, Success, Error, Warning, Skeleton, and Disabled states.',
      },
      {
        step: 5,
        title: 'Add Animations',
        description: 'Click "Animation" section. Choose a brand personality (Professional, Playful, etc.) and entrance/interaction animations.',
      },
      {
        step: 6,
        title: 'Preview & Test',
        description: 'Use the preview area to test each variant. Click Play to see animations in action.',
      },
      {
        step: 7,
        title: 'Export Assets',
        description: 'Export as JSON (all variants), CSS (animation code), or Lottie (animation data).',
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
        tip: 'For consistency, use the same settings across your entire library.'
      },
      {
        step: 6,
        title: 'Start Batch Processing',
        description: 'Click "Process All Icons". A progress bar shows the status as each icon is processed.',
      },
      {
        step: 7,
        title: 'Export Complete Package',
        description: 'Once complete, click "Export All" to download a ZIP containing all variants, CSS, and animation data.',
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
        title: 'Define Brand DNA',
        description: 'Set the "DNA Lock" rules that ALL icons must follow: stroke width, stroke caps (round/square/butt), pixel snapping.',
        tip: 'These locked properties ensure visual consistency across all sub-brands.'
      },
      {
        step: 3,
        title: 'Add Sub-Brand Overrides',
        description: 'Click "Add Override" to create rules for sub-brands. Override properties like fill mode, corner style, or color palette.',
      },
      {
        step: 4,
        title: 'Configure Color Mapping',
        description: 'Define Primary, Secondary, and Accent color slots. Sub-brands map their colors to these slots.',
        tip: 'Same icons, different palettes, zero redesign needed.'
      },
      {
        step: 5,
        title: 'Create Event Overlays',
        description: 'Add temporary themed styles for events (e.g., film grain for a festival, holiday accents).',
      },
      {
        step: 6,
        title: 'Preview Hierarchy',
        description: 'Use the preview panel to see how icons appear across different brands and events.',
      },
      {
        step: 7,
        title: 'Export Brand Book',
        description: 'Generate a PDF showing the master icon set and how it appears across all sub-brands.',
      }
    ]
  },
  {
    id: 'generate-app-icons',
    title: 'Create App Icon Package',
    description: 'Generate icons for iOS, Android, PWA, and desktop platforms.',
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
        description: 'Choose an icon from your library or upload a new high-resolution image (1024x1024 recommended).',
        tip: 'Use a simple, recognizable design that works at small sizes.'
      },
      {
        step: 3,
        title: 'Choose Target Platforms',
        description: 'Select the platforms you need: iOS, Android (Adaptive), PWA, macOS, Windows, Favicon.',
      },
      {
        step: 4,
        title: 'Select Mask Shape',
        description: 'Choose from Squircle (iOS-style), Circle, Rounded Rectangle, or Square.',
      },
      {
        step: 5,
        title: 'Check Safe Zone',
        description: 'Toggle safe zone preview to ensure critical elements are visible on all platforms.',
        tip: 'Android adaptive icons can be masked differently by launchers.'
      },
      {
        step: 6,
        title: 'Preview All Sizes',
        description: 'Review the icon at different sizes to ensure legibility and visual appeal.',
      },
      {
        step: 7,
        title: 'Export Package',
        description: 'Click "Export All" to download a ZIP with all sizes, properly named for each platform.',
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
