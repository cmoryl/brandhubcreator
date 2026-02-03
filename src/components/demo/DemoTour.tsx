import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Play, Keyboard, SkipForward, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TourCategory, TOUR_CATEGORIES } from '@/data/demoTourSteps';
import { Progress } from '@/components/ui/progress';
import { GlitchText } from '@/components/ui/GlitchText';
export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  category?: TourCategory;
}

interface DemoTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

// Category badge component
const CategoryBadge = ({ category }: { category?: TourCategory }) => {
  if (!category) return null;
  
  const categoryInfo = TOUR_CATEGORIES.find(c => c.id === category);
  if (!categoryInfo) return null;
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
      "bg-gradient-to-r text-white shadow-sm",
      categoryInfo.color
    )}>
      {categoryInfo.label}
    </span>
  );
};

// Get first step index for each category from available steps
const getCategoryStartIndices = (steps: TourStep[]): Map<TourCategory, number> => {
  const indices = new Map<TourCategory, number>();
  steps.forEach((step, index) => {
    if (step.category && !indices.has(step.category)) {
      indices.set(step.category, index);
    }
  });
  return indices;
};

// Category navigation pills
const CategoryNav = ({ 
  steps, 
  currentStep, 
  onJumpToCategory 
}: { 
  steps: TourStep[]; 
  currentStep: number;
  onJumpToCategory: (index: number) => void;
}) => {
  const categoryIndices = useMemo(() => getCategoryStartIndices(steps), [steps]);
  const currentCategory = steps[currentStep]?.category;
  
  // Get unique categories that exist in the available steps
  const availableCategories = useMemo(() => {
    const cats = new Set<TourCategory>();
    steps.forEach(step => {
      if (step.category) cats.add(step.category);
    });
    return TOUR_CATEGORIES.filter(c => cats.has(c.id));
  }, [steps]);
  
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {availableCategories.map(cat => {
        const startIndex = categoryIndices.get(cat.id);
        if (startIndex === undefined) return null;
        
        const isActive = currentCategory === cat.id;
        const isPast = startIndex < currentStep && !isActive;
        
        return (
          <button
            key={cat.id}
            onClick={() => onJumpToCategory(startIndex)}
            title={`Jump to ${cat.label} section`}
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
              isActive 
                ? `bg-gradient-to-r ${cat.color} text-white shadow-md scale-105` 
                : isPast
                  ? "bg-muted text-muted-foreground/70 line-through"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};

// Keyboard shortcuts hint
const KeyboardHint = () => (
  <div 
    className="flex items-center gap-1 text-[10px] text-muted-foreground/60 cursor-help"
    title="Keyboard: ← Previous | → Next | Esc Close"
  >
    <Keyboard className="h-3 w-3" />
    <span className="hidden sm:inline">← → Esc</span>
  </div>
);

export const DemoTour = ({ steps, isOpen, onClose, onComplete }: DemoTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter steps to only include those with existing elements on the page
  const availableSteps = useMemo(() => {
    if (!isOpen) return steps;
    
    return steps.filter(step => {
      const element = document.querySelector(step.target);
      return element !== null;
    });
  }, [steps, isOpen]);

  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.min(currentStep, availableSteps.length - 1);
  const step = availableSteps[safeCurrentStep];
  const progress = availableSteps.length > 0 ? ((safeCurrentStep + 1) / availableSteps.length) * 100 : 0;

  const isElementInViewport = (rect: DOMRect) => {
    const buffer = 100;
    return (
      rect.top >= buffer &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight - buffer) &&
      rect.right <= window.innerWidth
    );
  };

  const updateTargetRect = useCallback((shouldScroll = false) => {
    if (!step?.target) return;
    
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      if (shouldScroll && !isElementInViewport(rect)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
        }, 350);
      }
    } else {
      // Element not found - this shouldn't happen with filtered steps but handle gracefully
      setTargetRect(null);
    }
  }, [step?.target]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
      return;
    }

    // If no available steps, close the tour
    if (availableSteps.length === 0) {
      onClose();
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      updateTargetRect(true);
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, safeCurrentStep, updateTargetRect, availableSteps.length, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => updateTargetRect(false);
    const handleScroll = () => updateTargetRect(false);
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updateTargetRect]);

  const handleNext = useCallback(() => {
    if (safeCurrentStep < availableSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  }, [safeCurrentStep, availableSteps.length, onComplete, onClose]);

  const handlePrev = useCallback(() => {
    if (safeCurrentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [safeCurrentStep]);

  const handleJumpToCategory = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  const handleSkipToEnd = useCallback(() => {
    onComplete?.();
    onClose();
  }, [onComplete, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [isOpen, handleNext, handlePrev, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || availableSteps.length === 0) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 16;
    const tooltipHeight = 320;
    const tooltipWidth = 420;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let targetY: number;
    if (targetRect.height > viewportHeight * 0.6) {
      const visibleTop = Math.max(targetRect.top, 80);
      const visibleBottom = Math.min(targetRect.bottom, viewportHeight - 100);
      targetY = (visibleTop + visibleBottom) / 2;
    } else {
      targetY = targetRect.top + targetRect.height / 2;
    }
    
    let targetX = Math.min(
      Math.max(targetRect.left + targetRect.width / 2, tooltipWidth / 2 + padding),
      viewportWidth - tooltipWidth / 2 - padding
    );

    const position = step?.position || 'bottom';
    
    let finalTop: number;
    let finalLeft = targetX;
    
    switch (position) {
      case 'top':
        finalTop = Math.max(padding, targetRect.top - tooltipHeight - padding);
        break;
      case 'bottom':
        finalTop = Math.min(
          targetRect.bottom + padding,
          viewportHeight - tooltipHeight - padding
        );
        break;
      case 'left':
      case 'right':
        finalTop = Math.max(
          padding,
          Math.min(targetY - tooltipHeight / 2, viewportHeight - tooltipHeight - padding)
        );
        break;
      default:
        finalTop = Math.min(
          targetRect.bottom + padding,
          viewportHeight - tooltipHeight - padding
        );
    }
    
    finalLeft = Math.min(
      Math.max(finalLeft, tooltipWidth / 2 + padding),
      viewportWidth - tooltipWidth / 2 - padding
    );
    
    return {
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
      transform: 'translateX(-50%)',
    };
  };

  const tooltipStyle = getTooltipPosition();

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={onClose}
        />
      </svg>

      {/* Spotlight border glow with animated pulse */}
      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-primary pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 4px rgba(var(--primary), 0.2), 0 0 30px 5px rgba(var(--primary), 0.15)',
          }}
        >
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-xl border border-primary/50 animate-pulse" />
        </div>
      )}

      {/* Enhanced Tooltip - Cyberpunk-inspired design */}
      <div
        className={cn(
          "absolute z-10 w-[440px] max-w-[calc(100vw-32px)] rounded-xl transition-all duration-300",
          "bg-gradient-to-br from-background/98 via-card/95 to-background/98",
          "backdrop-blur-xl",
          "border border-accent/30",
          "shadow-[0_0_60px_-15px_hsl(var(--accent)),0_25px_50px_-12px_rgba(0,0,0,0.5)]",
          isAnimating ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"
        )}
        style={tooltipStyle}
      >
        {/* Animated top border with scanning effect */}
        <div className="relative h-1 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent animate-[shimmer_2s_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50" />
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-accent/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-accent/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-accent/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-accent/40 rounded-br-xl" />

        <div className="p-5 space-y-4">
          {/* Category navigation pills */}
          <CategoryNav 
            steps={availableSteps} 
            currentStep={safeCurrentStep} 
            onJumpToCategory={handleJumpToCategory}
          />

          {/* Sleek progress bar */}
          <div className="relative">
            <div className="h-0.5 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent via-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Header section with glitch title */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <CategoryBadge category={step?.category} />
              <h3 className="text-2xl font-bold leading-tight tracking-tight">
                <GlitchText text={step?.title || ''} className="text-2xl font-bold" />
              </h3>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-accent/10 hover:shadow-[0_0_10px_hsl(var(--accent)/0.3)]",
                "border border-transparent hover:border-accent/30"
              )}
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description with subtle styling */}
          <div className="relative pl-3 border-l-2 border-accent/30">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step?.description}
            </p>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-md">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-xs font-mono text-muted-foreground">
                  {String(safeCurrentStep + 1).padStart(2, '0')}/{String(availableSteps.length).padStart(2, '0')}
                </span>
              </div>
              <KeyboardHint />
            </div>
            
            <div className="flex items-center gap-2">
              {safeCurrentStep > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePrev} 
                  className="gap-1 h-8 hover:bg-accent/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Back</span>
                </Button>
              )}
              
              {safeCurrentStep < availableSteps.length - 1 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkipToEnd} 
                  className="h-8 px-2 hover:bg-accent/10"
                  title="Skip tour"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={handleNext} 
                className={cn(
                  "gap-1 h-8 px-4",
                  "bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90",
                  "shadow-[0_0_20px_-5px_hsl(var(--accent))]",
                  "transition-all duration-200 hover:shadow-[0_0_25px_-3px_hsl(var(--accent))]"
                )}
              >
                <span className="text-xs font-medium">
                  {safeCurrentStep === availableSteps.length - 1 ? 'Complete' : 'Next'}
                </span>
                {safeCurrentStep < availableSteps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Subtle scanline overlay */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-xl opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>
    </div>,
    document.body
  );
};

// Enhanced Start Tour Button component
interface StartTourButtonProps {
  onClick: () => void;
  className?: string;
  stepCount?: number;
}

export const StartTourButton = ({ onClick, className, stepCount }: StartTourButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("gap-2 group", className)}
    >
      <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Start Tour</span>
      <span className="sm:hidden">Tour</span>
      {stepCount && (
        <span className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {stepCount} steps
        </span>
      )}
    </Button>
  );
};
