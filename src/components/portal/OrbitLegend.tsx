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

/**
 * OrbitLegend
 * A small, reliable, pointer-safe overlay used to control the GlobalAssetOrbit filter.
 * Kept separate from the orbit animation layers to avoid SVG/overlay pointer-event conflicts.
 */
export const OrbitLegend = React.forwardRef<HTMLDivElement, OrbitLegendProps>(
  ({ className, value, onValueChange, counts, ...props }, ref) => {
    const toggle = React.useCallback(
      (next: Exclude<OrbitFilter, "all">) => {
        onValueChange(value === next ? "all" : next);
      },
      [onValueChange, value]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-2 left-2 z-[250] flex flex-row items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto",
          className
        )}
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
        onPointerDownCapture={(e) => {
          // Capture-phase stopPropagation prevents parent overlays/gesture handlers from stealing the pointer.
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            toggle("brands");
          }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
            value === "brands" ? "bg-white/30 ring-1 ring-white/40" : "hover:bg-white/10"
          )}
        >
          <span className="text-[10px] font-medium text-white">Brands</span>
          {counts && (
            <span className="text-[9px] font-medium text-white/60">({counts.brands})</span>
          )}
        </button>

        <div className="w-px h-4 bg-white/20" />

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            toggle("products");
          }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
            value === "products" ? "bg-white/30 ring-1 ring-white/40" : "hover:bg-white/10"
          )}
        >
          <span className="text-[10px] font-medium text-white">Products</span>
          {counts && (
            <span className="text-[9px] font-medium text-white/60">({counts.products})</span>
          )}
        </button>

        <div className="w-px h-4 bg-white/20" />

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            toggle("events");
          }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
            value === "events" ? "bg-white/30 ring-1 ring-white/40" : "hover:bg-white/10"
          )}
        >
          <span className="text-[10px] font-medium text-white">Events</span>
          {counts && (
            <span className="text-[9px] font-medium text-white/60">({counts.events})</span>
          )}
        </button>
      </div>
    );
  }
);

OrbitLegend.displayName = "OrbitLegend";
