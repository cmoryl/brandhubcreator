/**
 * GlobalLinkUniverseSection Component
 * Interactive orbit visualization specifically for GlobalLink products
 * Shows how all GlobalLink products interact together with hover info states
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ExternalLink, ArrowRight, Layers, Globe, Mic, Video, FileText, MessageSquare, Tv, Music, Share2, Database, PenTool, Zap } from 'lucide-react';

// Particle component for visual effects
const OrbitParticle: React.FC<{
  delay: number;
  duration: number;
  size: number;
  color: string;
  orbitRadius: number;
  startAngle: number;
}> = ({ delay, duration, size, color, orbitRadius, startAngle }) => {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: '50%',
        top: '50%',
        transformOrigin: 'center',
        animation: `orbitParticle ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.6,
        '--orbit-radius': `${orbitRadius}%`,
        '--start-angle': `${startAngle}deg`,
      } as React.CSSProperties}
    />
  );
};

interface LinkedGuide {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
}

// Internal type for validated guides with required fields
interface ValidatedGuide {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

interface GlobalLinkUniverseSectionProps {
  linkedGuides: LinkedGuide[];
  primaryColor?: string;
  className?: string;
}

// Product-specific metadata for hover info
const PRODUCT_INFO: Record<string, { 
  icon: React.ElementType;
  description: string;
  category: string;
  connections: string[];
}> = {
  'globallink-tms': {
    icon: Database,
    description: 'Enterprise translation management system for global content workflows.',
    category: 'Core Platform',
    connections: ['GlobalLink Web', 'GlobalLink CCMS', 'GlobalLink NOW'],
  },
  'globallink-web': {
    icon: Globe,
    description: 'Automated website localization with seamless CMS integration.',
    category: 'Web',
    connections: ['GlobalLink TMS', 'GlobalLink Strings'],
  },
  'globallink-now': {
    icon: Zap,
    description: 'AI-powered instant translation for rapid content delivery.',
    category: 'AI-Powered',
    connections: ['GlobalLink TMS', 'GlobalLink Write'],
  },
  'globallink-write': {
    icon: PenTool,
    description: 'AI writing assistant optimized for multilingual content creation.',
    category: 'AI-Powered',
    connections: ['GlobalLink NOW', 'GlobalLink TMS'],
  },
  'globallink-voice': {
    icon: Mic,
    description: 'Voice-over and audio localization services for multimedia.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Media'],
  },
  'globallink-scribe': {
    icon: FileText,
    description: 'Subtitle and caption localization for video content.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
  },
  'globallink-live': {
    icon: MessageSquare,
    description: 'Real-time interpretation and live event localization.',
    category: 'Live',
    connections: ['GlobalLink Voice', 'GlobalLink TV'],
  },
  'globallink-tv': {
    icon: Tv,
    description: 'End-to-end broadcast and streaming content localization.',
    category: 'Media',
    connections: ['GlobalLink Voice', 'GlobalLink Scribe', 'GlobalLink Media'],
  },
  'globallink-media': {
    icon: Video,
    description: 'Rich media adaptation for global markets.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
  },
  'globallink-strings': {
    icon: Layers,
    description: 'Software and app string localization management.',
    category: 'Development',
    connections: ['GlobalLink TMS', 'GlobalLink Web'],
  },
  'globallink-share': {
    icon: Share2,
    description: 'Collaborative translation portal for distributed teams.',
    category: 'Collaboration',
    connections: ['GlobalLink TMS', 'GlobalLink CCMS'],
  },
  'globallink-ccms': {
    icon: Database,
    description: 'Component content management for structured authoring.',
    category: 'Core Platform',
    connections: ['GlobalLink TMS', 'GlobalLink Share'],
  },
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Core Platform': '#6366f1', // Indigo
  'Web': '#14b8a6', // Teal
  'AI-Powered': '#f59e0b', // Amber
  'Media': '#ec4899', // Pink
  'Live': '#ef4444', // Red
  'Development': '#22c55e', // Green
  'Collaboration': '#8b5cf6', // Violet
};

export const GlobalLinkUniverseSection: React.FC<GlobalLinkUniverseSectionProps> = ({
  linkedGuides,
  primaryColor = '#6366f1',
  className,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredProduct, setHoveredProduct] = useState<ValidatedGuide | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Get product info with fallback
  const getProductInfo = useCallback((slug: string) => {
    return PRODUCT_INFO[slug] || {
      icon: Layers,
      description: 'GlobalLink product for enterprise localization.',
      category: 'Core Platform',
      connections: [],
    };
  }, []);

  // Filter and split products into inner and outer rings
  const { innerRing, outerRing, validGuides } = useMemo(() => {
    // Only include guides with required fields and cast to validated type
    const validated = linkedGuides.filter((g): g is ValidatedGuide => 
      Boolean(g.name && g.slug)
    );
    const mid = Math.ceil(validated.length / 2);
    return {
      innerRing: validated.slice(0, mid),
      outerRing: validated.slice(mid),
      validGuides: validated,
    };
  }, [linkedGuides]);

  // Get connected product indices for line drawing
  const connections = useMemo(() => {
    if (!hoveredProduct) return [];
    const info = getProductInfo(hoveredProduct.slug);
    return info.connections.map(name => {
      const found = validGuides.find(g => g.name === name);
      return found ? validGuides.indexOf(found) : -1;
    }).filter(i => i >= 0);
  }, [hoveredProduct, validGuides, getProductInfo]);

  const animationStyle = isPaused ? 'paused' : 'running';

  // Generate particles for visual effects
  const particles = useMemo(() => {
    const particleCount = 24;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: (i * 0.5) % 8,
      duration: 15 + (i % 5) * 3,
      size: 3 + (i % 3) * 2,
      color: Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length],
      orbitRadius: 20 + (i % 3) * 15,
      startAngle: (i * 360 / particleCount),
    }));
  }, []);

  return (
    <section className={cn("relative py-16 overflow-hidden", className)}>
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          GlobalLink Universe
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our interconnected ecosystem of localization products. Hover over any product to see how it connects with others.
        </p>
      </div>

      {/* Interactive Orbit Container */}
      <div 
        ref={containerRef}
        className="relative mx-auto w-full max-w-[700px] aspect-square"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          setHoveredProduct(null);
          setHoveredIndex(null);
        }}
      >
        {/* Outer orbit ring */}
        <div 
          className="absolute inset-[5%] rounded-full border border-border/30"
          style={{ 
            boxShadow: `0 0 40px ${primaryColor}10`,
          }}
        />
        
        {/* Inner orbit ring */}
        <div 
          className="absolute inset-[25%] rounded-full border border-border/30"
          style={{ 
            boxShadow: `0 0 30px ${primaryColor}10`,
          }}
        />

        {/* Particle effects */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle) => (
            <OrbitParticle
              key={particle.id}
              delay={particle.delay}
              duration={particle.duration}
              size={particle.size}
              color={particle.color}
              orbitRadius={particle.orbitRadius}
              startAngle={particle.startAngle}
            />
          ))}
        </div>

        {/* Connection lines to hovered product */}
        {hoveredProduct && connections.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {connections.map((targetIdx) => {
              const hoveredIdx = validGuides.indexOf(hoveredProduct);
              if (hoveredIdx < 0 || targetIdx < 0) return null;
              
              // Calculate positions
              const isHoveredInner = hoveredIdx < innerRing.length;
              const isTargetInner = targetIdx < innerRing.length;
              
              const hoveredRingIdx = isHoveredInner ? hoveredIdx : hoveredIdx - innerRing.length;
              const targetRingIdx = isTargetInner ? targetIdx : targetIdx - innerRing.length;
              
              const hoveredRingSize = isHoveredInner ? innerRing.length : outerRing.length;
              const targetRingSize = isTargetInner ? innerRing.length : outerRing.length;
              
              const hoveredAngle = (hoveredRingIdx * 360 / hoveredRingSize - 90) * (Math.PI / 180);
              const targetAngle = (targetRingIdx * 360 / targetRingSize - 90) * (Math.PI / 180);
              
              const hoveredRadius = isHoveredInner ? 32.5 : 47.5;
              const targetRadius = isTargetInner ? 32.5 : 47.5;
              
              const x1 = 50 + hoveredRadius * Math.cos(hoveredAngle);
              const y1 = 50 + hoveredRadius * Math.sin(hoveredAngle);
              const x2 = 50 + targetRadius * Math.cos(targetAngle);
              const y2 = 50 + targetRadius * Math.sin(targetAngle);
              
              return (
                <line
                  key={`conn-${hoveredIdx}-${targetIdx}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeOpacity="0.6"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
              );
            })}
          </svg>
        )}

        {/* Center hub - GlobalLink logo */}
        <div className="absolute inset-[40%] z-20">
          <div 
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110"
            style={{ 
              background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
              boxShadow: `0 0 30px ${primaryColor}40`,
              border: `2px solid ${primaryColor}80`,
            }}
            onClick={() => setHoveredProduct(null)}
          >
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto text-white/80 mb-1" />
              <span className="text-xs font-bold text-white/90 block">GlobalLink</span>
            </div>
          </div>
        </div>

        {/* Inner ring products */}
        <div 
          className="absolute inset-[15%] pointer-events-none"
          style={{ 
            transformOrigin: 'center', 
            animation: `spin 45s linear infinite`,
            animationPlayState: animationStyle,
          }}
        >
          {innerRing.map((product, i) => {
            const angle = (i * 360 / innerRing.length - 90) * (Math.PI / 180);
            const radius = 50;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const info = getProductInfo(product.slug);
            const Icon = info.icon;
            const isActive = hoveredProduct?.id === product.id;
            const isConnected = hoveredProduct && connections.includes(linkedGuides.indexOf(product));
            const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
            
            return (
              <div
                key={product.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: `spin 45s linear infinite reverse`,
                  animationPlayState: animationStyle,
                }}
                onMouseEnter={() => {
                  setHoveredProduct(product);
                  setHoveredIndex(i);
                }}
                onMouseLeave={() => {
                  setHoveredProduct(null);
                  setHoveredIndex(null);
                }}
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                <div 
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
                    isActive && "scale-125 z-30",
                    isConnected && "scale-110 ring-2 ring-offset-2 ring-offset-background",
                    !isActive && !isConnected && "hover:scale-110"
                  )}
                  style={{
                    background: isActive 
                      ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`
                      : `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20)`,
                    boxShadow: isActive || isConnected
                      ? `0 0 20px ${categoryColor}60, 0 0 40px ${categoryColor}30`
                      : `0 0 10px ${categoryColor}20`,
                    border: `2px solid ${isActive ? categoryColor : categoryColor + '60'}`,
                    '--tw-ring-color': isConnected ? categoryColor : undefined,
                  } as React.CSSProperties}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
                      isActive ? "text-white" : "text-foreground/70"
                    )} 
                  />
                </div>
                
                {/* Product name label - only visible on hover */}
                <div 
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] md:text-xs font-medium transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                  )}
                  style={{ color: categoryColor }}
                >
                  {product.name.replace('GlobalLink ', '')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Outer ring products */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            transformOrigin: 'center', 
            animation: `spin 60s linear infinite reverse`,
            animationPlayState: animationStyle,
          }}
        >
          {outerRing.map((product, i) => {
            const angle = (i * 360 / outerRing.length - 90) * (Math.PI / 180);
            const radius = 45;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const info = getProductInfo(product.slug);
            const Icon = info.icon;
            const globalIdx = innerRing.length + i;
            const isActive = hoveredProduct?.id === product.id;
            const isConnected = hoveredProduct && connections.includes(globalIdx);
            const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
            
            return (
              <div
                key={product.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: `spin 60s linear infinite`,
                  animationPlayState: animationStyle,
                }}
                onMouseEnter={() => {
                  setHoveredProduct(product);
                  setHoveredIndex(globalIdx);
                }}
                onMouseLeave={() => {
                  setHoveredProduct(null);
                  setHoveredIndex(null);
                }}
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                <div 
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
                    isActive && "scale-125 z-30",
                    isConnected && "scale-110 ring-2 ring-offset-2 ring-offset-background",
                    !isActive && !isConnected && "hover:scale-110"
                  )}
                  style={{
                    background: isActive 
                      ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`
                      : `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20)`,
                    boxShadow: isActive || isConnected
                      ? `0 0 20px ${categoryColor}60, 0 0 40px ${categoryColor}30`
                      : `0 0 10px ${categoryColor}20`,
                    border: `2px solid ${isActive ? categoryColor : categoryColor + '60'}`,
                    '--tw-ring-color': isConnected ? categoryColor : undefined,
                  } as React.CSSProperties}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
                      isActive ? "text-white" : "text-foreground/70"
                    )} 
                  />
                </div>
                
                {/* Product name label - only visible on hover */}
                <div 
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] md:text-xs font-medium transition-all duration-300",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
                  )}
                  style={{ color: categoryColor }}
                >
                  {product.name.replace('GlobalLink ', '')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover info card */}
        {hoveredProduct && (
          <div 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up"
            style={{ animationDuration: '0.2s' }}
          >
            <div 
              className="bg-card/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-border/50 min-w-[280px] max-w-[320px]"
              style={{
                boxShadow: `0 10px 40px ${CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category]}20`,
              }}
            >
              <div className="flex items-start gap-3">
                {(() => {
                  const info = getProductInfo(hoveredProduct.slug);
                  const Icon = info.icon;
                  const categoryColor = CATEGORY_COLORS[info.category];
                  return (
                    <>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${categoryColor}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: categoryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {hoveredProduct.name}
                          </h4>
                          <span 
                            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ 
                              background: `${categoryColor}20`,
                              color: categoryColor,
                            }}
                          >
                            {info.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {info.description}
                        </p>
                        {info.connections.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Connects with:</span>
                            <span className="font-medium" style={{ color: categoryColor }}>
                              {info.connections.slice(0, 2).map(c => c.replace('GlobalLink ', '')).join(', ')}
                              {info.connections.length > 2 && ` +${info.connections.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => navigate(`/product/${hoveredProduct.slug}`)}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: `${CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category]}15`,
                  color: CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category],
                }}
              >
                View Product Guide
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 px-4">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ background: color }}
            />
            <span className="text-muted-foreground">{category}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GlobalLinkUniverseSection;
