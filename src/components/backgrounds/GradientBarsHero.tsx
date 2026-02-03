import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface GradientBarsHeroProps {
  className?: string;
  barCount?: number;
  intensity?: 'subtle' | 'medium' | 'bold';
}

interface MousePosition {
  x: number;
  y: number;
  isActive: boolean;
}

export const GradientBarsHero = memo(function GradientBarsHero({
  className = '',
  barCount = 6,
  intensity = 'medium',
}: GradientBarsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5, isActive: false });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  // Intensity configurations
  const intensityConfig = {
    subtle: { parallaxStrength: 5, glowOpacity: 0.5, animationSpeed: 0.0005 },
    medium: { parallaxStrength: 10, glowOpacity: 0.7, animationSpeed: 0.0008 },
    bold: { parallaxStrength: 18, glowOpacity: 0.9, animationSpeed: 0.001 },
  };

  const config = intensityConfig[intensity];

  // Animation loop for subtle movement
  useEffect(() => {
    const animate = (timestamp: number) => {
      setTime(timestamp * config.animationSpeed);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [config.animationSpeed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y, isActive: true });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(prev => ({ ...prev, isActive: false }));
  }, []);

  // Generate overlapping accordion bars
  const bars = Array.from({ length: barCount }, (_, i) => {
    const progress = i / (barCount - 1);
    
    // Calculate parallax offset based on mouse position - bars move in opposite directions
    const depthFactor = (i - barCount / 2) / (barCount / 2); // -1 to 1
    const parallaxX = mousePos.isActive 
      ? (mousePos.x - 0.5) * config.parallaxStrength * depthFactor * -1
      : 0;

    // Subtle breathing animation
    const breathe = Math.sin(time + i * 0.5) * 2;

    return {
      id: i,
      parallaxX: parallaxX + breathe,
      progress,
      zIndex: barCount - Math.abs(i - Math.floor(barCount / 2)), // Center bars on top
    };
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-auto',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Dark base background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(230, 40%, 8%) 0%, hsl(240, 35%, 12%) 50%, hsl(230, 40%, 8%) 100%)'
        }}
      />

      {/* Accordion bars container */}
      <div className="absolute inset-0 flex justify-center items-stretch">
        {bars.map((bar, index) => {
          const barWidth = 100 / barCount;
          const overlap = barWidth * 0.08; // Slight overlap for depth
          
          return (
            <div
              key={bar.id}
              className="relative h-full transition-transform duration-200 ease-out"
              style={{
                width: `${barWidth + overlap}%`,
                marginLeft: index === 0 ? 0 : `-${overlap / 2}%`,
                transform: `translateX(${bar.parallaxX}px)`,
                zIndex: bar.zIndex,
              }}
            >
              {/* Main bar panel with 3D gradient */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  background: `linear-gradient(
                    90deg,
                    hsla(200, 90%, 60%, ${0.9 * config.glowOpacity}) 0%,
                    hsla(220, 80%, 55%, 0.8) 8%,
                    hsla(250, 60%, 45%, 0.9) 30%,
                    hsla(260, 55%, 40%, 0.95) 50%,
                    hsla(250, 60%, 45%, 0.9) 70%,
                    hsla(220, 80%, 55%, 0.8) 92%,
                    hsla(200, 90%, 60%, ${0.9 * config.glowOpacity}) 100%
                  )`,
                  boxShadow: `
                    inset 8px 0 40px hsla(200, 100%, 70%, ${0.3 * config.glowOpacity}),
                    inset -8px 0 30px hsla(260, 60%, 30%, 0.4)
                  `,
                }}
              >
                {/* Vertical gradient overlay for depth */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      hsla(200, 90%, 70%, 0.3) 0%,
                      transparent 15%,
                      transparent 50%,
                      hsla(260, 50%, 35%, 0.2) 85%,
                      hsla(200, 90%, 70%, 0.25) 100%
                    )`,
                  }}
                />

                {/* Left edge glow - the bright cyan edge */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-3"
                  style={{
                    background: `linear-gradient(
                      90deg,
                      hsla(195, 100%, 65%, ${config.glowOpacity}) 0%,
                      hsla(200, 90%, 60%, ${0.6 * config.glowOpacity}) 40%,
                      transparent 100%
                    )`,
                  }}
                />

                {/* Left edge highlight line */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      hsla(195, 100%, 80%, 0.2) 0%,
                      hsla(195, 100%, 75%, ${0.9 * config.glowOpacity}) 20%,
                      hsla(195, 100%, 80%, ${config.glowOpacity}) 50%,
                      hsla(195, 100%, 75%, ${0.9 * config.glowOpacity}) 80%,
                      hsla(195, 100%, 80%, 0.2) 100%
                    )`,
                    boxShadow: `0 0 12px hsla(195, 100%, 70%, ${0.8 * config.glowOpacity})`,
                  }}
                />

                {/* Right shadow edge for depth between bars */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-6"
                  style={{
                    background: `linear-gradient(
                      90deg,
                      transparent 0%,
                      hsla(240, 50%, 10%, 0.6) 70%,
                      hsla(240, 50%, 5%, 0.8) 100%
                    )`,
                  }}
                />
              </div>

              {/* Interactive mouse highlight */}
              {mousePos.isActive && (
                <div
                  className="absolute inset-x-0 h-48 pointer-events-none transition-all duration-150"
                  style={{
                    top: `${mousePos.y * 100 - 12}%`,
                    background: `radial-gradient(
                      ellipse 100% 80% at 50% 50%,
                      hsla(200, 100%, 70%, ${0.15 * (1 - Math.abs(bar.progress - mousePos.x) * 1.5)}) 0%,
                      transparent 70%
                    )`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Top edge ambient glow */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, hsla(200, 80%, 60%, 0.15) 0%, transparent 100%)',
        }}
      />

      {/* Bottom edge ambient glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(0deg, hsla(200, 80%, 60%, 0.12) 0%, transparent 100%)',
        }}
      />

      {/* Subtle vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsla(230, 40%, 5%, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default GradientBarsHero;
