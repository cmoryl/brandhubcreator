import { Palette, Wand2, Layers, Sparkles, GitBranch, Smartphone, PenTool, Shapes, Eye, Ruler } from "lucide-react";

/**
 * IconKIT Knowledge Base Content
 * Comprehensive documentation for the Icon Studio and related features
 * Updated: 2026 — includes Shape Manager, SVG Architect specs, multi-scale previews
 */

export const iconKitArchitecture = `
graph TB
    subgraph Entry["🎨 Icon Studio (4 Tabs)"]
        LibraryTab["📚 Library & Import"]
        AIGen["🤖 AI Generate"]
        StyleTab["🎨 Style"]
        ExportTab["📦 Export"]
    end

    subgraph StyleSub["Style Sub-Views"]
        Colorize["🎨 Colorize"]
        BrandRules["🌳 Brand Rules"]
        AppIcons["📱 App Icons"]
    end

    subgraph ShapeEngine["🔷 Shape Manager"]
        GeneralShapes["600+ General Shapes"]
        IndustryShapes["700+ Industry Shapes"]
        ShapeEditor["Shape Editor (Fill/Stroke/Opacity)"]
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
        ShapeExport["Custom Shapes (JSONB)"]
    end

    LibraryTab --> useIconLibraries
    AIGen --> useIconOptimizer
    StyleTab --> Colorize
    StyleTab --> BrandRules
    StyleTab --> AppIcons
    Colorize --> useStylizer
    BrandRules --> useIconHierarchy
    AppIcons --> useIconOptimizer
    ExportTab --> useIconOptimizer

    ShapeEngine --> ShapeEditor
    ShapeEditor --> ShapeExport

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
        a: "The Icon Studio (IconKIT) is a streamlined 4-tab hub for all iconography tasks: Library (browse, manage, upload & import icons), AI Generate (AI-powered icon creation), Style (colorize, brand rules, app icons), and Export (batch export in multiple formats). Everything is freely navigable — no forced sequential steps."
      },
      {
        q: "How do I access the Icon Studio?",
        a: "Navigate to any brand guide, scroll to the Iconography section, and click 'Open Icon Studio'. The studio opens as a full-screen modal with four clear tabs accessible from the top navigation."
      },
      {
        q: "How is the Library tab organized?",
        a: "The Library tab combines collection management and icon importing in one view. Browse your organized icon collections with a 3-level hierarchy (Core → Product Line → Brand), and below that, add icons from Lucide (3,480+), browse 50K+ icons, paste custom SVGs, upload images, or get AI suggestions — all without switching tabs."
      },
      {
        q: "What is the Icon Quality Score (IQS)?",
        a: "IQS is a 1-100 rating evaluating: optical weight (visual balance), legibility (clear at small sizes), production readiness (clean paths, small file size under 2KB), and brand alignment. Scores below 70 suggest the icon needs optimization. Each AI-generated and stylized icon receives an automatic IQS rating."
      },
      {
        q: "Can I preview icons at multiple sizes?",
        a: "Yes! The IconPreviewDialog ('View Larger') shows multi-scale previews from 16px to 64px so you can verify legibility and detail at every common size. You can also add individual icons directly to brands from this preview."
      }
    ]
  },
  {
    category: "AI Icon Generation",
    icon: Wand2,
    questions: [
      {
        q: "How does AI icon generation work?",
        a: "The AI Generator uses an 'SVG Architect' prompt system that enforces professional standards: 24×24 pixel grids, keyline geometry (18×18 square / 20px circle), a maximum of 3 closed <path> elements, and coordinate snapping to whole or 0.5 pixels. This produces production-ready SVGs that match your brand's visual language."
      },
      {
        q: "What style presets are available?",
        a: "Available presets include: Minimal Line (thin strokes), Bold Filled (solid shapes), Duotone (two-tone fills), Outlined (stroke-only), Gradient (color transitions), Flat, Isometric, Hand-Drawn, Pixel Art, Neon Glow, Glassmorphism, Brutalist, Retro, Corporate, Playful, Sketch, and Custom (define your own style parameters)."
      },
      {
        q: "Can I generate icons in batch?",
        a: "Yes! Use the icon count slider to generate up to 100 icons at once. The AI maintains visual consistency across the entire batch, ensuring all icons look like they belong to the same family. Each icon follows the SVG Architect specification for uniform quality."
      },
      {
        q: "What makes generated icons 'production-ready'?",
        a: "Generated icons follow the Senior SVG Architect specification: 24×24 pixel grid, 20px safe zone, keyline geometry (18×18 square / 20px circle), single clean paths (max 3 <path> elements), whole-number or 0.5px coordinates, no primitives (only paths with baked-in coordinates), and file sizes under 2KB. The rendering engine detects full SVG strings and viewBox attributes to prevent clipping."
      },
      {
        q: "How do I refine generated icons?",
        a: "After generation, review each icon in the preview grid. Icons with low IQS scores can be regenerated individually with adjusted prompts. You can also use the Style tab → Colorize to apply brand colors, or the Shape Editor for manual fill/stroke/opacity adjustments."
      }
    ]
  },
  {
    category: "PNG to SVG Stylizer",
    icon: Sparkles,
    questions: [
      {
        q: "What is the Stylizer?",
        a: "The Stylizer converts raster PNG images into brand-aligned vector SVGs using a multi-stage AI pipeline. It's perfect for converting legacy icons, sketches, or bitmap assets into scalable, editable vectors that meet the SVG Architect specification."
      },
      {
        q: "How does the conversion process work?",
        a: "The Stylizer uses a hidden Shadow Canvas for pre-validation (analyzing ink density, centering, and contrast), applies style matching to your brand guidelines, and runs an auto-simplification engine that optimizes paths and anchor counts. The output follows the 24×24 grid with path-only construction."
      },
      {
        q: "What is the complexity slider for?",
        a: "The complexity slider controls the level of detail in the converted SVG. Lower values create simpler, more minimal icons with fewer path points. Higher values preserve more detail. Use the A/B comparison toggle to see the difference before committing."
      },
      {
        q: "What quality checks are performed?",
        a: "A 3-layer validation system checks: Semantic Prompting (meaning preserved), SVG Post-Processing (clean code, path-only construction, coordinate snapping), and Icon Quality Audit (optical weight, legibility at 16px, production readiness). Results show as an IQS score from 1-100."
      }
    ]
  },
  {
    category: "Design Elements & Shape Manager",
    icon: Shapes,
    questions: [
      {
        q: "What is the Shape Manager?",
        a: "The Shape Manager is a programmatic library containing over 1,300 unique SVG shapes. It includes 600+ general shapes (Geometric, Organic, Abstract, UI elements) and 700+ industry-specific shapes (50 per industry for 14 sectors like Technology, Healthcare, Finance, Education, Food & Beverage, and more)."
      },
      {
        q: "What industries have dedicated shape sets?",
        a: "14 industry sectors each have 50 dedicated shapes: Technology, Healthcare, Finance, Education, Food & Beverage, Real Estate, Automotive, Sports & Fitness, Travel & Hospitality, Entertainment, Legal, Agriculture, Energy & Environment, and Fashion & Retail."
      },
      {
        q: "How does the Shape Editor work?",
        a: "The individual Shape Editor allows real-time customization of Fill color, Stroke color and width, and Opacity via regex-based SVG attribute injection. Changes preview instantly, and customized shapes are saved to the brand's 'customShapes' field in guide_data."
      },
      {
        q: "Where are custom shapes stored?",
        a: "Custom shapes are persisted within the 'customShapes' field of the brand's guide_data JSONB column. This means shapes are saved per-brand and travel with the brand guide across exports and backups."
      },
      {
        q: "Can I browse shapes in a dialog?",
        a: "Yes! The Shape Manager opens in a scrollable fixed-height dialog. You can browse by category (General or Industry), search by name, preview shapes at different sizes, and customize them with the built-in editor before adding to your brand."
      }
    ]
  },
  {
    category: "Advanced Features",
    icon: Layers,
    questions: [
      {
        q: "What are Responsive Icons (Optical Sizing)?",
        a: "Optical Sizing automatically adjusts icon details based on display size. Micro icons (12-16px) get simplified details and thicker strokes for legibility. Regular icons (24px) use standard detail. Display icons (48px+) show finer details and thinner strokes. This ensures icons look perfect at any size."
      },
      {
        q: "What are Semantic States?",
        a: "Semantic States define how icons appear in different contexts: Default, Hover, Active, Disabled, Selected, Success, Error, Warning, and Skeleton loading. Each state can have different colors, opacity, stroke modifications, or subtle animations to provide clear user feedback."
      },
      {
        q: "What is Kinetic Branding?",
        a: "Kinetic Branding adds physics-based motion to icons. Define your brand's personality (Playful, Professional, Energetic, Calm, Bold) and the system generates appropriate entrance animations, hover effects, interaction responses, and exit animations. Export as CSS keyframes or Lottie JSON."
      },
      {
        q: "Can I apply advanced features to existing icons?",
        a: "Yes! Select any icon from your library and apply optical sizing variants, semantic states, or kinetic animations. The system generates all variants while maintaining your brand's visual identity. Use batch processing to apply features across an entire library at once."
      },
      {
        q: "What export formats support advanced features?",
        a: "Advanced features export as: SVG (optical size variants), JSON (state definitions and animation configs), CSS (keyframe animations and state classes), and Lottie (complex animation data). The export package includes documentation for developer handoff."
      }
    ]
  },
  {
    category: "Brand Hierarchy & DNA Lock",
    icon: GitBranch,
    questions: [
      {
        q: "What is Brand DNA Lock?",
        a: "Brand DNA Lock defines immutable global rules that ALL icons in your organization must follow: stroke width, stroke caps (round/square/butt), corner radius, and pixel snapping. These 'locked' properties ensure visual consistency across sub-brands, products, and events — they cannot be overridden at lower hierarchy levels."
      },
      {
        q: "How do Style Overrides work?",
        a: "Style Overrides let sub-brands customize icons while respecting the DNA Lock. A sub-brand can change fill mode (outline to solid), corner style (sharp to round), colors, or opacity — without breaking the parent brand's locked stroke rules. Overrides are applied at the Brand level and cascade to products."
      },
      {
        q: "What are Event-Mode Overlays?",
        a: "Event-Mode Overlays apply temporary themed styles to your entire icon set. For a film festival, add film grain texture. For holidays, add seasonal accents. For product launches, apply spotlight effects. Toggle the event off and icons return to their core brand state instantly."
      },
      {
        q: "How does Color Slot Mapping work?",
        a: "Define Primary, Secondary, and Accent color slots at the organization level. Icons automatically recolor based on which brand/sub-brand they're assigned to. Brand A uses Blue/Gold, Brand B uses Green/White — same icons, different palettes, zero redesign. Color slots integrate with the brand's Color Palette section."
      },
      {
        q: "What is the inheritance hierarchy?",
        a: "Parent Brand → Sub-Brand → Product → Event. Parent defines DNA (locked rules). Sub-Brand applies style overrides. Products get unique 'tool' icons while inheriting the system. Events add temporary decorative layers. Each level inherits from above while allowing permitted customizations."
      }
    ]
  },
  {
    category: "App Icon Generation",
    icon: Smartphone,
    questions: [
      {
        q: "What platforms are supported for app icons?",
        a: "The App Icons tab generates icons for iOS (all required sizes from 20pt to 1024pt), Android (adaptive icons with separate foreground/background layers), PWA (manifest icons at 192px and 512px), macOS (16px to 1024px), Windows (16px to 256px ICO), and favicon packages (16px, 32px, apple-touch-icon). All from a single source design."
      },
      {
        q: "What mask shapes are available?",
        a: "Choose from Squircle (iOS-style continuous rounded square), Circle, Rounded Rectangle, or Square. The live preview shows exactly how your icon will appear on each target platform with the selected mask applied."
      },
      {
        q: "What is the safe zone?",
        a: "The safe zone is the guaranteed visible area of your icon — typically the inner 66% of the canvas. On Android, adaptive icons can be masked differently by launchers (circle, squircle, rounded square). The safe zone preview shows the inner area that's always visible regardless of mask shape."
      },
      {
        q: "Can I export all sizes at once?",
        a: "Yes! Click 'Export All' to download a ZIP containing every size for your selected platforms. The package includes properly named files ready to drop into your Xcode, Android Studio, or web project, plus a contents.json manifest for iOS asset catalogs."
      }
    ]
  },
  {
    category: "Icon Libraries & Organization",
    icon: PenTool,
    questions: [
      {
        q: "What is the 3-level library hierarchy?",
        a: "Icons are organized in three levels: Core (universal icons used everywhere — Home, Search, User), Product Line (shared across related products), and Brand (specific to one brand or sub-brand). This ensures consistency while allowing customization. Each level can inherit from the level above."
      },
      {
        q: "How do I create a new icon library?",
        a: "In the Library tab, click 'Create Library'. Name it, select the hierarchy level (Core/Product Line/Brand), and optionally link it to a parent library for inheritance. New libraries start empty — add icons via AI Generation, Creator tab (3,480+ Lucide icons), Stylizer, or the Shape Manager."
      },
      {
        q: "Can I drag and drop icons between libraries?",
        a: "Yes! The Library tab supports full drag-and-drop. Move icons between libraries, reorder within a library, or duplicate icons to multiple libraries while maintaining links to the original for synchronized updates."
      },
      {
        q: "How do I export my icon library?",
        a: "Select a library and click 'Export'. Choose format (SVG, PNG, or both), size variants (16px to 64px), and color mode (brand colors or monochrome). For developers, the export includes CSS variables with theme-aware color tokens."
      },
      {
        q: "How does the multi-scale preview work?",
        a: "Click 'View Larger' on any icon to open the IconPreviewDialog. This shows your icon at 16px, 24px, 32px, 48px, and 64px simultaneously, so you can verify legibility and detail retention at every common display size. You can also add the icon directly to a brand from this dialog."
      }
    ]
  },
  {
    category: "SVG Architecture Standards",
    icon: Ruler,
    questions: [
      {
        q: "What is the SVG Architect specification?",
        a: "The SVG Architect is the professional standard enforced across all AI-generated and stylized icons: 24×24 pixel grid, keyline geometry (18×18 square / 20px circle safe zone), maximum 3 closed <path> elements, coordinate snapping to whole or 0.5 pixels, path-only construction (no rect, circle, or other primitives), and baked-in coordinates for maximum compatibility."
      },
      {
        q: "Why paths only — no SVG primitives?",
        a: "Using <path> elements exclusively (instead of <rect>, <circle>, etc.) ensures maximum compatibility across rendering engines, prevents clipping issues, and allows for precise coordinate control. Paths with baked-in coordinates render consistently in browsers, design tools, and icon font generators."
      },
      {
        q: "What is keyline geometry?",
        a: "Keyline geometry defines the grid lines that icons should align to for visual consistency. The 24×24 grid uses an 18×18 square and 20px diameter circle as primary keylines. Icons that align to these keylines appear optically consistent regardless of their actual shape — circles, squares, and organic shapes all feel the same size."
      },
      {
        q: "How does the rendering engine prevent clipping?",
        a: "The rendering engine detects full SVG strings and validates viewBox attributes before display. It ensures the viewBox matches the 24×24 grid, that no path coordinates exceed the viewport, and that stroke widths are accounted for in the bounding box. This prevents edge clipping that commonly occurs with auto-generated SVGs."
      },
      {
        q: "What file size limits apply?",
        a: "Production-ready icons should be under 2KB. The SVG Architect spec enforces this through path simplification (max 3 <path> elements), coordinate optimization (removing unnecessary decimal places), and attribute minimization. Icons exceeding 2KB trigger an IQS penalty and optimization recommendations."
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
    title: "Create a Library",
    description: "Library tab → Create Library → Choose hierarchy level (Core/Product/Brand)"
  },
  {
    step: 3,
    title: "Add Icons",
    description: "Library tab → Use the Icon Creator panel to browse 50K+ icons, upload SVGs, or paste custom code"
  },
  {
    step: 4,
    title: "Generate Icons with AI",
    description: "AI Generate tab → Select style preset → Describe icons → Generate batch (up to 100)"
  },
  {
    step: 5,
    title: "Style & Customize",
    description: "Style tab → Colorize icons with brand colors, set Brand DNA rules, or generate App Icons"
  },
  {
    step: 6,
    title: "Multi-Scale Preview",
    description: "Click 'View Larger' on any icon to verify legibility from 16px to 64px"
  },
  {
    step: 7,
    title: "Export",
    description: "Export tab → Download icons for web, iOS, Android, or import directly to entity guides"
  }
];
