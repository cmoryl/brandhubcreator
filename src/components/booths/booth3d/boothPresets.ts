/**
 * Industry-specific booth design presets for the 3D booth mapper.
 * 
 * Each preset defines a complete booth configuration including:
 * - Recommended layout, lighting, and color scheme
 * - Panel content descriptions (what should go on each wall)
 * - Industry-specific design notes and best practices
 * - Fixture/furniture suggestions AND actual 3D PlacedAsset layouts
 * - Flooring configuration
 */

import type { BoothLayout, LightingPreset } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';
import type { FlooringConfig, FlooringType } from './BoothFloorpad';

export interface BoothPresetPanelGuide {
  panelId: string;
  contentType: 'hero-graphic' | 'product-showcase' | 'brand-story' | 'demo-station' | 'logo-wall' | 'video-wall' | 'data-viz' | 'testimonials' | 'schedule' | 'wayfinding';
  title: string;
  description: string;
  /** Suggested color treatment */
  colorTreatment?: string;
}

export interface BoothFixtureSuggestion {
  name: string;
  position: string;
  icon: string; // lucide icon name
}

export interface BoothDesignPreset {
  id: string;
  name: string;
  industry: string;
  category: 'corporate' | 'technology' | 'healthcare' | 'finance' | 'creative' | 'industrial' | 'retail' | 'education' | 'hospitality' | 'government';
  description: string;
  /** Recommended booth layout */
  layout: BoothLayout;
  /** Recommended lighting */
  lighting: LightingPreset;
  /** Primary brand color hex */
  primaryColor: string;
  /** Secondary accent color hex */
  accentColor: string;
  /** Background treatment */
  backgroundStyle: 'solid' | 'gradient' | 'pattern' | 'photo';
  /** Per-panel content guides */
  panelGuides: BoothPresetPanelGuide[];
  /** Fixture/furniture suggestions */
  fixtures: BoothFixtureSuggestion[];
  /** Design tips specific to this industry */
  designTips: string[];
  /** Tags for search/filter */
  tags: string[];
  /** Pre-placed 3D furniture assets — applied when user selects preset */
  placedAssets?: PlacedAsset[];
  /** Flooring configuration */
  flooringConfig?: FlooringConfig;
}

