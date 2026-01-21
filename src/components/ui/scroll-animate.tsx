import React from 'react';
import { useScrollAnimation, AnimationType } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export type { AnimationType } from '@/hooks/useScrollAnimation';

interface ScrollAnimateProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollAnimate({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className,
  as: Component = 'div'
}: ScrollAnimateProps) {
  const { ref, style } = useScrollAnimation({
    animation,
    delay,
    duration,
    threshold
  });

  return React.createElement(
    Component,
    {
      ref,
      style,
      className: cn('will-change-transform', className)
    },
    children
  );
}

// Component for staggered grid items
interface StaggeredGridProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  baseDelay?: number;
  duration?: number;
  className?: string;
  itemClassName?: string;
}

export function StaggeredGrid({
  children,
  animation = 'fade-up',
  baseDelay = 80,
  duration = 500,
  className,
  itemClassName
}: StaggeredGridProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollAnimate
          key={index}
          animation={animation}
          delay={index * baseDelay}
          duration={duration}
          className={itemClassName}
        >
          {child}
        </ScrollAnimate>
      ))}
    </div>
  );
}

// Parallax wrapper component
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.3, className }: ParallaxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = viewportCenter - elementCenter;
      
      setOffset(distance * speed * 0.1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div 
      ref={ref} 
      className={cn('will-change-transform', className)}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}

// Reveal on scroll with mask effect
interface RevealMaskProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
}

export function RevealMask({
  children,
  direction = 'up',
  duration = 800,
  className
}: RevealMaskProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const clipPaths: Record<string, { initial: string; visible: string }> = {
    up: { initial: 'inset(100% 0 0 0)', visible: 'inset(0 0 0 0)' },
    down: { initial: 'inset(0 0 100% 0)', visible: 'inset(0 0 0 0)' },
    left: { initial: 'inset(0 100% 0 0)', visible: 'inset(0 0 0 0)' },
    right: { initial: 'inset(0 0 0 100%)', visible: 'inset(0 0 0 0)' }
  };

  return (
    <div
      ref={ref}
      className={cn('overflow-hidden', className)}
      style={{
        clipPath: isVisible ? clipPaths[direction].visible : clipPaths[direction].initial,
        transition: `clip-path ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`
      }}
    >
      {children}
    </div>
  );
}

// Text reveal animation (word by word)
interface TextRevealProps {
  text: string;
  className?: string;
  wordDelay?: number;
}

export function TextReveal({ text, className, wordDelay = 50 }: TextRevealProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden"
        >
          <span
            className="inline-block will-change-transform"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
              opacity: isVisible ? 1 : 0,
              transition: `all 500ms cubic-bezier(0.16, 1, 0.3, 1)`,
              transitionDelay: `${index * wordDelay}ms`
            }}
          >
            {word}
            {index < words.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </span>
  );
}

// Counter animation on scroll
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({ end, duration = 2000, suffix = '', prefix = '', className }: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [count, setCount] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setCount(Math.floor(eased * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}
