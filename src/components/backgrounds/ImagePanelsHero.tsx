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
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const brightnessMultiplier = 0.6 + (brightness / 100) * 0.8;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(240, 30%, 6%)', mid: 'hsl(250, 35%, 10%)' }
    : { base: 'hsl(230, 20%, 95%)', mid: 'hsl(230, 25%, 92%)' };

  // Base hue from color scheme
  const baseHue = COLOR_SCHEME_HUE[colorScheme] || 0;

  // Generate panel configurations - overlapping vertical bars with wider panels
  const panels: PanelConfig[] = Array.from({ length: Math.min(panelCount, 7) }, (_, i) => ({
    id: i,
    x: 5 + (i * 18), // Spread across width with overlap
    width: 380 + (i % 2 === 0 ? 40 : -20), // Much wider panels (was 180)
    zIndex: i + 1,
    speed: 0.15 + (i * 0.05),
    phase: (i * Math.PI * 0.4),
    depth: 0.4 + (i * 0.15),
    hueOffset: i * 12, // Slight hue variation per panel
  }));

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.0001);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.02,
          y: prev.y + (mousePos.y - prev.y) * 0.02,
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
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0', className)}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    >
      {/* Base background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Image panels with parallax */}
      {panels.map((panel) => {
        // Smooth horizontal sway
        const swayX = Math.sin(time * panel.speed + panel.phase) * 15;
        
        // Mouse parallax - panels move in 3D space
        const parallaxX = (smoothedMouse.x - 0.5) * 60 * panel.depth;
        const parallaxY = (smoothedMouse.y - 0.5) * 20 * panel.depth;

        // Subtle scale breathing
        const scale = 1 + Math.sin(time * 0.5 + panel.phase) * 0.03;
        
        // Edge glow intensity pulse
        const glowOpacity = 0.6 + Math.sin(time * 0.8 + panel.phase) * 0.3;

        return (
          <div
            key={panel.id}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${panel.x}%`,
              width: panel.width,
              zIndex: panel.zIndex,
              transform: `translateX(${swayX + parallaxX}px) translateY(${parallaxY}px) scaleY(${scale})`,
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Main panel image */}
            <img
              src={slidePanelImage}
              alt=""
              className="h-full w-full object-cover object-right"
              style={{
                filter: `brightness(${brightnessMultiplier}) hue-rotate(${baseHue + panel.hueOffset}deg)`,
                opacity: 0.85,
              }}
            />

            {/* Edge glow overlay */}
            <div
              className="absolute inset-y-0 right-0 w-8 pointer-events-none"
              style={{
                background: `linear-gradient(to left, hsla(190, 100%, 60%, ${0.4 * glowOpacity * brightnessMultiplier}), transparent)`,
                filter: 'blur(4px)',
              }}
            />
          </div>
        );
      })}

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
