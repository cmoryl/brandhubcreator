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
    description: 'Learn the basics of using BrandHub',
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
    description: 'Manage your organization, team, and settings',
    icon: 'Building2',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Power user features and integrations',
    icon: 'Zap',
  },
];

export const helpSections: HelpSection[] = [
  // Getting Started
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
        description: 'From the main dashboard, click the "New Brand" button in the top right corner, or use the empty state card if this is your first brand.',
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
          'Hide sections you don\'t need using the section menu',
        ],
      },
    ],
    relatedSections: ['overview-section', 'brand-identity', 'color-palette'],
  },

  // Brand Guide Sections
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
      {
        id: 'step-5',
        title: 'Delete Logos',
        description: 'Hover over a logo and click the delete icon to remove it. A confirmation dialog will appear.',
        warning: 'Deleted logos cannot be recovered. Make sure you have backups before deleting.',
      },
    ],
    relatedSections: ['brand-identity', 'iconography'],
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
        title: 'Add Color Usage Guidelines',
        description: 'For each color, add notes about when and how to use it. Click the color swatch to edit details.',
        tips: [
          'Specify ratios: "Primary blue should be 60% of any design"',
          'Note which colors pair well together',
          'Include accessibility guidelines for text on colored backgrounds',
        ],
      },
      {
        id: 'step-5',
        title: 'Export Color Values',
        description: 'Use the export feature to download color values in various formats: CSS, SCSS, JSON, or design tool formats.',
        tips: [
          'Export formats include variables for easy developer handoff',
        ],
      },
    ],
    relatedSections: ['typography', 'brand-identity'],
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
    id: 'iconography',
    title: 'Iconography',
    description: 'Create and manage your brand\'s icon library with consistent styling.',
    icon: 'Sparkles',
    category: 'brand-guides',
    keywords: ['icons', 'iconography', 'symbols', 'graphics', 'svg', 'vectors', 'style', 'library'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Icon Library',
        description: 'Click "Iconography" in the sidebar. The Icon System Creator allows you to generate, select, or upload icons.',
        tips: [
          'Icons are organized in a 3-level hierarchy: Core, Product Line, Brand',
        ],
      },
      {
        id: 'step-2',
        title: 'Choose Icons from Library',
        description: 'Browse 1500+ Lucide icons or search by keyword. Click an icon to add it to your brand library.',
        tips: [
          'Maintain consistency - stick to one icon style throughout',
          'Search for icons by function: "search", "menu", "user", etc.',
        ],
      },
      {
        id: 'step-3',
        title: 'Generate Custom Icons',
        description: 'Use the AI-powered icon generator. Describe the icon you need and select from 17 style presets.',
        tips: [
          'Be specific in descriptions: "minimalist shopping cart with rounded corners"',
          'Generated icons can be refined and regenerated',
        ],
      },
      {
        id: 'step-4',
        title: 'Upload Custom SVGs',
        description: 'Drag and drop SVG files to upload custom icons. They\'ll be added to your brand library.',
        tips: [
          'Ensure SVGs are optimized and properly sized',
          'Use consistent stroke weights across all custom icons',
        ],
        warning: 'Only SVG format is supported for custom icon uploads.',
      },
      {
        id: 'step-5',
        title: 'Export Icons',
        description: 'Select icons and use batch export to download as SVG or PNG in various sizes.',
        tips: [
          'Export in multiple sizes for different use cases',
          'PNG exports include proper padding and sizing',
        ],
      },
    ],
    relatedSections: ['logo-management', 'color-palette'],
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
    id: 'services-section',
    title: 'Services & Offerings',
    description: 'Showcase your brand\'s services or products with rich media cards.',
    icon: 'Briefcase',
    category: 'brand-guides',
    keywords: ['services', 'products', 'offerings', 'cards', 'showcase', 'business'],
    steps: [
      {
        id: 'step-1',
        title: 'Navigate to Services',
        description: 'Click "Services" in the sidebar to manage your service/product cards.',
        tips: [
          'Services appear as interactive cards with optional header images',
        ],
      },
      {
        id: 'step-2',
        title: 'Add a New Service',
        description: 'Click "Add Service" and fill in the title, description, and optional header image.',
        tips: [
          'Keep titles concise - 2-4 words work best',
          'Descriptions should be scannable - use short paragraphs',
        ],
      },
      {
        id: 'step-3',
        title: 'Upload Header Images',
        description: 'Each service card can have a cinematic header image. Click the image area to upload.',
        tips: [
          'Use abstract or atmospheric images - avoid text in images',
          'Header images should evoke the service\'s essence',
        ],
      },
      {
        id: 'step-4',
        title: 'Reorder Services',
        description: 'Drag service cards to reorder them. The order is saved automatically.',
        tips: [
          'Lead with your most important or popular services',
        ],
      },
    ],
    relatedSections: ['overview-section', 'templates'],
  },

  {
    id: 'templates',
    title: 'Template Specifications',
    description: 'Document brand templates for common collateral like business cards, letterheads, and presentations.',
    icon: 'LayoutTemplate',
    category: 'brand-guides',
    keywords: ['templates', 'collateral', 'business cards', 'letterhead', 'presentations', 'specs'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Template Specs',
        description: 'Click "Templates" or "Collateral" in the sidebar to manage template specifications.',
        tips: [
          'Templates ensure consistency across all brand materials',
        ],
      },
      {
        id: 'step-2',
        title: 'Add a Template Category',
        description: 'Create categories like "Print Materials", "Digital Templates", "Social Media".',
        tips: [
          'Organize by medium or department for easy navigation',
        ],
      },
      {
        id: 'step-3',
        title: 'Define Template Specs',
        description: 'For each template, add dimensions, bleed requirements, color mode, and file format.',
        tips: [
          'Include both working file format (AI, PSD) and export format',
          'Note any print-specific requirements like CMYK conversion',
        ],
      },
      {
        id: 'step-4',
        title: 'Upload Template Files',
        description: 'Attach downloadable template files for team members to use.',
        tips: [
          'Include both editable and locked versions where appropriate',
          'Add preview images so users can see before downloading',
        ],
        warning: 'Large template files may take longer to upload. Compress files when possible.',
      },
    ],
    relatedSections: ['color-palette', 'typography'],
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
          'Public guides can be indexed by search engines',
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
        title: 'Embed Options',
        description: 'For advanced sharing, use embed codes to include your brand guide on external sites.',
        tips: [
          'Embed codes maintain brand styling and interactivity',
        ],
      },
    ],
    relatedSections: ['create-first-brand', 'section-management'],
  },

  {
    id: 'section-management',
    title: 'Managing Sections',
    description: 'Reorder, hide, or customize sections in your brand guide.',
    icon: 'LayoutList',
    category: 'brand-guides',
    keywords: ['sections', 'reorder', 'hide', 'show', 'organize', 'customize', 'sidebar'],
    steps: [
      {
        id: 'step-1',
        title: 'Access Section Controls',
        description: 'Sections are listed in the sidebar. Each section has a menu icon (⋮) with management options.',
        tips: [
          'Drag sections in the sidebar to reorder them',
        ],
      },
      {
        id: 'step-2',
        title: 'Reorder Sections',
        description: 'Click and drag a section in the sidebar to move it. The order is saved automatically.',
        tips: [
          'Consider your audience\'s priorities when ordering',
          'Most important sections should appear first',
        ],
      },
      {
        id: 'step-3',
        title: 'Hide Sections',
        description: 'Click the section menu and select "Hide Section" to remove it from view. Hidden sections remain in the system.',
        tips: [
          'Hidden sections can be restored anytime',
          'Use hiding for sections in progress or not applicable',
        ],
      },
      {
        id: 'step-4',
        title: 'Restore Hidden Sections',
        description: 'Go to brand settings or use the sidebar menu to see and restore hidden sections.',
        tips: [
          'Content in hidden sections is preserved',
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
        title: 'Navigate to Product Guides Section',
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
          'Linked guides are shown in organization portals with badges',
          'Breadcrumbs reflect the parent-child relationship',
        ],
      },
    ],
    relatedSections: ['create-first-brand', 'publishing'],
  },

  // Organization
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
    relatedSections: ['organization-setup', 'publishing'],
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
        ],
      },
    ],
    relatedSections: ['publishing', 'organization-setup'],
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
