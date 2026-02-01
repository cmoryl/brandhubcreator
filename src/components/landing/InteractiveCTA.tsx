/**
 * Interactive CTA Section - Mouse-reactive orbit with proximity effects
 * Features: Multicolor rings, proximity-based interactions, clean connectors
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
};

// Orbit ring configuration
const ORBIT_RINGS = [
  { radius: 160, baseOpacity: 0.25, duration: 50, direction: 1, color: TYPE_COLORS.brand, name: 'Brands' },
  { radius: 250, baseOpacity: 0.2, duration: 65, direction: -1, color: TYPE_COLORS.product, name: 'Products' },
  { radius: 340, baseOpacity: 0.15, duration: 80, direction: 1, color: TYPE_COLORS.event, name: 'Events' },
] as const;

// Static node positions (angle in degrees)
const NODE_CONFIG = [
  // Ring 0 - Brands (4 nodes)
  { ring: 0, angle: 0, size: 7 },
  { ring: 0, angle: 90, size: 7 },
  { ring: 0, angle: 180, size: 7 },
  { ring: 0, angle: 270, size: 7 },
  // Ring 1 - Products (6 nodes)
  { ring: 1, angle: 30, size: 6 },
  { ring: 1, angle: 90, size: 6 },
  { ring: 1, angle: 150, size: 6 },
  { ring: 1, angle: 210, size: 6 },
  { ring: 1, angle: 270, size: 6 },
  { ring: 1, angle: 330, size: 6 },
  // Ring 2 - Events (8 nodes)
  { ring: 2, angle: 22.5, size: 5 },
  { ring: 2, angle: 67.5, size: 5 },
  { ring: 2, angle: 112.5, size: 5 },
  { ring: 2, angle: 157.5, size: 5 },
  { ring: 2, angle: 202.5, size: 5 },
  { ring: 2, angle: 247.5, size: 5 },
  { ring: 2, angle: 292.5, size: 5 },
  { ring: 2, angle: 337.5, size: 5 },
] as const;

// Static connection definitions (from ring/angle to ring/angle)
const CONNECTION_CONFIG = [
  { fromRing: 0, fromAngle: 0, toRing: 1, toAngle: 30 },
  { fromRing: 0, fromAngle: 90, toRing: 1, toAngle: 90 },
  { fromRing: 0, fromAngle: 180, toRing: 1, toAngle: 210 },
  { fromRing: 0, fromAngle: 270, toRing: 1, toAngle: 270 },
  { fromRing: 1, fromAngle: 150, toRing: 2, toAngle: 157.5 },
  { fromRing: 1, fromAngle: 330, toRing: 2, toAngle: 337.5 },
] as const;

// Helper to calculate position from ring index and angle
function getPosition(ringIndex: number, angleDeg: number): { x: number; y: number } {
  const ring = ORBIT_RINGS[ringIndex];
  if (!ring) return { x: 0, y: 0 };
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * ring.radius,
    y: Math.sin(rad) * ring.radius,
  };
}

// Helper to create a smooth bezier curve path
function createCurvePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Control point offset perpendicular to the line
  const cx = (from.x + to.x) / 2 - dy * 0.2;
  const cy = (from.y + to.y) / 2 + dx * 0.2;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

interface RingState {
  isHovered: boolean;
  intensity: number;
}

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [svgMousePos, setSvgMousePos] = useState({ x: 0, y: 0 });
  const [ringStates, setRingStates] = useState<RingState[]>(
    ORBIT_RINGS.map(() => ({ isHovered: false, intensity: 0 }))
  );

  // Motion values for subtle 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle 3D perspective transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  // Calculate ring hover states based on mouse distance
  const updateRingStates = useCallback((mx: number, my: number) => {
    const distFromCenter = Math.sqrt(mx * mx + my * my);
    
    const newStates = ORBIT_RINGS.map((ring) => {
      const distToRing = Math.abs(distFromCenter - ring.radius);
      const threshold = 50;
      const isHovered = distToRing < threshold;
      const intensity = isHovered ? Math.max(0, 1 - distToRing / threshold) : 0;
      return { isHovered, intensity };
    });
    
    setRingStates(newStates);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);
    setMousePos({ x, y });

    // Calculate mouse position in SVG coordinates (centered)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const scale = 800 / Math.min(rect.width, rect.height);
    const svgX = (e.clientX - rect.left - centerX) * scale;
    const svgY = (e.clientY - rect.top - centerY) * scale;
    setSvgMousePos({ x: svgX, y: svgY });
    updateRingStates(svgX, svgY);
  }, [mouseX, mouseY, updateRingStates]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovering(false);
    setRingStates(ORBIT_RINGS.map(() => ({ isHovered: false, intensity: 0 })));
  }, [mouseX, mouseY]);

  // Pre-compute node data with positions and colors
  const nodes = useMemo(() => {
    return NODE_CONFIG.map((cfg, idx) => {
      const pos = getPosition(cfg.ring, cfg.angle);
      const color = ORBIT_RINGS[cfg.ring]?.color || TYPE_COLORS.brand;
      return { id: idx, ...cfg, ...pos, color };
    });
  }, []);

  // Pre-compute connection data with paths and colors
  const connections = useMemo(() => {
    return CONNECTION_CONFIG.map((cfg, idx) => {
      const from = getPosition(cfg.fromRing, cfg.fromAngle);
      const to = getPosition(cfg.toRing, cfg.toAngle);
      const path = createCurvePath(from, to);
      const fromColor = ORBIT_RINGS[cfg.fromRing]?.color || TYPE_COLORS.brand;
      const toColor = ORBIT_RINGS[cfg.toRing]?.color || TYPE_COLORS.product;
      return { id: idx, from, to, path, fromColor, toColor, fromRing: cfg.fromRing, toRing: cfg.toRing };
    });
  }, []);

  // Calculate animation speed based on ring hover state
  const getAnimationDuration = (ringIndex: number, baseDuration: number): number => {
    const state = ringStates[ringIndex];
    if (state?.isHovered) return baseDuration * 0.4;
    if (isHovering) return baseDuration * 0.7;
    return baseDuration;
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-32 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      
      {/* Mouse-reactive radial glow */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle 300px at ${mousePos.x * 100}% ${mousePos.y * 100}%, hsl(var(--primary) / ${isHovering ? 0.12 : 0.05}), transparent)`,
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Orbit visualization */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.svg 
          className="absolute w-full max-w-[800px] aspect-square" 
          viewBox="-400 -400 800 800"
          animate={{ opacity: isHovering ? 0.9 : 0.65 }}
          transition={{ duration: 0.3 }}
        >
          <defs>
            {/* Gradient definitions for connections */}
            {connections.map((conn) => (
              <linearGradient 
                key={`grad-${conn.id}`} 
                id={`connGrad${conn.id}`} 
                gradientUnits="userSpaceOnUse"
                x1={conn.from.x} 
                y1={conn.from.y} 
                x2={conn.to.x} 
                y2={conn.to.y}
              >
                <stop offset="0%" stopColor={conn.fromColor} stopOpacity="0.7" />
                <stop offset="100%" stopColor={conn.toColor} stopOpacity="0.7" />
              </linearGradient>
            ))}
            
            {/* Glow filter */}
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Mouse proximity glow indicator */}
          {isHovering && (
            <circle
              cx={svgMousePos.x}
              cy={svgMousePos.y}
              r="60"
              fill="hsl(var(--primary))"
              opacity="0.08"
            />
          )}

          {/* Orbit rings */}
          {ORBIT_RINGS.map((ring, i) => {
            const state = ringStates[i];
            const opacity = ring.baseOpacity + (state?.intensity || 0) * 0.35;
            const strokeWidth = 1 + (state?.intensity || 0) * 1.5;
            const duration = getAnimationDuration(i, ring.duration);
            
            return (
              <g key={`ring-${i}`}>
                {/* Glow ring on hover */}
                {state?.isHovered && (
                  <circle
                    cx="0"
                    cy="0"
                    r={ring.radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={6 + state.intensity * 8}
                    strokeOpacity={0.15}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 0 0"
                      to={`${360 * ring.direction} 0 0`}
                      dur={`${duration}s`}
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
                  strokeDasharray={state?.isHovered ? "6 4" : "3 6"}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${360 * ring.direction} 0 0`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Ring label on strong hover */}
                {(state?.intensity || 0) > 0.6 && (
                  <text
                    x={ring.radius + 12}
                    y="4"
                    fill={ring.color}
                    fontSize="11"
                    fontWeight="500"
                    opacity={state?.intensity || 0}
                  >
                    {ring.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* Connection lines */}
          {connections.map((conn) => {
            const fromActive = ringStates[conn.fromRing]?.isHovered;
            const toActive = ringStates[conn.toRing]?.isHovered;
            const isActive = fromActive || toActive;
            const baseOpacity = isActive ? 0.8 : (isHovering ? 0.5 : 0.35);
            const strokeWidth = isActive ? 2.5 : (isHovering ? 1.8 : 1.2);
            const dotSize = isActive ? 3.5 : 2;
            const animDuration = isActive ? 1.5 : (isHovering ? 2.5 : 3.5);
            
            return (
              <g key={`conn-${conn.id}`} opacity={baseOpacity}>
                {/* Connection path */}
                <path
                  d={conn.path}
                  fill="none"
                  stroke={`url(#connGrad${conn.id})`}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                
                {/* Traveling dot forward */}
                <circle r={dotSize} fill={conn.toColor}>
                  <animateMotion
                    dur={`${animDuration}s`}
                    repeatCount="indefinite"
                    path={conn.path}
                  />
                </circle>
                
                {/* Traveling dot backward */}
                <circle r={dotSize * 0.7} fill={conn.fromColor} opacity="0.7">
                  <animateMotion
                    dur={`${animDuration * 1.3}s`}
                    repeatCount="indefinite"
                    path={conn.path}
                    keyPoints="1;0"
                    keyTimes="0;1"
                  />
                </circle>
              </g>
            );
          })}

          {/* Orbit nodes */}
          {nodes.map((node) => {
            const ring = ORBIT_RINGS[node.ring];
            const state = ringStates[node.ring];
            const isActive = state?.isHovered || false;
            const intensity = state?.intensity || 0;
            const nodeSize = node.size + intensity * 2;
            const duration = getAnimationDuration(node.ring, ring?.duration || 60);
            
            return (
              <g key={`node-${node.id}`}>
                {/* Node glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize + 6 + intensity * 6}
                  fill={node.color}
                  opacity={isActive ? 0.25 : 0.1}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * (ring?.direction || 1)} 0 0`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node border */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize}
                  fill="hsl(var(--background))"
                  stroke={node.color}
                  strokeWidth={isActive ? 2 : 1.5}
                  filter={isActive ? "url(#nodeGlow)" : undefined}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * (ring?.direction || 1)} 0 0`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node inner dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize * 0.45}
                  fill={node.color}
                  opacity={isActive ? 0.9 : 0.6}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 0 0"
                    to={`${-360 * (ring?.direction || 1)} 0 0`}
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </motion.svg>
      </div>

      {/* Main content */}
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

          {/* Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
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

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/20 to-transparent" />
    </section>
  );
}
