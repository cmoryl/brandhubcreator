import { useState, useEffect, useRef } from 'react';
import { Brain, Layers, Palette, CheckCircle, Sparkles, ArrowRight, Zap, Globe, TrendingUp, FileText, Users, Shield, BarChart3, Target, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Interactive step component with animations
interface ProcessStepProps {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  features: { text: string; highlight?: boolean }[];
  icon: React.ReactNode;
  colorClass: string;
  accentColor: string;
  isActive: boolean;
  onClick: () => void;
}

const ProcessStep = ({ step, title, subtitle, description, features, icon, colorClass, accentColor, isActive, onClick }: ProcessStepProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 w-full group",
        isActive 
          ? `${colorClass} shadow-xl scale-[1.02]` 
          : "border-border/50 hover:border-border bg-card/50 hover:bg-card"
      )}
    >
      {/* Step number with pulse animation when active */}
      <div className={cn(
        "absolute -top-3 -left-3 sm:-top-4 sm:-left-4 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-500",
        isActive 
          ? "bg-white text-accent scale-110 shadow-lg" 
          : "bg-muted text-muted-foreground"
      )}>
        {isActive && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-accent" />
        )}
        <span className={cn(isActive && "relative z-10")}>{step}</span>
      </div>
      
      {/* Icon */}
      <div className={cn(
        "p-2.5 sm:p-3 rounded-xl w-fit mb-3 sm:mb-4 transition-all duration-500",
        isActive ? "scale-110" : "scale-100 group-hover:scale-105",
        step === 1 ? "bg-primary/10" : step === 2 ? "bg-accent/10" : "bg-green-500/10"
      )}>
        {icon}
      </div>
      
      {/* Subtitle badge */}
      <Badge 
        variant="outline" 
        className={cn(
          "mb-2 text-[10px] sm:text-xs transition-all duration-300",
          isActive ? "opacity-100" : "opacity-60"
        )}
      >
        {subtitle}
      </Badge>
      
      <h3 className={cn(
        "font-semibold text-base sm:text-lg mb-2 transition-colors duration-300",
        isActive ? "text-foreground" : "text-foreground/80"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-xs sm:text-sm mb-4 transition-all duration-500 leading-relaxed",
        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
      )}>
        {description}
      </p>
      
      <div className={cn(
        "space-y-1.5 overflow-hidden",
        isActive ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
      )}
      style={{ transition: 'max-height 0.5s ease, opacity 0.5s ease' }}
      >
        {features.map((feature, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-start gap-2 text-xs sm:text-sm",
              feature.highlight ? "text-foreground font-medium" : "text-muted-foreground",
              isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2.5"
            )}
            style={{ 
              transitionProperty: 'opacity, transform',
              transitionDuration: '0.3s',
              transitionTimingFunction: 'ease-out',
              transitionDelay: isActive ? `${i * 60}ms` : '0ms',
            }}
          >
            <CheckCircle className={cn(
              "h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 mt-0.5",
              feature.highlight ? "text-accent" : "text-green-500"
            )} />
            <span className="leading-tight">{feature.text}</span>
          </div>
        ))}
      </div>
      
      {/* "Click to explore" hint when not active */}
      {!isActive && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground/50 mt-3 group-hover:text-muted-foreground transition-colors">
          <span>Click to explore</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};

// Animated connection line between steps
const ConnectionLine = ({ isActive, progress }: { isActive: boolean; progress: number }) => (
  <div className="hidden md:flex items-center justify-center w-12 lg:w-16">
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/30">
      <div 
        className={cn(
          "absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-green-500 rounded-full transition-all duration-700",
          isActive ? "w-full" : "w-0"
        )}
      />
      {/* Animated shimmer */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" 
          style={{ transform: 'translateX(-100%)', animation: 'shimmer 2s infinite' }}
        />
      )}
    </div>
  </div>
);

// Key benefit callouts
const BenefitCallout = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-accent/30 transition-colors">
    <div className="p-2 rounded-lg bg-accent/10 shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-medium text-sm text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

interface InteractiveProcessSectionProps {
  className?: string;
}

