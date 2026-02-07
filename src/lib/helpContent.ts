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
    description: 'The unified hub for all icon management: library, AI generation, stylizing, app icons, and more.',
    icon: 'Sparkles',
    category: 'brand-guides',
    keywords: ['icons', 'iconography', 'studio', 'library', 'ai', 'generate', 'app icon', 'stylizer', 'svg'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Icon Studio',
        description: 'Click "Iconography" in the sidebar, then open the Icon Studio. It contains multiple tabs for different icon workflows.',
        tips: [
          'Icon Studio is the unified entry point for ALL icon functionality',
          'Tabs include: Library, AI Generator, Stylizer, App Icons, Creator, and more',
        ],
      },
      {
        id: 'step-2',
        title: 'Browse the Icon Library',
        description: 'The Library tab lets you manage organization icon libraries with a 3-level hierarchy: Core, Product Line, and Brand.',
        tips: [
          'Icons inherit from parent levels for consistency',
          'Drag to reorder icons and libraries',
          'Use batch processing for bulk operations',
        ],
      },
      {
        id: 'step-3',
        title: 'Generate Icons with AI',
        description: 'The AI Generator tab creates complete icon sets based on your brand. Describe your needs and select from 17+ style presets.',
        tips: [
          'Be specific: "minimalist e-commerce icons with rounded corners"',
          'Generate sets of related icons in one batch',
          'AI uses your brand colors automatically',
        ],
      },
      {
        id: 'step-4',
        title: 'Stylize Existing Icons',
        description: 'The Stylizer tab converts PNG images to brand-aligned SVG icons. Upload any image and AI will vectorize it.',
        tips: [
          'Great for converting sketches or photos to clean icons',
          'Preview before saving to ensure quality',
        ],
      },
      {
        id: 'step-5',
        title: 'Create App Icons',
        description: 'The App Icons tab generates platform-specific icons for Android, iOS, and PWA from a single source.',
        tips: [
          'Outputs all required sizes automatically',
          'Includes manifest files for PWA deployment',
          'Handles platform-specific requirements (rounded corners, safe zones)',
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
    description: 'AI-powered learning system that builds knowledge about your brand over time.',
    icon: 'Brain',
    category: 'advanced',
    keywords: ['intelligence', 'ai', 'learning', 'knowledge', 'analysis', 'insights', 'history'],
    steps: [
      {
        id: 'step-1',
        title: 'Understand Brand Intelligence',
        description: 'Brand Intelligence is an AI system that learns from your brand guide content and usage patterns.',
        tips: [
          'Intelligence improves with more complete brand guides',
          'It tracks analysis history and confidence scores',
        ],
      },
      {
        id: 'step-2',
        title: 'View Intelligence Profile',
        description: 'Access your brand\'s intelligence profile to see accumulated knowledge entries and insights.',
        tips: [
          'Knowledge entries represent learned brand attributes',
          'The system identifies patterns and relationships',
        ],
      },
      {
        id: 'step-3',
        title: 'Provide Feedback',
        description: 'Rate insights and recommendations to help the AI learn your preferences.',
        tips: [
          'Feedback improves future recommendations',
          'The more feedback, the more personalized insights become',
        ],
      },
      {
        id: 'step-4',
        title: 'Track Confidence Over Time',
        description: 'Monitor how the AI\'s confidence in brand understanding grows with more data.',
        tips: [
          'Higher confidence means more reliable recommendations',
          'Confidence can decay if brand content becomes stale',
        ],
      },
    ],
    relatedSections: ['market-analysis', 'ai-patterns-gradients'],
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
