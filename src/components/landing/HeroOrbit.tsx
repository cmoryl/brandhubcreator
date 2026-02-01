/**
 * HeroOrbit Component
 * Enhanced orbit visualization for landing page hero
 * Inspired by GlobalLink Universe style with animated rings, glowing orb trails, and 3D effects
 */

import React, { useState, useRef, useCallback, useMemo, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface OrbitEntity {
  id: string;
  name: string;
  slug?: string;
  type: 'brand' | 'product' | 'event';
  coverImage?: string;
  color?: string;
}

interface HeroOrbitProps {
  className?: string;
  primaryColor?: string;
  centerLogo: string;
  brands?: OrbitEntity[];
  products?: OrbitEntity[];
  events?: OrbitEntity[];
  onEntityClick?: (entity: OrbitEntity) => void;
}

// Type colors matching GlobalAssetOrbit
const TYPE_COLORS = {
  brand: '#14b8a6',    // Teal
  product: '#38bdf8',  // Light blue
  event: '#f59e0b',    // Amber
};

// Seeded random for consistent patterns
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const HeroOrbit = forwardRef<HTMLDivElement, HeroOrbitProps>(({
  className,
  primaryColor = '#6366f1',
  centerLogo,
  brands = [],
  products = [],
  events = [],
  onEntityClick,
}, ref) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<OrbitEntity | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [orbitTilt, setOrbitTilt] = useState({ x: 0, y: 0 });

  // Combine all entities for orbit visualization
  const allEntities = useMemo(() => [
    ...brands.slice(0, 4).map(b => ({ ...b, type: 'brand' as const })),
    ...products.slice(0, 5).map(p => ({ ...p, type: 'product' as const })),
    ...events.slice(0, 3).map(e => ({ ...e, type: 'event' as const })),
  ], [brands, products, events]);

  // Generate particle dust positions
  const particleDust = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const angle = seededRandom(i * 7) * Math.PI * 2;
      const radius = 15 + seededRandom(i * 13) * 20;
      particles.push({
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        size: 0.3 + seededRandom(i * 17) * 0.5,
        opacity: 0.2 + seededRandom(i * 23) * 0.3,
        delay: seededRandom(i * 31) * 3,
      });
    }
    return particles;
  }, []);

  // Handle orbit hover for 3D tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setOrbitTilt({ x: y * -12, y: x * 12 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOrbitTilt({ x: 0, y: 0 });
    setHoveredEntity(null);
    setIsPaused(false);
  }, []);

  const handleEntityClick = (entity: OrbitEntity) => {
    if (onEntityClick) {
      onEntityClick(entity);
    } else {
      const pathPrefix = entity.type === 'brand' ? '/demo/brand' : entity.type === 'product' ? '/demo/product' : '/demo/event';
      navigate(`${pathPrefix}/${entity.slug || entity.id}`);
    }
  };

  const activeColor = hoveredEntity ? TYPE_COLORS[hoveredEntity.type] : primaryColor;

  return (
    <div 
      ref={ref || containerRef}
      className={cn("relative", className)}
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Transform Container */}
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${orbitTilt.x}deg) rotateY(${orbitTilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background glow layers */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${activeColor}30, ${activeColor}10, transparent 70%)`,
            transform: 'translateZ(-60px) scale(1.2)',
          }}
        />
        
        {/* Secondary glow pulse */}
        <div 
          className="absolute inset-[5%] rounded-full blur-2xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${activeColor}20, transparent 60%)`,
            transform: 'translateZ(-30px)',
            animationDuration: '3s',
          }}
        />

        {/* SVG Orbit Visualization */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            {/* Orbit ring gradient */}
            <linearGradient id="heroOrbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.15" />
              <stop offset="50%" stopColor={activeColor} stopOpacity="0.05" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.15" />
            </linearGradient>
            
            {/* Glowing orb filter */}
            <filter id="heroOrbGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Center glow */}
            <radialGradient id="centerGlow">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.4" />
              <stop offset="50%" stopColor={activeColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer orbit ring - animated dash */}
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke="url(#heroOrbitGradient)" 
            strokeWidth="0.5"
            className="transition-all duration-500"
          />
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke={activeColor}
            strokeWidth="0.4"
            strokeOpacity="0.25"
            strokeDasharray="3 5"
            className="transition-all duration-500"
            style={{
              animation: isPaused ? 'none' : 'spin 60s linear infinite',
            }}
          />

          {/* Middle orbit ring */}
          <circle 
            cx="50" cy="50" r="34" 
            fill="none" 
            stroke={activeColor}
            strokeWidth="0.3"
            strokeOpacity="0.15"
            strokeDasharray="2 6"
            className="transition-all duration-500"
            style={{
              animation: isPaused ? 'none' : 'spin 45s linear infinite reverse',
            }}
          />

          {/* Inner orbit ring */}
          <circle 
            cx="50" cy="50" r="22" 
            fill="none" 
            stroke={activeColor}
            strokeWidth="0.5"
            strokeOpacity="0.12"
            className="transition-all duration-500"
          />

          {/* Particle dust around center */}
          {particleDust.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={activeColor}
              opacity={p.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${p.opacity};${p.opacity * 1.5};${p.opacity}`}
                dur="2s"
                begin={`${p.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Orbiting comet trails */}
          {[0, 1, 2].map((i) => {
            const radius = 22 + i * 12;
            const duration = 8 + i * 4;
            const color = i === 0 ? TYPE_COLORS.brand : i === 1 ? TYPE_COLORS.product : TYPE_COLORS.event;
            
            return (
              <g key={`comet-${i}`}>
                {/* Trail particles */}
                {[0, 1, 2, 3].map((t) => (
                  <circle
                    key={t}
                    r={1.2 - t * 0.25}
                    fill={color}
                    opacity={0.6 - t * 0.12}
                  >
                    <animateMotion
                      dur={`${duration}s`}
                      repeatCount="indefinite"
                      begin={`${t * 0.1}s`}
                      path={`M ${50 + radius} 50 A ${radius} ${radius} 0 1 1 ${50 + radius - 0.001} 50`}
                    />
                  </circle>
                ))}
                
                {/* Main glowing orb */}
                <circle
                  r="1.8"
                  fill={color}
                  filter="url(#heroOrbGlow)"
                >
                  <animateMotion
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    path={`M ${50 + radius} 50 A ${radius} ${radius} 0 1 1 ${50 + radius - 0.001} 50`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;1;0.7"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="1.5;2.2;1.5"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Entity nodes on orbit */}
          {allEntities.map((entity, i) => {
            const total = allEntities.length;
            const angle = ((i * 360) / total - 90) * (Math.PI / 180);
            const radius = entity.type === 'brand' ? 22 : entity.type === 'product' ? 34 : 46;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const color = TYPE_COLORS[entity.type];
            const isHovered = hoveredEntity?.id === entity.id;
            
            return (
              <g 
                key={entity.id}
                className="cursor-pointer transition-transform duration-200"
                style={{ transform: isHovered ? 'scale(1.15)' : 'scale(1)', transformOrigin: `${x}px ${y}px` }}
                onClick={() => handleEntityClick(entity)}
                onMouseEnter={() => {
                  setHoveredEntity(entity);
                  setIsPaused(true);
                }}
                onMouseLeave={() => {
                  setHoveredEntity(null);
                  setIsPaused(false);
                }}
              >
                {/* Glow ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 4.5 : 3.5}
                  fill={`${color}20`}
                  stroke={color}
                  strokeWidth={isHovered ? 0.6 : 0.3}
                  className="transition-all duration-200"
                />
                
                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 2.2 : 1.8}
                  fill={color}
                  className="transition-all duration-200"
                >
                  {!isPaused && (
                    <animate
                      attributeName="r"
                      values="1.6;2;1.6"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                
                {/* Entity label (on hover) */}
                {isHovered && (
                  <g className="animate-fade-in">
                    <rect
                      x={x - 12}
                      y={y + 5}
                      width="24"
                      height="5"
                      rx="1"
                      fill="rgba(0,0,0,0.75)"
                    />
                    <text
                      x={x}
                      y={y + 8.5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="2.5"
                      fontWeight="500"
                    >
                      {entity.name.length > 12 ? entity.name.slice(0, 12) + '...' : entity.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Center hub glow */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="url(#centerGlow)"
            className="transition-all duration-500"
          />
        </svg>

        {/* Center logo */}
        <div className="absolute inset-[35%] z-20">
          <div 
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105"
            style={{ 
              background: `linear-gradient(145deg, ${activeColor}40, ${activeColor}15)`,
              boxShadow: `0 0 50px ${activeColor}35, inset 0 0 25px ${activeColor}20`,
              border: `2px solid ${activeColor}40`,
            }}
          >
            <img 
              src={centerLogo} 
              alt="Logo" 
              className="w-2/3 h-2/3 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Legend badges */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 z-30">
          {[
            { type: 'brand', label: 'Brands', count: brands.length },
            { type: 'product', label: 'Products', count: products.length },
            { type: 'event', label: 'Events', count: events.length },
          ].map(({ type, label, count }) => (
            <div key={type} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: TYPE_COLORS[type as keyof typeof TYPE_COLORS] }}
              />
              <span className="text-[10px] font-medium text-muted-foreground">
                {label} ({count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

HeroOrbit.displayName = 'HeroOrbit';
