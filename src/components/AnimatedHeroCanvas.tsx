import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface AnimatedHeroCanvasProps {
  className?: string;
}

export function AnimatedHeroCanvas({ className = '' }: AnimatedHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const orbsRef = useRef<Orb[]>([]);
  const animationRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

  const initOrbs = useCallback((width: number, height: number) => {
    const isDark = resolvedTheme === 'dark';
    const colors = isDark
      ? [
          'rgba(56, 189, 248, 0.15)', // sky-400
          'rgba(99, 102, 241, 0.12)', // indigo-500
          'rgba(139, 92, 246, 0.1)',  // violet-500
          'rgba(59, 130, 246, 0.13)', // blue-500
          'rgba(14, 165, 233, 0.11)', // sky-500
        ]
      : [
          'rgba(56, 189, 248, 0.2)',  // sky-400
          'rgba(99, 102, 241, 0.15)', // indigo-500
          'rgba(139, 92, 246, 0.12)', // violet-500
          'rgba(59, 130, 246, 0.18)', // blue-500
          'rgba(14, 165, 233, 0.14)', // sky-500
        ];

    const orbs: Orb[] = [];
    const count = 7;

    for (let i = 0; i < count; i++) {
      const baseRadius = 100 + Math.random() * 200;
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: baseRadius,
        baseRadius,
        color: colors[i % colors.length],
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    return orbs;
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      orbsRef.current = initOrbs(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      time += 0.016;

      orbsRef.current.forEach((orb) => {
        // Update pulse
        orb.pulsePhase += orb.pulseSpeed;
        orb.radius = orb.baseRadius + Math.sin(orb.pulsePhase) * 30;

        // Mouse interaction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - orb.x;
          const dy = mouseRef.current.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 300;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.5;
            orb.vx += dx * force * 0.001;
            orb.vy += dy * force * 0.001;
          }
        }

        // Apply velocity with damping
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vx *= 0.99;
        orb.vy *= 0.99;

        // Soft boundary wrapping
        if (orb.x < -orb.radius) orb.x = rect.width + orb.radius;
        if (orb.x > rect.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = rect.height + orb.radius;
        if (orb.y > rect.height + orb.radius) orb.y = -orb.radius;

        // Draw orb with radial gradient
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, '0.05)'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw connection lines between nearby orbs
      orbsRef.current.forEach((orb, i) => {
        orbsRef.current.slice(i + 1).forEach((other) => {
          const dx = other.x - orb.x;
          const dy = other.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 350;

          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(orb.x, orb.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Subtle grid overlay
      const gridSize = 80;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 0.5;

      for (let x = 0; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }

      for (let y = 0; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initOrbs, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'auto' }}
    />
  );
}