export const BOOTH_DESIGN_PRESETS: BoothDesignPreset[] = [
  // ═══════════════════════════════════════
  // TECHNOLOGY
  // ═══════════════════════════════════════
  {
    id: 'tech-saas-launch',
    name: 'SaaS Product Launch',
    industry: 'Technology',
    category: 'technology',
    description: 'High-impact product launch booth with live demo stations, oversized hero graphics, and a clean modern aesthetic. Designed for CES, Web Summit, and SaaS conferences.',
    layout: 'u-shape',
    lighting: 'expo-bright',
    primaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Hero Launch Graphic', description: 'Full-bleed product screenshot or 3D render on gradient background. Product name in 72pt+ bold. Tagline underneath.', colorTreatment: 'Dark-to-blue gradient with white text' },
      { panelId: 'left', contentType: 'demo-station', title: 'Live Demo Wall', description: 'Interactive demo area with mounted screen mockup. Feature highlights in icon+text format. QR code for sign-up.', colorTreatment: 'Dark background with accent highlights' },
      { panelId: 'right', contentType: 'product-showcase', title: 'Feature Showcase', description: 'Key features in a visual grid. Before/after comparisons. Customer logos or trust badges at bottom.', colorTreatment: 'Clean white with brand accent borders' },
    ],
    fixtures: [
      { name: 'Demo Kiosk (x2)', position: 'Front-center', icon: 'Monitor' },
      { name: 'Charging Station', position: 'Left counter', icon: 'BatteryCharging' },
      { name: 'Meeting Table', position: 'Center-back', icon: 'Users' },
    ],
    designTips: [
      'Use 60/30/10 rule: 60% dark bg, 30% primary blue, 10% cyan accents',
      'Product screenshots should be at least 300 DPI for 8ft panels',
      'Include a large QR code (min 8" square) for app/demo downloads',
      'LED backlighting on back wall dramatically increases visibility from 50ft+',
    ],
    tags: ['saas', 'product-launch', 'demo', 'tech', 'startup', 'modern'],
  },
  {
    id: 'tech-enterprise',
    name: 'Enterprise Solutions',
    industry: 'Technology',
    category: 'technology',
    description: 'Authoritative, trust-building booth for enterprise B2B tech. Emphasizes security, scale, and integration capabilities. Ideal for RSA, Gartner, and enterprise conferences.',
    layout: 'island',
    lighting: 'cool-neutral',
    primaryColor: '#1e40af',
    accentColor: '#7c3aed',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'front', contentType: 'hero-graphic', title: 'Enterprise Hero', description: 'Bold brand mark with "Enterprise-grade" positioning. Abstract network/security visualization. Fortune 500 client logos.', colorTreatment: 'Deep navy to indigo gradient' },
      { panelId: 'back', contentType: 'data-viz', title: 'Platform Architecture', description: 'Simplified architecture diagram showing integrations. Security certifications (SOC2, ISO). Scalability metrics.', colorTreatment: 'Dark background with node-graph styling' },
      { panelId: 'left', contentType: 'testimonials', title: 'Customer Success', description: 'Case study snapshots with ROI metrics. Customer quotes with headshots. Industry-specific use cases.', colorTreatment: 'White panels with brand accent dividers' },
      { panelId: 'right', contentType: 'product-showcase', title: 'Solutions Portfolio', description: 'Product suite overview. Integration partner logos. Migration/onboarding timeline.', colorTreatment: 'Muted background with card-style product tiles' },
    ],
    fixtures: [
      { name: 'Executive Meeting Room', position: 'Center-back enclosed', icon: 'DoorOpen' },
      { name: 'Demo Pods (x4)', position: 'Four corners', icon: 'Monitor' },
      { name: 'Refreshment Counter', position: 'Front-right', icon: 'Coffee' },
      { name: 'Literature Stand', position: 'Front-left', icon: 'FileText' },
    ],
    designTips: [
      'Enterprise buyers value trust signals — display certifications prominently',
      'Include a semi-private meeting area for sales conversations',
      'Use fewer, larger graphics — avoid clutter that undermines premium positioning',
      'Neutral color palette with strategic brand color accents reads as sophisticated',
    ],
    tags: ['enterprise', 'b2b', 'security', 'platform', 'integrations'],
  },
  {
    id: 'tech-ai-ml',
    name: 'AI & Machine Learning',
    industry: 'Technology',
    category: 'technology',
    description: 'Futuristic booth showcasing AI capabilities with dynamic data visualizations, neural network motifs, and interactive model demos.',
    layout: 'l-shape',
    lighting: 'showcase-dim',
    primaryColor: '#8b5cf6',
    accentColor: '#06d6a0',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'AI Platform Hero', description: 'Abstract neural network visualization or generative art backdrop. Product name with "AI-powered" messaging. Glowing particle effects.', colorTreatment: 'Deep purple to black gradient with neon accents' },
      { panelId: 'left', contentType: 'data-viz', title: 'Model Performance', description: 'Real-time accuracy metrics dashboard. Before/after comparison of AI outputs. Use case carousel with results.', colorTreatment: 'Dark background with green/cyan data highlights' },
    ],
    fixtures: [
      { name: 'Interactive Demo Screen', position: 'Front-center', icon: 'Brain' },
      { name: 'Model Training Visualization', position: 'Back wall mounted', icon: 'Activity' },
    ],
    designTips: [
      'Use dark backgrounds with luminous accents for a futuristic AI aesthetic',
      'Live model demos are the #1 traffic driver — make them visually prominent',
      'Avoid generic robot/brain imagery — use actual product visuals instead',
      'Data visualization motion graphics on a loop capture attention from distance',
    ],
    tags: ['ai', 'machine-learning', 'data-science', 'neural', 'futuristic'],
  },
  {
    id: 'tech-cybersecurity',
    name: 'Cybersecurity',
    industry: 'Technology',
    category: 'technology',
    description: 'High-security aesthetic with dark backgrounds, shield motifs, and trust-centric messaging. Perfect for RSA, Black Hat, and DEFCON.',
    layout: 'u-shape',
    lighting: 'showcase-dim',
    primaryColor: '#059669',
    accentColor: '#f59e0b',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Security Platform Hero', description: 'Shield/lock motif with product suite branding. "Zero Trust" or security philosophy tagline. Dark, authoritative background.', colorTreatment: 'Near-black with emerald green accents' },
      { panelId: 'left', contentType: 'data-viz', title: 'Threat Dashboard', description: 'Simulated SOC dashboard showing real-time threat detection. Detection rate metrics. Response time stats.', colorTreatment: 'Dark terminal aesthetic with green/amber data' },
      { panelId: 'right', contentType: 'testimonials', title: 'Trust & Compliance', description: 'Security certifications grid (SOC2, FedRAMP, HIPAA). Government agency logos. Analyst quadrant badges.', colorTreatment: 'Dark background with gold certification badges' },
    ],
    fixtures: [
      { name: 'Threat Simulation Kiosk', position: 'Front-center', icon: 'Shield' },
      { name: 'Private Demo Room', position: 'Behind back wall', icon: 'Lock' },
    ],
    designTips: [
      'Security buyers expect a "fortress" aesthetic — dark, controlled, authoritative',
      'Certification badges should be real, verifiable, and prominently displayed',
      'Live threat detection demos are the highest-engagement activity',
      'Amber/gold accents convey warning/alert appropriately for the security context',
    ],
    tags: ['cybersecurity', 'security', 'compliance', 'zero-trust', 'soc'],
  },

  // ═══════════════════════════════════════
  // HEALTHCARE & PHARMA
  // ═══════════════════════════════════════
  {
    id: 'health-pharma',
    name: 'Pharmaceutical',
    industry: 'Healthcare',
    category: 'healthcare',
    description: 'Clinical-grade booth design for pharmaceutical companies. Clean, compliant, and trust-forward. Designed for HIMSS, ASCO, and AMA conferences.',
    layout: 'island',
    lighting: 'cool-neutral',
    primaryColor: '#0ea5e9',
    accentColor: '#14b8a6',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'front', contentType: 'hero-graphic', title: 'Therapy Area Hero', description: 'Clean product/therapy imagery. Brand logo at scale. Primary indication and tagline. ISI reference marker.', colorTreatment: 'White background with blue brand accents' },
      { panelId: 'back', contentType: 'data-viz', title: 'Clinical Data', description: 'Phase III trial results in clean chart format. Efficacy data with confidence intervals. Safety profile summary.', colorTreatment: 'White panels with clinical blue data styling' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Product Portfolio', description: 'Product packaging photography. Dosing information. Mechanism of action diagram.', colorTreatment: 'Light gradient with product photography' },
      { panelId: 'right', contentType: 'brand-story', title: 'Patient Stories', description: 'De-identified patient outcome stories. HCP testimonial videos. Real-world evidence highlights.', colorTreatment: 'Warm neutral background with human photography' },
    ],
    fixtures: [
      { name: 'Medical Info Counter', position: 'Front-center', icon: 'Stethoscope' },
      { name: 'HCP Meeting Suite', position: 'Center-back enclosed', icon: 'DoorOpen' },
      { name: 'Sample Request Station', position: 'Left counter', icon: 'Package' },
      { name: 'Digital Poster Stand', position: 'Right side', icon: 'FileText' },
    ],
    designTips: [
      'All claims must include ISI references — design accommodating regulatory text',
      'Clinical data visualizations must follow FDA/EMA promotional guidelines',
      'White space conveys clinical cleanliness and regulatory compliance',
      'Use sans-serif fonts for medical data — Helvetica Neue or similar',
    ],
    tags: ['pharma', 'clinical', 'medical', 'healthcare', 'regulatory', 'hcp'],
  },
  {
    id: 'health-medtech',
    name: 'Medical Devices & MedTech',
    industry: 'Healthcare',
    category: 'healthcare',
    description: 'Product-forward booth design for medical device companies showcasing hardware, surgical tools, or diagnostic equipment.',
    layout: 'u-shape',
    lighting: 'expo-bright',
    primaryColor: '#0891b2',
    accentColor: '#6366f1',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Device Hero', description: 'Hero product photography with dramatic lighting. Device name and clinical indication. FDA clearance callout.', colorTreatment: 'Dark-to-teal gradient with white product photography' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Technical Specs', description: 'Exploded view or cross-section of device. Key specifications in clean infographic format. Comparison vs. legacy.', colorTreatment: 'Clean white with technical diagram styling' },
      { panelId: 'right', contentType: 'testimonials', title: 'Clinical Evidence', description: 'KOL testimonials. Published study citations. Clinical outcome data with visualizations.', colorTreatment: 'Light background with data-forward accents' },
    ],
    fixtures: [
      { name: 'Product Display Pedestal', position: 'Front-center', icon: 'Box' },
      { name: 'Hands-on Demo Station', position: 'Left station', icon: 'Hand' },
      { name: 'Video Loop Monitor', position: 'Right side', icon: 'Play' },
    ],
    designTips: [
      'Physical product display is the centerpiece — ensure proper lighting and security',
      'Use dramatic product photography angles to convey innovation',
      'Hands-on demo areas drive 3x more engagement than passive displays',
      'Include device dimensions/scale references for context',
    ],
    tags: ['medtech', 'medical-device', 'surgical', 'diagnostic', 'fda'],
  },

  // ═══════════════════════════════════════
  // FINANCE & FINTECH
  // ═══════════════════════════════════════
  {
    id: 'finance-banking',
    name: 'Banking & Financial Services',
    industry: 'Finance',
    category: 'finance',
    description: 'Premium, trust-centric booth design for banks, investment firms, and insurance companies. Conveys stability, security, and sophistication.',
    layout: 'island',
    lighting: 'warm-gallery',
    primaryColor: '#1e3a5f',
    accentColor: '#c59b4e',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'front', contentType: 'hero-graphic', title: 'Brand Hero', description: 'Iconic brand mark at scale. Premium positioning statement. Abstract wealth/growth imagery.', colorTreatment: 'Deep navy background with gold accents' },
      { panelId: 'back', contentType: 'brand-story', title: 'Heritage & Trust', description: 'Company timeline or milestones. AUM/client metrics. Regulatory compliance badges.', colorTreatment: 'Navy with gold timeline elements' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Solutions Suite', description: 'Product/service cards for each offering. Clean icons with descriptions. CTA for each vertical.', colorTreatment: 'White panels with navy headers and gold dividers' },
      { panelId: 'right', contentType: 'data-viz', title: 'Market Insights', description: 'Live market ticker or performance dashboard. Thought leadership content highlights. Research preview.', colorTreatment: 'Dark background with financial data styling' },
    ],
    fixtures: [
      { name: 'VIP Lounge Area', position: 'Center-back', icon: 'Armchair' },
      { name: 'Advisor Consultation Desks', position: 'Front sides', icon: 'Users' },
      { name: 'Refreshment Bar', position: 'Back corner', icon: 'Wine' },
    ],
    designTips: [
      'Navy + gold is the universal financial services premium palette',
      'Understated luxury materials (marble texture, brushed metal) convey stability',
      'Semi-private meeting areas are essential for financial sales conversations',
      'Avoid flashy animations — sophistication requires restraint',
    ],
    tags: ['banking', 'finance', 'investment', 'insurance', 'wealth', 'premium'],
  },
  {
    id: 'finance-fintech',
    name: 'FinTech & Payments',
    industry: 'Finance',
    category: 'finance',
    description: 'Modern, tech-forward booth for payment processors, neobanks, and financial technology companies. Balances innovation with financial trust.',
    layout: 'l-shape',
    lighting: 'expo-bright',
    primaryColor: '#4f46e5',
    accentColor: '#10b981',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Platform Hero', description: 'App interface mockup or payment flow visualization. "The future of payments" positioning. Transaction speed/volume metrics.', colorTreatment: 'White-to-indigo gradient with app screenshots' },
      { panelId: 'left', contentType: 'demo-station', title: 'Live Payment Demo', description: 'Interactive payment terminal or app demo. Transaction flow diagram. Integration partner logos.', colorTreatment: 'Clean white with indigo interactive elements' },
    ],
    fixtures: [
      { name: 'Payment Terminal Demo', position: 'Front-center', icon: 'CreditCard' },
      { name: 'API Integration Kiosk', position: 'Left wall', icon: 'Code' },
    ],
    designTips: [
      'Show the product in action — live transaction demos are the top attractor',
      'Green accents convey money/success without being too literal',
      'Developer-friendly messaging (APIs, SDKs) if targeting technical audience',
      'Mobile-first aesthetics reflect the digital-native product experience',
    ],
    tags: ['fintech', 'payments', 'banking', 'api', 'digital', 'neobank'],
  },

  // ═══════════════════════════════════════
  // CREATIVE & MARKETING
  // ═══════════════════════════════════════
  {
    id: 'creative-agency',
    name: 'Creative Agency',
    industry: 'Creative & Design',
    category: 'creative',
    description: 'Bold, portfolio-driven booth for creative agencies, design studios, and marketing firms. Showcases creative work as the primary attraction.',
    layout: 'l-shape',
    lighting: 'warm-gallery',
    primaryColor: '#e11d48',
    accentColor: '#fbbf24',
    backgroundStyle: 'photo',
    panelGuides: [
      { panelId: 'back', contentType: 'logo-wall', title: 'Work Portfolio', description: 'Gallery grid of best campaign work. Before/after brand transformations. Award badges. Client logos.', colorTreatment: 'Black gallery wall with spotlit work samples' },
      { panelId: 'left', contentType: 'brand-story', title: 'Agency Identity', description: 'Agency philosophy/manifesto. Team culture photography. "How we work" process diagram.', colorTreatment: 'Bold brand color background with white text' },
    ],
    fixtures: [
      { name: 'Portfolio Touchscreen', position: 'Front-center', icon: 'Palette' },
      { name: 'Creative Lounge', position: 'Corner seating', icon: 'Coffee' },
    ],
    designTips: [
      'Your booth IS your portfolio — the design itself must showcase your creative capabilities',
      'Use unexpected materials, textures, or layouts to stand out',
      'Gallery-style presentation of work with consistent framing elevates perception',
      'Bold color choices demonstrate confidence — don\'t play it safe',
    ],
    tags: ['agency', 'creative', 'design', 'branding', 'portfolio', 'marketing'],
  },
  {
    id: 'creative-media',
    name: 'Media & Entertainment',
    industry: 'Creative & Design',
    category: 'creative',
    description: 'Immersive, content-rich booth for media companies, streaming platforms, and entertainment brands with video walls and experiential elements.',
    layout: 'island',
    lighting: 'showcase-dim',
    primaryColor: '#dc2626',
    accentColor: '#fbbf24',
    backgroundStyle: 'photo',
    panelGuides: [
      { panelId: 'front', contentType: 'video-wall', title: 'Content Showcase', description: 'Video wall with content sizzle reel. Show/film key art at scale. Premiere dates and streaming info.', colorTreatment: 'Full-bleed content imagery' },
      { panelId: 'back', contentType: 'brand-story', title: 'Platform Story', description: 'Subscriber/viewer metrics. Content library highlights. Original content slate.', colorTreatment: 'Dark cinematic background with content thumbnails' },
      { panelId: 'left', contentType: 'demo-station', title: 'Experience Zone', description: 'VR/AR content preview station. Interactive content discovery. Screening area.', colorTreatment: 'Dark immersive environment with accent lighting' },
      { panelId: 'right', contentType: 'schedule', title: 'Event Schedule', description: 'Screening times. Panel/talk schedule. Meet & greet info. Photo opportunity.', colorTreatment: 'Dark background with highlight schedule cards' },
    ],
    fixtures: [
      { name: 'Video Wall Array', position: 'Front wall', icon: 'Tv' },
      { name: 'VR Experience Pods', position: 'Left wing', icon: 'Glasses' },
      { name: 'Photo Op Backdrop', position: 'Right wing', icon: 'Camera' },
      { name: 'Merchandise Display', position: 'Front counter', icon: 'ShoppingBag' },
    ],
    designTips: [
      'Content IS the booth — maximize screen real estate for video playback',
      'Dark environments with dramatic lighting create theatrical atmosphere',
      'Photo opportunities drive social media amplification',
      'Sound management is critical — use directional speakers to contain audio',
    ],
    tags: ['media', 'entertainment', 'streaming', 'content', 'video', 'immersive'],
  },

  // ═══════════════════════════════════════
  // INDUSTRIAL & MANUFACTURING
  // ═══════════════════════════════════════
  {
    id: 'industrial-manufacturing',
    name: 'Industrial Manufacturing',
    industry: 'Industrial',
    category: 'industrial',
    description: 'Robust, product-centric booth for manufacturing, industrial equipment, and B2B industrial companies. Emphasizes engineering precision and durability.',
    layout: 'u-shape',
    lighting: 'expo-bright',
    primaryColor: '#ea580c',
    accentColor: '#475569',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Brand & Capability', description: 'Hero product photography of flagship equipment. Company name with "Engineering Excellence" positioning. Founded date.', colorTreatment: 'Industrial grey background with orange brand accents' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Product Line', description: 'Product catalog grid with specifications. Cross-section/cutaway diagrams. Material and tolerance specifications.', colorTreatment: 'White technical drawing style with spec callouts' },
      { panelId: 'right', contentType: 'testimonials', title: 'Applications & Case Studies', description: 'Installation photography in real-world environments. Output/efficiency metrics. Customer facility logos.', colorTreatment: 'Photo-forward with data overlay cards' },
    ],
    fixtures: [
      { name: 'Product Display Platform', position: 'Front-center', icon: 'Cog' },
      { name: 'Spec Sheet Rack', position: 'Right counter', icon: 'FileText' },
      { name: 'Sample Materials Display', position: 'Left table', icon: 'Layers' },
    ],
    designTips: [
      'Physical product display is essential — ship a demo unit if possible',
      'Engineering drawings and technical diagrams resonate with this audience',
      'Orange/safety colors are industry standard and highly recognizable',
      'Include QR codes linking to detailed spec sheets and CAD downloads',
    ],
    tags: ['industrial', 'manufacturing', 'engineering', 'equipment', 'b2b'],
  },
  {
    id: 'industrial-energy',
    name: 'Energy & Sustainability',
    industry: 'Industrial',
    category: 'industrial',
    description: 'Forward-thinking booth for energy companies, renewables, and sustainability-focused businesses. Balances industrial credibility with green innovation.',
    layout: 'island',
    lighting: 'cool-neutral',
    primaryColor: '#16a34a',
    accentColor: '#0284c7',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'front', contentType: 'hero-graphic', title: 'Sustainability Hero', description: 'Renewable energy installation photography. Carbon reduction metrics. ESG commitment statement.', colorTreatment: 'Nature photography with green gradient overlay' },
      { panelId: 'back', contentType: 'data-viz', title: 'Impact Dashboard', description: 'CO2 reduction metrics. Energy output data. ESG scorecard. UN SDG alignment badges.', colorTreatment: 'Dark background with green data visualization' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Solutions Portfolio', description: 'Product/service overview by energy type. Technical specifications. ROI calculator results.', colorTreatment: 'Clean white with green section headers' },
      { panelId: 'right', contentType: 'brand-story', title: 'Vision & Impact', description: 'Company sustainability journey timeline. Community impact stories. Future innovation roadmap.', colorTreatment: 'Nature-inspired background with timeline overlay' },
    ],
    fixtures: [
      { name: 'Solar Panel Display', position: 'Front-left', icon: 'Sun' },
      { name: 'Impact Calculator Kiosk', position: 'Front-right', icon: 'Calculator' },
      { name: 'Sustainable Materials Table', position: 'Center', icon: 'Leaf' },
    ],
    designTips: [
      'Use sustainable/recycled booth materials as a brand statement',
      'Real impact metrics (tons CO2 saved) are more compelling than general claims',
      'Avoid greenwashing — back every claim with verifiable data',
      'Nature photography should be authentic, not stock — show real installations',
    ],
    tags: ['energy', 'sustainability', 'renewable', 'solar', 'esg', 'green'],
  },

  // ═══════════════════════════════════════
  // RETAIL & CONSUMER
  // ═══════════════════════════════════════
  {
    id: 'retail-cpg',
    name: 'Consumer Packaged Goods',
    industry: 'Retail & Consumer',
    category: 'retail',
    description: 'Vibrant, product-forward booth for CPG brands at trade shows like NRF, Expo West, and CAGNY. Emphasizes packaging, shelf presence, and sampling.',
    layout: 'u-shape',
    lighting: 'expo-bright',
    primaryColor: '#f97316',
    accentColor: '#a855f7',
    backgroundStyle: 'photo',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Brand Hero Wall', description: 'Lifestyle photography with product in context. Brand tagline. "New" callout for latest SKUs.', colorTreatment: 'Full-bleed lifestyle photography with logo overlay' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Product Line', description: 'Full product line display. Flavor/variant matrix. Nutritional highlights. Award badges.', colorTreatment: 'White shelving aesthetic with product photography' },
      { panelId: 'right', contentType: 'testimonials', title: 'Social Proof', description: 'Instagram/TikTok content wall. Influencer partnerships. Consumer reviews. Retail partner logos.', colorTreatment: 'Social media grid aesthetic with brand colors' },
    ],
    fixtures: [
      { name: 'Sampling Station', position: 'Front-center', icon: 'Gift' },
      { name: 'Product Shelf Display', position: 'Left wall', icon: 'ShoppingCart' },
      { name: 'Photo Booth Backdrop', position: 'Right wing', icon: 'Camera' },
    ],
    designTips: [
      'Sampling drives traffic — design the flow to funnel visitors past product displays',
      'Product packaging should be visible from 30ft — use oversized hero imagery',
      'Social media integration (hashtag, photo op) extends reach beyond the floor',
      'Vibrant colors and lifestyle imagery outperform corporate aesthetics for CPG',
    ],
    tags: ['cpg', 'consumer', 'retail', 'food', 'beverage', 'sampling'],
  },
  {
    id: 'retail-fashion',
    name: 'Fashion & Luxury',
    industry: 'Retail & Consumer',
    category: 'retail',
    description: 'Elevated, editorial booth for fashion brands, luxury goods, and premium lifestyle companies. Minimal design that lets products speak.',
    layout: 'l-shape',
    lighting: 'warm-gallery',
    primaryColor: '#1c1917',
    accentColor: '#d4af37',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Brand Editorial', description: 'Campaign photography. Season/collection name. Minimal text — let imagery dominate. Brand mark.', colorTreatment: 'Full-bleed editorial photography' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Collection Display', description: 'Product hero shots. Material swatches. Craftsmanship detail photography. Price positioning.', colorTreatment: 'White/cream gallery backdrop' },
    ],
    fixtures: [
      { name: 'Product Vitrine', position: 'Center pedestal', icon: 'Diamond' },
      { name: 'Fitting/Try-on Area', position: 'Left wing', icon: 'Shirt' },
    ],
    designTips: [
      'Less is more — luxury is communicated through restraint and white space',
      'Gallery-quality lighting on products is non-negotiable',
      'Materials matter: real wood, marble, or brushed metal fixtures',
      'Minimal text, maximum imagery — the product IS the message',
    ],
    tags: ['fashion', 'luxury', 'premium', 'editorial', 'lifestyle'],
  },

  // ═══════════════════════════════════════
  // EDUCATION
  // ═══════════════════════════════════════
  {
    id: 'edu-university',
    name: 'Higher Education',
    industry: 'Education',
    category: 'education',
    description: 'Welcoming, informative booth for universities, colleges, and educational institutions at recruitment fairs and education conferences.',
    layout: 'inline',
    lighting: 'expo-bright',
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    backgroundStyle: 'photo',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Campus Hero', description: 'Iconic campus photography. University name and crest. "Shaping Tomorrow\'s Leaders" positioning. Key stats (enrollment, ranking).', colorTreatment: 'Campus photography with brand color gradient overlay' },
    ],
    fixtures: [
      { name: 'Info Counter', position: 'Front-center', icon: 'GraduationCap' },
      { name: 'Prospectus Display', position: 'Counter sides', icon: 'BookOpen' },
    ],
    designTips: [
      'Campus photography creates emotional connection — use your best shots',
      'Student testimonial videos on loop drive engagement',
      'QR codes to virtual tours and application portals are essential',
      'Scholarship information should be prominently displayed',
    ],
    tags: ['education', 'university', 'college', 'recruitment', 'academic'],
  },
  {
    id: 'edu-edtech',
    name: 'EdTech Platform',
    industry: 'Education',
    category: 'education',
    description: 'Modern, interactive booth for educational technology companies showcasing learning platforms, LMS systems, and digital learning tools.',
    layout: 'u-shape',
    lighting: 'expo-bright',
    primaryColor: '#2563eb',
    accentColor: '#f472b6',
    backgroundStyle: 'gradient',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Platform Hero', description: 'Platform UI showcase on devices. "Reimagining Education" tagline. Key metrics (users, courses, outcomes).', colorTreatment: 'Bright blue gradient with device mockups' },
      { panelId: 'left', contentType: 'demo-station', title: 'Interactive Demo', description: 'Live platform walkthrough stations. Student/teacher view toggle. Content creation demo.', colorTreatment: 'Light background with interactive elements' },
      { panelId: 'right', contentType: 'data-viz', title: 'Learning Outcomes', description: 'Student outcome improvement data. Engagement metrics. District/institution adoption map.', colorTreatment: 'White background with colorful data charts' },
    ],
    fixtures: [
      { name: 'Student Demo iPads (x4)', position: 'Counter', icon: 'Tablet' },
      { name: 'Teacher Training Area', position: 'Left wing', icon: 'Users' },
    ],
    designTips: [
      'Interactive demos are essential — let visitors experience the platform firsthand',
      'Use bright, welcoming colors — avoid corporate coldness',
      'Outcome data (test scores, engagement) builds credibility with administrators',
      'Include a "teacher view" and "student view" to demo both sides',
    ],
    tags: ['edtech', 'lms', 'e-learning', 'platform', 'digital-learning'],
  },

  // ═══════════════════════════════════════
  // HOSPITALITY & EVENTS
  // ═══════════════════════════════════════
  {
    id: 'hospitality-hotel',
    name: 'Hotel & Resort',
    industry: 'Hospitality',
    category: 'hospitality',
    description: 'Aspirational, destination-focused booth for hotels, resorts, and hospitality brands. Designed to transport visitors and inspire bookings.',
    layout: 'l-shape',
    lighting: 'warm-gallery',
    primaryColor: '#92400e',
    accentColor: '#0d9488',
    backgroundStyle: 'photo',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Destination Hero', description: 'Stunning property photography. "Experience [Brand]" tagline. Star/diamond rating. Location markers.', colorTreatment: 'Full-bleed destination photography' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Property Portfolio', description: 'Property cards with key amenities. Room category previews. Meeting/event space highlights.', colorTreatment: 'Warm neutral background with property photography cards' },
    ],
    fixtures: [
      { name: 'VR Property Tour', position: 'Front-center', icon: 'Glasses' },
      { name: 'Concierge Desk', position: 'Counter', icon: 'BellRing' },
    ],
    designTips: [
      'Transportation is the goal — visitors should feel like they\'re at the property',
      'Oversized destination photography creates emotional pull',
      'VR tours of properties are a powerful engagement tool',
      'Warm lighting and premium textures mirror the hospitality experience',
    ],
    tags: ['hotel', 'resort', 'hospitality', 'travel', 'destination', 'luxury'],
  },

  // ═══════════════════════════════════════
  // GOVERNMENT & DEFENSE
  // ═══════════════════════════════════════
  {
    id: 'gov-defense',
    name: 'Government & Defense',
    industry: 'Government',
    category: 'government',
    description: 'Professional, mission-focused booth for defense contractors, government agencies, and public sector organizations. Conveys capability and reliability.',
    layout: 'u-shape',
    lighting: 'cool-neutral',
    primaryColor: '#1e3a5f',
    accentColor: '#dc2626',
    backgroundStyle: 'solid',
    panelGuides: [
      { panelId: 'back', contentType: 'hero-graphic', title: 'Mission Hero', description: 'Organization mark/seal. Mission statement. Contract vehicle badges (GSA, SEWP, etc.). "Serving the Mission" tagline.', colorTreatment: 'Deep navy with white text and red accents' },
      { panelId: 'left', contentType: 'product-showcase', title: 'Capabilities', description: 'Service/capability matrix. Past performance highlights. Technical domain expertise areas.', colorTreatment: 'Navy background with white capability cards' },
      { panelId: 'right', contentType: 'testimonials', title: 'Contract Success', description: 'Agency client logos. Contract award highlights. Clearance level indicators. CMMC certification.', colorTreatment: 'White background with navy/red accents' },
    ],
    fixtures: [
      { name: 'Classified Meeting Room', position: 'Behind back wall', icon: 'Shield' },
      { name: 'Business Card Drop', position: 'Counter', icon: 'Mail' },
    ],
    designTips: [
      'Red, white, and blue palette is expected and appropriate for this sector',
      'Contract vehicle logos (GSA Schedule, etc.) are crucial trust signals',
      'Semi-private meeting space is essential for sensitive discussions',
      'Avoid flashy design — professional restraint is valued in this sector',
    ],
    tags: ['government', 'defense', 'federal', 'contractor', 'public-sector'],
  },
];

export const PRESET_CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'All Presets', icon: 'Grid' },
  { value: 'technology', label: 'Technology', icon: 'Cpu' },
  { value: 'healthcare', label: 'Healthcare', icon: 'Heart' },
  { value: 'finance', label: 'Finance', icon: 'Landmark' },
  { value: 'creative', label: 'Creative', icon: 'Palette' },
  { value: 'industrial', label: 'Industrial', icon: 'Factory' },
  { value: 'retail', label: 'Retail', icon: 'ShoppingBag' },
  { value: 'education', label: 'Education', icon: 'GraduationCap' },
  { value: 'hospitality', label: 'Hospitality', icon: 'Hotel' },
  { value: 'government', label: 'Government', icon: 'Building' },
];
