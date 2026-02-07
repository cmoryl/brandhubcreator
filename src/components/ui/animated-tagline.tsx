/**
 * Animated Tagline Component
 * Provides 5 text animation effects with hover interactions and environmental effects
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

export type TaglineAnimation = 
  | 'typewriter'      // Characters appear one by one
  | 'fade-slide'      // Fade in with upward slide
  | 'blur-reveal'     // Blur to sharp reveal
  | 'split-chars'     // Characters animate in from scattered positions
  | 'wave-glow';      // Wave animation with glow effect

export type TaglineHoverEffect =
  | 'none'
  | 'glow-pulse'      // Subtle glow pulse on hover
  | 'letter-dance'    // Letters lift slightly on hover
  | 'color-shift'     // Gradient color shift
  | 'underline-grow'; // Animated underline

export type TaglineEnvironment =
  | 'none'
  | 'shimmer'         // Subtle shimmer across text
  | 'particle-dust'   // Floating particles around text
  | 'aurora'          // Aurora borealis color shifting
  | 'glitch';         // Occasional glitch effect

export interface AnimatedTaglineProps {
  text: string;
  animation?: TaglineAnimation;
  hoverEffect?: TaglineHoverEffect;
  environment?: TaglineEnvironment;
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
  delay?: number;
  duration?: number;
  /** Trigger animation on mount */
  animateOnMount?: boolean;
  /** Custom color for effects */
  effectColor?: string;
}

// Typewriter animation component
const TypewriterText = ({ text, duration = 2000, delay = 0 }: { text: string; duration?: number; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const charDelay = duration / text.length;
    let currentIndex = 0;
    
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 500);
        }
      }, charDelay);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, duration, delay]);

  return (
    <span className="inline-block">
      {displayedText}
      <span className={cn(
        "inline-block w-[2px] h-[1em] bg-current ml-1 align-middle transition-opacity duration-300",
        showCursor ? "animate-pulse" : "opacity-0"
      )} />
    </span>
  );
};

