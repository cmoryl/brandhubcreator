import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRef } from 'react';
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
  
  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only register as swipe if horizontal movement is greater than vertical
    // and exceeds minimum threshold (50px)
    const minSwipeDistance = 50;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalSwipe && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX < 0) {
        // Swipe left = next
        handleNext();
      } else {
        // Swipe right = previous
        handlePrev();
      }
    }
    
    touchStartRef.current = null;
  }, [handleNext, handlePrev]);

  if (!isOpen || availableSteps.length === 0) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 20;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const isMobile = viewportWidth < 640;
    const tooltipHeight = isMobile ? 340 : 380;
    const tooltipWidth = isMobile ? Math.min(viewportWidth - 32, 360) : 520;
    
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

      {/* Enhanced Tour Card - Premium liquid glass design */}
      <div
        ref={cardRef}
        className={cn(
          "absolute z-10 w-full sm:w-[520px] max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-40px)] transition-all duration-400 ease-out",
          "font-['Poppins',sans-serif]",
          isAnimating ? "opacity-0 scale-95 translate-y-3" : "opacity-100 scale-100 translate-y-0"
        )}
        style={tooltipStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Outer glow ring */}
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-accent/30 via-white/10 to-accent/30 blur-md opacity-60" />
        
        {/* Main card container with liquid glass effect */}
        <div className="relative rounded-2xl overflow-hidden bg-black/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
          
          {/* Inner glass shine layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none" />
          
          {/* Animated header strip */}
          <div className="relative h-10 sm:h-12 bg-gradient-to-r from-accent/10 via-white/5 to-accent/10 border-b border-white/10">
            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-[shimmer_3s_infinite]" />
            </div>
            
            {/* Header content */}
            <div className="relative h-full px-3 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_12px_hsl(var(--accent))]" />
                <span className="text-[10px] sm:text-xs font-medium text-accent uppercase tracking-[0.1em] sm:tracking-[0.15em]">Interactive Tour</span>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  "text-white/50 hover:text-white",
                  "hover:bg-white/10 backdrop-blur-sm"
                )}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Card body */}
          <div className="relative p-3 sm:p-6 space-y-3 sm:space-y-5">
            {/* Category navigation pills */}
            <CategoryNav 
              steps={availableSteps} 
              currentStep={safeCurrentStep} 
              onJumpToCategory={handleJumpToCategory}
            />

            {/* Progress indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-accent via-accent to-accent/80 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_hsl(var(--accent)/0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-white/60 tabular-nums tracking-wider">
                {String(safeCurrentStep + 1).padStart(2, '0')}/{String(availableSteps.length).padStart(2, '0')}
              </span>
            </div>

            {/* Content section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <CategoryBadge category={step?.category} />
                <h3 className="text-lg sm:text-2xl font-semibold leading-tight tracking-tight text-white">
                  <GlitchText text={step?.title || ''} className="text-lg sm:text-2xl font-semibold" />
                </h3>
              </div>

              {/* Description card with glass effect */}
              <div className="relative p-3 sm:p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                <div className="absolute top-0 left-4 w-10 h-[2px] bg-gradient-to-r from-accent to-transparent rounded-full" />
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {step?.description}
                </p>
              </div>
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="h-3.5 w-3.5 text-accent/50" />
                <KeyboardHint />
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                {safeCurrentStep > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePrev} 
                    className="gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 font-['Poppins',sans-serif]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-xs font-medium hidden xs:inline">Back</span>
                  </Button>
                )}
                
                {safeCurrentStep < availableSteps.length - 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSkipToEnd} 
                    className="h-8 sm:h-9 px-2 text-white/50 hover:text-white hover:bg-white/10"
                    title="Skip tour"
                  >
                    <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                )}
                
                <button 
                  onClick={handleNext} 
                  className={cn(
                    "inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-3 sm:px-5",
                    "font-['Poppins',sans-serif] text-[11px] sm:text-xs font-medium text-white",
                    "rounded-xl",
                    // Glass gradient background
                    "bg-gradient-to-r from-accent to-accent/80",
                    "hover:from-accent/90 hover:to-accent/70",
                    // Multi-layer shadows for depth
                    "shadow-[0_0_20px_-5px_hsl(var(--accent)),0_4px_12px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
                    "hover:shadow-[0_0_30px_-3px_hsl(var(--accent)),0_6px_16px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]",
                    // Border for glass edge
                    "border border-white/20",
                    "transition-all duration-200"
                  )}
                >
                  <span>
                    {safeCurrentStep === availableSteps.length - 1 ? 'Complete' : 'Next'}
                  </span>
                  {safeCurrentStep < availableSteps.length - 1 && <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom accent line with glow */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent shadow-[0_0_8px_hsl(var(--accent)/0.3)]" />
        </div>
      </div>
    </div>,
    document.body
  );
};

// Enhanced Start Tour Button component with liquid glass aesthetic
interface StartTourButtonProps {
  onClick: () => void;
  className?: string;
  stepCount?: number;
}

export const StartTourButton = ({ onClick, className, stepCount }: StartTourButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center gap-2 h-9 px-4 rounded-xl",
        "font-['Poppins',sans-serif] text-sm font-medium",
        // Liquid glass background
        "bg-white/[0.08] hover:bg-white/[0.14]",
        "backdrop-blur-xl backdrop-saturate-150",
        // Multi-layer border for glass depth
        "border border-white/20 hover:border-white/30",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_24px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_32px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_-5px_hsl(var(--accent)/0.3)]",
        // Text styling
        "text-foreground/90 hover:text-foreground",
        // Smooth transitions
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-60" />
      
      {/* Accent shimmer on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
      
      {/* Play icon with glow */}
      <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 group-hover:bg-accent/30 transition-colors">
        <Play className="h-3 w-3 text-accent fill-accent/30 group-hover:scale-110 transition-transform" />
      </span>
      
      {/* Text */}
      <span className="relative hidden sm:inline tracking-wide">Start Tour</span>
      <span className="relative sm:hidden tracking-wide">Tour</span>
      
      {/* Step count badge */}
      {stepCount && (
        <span className="relative hidden sm:inline text-[10px] text-accent/80 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 font-medium tabular-nums">
          {stepCount}
        </span>
      )}
    </button>
  );
};
