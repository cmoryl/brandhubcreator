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
 * Interactive filter control for the GlobalAssetOrbit visualization.
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
          "inline-flex items-center gap-1 p-1 rounded-lg bg-muted/80 backdrop-blur-sm border border-border/50",
          className
        )}
        style={style}
        {...props}
      >
        {/* Brands */}
        <button
          type="button"
          onClick={(e) => handleClick("brands", e)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
            value === "brands" 
              ? "bg-background shadow-sm" 
              : isAll 
                ? "hover:bg-background/50" 
                : "opacity-50 hover:opacity-75"
          )}
        >
          <div 
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ 
              background: TYPE_COLORS.brands,
              boxShadow: (value === 'brands' || isAll) ? `0 0 8px ${TYPE_COLORS.brands}` : undefined
            }}
          />
          <span className="text-xs font-medium text-foreground">
            Brands
          </span>
          {counts && (
            <span className="text-xs text-muted-foreground">
              {counts.brands}
            </span>
          )}
        </button>

        {/* Products */}
        <button
          type="button"
          onClick={(e) => handleClick("products", e)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
            value === "products" 
              ? "bg-background shadow-sm" 
              : isAll 
                ? "hover:bg-background/50" 
                : "opacity-50 hover:opacity-75"
          )}
        >
          <div 
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ 
              background: TYPE_COLORS.products,
              boxShadow: (value === 'products' || isAll) ? `0 0 8px ${TYPE_COLORS.products}` : undefined
            }}
          />
          <span className="text-xs font-medium text-foreground">
            Products
          </span>
          {counts && (
            <span className="text-xs text-muted-foreground">
              {counts.products}
            </span>
          )}
        </button>

        {/* Events */}
        <button
          type="button"
          onClick={(e) => handleClick("events", e)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
            value === "events" 
              ? "bg-background shadow-sm" 
              : isAll 
                ? "hover:bg-background/50" 
                : "opacity-50 hover:opacity-75"
          )}
        >
          <div 
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ 
              background: TYPE_COLORS.events,
              boxShadow: (value === 'events' || isAll) ? `0 0 8px ${TYPE_COLORS.events}` : undefined
            }}
          />
          <span className="text-xs font-medium text-foreground">
            Events
          </span>
          {counts && (
            <span className="text-xs text-muted-foreground">
              {counts.events}
            </span>
          )}
        </button>
      </div>
    );
  }
);

OrbitLegend.displayName = "OrbitLegend";
