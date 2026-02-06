import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import slidePanelImage from '@/assets/panels/slidepanel.png';

export type ImagePanelsColorScheme = 'purple-cyan' | 'cyan-blue' | 'pink-purple' | 'green-teal' | 'amber-orange' | 'rose-pink';
export type ImagePanelsMode = 'dark' | 'light';

// Base hue rotation for each color scheme
const COLOR_SCHEME_HUE: Record<ImagePanelsColorScheme, number> = {
  'purple-cyan': 0,      // Original colors
  'cyan-blue': -30,      // Shift toward blue
  'pink-purple': 60,     // Shift toward pink
  'green-teal': -120,    // Shift toward green
  'amber-orange': 150,   // Shift toward orange
  'rose-pink': 90,       // Shift toward rose
};

interface ImagePanelsHeroProps {
  className?: string;
  colorScheme?: ImagePanelsColorScheme;
  mode?: ImagePanelsMode;
  brightness?: number;
  panelCount?: number;
}

interface PanelConfig {
  id: number;
  x: number;
  width: number;
  zIndex: number;
  speed: number;
  phase: number;
  depth: number;
  hueOffset: number;
}

export const ImagePanelsHero = memo(function ImagePanelsHero({
  className = '',
  colorScheme = 'purple-cyan',
  mode = 'dark',
  brightness = 50,
  panelCount = 5,
}: ImagePanelsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, isActive: false });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const brightnessMultiplier = 0.6 + (brightness / 100) * 0.8;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(240, 30%, 6%)', mid: 'hsl(250, 35%, 10%)' }
    : { base: 'hsl(230, 20%, 95%)', mid: 'hsl(230, 25%, 92%)' };

  // Base hue from color scheme
  const baseHue = COLOR_SCHEME_HUE[colorScheme] || 0;

  const actualPanelCount = Math.min(panelCount, 7);

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.0001);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.08,
          y: prev.y + (mousePos.y - prev.y) * 0.08,
        }));
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [mousePos.x, mousePos.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      isActive: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(prev => ({ ...prev, isActive: false }));
  }, []);

  // Calculate which panel is being hovered (accordion logic)
  const hoveredPanelIndex = mousePos.isActive
    ? Math.round(smoothedMouse.x * (actualPanelCount - 1))
    : -1;

  // Generate panel configurations with accordion widths
  const panels: (PanelConfig & { widthMultiplier: number; isHovered: boolean })[] = Array.from({ length: actualPanelCount }, (_, i) => {
    const distFromHovered = hoveredPanelIndex >= 0 ? Math.abs(i - hoveredPanelIndex) : actualPanelCount;
    
    // Accordion width multiplier
    let widthMultiplier = 1;
    if (mousePos.isActive && hoveredPanelIndex >= 0) {
      if (distFromHovered === 0) {
        widthMultiplier = 2.5; // Hovered panel expands
      } else if (distFromHovered === 1) {
        widthMultiplier = 1.2; // Adjacent panels
      } else {
        widthMultiplier = 0.6; // Other panels contract
      }
    }

    return {
      id: i,
      x: 0, // Will be calculated by flex
      width: 100, // Base width, flex will handle actual
      zIndex: hoveredPanelIndex === i ? actualPanelCount + 1 : actualPanelCount - distFromHovered,
      speed: 0.15 + (i * 0.05),
      phase: (i * Math.PI * 0.4),
      depth: 0.4 + (i * 0.15),
      hueOffset: i * 12,
      widthMultiplier,
      isHovered: hoveredPanelIndex === i,
    };
  });

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0 pointer-events-auto', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Base background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Accordion panels container */}
      <div className="absolute inset-0 flex items-stretch">
        {panels.map((panel) => {
          // Smooth horizontal sway
          const swayX = Math.sin(time * panel.speed + panel.phase) * 8;
          
          // Mouse parallax - panels move in 3D space
          const parallaxY = (smoothedMouse.y - 0.5) * 20 * panel.depth;

          // Subtle scale breathing
          const scaleY = panel.isHovered ? 1.02 : 1;
          
          // Edge glow intensity pulse
          const glowOpacity = panel.isHovered 
            ? 0.9 + Math.sin(time * 2) * 0.1
            : 0.5 + Math.sin(time * 0.8 + panel.phase) * 0.2;

          return (
            <div
              key={panel.id}
              className="relative h-full"
              style={{
                flex: `${panel.widthMultiplier} 1 0%`,
                zIndex: panel.zIndex,
                transform: `translateX(${swayX}px) translateY(${parallaxY}px) scaleY(${scaleY})`,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Main panel image */}
              <img
                src={slidePanelImage}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  filter: `brightness(${brightnessMultiplier * (panel.isHovered ? 1.2 : 1)}) hue-rotate(${baseHue + panel.hueOffset}deg)`,
                  opacity: panel.isHovered ? 1 : 0.8,
                  transition: 'filter 0.3s, opacity 0.3s',
                }}
              />

              {/* Left edge glow */}
              <div
                className="absolute inset-y-0 left-0 w-2 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, hsla(190, 100%, 70%, ${glowOpacity * brightnessMultiplier}), transparent)`,
                  boxShadow: panel.isHovered ? `0 0 20px hsla(190, 100%, 60%, 0.5)` : 'none',
                }}
              />

              {/* Right edge shadow */}
              <div
                className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                style={{
                  background: `linear-gradient(to left, hsla(240, 30%, 5%, 0.6), transparent)`,
                }}
              />

              {/* Hover highlight */}
              {panel.isHovered && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 50% ${smoothedMouse.y * 100}%, hsla(190, 100%, 70%, 0.15) 0%, transparent 60%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Ambient glow from panels */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? `radial-gradient(ellipse 60% 80% at 70% 50%, hsla(200, 80%, 50%, ${0.12 * brightnessMultiplier}) 0%, transparent 60%)`
            : `radial-gradient(ellipse 60% 80% at 70% 50%, hsla(200, 60%, 70%, ${0.1 * brightnessMultiplier}) 0%, transparent 60%)`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 35%, hsla(240, 30%, 4%, 0.6) 100%)'
            : 'radial-gradient(ellipse at center, transparent 45%, hsla(230, 20%, 92%, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default ImagePanelsHero;
