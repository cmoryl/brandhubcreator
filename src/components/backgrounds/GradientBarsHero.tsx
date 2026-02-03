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

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Generate overlapping accordion bars with heavy overlap
  const bars = Array.from({ length: barCount }, (_, i) => {
    const progress = i / (barCount - 1);
    
    // Calculate parallax offset based on mouse position - bars move in opposite directions
    const depthFactor = (i - barCount / 2) / (barCount / 2); // -1 to 1
    const parallaxX = mousePos.isActive 
      ? (mousePos.x - 0.5) * config.parallaxStrength * depthFactor * -1
      : 0;

    // Subtle breathing animation
    const breathe = Math.sin(time + i * 0.5) * 2;
    
    // Hover lift effect
    const isHovered = hoveredBar === i;
    const hoverOffset = isHovered ? -8 : 0;
    const hoverScale = isHovered ? 1.02 : 1;

    return {
      id: i,
      parallaxX: parallaxX + breathe,
      progress,
      zIndex: isHovered ? 100 : barCount - Math.abs(i - Math.floor(barCount / 2)),
      hoverOffset,
      hoverScale,
      isHovered,
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
          const barWidth = 100 / (barCount * 0.4); // Wider bars for more overlap
          const overlap = barWidth * 0.65; // Heavy overlap - 65% of bar width
          
          return (
            <div
              key={bar.id}
              className="relative h-full cursor-pointer"
              style={{
                width: `${barWidth}%`,
                marginLeft: index === 0 ? 0 : `-${overlap}%`,
                transform: `translateX(${bar.parallaxX}px) translateY(${bar.hoverOffset}px) scale(${bar.hoverScale})`,
                zIndex: bar.zIndex,
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.1s',
              }}
              onMouseEnter={() => setHoveredBar(bar.id)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Main bar panel with 3D gradient */}
              <div
                className="absolute inset-0 overflow-hidden rounded-sm"
                style={{
                  background: `linear-gradient(
                    95deg,
                    hsla(195, 100%, 55%, ${0.95 * config.glowOpacity}) 0%,
                    hsla(210, 90%, 50%, 0.9) 15%,
                    hsla(240, 70%, 45%, 0.95) 40%,
                    hsla(260, 60%, 38%, 0.98) 60%,
                    hsla(250, 65%, 42%, 0.95) 80%,
                    hsla(220, 85%, 48%, 0.9) 95%,
                    hsla(195, 100%, 55%, ${0.9 * config.glowOpacity}) 100%
                  )`,
                  boxShadow: bar.isHovered
                    ? `
                      inset 12px 0 50px hsla(195, 100%, 70%, ${0.5 * config.glowOpacity}),
                      inset -10px 0 40px hsla(260, 60%, 25%, 0.5),
                      0 0 40px hsla(195, 100%, 60%, 0.4),
                      0 10px 30px hsla(240, 50%, 20%, 0.6)
                    `
                    : `
                      inset 10px 0 45px hsla(195, 100%, 70%, ${0.35 * config.glowOpacity}),
                      inset -8px 0 35px hsla(260, 60%, 28%, 0.45),
                      -5px 0 20px hsla(240, 50%, 15%, 0.4)
                    `,
                  filter: bar.isHovered ? 'brightness(1.15)' : 'brightness(1)',
                  transition: 'box-shadow 0.3s ease, filter 0.3s ease',
                }}
              >
                {/* Vertical gradient overlay for depth */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      hsla(195, 100%, 75%, ${bar.isHovered ? 0.4 : 0.25}) 0%,
                      transparent 12%,
                      transparent 50%,
                      hsla(260, 50%, 30%, 0.15) 88%,
                      hsla(195, 100%, 70%, ${bar.isHovered ? 0.35 : 0.2}) 100%
                    )`,
                  }}
                />

                {/* Left edge glow - the bright cyan edge */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: bar.isHovered ? '16px' : '12px',
                    background: `linear-gradient(
                      90deg,
                      hsla(190, 100%, 65%, ${config.glowOpacity * (bar.isHovered ? 1.2 : 1)}) 0%,
                      hsla(195, 95%, 58%, ${0.7 * config.glowOpacity}) 35%,
                      transparent 100%
                    )`,
                    transition: 'width 0.3s ease',
                  }}
                />

                {/* Left edge highlight line */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: bar.isHovered ? '3px' : '2px',
                    background: `linear-gradient(
                      180deg,
                      hsla(190, 100%, 85%, 0.15) 0%,
                      hsla(190, 100%, 80%, ${config.glowOpacity * (bar.isHovered ? 1.3 : 0.95)}) 15%,
                      hsla(190, 100%, 85%, ${config.glowOpacity * (bar.isHovered ? 1.2 : 1)}) 50%,
                      hsla(190, 100%, 80%, ${config.glowOpacity * (bar.isHovered ? 1.3 : 0.95)}) 85%,
                      hsla(190, 100%, 85%, 0.15) 100%
                    )`,
                    boxShadow: bar.isHovered 
                      ? `0 0 20px hsla(190, 100%, 70%, ${config.glowOpacity}), 0 0 40px hsla(190, 100%, 60%, 0.5)`
                      : `0 0 14px hsla(190, 100%, 70%, ${0.85 * config.glowOpacity})`,
                    transition: 'width 0.3s ease, box-shadow 0.3s ease',
                  }}
                />

                {/* Right shadow edge for depth between bars */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-10"
                  style={{
                    background: `linear-gradient(
                      90deg,
                      transparent 0%,
                      hsla(240, 55%, 8%, 0.7) 60%,
                      hsla(240, 55%, 4%, 0.9) 100%
                    )`,
                  }}
                />
                
                {/* Inner highlight on hover */}
                {bar.isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(
                        ellipse 60% 40% at 30% 50%,
                        hsla(195, 100%, 70%, 0.15) 0%,
                        transparent 70%
                      )`,
                    }}
                  />
                )}
              </div>

              {/* Interactive mouse highlight */}
              {mousePos.isActive && (
                <div
                  className="absolute inset-x-0 h-56 pointer-events-none"
                  style={{
                    top: `${mousePos.y * 100 - 14}%`,
                    background: `radial-gradient(
                      ellipse 100% 70% at 50% 50%,
                      hsla(195, 100%, 72%, ${0.2 * (1 - Math.abs(bar.progress - mousePos.x) * 1.2)}) 0%,
                      transparent 65%
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
