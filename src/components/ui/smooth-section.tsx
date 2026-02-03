import { motion, useInView } from 'framer-motion';
import { forwardRef, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

type SmoothAnimationType = 
  | 'fade-up' 
  | 'fade-down' 
  | 'fade-left' 
  | 'fade-right' 
  | 'zoom-in' 
  | 'blur-in'
  | 'slide-up'
  | 'spring-up';

const springTransition = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 20,
};

const easeTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const getAnimationConfig = (type: SmoothAnimationType, isVisible: boolean) => {
  const configs = {
    'fade-up': {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      transition: springTransition,
    },
    'fade-down': {
      initial: { opacity: 0, y: -40 },
      animate: { opacity: 1, y: 0 },
      transition: springTransition,
    },
    'fade-left': {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      transition: springTransition,
    },
    'fade-right': {
      initial: { opacity: 0, x: -40 },
      animate: { opacity: 1, x: 0 },
      transition: springTransition,
    },
    'zoom-in': {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
    'blur-in': {
      initial: { opacity: 0, filter: 'blur(12px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      transition: easeTransition,
    },
    'slide-up': {
      initial: { opacity: 0, y: 60 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
    'spring-up': {
      initial: { opacity: 0, y: 50, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { type: 'spring' as const, stiffness: 100, damping: 12, mass: 0.5 },
    },
  };

  const config = configs[type];
  return {
    ...config,
    animate: isVisible ? config.animate : config.initial,
  };
};

interface SmoothSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: SmoothAnimationType;
  delay?: number;
  once?: boolean;
}

export const SmoothSection = forwardRef<HTMLDivElement, SmoothSectionProps>(
  ({ children, className, animation = 'fade-up', delay = 0, once = true }, ref) => {
    const localRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || localRef;
    const isInView = useInView(resolvedRef, { once, margin: '-80px 0px' as any });
    
    const config = useMemo(() => getAnimationConfig(animation, isInView), [animation, isInView]);

    return (
      <motion.div
        ref={resolvedRef}
        className={cn('will-change-transform', className)}
        initial={config.initial}
        animate={config.animate}
        transition={{ ...config.transition, delay }}
      >
        {children}
      </motion.div>
    );
  }
);
SmoothSection.displayName = 'SmoothSection';

// Stagger grid for cards
interface SmoothGridProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  animation?: SmoothAnimationType;
}

export function SmoothGrid({ 
  children, 
  className, 
  staggerDelay = 0.08,
  animation = 'fade-up' 
}: SmoothGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px 0px' as any });

  const childArray = Array.isArray(children) ? children : [children];
  const config = useMemo(() => getAnimationConfig(animation, true), [animation]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {childArray.map((child, index) => (
        <motion.div
          key={index}
          className="will-change-transform"
          initial={config.initial}
          animate={isInView ? config.animate : config.initial}
          transition={{ ...config.transition, delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Smooth separator with fade
export function SmoothSeparator({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={cn('w-full', className)}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      style={{ originX: 0 }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </motion.div>
  );
}
