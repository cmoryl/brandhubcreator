import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import orb1Image from '@/assets/orbs/orb1.png';
import orb2Image from '@/assets/orbs/orb2.png';

export type ImageOrbsColorScheme = 'cyan-purple' | 'blue-cyan' | 'pink-magenta' | 'green-teal' | 'amber-orange' | 'rose-coral';
export type ImageOrbsMode = 'dark' | 'light';

const COLOR_SCHEME_HUE: Record<ImageOrbsColorScheme, number> = {
  'cyan-purple': 0,
  'blue-cyan': -20,
  'pink-magenta': 80,
  'green-teal': -100,
  'amber-orange': 160,
  'rose-coral': 100,
};

interface ImageOrbsHeroProps {
  className?: string;
  colorScheme?: ImageOrbsColorScheme;
  mode?: ImageOrbsMode;
  brightness?: number;
  orbCount?: number;
}

interface OrbState {
  id: number;
  image: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  speed: number;
  phase: number;
  rotation: number;
  depth: number;
  hueOffset: number;
  isDragging: boolean;
}

const FRICTION = 0.96;
const BOUNCE_DAMPING = 0.7;

export const ImageOrbsHero = memo(function ImageOrbsHero({
  className = '',
  colorScheme = 'cyan-purple',
  mode = 'dark',
  brightness = 50,
  orbCount = 3,
}: ImageOrbsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);
  const dragRef = useRef<{ orbId: number | null; startX: number; startY: number; lastX: number; lastY: number; lastTime: number }>({
    orbId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  });

  const brightnessMultiplier = 0.5 + (brightness / 100) * 1.0;
  const baseHue = COLOR_SCHEME_HUE[colorScheme] || 0;
  const orbImages = [orb1Image, orb2Image];

  const bgColors = mode === 'dark'
    ? { base: 'hsl(230, 25%, 5%)', mid: 'hsl(230, 30%, 8%)' }
    : { base: 'hsl(220, 20%, 96%)', mid: 'hsl(220, 25%, 94%)' };

  // Initialize orb states
  const [orbs, setOrbs] = useState<OrbState[]>(() =>
    Array.from({ length: Math.min(orbCount, 5) }, (_, i) => ({
      id: i,
      image: orbImages[i % 2],
      baseX: 15 + (i * 25) + (i % 2 === 0 ? 5 : -5),
      baseY: 20 + (i * 20) + (i % 2 === 0 ? 10 : -10),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 300 + (i * 60) - (i % 2 === 0 ? 40 : 0),
      speed: 0.2 + (i * 0.1),
      phase: i * Math.PI * 0.6,
      rotation: i * 45,
      depth: 0.5 + (i * 0.2),
      hueOffset: i * 10,
      isDragging: false,
    }))
  );

  // Physics and animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.00015);
        
        setOrbs(prevOrbs => prevOrbs.map(orb => {
          if (orb.isDragging) return orb;

          let newVx = orb.vx * FRICTION;
          let newVy = orb.vy * FRICTION;
          let newX = orb.x + newVx;
          let newY = orb.y + newVy;

          // Boundary bounce (keep orbs within reasonable bounds)
          const maxOffset = 200;
          if (Math.abs(newX) > maxOffset) {
            newX = Math.sign(newX) * maxOffset;
            newVx = -newVx * BOUNCE_DAMPING;
          }
          if (Math.abs(newY) > maxOffset) {
            newY = Math.sign(newY) * maxOffset;
            newVy = -newVy * BOUNCE_DAMPING;
          }

          // Return to base position slowly when velocity is low
          if (Math.abs(newVx) < 0.1 && Math.abs(newVy) < 0.1) {
            newX *= 0.98;
            newY *= 0.98;
          }

          return {
            ...orb,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        }));

        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });

    // Handle dragging
    if (dragRef.current.orbId !== null) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      const now = performance.now();
      const dt = Math.max(now - dragRef.current.lastTime, 1);

      setOrbs(prevOrbs => prevOrbs.map(orb => {
        if (orb.id !== dragRef.current.orbId) return orb;
        return {
          ...orb,
          x: orb.x + dx,
          y: orb.y + dy,
          vx: (dx / dt) * 16,
          vy: (dy / dt) * 16,
        };
      }));

      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      dragRef.current.lastTime = now;
    }
  }, []);

  const handleOrbMouseDown = useCallback((e: React.MouseEvent, orbId: number) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      orbId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
    };
    setOrbs(prevOrbs => prevOrbs.map(orb =>
      orb.id === orbId ? { ...orb, isDragging: true, vx: 0, vy: 0 } : orb
    ));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.orbId !== null) {
      const orbId = dragRef.current.orbId;
      setOrbs(prevOrbs => prevOrbs.map(orb =>
        orb.id === orbId ? { ...orb, isDragging: false } : orb
      ));
      dragRef.current.orbId = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0 pointer-events-auto', className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Base background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${bgColors.mid} 0%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Draggable image orbs */}
      {orbs.map((orb) => {
        const floatX = Math.sin(time * orb.speed + orb.phase) * 25;
        const floatY = Math.cos(time * orb.speed * 0.8 + orb.phase) * 18;
        const parallaxX = (mousePos.x - 0.5) * 50 * orb.depth;
        const parallaxY = (mousePos.y - 0.5) * 35 * orb.depth;
        const pulseScale = 1 + Math.sin(time * 0.6 + orb.phase) * 0.06;
        const rotationAngle = orb.rotation + time * 10;

        // Combine base animation with drag offset
        const totalX = orb.isDragging ? orb.x : floatX + parallaxX + orb.x;
        const totalY = orb.isDragging ? orb.y : floatY + parallaxY + orb.y;
        const scale = orb.isDragging ? pulseScale * 1.1 : pulseScale;

        return (
          <div
            key={orb.id}
            className="absolute select-none"
            style={{
              left: `${orb.baseX}%`,
              top: `${orb.baseY}%`,
              width: orb.size,
              height: orb.size,
              transform: `translate(-50%, -50%) translate(${totalX}px, ${totalY}px) scale(${scale}) rotate(${rotationAngle}deg)`,
              transition: orb.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: orb.isDragging ? 'grabbing' : 'grab',
              zIndex: orb.isDragging ? 100 : 10 + orb.id,
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => handleOrbMouseDown(e, orb.id)}
          >
            <img
              src={orb.image}
              alt=""
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              style={{
                filter: `brightness(${brightnessMultiplier}) hue-rotate(${baseHue + orb.hueOffset}deg) ${orb.isDragging ? 'drop-shadow(0 0 30px hsla(200, 100%, 70%, 0.6))' : ''}`,
              }}
            />
          </div>
        );
      })}

      {/* Ambient glow layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? `radial-gradient(ellipse 80% 60% at 50% 70%, hsla(200, 80%, 50%, ${0.08 * brightnessMultiplier}) 0%, transparent 60%)`
            : `radial-gradient(ellipse 80% 60% at 50% 70%, hsla(200, 60%, 70%, ${0.1 * brightnessMultiplier}) 0%, transparent 60%)`,
        }}
      />

      {/* Vignette */}
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
