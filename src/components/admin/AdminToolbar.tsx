/**
 * AdminToolbar Component
 * Consolidated top admin bar for brand/product/event editors
 * Groups all admin-only actions in one place
 */

import { useState, ReactNode } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Settings,
  Brain,
  FileText,
  HardDrive,
  Download,
  History,
  Eye,
  EyeOff,
  Palette,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AdminToolbarAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
  /** Render a custom component (like a Sheet trigger) instead of a button */
  render?: () => ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  badge?: string | number;
}

interface AdminToolbarProps {
  /** Whether to show the toolbar */
  isVisible: boolean;
  /** Guide type for labeling */
  guideType: 'brand' | 'product' | 'event';
  /** Custom actions to render */
  actions?: AdminToolbarAction[];
  /** Whether sections panel is showing hidden sections */
  showingHiddenSections?: boolean;
  /** Toggle hidden sections visibility */
  onToggleHiddenSections?: () => void;
  /** Number of hidden sections */
  hiddenSectionCount?: number;
  className?: string;
}

export const AdminToolbar = ({
  isVisible,
  guideType,
  actions = [],
  showingHiddenSections,
  onToggleHiddenSections,
  hiddenSectionCount = 0,
  className,
}: AdminToolbarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible) return null;

  const guideLabel = guideType.charAt(0).toUpperCase() + guideType.slice(1);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20',
          className
        )}
      >
        {/* Collapsed state - just the trigger bar */}
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2 flex items-center justify-between hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Admin Tools
              </span>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {guideLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {!isExpanded && actions.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {actions.length} actions
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Section visibility toggle */}
              {onToggleHiddenSections && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showingHiddenSections ? 'default' : 'outline'}
                      size="sm"
                      onClick={onToggleHiddenSections}
                      className="h-8 gap-1.5"
                    >
                      {showingHiddenSections ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {showingHiddenSections ? 'Showing Hidden' : 'Hidden Sections'}
                      </span>
                      {hiddenSectionCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                          {hiddenSectionCount}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showingHiddenSections
                      ? 'Click to hide hidden sections from view'
                      : `Show ${hiddenSectionCount} hidden section(s) in the sidebar`}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Divider */}
              {onToggleHiddenSections && actions.length > 0 && (
                <div className="h-6 w-px bg-border mx-1" />
              )}

              {/* Custom actions */}
              {actions.map((action) =>
                action.render ? (
                  <div key={action.id}>{action.render()}</div>
                ) : (
                  <Tooltip key={action.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.onClick}
                        className="h-8 gap-1.5"
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{action.label}</span>
                        {action.badge !== undefined && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-xs ml-1">
                            {action.badge}
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{action.label}</TooltipContent>
                  </Tooltip>
                )
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
