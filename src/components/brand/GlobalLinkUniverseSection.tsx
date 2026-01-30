/**
 * GlobalLinkUniverseSection Component
 * Interactive orbit visualization specifically for GlobalLink products
 * Shows how all GlobalLink products interact together with hover info states
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight, Layers, Globe, Mic, Video, FileText, MessageSquare, Tv, Share2, Database, PenTool, Zap } from 'lucide-react';
import globalLinkIcon from '@/assets/globallink-g-icon.png';

interface LinkedGuide {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
}

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
  'Core Platform': '#6366f1',
  'Web': '#14b8a6',
  'AI-Powered': '#f59e0b',
  'Media': '#ec4899',
  'Live': '#ef4444',
  'Development': '#22c55e',
  'Collaboration': '#8b5cf6',
};

// Orbit Product Node Component
const OrbitNode: React.FC<{
  product: ValidatedGuide;
  angle: number;
  radius: number;
  isActive: boolean;
  isConnected: boolean;
  categoryColor: string;
  icon: React.ElementType;
  animationStyle: string;
  animationDuration: number;
  reverse?: boolean;
  onHover: (product: ValidatedGuide, rect: DOMRect) => void;
  onLeave: () => void;
  onClick: () => void;
}> = ({ 
  product, angle, radius, isActive, isConnected, categoryColor, 
  icon: Icon, animationStyle, animationDuration, reverse = false,
  onHover, onLeave, onClick 
}) => {
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  
  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        animation: `spin ${animationDuration}s linear infinite ${reverse ? 'reverse' : ''}`,
        animationPlayState: animationStyle,
      }}
      onMouseEnter={(e) => onHover(product, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Pulse ring for active/connected */}
      {(isActive || isConnected) && (
        <div 
          className="absolute inset-[-8px] rounded-full animate-ping"
          style={{ 
            background: `${categoryColor}20`,
            animationDuration: '1.5s',
          }} 
        />
      )}
      
      <div 
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative",
          isActive && "scale-125 z-30",
          isConnected && "scale-110",
          !isActive && !isConnected && "hover:scale-110"
        )}
        style={{
          background: isActive 
            ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}90)`
            : isConnected
            ? `linear-gradient(135deg, ${categoryColor}60, ${categoryColor}30)`
            : `linear-gradient(135deg, ${categoryColor}30, ${categoryColor}15)`,
          boxShadow: isActive 
            ? `0 0 25px ${categoryColor}70, 0 0 50px ${categoryColor}40, inset 0 0 20px ${categoryColor}30`
            : isConnected
            ? `0 0 20px ${categoryColor}50, 0 0 40px ${categoryColor}20`
            : `0 0 10px ${categoryColor}15`,
          border: `2px solid ${isActive ? categoryColor : isConnected ? categoryColor + '80' : categoryColor + '40'}`,
        }}
      >
        <Icon 
          className={cn(
            "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
            isActive ? "text-white" : isConnected ? "text-foreground/90" : "text-foreground/60"
          )} 
        />
      </div>
      
      {/* Inline label for active product */}
      {isActive && (
        <div 
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in"
          style={{ 
            background: `${categoryColor}`,
            color: 'white',
            boxShadow: `0 2px 8px ${categoryColor}50`,
          }}
        >
          {product.name.replace('GlobalLink ', '')}
        </div>
      )}
    </div>
  );
};

// Connection Line Component with animated particles
const ConnectionLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  delay?: number;
}> = ({ x1, y1, x2, y2, color, delay = 0 }) => {
  // Calculate control point for curved bezier
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Curve toward center for better visual
  const curveFactor = dist * 0.15;
  const cx = midX - (midX - 50) * 0.3;
  const cy = midY - (midY - 50) * 0.3;
  
  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  
  return (
    <g>
      {/* Glow layer */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeOpacity="0.15"
        strokeLinecap="round"
      />
      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeOpacity="0.7"
        strokeLinecap="round"
        strokeDasharray="6 4"
        className="animate-pulse"
      />
      {/* Animated particle */}
      <circle r="5" fill={color} opacity="0.9">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay}s`}
          path={pathD}
        />
        <animate
          attributeName="r"
          values="3;5;3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Second particle going opposite direction */}
      <circle r="3" fill="white" opacity="0.8">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          begin={`${delay + 1}s`}
          path={pathD}
          keyPoints="1;0"
          keyTimes="0;1"
        />
      </circle>
    </g>
  );
};

