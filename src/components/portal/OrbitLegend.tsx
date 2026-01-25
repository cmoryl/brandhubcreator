import * as React from "react";
import { cn } from "@/lib/utils";

export type OrbitFilter = "all" | "brands" | "products" | "events";

export interface OrbitLegendProps extends React.HTMLAttributes<HTMLDivElement> {
  value: OrbitFilter;
  onValueChange: (value: OrbitFilter) => void;
  counts?: {
    brands: number;
    products: number;
    events: number;
  };
}

// Match the colors from GlobalAssetOrbit
const TYPE_COLORS = {
  brands: '#14b8a6',   // Teal
  products: '#38bdf8', // Light blue (sky-400)
  events: '#f59e0b',   // Amber
};

/**
 * OrbitLegend
 * Interactive filter control with animated visual effects.
 * Click a category to filter, click again to show all.
 */
export const OrbitLegend = React.forwardRef<HTMLDivElement, OrbitLegendProps>(
  ({ className, value, onValueChange, counts, style, ...props }, ref) => {
    const handleClick = React.useCallback(
      (next: Exclude<OrbitFilter, "all">, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newValue = value === next ? "all" : next;
        onValueChange(newValue);
      },
      [onValueChange, value]
    );

    const isAll = value === "all";

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-0.5 p-1.5 rounded-2xl backdrop-blur-md border transition-all duration-500",
          className
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
          borderColor: isAll ? 'rgba(255,255,255,0.15)' : 
            value === 'brands' ? `${TYPE_COLORS.brands}40` :
            value === 'products' ? `${TYPE_COLORS.products}40` :
            `${TYPE_COLORS.events}40`,
          boxShadow: isAll ? '0 4px 24px rgba(0,0,0,0.3)' :
            value === 'brands' ? `0 4px 24px ${TYPE_COLORS.brands}20, 0 0 40px ${TYPE_COLORS.brands}10` :
            value === 'products' ? `0 4px 24px ${TYPE_COLORS.products}20, 0 0 40px ${TYPE_COLORS.products}10` :
            `0 4px 24px ${TYPE_COLORS.events}20, 0 0 40px ${TYPE_COLORS.events}10`,
          ...style,
        }}
        {...props}
      >
        {/* Brands */}
        <LegendButton
          label="Brands"
          count={counts?.brands}
          color={TYPE_COLORS.brands}
          isActive={value === 'brands'}
          isVisible={isAll || value === 'brands'}
          onClick={(e) => handleClick("brands", e)}
        />

        {/* Separator */}
        <div className="w-px h-6 bg-white/10 mx-0.5" />

        {/* Products */}
        <LegendButton
          label="Products"
          count={counts?.products}
          color={TYPE_COLORS.products}
          isActive={value === 'products'}
          isVisible={isAll || value === 'products'}
          onClick={(e) => handleClick("products", e)}
        />

        {/* Separator */}
        <div className="w-px h-6 bg-white/10 mx-0.5" />

        {/* Events */}
        <LegendButton
          label="Events"
          count={counts?.events}
          color={TYPE_COLORS.events}
          isActive={value === 'events'}
          isVisible={isAll || value === 'events'}
          onClick={(e) => handleClick("events", e)}
        />
      </div>
    );
  }
);

OrbitLegend.displayName = "OrbitLegend";

// Animated legend button with orbital ring effect
interface LegendButtonProps {
  label: string;
  count?: number;
  color: string;
  isActive: boolean;
  isVisible: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const LegendButton = ({ label, count, color, isActive, isVisible, onClick }: LegendButtonProps) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-300 overflow-hidden group",
        isActive 
          ? "scale-105" 
          : isVisible 
            ? "hover:scale-102" 
            : "opacity-40 hover:opacity-60"
      )}
      style={{
        background: isActive 
          ? `linear-gradient(135deg, ${color}25 0%, ${color}15 100%)` 
          : isHovered 
            ? `${color}10` 
            : 'transparent',
        boxShadow: isActive ? `inset 0 0 20px ${color}15, 0 0 20px ${color}20` : undefined,
      }}
    >
      {/* Animated orbital indicator */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Outer spinning ring */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full border transition-all duration-500",
            isActive ? "opacity-100" : "opacity-0"
          )}
          style={{
            borderColor: color,
            animation: isActive ? 'spin 3s linear infinite' : undefined,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
        
        {/* Middle pulsing ring */}
        <div 
          className={cn(
            "absolute inset-[2px] rounded-full border transition-all duration-500",
            (isActive || isHovered) ? "opacity-80" : "opacity-40"
          )}
          style={{
            borderColor: `${color}80`,
            animation: (isActive || isHovered) ? 'pulse 2s ease-in-out infinite' : undefined,
          }}
        />
        
        {/* Core dot */}
        <div 
          className="w-2 h-2 rounded-full transition-all duration-300"
          style={{ 
            background: color,
            boxShadow: (isActive || isHovered) 
              ? `0 0 6px ${color}, 0 0 12px ${color}80` 
              : `0 0 4px ${color}60`,
            transform: (isActive || isHovered) ? 'scale(1.2)' : 'scale(1)',
          }}
        />
        
        {/* Orbiting particle (only when active) */}
        {isActive && (
          <div 
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 4px ${color}`,
              animation: 'orbit 2s linear infinite',
              transformOrigin: '8px 8px',
            }}
          />
        )}
      </div>
      
      {/* Label */}
      <span 
        className="text-xs font-semibold tracking-wide transition-all duration-300"
        style={{ 
          color: isActive ? color : isVisible ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
          textShadow: isActive ? `0 0 10px ${color}40` : undefined,
        }}
      >
        {label}
      </span>
      
      {/* Count badge */}
      {count !== undefined && (
        <span 
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-300",
            isActive ? "scale-110" : ""
          )}
          style={{ 
            background: isActive ? `${color}30` : 'rgba(255,255,255,0.1)',
            color: isActive ? color : 'rgba(255,255,255,0.6)',
            boxShadow: isActive ? `0 0 8px ${color}30` : undefined,
          }}
        >
          {count}
        </span>
      )}
      
      {/* Shimmer effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500",
          isHovered && !isActive && "opacity-100"
        )}
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}10 50%, transparent 100%)`,
          animation: isHovered ? 'shimmer 1.5s ease-in-out infinite' : undefined,
        }}
      />
    </button>
  );
};

// Add CSS keyframes for the orbit animation
if (typeof document !== 'undefined') {
  const styleId = 'orbit-legend-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(6px) rotate(0deg); }
        to { transform: rotate(360deg) translateX(6px) rotate(-360deg); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
}
