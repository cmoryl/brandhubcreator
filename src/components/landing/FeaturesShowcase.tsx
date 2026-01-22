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
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    title: 'Products & Sub-brands',
    description: 'Link product guides to parent brands. Build hierarchical brand ecosystems.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Public Portals',
    description: 'Share brand guides publicly. Organization portals with custom branding.',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    icon: FileText,
    title: 'PDF Export',
    description: 'Export complete brand guides as professional PDFs for offline use.',
    gradient: 'from-indigo-500/20 to-blue-500/20',
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
    title: 'AI Market Intelligence',
    description: 'Get competitor analysis, trend forecasting, and strategic growth recommendations.',
    gradient: 'from-primary/20 to-accent/20',
  },
  {
    icon: Brain,
    title: 'Brand Intelligence',
    description: 'AI-powered knowledge base with summaries, voice profiles, and audience insights.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: FileSearch,
    title: 'Activity Logging',
    description: 'Infographic-style audit logs tracking all changes across your organization.',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
];

const adminFeatures: Feature[] = [
  {
    icon: Users,
    title: 'User Management',
    description: 'Approve users, manage permissions, and control access across organizations.',
    gradient: 'from-green-500/20 to-teal-500/20',
  },
  {
    icon: FolderCheck,
    title: 'Bulk Repair Tools',
    description: 'Normalize sections, fix hidden content, and ensure platform-wide consistency.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Hidden Sections Scanner',
    description: 'Identify and bulk-fix guides missing critical branding sections.',
    gradient: 'from-red-500/20 to-rose-500/20',
  },
  {
    icon: Zap,
    title: 'Bulk Intelligence',
    description: 'Generate AI analysis for all brands and products in a single batch operation.',
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

export function FeaturesShowcase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('core');
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

  const getFeatures = () => {
    switch (activeTab) {
      case 'analytics': return analyticsFeatures;
      case 'admin': return adminFeatures;
      default: return coreFeatures;
    }
  };

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
        <div className={`flex justify-center mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="core" className="gap-2 text-sm">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Core</span> Features
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics &</span> AI
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span> Tools
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {getFeatures().map((feature, index) => (
            <FeatureCard 
              key={feature.title} 
              feature={feature} 
              index={index}
              isVisible={isVisible}
            />
          ))}
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
            onClick={() => navigate('/auth')}
            className="gap-2 group"
          >
            <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
            Start Building Your Brand Guide
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
