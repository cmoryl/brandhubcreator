import { Palette, Wand2, Layers, Sparkles, GitBranch, Smartphone, PenTool } from "lucide-react";

/**
 * IconKIT Knowledge Base Content
 * Comprehensive documentation for the Icon Studio and related features
 */

export const iconKitArchitecture = `
graph TB
    subgraph Entry["🎨 Icon Studio (7 Tabs)"]
        Library["📚 Library Tab"]
        AIGen["🤖 AI Generator"]
        Stylizer["✨ Stylizer"]
        Advanced["⚡ Advanced"]
        Hierarchy["🌳 Hierarchy"]
        AppIcons["📱 App Icons"]
        Creator["✏️ Creator"]
    end

    subgraph Hooks["🔧 Core Hooks"]
        useIconLibraries["useIconLibraries"]
        useIconOptimizer["useIconOptimizer"]
        useStylizer["useStylizer"]
        useResponsiveIcon["useResponsiveIcon"]
        useIconStateSystem["useIconStateSystem"]
        useKineticBranding["useKineticBranding"]
        useIconHierarchy["useIconHierarchy"]
    end

    subgraph Features["✨ Feature Modules"]
        DNA["Brand DNA Lock"]
        Overrides["Style Overrides"]
        Events["Event Overlays"]
        ColorSlots["Color Mapping"]
        OpticalSize["Optical Sizing"]
        States["Semantic States"]
        Animations["Kinetic Animations"]
    end

    subgraph Output["📦 Outputs"]
        SVG["Optimized SVGs"]
        PNG["PNG Exports"]
        AppBundle["App Icon Bundles"]
        PDF["Brand Book PDF"]
        CSS["CSS Variables"]
    end

    Library --> useIconLibraries
    AIGen --> useIconOptimizer
    Stylizer --> useStylizer
    Advanced --> useResponsiveIcon
    Advanced --> useIconStateSystem
    Advanced --> useKineticBranding
    Hierarchy --> useIconHierarchy
    AppIcons --> useIconOptimizer
    Creator --> useIconLibraries

    useIconHierarchy --> DNA
    useIconHierarchy --> Overrides
    useIconHierarchy --> Events
    useIconHierarchy --> ColorSlots
    useResponsiveIcon --> OpticalSize
    useIconStateSystem --> States
    useKineticBranding --> Animations

    DNA --> SVG
    Overrides --> SVG
    OpticalSize --> SVG
    States --> SVG
    Animations --> CSS
    useIconOptimizer --> PNG
    useIconOptimizer --> AppBundle
    useIconHierarchy --> PDF
`;

