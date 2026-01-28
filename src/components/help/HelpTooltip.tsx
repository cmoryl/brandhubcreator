import React from 'react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { helpSections } from '@/lib/helpContent';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  /** The help section ID to link to */
  sectionId?: string;
  /** Custom tooltip content (overrides section lookup) */
  content?: React.ReactNode;
  /** Custom quick tip text */
  tip?: string;
  /** Additional className for the trigger */
  className?: string;
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Position of the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Whether to show as inline with text */
  inline?: boolean;
  children?: React.ReactNode;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * HelpTooltip - A reusable tooltip component that links to help documentation.
 * 
 * Usage:
 * ```tsx
 * // With section ID (auto-fetches content from helpContent.ts)
 * <HelpTooltip sectionId="color-palette" />
 * 
 * // With custom tip
 * <HelpTooltip tip="Click to add a new color to your palette" />
 * 
 * // Inline with text
 * <Label>Primary Color <HelpTooltip sectionId="color-palette" inline /></Label>
 * ```
 */
export const HelpTooltip = React.forwardRef<HTMLButtonElement, HelpTooltipProps>(
  ({ 
    sectionId, 
    content, 
    tip, 
    className, 
    size = 'sm', 
    side = 'top',
    inline = false,
    children 
  }, ref) => {
    const section = sectionId ? helpSections.find(s => s.id === sectionId) : null;

    const tooltipContent = content || (
      <div className="max-w-xs space-y-2">
        {section ? (
          <>
            <p className="font-medium text-sm">{section.title}</p>
            <p className="text-xs text-muted-foreground">{section.description}</p>
            <Link 
              to={`/help?section=${section.id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </Link>
          </>
        ) : tip ? (
          <p className="text-xs">{tip}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No help available</p>
        )}
      </div>
    );

    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full",
              inline && "inline-flex ml-1 align-middle",
              className
            )}
          >
            {children || <HelpCircle className={sizeMap[size]} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="p-3">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  }
);

HelpTooltip.displayName = 'HelpTooltip';

/**
 * Quick tooltip presets for common sections
 */
export const HelpTooltips = {
  ColorPalette: () => <HelpTooltip sectionId="color-palette" inline />,
  Typography: () => <HelpTooltip sectionId="typography" inline />,
  LogoManagement: () => <HelpTooltip sectionId="logo-management" inline />,
  BrandIdentity: () => <HelpTooltip sectionId="brand-identity" inline />,
  VoiceTone: () => <HelpTooltip sectionId="voice-tone" inline />,
  Iconography: () => <HelpTooltip sectionId="iconography" inline />,
  Publishing: () => <HelpTooltip sectionId="publishing" inline />,
  TeamManagement: () => <HelpTooltip sectionId="team-management" inline />,
  Services: () => <HelpTooltip sectionId="services-section" inline />,
  Templates: () => <HelpTooltip sectionId="templates" inline />,
};

export default HelpTooltip;