export const InteractiveProcessSection = ({ className }: InteractiveProcessSectionProps) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const processRef = useRef<HTMLDivElement>(null);

  // Auto-cycle through steps (pauses on hover)
  useEffect(() => {
    if (!isInView || isPaused) return;
    
    const interval = setInterval(() => {
      setActiveStep(prev => prev >= 3 ? 1 : prev + 1);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [isInView, isPaused]);

  // Intersection observer for the process section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    
    if (processRef.current) {
      observer.observe(processRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const steps: Omit<ProcessStepProps, 'isActive' | 'onClick'>[] = [
    {
      step: 1,
      title: "Build Your Brand Foundation",
      subtitle: "Identity & Guidelines",
      description: "Start with your core identity. Define colors with Pantone codes, set typography rules, upload logo variants, and establish the visual language that makes your brand unique.",
      icon: <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
      colorClass: "border-primary/50 bg-primary/5",
      accentColor: "bg-primary",
      features: [
        { text: "25+ customizable sections from colors to case studies", highlight: true },
        { text: "Color palettes with HEX, RGB, HSL & Pantone codes" },
        { text: "Typography with live web font previews" },
        { text: "Logo variants with clear usage guidelines" },
        { text: "Imagery styles, patterns & gradient libraries" },
        { text: "Social media templates & asset specifications" }
      ]
    },
    {
      step: 2,
      title: "Expand Your Ecosystem",
      subtitle: "Products & Events",
      description: "Your brand grows. Create product line guides and event kits that inherit your master brand's DNA while having their own unique identity. Everything stays connected.",
      icon: <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />,
      colorClass: "border-accent/50 bg-accent/5",
      accentColor: "bg-accent",
      features: [
        { text: "Hierarchical brand architecture", highlight: true },
        { text: "Product lines inherit master brand styles" },
        { text: "Event kits with regional sub-branding" },
        { text: "Custom color & typography variations" },
        { text: "Shared asset libraries across guides" },
        { text: "Organization portals for public access" }
      ]
    },
    {
      step: 3,
      title: "Let AI Learn & Guide",
      subtitle: "Brand Brain Intelligence",
      description: "Your Brand Brain watches every update, learns your patterns, and provides intelligent insights. It spots inconsistencies, suggests improvements, and helps you grow strategically.",
      icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />,
      colorClass: "border-green-500/50 bg-green-500/5",
      accentColor: "bg-green-500",
      features: [
        { text: "AI-powered brand health scoring", highlight: true },
        { text: "Real-time consistency audits" },
        { text: "Market intelligence & competitor analysis" },
        { text: "Growth recommendations based on your data" },
        { text: "Knowledge base that learns as you build" },
        { text: "Trend forecasting & opportunity alerts" }
      ]
    }
  ];

  return (
    <section 
      ref={processRef} 
      className={cn("py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border/30", className)}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <Badge variant="outline" className="mb-3 sm:mb-4 gap-1.5 px-3 py-1">
            <Sparkles className="h-3 w-3" />
            How It Works
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            A Living, Breathing Brand Guide
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Unlike static PDFs that gather dust, BrandHub creates dynamic brand guides that evolve with your business. 
            Every update feeds your <span className="text-accent font-medium">Brand Brain</span>—an AI that learns your patterns, 
            spots opportunities, and keeps your brand consistently brilliant.
          </p>
        </div>
        
        {/* Process Steps */}
        <div 
          className="grid md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-4 sm:gap-6 md:gap-0 items-stretch mb-10 sm:mb-14"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <ProcessStep
            {...steps[0]}
            isActive={activeStep === 1}
            onClick={() => setActiveStep(1)}
          />
          <ConnectionLine isActive={activeStep >= 2} progress={activeStep >= 2 ? 100 : 0} />
          <ProcessStep
            {...steps[1]}
            isActive={activeStep === 2}
            onClick={() => setActiveStep(2)}
          />
          <ConnectionLine isActive={activeStep >= 3} progress={activeStep >= 3 ? 100 : 0} />
          <ProcessStep
            {...steps[2]}
            isActive={activeStep === 3}
            onClick={() => setActiveStep(3)}
          />
        </div>
        
        {/* Progress indicator - touch targets min 24px for WCAG 2.2 AA */}
        <div className="flex justify-center gap-4 mb-12 sm:mb-16">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className="relative flex items-center justify-center min-w-[24px] min-h-[24px] p-2"
              aria-label={`Go to step ${step}`}
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  activeStep === step 
                    ? "w-10 bg-accent" 
                    : "w-2 bg-border group-hover:bg-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>

        {/* Key Benefits Grid */}
        <div className="border-t border-border/50 pt-10 sm:pt-14">
          <h3 className="text-center text-lg sm:text-xl font-semibold text-foreground mb-6 sm:mb-8">
            Why Teams Choose Living Brand Guides
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenefitCallout 
              icon={<Zap className="h-4 w-4 text-accent" />}
              title="Always Up-to-Date"
              description="Changes sync instantly across all guides. No more outdated PDFs floating around."
            />
            <BenefitCallout 
              icon={<Users className="h-4 w-4 text-accent" />}
              title="Team Collaboration"
              description="Multiple editors, role-based access, and organization portals for stakeholders."
            />
            <BenefitCallout 
              icon={<Target className="h-4 w-4 text-accent" />}
              title="Brand Consistency"
              description="AI audits catch inconsistencies before they become problems. Stay on-brand always."
            />
            <BenefitCallout 
              icon={<TrendingUp className="h-4 w-4 text-accent" />}
              title="Strategic Insights"
              description="Market intelligence and competitor analysis help you position for growth."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveProcessSection;
