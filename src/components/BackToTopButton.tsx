import { useState, useEffect, useCallback } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackToTopButtonProps {
  /** Scroll threshold in pixels before showing the button */
  threshold?: number;
  /** Custom className for positioning */
  className?: string;
  /** Whether to show smooth scroll behavior */
  smooth?: boolean;
}

export const BackToTopButton = ({ 
  threshold = 400, 
  className,
  smooth = true 
}: BackToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsVisible(scrollTop > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    setIsScrolling(true);
    
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });

    // Reset scrolling state after animation completes
    setTimeout(() => setIsScrolling(false), 500);
  }, [smooth]);

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        'fixed z-50 shadow-lg transition-all duration-300 ease-out',
        'bg-background/80 backdrop-blur-md border border-border',
        'hover:bg-accent hover:text-accent-foreground hover:scale-110',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none',
        isScrolling && 'scale-95',
        className || 'bottom-6 right-6'
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className={cn(
        'h-5 w-5 transition-transform duration-200',
        isScrolling && '-translate-y-1'
      )} />
    </Button>
  );
};

export default BackToTopButton;
