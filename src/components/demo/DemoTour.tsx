import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Play, Keyboard, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TourCategory, TOUR_CATEGORIES, getCategoryStartIndices } from '@/data/demoTourSteps';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {TOUR_CATEGORIES.map(cat => {
        const startIndex = categoryIndices.get(cat.id);
        if (startIndex === undefined) return null;
        
        const isActive = currentCategory === cat.id;
        const isPast = startIndex < currentStep && !isActive;
        
        return (
          <TooltipProvider key={cat.id} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onJumpToCategory(startIndex)}
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
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Jump to {cat.label} section
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

// Keyboard shortcuts hint
const KeyboardHint = () => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Keyboard className="h-3 w-3" />
          <span className="hidden sm:inline">← → Esc</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs space-y-1">
        <div><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">←</kbd> Previous step</div>
        <div><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">→</kbd> or <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> Next step</div>
        <div><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Close tour</div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const DemoTour = ({ steps, isOpen, onClose, onComplete }: DemoTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

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
    }
  }, [step?.target]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      updateTargetRect(true);
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, updateTargetRect]);

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
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  }, [currentStep, steps.length, onComplete, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

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

  if (!isOpen) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 16;
    const tooltipHeight = 280; // Increased for category nav
    const tooltipWidth = 360; // Slightly wider
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

      {/* Enhanced Tooltip */}
      <div
        className={cn(
          "absolute z-10 w-[360px] rounded-2xl shadow-2xl transition-all duration-300",
          "bg-card/95 backdrop-blur-xl border border-border/50",
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        style={tooltipStyle}
      >
        {/* Progress bar at top */}
        <div className="px-5 pt-4">
          <Progress value={progress} className="h-1" />
        </div>

        <div className="p-5 pt-3">
          {/* Category navigation */}
          <CategoryNav 
            steps={steps} 
            currentStep={currentStep} 
            onJumpToCategory={handleJumpToCategory}
          />

          {/* Header with category badge and close */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="space-y-1">
              <CategoryBadge category={step?.category} />
              <h3 className="text-lg font-semibold text-foreground leading-tight">{step?.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step?.description}</p>

          {/* Navigation footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {currentStep + 1} / {steps.length}
              </span>
              <KeyboardHint />
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1 h-8">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              
              {currentStep < steps.length - 1 && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={handleSkipToEnd} className="h-8 px-2">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Skip tour
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Button size="sm" onClick={handleNext} className="gap-1 h-8 px-4">
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
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
