import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface GridLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

export function InteractiveHeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gridLines, setGridLines] = useState<GridLine[]>([]);
  
  // Mouse position with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  // Transform mouse position to gradient position
  const gradientX = useTransform(smoothX, [0, 1], ['20%', '80%']);
  const gradientY = useTransform(smoothY, [0, 1], ['20%', '80%']);

  // Initialize particles and grid
  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);

    // Create grid lines
    const lines: GridLine[] = [];
    const gridSize = 8;
    for (let i = 0; i <= gridSize; i++) {
      // Horizontal lines
      lines.push({
        id: i,
        x1: 0,
        y1: (100 / gridSize) * i,
        x2: 100,
        y2: (100 / gridSize) * i,
        delay: i * 0.1,
      });
      // Vertical lines
      lines.push({
        id: i + gridSize + 1,
        x1: (100 / gridSize) * i,
        y1: 0,
        x2: (100 / gridSize) * i,
        y2: 100,
        delay: i * 0.1 + 0.05,
      });
    }
    setGridLines(lines);
  }, []);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* Animated grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]">
        {gridLines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="hsl(var(--accent))"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: line.delay, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* Mouse-reactive gradient orb */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          left: gradientX,
          top: gradientY,
          x: '-50%',
          y: '-50%',
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Secondary reactive orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          left: useTransform(smoothX, [0, 1], ['60%', '30%']),
          top: useTransform(smoothY, [0, 1], ['60%', '30%']),
          x: '-50%',
          y: '-50%',
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-accent"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(particle.id) * 10, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: 3 + particle.speed,
            repeat: Infinity,
            delay: particle.id * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing nodes that react to mouse */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.circle
            key={i}
            r="3"
            cx={`${25 + i * 12}%`}
            cy={`${30 + i * 10}%`}
            fill="hsl(var(--accent))"
            animate={{
              opacity: [0.2, 0.6, 0.2],
              r: [3, 5, 3],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
      </svg>

      {/* Scan line effect */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/30 to-transparent pointer-events-none"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Pulsing corner accents */}
      {[
        { top: 0, left: 0, rotate: 0 },
        { top: 0, right: 0, rotate: 90 },
        { bottom: 0, right: 0, rotate: 180 },
        { bottom: 0, left: 0, rotate: 270 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-32 h-32 pointer-events-none"
          style={{
            ...pos,
            transform: `rotate(${pos.rotate}deg)`,
          }}
        >
          <motion.div
            className="absolute top-4 left-4 w-16 h-[2px] bg-gradient-to-r from-accent to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-4 left-4 w-[2px] h-16 bg-gradient-to-b from-accent to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3], scaleY: [1, 1.2, 1] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        </motion.div>
      ))}

      {/* Animated border glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        />
      </div>
    </div>
  );
}
