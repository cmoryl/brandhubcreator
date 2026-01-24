import { useState, useRef, useEffect, forwardRef, ImgHTMLAttributes, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blur?: boolean;
  priority?: boolean;
  placeholderColor?: string;
  onLoadComplete?: () => void;
  onLoadError?: () => void;
}

// Generate a tiny SVG placeholder for blur-up effect
const generatePlaceholder = (color: string = 'hsl(var(--muted))') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><rect fill="${color}" width="4" height="3"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Dominant color extraction would go here for real blur-up
// For now, we use muted background with gradient shimmer
const generateShimmerGradient = () => 
  'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 100%)';

/**
 * OptimizedImage - A performance-optimized image component with:
 * - Lazy loading via Intersection Observer
 * - Blur-up placeholder effect with shimmer animation
 * - Error fallback handling
 * - Aspect ratio preservation
 * - Priority preloading for LCP images
 */
export const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  aspectRatio,
  objectFit = 'cover',
  blur = true,
  priority = false,
  placeholderColor,
  className,
  onLoadComplete,
  onLoadError,
  style,
  ...props
}, ref) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    priority ? 'loading' : 'idle'
  );
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoaded = loadState === 'loaded';
  const hasError = loadState === 'error';

  // Memoize placeholder to prevent re-renders
  const placeholderSrc = useMemo(
    () => generatePlaceholder(placeholderColor),
    [placeholderColor]
  );

  // Intersection Observer for lazy loading with larger margin for smoother experience
  useEffect(() => {
    if (priority || isInView) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setLoadState('loading');
          observer.disconnect();
        }
      },
      { 
        rootMargin: '200px', // Start loading 200px before visible for smoother transitions
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Preload priority images using link preload
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const handleLoad = () => {
    setLoadState('loaded');
    onLoadComplete?.();
  };

  const handleError = () => {
    setLoadState('error');
    onLoadError?.();
  };

  const currentSrc = hasError ? fallbackSrc : src;

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(
        'relative overflow-hidden',
        aspectRatio && `aspect-[${aspectRatio}]`,
        className
      )}
      style={{
        ...style,
        aspectRatio: aspectRatio,
      }}
    >
      {/* Blur-up placeholder with shimmer animation */}
      <div 
        className={cn(
          'absolute inset-0 transition-opacity duration-500 ease-out',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
        aria-hidden="true"
      >
        {/* Base color layer */}
        <div className="absolute inset-0 bg-muted" />
        
        {/* Shimmer animation overlay */}
        <div 
          className={cn(
            'absolute inset-0 animate-shimmer',
            isLoaded && 'animate-none'
          )}
          style={{
            backgroundImage: generateShimmerGradient(),
            backgroundSize: '200% 100%',
          }}
        />
        
        {/* Blur placeholder image for actual blur-up effect */}
        {blur && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute inset-0 w-full h-full',
              objectFitClass,
              'blur-xl scale-110 opacity-50'
            )}
          />
        )}
      </div>
      
      {/* Actual image - only render when in view */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-all duration-500 ease-out',
            objectFitClass,
            isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[1.02]'
          )}
          {...props}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * BackgroundImage - Optimized background image with lazy loading
 */
interface BackgroundImageProps {
  src: string;
  fallbackSrc?: string;
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  priority?: boolean;
  parallax?: boolean;
  parallaxOffset?: number;
  onClick?: () => void;
}

export const BackgroundImage = forwardRef<HTMLDivElement, BackgroundImageProps>(({
  src,
  fallbackSrc,
  children,
  className,
  overlayClassName,
  priority = false,
  parallax = false,
  parallaxOffset = 0,
  onClick,
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer
  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setHasError(true);
      if (fallbackSrc) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => setIsLoaded(true);
        fallbackImg.src = fallbackSrc;
      }
    };
    img.src = src;
  }, [isInView, src, fallbackSrc]);

  const currentSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div 
      ref={(node) => {
        containerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn('relative overflow-hidden', className)}
      onClick={onClick}
    >
      {/* Background layer */}
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0',
          parallax && 'will-change-transform'
        )}
        style={{
          backgroundImage: isInView && currentSrc ? `url(${currentSrc})` : undefined,
          transform: parallax ? `translateY(${parallaxOffset}px) scale(1.1)` : undefined,
        }}
      />
      
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Overlay */}
      {overlayClassName && (
        <div className={cn('absolute inset-0', overlayClassName)} />
      )}
      
      {/* Content - Use absolute positioning to fill container for proper child positioning */}
      {children && (
        <div className="absolute inset-0 z-10">
          {children}
        </div>
      )}
    </div>
  );
});

BackgroundImage.displayName = 'BackgroundImage';

export default OptimizedImage;
