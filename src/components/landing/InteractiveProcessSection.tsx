import { useState, useEffect, useRef } from 'react';
import { Brain, Layers, Palette, CheckCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Interactive step component with animations
interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  colorClass: string;
  isActive: boolean;
  onClick: () => void;
}

const ProcessStep = ({ step, title, description, features, icon, colorClass, isActive, onClick }: ProcessStepProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-500 w-full group",
        isActive 
          ? `${colorClass} shadow-lg scale-[1.02]` 
          : "border-border/50 hover:border-border bg-card/50 hover:bg-card"
      )}
    >
      {/* Step number with pulse animation when active */}
      <div className={cn(
        "absolute -top-3 -left-3 sm:-top-4 sm:-left-4 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-500",
        isActive 
          ? "bg-accent text-white scale-110" 
          : "bg-muted text-muted-foreground"
      )}>
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
        )}
        {step}
      </div>
      
      {/* Icon */}
      <div className={cn(
        "p-2 sm:p-3 rounded-xl w-fit mb-3 sm:mb-4 transition-all duration-500",
        isActive ? "scale-110" : "scale-100 group-hover:scale-105",
        step === 1 ? "bg-primary/10" : step === 2 ? "bg-accent/10" : "bg-green-500/10"
      )}>
        {icon}
      </div>
      
      <h3 className={cn(
        "font-semibold text-base sm:text-lg mb-2 transition-colors duration-300",
        isActive ? "text-foreground" : "text-foreground/80"
      )}>
        {title}
      </h3>
      
      <p className={cn(
        "text-xs sm:text-sm mb-3 sm:mb-4 transition-all duration-500",
        isActive ? "text-muted-foreground" : "text-muted-foreground/70"
      )}>
        {description}
      </p>
      
      <div className={cn(
        "space-y-1.5 sm:space-y-2 overflow-hidden",
        isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
      )}
      style={{ transition: 'max-height 0.5s ease, opacity 0.5s ease' }}
      >
        {features.map((feature, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-center gap-2 text-xs sm:text-sm text-muted-foreground",
              isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2.5"
            )}
            style={{ 
              transitionProperty: 'opacity, transform',
              transitionDuration: '0.3s',
              transitionTimingFunction: 'ease-out',
              transitionDelay: isActive ? `${i * 100}ms` : '0ms',
            }}
          >
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
            {feature}
          </div>
        ))}
      </div>
    </button>
  );
};

// Animated connection line between steps
const ConnectionLine = ({ isActive }: { isActive: boolean }) => (
  <div className="hidden md:flex items-center justify-center w-12 lg:w-16">
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

interface InteractiveProcessSectionProps {
  className?: string;
}

export const InteractiveProcessSection = ({ className }: InteractiveProcessSectionProps) => {
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
      { threshold: 0.2 }
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
      description: "Start with your core identity—colors, typography, logos, and values.",
      icon: <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
      colorClass: "border-primary/50 bg-primary/5",
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
      description: "Grow into products and events that inherit your master brand.",
      icon: <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />,
      colorClass: "border-accent/50 bg-accent/5",
      features: [
        "Product line brand guides",
        "Event kits with sub-branding",
        "Inherited styles & colors",
        "Custom variations per product"
      ]
    },
    {
      step: 3,
      title: "Let AI Learn & Guide",
      description: "Your Brand Brain analyzes every update, providing intelligent insights.",
      icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />,
      colorClass: "border-green-500/50 bg-green-500/5",
      features: [
        "Real-time health scores",
        "Market intelligence reports",
        "Competitor analysis",
        "Growth recommendations"
      ]
    }
  ];

  return (
    <section 
      ref={processRef} 
      className={cn("py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border/30", className)}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-3 sm:mb-4 gap-1">
            <Sparkles className="h-3 w-3" />
            How It Works
          </Badge>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-4">
            A Living, Breathing Brand Guide
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Click any step to explore, or watch as your brand journey unfolds automatically.
          </p>
        </div>
        
        {/* Process Steps */}
        <div className="grid md:grid-cols-[1fr,auto,1fr,auto,1fr] gap-4 sm:gap-6 md:gap-0 items-start">
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
        <div className="flex justify-center gap-2 mt-6 sm:mt-8">
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
  );
};

export default InteractiveProcessSection;
