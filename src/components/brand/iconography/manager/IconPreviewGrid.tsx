/**
 * IconPreviewGrid - Expandable icon preview grid for collections
 * Shows 2 rows by default (~24 icons), expandable to show all
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BrandIconography } from '@/types/brand';

interface IconPreviewGridProps {
  icons: BrandIconography[];
  onPreviewIcon: (icon: BrandIconography) => void;
  renderIconPreview: (icon: BrandIconography) => React.ReactNode;
}

const DEFAULT_VISIBLE = 24; // ~2 rows at typical widths

export const IconPreviewGrid = ({
  icons,
  onPreviewIcon,
  renderIconPreview,
}: IconPreviewGridProps) => {
  const [expanded, setExpanded] = useState(false);

  const hasMore = icons.length > DEFAULT_VISIBLE;
  const visibleIcons = expanded ? icons : icons.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {visibleIcons.map((icon) => (
          <button
            key={icon.id}
            onClick={() => onPreviewIcon(icon)}
            className="w-7 h-7 shrink-0 border rounded flex items-center justify-center bg-muted/30 hover:bg-muted transition-colors"
            title={icon.name}
          >
            <div className="w-4 h-4">
              {renderIconPreview(icon)}
            </div>
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show all {icons.length} icons
            </>
          )}
        </button>
      )}
    </div>
  );
};
