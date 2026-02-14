import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, 
  Type, 
  Image, 
  Share2, 
  Layers, 
  BarChart3, 
  TrendingUp, 
  Users, 
  FolderCheck, 
  FileSearch, 
  ShieldCheck,
  Brain,
  Zap,
  Globe,
  FileText,
  Play,
  ChevronRight,
  Calendar,
  MapPin,
  Ticket,
  Languages,
  Globe2,
  Sparkles,
  Network,
  GitBranch,
  Palette as PaletteIcon,
  MessageSquare,
  ImageIcon,
  Map,
  BookOpen,
  Shield,
  Bot,
  GraduationCap,
  Scale,
  Accessibility,
  Eye,
  ListChecks,
  Fingerprint,
  HeartHandshake,
  AudioLines,
  ScanSearch,
  Blend,
  Volume2,
  DoorOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  badge?: string;
}

const coreFeatures: Feature[] = [
  {
    icon: Palette,
    title: 'Color Systems',
    description: 'Define palettes with HEX, RGB, CMYK, HSV, and Pantone matching. Export to CSV, JSON, or Adobe ASE.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: Type,
    title: 'Typography',
    description: 'Document fonts, weights, and usage. Connect to Google Fonts for live previews.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Image,
    title: 'Logo & Assets',
    description: 'Upload multiple logo variations with usage guidelines. Support for SVG, PNG, and more.',
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
  {
    icon: Layers,
    title: 'Product Suites',
    description: 'Create master products with sub-brands. Build hierarchical ecosystems with linked guides.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Public Portals',
    description: 'Organization portals with custom branding, hero effects, and branded navigation.',
    gradient: 'from-sky-500/20 to-cyan-500/20',
  },
  {
    icon: FileText,
    title: 'Presentation Templates',
    description: 'Upload PPTX/PDF decks with live Office Online previews and fullscreen mode.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
];

// Event-specific features
const eventFeatures: Feature[] = [
  {
    icon: Calendar,
    title: 'Accessible Event Kits',
    description: 'Plan events everyone can enjoy — with guidelines for quiet spaces, safe lighting, and thoughtful layouts built right in.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: 'Universal',
  },
  {
    icon: DoorOpen,
    title: 'Physical Accessibility',
    description: 'Easy-to-follow specs for wide doorways, clear aisles, high-contrast markers, and accessible routes so no one gets left out.',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    icon: Volume2,
    title: 'Clear Communication',
    description: 'Readable hashtags, live captions, roving mics for Q&A, and verbal descriptions of visuals — so everyone stays in the loop.',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
  {
    icon: MapPin,
    title: 'Venue & Signage',
    description: 'Large, readable fonts, high-contrast colors, and clear wayfinding so attendees can navigate any space with confidence.',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: Ticket,
    title: 'Digital Banners',
    description: 'Manage email headers, social banners, and web assets with ready-made size presets — all accessibility-friendly by default.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
];

// GlobalLink & Localization features - EXPANDED
const localizationFeatures: Feature[] = [
  {
    icon: Languages,
    title: 'Instant Translation',
    description: 'Translate your brand content in real-time with smart caching so you don\'t pay to translate the same thing twice.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    badge: 'GlobalLink',
  },
  {
    icon: Globe2,
    title: 'Cultural Insights',
    description: 'AI tells you how ready your brand is for new markets and highlights cultural considerations before you launch.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    badge: 'AI',
  },
  {
    icon: GitBranch,
    title: 'Regional Versions',
    description: 'Set up a global brand, then customize colors, messaging, and imagery for each region or country — changes flow down automatically.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: 'Living Guide',
  },
  {
    icon: Sparkles,
    title: 'Smart Adaptation',
    description: 'AI suggests how to adjust your colors, images, and messaging for different regions so nothing gets lost in translation.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Network,
    title: 'Translation Dashboard',
    description: 'Track all your translation jobs in one place — see progress, word counts, and costs at a glance.',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    icon: Map,
    title: 'Compare Regions',
    description: 'View your brand side-by-side across markets to spot differences and keep things consistent.',
    gradient: 'from-cyan-500/20 to-sky-500/20',
  },
  {
    icon: Shield,
    title: 'Compliance Checker',
    description: 'Automatically scans your brand materials for color, typography, and logo issues so nothing slips through.',
    gradient: 'from-blue-500/20 to-sky-500/20',
    badge: 'DataForce',
  },
  {
    icon: Bot,
    title: 'AI Brand Assistant',
    description: 'Ask questions about your brand guidelines and get instant answers in 50+ languages — like ChatGPT for your brand.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    badge: 'DataForce',
  },
  {
    icon: Users,
    title: 'Real User Feedback',
    description: 'Get feedback from real people in your target markets to validate that your brand resonates locally.',
    gradient: 'from-purple-500/20 to-violet-500/20',
    badge: 'DataForce',
  },
  {
    icon: GraduationCap,
    title: 'Train Your Brand AI',
    description: 'Teach AI your brand\'s unique voice and style, so it creates content that sounds authentically you.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    badge: 'DataForce',
  },
];

// Bias Awareness & Inclusive Architecture features - NEW 2026
const inclusionFeatures: Feature[] = [
  {
    icon: Scale,
    title: 'Bias Scanner',
    description: 'AI checks your content across 5 dimensions — language, visuals, accessibility, governance, and inclusion — and suggests fixes automatically.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: '2026',
  },
  {
    icon: Accessibility,
    title: 'Accessibility Built In',
    description: 'Meets the latest WCAG 2.2 standards including better login options, visible focus states, and a dark mode that\'s easy on the eyes.',
    gradient: 'from-blue-500/20 to-sky-500/20',
    badge: 'AA/AAA',
  },
  {
    icon: Blend,
    title: 'Smart Color Tools',
    description: 'Colors that just work — our system auto-generates palettes with proper contrast so you never have to guess if things are readable.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    badge: 'Color Science',
  },
  {
    icon: ScanSearch,
    title: 'Search Colors by Meaning',
    description: 'Find the right color by describing what you want — in any language. Great for teams working across different cultures and markets.',
    gradient: 'from-emerald-500/20 to-green-500/20',
    badge: 'AI',
  },
  {
    icon: Globe2,
    title: 'Cultural Color Guide',
    description: 'Colors mean different things around the world. Red means luck in Asia but mourning in South Africa. We flag these conflicts for you.',
    gradient: 'from-orange-500/20 to-amber-500/20',
    badge: 'Global',
  },
  {
    icon: AudioLines,
    title: 'Motion Sensitivity',
    description: 'Not everyone loves flashy animations. Built-in controls let users pause, stop, or reduce motion for a comfortable experience.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    badge: 'UX',
  },
  {
    icon: Type,
    title: 'Readable Typography',
    description: 'AI suggests font sizes and line lengths that are easy to read for everyone, with high contrast pairings that look great too.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
    badge: 'Typography',
  },
  {
    icon: Eye,
    title: 'Inclusive Imagery',
    description: 'Automatically flags imagery that relies on stereotypes and suggests authentic, representative alternatives that respect everyone.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    icon: ListChecks,
    title: 'Creative Audit Checklist',
    description: 'A 12-step review process that checks your creative work for attention, impact, and inclusivity — proven to boost engagement.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    badge: 'WFA',
  },
  {
    icon: Fingerprint,
    title: '"Who Else?" Framework',
    description: 'Design for underserved users first, and you\'ll build features that work better for everyone. Inspired by Google\'s inclusion playbook.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    badge: 'Inclusion',
  },
  {
    icon: HeartHandshake,
    title: 'Persona Spectrum',
    description: 'Think beyond permanent disabilities — consider temporary (broken arm) and situational (holding a baby) needs in your designs.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    badge: 'Design',
  },
  {
    icon: Brain,
    title: 'AI Governance',
    description: 'Automated fairness checks, sentiment analysis on your color choices, and a learning system that gets smarter from your team\'s feedback.',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    badge: 'AI',
  },
];

const analyticsFeatures: Feature[] = [
  {
    icon: BarChart3,
    title: 'Brand Health Scores',
    description: 'See how complete and consistent your brand is at a glance, with scores across 35+ sections and 8 categories.',
    gradient: 'from-accent/20 to-primary/20',
  },
  {
    icon: TrendingUp,
    title: 'Competitive Reports',
    description: 'See how you stack up against competitors with AI-generated reports, visual charts, and exportable PDFs.',
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    icon: Brain,
    title: 'Brand Intelligence',
    description: 'An AI brain that learns your brand over time, getting smarter with every update and offering better insights as it grows.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    badge: 'Oracle Brain',
  },
  {
    icon: FileSearch,
    title: 'Change History',
    description: 'See exactly who changed what and when — with full before/after comparisons and visual timelines.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    icon: Scale,
    title: 'Inclusion Reports',
    description: 'Downloadable reports showing how inclusive your brand is, with actionable recommendations for improvement.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: 'NEW',
  },
];

const adminFeatures: Feature[] = [
  {
    icon: Users,
    title: 'Team Management',
    description: 'Invite teammates, set roles, approve new users — all with simple email invites and a clean dashboard.',
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: FolderCheck,
    title: 'Bulk Cleanup',
    description: 'Fix inconsistencies across all your brands at once — normalize sections, unhide content, and keep everything tidy.',
    gradient: 'from-sky-500/20 to-teal-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Your data stays safe with encryption, audit trails, password protection, and strict access controls.',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    icon: Zap,
    title: 'Bulk AI Actions',
    description: 'Run AI analysis, generate patterns, and scan for issues across all your brands in a single click.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
];

function FeatureCard({ feature, index, isVisible }: { feature: Feature; index: number; isVisible: boolean }) {
  const Icon = feature.icon;
  
  return (
    <Card 
      className={`group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
        isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-accent/10 rounded-xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Icon className="h-6 w-6 text-accent" />
          </div>
          {feature.badge && (
            <Badge variant="secondary" className="text-xs">
              {feature.badge}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </CardContent>
    </Card>
  );
}

function FeatureCarousel({ features, isVisible }: { features: Feature[]; isVisible: boolean }) {
  return (
    <Carousel opts={{ align: 'start', loop: true }} className="w-full">
      <CarouselContent className="-ml-2">
        {features.map((feature, index) => (
          <CarouselItem key={feature.title} className="pl-2 basis-[85%]">
            <FeatureCard 
              feature={feature} 
              index={index}
              isVisible={isVisible}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

function FeatureGrid({ features, isVisible }: { features: Feature[]; isVisible: boolean }) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <FeatureCarousel features={features} isVisible={isVisible} />;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <FeatureCard 
          key={feature.title} 
          feature={feature} 
          index={index}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

// Living Global Brand Guide Hero Section
function GlobalBrandHero({ isVisible }: { isVisible: boolean }) {
  return (
    <div className={`mb-16 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
      <Card className="relative overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <CardContent className="relative p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-accent text-accent-foreground gap-1.5">
                  <Globe2 className="h-3 w-3" />
                  Living Global Brand Guide
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  NEW
                </Badge>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                One Brand.
                <span className="block text-accent">Every Market.</span>
              </h3>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Create adaptive brand guidelines that evolve across regions while maintaining global consistency. 
                Our tiered hierarchy system (Global → Region → Country) ensures your brand speaks authentically 
                to every market.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                    <PaletteIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Color Sensitivity</p>
                    <p className="text-xs text-muted-foreground">Regional color adaptations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Messaging Localization</p>
                    <p className="text-xs text-muted-foreground">Cultural tone adjustments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                    <ImageIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Imagery Guidelines</p>
                    <p className="text-xs text-muted-foreground">Market-specific visuals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                    <BookOpen className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Content Inheritance</p>
                    <p className="text-xs text-muted-foreground">Smart section overrides</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right: Visual Hierarchy */}
            <div className="relative">
              <div className="space-y-3">
                {/* Global tier */}
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-5 w-5 text-accent" />
                    <span className="font-semibold text-accent">Global Master</span>
                    <Badge variant="outline" className="text-xs ml-auto">Base</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Core brand DNA, colors, typography, values</p>
                </div>
                
                {/* Region tier */}
                <div className="ml-6 space-y-2">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">EMEA Region</span>
                      <Badge variant="secondary" className="text-xs ml-auto">Override</Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium">APAC Region</span>
                      <Badge variant="secondary" className="text-xs ml-auto">Override</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Country tier */}
                <div className="ml-12 space-y-2">
                  <div className="p-2 rounded-md bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇩🇪</span>
                      <span className="text-xs font-medium">Germany</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇯🇵</span>
                      <span className="text-xs font-medium">Japan</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇧🇷</span>
                      <span className="text-xs font-medium">Brazil</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Connecting lines decoration */}
              <div className="absolute left-3 top-16 w-px h-32 bg-gradient-to-b from-accent/50 to-transparent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FeaturesShowcase() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <Badge variant="secondary" className="mb-4 gap-1">
            <Scale className="h-3 w-3" />
            Inclusive Architecture
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Built for everyone.
            <span className="block text-accent">Powered by AI.</span>
          </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Smart color tools, cultural awareness, accessible typography, and 16 AI modules 
            that help your brand connect with every audience — no expertise required.
          </p>
        </div>

        {/* Living Global Brand Guide Hero */}
        <GlobalBrandHero isVisible={isVisible} />

        {/* Category Tabs */}
        <div className={`${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <Tabs defaultValue="inclusion" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-4xl grid-cols-6 h-12">
                <TabsTrigger value="inclusion" className="gap-2 text-sm" aria-label="Inclusion & Bias features">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Inclusion</span>
                </TabsTrigger>
                <TabsTrigger value="localization" className="gap-2 text-sm" aria-label="Localization features">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">Global</span>
                </TabsTrigger>
                <TabsTrigger value="core" className="gap-2 text-sm" aria-label="Core features">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Core</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 text-sm" aria-label="Event features">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 text-sm" aria-label="AI and analytics features">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2 text-sm" aria-label="Admin features">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="inclusion" className="mb-12 mt-0">
              <FeatureGrid features={inclusionFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="localization" className="mb-12 mt-0">
              <FeatureGrid features={localizationFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="core" className="mb-12 mt-0">
              <FeatureGrid features={coreFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="events" className="mb-12 mt-0">
              <FeatureGrid features={eventFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="analytics" className="mb-12 mt-0">
              <FeatureGrid features={analyticsFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="admin" className="mb-12 mt-0">
              <FeatureGrid features={adminFeatures} isVisible={isVisible} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Row - Updated with inclusion stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
          {[
            { value: '16', label: 'AI Modules' },
            { value: 'Smart', label: 'Color Science' },
            { value: '50+', label: 'Languages Supported' },
            { value: '7', label: 'Quality Dimensions' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="text-3xl font-bold text-accent mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '800ms' }}>
          <Button 
            size="lg" 
            onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Demo Request'}
            className="gap-2 group"
          >
            <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Request a Demo
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
