import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface DemoTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const DemoTour = ({ steps, isOpen, onClose, onComplete }: DemoTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step?.target) return;
    
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view with offset for the tooltip
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step?.target]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      updateTargetRect();
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, updateTargetRect]);

  useEffect(() => {
    if (!isOpen) return;
    
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [isOpen, currentStep, steps.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 16;
    const tooltipHeight = 180;
    const tooltipWidth = 320;
    const position = step?.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
    }
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
                rx="8"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto"
          onClick={onClose}
        />
      </svg>

      {/* Spotlight border glow */}
      {targetRect && (
        <div
          className="absolute rounded-lg border-2 border-primary shadow-[0_0_0_4px_rgba(var(--primary),0.3)] pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={cn(
          "absolute z-10 w-80 bg-card border border-border rounded-xl shadow-2xl p-5 transition-all duration-300",
          isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}
        style={tooltipStyle}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  idx === currentStep ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{step?.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step?.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-1">
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Start Tour Button component
interface StartTourButtonProps {
  onClick: () => void;
  className?: string;
}

export const StartTourButton = ({ onClick, className }: StartTourButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Play className="h-4 w-4" />
      <span className="hidden sm:inline">Start Tour</span>
      <span className="sm:hidden">Tour</span>
    </Button>
  );
};
