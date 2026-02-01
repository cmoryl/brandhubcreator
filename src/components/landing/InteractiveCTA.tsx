/**
 * Interactive CTA Section - Clean design with orbit-style decorations
 * Features: Multicolor connectors, mouse-reactive animations, orbit rings
 */

import { useRef, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

// Matching HeroOrbit type colors
const TYPE_COLORS = {
  brand: '#14b8a6',    // Teal
  product: '#38bdf8',  // Light blue  
  event: '#f59e0b',    // Amber
  accent: '#8b5cf6',   // Purple
};

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

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
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);
    setMousePos({ x, y });
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovering(false);
  }, [mouseX, mouseY]);

  // Generate orbit ring data
  const orbitRings = useMemo(() => [
    { radius: 180, opacity: 0.2, duration: 45, direction: 1, color: TYPE_COLORS.brand },
    { radius: 280, opacity: 0.15, duration: 60, direction: -1, color: TYPE_COLORS.product },
    { radius: 380, opacity: 0.12, duration: 75, direction: 1, color: TYPE_COLORS.event },
  ], []);

  // Generate orbit nodes with colors
  const orbitNodes = useMemo(() => {
    const nodes: Array<{ id: number; ring: number; angle: number; size: number; delay: number; color: string }> = [];
    let id = 0;
    
    // Ring 1 nodes (brand - teal)
    for (let i = 0; i < 4; i++) {
      nodes.push({ id: id++, ring: 0, angle: i * 90 + 15, size: 6, delay: i * 0.5, color: TYPE_COLORS.brand });
    }
    // Ring 2 nodes (product - blue)
    for (let i = 0; i < 6; i++) {
      nodes.push({ id: id++, ring: 1, angle: i * 60 + 30, size: 5, delay: i * 0.4, color: TYPE_COLORS.product });
    }
    // Ring 3 nodes (event - amber)
    for (let i = 0; i < 8; i++) {
      nodes.push({ id: id++, ring: 2, angle: i * 45 + 10, size: 4, delay: i * 0.3, color: TYPE_COLORS.event });
    }
    
    return nodes;
  }, []);

  // Generate multicolor connection lines
  const connections = useMemo(() => [
    { from: { ring: 0, angle: 15 }, to: { ring: 1, angle: 30 }, color: TYPE_COLORS.brand, toColor: TYPE_COLORS.product },
    { from: { ring: 0, angle: 105 }, to: { ring: 1, angle: 90 }, color: TYPE_COLORS.brand, toColor: TYPE_COLORS.product },
    { from: { ring: 1, angle: 150 }, to: { ring: 2, angle: 145 }, color: TYPE_COLORS.product, toColor: TYPE_COLORS.event },
    { from: { ring: 1, angle: 270 }, to: { ring: 2, angle: 280 }, color: TYPE_COLORS.product, toColor: TYPE_COLORS.event },
    { from: { ring: 0, angle: 285 }, to: { ring: 2, angle: 325 }, color: TYPE_COLORS.brand, toColor: TYPE_COLORS.event },
    { from: { ring: 0, angle: 195 }, to: { ring: 1, angle: 210 }, color: TYPE_COLORS.accent, toColor: TYPE_COLORS.product },
    { from: { ring: 1, angle: 330 }, to: { ring: 2, angle: 10 }, color: TYPE_COLORS.product, toColor: TYPE_COLORS.event },
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

  // Calculate speed multiplier based on hover
  const speedMultiplier = isHovering ? 0.5 : 1;

  return (
    <section 
      ref={containerRef}
      className="relative py-32 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle gradient background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      
      {/* Mouse-reactive radial glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(ellipse 60% 40% at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(var(--primary) / ${isHovering ? 0.2 : 0.1}), transparent)`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Orbit rings and decorations - centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg 
          className="absolute w-[800px] h-[800px]" 
          viewBox="-400 -400 800 800"
          animate={{ 
            opacity: isHovering ? 0.9 : 0.6,
            scale: isHovering ? 1.02 : 1,
          }}
          transition={{ duration: 0.4 }}
        >
          <defs>
            {/* Multicolor gradients for each connection */}
            {connections.map((conn, i) => (
              <linearGradient key={`grad-${i}`} id={`ctaGradient${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={conn.color} stopOpacity="0.6" />
                <stop offset="50%" stopColor={conn.toColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={conn.toColor} stopOpacity="0.6" />
              </linearGradient>
            ))}
            
            {/* Glow filters for each color */}
            <filter id="ctaGlowTeal" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={TYPE_COLORS.brand} floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="ctaGlowBlue" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={TYPE_COLORS.product} floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="ctaGlowAmber" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor={TYPE_COLORS.event} floodOpacity="0.5" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbit rings with colors */}
          {orbitRings.map((ring, i) => (
            <g key={i}>
              <circle
                cx="0"
                cy="0"
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={isHovering ? 1.5 : 1}
                strokeOpacity={isHovering ? ring.opacity * 1.5 : ring.opacity}
                strokeDasharray="4 8"
                style={{ transition: 'stroke-width 0.3s, stroke-opacity 0.3s' }}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to={`${360 * ring.direction} 0 0`}
                  dur={`${ring.duration * speedMultiplier}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Multicolor connection lines with animated flow */}
          {connections.map((conn, i) => {
            const from = getPosition(conn.from.ring, conn.from.angle);
            const to = getPosition(conn.to.ring, conn.to.angle);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 30;
            
            return (
              <g key={`conn-${i}`}>
                {/* Connection path with gradient */}
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={`url(#ctaGradient${i})`}
                  strokeWidth={isHovering ? 2 : 1.5}
                  strokeLinecap="round"
                  opacity={isHovering ? 0.7 : 0.4}
                  style={{ transition: 'stroke-width 0.3s, opacity 0.3s' }}
                />
                
                {/* Animated traveling dot with gradient color */}
                <circle r={isHovering ? 3 : 2} fill={conn.toColor} opacity="0.9">
                  <animateMotion
                    dur={`${(2 + i * 0.3) * speedMultiplier}s`}
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  />
                </circle>
                
                {/* Second traveling dot going backwards */}
                <circle r={isHovering ? 2.5 : 1.5} fill={conn.color} opacity="0.7">
                  <animateMotion
                    dur={`${(2.5 + i * 0.4) * speedMultiplier}s`}
                    repeatCount="indefinite"
                    path={`M ${to.x} ${to.y} Q ${midX} ${midY} ${from.x} ${from.y}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Orbit nodes with their type colors */}
          {orbitNodes.map((node) => {
            const pos = getPosition(node.ring, node.angle);
            const ringData = orbitRings[node.ring];
            const glowFilter = node.ring === 0 ? 'url(#ctaGlowTeal)' : node.ring === 1 ? 'url(#ctaGlowBlue)' : 'url(#ctaGlowAmber)';
            
            return (
              <g key={node.id}>
                {/* Node glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovering ? node.size + 6 : node.size + 4}
                  fill={node.color}
                  opacity={isHovering ? 0.25 : 0.15}
                  style={{ transition: 'r 0.3s, opacity 0.3s' }}
                >
                  <animate
                    attributeName="opacity"
                    values={isHovering ? "0.25;0.4;0.25" : "0.15;0.25;0.15"}
                    dur={`${2 + node.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * speedMultiplier}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size}
                  fill="hsl(var(--background))"
                  stroke={node.color}
                  strokeWidth={isHovering ? 2 : 1.5}
                  filter={isHovering ? glowFilter : undefined}
                  style={{ transition: 'stroke-width 0.3s' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * speedMultiplier}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Inner colored dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={node.size * 0.4}
                  fill={node.color}
                  opacity={isHovering ? 0.9 : 0.6}
                  style={{ transition: 'opacity 0.3s' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * speedMultiplier}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </motion.svg>
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
