/**
 * AnimationPreviewCards - Visual mini-previews for tagline animation options
 * Shows each animation type with an animated thumbnail
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TaglineAnimation } from '@/components/ui/animated-tagline';

interface AnimationPreviewCardsProps {
  options: { value: TaglineAnimation; label: string; description: string }[];
  value: TaglineAnimation;
  onChange: (value: TaglineAnimation) => void;
}

const TypewriterPreview = ({ isSelected }: { isSelected: boolean }) => {
  const [chars, setChars] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setChars(prev => (prev >= 8 ? 0 : prev + 1));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-4 rounded-sm transition-all duration-100',
              i < chars 
                ? (isSelected ? 'bg-primary' : 'bg-muted-foreground/50')
                : 'bg-transparent'
            )}
          />
        ))}
        <div className={cn(
          'w-0.5 h-4 rounded-sm animate-pulse',
          isSelected ? 'bg-primary' : 'bg-muted-foreground/30'
        )} />
      </div>
    </div>
  );
};

const FadeSlidePreview = ({ isSelected }: { isSelected: boolean }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 1500);
    }, 3000);
    setAnimating(true);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <div
        className={cn(
          'flex gap-0.5 transition-all duration-500',
          animating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        {[1, 0.8, 0.6, 0.9, 0.7].map((w, i) => (
          <div
            key={i}
            className={cn(
              'h-3 rounded-sm transition-colors',
              isSelected ? 'bg-primary' : 'bg-muted-foreground/40'
            )}
            style={{ width: `${w * 8}px` }}
          />
        ))}
      </div>
    </div>
  );
};

const BlurRevealPreview = ({ isSelected }: { isSelected: boolean }) => {
  const [blurred, setBlurred] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlurred(true);
      setTimeout(() => setBlurred(false), 300);
    }, 3000);
    setTimeout(() => setBlurred(false), 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center">
      <div
        className={cn(
          'flex gap-0.5 transition-all duration-700',
          blurred ? 'blur-sm opacity-50 scale-95' : 'blur-0 opacity-100 scale-100'
        )}
      >
        {[6, 8, 5, 7, 6].map((w, i) => (
          <div
            key={i}
            className={cn(
              'h-3 rounded-sm transition-colors',
              isSelected ? 'bg-primary' : 'bg-muted-foreground/40'
            )}
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    </div>
  );
};

const SplitCharsPreview = ({ isSelected }: { isSelected: boolean }) => {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(false);
      setTimeout(() => setAnimating(true), 100);
    }, 3000);
    setTimeout(() => setAnimating(true), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <div className="flex gap-0.5">
        {[1, 0.8, 0.9, 0.7, 1, 0.85].map((w, i) => (
          <div
            key={i}
            className={cn(
              'h-3 rounded-sm transition-all',
              isSelected ? 'bg-primary' : 'bg-muted-foreground/40',
              animating ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 translate-y-4 rotate-12'
            )}
            style={{ 
              width: `${w * 5}px`,
              transitionDelay: `${i * 50}ms`,
              transitionDuration: '500ms',
            }}
          />
        ))}
      </div>
    </div>
  );
};

const WaveGlowPreview = ({ isSelected }: { isSelected: boolean }) => {
  return (
    <div className="h-8 flex items-center justify-center">
      <div className="flex gap-0.5">
        {[6, 8, 5, 7, 6, 8].map((w, i) => (
          <div
            key={i}
            className={cn(
              'h-3 rounded-sm animate-wave-preview transition-colors',
              isSelected ? 'bg-primary' : 'bg-muted-foreground/40'
            )}
            style={{ 
              width: `${w}px`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes wave-preview {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .animate-wave-preview {
          animation: wave-preview 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export const AnimationPreviewCards = ({
  options,
  value,
  onChange,
}: AnimationPreviewCardsProps) => {
  const renderPreview = (animationType: TaglineAnimation, isSelected: boolean) => {
    switch (animationType) {
      case 'typewriter':
        return <TypewriterPreview isSelected={isSelected} />;
      case 'fade-slide':
        return <FadeSlidePreview isSelected={isSelected} />;
      case 'blur-reveal':
        return <BlurRevealPreview isSelected={isSelected} />;
      case 'split-chars':
        return <SplitCharsPreview isSelected={isSelected} />;
      case 'wave-glow':
        return <WaveGlowPreview isSelected={isSelected} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'p-1.5 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
              isSelected
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            )}
            title={option.description}
          >
            <div className="w-full bg-muted/30 rounded">
              {renderPreview(option.value, isSelected)}
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnimationPreviewCards;
