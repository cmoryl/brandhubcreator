import { useState, useRef, useEffect, forwardRef, ImgHTMLAttributes, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Standard responsive breakpoints for srcset generation
const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536, 1920] as const;

// Common sizes presets for different layout contexts
export const IMAGE_SIZES = {
  // Full-width hero images
  hero: '100vw',
  // Card images in grid layouts
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  // Thumbnail images
  thumbnail: '(max-width: 640px) 50vw, 200px',
  // Portal card images (3-column grid)
  portalCard: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  // Product/brand cards
  guideCard: '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px',
} as const;

export type ImageSizePreset = keyof typeof IMAGE_SIZES;

interface ResponsiveImageSource {
  src: string;
  width: number;
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError' | 'sizes'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  /** Responsive image sources for srcset */
  responsiveSources?: ResponsiveImageSource[];
  /** Sizes attribute - use IMAGE_SIZES presets or custom string */
  sizes?: ImageSizePreset | string;
  /** Auto-generate srcset from src (for Supabase storage URLs) */
  autoSrcset?: boolean;
  onLoadComplete?: () => void;
  onLoadError?: () => void;
}

// Shimmer gradient for loading state
const generateShimmerGradient = () => 
  'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 50%, hsl(var(--muted)) 100%)';

/**
 * Generate srcset string from responsive sources
 */
const generateSrcset = (sources: ResponsiveImageSource[]): string => {
  return sources
    .sort((a, b) => a.width - b.width)
    .map(({ src, width }) => `${src} ${width}w`)
    .join(', ');
};

/**
 * Auto-generate srcset for Supabase storage URLs using transform API
 * Works with URLs like: https://xxx.supabase.co/storage/v1/object/public/bucket/path
 */
const generateAutoSrcset = (src: string): string | undefined => {
  // Check if it's a Supabase storage URL
  if (!src.includes('supabase.co/storage') && !src.includes('supabase.in/storage')) {
    return undefined;
  }

  // Generate srcset using Supabase image transformation
  return RESPONSIVE_WIDTHS
    .map(width => {
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}width=${width} ${width}w`;
    })
    .join(', ');
};

/**
 * Resolve sizes prop - either use preset or custom string
 */
const resolveSizes = (sizes: ImageSizePreset | string | undefined): string | undefined => {
  if (!sizes) return undefined;
  if (sizes in IMAGE_SIZES) {
    return IMAGE_SIZES[sizes as ImageSizePreset];
  }
  return sizes;
};

/**
 * OptimizedImage - A performance-optimized image component with:
 * - Lazy loading via Intersection Observer
 * - Blur-up placeholder effect with shimmer animation
 * - Responsive srcset support for different viewport sizes
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
  priority = false,
  responsiveSources,
  sizes,
  autoSrcset = false,
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

  // Compute srcset and sizes
  const computedSrcset = useMemo(() => {
    if (responsiveSources && responsiveSources.length > 0) {
      return generateSrcset(responsiveSources);
    }
    if (autoSrcset) {
      return generateAutoSrcset(src);
    }
    return undefined;
  }, [responsiveSources, autoSrcset, src]);

  const computedSizes = useMemo(() => resolveSizes(sizes), [sizes]);

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

  // Preload priority images using link preload with srcset support
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      
      // Add imagesrcset and imagesizes for responsive preloading
      if (computedSrcset) {
        link.setAttribute('imagesrcset', computedSrcset);
      }
      if (computedSizes) {
        link.setAttribute('imagesizes', computedSizes);
      }
      
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, computedSrcset, computedSizes]);

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
      {/* Blur-up placeholder with shimmer animation - single unified layer */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          aria-hidden="true"
        >
          {/* Base color + shimmer in one layer */}
          <div 
            className="absolute inset-0 bg-muted animate-shimmer"
            style={{
              backgroundImage: generateShimmerGradient(),
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}
      
      {/* Actual image - only render when in view */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={hasError ? undefined : computedSrcset}
          sizes={computedSizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
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
 * BackgroundImage - Optimized background image/video with lazy loading
 */
interface BackgroundImageProps {
  src: string;
  fallbackSrc?: string;
  /** Optional video source for animated backgrounds (MP4/WebM) */
  videoSrc?: string;
  /** Whether to prefer video over image when both are available */
  preferVideo?: boolean;
  /** Whether to apply Ken Burns (slow pan/zoom) effect to background */
  kenBurnsEffect?: boolean;
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
  videoSrc,
  preferVideo = true,
  kenBurnsEffect = false,
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
  const [videoError, setVideoError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine if we should show video
  const showVideo = videoSrc && preferVideo && !videoError;

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
      {/* Video background layer */}
      {showVideo && isInView && (
        <video
          ref={videoRef}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            parallax && 'will-change-transform'
          )}
          style={{
            transform: parallax ? `translateY(${parallaxOffset}px) scale(1.1)` : undefined,
          }}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Image background layer (fallback or primary) */}
      {!showVideo && (
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            parallax && !kenBurnsEffect && 'will-change-transform',
            kenBurnsEffect && 'animate-ken-burns'
          )}
          style={{
            backgroundImage: isInView && currentSrc ? `url(${currentSrc})` : undefined,
            transform: parallax && !kenBurnsEffect ? `translateY(${parallaxOffset}px) scale(1.1)` : undefined,
          }}
        />
      )}
      
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
