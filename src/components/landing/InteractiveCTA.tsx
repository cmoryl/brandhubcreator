/**
 * Interactive CTA Section - Mouse-reactive orbit with proximity effects
 * Features: Multicolor rings, proximity-based interactions, dynamic glow
 */

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
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

interface RingState {
  isHovered: boolean;
  intensity: number;
}

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [svgMousePos, setSvgMousePos] = useState({ x: 0, y: 0 });
  const [ringStates, setRingStates] = useState<RingState[]>([
    { isHovered: false, intensity: 0 },
    { isHovered: false, intensity: 0 },
    { isHovered: false, intensity: 0 },
  ]);

  // Motion values for subtle 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle 3D perspective transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  // Generate orbit ring data
  const orbitRings = useMemo(() => [
    { radius: 180, baseOpacity: 0.2, duration: 45, direction: 1, color: TYPE_COLORS.brand, name: 'Brands' },
    { radius: 280, baseOpacity: 0.15, duration: 60, direction: -1, color: TYPE_COLORS.product, name: 'Products' },
    { radius: 380, baseOpacity: 0.12, duration: 75, direction: 1, color: TYPE_COLORS.event, name: 'Events' },
  ], []);

  // Calculate distance from mouse to each ring
  const updateRingStates = useCallback((mouseX: number, mouseY: number) => {
    const distFromCenter = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    
    const newStates = orbitRings.map((ring, i) => {
      const distToRing = Math.abs(distFromCenter - ring.radius);
      const threshold = 60; // How close mouse needs to be to activate
      const isHovered = distToRing < threshold;
      const intensity = isHovered ? Math.max(0, 1 - distToRing / threshold) : 0;
      return { isHovered, intensity };
    });
    
    setRingStates(newStates);
  }, [orbitRings]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);
    setMousePos({ x, y });

    // Calculate mouse position in SVG coordinates
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const svgX = ((e.clientX - rect.left) - centerX) * (800 / Math.min(rect.width, 800));
    const svgY = ((e.clientY - rect.top) - centerY) * (800 / Math.min(rect.height, 800));
    setSvgMousePos({ x: svgX, y: svgY });
    updateRingStates(svgX, svgY);
  }, [mouseX, mouseY, updateRingStates]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovering(false);
    setRingStates(orbitRings.map(() => ({ isHovered: false, intensity: 0 })));
  }, [mouseX, mouseY, orbitRings]);

  // Generate orbit nodes with colors
  const orbitNodes = useMemo(() => {
    const nodes: Array<{ id: number; ring: number; angle: number; size: number; delay: number; color: string }> = [];
    let id = 0;
    
    for (let i = 0; i < 4; i++) {
      nodes.push({ id: id++, ring: 0, angle: i * 90 + 15, size: 6, delay: i * 0.5, color: TYPE_COLORS.brand });
    }
    for (let i = 0; i < 6; i++) {
      nodes.push({ id: id++, ring: 1, angle: i * 60 + 30, size: 5, delay: i * 0.4, color: TYPE_COLORS.product });
    }
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
  const getSpeedMultiplier = (ringIndex: number) => {
    if (ringStates[ringIndex]?.isHovered) return 0.3;
    if (isHovering) return 0.7;
    return 1;
  };

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
      
      {/* Mouse-reactive radial glow that follows cursor */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(ellipse 40% 30% at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(var(--primary) / ${isHovering ? 0.15 : 0.05}), transparent)`,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Orbit rings and decorations - centered behind content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg 
          ref={svgRef}
          className="absolute w-[800px] h-[800px]" 
          viewBox="-400 -400 800 800"
          animate={{ 
            opacity: isHovering ? 0.95 : 0.6,
          }}
          transition={{ duration: 0.3 }}
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
            
            {/* Dynamic glow filters for each ring */}
            {orbitRings.map((ring, i) => (
              <filter key={`glow-${i}`} id={`ctaRingGlow${i}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={4 + ringStates[i].intensity * 6} result="blur" />
                <feFlood floodColor={ring.color} floodOpacity={0.4 + ringStates[i].intensity * 0.4} />
                <feComposite in2="blur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            
            {/* Mouse proximity glow */}
            <radialGradient id="mouseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Mouse proximity indicator */}
          {isHovering && (
            <circle
              cx={svgMousePos.x}
              cy={svgMousePos.y}
              r="80"
              fill="url(#mouseGlow)"
              style={{ transition: 'cx 0.1s, cy 0.1s' }}
            />
          )}

          {/* Orbit rings with proximity-reactive styling */}
          {orbitRings.map((ring, i) => {
            const state = ringStates[i];
            const opacity = ring.baseOpacity + state.intensity * 0.4;
            const strokeWidth = 1 + state.intensity * 2;
            
            return (
              <g key={i}>
                {/* Outer glow ring when hovered */}
                {state.isHovered && (
                  <circle
                    cx="0"
                    cy="0"
                    r={ring.radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={8 + state.intensity * 12}
                    strokeOpacity={0.1 + state.intensity * 0.15}
                    filter={`url(#ctaRingGlow${i})`}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to={`${360 * ring.direction} 0 0`}
                      dur={`${ring.duration * getSpeedMultiplier(i)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                
                {/* Main ring */}
                <circle
                  cx="0"
                  cy="0"
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeDasharray={state.isHovered ? "8 4" : "4 8"}
                  style={{ transition: 'stroke-width 0.3s, stroke-opacity 0.3s, stroke-dasharray 0.3s' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${360 * ring.direction} 0 0`}
                    dur={`${ring.duration * getSpeedMultiplier(i)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Ring label when hovered */}
                {state.intensity > 0.5 && (
                  <text
                    x={ring.radius + 15}
                    y="0"
                    fill={ring.color}
                    fontSize="12"
                    fontWeight="500"
                    opacity={state.intensity}
                    style={{ transition: 'opacity 0.2s' }}
                  >
                    {ring.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Multicolor connection lines with animated flow */}
          {connections.map((conn, i) => {
            const from = getPosition(conn.from.ring, conn.from.angle);
            const to = getPosition(conn.to.ring, conn.to.angle);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 30;
            const fromRingHovered = ringStates[conn.from.ring]?.isHovered;
            const toRingHovered = ringStates[conn.to.ring]?.isHovered;
            const isActive = fromRingHovered || toRingHovered;
            
            return (
              <g key={`conn-${i}`} style={{ opacity: isActive ? 1 : (isHovering ? 0.6 : 0.4), transition: 'opacity 0.3s' }}>
                {/* Connection path with gradient */}
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={`url(#ctaGradient${i})`}
                  strokeWidth={isActive ? 3 : (isHovering ? 2 : 1.5)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-width 0.3s' }}
                />
                
                {/* Animated traveling dot */}
                <circle r={isActive ? 4 : (isHovering ? 3 : 2)} fill={conn.toColor} opacity="0.9">
                  <animateMotion
                    dur={`${(2 + i * 0.3) * (isActive ? 0.4 : isHovering ? 0.6 : 1)}s`}
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  />
                </circle>
                
                {/* Second traveling dot going backwards */}
                <circle r={isActive ? 3 : (isHovering ? 2 : 1.5)} fill={conn.color} opacity="0.7">
                  <animateMotion
                    dur={`${(2.5 + i * 0.4) * (isActive ? 0.4 : isHovering ? 0.6 : 1)}s`}
                    repeatCount="indefinite"
                    path={`M ${to.x} ${to.y} Q ${midX} ${midY} ${from.x} ${from.y}`}
                  />
                </circle>
              </g>
            );
          })}

          {/* Orbit nodes with proximity-reactive effects */}
          {orbitNodes.map((node) => {
            const pos = getPosition(node.ring, node.angle);
            const ringData = orbitRings[node.ring];
            const ringState = ringStates[node.ring];
            const isRingActive = ringState?.isHovered;
            const nodeSize = node.size + (isRingActive ? ringState.intensity * 3 : 0);
            
            return (
              <g key={node.id}>
                {/* Node outer glow - enhanced when ring is hovered */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize + 8 + (isRingActive ? ringState.intensity * 8 : 0)}
                  fill={node.color}
                  opacity={isRingActive ? 0.2 + ringState.intensity * 0.2 : 0.1}
                  style={{ transition: 'r 0.3s, opacity 0.3s' }}
                >
                  <animate
                    attributeName="opacity"
                    values={isRingActive ? "0.3;0.5;0.3" : "0.1;0.2;0.1"}
                    dur={`${2 + node.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * getSpeedMultiplier(node.ring)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node core */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize}
                  fill="hsl(var(--background))"
                  stroke={node.color}
                  strokeWidth={isRingActive ? 2 + ringState.intensity : 1.5}
                  style={{ transition: 'r 0.3s, stroke-width 0.3s' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * getSpeedMultiplier(node.ring)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Inner colored dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize * 0.5}
                  fill={node.color}
                  opacity={isRingActive ? 0.9 : 0.6}
                  style={{ transition: 'r 0.3s, opacity 0.3s' }}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * ringData.direction} 0 0`}
                    dur={`${ringData.duration * getSpeedMultiplier(node.ring)}s`}
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
