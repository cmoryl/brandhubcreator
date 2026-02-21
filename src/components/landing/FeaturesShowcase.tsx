import { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Type, 
  Image, 
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
import { GetStartedSurveyModal } from './GetStartedSurveyModal';

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
    title: 'Pick Your Colors',
    description: 'Choose your brand colors and we\'ll handle the rest — formats, matching, and export files ready for your designers.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: Type,
    title: 'Set Your Fonts',
    description: 'Pick your fonts and see them in action with live previews. We\'ll generate usage rules automatically.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Image,
    title: 'Organize Your Logos',
    description: 'Upload every logo variation you have. We\'ll set up clear-space rules and usage dos & don\'ts for you.',
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
  {
    icon: Layers,
    title: 'Build Product Lines',
    description: 'Group products under your main brand. Each product gets its own guide that stays connected to the parent.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Share Publicly',
    description: 'Give your brand a beautiful public portal with your own branding, colors, and navigation.',
    gradient: 'from-sky-500/20 to-cyan-500/20',
  },
  {
    icon: FileText,
    title: 'Upload Decks & PDFs',
    description: 'Drop in your presentations and brand documents. View them right inside BrandHub — no downloads needed.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
];

// Event-specific features
const eventFeatures: Feature[] = [
  {
    icon: Calendar,
    title: 'Event Brand Kits',
    description: 'Everything your event needs in one place — logos, banners, signage specs, and digital assets ready to go.',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: DoorOpen,
    title: 'Venue Guidelines',
    description: 'Simple specs for signage, layout, and wayfinding so your venues look great and are easy to navigate.',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    icon: Volume2,
    title: 'Digital Assets',
    description: 'Social banners, email headers, and web graphics in every size you need — branded and ready to post.',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
  {
    icon: MapPin,
    title: 'Signage & Wayfinding',
    description: 'Templates for directional signs, stage backdrops, and name badges — all in your brand\'s look and feel.',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: Ticket,
    title: 'Accessibility Built In',
    description: 'Quiet rooms, readable fonts, safe lighting — guidelines that help you plan events everyone can enjoy.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    badge: 'Inclusive',
  },
];

// GlobalLink & Localization features - EXPANDED
const localizationFeatures: Feature[] = [
  {
    icon: Languages,
    title: 'Translate Instantly',
    description: 'Translate your brand content with one click. Smart caching means you never pay to translate the same thing twice.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    badge: 'GlobalLink',
  },
  {
    icon: Globe2,
    title: 'Know Your Markets',
    description: 'AI tells you which markets you\'re ready for and what to watch out for culturally — before you launch.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    badge: 'AI',
  },
  {
    icon: GitBranch,
    title: 'Regional Versions',
    description: 'Start with your global brand, then tweak colors, images, and messaging for each region. Changes flow down automatically.',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: Sparkles,
    title: 'Smart Adaptation',
    description: 'AI suggests how to adjust your brand for different regions — so nothing feels off or gets lost in translation.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: Network,
    title: 'Track Translations',
    description: 'See all your translation jobs, progress, and costs in one simple dashboard.',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    icon: Map,
    title: 'Compare Side by Side',
    description: 'View your brand across different markets to spot differences and keep everything consistent.',
    gradient: 'from-cyan-500/20 to-sky-500/20',
  },
  {
    icon: Shield,
    title: 'Auto Quality Checks',
    description: 'Scans your brand materials for color, font, and logo issues so nothing slips through the cracks.',
    gradient: 'from-blue-500/20 to-sky-500/20',
    badge: 'DataForce',
  },
  {
    icon: Bot,
    title: 'Ask Your Brand AI',
    description: 'Got a question about your brand guidelines? Ask in any language and get instant answers — like having a brand expert on call.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    badge: 'DataForce',
  },
  {
    icon: Users,
    title: 'Get Local Feedback',
    description: 'Get feedback from real people in your target markets to make sure your brand actually resonates.',
    gradient: 'from-purple-500/20 to-violet-500/20',
    badge: 'DataForce',
  },
  {
    icon: GraduationCap,
    title: 'Train Your AI',
    description: 'Teach AI your brand\'s voice and style so it creates content that actually sounds like you.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    badge: 'DataForce',
  },
];

// Bias Awareness & Inclusive Architecture features - NEW 2026
const inclusionFeatures: Feature[] = [
  {
    icon: Scale,
    title: 'Bias Check',
    description: 'AI reviews your content for language, imagery, and cultural blind spots — then suggests simple fixes.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: '2026',
  },
  {
    icon: Accessibility,
    title: 'Accessibility Ready',
    description: 'Your guides automatically meet modern accessibility standards — readable fonts, good contrast, and visible focus states.',
    gradient: 'from-blue-500/20 to-sky-500/20',
    badge: 'WCAG 2.2',
  },
  {
    icon: Blend,
    title: 'Smart Color Contrast',
    description: 'Pick colors and we\'ll tell you if they\'re readable. Auto-generates palettes that look great and pass contrast checks.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    icon: ScanSearch,
    title: 'Find Colors by Feel',
    description: 'Describe the vibe you want — "warm and trustworthy" — and we\'ll suggest colors that match, in any language.',
    gradient: 'from-emerald-500/20 to-green-500/20',
    badge: 'AI',
  },
  {
    icon: Globe2,
    title: 'Cultural Color Alerts',
    description: 'Red means luck in Asia but mourning in South Africa. We\'ll flag these conflicts before they become problems.',
    gradient: 'from-orange-500/20 to-amber-500/20',
    badge: 'Global',
  },
  {
    icon: AudioLines,
    title: 'Motion Controls',
    description: 'Some people get dizzy from animations. Built-in controls let anyone pause or reduce motion for comfort.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: Type,
    title: 'Easy-Read Fonts',
    description: 'AI picks font sizes and spacing that are comfortable to read for everyone — no guesswork needed.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
  {
    icon: Eye,
    title: 'Better Imagery',
    description: 'Flags photos that lean on stereotypes and suggests more authentic, representative alternatives.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    icon: ListChecks,
    title: 'Creative Checklist',
    description: 'A simple 12-step review to make sure your creative work is on-brand, engaging, and inclusive.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    badge: 'WFA',
  },
  {
    icon: Fingerprint,
    title: 'Design for Everyone',
    description: 'Start with underserved users and you\'ll build something that works better for everyone. Simple as that.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: HeartHandshake,
    title: 'Think Beyond Labels',
    description: 'Consider temporary needs (broken arm) and situational ones (holding a baby) — not just permanent disabilities.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    icon: Brain,
    title: 'AI That Learns',
    description: 'Our AI gets smarter from your team\'s feedback — better suggestions, fewer false flags, over time.',
    gradient: 'from-indigo-500/20 to-violet-500/20',
    badge: 'AI',
  },
];

const analyticsFeatures: Feature[] = [
  {
    icon: BarChart3,
    title: 'Brand Health Score',
    description: 'See how complete your brand is at a glance — one score that tells you what\'s done and what needs attention.',
    gradient: 'from-accent/20 to-primary/20',
  },
  {
    icon: TrendingUp,
    title: 'Competitor Reports',
    description: 'See how you compare to competitors with AI-generated reports, charts, and downloadable PDFs.',
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    icon: Brain,
    title: 'Brand Brain',
    description: 'An AI that learns your brand over time — the more you use it, the smarter its suggestions get.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    badge: 'Oracle',
  },
  {
    icon: FileSearch,
    title: 'Change History',
    description: 'See who changed what and when — with before/after comparisons so nothing gets lost.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    icon: Scale,
    title: 'Inclusion Reports',
    description: 'Downloadable reports showing how inclusive your brand is, with clear next steps.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    badge: 'NEW',
  },
];

const adminFeatures: Feature[] = [
  {
    icon: Users,
    title: 'Team & Roles',
    description: 'Invite teammates by email, assign roles, and approve new users — all from one simple dashboard.',
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: FolderCheck,
    title: 'Bulk Fixes',
    description: 'Clean up all your brands at once — fix inconsistencies, unhide sections, and keep everything tidy.',
    gradient: 'from-sky-500/20 to-teal-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Backups',
    description: 'Encryption, audit trails, password protection, and regular backups keep your data safe.',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    icon: Zap,
    title: 'One-Click AI',
    description: 'Run AI analysis across all your brands at once — patterns, issues, and insights in a single click.',
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
                Set up your brand once, then customize it for each region or country. 
                Colors, messaging, and imagery can all be tweaked locally while staying 
                connected to your global brand — so everything stays consistent.
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
  const [isVisible, setIsVisible] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
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
    <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/30 overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 1200px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <Badge variant="secondary" className="mb-4 gap-1">
            <Scale className="h-3 w-3" />
            Everything You Need
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            What can you do
            <span className="block text-accent">with BrandHub?</span>
          </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build brand guides, manage products, plan events, go global — 
            all in one place. Here's a quick look at what's inside.
          </p>
        </div>

        {/* Living Global Brand Guide Hero */}
        <GlobalBrandHero isVisible={isVisible} />

        {/* Category Tabs */}
        <div className={`${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <Tabs defaultValue="core" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-4xl grid-cols-6 h-12">
                <TabsTrigger value="core" className="gap-2 text-sm" aria-label="Core features">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Brand Basics</span>
                </TabsTrigger>
                <TabsTrigger value="localization" className="gap-2 text-sm" aria-label="Localization features">
                  <Languages className="h-4 w-4" />
                  <span className="hidden sm:inline">Go Global</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 text-sm" aria-label="Event features">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 text-sm" aria-label="AI and analytics features">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">AI & Insights</span>
                </TabsTrigger>
                <TabsTrigger value="inclusion" className="gap-2 text-sm" aria-label="Inclusion & Bias features">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Inclusion</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2 text-sm" aria-label="Admin features">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="core" className="mb-12 mt-0">
              <FeatureGrid features={coreFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="localization" className="mb-12 mt-0">
              <FeatureGrid features={localizationFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="events" className="mb-12 mt-0">
              <FeatureGrid features={eventFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="analytics" className="mb-12 mt-0">
              <FeatureGrid features={analyticsFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="inclusion" className="mb-12 mt-0">
              <FeatureGrid features={inclusionFeatures} isVisible={isVisible} />
            </TabsContent>
            <TabsContent value="admin" className="mb-12 mt-0">
              <FeatureGrid features={adminFeatures} isVisible={isVisible} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Row - Updated with inclusion stats */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
          {[
            { value: '40+', label: 'Features' },
            { value: '50+', label: 'Languages' },
            { value: 'AI', label: 'Powered Insights' },
            { value: '∞', label: 'Brands & Products' },
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
            onClick={() => setShowGetStarted(true)}
            className="gap-2 group"
          >
            <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Request a Demo
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <GetStartedSurveyModal open={showGetStarted} onOpenChange={setShowGetStarted} />
        </div>
      </div>
    </section>
  );
}
