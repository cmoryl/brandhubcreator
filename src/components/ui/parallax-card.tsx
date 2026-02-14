import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  imageClassName?: string;
  imageSrc?: string;
  imageAlt?: string;
  fallbackGradient?: string;
  parallaxIntensity?: number;
  scaleOnHover?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Mark image as high priority for LCP optimization */
  priority?: boolean;
  /** Responsive sizes attribute for the image */
  sizes?: string;
}

export function ParallaxCard({
  children,
  className,
  imageClassName,
  imageSrc,
  imageAlt = '',
  fallbackGradient,
  parallaxIntensity = 20,
  scaleOnHover = 1.1,
  onClick,
  style: externalStyle,
  priority = false,
  sizes,
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, translateX: 0, translateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate mouse position relative to card center (-1 to 1)
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    // Calculate rotation (inverted for natural feel)
    const rotateY = mouseX * 8; // Max 8 degrees rotation
    const rotateX = -mouseY * 6; // Max 6 degrees rotation

    // Calculate image translation for parallax
    const translateX = mouseX * parallaxIntensity;
    const translateY = mouseY * parallaxIntensity;

    setTransform({ rotateX, rotateY, translateX, translateY });
  }, [parallaxIntensity]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0, translateX: 0, translateY: 0 });
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative text-left overflow-hidden',
        'transition-shadow duration-500',
        className
      )}
      style={{
        ...externalStyle,
        transform: isHovering
          ? `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) translateY(-8px)`
          : 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)',
        transition: isHovering
          ? 'transform 0.1s ease-out, box-shadow 0.5s ease-out'
          : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.5s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Image container with parallax */}
      {(imageSrc || fallbackGradient) && (
        <div className={cn('relative overflow-hidden', imageClassName)}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              width={896}
              height={417}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding={priority ? 'sync' : 'async'}
              sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw'}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: isHovering
                  ? `scale(${scaleOnHover}) translate(${transform.translateX}px, ${transform.translateY}px)`
                  : 'scale(1) translate(0, 0)',
                transition: isHovering
                  ? 'transform 0.1s ease-out'
                  : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
          ) : (
            <div className={cn('absolute inset-0 bg-gradient-to-br', fallbackGradient)} />
          )}
          {/* Gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-colors duration-500"
            style={{
              opacity: isHovering ? 0.8 : 1,
            }}
          />
        </div>
      )}
      
      {/* Card content */}
      {children}

      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovering ? 0.15 : 0,
          background: `linear-gradient(
            ${105 + transform.rotateY * 5}deg,
            transparent 40%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 60%
          )`,
        }}
      />
    </button>
  );
}
