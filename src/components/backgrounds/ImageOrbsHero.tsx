import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import orb1Image from '@/assets/orbs/orb1.png';
import orb2Image from '@/assets/orbs/orb2.png';

export type ImageOrbsMode = 'dark' | 'light';

interface ImageOrbsHeroProps {
  className?: string;
  mode?: ImageOrbsMode;
  brightness?: number;
  orbCount?: number;
}

interface OrbConfig {
  id: number;
  image: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  rotation: number;
  depth: number;
}

export const ImageOrbsHero = memo(function ImageOrbsHero({
  className = '',
  mode = 'dark',
  brightness = 50,
  orbCount = 3,
}: ImageOrbsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const brightnessMultiplier = 0.5 + (brightness / 100) * 1.0;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(230, 25%, 5%)', mid: 'hsl(230, 30%, 8%)' }
    : { base: 'hsl(220, 20%, 96%)', mid: 'hsl(220, 25%, 94%)' };

  // Alternate between orb images
  const orbImages = [orb1Image, orb2Image];

  // Generate orb configurations
  const orbs: OrbConfig[] = Array.from({ length: Math.min(orbCount, 5) }, (_, i) => ({
    id: i,
    image: orbImages[i % 2],
    x: 15 + (i * 25) + (i % 2 === 0 ? 5 : -5),
    y: 20 + (i * 20) + (i % 2 === 0 ? 10 : -10),
    size: 300 + (i * 60) - (i % 2 === 0 ? 40 : 0),
    speed: 0.2 + (i * 0.1),
    phase: (i * Math.PI * 0.6),
    rotation: i * 45,
    depth: 0.5 + (i * 0.2),
  }));

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.00015);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.025,
          y: prev.y + (mousePos.y - prev.y) * 0.025,
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
      {/* Base background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${bgColors.mid} 0%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Floating image orbs */}
      {orbs.map((orb) => {
        // Calculate animated position with smooth sine waves
        const floatX = Math.sin(time * orb.speed + orb.phase) * 25;
        const floatY = Math.cos(time * orb.speed * 0.8 + orb.phase) * 18;
        
        // Mouse parallax effect - deeper orbs move more
        const parallaxX = (smoothedMouse.x - 0.5) * 50 * orb.depth;
        const parallaxY = (smoothedMouse.y - 0.5) * 35 * orb.depth;

        // Gentle pulse scale
        const pulseScale = 1 + Math.sin(time * 0.6 + orb.phase) * 0.06;
        
        // Slow rotation
        const rotationAngle = orb.rotation + time * 10;

        return (
          <div
            key={orb.id}
            className="absolute pointer-events-none"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: orb.size,
              height: orb.size,
              transform: `translate(-50%, -50%) translate(${floatX + parallaxX}px, ${floatY + parallaxY}px) scale(${pulseScale}) rotate(${rotationAngle}deg)`,
              transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              filter: `brightness(${brightnessMultiplier})`,
              opacity: 0.9,
            }}
          >
            <img
              src={orb.image}
              alt=""
              className="w-full h-full object-contain"
              style={{
                filter: 'blur(0px)',
              }}
            />
          </div>
        );
      })}

      {/* Additional ambient glow layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? `radial-gradient(ellipse 80% 60% at 50% 70%, hsla(200, 80%, 50%, ${0.08 * brightnessMultiplier}) 0%, transparent 60%)`
            : `radial-gradient(ellipse 80% 60% at 50% 70%, hsla(200, 60%, 70%, ${0.1 * brightnessMultiplier}) 0%, transparent 60%)`,
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 40%, hsla(230, 25%, 3%, 0.6) 100%)'
            : 'radial-gradient(ellipse at center, transparent 50%, hsla(220, 20%, 92%, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default ImageOrbsHero;
