/**
 * ColorCombinationPreview - Visual swatch preview for color combinations
 * Shows approved, rejected, and testing combinations with visual context
 */

import { cn } from '@/lib/utils';
import { Check, X, FlaskConical } from 'lucide-react';
import { ColorCombination } from '@/types/brand';

interface ColorCombinationPreviewProps {
  combination: ColorCombination;
  onClick?: () => void;
  isEditing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ColorCombinationPreview = ({
  combination,
  onClick,
  isEditing = false,
  size = 'md',
}: ColorCombinationPreviewProps) => {
  const sizeClasses = {
    sm: { container: 'h-10', swatch: 'h-8' },
    md: { container: 'h-14', swatch: 'h-12' },
    lg: { container: 'h-20', swatch: 'h-16' },
  };

  const statusConfig = {
    approved: {
      icon: Check,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'Approved',
    },
    rejected: {
      icon: X,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Rejected',
    },
    testing: {
      icon: FlaskConical,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Testing',
    },
  };

  const status = statusConfig[combination.status];
  const StatusIcon = status.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border transition-all overflow-hidden group',
        status.border,
        isEditing ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'
      )}
    >
      {/* Color swatches */}
      <div className={cn('flex', sizeClasses[size].container)}>
        {combination.colors.map((color, index) => (
          <div
            key={index}
            className={cn(
              'flex-1 transition-transform group-hover:scale-105 relative',
              sizeClasses[size].swatch
            )}
            style={{ backgroundColor: color }}
          >
            {/* Show hex on hover for larger sizes */}
            {size !== 'sm' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span 
                  className="text-[8px] font-mono px-1 py-0.5 rounded bg-black/50 text-white"
                >
                  {color.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Status and name bar */}
      <div className={cn('flex items-center justify-between px-2 py-1.5', status.bg)}>
        <div className="flex items-center gap-1.5 min-w-0">
          <StatusIcon className={cn('h-3 w-3 shrink-0', status.color)} />
          <span className="text-xs font-medium truncate">{combination.name}</span>
        </div>
        {combination.notes && size !== 'sm' && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
            {combination.notes}
          </span>
        )}
      </div>
    </button>
  );
};

// Grid display for multiple combinations
interface ColorCombinationGridProps {
  combinations: ColorCombination[];
  onCombinationClick?: (combination: ColorCombination) => void;
  editingId?: string | null;
  showEmpty?: boolean;
  emptyMessage?: string;
}

export const ColorCombinationGrid = ({
  combinations,
  onCombinationClick,
  editingId,
  showEmpty = true,
  emptyMessage = 'No combinations added yet',
}: ColorCombinationGridProps) => {
  if (combinations.length === 0 && showEmpty) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {combinations.map((combination) => (
        <ColorCombinationPreview
          key={combination.id}
          combination={combination}
          onClick={() => onCombinationClick?.(combination)}
          isEditing={editingId === combination.id}
        />
      ))}
    </div>
  );
};

// Mini preview for use in selection contexts
export const ColorCombinationMini = ({ colors }: { colors: string[] }) => {
  return (
    <div className="flex h-5 rounded overflow-hidden shadow-sm">
      {colors.slice(0, 4).map((color, index) => (
        <div
          key={index}
          className="flex-1 min-w-[12px]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export default ColorCombinationPreview;
