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
    subtle: { parallaxStrength: 8, glowOpacity: 0.3, animationSpeed: 0.0008 },
    medium: { parallaxStrength: 15, glowOpacity: 0.5, animationSpeed: 0.001 },
    bold: { parallaxStrength: 25, glowOpacity: 0.7, animationSpeed: 0.0015 },
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

  // Generate bars with gradient colors
  const bars = Array.from({ length: barCount }, (_, i) => {
    const progress = i / (barCount - 1);
    const baseHue = 200 + progress * 60; // Cyan to purple range
    
    // Calculate parallax offset based on mouse position
    const parallaxX = mousePos.isActive 
      ? (mousePos.x - 0.5) * config.parallaxStrength * (1 - Math.abs(progress - 0.5))
      : 0;
    const parallaxY = mousePos.isActive 
      ? (mousePos.y - 0.5) * config.parallaxStrength * 0.3
      : 0;

    // Animated glow intensity
    const glowPhase = Math.sin(time + i * 0.8) * 0.3 + 0.7;
    const edgeGlow = Math.sin(time * 1.5 + i * 0.5) * 0.2 + 0.8;

    return {
      id: i,
      baseHue,
      parallaxX,
      parallaxY,
      glowPhase,
      edgeGlow,
      progress,
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
      {/* Dark base layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Animated gradient bars */}
      <div className="absolute inset-0 flex justify-center items-stretch">
        {bars.map((bar) => {
          const barWidth = 100 / barCount;
          const gap = barWidth * 0.15;
          
          return (
            <div
              key={bar.id}
              className="relative h-full transition-transform duration-300 ease-out"
              style={{
                width: `${barWidth}%`,
                transform: `translate(${bar.parallaxX}px, ${bar.parallaxY}px)`,
              }}
            >
              {/* Main gradient bar */}
              <div
                className="absolute inset-x-2 inset-y-0 rounded-lg overflow-hidden"
                style={{
                  background: `linear-gradient(
                    180deg,
                    hsla(${bar.baseHue + 20}, 80%, 60%, ${0.1 * bar.glowPhase}) 0%,
                    hsla(${bar.baseHue}, 70%, 50%, ${0.4 * bar.glowPhase}) 20%,
                    hsla(${bar.baseHue - 20}, 60%, 40%, ${0.5 * bar.glowPhase}) 50%,
                    hsla(${bar.baseHue + 40}, 70%, 50%, ${0.4 * bar.glowPhase}) 80%,
                    hsla(${bar.baseHue + 20}, 80%, 60%, ${0.1 * bar.glowPhase}) 100%
                  )`,
                  boxShadow: `
                    inset 0 0 60px hsla(${bar.baseHue}, 80%, 60%, ${0.15 * bar.edgeGlow}),
                    0 0 40px hsla(${bar.baseHue}, 70%, 50%, ${0.1 * config.glowOpacity})
                  `,
                }}
              />

              {/* Edge glow effect - left */}
              <div
                className="absolute left-1 top-0 bottom-0 w-1 rounded-full"
                style={{
                  background: `linear-gradient(
                    180deg,
                    transparent 0%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.6 * bar.edgeGlow}) 30%,
                    hsla(${bar.baseHue + 30}, 90%, 75%, ${0.8 * bar.edgeGlow}) 50%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.6 * bar.edgeGlow}) 70%,
                    transparent 100%
                  )`,
                  filter: `blur(2px)`,
                }}
              />

              {/* Edge glow effect - right */}
              <div
                className="absolute right-1 top-0 bottom-0 w-1 rounded-full"
                style={{
                  background: `linear-gradient(
                    180deg,
                    transparent 0%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.4 * bar.edgeGlow}) 30%,
                    hsla(${bar.baseHue + 30}, 90%, 75%, ${0.6 * bar.edgeGlow}) 50%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.4 * bar.edgeGlow}) 70%,
                    transparent 100%
                  )`,
                  filter: `blur(2px)`,
                }}
              />

              {/* Top glow accent */}
              <div
                className="absolute inset-x-3 top-0 h-32 rounded-b-full"
                style={{
                  background: `radial-gradient(
                    ellipse at center top,
                    hsla(${bar.baseHue + 40}, 100%, 80%, ${0.4 * bar.edgeGlow}) 0%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.2 * bar.edgeGlow}) 30%,
                    transparent 70%
                  )`,
                  filter: 'blur(8px)',
                }}
              />

              {/* Bottom glow accent */}
              <div
                className="absolute inset-x-3 bottom-0 h-32 rounded-t-full"
                style={{
                  background: `radial-gradient(
                    ellipse at center bottom,
                    hsla(${bar.baseHue + 40}, 100%, 80%, ${0.3 * bar.edgeGlow}) 0%,
                    hsla(${bar.baseHue + 30}, 90%, 70%, ${0.15 * bar.edgeGlow}) 30%,
                    transparent 70%
                  )`,
                  filter: 'blur(8px)',
                }}
              />

              {/* Interactive highlight following mouse Y */}
              {mousePos.isActive && (
                <div
                  className="absolute inset-x-2 h-40 rounded-full pointer-events-none transition-all duration-200"
                  style={{
                    top: `${mousePos.y * 100 - 10}%`,
                    background: `radial-gradient(
                      ellipse at center,
                      hsla(${bar.baseHue + 30}, 100%, 80%, ${0.25 * (1 - Math.abs(bar.progress - mousePos.x) * 2)}) 0%,
                      transparent 70%
                    )`,
                    filter: 'blur(20px)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Ambient particle dots */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => {
          const x = 10 + (i % 4) * 25 + Math.sin(time + i) * 3;
          const y = 15 + Math.floor(i / 4) * 30 + Math.cos(time * 0.7 + i) * 5;
          const opacity = 0.3 + Math.sin(time * 2 + i * 0.5) * 0.2;
          
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                background: `hsla(200, 90%, 70%, ${opacity})`,
                boxShadow: `0 0 8px hsla(200, 90%, 70%, ${opacity * 0.8})`,
              }}
            />
          );
        })}
      </div>

      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 30%,
            rgba(0, 0, 0, 0.3) 100%
          )`,
        }}
      />
    </div>
  );
});

export default GradientBarsHero;
