// Help content structured for both UI display and AI chatbot consumption
// Each section includes metadata, steps, and tips that can be indexed

export interface HelpStep {
  id: string;
  title: string;
  description: string;
  tips?: string[];
  warning?: string;
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'getting-started' | 'brand-guides' | 'organization' | 'advanced';
  keywords: string[]; // For search and AI indexing
  steps: HelpStep[];
  relatedSections?: string[]; // IDs of related sections
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics and set up your first brand',
    icon: 'Rocket',
  },
  {
    id: 'brand-guides',
    title: 'Brand Guides',
    description: 'Create and manage comprehensive brand guidelines',
    icon: 'BookOpen',
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'Manage your organization, team, and portal settings',
    icon: 'Building2',
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    description: 'AI tools, analytics, and power user features',
    icon: 'Zap',
  },
];

export const helpSections: HelpSection[] = [
  // ============================
  // GETTING STARTED
  // ============================
  {
    id: 'create-first-brand',
    title: 'Create Your First Brand Guide',
    description: 'Learn how to create a new brand guide from scratch and set up your brand identity.',
    icon: 'Plus',
    category: 'getting-started',
    keywords: ['create', 'new', 'brand', 'guide', 'start', 'begin', 'setup'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Your Dashboard',
        description: 'From the main dashboard, click the "New Brand" button in the top right corner, or use the Quick Add menu in your organization portal.',
        tips: [
          'You can also use the keyboard shortcut Cmd/Ctrl + N to quickly create a new brand',
          'Brands can be organized within organizations for team collaboration',
        ],
      },
      {
        id: 'step-2',
        title: 'Enter Brand Details',
        description: 'Fill in your brand name. This will automatically generate a URL-friendly slug. You can customize the slug if needed.',
        tips: [
          'Choose a clear, recognizable name - this will appear in navigation and exports',
          'The slug is used in the URL, so keep it short and memorable',
        ],
      },
      {
        id: 'step-3',
        title: 'Start Building Your Guide',
        description: 'Your brand guide is created with default sections. Click on any section in the sidebar to start adding content.',
        tips: [
          'Start with the Overview section to define your brand\'s mission and values',
          'You can reorder sections by dragging them in the sidebar',
          'Use the eye icon to hide sections from public viewers while you work on them',
        ],
      },
    ],
    relatedSections: ['overview-section', 'brand-identity', 'section-visibility'],
  },

  {
    id: 'brand-hierarchy',
    title: 'Understanding Brand Hierarchy',
    description: 'Learn how brands, products, and events relate to each other in a hierarchical structure.',
    icon: 'GitBranch',
    category: 'getting-started',
    keywords: ['hierarchy', 'parent', 'child', 'brand', 'product', 'event', 'sub-brand', 'structure'],
    steps: [
      {
        id: 'step-1',
        title: 'Understand the Hierarchy',
        description: 'BrandHub uses a 3-tier hierarchy: Organizations contain Brands, Brands contain Products and Events. This allows for brand inheritance and consistent styling.',
        tips: [
          'Organizations set the top-level branding for your portal',
          'Brands can have their own identity while respecting org guidelines',
          'Products and Events inherit from their parent brand by default',
        ],
      },
      {
        id: 'step-2',
        title: 'Navigate Between Levels',
        description: 'Use breadcrumbs at the top of any guide to navigate up the hierarchy. Linked guides sections show child items.',
        tips: [
          'Breadcrumbs show the full path: Org → Brand → Product/Event',
          'Master suites and events appear at the top of lists with special badges',
        ],
      },
      {
        id: 'step-3',
        title: 'Inherit vs Override',
        description: 'Child guides can inherit colors, typography, and other settings from parents, or override them for unique branding.',
        tips: [
          'Use inheritance for consistency across product lines',
          'Override specific elements when sub-brands need differentiation',
        ],
      },
    ],
    relatedSections: ['linked-products', 'product-suites', 'organization-portal'],
  },

  {
    id: 'quick-actions',
    title: 'Quick Add & Portal Actions',
    description: 'Use the Quick Add menu to rapidly create brands, products, events, and product suites.',
    icon: 'Zap',
    category: 'getting-started',
    keywords: ['quick', 'add', 'fast', 'create', 'menu', 'portal', 'actions'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Quick Add Menu',
        description: 'In the organization portal, look for the floating action button on the right side. Click it to expand the Quick Add menu.',
        tips: [
          'The menu appears only for admins with edit permissions',
          'It collapses by default to stay out of the way',
        ],
      },
      {
        id: 'step-2',
        title: 'Create Standard Items',
        description: 'Choose from Brand, Product, or Event to create a standard guide with all default sections.',
        tips: [
          'New items are automatically linked to your organization',
          'You can set parent relationships during or after creation',
        ],
      },
      {
        id: 'step-3',
        title: 'Use Product Suite Workflow',
        description: 'Select "Product Suite" for a multi-step wizard that creates a master product with multiple sub-products in one flow.',
        tips: [
          'Great for launching product lines with consistent branding',
          'Master products are marked with a special badge in grids',
        ],
      },
      {
        id: 'step-4',
        title: 'Extend Events',
        description: 'Use "Extend Event" to create regional or temporal variants of an existing event, maintaining brand consistency.',
        tips: [
          'Sub-events inherit the parent event\'s branding',
          'Perfect for multi-city conferences or annual event series',
        ],
      },
    ],
    relatedSections: ['product-suites', 'linked-products'],
  },

  // ============================
  // BRAND GUIDES
  // ============================
  {
    id: 'overview-section',
    title: 'Overview Section',
    description: 'Define your brand\'s mission, vision, values, and core messaging in the Overview section.',
    icon: 'FileText',
    category: 'brand-guides',
    keywords: ['overview', 'mission', 'vision', 'values', 'about', 'introduction', 'summary'],
    steps: [
      {
        id: 'step-1',
        title: 'Access the Overview Section',
        description: 'Click "Overview" in the sidebar navigation. This section appears at the top of your brand guide.',
        tips: [
          'The Overview is the first thing visitors see - make it count!',
        ],
      },
      {
        id: 'step-2',
        title: 'Edit Brand Description',
        description: 'Click the edit icon next to any text field to modify it. Use rich text formatting for emphasis and structure.',
        tips: [
          'Keep your brand description concise but impactful',
          'Use bullet points for key differentiators',
          'Include your brand\'s unique value proposition',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Mission & Vision Statements',
        description: 'Define your Mission (what you do) and Vision (where you\'re going). These guide all brand decisions.',
        tips: [
          'Mission: Present tense, action-oriented',
          'Vision: Future-focused, aspirational',
          'Keep both statements memorable and authentic',
        ],
      },
      {
        id: 'step-4',
        title: 'Define Core Values',
        description: 'Add your brand\'s core values. Each value should have a title and description explaining what it means.',
        tips: [
          'Aim for 3-5 core values - fewer is more memorable',
          'Each value should be actionable and measurable',
          'Consider how values translate to daily decisions',
        ],
      },
    ],
    relatedSections: ['brand-identity', 'voice-tone'],
  },

  {
    id: 'brand-identity',
    title: 'Brand Identity & Hero Images',
    description: 'Set up your brand\'s visual identity with hero images and primary brand imagery.',
    icon: 'Image',
    category: 'brand-guides',
    keywords: ['hero', 'image', 'banner', 'identity', 'visual', 'cover', 'header'],
    steps: [
      {
        id: 'step-1',
        title: 'Upload a Hero Image',
        description: 'Click on the hero section at the top of your brand guide. Use the upload button or drag-and-drop an image.',
        tips: [
          'Recommended size: 1920x600 pixels minimum',
          'Use high-quality, brand-relevant imagery',
          'Images are automatically optimized for web',
        ],
        warning: 'Large images may take a moment to upload. Wait for the upload to complete before navigating away.',
      },
      {
        id: 'step-2',
        title: 'Adjust Image Positioning',
        description: 'After uploading, you can adjust how the image is cropped and positioned within the hero area.',
        tips: [
          'Consider how the image looks on both desktop and mobile',
          'Ensure key visual elements aren\'t cropped on smaller screens',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Brand Tagline',
        description: 'Edit the text overlay on your hero image to add your brand tagline or key message.',
        tips: [
          'Keep taglines short - 5-8 words work best',
          'Ensure text has sufficient contrast against the image',
        ],
      },
    ],
    relatedSections: ['logo-management', 'color-palette'],
  },

  {
    id: 'logo-management',
    title: 'Logo Management',
    description: 'Upload, organize, and manage your brand logos with variants for different use cases.',
    icon: 'Shapes',
    category: 'brand-guides',
    keywords: ['logo', 'mark', 'emblem', 'icon', 'symbol', 'variants', 'light', 'dark', 'transparent'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to the Logo Section',
        description: 'Click "Mark Repository" or "Logos" in the sidebar to access logo management.',
        tips: [
          'This section organizes all your logo variants in one place',
        ],
      },
      {
        id: 'step-2',
        title: 'Upload Logo Variants',
        description: 'Click "Add Logo" and select the variant type: Primary, Light Background, Dark Background, or Transparent.',
        tips: [
          'Upload SVG files for best quality and scalability',
          'PNG with transparency works well for digital use',
          'Include at least 3 variants: light, dark, and transparent backgrounds',
        ],
        warning: 'Always upload logos at the highest resolution available. You can\'t upscale later.',
      },
      {
        id: 'step-3',
        title: 'Organize Logo Categories',
        description: 'Logos are organized by variant type. Each category can hold multiple versions (horizontal, stacked, icon-only, etc.).',
        tips: [
          'Use consistent naming: "Primary_Horizontal", "Primary_Stacked", etc.',
          'Add usage notes to clarify when each variant should be used',
        ],
      },
      {
        id: 'step-4',
        title: 'Set Safe Zones',
        description: 'Configure minimum clear space requirements around your logo to ensure consistent presentation.',
        tips: [
          'Safe zone is typically the height of a key element (like the \'x\' in your wordmark)',
          'Document minimum size requirements for legibility',
        ],
      },
    ],
    relatedSections: ['brand-identity', 'icon-studio'],
  },

  {
    id: 'color-palette',
    title: 'Color Palette',
    description: 'Define and manage your brand\'s color system with primary, secondary, and accent colors.',
    icon: 'Palette',
    category: 'brand-guides',
    keywords: ['color', 'palette', 'primary', 'secondary', 'accent', 'hex', 'rgb', 'hsl', 'brand colors'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Color Settings',
        description: 'Click "Color Palette" in the sidebar. You\'ll see your current color swatches and their values.',
        tips: [
          'A well-defined color palette typically has 5-10 colors',
        ],
      },
      {
        id: 'step-2',
        title: 'Add Primary Colors',
        description: 'Click "Add Color" and enter your color value. You can use hex (#FFFFFF), RGB, or pick from the color picker.',
        tips: [
          'Primary colors should be your most recognizable brand colors',
          'Consider accessibility - ensure sufficient contrast ratios',
          'Name colors descriptively: "Ocean Blue" rather than "Blue 1"',
        ],
      },
      {
        id: 'step-3',
        title: 'Define Color Categories',
        description: 'Organize colors into categories: Primary, Secondary, Accent, Neutral, and Semantic (success, warning, error).',
        tips: [
          'Semantic colors help maintain consistency in UI feedback',
          'Include light and dark variants of key colors',
        ],
      },
      {
        id: 'step-4',
        title: 'Export Color Values',
        description: 'Use the export feature to download color values in various formats: CSS, SCSS, JSON, or design tool formats.',
        tips: [
          'Export formats include variables for easy developer handoff',
        ],
      },
    ],
    relatedSections: ['typography', 'ai-patterns-gradients'],
  },

  {
    id: 'typography',
    title: 'Typography',
    description: 'Set up your brand\'s type system including fonts, sizes, and hierarchy.',
    icon: 'Type',
    category: 'brand-guides',
    keywords: ['typography', 'fonts', 'typeface', 'heading', 'body', 'text', 'style', 'size', 'weight'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Typography',
        description: 'Click "Typography" in the sidebar to access font settings and type scale.',
        tips: [
          'Good typography is the foundation of visual hierarchy',
        ],
      },
      {
        id: 'step-2',
        title: 'Set Primary Typefaces',
        description: 'Add your brand fonts by name. Include the font family, weight options, and where to source the font.',
        tips: [
          'Typically brands use 2-3 typefaces: display, body, and mono',
          'Ensure fonts are licensed for your intended use',
          'Include Google Fonts or Adobe Fonts links for easy access',
        ],
      },
      {
        id: 'step-3',
        title: 'Define Type Scale',
        description: 'Set sizes for different heading levels (H1-H6), body text, and captions.',
        tips: [
          'Use a consistent scale ratio (1.25 or 1.333 are common)',
          'Include line heights and letter spacing values',
          'Document responsive sizes for mobile vs desktop',
        ],
      },
      {
        id: 'step-4',
        title: 'Add Usage Examples',
        description: 'Include sample text showing each type style in context.',
        tips: [
          'Show do\'s and don\'ts for font pairing',
          'Include minimum size recommendations for legibility',
        ],
      },
    ],
    relatedSections: ['color-palette', 'voice-tone'],
  },

  {
    id: 'icon-studio',
    title: 'Icon Studio',
    description: 'A streamlined 4-tab hub for all icon management: Library & Import, AI Generate, Style (colorize, brand rules, app icons), and Export.',
    icon: 'Sparkles',
    category: 'brand-guides',
    keywords: ['icons', 'iconography', 'studio', 'library', 'ai', 'generate', 'app icon', 'stylizer', 'svg', 'colorize', 'export'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Icon Studio',
        description: 'Click "Iconography" in the sidebar, then open the Icon Studio. It has 4 clear tabs you can freely navigate between.',
        tips: [
          'Icon Studio is the unified entry point for ALL icon functionality',
          '4 tabs: Library, AI Generate, Style, and Export',
          'No forced sequence — jump to any tab anytime',
        ],
      },
      {
        id: 'step-2',
        title: 'Library & Import',
        description: 'The Library tab manages your icon collections (Core, Product Line, Brand) and includes the Icon Creator for importing from 50K+ icons, uploading SVGs, or pasting custom code.',
        tips: [
          'Icons inherit from parent levels for consistency',
          'Drag to reorder icons and libraries',
          'Browse Lucide, upload images, or paste SVG code — all in one place',
        ],
      },
      {
        id: 'step-3',
        title: 'AI Generate',
        description: 'Create complete icon sets with AI. Describe your needs, select from 17+ style presets, and generate batches of up to 100 icons.',
        tips: [
          'Be specific: "minimalist e-commerce icons with rounded corners"',
          'Generate sets of related icons in one batch',
          'AI uses your brand colors automatically',
        ],
      },
      {
        id: 'step-4',
        title: 'Style & Customize',
        description: 'The Style tab has 3 sub-views: Colorize (apply brand colors), Brand Rules (DNA Lock & hierarchy), and App Icons (generate for iOS, Android, PWA).',
        tips: [
          'Colorize icons with your brand palette in one click',
          'Brand DNA Lock ensures consistency across sub-brands',
          'App Icons outputs all required sizes for every platform',
        ],
      },
      {
        id: 'step-5',
        title: 'Export & Import to Entities',
        description: 'The Export tab lets you download icons in multiple formats or import them directly into brand, product, or event guides.',
        tips: [
          'Export as SVG, PNG, or both with size variants',
          'Import icons directly to entity guides for immediate use',
          'Includes CSS variables for developer handoff',
        ],
      },
    ],
    relatedSections: ['logo-management', 'ai-patterns-gradients'],
  },

  {
    id: 'voice-tone',
    title: 'Voice & Tone',
    description: 'Document your brand\'s communication style, voice characteristics, and writing guidelines.',
    icon: 'MessageSquare',
    category: 'brand-guides',
    keywords: ['voice', 'tone', 'writing', 'communication', 'style', 'copy', 'messaging', 'personality'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Voice & Tone',
        description: 'Click "Voice & Tone" in the sidebar to define how your brand communicates.',
        tips: [
          'Voice is consistent; tone adapts to context',
        ],
      },
      {
        id: 'step-2',
        title: 'Define Voice Characteristics',
        description: 'Add 3-5 voice attributes that define your brand\'s personality. Example: "Friendly, Expert, Approachable".',
        tips: [
          'Use adjectives that can guide writing decisions',
          'Include what you are AND what you\'re not',
          'Example: "Confident, not arrogant"',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Tone Guidelines',
        description: 'Document how tone shifts in different contexts: marketing, support, social media, crisis communication.',
        tips: [
          'Include examples of tone shifts while maintaining voice',
          'Provide before/after examples showing correct tone',
        ],
      },
      {
        id: 'step-4',
        title: 'Include Writing Examples',
        description: 'Add sample copy for common scenarios: headlines, CTAs, error messages, social posts.',
        tips: [
          'Do\'s and Don\'ts make guidelines immediately actionable',
          'Include examples from real brand touchpoints',
        ],
      },
    ],
    relatedSections: ['overview-section', 'messaging'],
  },

  {
    id: 'photography',
    title: 'Photography Guidelines',
    description: 'Define standards for brand photography including style, subjects, and treatment.',
    icon: 'Camera',
    category: 'brand-guides',
    keywords: ['photography', 'photos', 'images', 'pictures', 'style', 'treatment', 'subjects'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Photography Section',
        description: 'Click "Photography" in the sidebar to set photo guidelines.',
        tips: [
          'Photography often makes the biggest visual impact',
        ],
      },
      {
        id: 'step-2',
        title: 'Define Photo Style',
        description: 'Document your photography aesthetic: natural vs staged, candid vs posed, color treatment.',
        tips: [
          'Include example images that exemplify your style',
          'Note lighting preferences: natural, studio, dramatic, etc.',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Subject Guidelines',
        description: 'Specify what subjects to feature: people, products, environments, abstract.',
        tips: [
          'If featuring people, document diversity requirements',
          'Include guidance on expressions and emotions',
        ],
      },
      {
        id: 'step-4',
        title: 'Set Technical Specs',
        description: 'Document minimum resolution, aspect ratios, and file format requirements.',
        tips: [
          'Include specs for different use cases: web, print, social',
          'Note any image treatment or filtering standards',
        ],
      },
    ],
    relatedSections: ['brand-identity', 'templates'],
  },

  {
    id: 'section-visibility',
    title: 'Section Visibility & Ordering',
    description: 'Control which sections are visible to public viewers and customize the order of sections.',
    icon: 'Eye',
    category: 'brand-guides',
    keywords: ['hide', 'show', 'visibility', 'sections', 'order', 'reorder', 'public', 'private'],
    steps: [
      {
        id: 'step-1',
        title: 'Locate Section Controls',
        description: 'In the sidebar, each section has a drag handle and an eye icon (for admins only).',
        tips: [
          'The eye icon appears when hovering over a section',
          'Only admins see the visibility controls',
        ],
      },
      {
        id: 'step-2',
        title: 'Hide a Section',
        description: 'Click the eye icon next to any section to toggle its visibility. Hidden sections show a strikethrough in the sidebar.',
        tips: [
          'Hidden sections are still visible to admins in edit mode',
          'Use hiding for work-in-progress sections',
          'Public viewers won\'t see hidden sections at all',
        ],
      },
      {
        id: 'step-3',
        title: 'Reorder Sections',
        description: 'Use the grip handle (⋮⋮) to drag sections up or down. The new order is saved automatically.',
        tips: [
          'Order affects both edit view and public view',
          'Consider user priorities when ordering',
        ],
      },
      {
        id: 'step-4',
        title: 'Verify Public View',
        description: 'Open your guide in an incognito window or log out to verify hidden sections don\'t appear to public viewers.',
        tips: [
          'The public URL shows only visible sections',
          'Admins always see all sections in edit mode',
        ],
      },
    ],
    relatedSections: ['publishing', 'create-first-brand'],
  },

  {
    id: 'linked-products',
    title: 'Linking Products & Events',
    description: 'Create hierarchical relationships between brands, products, and events.',
    icon: 'Link',
    category: 'brand-guides',
    keywords: ['link', 'products', 'events', 'hierarchy', 'sub-brand', 'parent', 'child', 'relationship'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Linked Guides Section',
        description: 'In your brand guide, scroll to "Product Guides" or "Linked Guides" section.',
        tips: [
          'Products and events can inherit from parent brands',
        ],
      },
      {
        id: 'step-2',
        title: 'Link Existing Guides',
        description: 'Click "Link Guide" and select from existing products or events in your organization.',
        tips: [
          'Linked guides appear as cards within the parent brand',
          'Users can navigate directly to linked guides',
        ],
      },
      {
        id: 'step-3',
        title: 'Create New Sub-Guide',
        description: 'Click "Create New" to create a product or event that\'s automatically linked to this brand.',
        tips: [
          'New sub-guides inherit organization settings',
          'You can unlink guides later if needed',
        ],
      },
      {
        id: 'step-4',
        title: 'Manage Hierarchy',
        description: 'Reorder linked guides by dragging. The display order is saved automatically.',
        tips: [
          'Linked guides show in organization portals with hierarchy badges',
          'Breadcrumbs reflect the parent-child relationship',
        ],
      },
    ],
    relatedSections: ['product-suites', 'brand-hierarchy'],
  },

  {
    id: 'product-suites',
    title: 'Product Suites',
    description: 'Create master products with multiple sub-products in a streamlined workflow.',
    icon: 'Boxes',
    category: 'brand-guides',
    keywords: ['suite', 'master', 'sub-product', 'product line', 'family', 'collection'],
    steps: [
      {
        id: 'step-1',
        title: 'Start Product Suite Creation',
        description: 'From the portal Quick Add menu, select "Product Suite" to launch the multi-step wizard.',
        tips: [
          'Product suites are ideal for product families with shared branding',
          'The master product acts as the parent for all sub-products',
        ],
      },
      {
        id: 'step-2',
        title: 'Configure Master Product',
        description: 'Enter the master product name and select a parent brand. This product will be marked as the suite master.',
        tips: [
          'Master products display a special ring in portal grids',
          'They appear at the top of product lists',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Sub-Products',
        description: 'Add as many sub-products as needed. Each inherits from the master and can be customized individually.',
        tips: [
          'Sub-products are automatically linked to the master',
          'You can add more sub-products later from the master\'s linked guides section',
        ],
      },
      {
        id: 'step-4',
        title: 'Review and Create',
        description: 'Review your suite configuration and click Create. All products are created in one operation.',
        tips: [
          'Creation may take a moment for large suites',
          'You\'ll be redirected to the master product after creation',
        ],
      },
    ],
    relatedSections: ['linked-products', 'brand-hierarchy', 'quick-actions'],
  },

  {
    id: 'publishing',
    title: 'Publishing Your Brand Guide',
    description: 'Make your brand guide public or share it with specific team members.',
    icon: 'Globe',
    category: 'brand-guides',
    keywords: ['publish', 'public', 'share', 'visibility', 'access', 'link', 'url'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Publishing Settings',
        description: 'Click the settings icon in the brand editor header, or go to brand settings.',
        tips: [
          'You can toggle visibility at any time',
        ],
      },
      {
        id: 'step-2',
        title: 'Toggle Public Access',
        description: 'Enable "Make Public" to allow anyone with the link to view your brand guide.',
        tips: [
          'Public guides are viewable without login',
          'Public guides appear in your organization portal',
        ],
        warning: 'Public guides are accessible to anyone with the URL. Ensure no confidential information is included.',
      },
      {
        id: 'step-3',
        title: 'Copy Share Link',
        description: 'Use the share button to copy your brand guide\'s public URL.',
        tips: [
          'The URL format is: yourdomain.com/brand/your-brand-slug',
          'Organization portals aggregate all public brands at /org/your-org-slug',
        ],
      },
      {
        id: 'step-4',
        title: 'Control Section Visibility',
        description: 'Use section visibility controls to hide work-in-progress sections from public viewers.',
        tips: [
          'Hidden sections are only visible to admins',
          'Perfect for phased rollouts of brand updates',
        ],
      },
    ],
    relatedSections: ['section-visibility', 'organization-portal'],
  },

  // ============================
  // ORGANIZATION
  // ============================
  {
    id: 'organization-setup',
    title: 'Organization Setup',
    description: 'Create and configure your organization for team collaboration.',
    icon: 'Building2',
    category: 'organization',
    keywords: ['organization', 'team', 'workspace', 'setup', 'company', 'settings'],
    steps: [
      {
        id: 'step-1',
        title: 'Create Organization',
        description: 'When first signing up, you\'ll be prompted to create or join an organization.',
        tips: [
          'Organizations allow multiple team members to collaborate',
          'You can be a member of multiple organizations',
        ],
      },
      {
        id: 'step-2',
        title: 'Configure Settings',
        description: 'Go to Organization Settings to set your organization name, logo, and branding.',
        tips: [
          'Organization branding appears on your public portal',
          'Custom colors affect all public-facing pages',
        ],
      },
      {
        id: 'step-3',
        title: 'Invite Team Members',
        description: 'In Settings, use the Team Members section to invite colleagues by email.',
        tips: [
          'Assign appropriate roles: Admin, Member, or Viewer',
          'Invitations expire after 7 days if not accepted',
        ],
      },
    ],
    relatedSections: ['team-management', 'organization-portal'],
  },

  {
    id: 'team-management',
    title: 'Team Management',
    description: 'Manage team members, roles, and permissions within your organization.',
    icon: 'Users',
    category: 'organization',
    keywords: ['team', 'members', 'roles', 'permissions', 'invite', 'admin', 'viewer'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Team Settings',
        description: 'Go to Organization Settings and scroll to the Team Members section.',
        tips: [
          'Only Owners and Admins can manage team members',
        ],
      },
      {
        id: 'step-2',
        title: 'Invite New Members',
        description: 'Enter an email address, select a role, and click Invite.',
        tips: [
          'Owner: Full access including billing and deletion',
          'Admin: Manage members and all content',
          'Member: Create and edit brands',
          'Viewer: Read-only access',
        ],
      },
      {
        id: 'step-3',
        title: 'Modify Roles',
        description: 'Use the role dropdown next to each member to change their permissions.',
        tips: [
          'Role changes take effect immediately',
          'You cannot demote the organization owner',
        ],
        warning: 'Demoting an admin may affect their ability to manage resources they created.',
      },
      {
        id: 'step-4',
        title: 'Remove Members',
        description: 'Click the remove button next to a member. Confirm the action in the dialog.',
        tips: [
          'Removed members lose access immediately',
          'Content they created remains in the organization',
        ],
      },
    ],
    relatedSections: ['organization-setup', 'admin-analytics'],
  },

  {
    id: 'organization-portal',
    title: 'Organization Portal',
    description: 'Configure your public portal that showcases all your brand guides.',
    icon: 'Globe',
    category: 'organization',
    keywords: ['portal', 'public', 'showcase', 'landing', 'brands', 'products', 'events'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Portal Settings',
        description: 'Go to Organization Settings and find Portal Settings section.',
        tips: [
          'Your portal URL is: yourdomain.com/org/your-slug',
        ],
      },
      {
        id: 'step-2',
        title: 'Configure Portal Layout',
        description: 'Toggle options like "Full Width Hero" and "Ken Burns Effect" for your portal header.',
        tips: [
          'Full width hero creates a more immersive experience',
          'Ken Burns adds subtle animation to the background',
        ],
      },
      {
        id: 'step-3',
        title: 'Customize Branding',
        description: 'Set primary, secondary, and accent colors. Upload your organization logo.',
        tips: [
          'Colors affect buttons, links, and accents throughout the portal',
          'Logo appears in the portal header',
        ],
      },
      {
        id: 'step-4',
        title: 'Preview Your Portal',
        description: 'Click the portal link to see how your public page looks to visitors.',
        tips: [
          'Only public brands appear in the portal',
          'Brands are organized by type: Brands, Products, Events',
          'Master suites and featured items appear at the top',
        ],
      },
    ],
    relatedSections: ['publishing', 'quick-actions'],
  },

  {
    id: 'insights-updates',
    title: 'Insights & Updates Section',
    description: 'Share reports, analytics, and news with your team through the Insights section.',
    icon: 'Newspaper',
    category: 'organization',
    keywords: ['insights', 'updates', 'news', 'reports', 'analytics', 'timeline', 'infographic'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Insights Section',
        description: 'In the organization portal or dashboard, find the "Insights & Updates" section. Admins can click "Edit" to modify content.',
        tips: [
          'This section is visible to all org members',
          'Use it to share important brand updates and metrics',
        ],
      },
      {
        id: 'step-2',
        title: 'Choose a Layout',
        description: 'Select from Cards, Infographic, or Timeline layouts depending on your content type.',
        tips: [
          'Cards: Best for individual updates or announcements',
          'Infographic: Great for metrics and data visualization',
          'Timeline: Perfect for chronological updates or roadmaps',
        ],
      },
      {
        id: 'step-3',
        title: 'Add Insight Items',
        description: 'Click "Add Item" and fill in the title, description, type, and optional metrics or imagery.',
        tips: [
          'Set priority levels to highlight important items',
          'Include metrics with values and change indicators',
          'Upload images for visual impact',
        ],
      },
      {
        id: 'step-4',
        title: 'Manage Items',
        description: 'Drag to reorder, click to edit, or delete items as needed. Changes save automatically.',
        tips: [
          'Archive old items rather than deleting for historical reference',
          'Pin critical updates to keep them at the top',
        ],
      },
    ],
    relatedSections: ['admin-analytics', 'organization-portal'],
  },

  // ============================
  // ADVANCED FEATURES
  // ============================
  {
    id: 'ai-patterns-gradients',
    title: 'AI-Powered Patterns & Gradients',
    description: 'Generate brand-specific patterns and gradients using AI, based on your color palette.',
    icon: 'Wand2',
    category: 'advanced',
    keywords: ['ai', 'patterns', 'gradients', 'generate', 'geometric', 'mesh', 'automatic'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Patterns or Gradients',
        description: 'In your brand guide, click on "Patterns" or "Gradients" in the sidebar.',
        tips: [
          'Both sections support AI generation',
          'Ensure your color palette is set up first for best results',
        ],
      },
      {
        id: 'step-2',
        title: 'Generate Patterns',
        description: 'Click the AI generate button to create 4 unique geometric patterns based on your brand colors.',
        tips: [
          'Patterns are generated using Gemini AI',
          'Each pattern is high-resolution and unique',
          'Generation takes a few seconds',
        ],
      },
      {
        id: 'step-3',
        title: 'Generate Gradients',
        description: 'For gradients, AI creates 4 CSS gradient styles: Primary, Radial, Spectrum, and Mesh.',
        tips: [
          'Gradients are pure CSS - no image files needed',
          'They adapt automatically to your brand colors',
          'Export as CSS for direct use in projects',
        ],
      },
      {
        id: 'step-4',
        title: 'Batch Generation',
        description: 'In Organization Settings, use batch generation to create patterns and gradients for all brands at once.',
        tips: [
          'Batch processing runs sequentially to manage resources',
          'Progress is shown for each brand',
          'Great for initial setup or brand refreshes',
        ],
        warning: 'Batch generation may take several minutes for organizations with many brands.',
      },
    ],
    relatedSections: ['color-palette', 'icon-studio'],
  },

  {
    id: 'admin-analytics',
    title: 'Admin Analytics Dashboard',
    description: 'View comprehensive analytics about brands, users, and content across your organization.',
    icon: 'BarChart3',
    category: 'advanced',
    keywords: ['analytics', 'dashboard', 'stats', 'metrics', 'reports', 'admin', 'data'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Admin Panel',
        description: 'Admins can access the analytics dashboard from the main navigation or organization settings.',
        tips: [
          'Only admins and owners can view analytics',
          'Analytics cover brands, products, events, and users',
        ],
      },
      {
        id: 'step-2',
        title: 'View Brand Health Analytics',
        description: 'The Brand Health section shows completeness scores, missing sections, and recommendations for each brand.',
        tips: [
          'Health scores are calculated based on section completion',
          'Click any brand to see detailed recommendations',
          'Data persists for 1 hour - see "Last run" timestamp',
        ],
      },
      {
        id: 'step-3',
        title: 'Check User Analytics',
        description: 'View user engagement metrics: active users, session counts, top content, and activity trends.',
        tips: [
          'Data persists for 30 minutes between tab switches',
          'Export reports for sharing with stakeholders',
        ],
      },
      {
        id: 'step-4',
        title: 'Review Activity Logs',
        description: 'The Activity Logs panel shows recent actions: edits, creations, deletions, and user access.',
        tips: [
          'Logs persist for 15 minutes (shorter due to high activity)',
          'Filter by action type, user, or date range',
          'Use for audit trails and compliance',
        ],
      },
      {
        id: 'step-5',
        title: 'Generate Downloads Report',
        description: 'See which assets are being downloaded most frequently across your organization.',
        tips: [
          'Identify popular assets for optimization',
          'Data cached for 30 minutes',
          'Export as CSV for further analysis',
        ],
      },
    ],
    relatedSections: ['team-management', 'insights-updates'],
  },

  {
    id: 'market-analysis',
    title: 'AI Market Analysis',
    description: 'Use AI to analyze your brand against competitors and market trends.',
    icon: 'TrendingUp',
    category: 'advanced',
    keywords: ['market', 'analysis', 'competitive', 'ai', 'trends', 'comparison', 'intelligence'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Market Analysis',
        description: 'In the admin panel, find the AI Market Analysis section.',
        tips: [
          'Analysis uses AI to evaluate brand positioning',
          'Results include competitive insights and recommendations',
        ],
      },
      {
        id: 'step-2',
        title: 'Run Analysis',
        description: 'Click "Run Analysis" and wait for the AI to process your brand data.',
        tips: [
          'Analysis considers colors, messaging, positioning, and more',
          'The "Last run" timestamp shows when data was generated',
        ],
      },
      {
        id: 'step-3',
        title: 'Review Insights',
        description: 'View the generated report with market position, competitive advantages, and growth recommendations.',
        tips: [
          'Insights are based on current brand guide content',
          'Update your guide content for more accurate analysis',
        ],
      },
      {
        id: 'step-4',
        title: 'Export Report',
        description: 'Download the analysis as a PDF for sharing with stakeholders.',
        tips: [
          'Reports include visualizations and actionable recommendations',
          'Re-run analysis after major brand updates',
        ],
      },
    ],
    relatedSections: ['admin-analytics', 'competitive-intelligence'],
  },

  {
    id: 'competitive-intelligence',
    title: 'Competitive Intelligence Reports',
    description: 'Generate comprehensive AI-powered competitive analysis reports with personality mapping, score gauges, and strategic insights.',
    icon: 'Target',
    category: 'advanced',
    keywords: ['competitive', 'competitor', 'analysis', 'report', 'radar', 'personality', 'benchmark', 'comparison', 'strategy'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Competitive Analysis',
        description: 'Open the Competitive Intelligence dialog from the Admin Toolbar or via the Competitive Report Card in your brand dashboard.',
        tips: [
          'Analysis uses Gemini AI for deep competitive insights',
          'Reports cover 8 strategic sections for comprehensive coverage',
          'The feature is available to organization admins',
        ],
      },
      {
        id: 'step-2',
        title: 'Select or Discover Competitors',
        description: 'Choose from your saved favorite competitors or use AI to discover new competitors in your market.',
        tips: [
          'Favorite competitors are saved for quick access in future analyses',
          'AI discovery finds competitors based on your brand\'s industry and positioning',
          'You can analyze up to 5 competitors at once for comparison',
        ],
      },
      {
        id: 'step-3',
        title: 'Generate the Report',
        description: 'Click "Run Analysis" and wait for the AI to generate your comprehensive competitive report.',
        tips: [
          'Reports include 8 sections: Overview, Market Position, Strengths/Weaknesses, Opportunities, Threats, Recommendations, and more',
          'Generation typically takes 15-30 seconds depending on complexity',
          'Reports are automatically saved for future reference',
        ],
      },
      {
        id: 'step-4',
        title: 'Explore the Personality Matrix',
        description: 'View the radar chart visualization showing how your brand\'s personality compares to competitors across key dimensions.',
        tips: [
          'The Personality Matrix maps traits like Innovation, Trust, Energy, and Sophistication',
          'Hover over data points for detailed scores',
          'Use gaps in the chart to identify differentiation opportunities',
        ],
      },
      {
        id: 'step-5',
        title: 'Review Score Gauges',
        description: 'Examine the score gauges showing your competitive position across various metrics.',
        tips: [
          'Scores are calculated based on brand presence, messaging, and market signals',
          'Compare your scores to competitor averages',
          'Track score changes over time with historical reports',
        ],
      },
      {
        id: 'step-6',
        title: 'Export as PDF',
        description: 'Download the complete competitive analysis as a professional PDF document for sharing with stakeholders.',
        tips: [
          'PDF includes all visualizations, charts, and recommendations',
          'Reports are formatted for executive presentations',
          'Include competitor logos and brand comparisons',
        ],
      },
      {
        id: 'step-7',
        title: 'Manage Favorite Competitors',
        description: 'Save competitors to your favorites list for quick access in future analyses.',
        tips: [
          'Favorites are shared across your organization',
          'Add notes about why each competitor is tracked',
          'Remove outdated competitors to keep the list relevant',
        ],
        warning: 'Competitive data is based on public information and AI analysis. Always verify critical insights independently.',
      },
    ],
    relatedSections: ['market-analysis', 'brand-intelligence', 'admin-analytics'],
  },

  {
    id: 'brand-intelligence',
    title: 'Brand Intelligence',
    description: 'AI-powered learning system that builds knowledge about your brand over time, aligned with the Oracle Brain.',
    icon: 'Brain',
    category: 'advanced',
    keywords: ['intelligence', 'ai', 'learning', 'knowledge', 'analysis', 'insights', 'history', 'oracle'],
    steps: [
      {
        id: 'step-1',
        title: 'Understand Brand Intelligence',
        description: 'Brand Intelligence is an AI system that learns from your brand guide content and usage patterns. It uses cumulative merging—new insights merge with existing data, never overwriting—and is grounded in Oracle Brain strategic context.',
        tips: [
          'Intelligence improves with more complete brand guides',
          'It tracks analysis history, confidence scores, and cultural insights',
          'All analysis is aligned with organization-level strategic priorities via Oracle Brain',
        ],
      },
      {
        id: 'step-2',
        title: 'View Intelligence Profile',
        description: 'Access your brand\'s intelligence profile to see accumulated knowledge entries, competitive landscape, and cultural readiness scores.',
        tips: [
          'Knowledge entries represent learned brand attributes',
          'Competitive context from favorite competitors feeds into intelligence',
          'Product/event intelligence links to parent brands for context inheritance',
        ],
      },
      {
        id: 'step-3',
        title: 'Provide Feedback',
        description: 'Rate insights and recommendations via insight actions to calibrate the AI. Feedback is tracked in confidence history.',
        tips: [
          'Feedback improves future recommendations',
          'Confidence scores use a 30-day half-life temporal decay',
          'Semantic hashes (Jaccard deduplication) prevent duplicate insights',
        ],
      },
      {
        id: 'step-4',
        title: 'Knowledge Base Integration',
        description: 'Import reports (PDF, text, markdown) via the Knowledge Base to feed additional context into Brand Intelligence.',
        tips: [
          'Imported content is processed by AI for extraction',
          'Strategic learnings automatically bubble up to the Oracle Brain',
          'Higher confidence means more reliable recommendations',
        ],
      },
    ],
    relatedSections: ['market-analysis', 'oracle-brain', 'competitive-intelligence'],
  },

  {
    id: 'oracle-brain',
    title: 'Oracle Brain (Master Intelligence)',
    description: 'Organization-level strategic intelligence backbone that aligns all AI analysis across the platform.',
    icon: 'Brain',
    category: 'advanced',
    keywords: ['oracle', 'master', 'strategic', 'intelligence', 'organization', 'portfolio', 'alignment', 'brain'],
    steps: [
      {
        id: 'step-1',
        title: 'Understand the Oracle Brain',
        description: 'The Oracle Brain is the platform\'s foundational research backbone, aggregating institutional knowledge and strategic research across all entities (brands, products, events).',
        tips: [
          'It provides top-down strategic context to all AI functions',
          'Entity-level insights automatically bubble up into Oracle knowledge',
          'Think of it as your organization\'s collective brand intelligence',
        ],
      },
      {
        id: 'step-2',
        title: 'Add Strategic Entries',
        description: 'Manually add strategic priorities, unified voice guidelines, and market intelligence. Import PDF/documents for AI-powered extraction.',
        tips: [
          'Entries are categorized: Brand Theory, Market Research, etc.',
          'Full view/edit capabilities for administrators',
          'Imported documents are analyzed by AI for key insights',
        ],
      },
      {
        id: 'step-3',
        title: 'Bidirectional Intelligence Flow',
        description: 'Oracle context feeds into all AI functions (Brand Intelligence, Competitive Analysis, Research Briefings, DataForce Compliance, AI Assistant). Insights from entity analysis bubble back up.',
        tips: [
          'Every AI action is grounded in organization-wide strategic context',
          'Entity brains contribute learnings back to Oracle',
          'Competitive reports factor in Oracle strategic priorities',
        ],
      },
      {
        id: 'step-4',
        title: 'Monitor Strategic Alignment',
        description: 'Review how well individual brands align with organization strategy through compliance scores and intelligence reports.',
        tips: [
          'DataForce Compliance includes a Strategic Alignment dimension',
          'Brand Intelligence shows portfolio-level context inheritance',
          'Use Research Briefings for deep-dive strategic analysis',
        ],
      },
    ],
    relatedSections: ['brand-intelligence', 'competitive-intelligence', 'dataforce-ai'],
  },

  {
    id: 'dataforce-ai',
    title: 'DataForce AI Suite',
    description: 'Enterprise-grade AI services: Compliance, Brand Assistant, Cultural Validation, and GenAI Training.',
    icon: 'Shield',
    category: 'advanced',
    keywords: ['dataforce', 'compliance', 'assistant', 'cultural', 'validation', 'training', 'ai', 'enterprise'],
    steps: [
      {
        id: 'step-1',
        title: 'Access DataForce AI',
        description: 'DataForce AI is managed via the Admin Dashboard under the DataForce AI tab. Configure services, view monitoring, and manage settings.',
        tips: [
          'Four core services: Compliance AI, Brand Assistant, Cultural Validation, GenAI Training',
          'Supports Live mode (API keys) and Demo mode (simulated responses)',
          'Configuration stored in dataforce_config table per organization',
        ],
      },
      {
        id: 'step-2',
        title: 'Brand Compliance AI',
        description: 'Automated guideline enforcement that scans brands across 6 dimensions including strategic alignment with the Oracle Brain. Compliance badges appear on portal cards, editor heroes, and admin analytics.',
        tips: [
          'Color-coded thresholds: Green (80+), Yellow (60-79), Red (<60)',
          'Auto-compliance triggers on every brand save (5s debounce)',
          'Shows N/A placeholder when no scan data exists',
        ],
      },
      {
        id: 'step-3',
        title: 'AI-Powered Brand Assistant',
        description: 'Multilingual chatbot supporting 15+ languages. It uses entity context and Oracle strategic alignment to provide brand-aware responses.',
        tips: [
          'Customize persona and available languages',
          'Assistant responses are grounded in your brand guide content',
          'Oracle context ensures answers align with strategic priorities',
        ],
      },
      {
        id: 'step-4',
        title: 'Cultural Validation & GenAI Training',
        description: 'Cultural Validation provides human-in-the-loop regional feedback panels. GenAI Training fine-tunes models on your brand\'s unique voice.',
        tips: [
          'Set panel size and target regions for validation',
          'Training tracks voice samples and sync history',
          'Both services feed insights back into Brand Intelligence',
        ],
      },
    ],
    relatedSections: ['oracle-brain', 'brand-intelligence', 'admin-analytics'],
  },

  {
    id: 'research-briefings',
    title: 'Research Briefings',
    description: 'AI-generated deep-dive research reports with Oracle strategic alignment.',
    icon: 'FileText',
    category: 'advanced',
    keywords: ['research', 'briefing', 'report', 'analysis', 'deep-dive', 'cultural', 'oracle'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Research Briefings',
        description: 'Research Briefings are available in the Brand Intelligence panel for brands, products, and events. Admins can trigger new briefings from the intelligence interface.',
        tips: [
          'Briefings use background job processing for complex analysis',
          'Frontend polls job status via useResearchBriefings hook',
          'Scoped to active organization_id for tenant isolation',
        ],
      },
      {
        id: 'step-2',
        title: 'Generate a Briefing',
        description: 'Click "Generate Research Briefing" to start an AI analysis. The system fetches entity context, social metrics, document context, and Oracle strategic intelligence.',
        tips: [
          'Uses Gemini AI for balanced speed and quality',
          'Oracle context grounds research in organization strategy',
          'Processing happens asynchronously to handle large analyses',
        ],
      },
      {
        id: 'step-3',
        title: 'Review Results',
        description: 'View the completed briefing with market insights, cultural considerations, and strategic recommendations.',
        tips: [
          'Findings are automatically fed back as learned knowledge',
          'Cultural Analysis Generator orchestrates multi-function analysis',
          'Research insights bubble up to the Oracle Brain knowledge base',
        ],
      },
    ],
    relatedSections: ['oracle-brain', 'brand-intelligence', 'market-analysis'],
  },

  {
    id: 'backup-restore',
    title: 'Backup & Restore',
    description: 'Create backups of your organization data and restore from previous states.',
    icon: 'Database',
    category: 'advanced',
    keywords: ['backup', 'restore', 'export', 'import', 'save', 'recovery', 'data'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Backup Settings',
        description: 'Go to Organization Settings and find the Backup & Restore section.',
        tips: [
          'Regular backups protect against accidental data loss',
          'Backups include all brands, products, events, and settings',
        ],
      },
      {
        id: 'step-2',
        title: 'Create Manual Backup',
        description: 'Click "Create Backup" to generate a snapshot of your current organization state.',
        tips: [
          'Backups are stored securely in cloud storage',
          'Include a descriptive name for easy identification',
        ],
      },
      {
        id: 'step-3',
        title: 'Configure Automatic Backups',
        description: 'Set up scheduled backups: daily, weekly, or monthly.',
        tips: [
          'Automatic backups run during low-traffic periods',
          'Old backups are automatically cleaned up based on retention policy',
        ],
      },
      {
        id: 'step-4',
        title: 'Restore from Backup',
        description: 'Select a backup from the history and click "Restore" to return to that state.',
        warning: 'Restoring overwrites current data. This action cannot be undone. Create a backup first.',
        tips: [
          'Preview backup contents before restoring',
          'Partial restore options may be available for specific items',
        ],
      },
    ],
    relatedSections: ['organization-setup', 'admin-analytics'],
  },

  {
    id: 'pdf-export',
    title: 'PDF Export & Presets',
    description: 'Export your brand guides as professional PDF documents with customizable layouts.',
    icon: 'FileDown',
    category: 'advanced',
    keywords: ['pdf', 'export', 'download', 'print', 'document', 'presets', 'layout'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Export Options',
        description: 'From any brand guide, click the Export or Download button in the header.',
        tips: [
          'Multiple export formats are available',
          'PDF is best for professional documentation',
        ],
      },
      {
        id: 'step-2',
        title: 'Choose a Preset',
        description: 'Select from preset layouts: Full Guide, Executive Summary, Style Sheet, or Custom.',
        tips: [
          'Full Guide: Complete documentation with all sections',
          'Executive Summary: Key elements only, 1-2 pages',
          'Style Sheet: Quick reference card format',
        ],
      },
      {
        id: 'step-3',
        title: 'Customize Layout',
        description: 'For custom exports, choose which sections to include, page size, and styling options.',
        tips: [
          'Drag to reorder sections in the export',
          'Toggle table of contents and page numbers',
          'Set cover page options',
        ],
      },
      {
        id: 'step-4',
        title: 'Generate and Download',
        description: 'Click Generate PDF and wait for processing. Download when ready.',
        tips: [
          'Large guides may take 30-60 seconds to generate',
          'PDFs are print-ready at 300 DPI',
        ],
      },
    ],
    relatedSections: ['publishing', 'templates'],
  },

  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Speed up your workflow with keyboard shortcuts for common actions.',
    icon: 'Keyboard',
    category: 'advanced',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'commands', 'speed', 'efficiency'],
    steps: [
      {
        id: 'step-1',
        title: 'View Shortcuts',
        description: 'Press ? (question mark) or Cmd/Ctrl + / to see all available keyboard shortcuts.',
        tips: [
          'Shortcuts work in most views throughout the app',
          'Some shortcuts are context-specific',
        ],
      },
      {
        id: 'step-2',
        title: 'Navigation Shortcuts',
        description: 'Use Cmd/Ctrl + number keys to jump between sections. Arrow keys navigate within lists.',
        tips: [
          'Cmd/Ctrl + 1-9 jumps to sidebar sections',
          'Escape closes modals and returns to previous view',
        ],
      },
      {
        id: 'step-3',
        title: 'Editing Shortcuts',
        description: 'Standard editing shortcuts apply: Cmd/Ctrl + S to save, Cmd/Ctrl + Z to undo.',
        tips: [
          'Most text formatting shortcuts work in rich text editors',
          'Cmd/Ctrl + Shift + Z for redo',
        ],
      },
      {
        id: 'step-4',
        title: 'Quick Actions',
        description: 'Cmd/Ctrl + N creates new items. Cmd/Ctrl + K opens command palette.',
        tips: [
          'Command palette provides quick access to any feature',
          'Type to search for actions, sections, or brands',
        ],
      },
    ],
    relatedSections: ['quick-actions'],
  },

  // ============================
  // NEW FEATURES (2026)
  // ============================
  {
    id: 'hero-effects-showcase',
    title: 'Hero Effects Gallery',
    description: 'Browse and customize animated hero backgrounds with the interactive effects playground.',
    icon: 'Sparkles',
    category: 'brand-guides',
    keywords: ['hero', 'effects', 'animation', 'background', 'particles', 'parallax', 'gallery'],
    steps: [
      {
        id: 'step-1',
        title: 'Access the Hero Effects Gallery',
        description: 'Visit /hero-effects to browse all available animated backgrounds in an interactive playground.',
        tips: [
          'See all 15+ effect styles in one place',
          'Effects include Particles, Waves, Geometric, Nebula, and more',
        ],
      },
      {
        id: 'step-2',
        title: 'Interactive Customization',
        description: 'Use the control panel to adjust density, speed, intensity, brightness, and color schemes in real-time.',
        tips: [
          'Preview changes instantly before applying',
          'Toggle fullscreen mode for immersive testing',
        ],
      },
      {
        id: 'step-3',
        title: 'Apply to Your Brand',
        description: 'Copy the effect configuration and apply it to your brand guide hero section.',
        tips: [
          'Effects automatically adapt to your brand colors',
          'Ken Burns parallax available for all effects',
        ],
      },
    ],
    relatedSections: ['brand-identity', 'ai-patterns-gradients'],
  },

  {
    id: 'presentation-templates',
    title: 'Presentation Templates',
    description: 'Upload, organize, and share presentation templates with live Office Online previews.',
    icon: 'Presentation',
    category: 'brand-guides',
    keywords: ['presentation', 'powerpoint', 'pptx', 'pdf', 'templates', 'slides', 'deck'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Presentation Templates',
        description: 'In your brand guide, navigate to the Presentation Templates section.',
        tips: [
          'Supports PPTX, PDF, and cloud folder links',
          'Organize templates by category: Corporate, Sales, Events, etc.',
        ],
      },
      {
        id: 'step-2',
        title: 'Upload Templates',
        description: 'Drag and drop presentation files or click to browse. Add a name, description, and category.',
        tips: [
          'Thumbnails are auto-generated from the first slide',
          'Set custom card images for visual consistency',
        ],
      },
      {
        id: 'step-3',
        title: 'Live Preview',
        description: 'Click any template to open the Office Online preview with fullscreen mode.',
        tips: [
          'Preview works for PPTX and PDF files',
          'Embedded folders link directly to cloud storage',
        ],
      },
      {
        id: 'step-4',
        title: 'Download & Share',
        description: 'Download templates directly or share links to your team.',
        tips: [
          'File sizes and types are displayed on each card',
          'External URLs open in new tabs for cloud-hosted files',
        ],
      },
    ],
    relatedSections: ['templates', 'publishing'],
  },

  {
    id: 'security-features',
    title: 'Security & Privacy',
    description: 'Enterprise-grade security with Row Level Security, email masking, and leaked password protection.',
    icon: 'Shield',
    category: 'advanced',
    keywords: ['security', 'privacy', 'rls', 'encryption', 'password', 'protection', 'enterprise'],
    steps: [
      {
        id: 'step-1',
        title: 'Understand Security Model',
        description: 'BrandHub uses Row Level Security (RLS) to ensure users only access data they\'re authorized to see.',
        tips: [
          'All database queries are filtered by user permissions',
          'Organization data is isolated between tenants',
        ],
      },
      {
        id: 'step-2',
        title: 'Email Masking',
        description: 'Non-admin users see masked emails (***@domain.com) for other team members, preventing data harvesting.',
        tips: [
          'Admins see full email addresses for user management',
          'Your own email is always visible to you',
        ],
      },
      {
        id: 'step-3',
        title: 'Leaked Password Protection',
        description: 'The platform checks new passwords against known breached password databases.',
        tips: [
          'Prevents use of compromised passwords',
          'Enable in authentication settings',
        ],
      },
      {
        id: 'step-4',
        title: 'Audit Logging',
        description: 'All actions are logged with user ID, timestamp, and action details for compliance.',
        tips: [
          'Logs are retained for 30 days by default',
          'Admins can view activity in the Admin Dashboard',
        ],
      },
    ],
    relatedSections: ['team-management', 'admin-analytics'],
  },

  {
    id: 'philosophical-pillars',
    title: 'Philosophical Pillars',
    description: 'Showcase your brand values with high-quality imagery or icons in a grid layout.',
    icon: 'Compass',
    category: 'brand-guides',
    keywords: ['pillars', 'values', 'philosophy', 'principles', 'culture', 'imagery'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Philosophical Pillars',
        description: 'In your brand guide, navigate to the Philosophical Pillars section under Overview.',
        tips: [
          'Pillars represent your core brand values and principles',
          'Use for culture decks, investor materials, or team alignment',
        ],
      },
      {
        id: 'step-2',
        title: 'Choose Display Mode',
        description: 'Toggle between Icons or Images mode. Images provide a more premium, editorial feel.',
        tips: [
          'Icons are great for minimal designs',
          'Images work best for storytelling and emotional impact',
        ],
      },
      {
        id: 'step-3',
        title: 'Select Preset Themes',
        description: 'Browse preset themes like Collaboration, Integrity, Innovation, or Customer Focus.',
        tips: [
          'Presets include curated high-quality imagery',
          'Override with custom uploads for brand-specific visuals',
        ],
      },
      {
        id: 'step-4',
        title: 'Upload Custom Assets',
        description: 'Upload your own images to cloud storage for persistent, high-quality display.',
        tips: [
          'Images are stored in organization-assets bucket',
          'Use candid, authentic imagery for best results',
        ],
      },
    ],
    relatedSections: ['overview-section', 'photography'],
  },

  {
    id: 'qr-codes',
    title: 'QR Codes & Access Ports',
    description: 'Generate branded QR codes with custom styling, logos, and tracking.',
    icon: 'QrCode',
    category: 'brand-guides',
    keywords: ['qr', 'code', 'access', 'port', 'scan', 'link', 'tracking'],
    steps: [
      {
        id: 'step-1',
        title: 'Access QR Codes Section',
        description: 'Navigate to QR Codes (Access Ports) in your brand guide sidebar.',
        tips: [
          'QR codes can link to any URL',
          'Track scan counts for marketing analytics',
        ],
      },
      {
        id: 'step-2',
        title: 'Create New QR Code',
        description: 'Click Add QR Code, enter a name, URL, and description. Choose a use case category.',
        tips: [
          'Use cases: Marketing, Website, Social Media, Events, Print',
          'Add descriptions for internal reference',
        ],
      },
      {
        id: 'step-3',
        title: 'Customize Styling',
        description: 'Set foreground/background colors, dot style, corner style, and error correction level.',
        tips: [
          'Brand colors are automatically suggested',
          'Higher error correction allows for logo overlays',
        ],
      },
      {
        id: 'step-4',
        title: 'Add Logo Overlay',
        description: 'Optionally add your logo to the center of the QR code for brand recognition.',
        tips: [
          'Keep logos small to maintain scannability',
          'Use transparent PNG logos for best results',
        ],
      },
    ],
    relatedSections: ['logo-management', 'publishing'],
  },

  {
    id: 'email-signatures',
    title: 'Email Signatures',
    description: 'Create consistent, branded email signatures for your entire organization.',
    icon: 'AtSign',
    category: 'brand-guides',
    keywords: ['email', 'signature', 'corporate', 'branding', 'template'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Email Signatures',
        description: 'In your brand guide, navigate to the Email Signatures section.',
        tips: [
          'Signatures ensure consistent brand representation',
          'Support for Standard and Reply variants',
        ],
      },
      {
        id: 'step-2',
        title: 'Configure Signature Template',
        description: 'Set up the signature layout with logo, contact fields, social links, and font choices.',
        tips: [
          'Use Verdana or Arial for maximum email client compatibility',
          'Keep signatures under 5 lines for mobile readability',
        ],
      },
      {
        id: 'step-3',
        title: 'Preview & Copy',
        description: 'Preview how signatures look across email clients, then copy HTML to clipboard.',
        tips: [
          'Signatures use nested tables for cross-client support',
          'Test in Outlook, Gmail, and Apple Mail',
        ],
      },
    ],
    relatedSections: ['logo-management', 'typography'],
  },

  // ============================
  // BIAS AWARENESS & ACCESSIBILITY
  // ============================
  {
    id: 'bias-awareness',
    title: 'Bias Awareness Scanning',
    description: 'AI-powered governance that evaluates your brand content for language, imagery, and accessibility bias.',
    icon: 'Scale',
    category: 'advanced',
    keywords: ['bias', 'inclusion', 'inclusive', 'accessibility', 'governance', 'persona', 'spectrum', 'wcag', 'scan'],
    steps: [
      {
        id: 'step-1',
        title: 'Trigger a Bias Scan',
        description: 'Open any brand, product, or event editor and launch a Bias Awareness scan from the AI tools panel. The scan evaluates Language, Visual, Accessibility, and AI Governance dimensions.',
        tips: [
          'Scans run asynchronously — you can continue editing while they process',
          'Results persist in the database for historical tracking',
        ],
      },
      {
        id: 'step-2',
        title: 'Review Dimension Scores',
        description: 'Each scan produces scores across four dimensions: Language (inclusive terminology), Visual (representation), Accessibility (WCAG compliance), and AI Governance (responsible AI usage).',
        tips: [
          'Scores range from 0-100 with color-coded thresholds',
          'Click any dimension to see detailed findings and recommendations',
        ],
      },
      {
        id: 'step-3',
        title: 'Persona Spectrum Coverage',
        description: 'The scan evaluates your content against the Microsoft Persona Spectrum — permanent, temporary, and situational needs across Vision, Mobility, Hearing, Speech, and Cognitive dimensions.',
        tips: [
          'Vision coverage: alt-text and high contrast',
          'Mobility coverage: responsive layouts and touch targets',
          'Hearing/Speech: captions and chat availability',
          'Cognitive: plain language and navigation clarity',
        ],
      },
      {
        id: 'step-4',
        title: 'Act on Findings',
        description: 'Each finding includes severity (info/warning/error) and actionable recommendations. Address high-severity items first for the biggest impact on your inclusion score.',
        tips: [
          'Findings feed into the Insights & Updates section for org-wide visibility',
          'The Admin Dashboard Bias Awareness tab shows aggregate scores across all entities',
        ],
      },
    ],
    relatedSections: ['color-accessibility', 'inclusive-imagery'],
  },

  {
    id: 'color-accessibility',
    title: 'Color Accessibility & Contrast',
    description: 'Ensure your brand colors meet accessibility standards with automated contrast checks, colorblind simulations, and cultural color analysis.',
    icon: 'Blend',
    category: 'advanced',
    keywords: ['color', 'contrast', 'wcag', 'colorblind', 'accessibility', 'oklch', 'cultural', 'symbolism'],
    steps: [
      {
        id: 'step-1',
        title: 'Automated Contrast Checks',
        description: 'BrandHub uses OKLCH perceptual color logic to automatically check your palette against WCAG 2.2 AA and AAA contrast requirements (4.5:1 and 7:1 ratios).',
        tips: [
          'Contrast issues are flagged automatically in bias scans',
          'Auto-generated palettes always pass contrast checks',
        ],
      },
      {
        id: 'step-2',
        title: 'Colorblind Simulations',
        description: 'Preview how your brand colors appear under Protanopia, Deuteranopia, Tritanopia, and Achromatopsia simulations to ensure readability for all users.',
        tips: [
          'About 8% of men and 0.5% of women have some form of color vision deficiency',
          'Avoid relying solely on color to convey information',
        ],
      },
      {
        id: 'step-3',
        title: 'Cultural Color Symbolism',
        description: 'The Global Cultural Symbolism Map alerts you when color choices conflict with cultural meanings in target markets (e.g., red = luck in Asia, mourning in South Africa).',
        tips: [
          'Review cultural alerts before launching in new markets',
          'Integrate with GlobalLink regional variants for market-specific palettes',
        ],
      },
    ],
    relatedSections: ['bias-awareness', 'color-palette'],
  },

  {
    id: 'inclusive-imagery',
    title: 'Inclusive Imagery & Representation',
    description: 'AI-powered imagery audit that checks for stereotypes, representation diversity, and authentic visual storytelling.',
    icon: 'Eye',
    category: 'advanced',
    keywords: ['imagery', 'inclusive', 'representation', 'stereotypes', 'diversity', 'audit', 'wfa', 'pie'],
    steps: [
      {
        id: 'step-1',
        title: 'Imagery Audit',
        description: 'The Inclusive Imagery Audit evaluates brand photos and visuals for representation diversity, power hierarchies, and common tropes using the PI&E "Who Else?" and WFA litmus tests.',
        tips: [
          'Audit runs as part of the full Bias Awareness scan',
          'Focuses on both who is represented and how they are portrayed',
        ],
      },
      {
        id: 'step-2',
        title: 'Review Recommendations',
        description: 'For each flagged image, get specific suggestions for more authentic, representative alternatives that avoid stereotypes.',
        tips: [
          'The platform recommends photojournalistic style over staged corporate imagery',
          'Consider temporary and situational needs, not just permanent disabilities',
        ],
      },
      {
        id: 'step-3',
        title: 'Creative Checklist',
        description: 'A 12-step WFA-aligned review checklist ensures your creative work is on-brand, engaging, and inclusive before publication.',
        tips: [
          'Complete the checklist for each major campaign or brand refresh',
          'Results contribute to your overall inclusion score',
        ],
      },
    ],
    relatedSections: ['bias-awareness', 'brand-identity'],
  },
];

// Helper function to search help content
export function searchHelpContent(query: string): HelpSection[] {
  const lowerQuery = query.toLowerCase();
  return helpSections.filter(section => {
    const inTitle = section.title.toLowerCase().includes(lowerQuery);
    const inDescription = section.description.toLowerCase().includes(lowerQuery);
    const inKeywords = section.keywords.some(k => k.includes(lowerQuery));
    const inSteps = section.steps.some(step => 
      step.title.toLowerCase().includes(lowerQuery) ||
      step.description.toLowerCase().includes(lowerQuery)
    );
    return inTitle || inDescription || inKeywords || inSteps;
  });
}

// Get sections by category
export function getSectionsByCategory(category: HelpSection['category']): HelpSection[] {
  return helpSections.filter(s => s.category === category);
}

// Get related sections
export function getRelatedSections(sectionId: string): HelpSection[] {
  const section = helpSections.find(s => s.id === sectionId);
  if (!section?.relatedSections) return [];
  return helpSections.filter(s => section.relatedSections?.includes(s.id));
}

// Export all content as JSON for AI chatbot consumption
export function exportForAI(): string {
  return JSON.stringify({
    categories: helpCategories,
    sections: helpSections,
  }, null, 2);
}