export const iconKitFaqs = [
  {
    category: "Icon Studio Overview",
    icon: Palette,
    questions: [
      {
        q: "What is the Icon Studio?",
        a: "The Icon Studio is a unified 7-tab hub for all iconography tasks. It consolidates Library Management, AI Generation, PNG-to-SVG Stylization, Advanced Features (Responsive/Stateful/Kinetic), Brand Hierarchy mapping, App Icon Generation, and SVG Creation into one cohesive brand-building system."
      },
      {
        q: "How do I access the Icon Studio?",
        a: "Navigate to any brand guide, scroll to the Iconography section, and click 'Open Icon Studio'. The studio opens as a full-screen modal with all seven tabs accessible from the top navigation."
      },
      {
        q: "What's the difference between the Library and Creator tabs?",
        a: "The Library tab manages your organized icon collections with a 3-level hierarchy (Core → Product Line → Brand). The Creator tab is for quickly adding individual icons from the Lucide library of 3,480+ icons to your collections."
      }
    ]
  },
  {
    category: "AI Icon Generation",
    icon: Wand2,
    questions: [
      {
        q: "How does AI icon generation work?",
        a: "The AI Generator creates brand-consistent icons based on text prompts. Select a style preset (Minimal Line, Bold Filled, Duotone, etc.), describe what you need, and the AI generates production-ready SVGs that match your brand's visual language."
      },
      {
        q: "What style presets are available?",
        a: "Available presets include: Minimal Line (thin strokes), Bold Filled (solid shapes), Duotone (two-tone fills), Outlined (stroke-only), Gradient (color transitions), and Custom (define your own style parameters)."
      },
      {
        q: "Can I generate icons in batch?",
        a: "Yes! Use the icon count slider to generate up to 100 icons at once. The AI maintains visual consistency across the entire batch, ensuring all icons look like they belong to the same family."
      },
      {
        q: "What makes the generated icons 'production-ready'?",
        a: "Generated icons follow the Senior SVG Architect specification: 24x24 pixel grid, 20px safe zone, single clean paths, whole-number coordinates, and file sizes under 2KB. Each icon receives an Icon Quality Score (IQS) from 1-100."
      }
    ]
  },
  {
    category: "PNG to SVG Stylizer",
    icon: Sparkles,
    questions: [
      {
        q: "What is the Stylizer?",
        a: "The Stylizer converts raster PNG images into brand-aligned vector SVGs using a multi-stage AI pipeline. It's perfect for converting legacy icons, sketches, or bitmap assets into scalable, editable vectors."
      },
      {
        q: "How does the conversion process work?",
        a: "The Stylizer uses a hidden Shadow Canvas for pre-validation (analyzing ink density and centering), applies style matching to your brand guidelines, and runs an auto-simplification engine that optimizes paths and anchor counts."
      },
      {
        q: "What is the complexity slider for?",
        a: "The complexity slider controls the level of detail in the converted SVG. Lower values create simpler, more minimal icons. Higher values preserve more detail. Use A/B comparison to see the difference before committing."
      },
      {
        q: "What quality checks are performed?",
        a: "A 3-layer validation system checks: Semantic Prompting (meaning preserved), SVG Post-Processing (clean code), and Icon Quality Audit (optical weight, legibility, production readiness). Results show as an IQS score."
      }
    ]
  },
  {
    category: "Advanced Features",
    icon: Layers,
    questions: [
      {
        q: "What are Responsive Icons (Optical Sizing)?",
        a: "Optical sizing automatically adjusts icon details based on display size. Small icons (16px) get simplified details and thicker strokes for legibility. Large icons (48px+) can show finer details. This ensures icons look perfect at any size."
      },
      {
        q: "What are Semantic States?",
        a: "Semantic States define how icons appear in different contexts: Default, Hover, Active, Disabled, Selected, and Error. Each state can have different colors, opacity, or subtle animations to provide clear user feedback."
      },
      {
        q: "What is Kinetic Branding?",
        a: "Kinetic Branding adds motion to icons through physics-based animations. Define your brand's personality (Playful, Professional, Energetic) and the system generates appropriate entrance animations, hover effects, and interaction responses."
      },
      {
        q: "Can I apply advanced features to existing icons?",
        a: "Yes! Select any icon from your library and apply optical sizing variants, semantic states, or kinetic animations. The system generates all variants while maintaining your brand's visual identity."
      }
    ]
  },
  {
    category: "Brand Hierarchy",
    icon: GitBranch,
    questions: [
      {
        q: "What is Brand DNA Lock?",
        a: "Brand DNA Lock defines global rules that ALL icons in your organization must follow: stroke width, stroke caps (round/square/butt), corner radius, and pixel snapping. These 'locked' properties ensure visual consistency across sub-brands."
      },
      {
        q: "How do Style Overrides work?",
        a: "Style Overrides let sub-brands customize icons while respecting the DNA Lock. A sub-brand can change fill mode (outline to solid), corner style (sharp to round), or colors without breaking the parent brand's stroke rules."
      },
      {
        q: "What are Event-Mode Overlays?",
        a: "Event-Mode Overlays apply temporary themed styles to your entire icon set. For a film festival, add film grain texture. For holidays, add seasonal accents. Toggle the event off and icons return to their core brand state."
      },
      {
        q: "How does Color Slot Mapping work?",
        a: "Define Primary, Secondary, and Accent color slots. Icons automatically recolor based on which brand/sub-brand they're assigned to. Brand A uses Blue/Gold, Brand B uses Green/White—same icons, different palettes, zero redesign."
      },
      {
        q: "What is the inheritance hierarchy?",
        a: "Parent Brand → Sub-Brand → Product → Event. Parent defines DNA (rules). Sub-Brand applies style overrides. Products get 20 unique 'tool' icons. Events add temporary decorative layers. Each level inherits from above."
      }
    ]
  },
  {
    category: "App Icon Generation",
    icon: Smartphone,
    questions: [
      {
        q: "What platforms are supported for app icons?",
        a: "The App Icons tab generates icons for iOS (all required sizes), Android (adaptive icons with foreground/background), PWA (manifest icons), macOS, Windows, and favicon packages. All from a single source design."
      },
      {
        q: "What mask shapes are available?",
        a: "Choose from Squircle (iOS-style rounded square), Circle, Rounded Rectangle, or Square. The preview shows exactly how your icon will appear on each platform with the selected mask."
      },
      {
        q: "What is the safe zone?",
        a: "The safe zone is the guaranteed visible area of your icon. On Android, adaptive icons can be masked differently by launchers. The safe zone preview shows the inner area that's always visible regardless of mask shape."
      },
      {
        q: "Can I export all sizes at once?",
        a: "Yes! Click 'Export All' to download a ZIP containing every size for your selected platforms. The package includes properly named files ready to drop into your Xcode, Android Studio, or web project."
      }
    ]
  },
  {
    category: "Icon Libraries & Organization",
    icon: PenTool,
    questions: [
      {
        q: "What is the 3-level library hierarchy?",
        a: "Icons are organized in three levels: Core (universal icons used everywhere—Home, Search, User), Product Line (shared across related products), and Brand (specific to one brand or sub-brand). This ensures consistency while allowing customization."
      },
      {
        q: "How do I create a new icon library?",
        a: "In the Library tab, click 'Create Library'. Name it, select the hierarchy level (Core/Product Line/Brand), and optionally link it to a parent library for inheritance. New libraries start empty—add icons via AI generation or the Creator."
      },
      {
        q: "Can I drag and drop icons between libraries?",
        a: "Yes! The Library tab supports drag-and-drop. Move icons between libraries, reorder within a library, or duplicate icons to multiple libraries while maintaining links to the original for synchronized updates."
      },
      {
        q: "How do I export my icon library?",
        a: "Select a library and click 'Export'. Choose format (SVG, PNG, or both), size variants, and color mode. For developers, export includes a CSS file with variable themes so icons change color based on the page theme."
      },
      {
        q: "What is the Icon Quality Score (IQS)?",
        a: "IQS is a 1-100 rating evaluating: optical weight (visual balance), legibility (clear at small sizes), production readiness (clean paths, small file size), and brand alignment. Scores below 70 suggest the icon needs optimization."
      }
    ]
  }
];

export const iconKitQuickStart = [
  {
    step: 1,
    title: "Open Icon Studio",
    description: "Navigate to any brand guide → Iconography section → Click 'Open Icon Studio'"
  },
  {
    step: 2,
    title: "Set Brand DNA",
    description: "Go to Hierarchy tab → Define your global stroke width, caps, and corner rules"
  },
  {
    step: 3,
    title: "Create a Library",
    description: "Library tab → Create Library → Choose hierarchy level (Core/Product/Brand)"
  },
  {
    step: 4,
    title: "Generate Icons",
    description: "AI Generator tab → Select style preset → Describe icons → Generate batch"
  },
  {
    step: 5,
    title: "Add Advanced Features",
    description: "Advanced tab → Apply optical sizing, states, or animations as needed"
  },
  {
    step: 6,
    title: "Export",
    description: "Export icons for web, iOS, Android, or generate a Brand Book PDF"
  }
];
