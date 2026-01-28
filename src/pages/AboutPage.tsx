import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowLeft, Building2, Users, Globe, Brain, Layers, TrendingUp, Sparkles, Shield, Zap, Palette, Package, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { cn } from '@/lib/utils';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

// Interactive step component with animations
interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
  onClick: () => void;
}

const ProcessStep = ({ step, title, description, features, icon, color, isActive, onClick }: ProcessStepProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative text-left p-6 rounded-2xl border-2 transition-all duration-500 w-full group",
        isActive 
          ? `border-${color} bg-${color}/5 shadow-lg shadow-${color}/10 scale-[1.02]` 
          : "border-border/50 hover:border-border bg-card/50 hover:bg-card"
      )}
      style={{
        borderColor: isActive ? `hsl(var(--${color === 'accent' ? 'accent' : color === 'primary' ? 'primary' : 'accent'}))` : undefined,
        backgroundColor: isActive ? `hsl(var(--${color === 'accent' ? 'accent' : color === 'primary' ? 'primary' : 'accent'}) / 0.05)` : undefined,
      }}
    >
      {/* Step number with pulse animation when active */}
      <div className={cn(
        "absolute -top-4 -left-4 h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500",
        isActive ? "scale-110" : "scale-100"
      )}
      style={{
        backgroundColor: isActive ? `hsl(var(--${color === 'accent' ? 'accent' : color === 'primary' ? 'primary' : 'accent'}))` : 'hsl(var(--muted))',
        color: isActive ? 'white' : 'hsl(var(--muted-foreground))',
      }}
      >
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: `hsl(var(--${color === 'accent' ? 'accent' : color === 'primary' ? 'primary' : 'accent'}))` }}
          />
        )}
        {step}
      </div>
      
      {/* Icon */}
      <div className={cn(
        "p-3 rounded-xl w-fit mb-4 transition-all duration-500",
        isActive ? "scale-110" : "scale-100 group-hover:scale-105"
      )}
      style={{
        backgroundColor: `hsl(var(--${color === 'accent' ? 'accent' : color === 'primary' ? 'primary' : 'accent'}) / 0.1)`,
      }}
      >
        {icon}
      </div>
      
      <h3 className={cn(
        "font-semibold text-lg mb-2 transition-colors duration-300",
        isActive ? "text-foreground" : "text-foreground/80"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-sm mb-4 transition-all duration-500",
        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
      )}>
        {description}
      </p>
      
      {/* Features with staggered animation */}
      <div className={cn(
        "space-y-2 transition-all duration-500 overflow-hidden",
        isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
      )}>
        {features.map((feature, i) => (
          <div 
            key={i} 
            className="flex items-center gap-2 text-sm text-muted-foreground"
            style={{ 
              transitionDelay: isActive ? `${i * 100}ms` : '0ms',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.3s ease-out'
            }}
          >
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            {feature}
          </div>
        ))}
      </div>
    </button>
  );
};

// Animated connection line between steps
const ConnectionLine = ({ isActive }: { isActive: boolean }) => (
  <div className="hidden md:flex items-center justify-center w-16">
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-border/30">
      <div 
        className={cn(
          "absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700",
          isActive ? "w-full" : "w-0"
        )}
      />
    </div>
  </div>
);

export default function AboutPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppSettings();
  const [activeStep, setActiveStep] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const processRef = useRef<HTMLDivElement>(null);

  // Auto-cycle through steps
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setActiveStep(prev => prev >= 3 ? 1 : prev + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isInView]);

  // Intersection observer for the process section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    
    if (processRef.current) {
      observer.observe(processRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      step: 1,
      title: "Build Your Brand Foundation",
      description: "Start with your core identity—colors, typography, logos, and values. Add sections as you grow.",
      icon: <Palette className="h-6 w-6 text-primary" />,
      color: "primary",
      features: [
        "25+ customizable sections",
        "Color palettes with Pantone codes",
        "Typography with web fonts",
        "Logo variants & usage guidelines"
      ]
    },
    {
      step: 2,
      title: "Expand Your Ecosystem",
      description: "Grow into products and events. Each inherits from your master brand while staying unique.",
      icon: <Layers className="h-6 w-6 text-accent" />,
      color: "accent",
      features: [
        "Product line brand guides",
        "Event kits with sub-branding",
        "Inherited color & typography",
        "Custom variations per product"
      ]
    },
    {
      step: 3,
      title: "Let AI Learn & Guide",
      description: "Your Brand Brain analyzes every update, providing insights and recommendations.",
      icon: <Brain className="h-6 w-6 text-green-500" />,
      color: "accent",
      features: [
        "Real-time health scores",
        "Market intelligence reports",
        "Competitor analysis",
        "Growth recommendations"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <img 
                src={resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor} 
                alt="BrandHUB" 
                className="h-8 w-8 object-contain" 
              />
              <span className="font-semibold text-lg">
                Brand<span className="text-accent">HUB</span>
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5" />
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Building2 className="h-3 w-3" />
            About BrandHub
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
            The Modern Platform for
            <span className="block text-accent">Living Brand Guidelines</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            BrandHub transforms static brand guidelines into dynamic, intelligent brand ecosystems 
            that grow and evolve with your organization.
          </p>
        </div>
      </section>

      {/* Interactive How It Works Section */}
      <section ref={processRef} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              How It Works
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              A Living, Breathing Brand Guide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click any step to explore, or watch as your brand journey unfolds automatically.
            </p>
          </div>
          
          {/* Process Steps */}
          <div className="grid md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-6 md:gap-0 items-start">
            <ProcessStep
              {...steps[0]}
              isActive={activeStep === 1}
              onClick={() => setActiveStep(1)}
            />
            <ConnectionLine isActive={activeStep >= 2} />
            <ProcessStep
              {...steps[1]}
              isActive={activeStep === 2}
              onClick={() => setActiveStep(2)}
            />
            <ConnectionLine isActive={activeStep >= 3} />
            <ProcessStep
              {...steps[2]}
              isActive={activeStep === 3}
              onClick={() => setActiveStep(3)}
            />
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  activeStep === step 
                    ? "w-8 bg-accent" 
                    : "w-2 bg-border hover:bg-muted-foreground/30"
                )}
                aria-label={`Go to step ${step}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Why Choose BrandHub?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not just a brand guide creator—we're your brand's intelligent partner.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Brand Brain</h3>
              <p className="text-sm text-muted-foreground">
                AI learns your brand voice and provides intelligent recommendations.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Public Portals</h3>
              <p className="text-sm text-muted-foreground">
                Share brand guidelines with stakeholders—no login required.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-green-500/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">
                Role-based access, audit logging, and compliance-ready.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-orange-500/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-orange-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Real-time editing with version control and activity logs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Single CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to elevate your brand?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Contact our team to learn how BrandHub can transform your brand management.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Inquiry'}
            className="gap-2 px-8"
          >
            <Zap className="h-5 w-5" />
            Get in Touch
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings.appName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
