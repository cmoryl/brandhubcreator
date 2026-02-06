import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export type GradientBarsColorScheme = 'cyan-purple' | 'blue-teal' | 'purple-pink' | 'green-cyan' | 'amber-orange' | 'custom';
export type GradientBarsMode = 'dark' | 'light';

interface GradientBarsHeroProps {
  className?: string;
  barCount?: number;
  intensity?: 'subtle' | 'medium' | 'bold';
  colorScheme?: GradientBarsColorScheme;
  mode?: GradientBarsMode;
  brightness?: number;
  customColors?: {
    primary: string;
    secondary: string;
  };
}

interface MousePosition {
  x: number;
  y: number;
  isActive: boolean;
  isPressed: boolean;
}

interface SmoothedPosition {
  x: number;
  y: number;
}

const COLOR_SCHEMES: Record<Exclude<GradientBarsColorScheme, 'custom'>, { primary: number; secondary: number }> = {
  'cyan-purple': { primary: 195, secondary: 260 },
  'blue-teal': { primary: 210, secondary: 180 },
  'purple-pink': { primary: 280, secondary: 330 },
  'green-cyan': { primary: 160, secondary: 195 },
  'amber-orange': { primary: 40, secondary: 25 },
};

export const GradientBarsHero = memo(function GradientBarsHero({
  className = '',
  barCount = 6,
  intensity = 'medium',
  colorScheme = 'cyan-purple',
  mode = 'dark',
  brightness = 50,
  customColors,
}: GradientBarsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5, isActive: false, isPressed: false });
  const [smoothedPos, setSmoothedPos] = useState<SmoothedPosition>({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; timestamp: number }[]>([]);
  const animationRef = useRef<number>(0);
  const rippleIdRef = useRef(0);

  const colors = colorScheme === 'custom' && customColors 
    ? { primary: parseInt(customColors.primary), secondary: parseInt(customColors.secondary) }
    : COLOR_SCHEMES[colorScheme === 'custom' ? 'cyan-purple' : colorScheme];

  const brightnessMultiplier = 0.3 + (brightness / 100) * 1.2;

  const bgColors = mode === 'dark' 
    ? { base: 'hsl(230, 40%, 8%)', mid: 'hsl(240, 35%, 12%)', shadow: 0.9 }
    : { base: 'hsl(220, 20%, 92%)', mid: 'hsl(220, 25%, 96%)', shadow: 0.3 };

  const intensityConfig = {
    subtle: { parallaxStrength: 6, glowOpacity: 0.45, animationSpeed: 0.0004, smoothing: 0.04, expandStrength: 25, magnetStrength: 15 },
    medium: { parallaxStrength: 12, glowOpacity: 0.65, animationSpeed: 0.0006, smoothing: 0.06, expandStrength: 45, magnetStrength: 30 },
    bold: { parallaxStrength: 20, glowOpacity: 0.9, animationSpeed: 0.0008, smoothing: 0.1, expandStrength: 70, magnetStrength: 50 },
  };

  const config = intensityConfig[intensity];

  // Clean up old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRipples(prev => prev.filter(r => now - r.timestamp < 1500));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;
    
    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * config.animationSpeed);
        setSmoothedPos(prev => ({
          x: prev.x + (mousePos.x - prev.x) * config.smoothing,
          y: prev.y + (mousePos.y - prev.y) * config.smoothing,
        }));
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [config.animationSpeed, config.smoothing, mousePos.x, mousePos.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos(prev => ({ ...prev, x, y, isActive: true }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(prev => ({ ...prev, isActive: false, isPressed: false }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos(prev => ({ ...prev, isPressed: true }));
    
    // Add ripple effect
    setRipples(prev => [...prev, { id: rippleIdRef.current++, x, y, timestamp: Date.now() }]);
  }, []);

  const handleMouseUp = useCallback(() => {
    setMousePos(prev => ({ ...prev, isPressed: false }));
  }, []);

  // Find which bar the mouse is hovering over (accordion logic)
  const hoveredBarIndex = mousePos.isActive
    ? Math.round(smoothedPos.x * (barCount - 1))
    : -1;

  // Generate bars with accordion effect
  const bars = Array.from({ length: barCount }, (_, i) => {
    const progress = i / (barCount - 1);
    const centerIndex = (barCount - 1) / 2;
    const distFromCenter = i - centerIndex;
    const normalizedDist = distFromCenter / centerIndex; // -1 to 1
    
    // Calculate distance from hovered bar (for accordion)
    const distFromHovered = hoveredBarIndex >= 0 ? Math.abs(i - hoveredBarIndex) : barCount;
    
    // Accordion width calculation
    // Hovered bar = expanded (3x), adjacent = medium (1.5x), others = contracted (0.6x)
    let widthMultiplier = 1;
    if (mousePos.isActive && hoveredBarIndex >= 0) {
      if (distFromHovered === 0) {
        widthMultiplier = 3; // Hovered bar is 3x wider
      } else if (distFromHovered === 1) {
        widthMultiplier = 1.5; // Adjacent bars are 1.5x
      } else if (distFromHovered === 2) {
        widthMultiplier = 0.8; // Two away
      } else {
        widthMultiplier = 0.5; // Far bars contract
      }
    }
    
    // Mouse proximity for glow effects
    const barXPos = progress;
    const mouseDistToBar = Math.abs(smoothedPos.x - barXPos);

    // Smooth wave animation
    const wavePhase = time + i * 0.5;
    const primaryWave = Math.sin(wavePhase) * 3;
    const secondaryWave = Math.sin(wavePhase * 0.6 + Math.PI / 4) * 2;
    const combinedWave = primaryWave + secondaryWave;

    // Scale effect - hovered bar gets taller
    const scaleY = hoveredBarIndex === i ? 1.02 : 1;

    // Rotation tilt toward mouse (subtle)
    const rotateZ = mousePos.isActive && distFromHovered <= 2
      ? (smoothedPos.x - barXPos) * 2
      : 0;

    // Glow pulse when hovered
    const glowPulse = hoveredBarIndex === i
      ? 1 + Math.sin(time * 6) * 0.15
      : 1;

    return {
      id: i,
      parallaxX: combinedWave,
      progress,
      zIndex: hoveredBarIndex === i ? barCount + 1 : barCount - distFromHovered,
      waveOffset: combinedWave,
      scaleY,
      rotateZ,
      widthMultiplier,
      glowIntensity: hoveredBarIndex === i ? 1.8 * glowPulse : distFromHovered <= 1 ? 1.2 : 1,
      isHovered: hoveredBarIndex === i,
      isNearHovered: distFromHovered <= 1,
      mouseProximity: 1 - Math.min(mouseDistToBar * 3, 1),
    };
  });

  const getBarGradient = (index: number, isNearMouse: boolean, mouseProximity: number) => {
    const { primary, secondary } = colors;
    const lightness = mode === 'dark' ? 55 : 45;
    const saturation = mode === 'dark' ? 90 : 70;
    
    // Shift hue slightly when near mouse for color interaction
    const hueShift = isNearMouse ? mouseProximity * 15 : 0;
    
    return `linear-gradient(
      95deg,
      hsla(${primary + hueShift}, 100%, ${lightness * brightnessMultiplier}%, 0.95) 0%,
      hsla(${primary + 15 + hueShift}, ${saturation}%, ${(lightness - 5) * brightnessMultiplier}%, 0.9) 15%,
      hsla(${(primary + secondary) / 2 + hueShift}, 70%, ${(lightness - 10) * brightnessMultiplier}%, 0.95) 40%,
      hsla(${secondary + hueShift}, 60%, ${(lightness - 15) * brightnessMultiplier}%, 0.98) 60%,
      hsla(${secondary - 10 + hueShift}, 65%, ${(lightness - 12) * brightnessMultiplier}%, 0.95) 80%,
      hsla(${primary + 25 + hueShift}, 85%, ${(lightness - 7) * brightnessMultiplier}%, 0.9) 95%,
      hsla(${primary + hueShift}, 100%, ${lightness * brightnessMultiplier}%, 0.9) 100%
    )`;
  };

  const getEdgeGlow = (glowIntensity: number) => {
    const { primary } = colors;
    const lightness = mode === 'dark' ? 65 : 50;
    return `hsla(${primary - 5}, 100%, ${lightness}%, ${config.glowOpacity * glowIntensity})`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-auto z-0',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      aria-hidden="true"
    >
      {/* Base background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`
        }}
      />

      {/* Click ripple effects */}
      {ripples.map(ripple => {
        const age = (Date.now() - ripple.timestamp) / 1500;
        return (
          <div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{
              left: `${ripple.x * 100}%`,
              top: `${ripple.y * 100}%`,
              width: 300 + age * 400,
              height: 300 + age * 400,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, hsla(${colors.primary}, 100%, 70%, ${0.4 * (1 - age)}) 0%, transparent 70%)`,
              borderRadius: '50%',
            }}
          />
        );
      })}

      {/* Energy lines connecting bars when mouse is active */}
      {mousePos.isActive && (
        <svg className="absolute inset-0 pointer-events-none z-10" style={{ overflow: 'visible' }}>
          {bars.slice(0, -1).map((bar, i) => {
            const nextBar = bars[i + 1];
            const midX = (bar.progress + nextBar.progress) / 2;
            const distToMouse = Math.abs(smoothedPos.x - midX);
            if (distToMouse > 0.25) return null;
            
            const opacity = (1 - distToMouse * 4) * 0.5;
            const x1 = bar.progress * 100;
            const x2 = nextBar.progress * 100;
            const curveY = smoothedPos.y * 100;
            
            return (
              <path
                key={`connection-${i}`}
                d={`M ${x1}% 50% Q ${midX * 100}% ${curveY}% ${x2}% 50%`}
                fill="none"
                stroke={`hsla(${colors.primary}, 100%, 70%, ${opacity})`}
                strokeWidth="2"
                style={{
                  filter: `drop-shadow(0 0 8px hsla(${colors.primary}, 100%, 60%, ${opacity}))`,
                }}
              />
            );
          })}
        </svg>
      )}

      {/* Accordion bars container */}
      <div className="absolute inset-0 flex justify-center items-stretch z-0">
        {bars.map((bar, index) => {
          // Dynamic width based on accordion state
          const baseWidth = 100 / barCount;
          const accordionWidth = baseWidth * bar.widthMultiplier;
          
          return (
            <div
              key={bar.id}
              className="relative h-full origin-center"
              style={{
                width: `${accordionWidth}%`,
                flex: `${bar.widthMultiplier} 1 0%`,
                transform: `translateX(${bar.parallaxX}px) scaleY(${bar.scaleY}) rotate(${bar.rotateZ}deg)`,
                zIndex: bar.zIndex,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Main bar panel */}
              <div
                className="absolute inset-0 overflow-hidden rounded-sm"
                style={{
                  background: getBarGradient(index, bar.isHovered, bar.mouseProximity),
                  boxShadow: `
                    inset 10px 0 45px hsla(${colors.primary}, 100%, 70%, ${0.35 * config.glowOpacity * bar.glowIntensity}),
                    inset -8px 0 35px hsla(${colors.secondary}, 60%, 28%, ${0.45 * bgColors.shadow}),
                    -5px 0 20px hsla(${colors.secondary - 20}, 50%, 15%, ${0.4 * bgColors.shadow}),
                    ${bar.isHovered ? `0 0 40px hsla(${colors.primary}, 100%, 60%, 0.5)` : ''}
                  `,
                  filter: `brightness(${brightnessMultiplier * (bar.isHovered ? 1.2 : bar.isNearHovered ? 1.1 : 1)})`,
                }}
              >
                {/* Vertical gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(
                      180deg,
                      hsla(${colors.primary}, 100%, 75%, 0.25) 0%,
                      transparent 12%,
                      transparent 50%,
                      hsla(${colors.secondary}, 50%, 30%, 0.15) 88%,
                      hsla(${colors.primary}, 100%, 70%, 0.2) 100%
                    )`,
                  }}
                />

                {/* Left edge glow */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-4"
                  style={{
                    background: `linear-gradient(
                      90deg,
                      ${getEdgeGlow(bar.glowIntensity)} 0%,
                      hsla(${colors.primary}, 95%, 58%, ${0.7 * config.glowOpacity * bar.glowIntensity}) 35%,
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
                      hsla(${colors.primary - 5}, 100%, 85%, 0.15) 0%,
                      hsla(${colors.primary - 5}, 100%, 80%, ${config.glowOpacity * 0.95 * bar.glowIntensity}) 15%,
                      hsla(${colors.primary - 5}, 100%, 85%, ${config.glowOpacity * bar.glowIntensity}) 50%,
                      hsla(${colors.primary - 5}, 100%, 80%, ${config.glowOpacity * 0.95 * bar.glowIntensity}) 85%,
                      hsla(${colors.primary - 5}, 100%, 85%, 0.15) 100%
                    )`,
                    boxShadow: `0 0 ${14 * bar.glowIntensity}px hsla(${colors.primary - 5}, 100%, 70%, ${0.85 * config.glowOpacity * bar.glowIntensity})`,
                  }}
                />

                {/* Right shadow edge */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-10"
                  style={{
                    background: mode === 'dark' 
                      ? `linear-gradient(90deg, transparent 0%, hsla(${colors.secondary - 20}, 55%, 8%, 0.7) 60%, hsla(${colors.secondary - 20}, 55%, 4%, 0.9) 100%)`
                      : `linear-gradient(90deg, transparent 0%, hsla(${colors.secondary - 20}, 20%, 70%, 0.3) 60%, hsla(${colors.secondary - 20}, 25%, 60%, 0.5) 100%)`,
                  }}
                />

                {/* Pulse ring when hovered */}
                {bar.isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% ${smoothedPos.y * 100}%, hsla(${colors.primary}, 100%, 75%, 0.2) 0%, transparent 60%)`,
                    }}
                  />
                )}
              </div>

              {/* Mouse-following highlight */}
              {mousePos.isActive && bar.isHovered && (
                <div
                  className="absolute inset-x-0 h-72 pointer-events-none"
                  style={{
                    top: `${smoothedPos.y * 100 - 18}%`,
                    background: `radial-gradient(
                      ellipse 120% 70% at 50% 50%,
                      hsla(${colors.primary}, 100%, 75%, 0.35) 0%,
                      transparent 65%
                    )`,
                    transition: 'opacity 0.25s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Top ambient glow */}
      <div 
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background: `linear-gradient(180deg, hsla(${colors.primary}, 80%, 60%, ${0.12 * brightnessMultiplier}) 0%, transparent 100%)`,
        }}
      />

      {/* Bottom ambient glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background: `linear-gradient(0deg, hsla(${colors.primary}, 80%, 60%, ${0.1 * brightnessMultiplier}) 0%, transparent 100%)`,
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 40%, hsla(230, 40%, 5%, 0.4) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, hsla(220, 20%, 95%, 0.3) 100%)',
        }}
      />
    </div>
  );
});

export default GradientBarsHero;
