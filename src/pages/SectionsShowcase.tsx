import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { 
  Palette, 
  Type, 
  Image, 
  Layers, 
  Sparkles,
  Grid3X3,
  Share2,
  FileText,
  Award,
  BookOpen,
  FileImage,
  Smartphone,
  Link2,
  QrCode,
  MessageSquare,
  Heart,
  ImageIcon,
  FolderOpen,
  Camera,
  Shapes,
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Brain,
  Shield,
  Database,
  Settings,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedHero } from '@/components/sections-showcase/AnimatedHero';
import { CategoryNav } from '@/components/sections-showcase/CategoryNav';
import { SectionCard } from '@/components/sections-showcase/SectionCard';
import { StatsCounter } from '@/components/sections-showcase/StatsCounter';
import { FeatureExplorer } from '@/components/sections-showcase/FeatureExplorer';
import { ScrollProgress } from '@/components/sections-showcase/ScrollProgress';

interface SectionFeature {
  icon: React.ElementType;
  title: string;
  description: string;
  capabilities: string[];
  gradient: string;
  category: 'core' | 'visual' | 'content' | 'advanced' | 'admin';
}

const sections: SectionFeature[] = [
  // Core Identity
  {
    icon: Palette,
    title: 'Color Palette',
    description: 'Define and manage your brand colors with comprehensive format support.',
    capabilities: ['HEX, RGB, CMYK, HSV formats', 'Pantone matching', 'Export to CSV, JSON, Adobe ASE', 'Primary & secondary palettes'],
    gradient: 'from-pink-500/20 via-rose-500/20 to-red-500/20',
    category: 'core',
  },
  {
    icon: Type,
    title: 'Typography',
    description: 'Document font families, weights, and usage guidelines.',
    capabilities: ['Google Fonts integration', 'Live font previews', 'Weight & style documentation', 'Pairing recommendations'],
    gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
    category: 'core',
  },
  {
    icon: Image,
    title: 'Logo Suite',
    description: 'Upload and organize multiple logo variations with usage rules.',
    capabilities: ['Multiple variations', 'Clear space guidelines', 'Do\'s and don\'ts', 'SVG, PNG support'],
    gradient: 'from-purple-500/20 via-violet-500/20 to-indigo-500/20',
    category: 'core',
  },
  {
    icon: BookOpen,
    title: 'Brand Story',
    description: 'Capture your brand narrative, mission, and values.',
    capabilities: ['Mission statement', 'Vision & values', 'Brand personality', 'Voice & tone guidelines'],
    gradient: 'from-amber-500/20 via-orange-500/20 to-yellow-500/20',
    category: 'core',
  },
  
  // Visual Assets
  {
    icon: Sparkles,
    title: 'Gradients',
    description: 'Create and manage branded gradient combinations.',
    capabilities: ['Linear & radial gradients', 'AI-generated options', 'CSS export', 'Color stop control'],
    gradient: 'from-fuchsia-500/20 via-pink-500/20 to-rose-500/20',
    category: 'visual',
  },
  {
    icon: Grid3X3,
    title: 'Patterns',
    description: 'Geometric and custom patterns for brand materials.',
    capabilities: ['AI pattern generation', 'Tile adjustments', '4K PNG export', 'Multiple styles'],
    gradient: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
    category: 'visual',
  },
  {
    icon: Shapes,
    title: 'Design Elements',
    description: 'Manage shapes, icons, and graphic elements.',
    capabilities: ['Shape library', 'SVG support', 'AI generation', 'Custom uploads'],
    gradient: 'from-sky-500/20 via-blue-500/20 to-indigo-500/20',
    category: 'visual',
  },
  {
    icon: ImageIcon,
    title: 'Photography',
    description: 'Define photography style and image guidelines.',
    capabilities: ['Style guidelines', 'Mood boards', 'Do\'s and don\'ts', 'Sample imagery'],
    gradient: 'from-slate-500/20 via-gray-500/20 to-zinc-500/20',
    category: 'visual',
  },
  {
    icon: Camera,
    title: 'Imagery Library',
    description: 'Centralized asset management for brand images.',
    capabilities: ['Batch uploads', 'Category organization', 'Search & filter', 'Usage tracking'],
    gradient: 'from-rose-500/20 via-pink-500/20 to-fuchsia-500/20',
    category: 'visual',
  },
  
  // Content & Templates
  {
    icon: Share2,
    title: 'Social Assets',
    description: 'Platform-specific templates and size presets.',
    capabilities: ['Platform presets', 'Live mockups', 'Banner templates', 'Profile assets'],
    gradient: 'from-cyan-500/20 via-teal-500/20 to-emerald-500/20',
    category: 'content',
  },
  {
    icon: FileText,
    title: 'Presentation Templates',
    description: 'Upload and preview branded presentation decks.',
    capabilities: ['PPTX/PDF support', 'Office Online preview', 'Fullscreen mode', 'Category sorting'],
    gradient: 'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
    category: 'content',
  },
  {
    icon: FileImage,
    title: 'Brochures & Documents',
    description: 'Manage branded document templates and collateral.',
    capabilities: ['Multi-page previews', 'Download tracking', 'Version control', 'Category organization'],
    gradient: 'from-indigo-500/20 via-violet-500/20 to-purple-500/20',
    category: 'content',
  },
  {
    icon: Smartphone,
    title: 'Email Templates',
    description: 'Branded email header and signature templates.',
    capabilities: ['Header designs', 'Signature blocks', 'HTML export', 'Mobile-responsive'],
    gradient: 'from-teal-500/20 via-cyan-500/20 to-sky-500/20',
    category: 'content',
  },
  {
    icon: Award,
    title: 'Awards & Recognition',
    description: 'Showcase industry awards and certifications.',
    capabilities: ['Award gallery', 'Certification badges', 'Year sorting', 'Image fallbacks'],
    gradient: 'from-yellow-500/20 via-amber-500/20 to-orange-500/20',
    category: 'content',
  },
  
  // Advanced Features
  {
    icon: Layers,
    title: 'Product Guides',
    description: 'Link sub-brands and create hierarchical brand ecosystems.',
    capabilities: ['Hierarchical linking', 'Drag-drop reordering', 'Cross-guide navigation', 'Suite management'],
    gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20',
    category: 'advanced',
  },
  {
    icon: Link2,
    title: 'Quick Links',
    description: 'Add external resources and important brand links.',
    capabilities: ['Custom URLs', 'Icon selection', 'Category grouping', 'Click tracking'],
    gradient: 'from-blue-500/20 via-indigo-500/20 to-violet-500/20',
    category: 'advanced',
  },
  {
    icon: QrCode,
    title: 'QR Codes',
    description: 'Generate branded QR codes for marketing materials.',
    capabilities: ['Custom styling', 'Logo embedding', 'Multiple formats', 'Scan tracking'],
    gradient: 'from-gray-500/20 via-slate-500/20 to-zinc-500/20',
    category: 'advanced',
  },
  {
    icon: MessageSquare,
    title: 'Brand Voice',
    description: 'Document communication style and messaging guidelines.',
    capabilities: ['Tone guidelines', 'Example copy', 'Do\'s and don\'ts', 'Channel-specific'],
    gradient: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
    category: 'advanced',
  },
  {
    icon: Heart,
    title: 'Icon Libraries',
    description: 'Organize and manage custom icon sets.',
    capabilities: ['SVG management', 'Category organization', 'Search & filter', 'Batch operations'],
    gradient: 'from-red-500/20 via-rose-500/20 to-pink-500/20',
    category: 'advanced',
  },
  {
    icon: FolderOpen,
    title: 'Case Studies',
    description: 'Showcase brand applications and success stories.',
    capabilities: ['Rich media support', 'Gallery layouts', 'Project details', 'Results metrics'],
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    category: 'advanced',
  },
  
  // Admin & Management
  {
    icon: LayoutDashboard,
    title: 'Admin Dashboard',
    description: 'Centralized platform health monitoring and quick actions.',
    capabilities: ['Real-time stats', 'Activity feed', 'Module health status', 'Quick actions'],
    gradient: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20',
    category: 'admin',
  },
  {
    icon: Users,
    title: 'User Management',
    description: 'Manage team members, roles, and access permissions.',
    capabilities: ['Role-based access', 'Invite workflows', 'Approval queue', 'Activity tracking'],
    gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20',
    category: 'admin',
  },
  {
    icon: Building2,
    title: 'Organization Settings',
    description: 'Configure organization branding and preferences.',
    capabilities: ['Custom branding', 'Portal settings', 'Domain management', 'Feature toggles'],
    gradient: 'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
    category: 'admin',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track engagement, views, and content performance.',
    capabilities: ['Page view trends', 'User activity', 'Content metrics', 'Export reports'],
    gradient: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/20',
    category: 'admin',
  },
  {
    icon: Brain,
    title: 'AI-Powered Reports',
    description: 'Automated brand audits and competitive intelligence.',
    capabilities: ['Brand health scores', 'Market analysis', 'Growth recommendations', 'Competitor tracking'],
    gradient: 'from-purple-500/20 via-fuchsia-500/20 to-pink-500/20',
    category: 'admin',
  },
  {
    icon: Shield,
    title: 'Audit Logs',
    description: 'Complete history of all platform activities and changes.',
    capabilities: ['Action tracking', 'User attribution', 'Filtering & search', 'Export history'],
    gradient: 'from-slate-500/20 via-gray-500/20 to-zinc-500/20',
    category: 'admin',
  },
  {
    icon: Database,
    title: 'Backup Management',
    description: 'Automated backups and disaster recovery options.',
    capabilities: ['Scheduled backups', 'One-click restore', 'Version history', 'Export options'],
    gradient: 'from-teal-500/20 via-cyan-500/20 to-sky-500/20',
    category: 'admin',
  },
  {
    icon: Settings,
    title: 'Platform Settings',
    description: 'Global configuration and system preferences.',
    capabilities: ['Email templates', 'Notification settings', 'API configuration', 'Feature flags'],
    gradient: 'from-gray-500/20 via-slate-500/20 to-zinc-500/20',
    category: 'admin',
  },
];