// Split characters animation
const SplitCharsText = ({ text, duration = 800, delay = 0 }: { text: string; duration?: number; delay?: number }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsAnimated(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <span className="inline-flex flex-wrap">
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={cn(
            "inline-block transition-all",
            isAnimated ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-8 rotate-12"
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionDelay: `${i * 30}ms`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

// Wave glow animation
const WaveGlowText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <span className={cn(
      "inline-flex flex-wrap",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block animate-wave-glow"
          style={{
            animationDelay: `${i * 50}ms`,
            animationDuration: '2s',
            animationIterationCount: 'infinite',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

// Environment effects overlay
const EnvironmentOverlay = ({ effect, color }: { effect: TaglineEnvironment; color?: string }) => {
  if (effect === 'none') return null;

  const effectColor = color || 'hsl(var(--primary))';

  switch (effect) {
    case 'shimmer':
      return (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${effectColor}20 50%, transparent 100%)`,
            animation: 'shimmer 3s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }}
        />
      );
    case 'particle-dust':
      return <ParticleDust color={effectColor} />;
    case 'aurora':
      return (
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
          style={{
            background: `linear-gradient(45deg, ${effectColor}, hsl(var(--accent)), ${effectColor})`,
            backgroundSize: '300% 300%',
            animation: 'aurora 8s ease-in-out infinite',
          }}
        />
      );
    case 'glitch':
      return <GlitchOverlay />;
    default:
      return null;
  }
};

// Particle dust effect
const ParticleDust = ({ color }: { color: string }) => {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            animation: `particle-float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Glitch effect overlay
const GlitchOverlay = () => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!glitching) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-red-500/10 translate-x-[2px]" />
      <div className="absolute inset-0 bg-cyan-500/10 -translate-x-[2px]" />
    </div>
  );
};

// Letter dance wrapper - applies hover animation to individual characters
const LetterDanceText = ({ text, className }: { text: string; className?: string }) => {
  return (
    <span className={cn("inline-flex flex-wrap", className)}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block transition-transform duration-300 hover:-translate-y-1 hover:scale-110"
          style={{
            transitionDelay: `${i * 20}ms`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

// Hover effect wrapper
const HoverEffectWrapper = ({ 
  children, 
  effect, 
  text,
  className 
}: { 
  children: React.ReactNode; 
  effect: TaglineHoverEffect;
  text?: string;
  className?: string;
}) => {
  // For letter-dance, we need to render individual characters
  if (effect === 'letter-dance' && text) {
    return <LetterDanceText text={text} className={className} />;
  }

  const hoverClasses: Record<TaglineHoverEffect, string> = {
    'none': '',
    'glow-pulse': 'hover:drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)] transition-all duration-500',
    'letter-dance': '', // Handled above
    'color-shift': 'hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:via-accent hover:to-primary transition-all duration-700',
    'underline-grow': 'relative after:absolute after:bottom-0 after:left-1/2 after:w-0 after:h-[2px] after:bg-current after:transition-all after:duration-500 hover:after:left-0 hover:after:w-full',
  };

  return (
    <span className={cn(hoverClasses[effect], className)}>
      {children}
    </span>
  );
};

export const AnimatedTagline = ({
  text,
  animation = 'fade-slide',
  hoverEffect = 'none',
  environment = 'none',
  className,
  style,
  delay = 0,
  duration = 800,
  animateOnMount = true,
  effectColor,
}: AnimatedTaglineProps) => {
  const [hasAnimated, setHasAnimated] = useState(!animateOnMount);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateOnMount) return;
    
    const timeout = setTimeout(() => setHasAnimated(true), delay);
    return () => clearTimeout(timeout);
  }, [animateOnMount, delay]);

  const renderAnimatedText = () => {
    switch (animation) {
      case 'typewriter':
        return <TypewriterText text={text} duration={duration} delay={delay} />;
      
      case 'fade-slide':
        return (
          <span className={cn(
            "inline-block transition-all",
            hasAnimated 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-6"
          )} style={{ transitionDuration: `${duration}ms` }}>
            {text}
          </span>
        );
      
      case 'blur-reveal':
        return (
          <span className={cn(
            "inline-block transition-all",
            hasAnimated 
              ? "opacity-100 blur-0 scale-100" 
              : "opacity-0 blur-lg scale-95"
          )} style={{ transitionDuration: `${duration}ms` }}>
            {text}
          </span>
        );
      
      case 'split-chars':
        return <SplitCharsText text={text} duration={duration} delay={delay} />;
      
      case 'wave-glow':
        return <WaveGlowText text={text} delay={delay} />;
      
      default:
        return <span>{text}</span>;
    }
  };

  return (
    <div ref={ref} className={cn("relative inline-block", className)} style={style}>
      <EnvironmentOverlay effect={environment} color={effectColor} />
      <HoverEffectWrapper effect={hoverEffect} text={hoverEffect === 'letter-dance' ? text : undefined}>
        {hoverEffect !== 'letter-dance' && renderAnimatedText()}
      </HoverEffectWrapper>
    </div>
  );
};

// Animation options for admin selection
export const TAGLINE_ANIMATION_OPTIONS: { value: TaglineAnimation; label: string; description: string }[] = [
  { value: 'typewriter', label: 'Typewriter', description: 'Characters appear one by one like typing' },
  { value: 'fade-slide', label: 'Fade & Slide', description: 'Smooth fade in with upward motion' },
  { value: 'blur-reveal', label: 'Blur Reveal', description: 'Text sharpens from blur' },
  { value: 'split-chars', label: 'Split Characters', description: 'Letters fly in from scattered positions' },
  { value: 'wave-glow', label: 'Wave Glow', description: 'Continuous wave animation with glow' },
];

export const TAGLINE_HOVER_OPTIONS: { value: TaglineHoverEffect; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No hover effect' },
  { value: 'glow-pulse', label: 'Glow Pulse', description: 'Subtle glowing effect on hover' },
  { value: 'letter-dance', label: 'Letter Dance', description: 'Letters lift slightly' },
  { value: 'color-shift', label: 'Color Shift', description: 'Gradient color transition' },
  { value: 'underline-grow', label: 'Underline Grow', description: 'Animated underline appears' },
];

export const TAGLINE_ENVIRONMENT_OPTIONS: { value: TaglineEnvironment; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No environmental effect' },
  { value: 'shimmer', label: 'Shimmer', description: 'Subtle light shimmer across text' },
  { value: 'particle-dust', label: 'Particle Dust', description: 'Floating particles around text' },
  { value: 'aurora', label: 'Aurora', description: 'Color-shifting aurora effect' },
  { value: 'glitch', label: 'Glitch', description: 'Occasional digital glitch effect' },
];

export default AnimatedTagline;
