/**
 * Interactive CTA Section - Clean design with orbit-style decorations
 * Features: Subtle gradients, orbit rings, animated connectors, elegant buttons
 */

import { useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for subtle 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle 3D perspective transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Generate orbit ring data
  const orbitRings = useMemo(() => [
    { radius: 180, opacity: 0.15, duration: 45, direction: 1 },
    { radius: 280, opacity: 0.1, duration: 60, direction: -1 },
    { radius: 380, opacity: 0.08, duration: 75, direction: 1 },
  ], []);

  // Generate orbit nodes (small dots on the rings)
  const orbitNodes = useMemo(() => {
    const nodes: Array<{ id: number; ring: number; angle: number; size: number; delay: number }> = [];
    let id = 0;
    
    // Ring 1 nodes
    for (let i = 0; i < 4; i++) {
      nodes.push({ id: id++, ring: 0, angle: i * 90 + 15, size: 6, delay: i * 0.5 });
    }
    // Ring 2 nodes
    for (let i = 0; i < 6; i++) {
      nodes.push({ id: id++, ring: 1, angle: i * 60 + 30, size: 5, delay: i * 0.4 });
    }
    // Ring 3 nodes  
    for (let i = 0; i < 8; i++) {
      nodes.push({ id: id++, ring: 2, angle: i * 45 + 10, size: 4, delay: i * 0.3 });
    }
    
    return nodes;
  }, []);

  // Generate connection lines between some nodes
  const connections = useMemo(() => [
    { from: { ring: 0, angle: 15 }, to: { ring: 1, angle: 30 } },
    { from: { ring: 0, angle: 105 }, to: { ring: 1, angle: 90 } },
    { from: { ring: 1, angle: 150 }, to: { ring: 2, angle: 145 } },
    { from: { ring: 1, angle: 270 }, to: { ring: 2, angle: 280 } },
    { from: { ring: 0, angle: 285 }, to: { ring: 2, angle: 325 } },
  ], []);

  // Helper to calculate position from ring and angle
  const getPosition = (ring: number, angle: number) => {
    const radius = orbitRings[ring]?.radius || 200;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-32 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle gradient background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      
      {/* Subtle radial glow */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(var(--primary) / 0.15), transparent)',
        }}
      />

      {/* Orbit rings and decorations - centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg 
          className="absolute w-[800px] h-[800px]" 
          viewBox="-400 -400 800 800"
          style={{ opacity: 0.6 }}
        >
          <defs>
            {/* Gradient for connection lines */}
            <linearGradient id="ctaLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
            
            {/* Glow filter for nodes */}
            <filter id="ctaNodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Animated dash pattern */}
            <pattern id="ctaDashPattern" patternUnits="userSpaceOnUse" width="20" height="1">
              <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Orbit rings */}
          {orbitRings.map((ring, i) => (
            <g key={i}>
              {/* Main ring */}
              <circle
                cx="0"
                cy="0"
                r={ring.radius}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeOpacity={ring.opacity}
                strokeDasharray="4 8"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 0 0`}
                  to={`${360 * ring.direction} 0 0`}
                  dur={`${ring.duration}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Connection lines with animated flow */}
          {connections.map((conn, i) => {
            const from = getPosition(conn.from.ring, conn.from.angle);
            const to = getPosition(conn.to.ring, conn.to.angle);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 20;
            
            return (
              <g key={`conn-${i}`}>
                {/* Connection path */}
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke="url(#ctaLineGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                
                {/* Animated traveling dot */}
                <circle r="2" fill="hsl(var(--primary))" opacity="0.8" filter="url(#ctaNodeGlow)">
                  <animateMotion
                    dur={`${3 + i * 0.5}s`}
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Orbit nodes */}
          {orbitNodes.map((node) => {
            const pos = getPosition(node.ring, node.angle);
            const ringData = orbitRings[node.ring];
            
            return (
              <g key={node.id}>
                {/* Node glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size + 4}
                  fill="hsl(var(--primary))"
                  opacity="0.1"
                >
                  <animate
                    attributeName="opacity"
                    values="0.1;0.2;0.1"
                    dur={`${2 + node.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                  filter="url(#ctaNodeGlow)"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 0 0`}
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size * 0.4}
                  fill="hsl(var(--primary))"
                  opacity="0.6"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from={`0 0 0`}
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Main content with subtle 3D perspective */}
      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ perspective: 1200 }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Ready to Transform?</span>
          </motion.div>

          {/* Main headline */}
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="text-foreground">Let's </span>
            <span className="relative inline-block">
              <span className="text-primary">Build</span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </span>
            <span className="text-foreground"> Something</span>
            <br />
            <span className="text-accent">Amazing</span>
            <span className="text-foreground"> Together</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join the brands that trust BrandHub for their identity management.
            Start your journey today.
          </motion.p>

          {/* Clean buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Primary CTA */}
            <motion.button
              onClick={() => navigate('/auth')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              onClick={() => navigate('/demo/brand/brandhub')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-muted/50 border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Explore Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/20 to-transparent" />
    </section>
  );
}