const categoryLabels = {
  core: { label: 'Core Identity', description: 'Essential brand foundation elements' },
  visual: { label: 'Visual Assets', description: 'Graphics, patterns, and imagery' },
  content: { label: 'Content & Templates', description: 'Documents and marketing materials' },
  advanced: { label: 'Advanced Features', description: 'Extended brand management tools' },
  admin: { label: 'Admin & Management', description: 'Platform administration and analytics' },
};

const stats = [
  { label: 'Brand Sections', value: 27, suffix: '+' },
  { label: 'Export Formats', value: 15, suffix: '+' },
  { label: 'AI Features', value: 8, suffix: '' },
  { label: 'Enterprise Ready', value: 100, suffix: '%' },
];

export default function SectionsShowcase() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  
  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, SectionFeature[]>);

  const categoryInfo = Object.entries(categoryLabels).reduce((acc, [key, info]) => {
    acc[key] = {
      ...info,
      count: groupedSections[key]?.length || 0,
    };
    return acc;
  }, {} as Record<string, { label: string; description: string; count: number }>);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    const element = sectionRefs.current[category];
    if (element) {
      const offset = 140;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      
      <AnimatedHero totalSections={sections.length} />
      
      <StatsCounter stats={stats} />
      
      {/* Interactive Feature Explorer */}
      <FeatureExplorer />
      
      <CategoryNav 
        categories={categoryInfo}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Sections by Category */}
      <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-24">
          {(['core', 'visual', 'content', 'advanced', 'admin'] as const).map((category) => (
            <motion.section 
              key={category}
              ref={(el) => { sectionRefs.current[category] = el; }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-10">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <div className="h-1 w-12 bg-gradient-to-r from-accent to-primary rounded-full" />
                  <span className="text-sm font-medium text-accent uppercase tracking-wider">
                    {categoryLabels[category].label}
                  </span>
                </motion.div>
                <motion.h2 
                  className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {categoryLabels[category].description}
                </motion.h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedSections[category]?.map((section, index) => (
                  <SectionCard 
                    key={section.title} 
                    {...section}
                    index={index}
                  />
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Ready to build your 
              <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                brand guide?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Start creating professional brand guidelines with all these powerful sections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 text-base px-8">
                <Rocket className="h-5 w-5" />
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/demo/brand/brandhub')} className="text-base px-8">
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
