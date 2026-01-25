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
 * A small, reliable, pointer-safe overlay used to control the GlobalAssetOrbit filter.
 * Kept separate from the orbit animation layers to avoid SVG/overlay pointer-event conflicts.
 */
export const OrbitLegend = React.forwardRef<HTMLDivElement, OrbitLegendProps>(
  ({ className, value, onValueChange, counts, ...props }, ref) => {
    const handleClick = React.useCallback(
      (next: Exclude<OrbitFilter, "all">, e: React.PointerEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newValue = value === next ? "all" : next;
        console.log('[OrbitLegend] filter click:', { current: value, clicked: next, newValue });
        onValueChange(newValue);
      },
      [onValueChange, value]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-2 left-2 z-[300] flex flex-row items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-300",
          className
        )}
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.2)",
          pointerEvents: 'auto',
        }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onClickCapture={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Brands Button */}
        <button
          type="button"
          onPointerDown={(e) => handleClick("brands", e)}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none",
            value === "brands" 
              ? "bg-white/25 ring-2 ring-white/50 scale-105" 
              : "hover:bg-white/15 opacity-80 hover:opacity-100"
          )}
          style={{ 
            boxShadow: value === 'brands' ? `0 0 12px ${TYPE_COLORS.brands}60` : undefined 
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              background: TYPE_COLORS.brands,
              boxShadow: `0 0 6px ${TYPE_COLORS.brands}` 
            }}
          />
          <span 
            className="text-[11px] font-semibold"
            style={{ color: value === 'brands' ? TYPE_COLORS.brands : '#ffffff' }}
          >
            Brands
          </span>
          {counts && (
            <span className="text-[10px] font-medium text-white/60">
              ({counts.brands})
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Products Button */}
        <button
          type="button"
          onPointerDown={(e) => handleClick("products", e)}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none",
            value === "products" 
              ? "bg-white/25 ring-2 ring-white/50 scale-105" 
              : "hover:bg-white/15 opacity-80 hover:opacity-100"
          )}
          style={{ 
            boxShadow: value === 'products' ? `0 0 12px ${TYPE_COLORS.products}60` : undefined 
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              background: TYPE_COLORS.products,
              boxShadow: `0 0 6px ${TYPE_COLORS.products}` 
            }}
          />
          <span 
            className="text-[11px] font-semibold"
            style={{ color: value === 'products' ? TYPE_COLORS.products : '#ffffff' }}
          >
            Products
          </span>
          {counts && (
            <span className="text-[10px] font-medium text-white/60">
              ({counts.products})
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Events Button */}
        <button
          type="button"
          onPointerDown={(e) => handleClick("events", e)}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none",
            value === "events" 
              ? "bg-white/25 ring-2 ring-white/50 scale-105" 
              : "hover:bg-white/15 opacity-80 hover:opacity-100"
          )}
          style={{ 
            boxShadow: value === 'events' ? `0 0 12px ${TYPE_COLORS.events}60` : undefined 
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              background: TYPE_COLORS.events,
              boxShadow: `0 0 6px ${TYPE_COLORS.events}` 
            }}
          />
          <span 
            className="text-[11px] font-semibold"
            style={{ color: value === 'events' ? TYPE_COLORS.events : '#ffffff' }}
          >
            Events
          </span>
          {counts && (
            <span className="text-[10px] font-medium text-white/60">
              ({counts.events})
            </span>
          )}
        </button>
      </div>
    );
  }
);

OrbitLegend.displayName = "OrbitLegend";
