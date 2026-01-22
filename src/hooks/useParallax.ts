import { useEffect, useState, useCallback } from 'react';

interface ParallaxOptions {
  speed?: number; // 0-1, lower = slower parallax
  maxOffset?: number; // Max pixel offset
}

export function useParallax({ speed = 0.5, maxOffset = 100 }: ParallaxOptions = {}) {
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const calculatedOffset = Math.min(scrollY * speed, maxOffset);
    setOffset(calculatedOffset);
  }, [speed, maxOffset]);

  useEffect(() => {
    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return offset;
}

// Hook for element-specific parallax with ref
export function useElementParallax(elementRef: React.RefObject<HTMLElement>, options: ParallaxOptions = {}) {
  const { speed = 0.3, maxOffset = 50 } = options;
  const [transform, setTransform] = useState('translateY(0px)');

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the element is through the viewport
      const elementCenter = rect.top + rect.height / 2;
      const progress = (viewportHeight - elementCenter) / viewportHeight;
      
      // Apply parallax only when element is in view
      if (rect.top < viewportHeight && rect.bottom > 0) {
        const offset = Math.min(Math.max(progress * 100 * speed, -maxOffset), maxOffset);
        setTransform(`translateY(${offset}px)`);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [elementRef, speed, maxOffset]);

  return transform;
}
