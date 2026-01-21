import { useState, useRef, useEffect, forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  blur?: boolean;
  priority?: boolean;
  onLoadComplete?: () => void;
  onLoadError?: () => void;
}

/**
 * OptimizedImage - A performance-optimized image component with:
 * - Lazy loading via Intersection Observer
 * - Blur-up placeholder effect
 * - Error fallback handling
 * - Aspect ratio preservation
 */
export const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  aspectRatio,
  objectFit = 'cover',
  blur = true,
  priority = false,
  className,
  onLoadComplete,
  onLoadError,
  style,
  ...props
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
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
        // Handle both refs
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
      {/* Placeholder/skeleton */}
      {!isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            blur && 'backdrop-blur-sm'
          )}
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClass,
            isLoaded ? 'opacity-100' : 'opacity-0',
            blur && !isLoaded && 'blur-sm scale-105'
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
