import { useEffect, useRef, useState, useCallback } from 'react';

export type AnimationType = 
  | 'fade-up' 
  | 'fade-down' 
  | 'fade-left' 
  | 'fade-right' 
  | 'zoom-in' 
  | 'zoom-out'
  | 'flip-up'
  | 'flip-down'
  | 'blur-in'
  | 'rotate-in';

export interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  duration?: number;
  animation?: AnimationType;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  delay = 0,
  duration = 600,
  animation = 'fade-up'
}: UseScrollAnimationOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasAnimated(true);
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  const getAnimationStyles = useCallback(() => {
    const baseStyles = {
      transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      transitionDelay: `${delay}ms`,
    };

    const animations: Record<AnimationType, { initial: React.CSSProperties; visible: React.CSSProperties }> = {
      'fade-up': {
        initial: { opacity: 0, transform: 'translateY(40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' }
      },
      'fade-down': {
        initial: { opacity: 0, transform: 'translateY(-40px)' },
        visible: { opacity: 1, transform: 'translateY(0)' }
      },
      'fade-left': {
        initial: { opacity: 0, transform: 'translateX(40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
      },
      'fade-right': {
        initial: { opacity: 0, transform: 'translateX(-40px)' },
        visible: { opacity: 1, transform: 'translateX(0)' }
      },
      'zoom-in': {
        initial: { opacity: 0, transform: 'scale(0.8)' },
        visible: { opacity: 1, transform: 'scale(1)' }
      },
      'zoom-out': {
        initial: { opacity: 0, transform: 'scale(1.2)' },
        visible: { opacity: 1, transform: 'scale(1)' }
      },
      'flip-up': {
        initial: { opacity: 0, transform: 'perspective(1000px) rotateX(45deg)' },
        visible: { opacity: 1, transform: 'perspective(1000px) rotateX(0)' }
      },
      'flip-down': {
        initial: { opacity: 0, transform: 'perspective(1000px) rotateX(-45deg)' },
        visible: { opacity: 1, transform: 'perspective(1000px) rotateX(0)' }
      },
      'blur-in': {
        initial: { opacity: 0, filter: 'blur(10px)' },
        visible: { opacity: 1, filter: 'blur(0)' }
      },
      'rotate-in': {
        initial: { opacity: 0, transform: 'rotate(-10deg) scale(0.9)' },
        visible: { opacity: 1, transform: 'rotate(0) scale(1)' }
      }
    };

    const animConfig = animations[animation];
    const state = isVisible || hasAnimated ? animConfig.visible : animConfig.initial;

    return { ...baseStyles, ...state };
  }, [animation, delay, duration, isVisible, hasAnimated]);

  return { ref, isVisible, style: getAnimationStyles() };
}

// Hook for staggered animations on children
export function useStaggeredAnimation(
  itemCount: number,
  baseDelay: number = 100,
  animation: AnimationType = 'fade-up'
) {
  const getItemDelay = useCallback((index: number) => index * baseDelay, [baseDelay]);
  
  return { getItemDelay, animation };
}

// Hook for parallax scrolling
export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      const parallaxOffset = scrolled * speed * 0.1;
      
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset, style: { transform: `translateY(${offset}px)` } };
}
