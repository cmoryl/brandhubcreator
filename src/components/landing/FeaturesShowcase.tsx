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
  Ticket
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
    title: 'Event Brand Kits',
    description: 'Create comprehensive event brand guidelines with schedules, signage specs, and sponsor tiers.',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: MapPin,
    title: 'Venue & Signage',
    description: 'Document signage dimensions, placement guidelines, and wayfinding specifications.',
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    icon: Ticket,
    title: 'Digital Banners',
    description: 'Manage email headers, social media banners, and web assets with size presets.',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
];

const analyticsFeatures: Feature[] = [
  {
    icon: BarChart3,
    title: 'Brand Health Scores',
    description: 'Track completeness and consistency metrics across all your brand guides.',
    gradient: 'from-accent/20 to-primary/20',
  },
  {
    icon: TrendingUp,
    title: 'Competitive Intelligence',
    description: 'AI personality matrix, score gauges, and strategic reports with PDF export.',
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    icon: Brain,
    title: 'Brand Intelligence',
    description: 'AI-powered knowledge base with learning, confidence tracking, and recommendations.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: FileSearch,
    title: 'Comprehensive Audit Logs',
    description: 'Full change tracking with session data, diffs, and infographic-style visualization.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
];

const adminFeatures: Feature[] = [
  {
    icon: Users,
    title: 'User Management',
    description: 'Approve users, manage roles, invite via email with expiring tokens.',
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: FolderCheck,
    title: 'Bulk Repair Tools',
    description: 'Normalize sections, fix hidden content, and ensure platform-wide consistency.',
    gradient: 'from-sky-500/20 to-teal-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Row Level Security, email masking, leaked password protection, and audit compliance.',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    icon: Zap,
    title: 'Bulk Intelligence',
    description: 'Generate AI analysis, patterns, and gradients for all brands in one operation.',
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
        <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Icon className="h-6 w-6 text-accent" />
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
            <Zap className="h-3 w-3" />
            Powerful Features
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Everything you need for
            <span className="block text-accent">brand consistency</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From color systems to AI-powered analytics, BrandHub provides all the tools 
            to create, manage, and scale your brand guidelines.
          </p>
        </div>

        {/* Category Tabs */}
        <div className={`${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <Tabs defaultValue="core" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
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

        {/* Stats Row */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '600ms' }}>
          {[
            { value: '25+', label: 'Sections Available' },
            { value: '50+', label: 'Icon Sets' },
            { value: '∞', label: 'Color Formats' },
            { value: '100%', label: 'Customizable' },
          ].map((stat, index) => (
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