export const GlobalLinkUniverseSection: React.FC<GlobalLinkUniverseSectionProps> = ({
  linkedGuides,
  primaryColor = '#6366f1',
  className,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredProduct, setHoveredProduct] = useState<ValidatedGuide | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const getProductInfo = useCallback((slug: string) => {
    return PRODUCT_INFO[slug] || {
      icon: Layers,
      description: 'GlobalLink product for enterprise localization.',
      category: 'Core Platform',
      connections: [],
    };
  }, []);

  // Filter and split products into rings
  const { innerRing, outerRing, validGuides } = useMemo(() => {
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

  // Get connected product indices
  const connections = useMemo(() => {
    if (!hoveredProduct) return [];
    const info = getProductInfo(hoveredProduct.slug);
    return info.connections.map(name => {
      const found = validGuides.find(g => g.name === name);
      return found ? validGuides.indexOf(found) : -1;
    }).filter(i => i >= 0);
  }, [hoveredProduct, validGuides, getProductInfo]);

  // Calculate connection line positions
  const connectionLines = useMemo(() => {
    if (!hoveredProduct || connections.length === 0) return [];
    
    const hoveredIdx = validGuides.indexOf(hoveredProduct);
    if (hoveredIdx < 0) return [];
    
    const isHoveredInner = hoveredIdx < innerRing.length;
    const hoveredRingIdx = isHoveredInner ? hoveredIdx : hoveredIdx - innerRing.length;
    const hoveredRingSize = isHoveredInner ? innerRing.length : outerRing.length;
    const hoveredAngle = (hoveredRingIdx * 360 / hoveredRingSize - 90) * (Math.PI / 180);
    const hoveredRadius = isHoveredInner ? 35 : 45;
    
    return connections.map((targetIdx, i) => {
      const isTargetInner = targetIdx < innerRing.length;
      const targetRingIdx = isTargetInner ? targetIdx : targetIdx - innerRing.length;
      const targetRingSize = isTargetInner ? innerRing.length : outerRing.length;
      const targetAngle = (targetRingIdx * 360 / targetRingSize - 90) * (Math.PI / 180);
      const targetRadius = isTargetInner ? 35 : 45;
      
      return {
        x1: 50 + hoveredRadius * Math.cos(hoveredAngle),
        y1: 50 + hoveredRadius * Math.sin(hoveredAngle),
        x2: 50 + targetRadius * Math.cos(targetAngle),
        y2: 50 + targetRadius * Math.sin(targetAngle),
        delay: i * 0.3,
      };
    });
  }, [hoveredProduct, connections, validGuides, innerRing, outerRing]);

  const animationStyle = isPaused ? 'paused' : 'running';
  
  const handleProductHover = useCallback((product: ValidatedGuide) => {
    setHoveredProduct(product);
    setIsPaused(true);
  }, []);
  
  const handleProductLeave = useCallback(() => {
    setHoveredProduct(null);
    setIsPaused(false);
  }, []);

  const hoveredInfo = hoveredProduct ? getProductInfo(hoveredProduct.slug) : null;
  const hoveredColor = hoveredInfo ? CATEGORY_COLORS[hoveredInfo.category] : primaryColor;

  return (
    <section className={cn("relative py-12 md:py-16 overflow-hidden", className)}>
      {/* Ambient background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(circle at 60% 50%, ${primaryColor} 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <div className="text-center mb-6 md:mb-10 px-4">
        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-3">
          GlobalLink Universe
        </h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          Explore our interconnected ecosystem. Hover to see product connections.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-8 px-4 max-w-6xl mx-auto">
        
        {/* Left Panel */}
        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1">
          <div className="h-full flex flex-col gap-4">
            
            {/* Product Navigation */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/40 p-3 md:p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">
                Products ({validGuides.length})
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 max-h-[180px] lg:max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {validGuides.map((product) => {
                  const info = getProductInfo(product.slug);
                  const Icon = info.icon;
                  const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
                  const isActive = hoveredProduct?.id === product.id;
                  const isConnected = hoveredProduct && connections.includes(validGuides.indexOf(product));
                  
                  return (
                    <button
                      key={product.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg text-left transition-all duration-200 text-xs md:text-sm group",
                        isActive && "ring-1 ring-offset-1 ring-offset-background",
                        isConnected && !isActive && "bg-muted/40",
                        !isActive && !isConnected && "hover:bg-muted/30"
                      )}
                      style={{
                        background: isActive ? `${categoryColor}15` : undefined,
                        '--tw-ring-color': isActive ? categoryColor : undefined,
                      } as React.CSSProperties}
                      onMouseEnter={() => handleProductHover(product)}
                      onMouseLeave={handleProductLeave}
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      <div 
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center shrink-0 transition-all duration-200",
                          isActive && "scale-110"
                        )}
                        style={{ background: `${categoryColor}20` }}
                      >
                        <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" style={{ color: categoryColor }} />
                      </div>
                      <span className={cn(
                        "truncate transition-colors duration-200",
                        isActive ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {product.name.replace('GlobalLink ', '')}
                      </span>
                      {isConnected && !isActive && (
                        <div 
                          className="w-1.5 h-1.5 rounded-full ml-auto shrink-0 animate-pulse"
                          style={{ background: categoryColor }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="flex-1 min-h-[200px] lg:min-h-0">
              {hoveredProduct && hoveredInfo ? (
                <div 
                  className="bg-card/90 backdrop-blur-md rounded-xl p-4 md:p-5 border border-border/40 h-full animate-fade-in flex flex-col"
                  style={{
                    boxShadow: `0 8px 32px ${hoveredColor}10, 0 0 0 1px ${hoveredColor}10`,
                  }}
                >
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 relative"
                      style={{ background: `linear-gradient(135deg, ${hoveredColor}25, ${hoveredColor}10)` }}
                    >
                      <hoveredInfo.icon className="w-6 h-6 md:w-7 md:h-7" style={{ color: hoveredColor }} />
                      <div 
                        className="absolute inset-0 rounded-xl animate-pulse"
                        style={{ boxShadow: `inset 0 0 20px ${hoveredColor}20` }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base md:text-lg text-foreground mb-1 truncate">
                        {hoveredProduct.name}
                      </h4>
                      <span 
                        className="inline-block text-[10px] md:text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${hoveredColor}20`, color: hoveredColor }}
                      >
                        {hoveredInfo.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 leading-relaxed line-clamp-3">
                    {hoveredInfo.description}
                  </p>
                  
                  {hoveredInfo.connections.length > 0 && (
                    <div className="mb-3 md:mb-4">
                      <h5 className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2">
                        Integrates With
                      </h5>
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        {hoveredInfo.connections.map((conn) => {
                          const connProduct = validGuides.find(g => g.name === conn);
                          const connInfo = connProduct ? getProductInfo(connProduct.slug) : null;
                          const connColor = connInfo ? CATEGORY_COLORS[connInfo.category] : primaryColor;
                          return (
                            <span 
                              key={conn}
                              className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md font-medium cursor-pointer hover:scale-105 transition-transform"
                              style={{ background: `${connColor}15`, color: connColor }}
                              onClick={() => connProduct && navigate(`/product/${connProduct.slug}`)}
                            >
                              {conn.replace('GlobalLink ', '')}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2">
                    <button
                      onClick={() => navigate(`/product/${hoveredProduct.slug}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: `linear-gradient(135deg, ${hoveredColor}, ${hoveredColor}cc)`,
                        color: 'white',
                        boxShadow: `0 4px 16px ${hoveredColor}40`,
                      }}
                    >
                      View Product Guide
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-xl border border-dashed border-border/40 h-full flex items-center justify-center p-4 md:p-6">
                  <div className="text-center text-muted-foreground">
                    <Globe className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 opacity-30" />
                    <p className="text-xs md:text-sm">Hover a product to explore</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orbit Visualization */}
        <div 
          ref={containerRef}
          className="relative flex-1 w-full max-w-[400px] md:max-w-[500px] lg:max-w-[550px] aspect-square order-1 lg:order-2"
          onMouseLeave={handleProductLeave}
        >
          {/* Animated orbit rings */}
          <div 
            className="absolute inset-[8%] rounded-full border border-border/20 transition-all duration-500"
            style={{ 
              boxShadow: hoveredProduct 
                ? `0 0 60px ${hoveredColor}15, inset 0 0 40px ${hoveredColor}05`
                : `0 0 40px ${primaryColor}08`,
            }}
          />
          <div 
            className="absolute inset-[28%] rounded-full border border-border/25 transition-all duration-500"
            style={{ 
              boxShadow: hoveredProduct 
                ? `0 0 40px ${hoveredColor}20, inset 0 0 30px ${hoveredColor}08`
                : `0 0 30px ${primaryColor}10`,
            }}
          />
          
          {/* Decorative rotating ring */}
          <div 
            className="absolute inset-[18%] rounded-full border border-dashed border-border/10 pointer-events-none"
            style={{ 
              animation: `spin 120s linear infinite`,
              animationPlayState: animationStyle,
            }}
          />

          {/* Connection lines SVG */}
          {connectionLines.length > 0 && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#glow)">
                {connectionLines.map((line, i) => (
                  <ConnectionLine
                    key={i}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    color={hoveredColor}
                    delay={line.delay}
                  />
                ))}
              </g>
            </svg>
          )}

          {/* Center hub */}
          <div className="absolute inset-[40%] z-20">
            <div 
              className="w-full h-full rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer group overflow-hidden"
              style={{ 
                background: hoveredProduct
                  ? `linear-gradient(145deg, ${hoveredColor}60, ${hoveredColor}30)`
                  : `linear-gradient(145deg, ${primaryColor}50, ${primaryColor}25)`,
                boxShadow: hoveredProduct
                  ? `0 0 50px ${hoveredColor}50, inset 0 0 25px ${hoveredColor}25`
                  : `0 0 35px ${primaryColor}40, inset 0 0 15px ${primaryColor}15`,
                border: `3px solid ${hoveredProduct ? hoveredColor : primaryColor}70`,
              }}
              onClick={handleProductLeave}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 flex items-center justify-center w-full h-full p-3">
                <img 
                  src={globalLinkIcon} 
                  alt="GlobalLink" 
                  className="w-full h-full object-contain drop-shadow-lg"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                />
              </div>
            </div>
          </div>

          {/* Inner ring products */}
          <div 
            className="absolute inset-[18%] pointer-events-none"
            style={{ 
              animation: `spin 50s linear infinite`,
              animationPlayState: animationStyle,
            }}
          >
            {innerRing.map((product, i) => {
              const angle = (i * 360 / innerRing.length - 90) * (Math.PI / 180);
              const info = getProductInfo(product.slug);
              const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
              const globalIdx = validGuides.indexOf(product);
              const isActive = hoveredProduct?.id === product.id;
              const isConnected = connections.includes(globalIdx);
              
              return (
                <OrbitNode
                  key={product.id}
                  product={product}
                  angle={angle}
                  radius={50}
                  isActive={isActive}
                  isConnected={!isActive && isConnected}
                  categoryColor={categoryColor}
                  icon={info.icon}
                  animationStyle={animationStyle}
                  animationDuration={50}
                  reverse
                  onHover={(p) => handleProductHover(p)}
                  onLeave={handleProductLeave}
                  onClick={() => navigate(`/product/${product.slug}`)}
                />
              );
            })}
          </div>

          {/* Outer ring products */}
          <div 
            className="absolute inset-[3%] pointer-events-none"
            style={{ 
              animation: `spin 70s linear infinite reverse`,
              animationPlayState: animationStyle,
            }}
          >
            {outerRing.map((product, i) => {
              const angle = (i * 360 / outerRing.length - 90) * (Math.PI / 180);
              const info = getProductInfo(product.slug);
              const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
              const globalIdx = validGuides.indexOf(product);
              const isActive = hoveredProduct?.id === product.id;
              const isConnected = connections.includes(globalIdx);
              
              return (
                <OrbitNode
                  key={product.id}
                  product={product}
                  angle={angle}
                  radius={48}
                  isActive={isActive}
                  isConnected={!isActive && isConnected}
                  categoryColor={categoryColor}
                  icon={info.icon}
                  animationStyle={animationStyle}
                  animationDuration={70}
                  onHover={(p) => handleProductHover(p)}
                  onLeave={handleProductLeave}
                  onClick={() => navigate(`/product/${product.slug}`)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-6 md:mt-8 px-4">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <div 
              className="w-2 h-2 md:w-3 md:h-3 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}50` }}
            />
            <span className="text-muted-foreground">{category}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GlobalLinkUniverseSection;
