/**
 * Browsable template library grid with category filtering.
 * Shown as a collapsible panel within the Social Asset Studio.
 */
import { useState, useMemo } from 'react';
import { LayoutTemplate, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SocialTemplate,
  TemplateCategory,
  templateCategories,
  getTemplatesForPlatformFormat,
} from '@/lib/socialTemplates';
import { TemplatePreview } from './TemplatePreview';

interface TemplateLibraryProps {
  platform: string;
  format: string;
  selectedTemplate?: SocialTemplate | null;
  onSelectTemplate: (template: SocialTemplate | null) => void;
  aspectRatio?: number;
}

export const TemplateLibrary = ({
  platform,
  format,
  selectedTemplate,
  onSelectTemplate,
  aspectRatio = 1,
}: TemplateLibraryProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');

  const availableTemplates = useMemo(
    () => getTemplatesForPlatformFormat(platform, format),
    [platform, format],
  );

  const filteredTemplates = useMemo(
    () =>
      activeCategory === 'all'
        ? availableTemplates
        : availableTemplates.filter((t) => t.category === activeCategory),
    [availableTemplates, activeCategory],
  );

  // Get categories that have templates for this platform/format
  const availableCategories = useMemo(() => {
    const cats = new Set(availableTemplates.map((t) => t.category));
    return templateCategories.filter((c) => cats.has(c.id));
  }, [availableTemplates]);

  if (availableTemplates.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            <span>Templates</span>
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {availableTemplates.length}
            </Badge>
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-3">
          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50',
              )}
            >
              All
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Selected template clear */}
          {selectedTemplate && (
            <div className="flex items-center justify-between bg-primary/5 rounded-md px-3 py-1.5">
              <span className="text-xs font-medium">
                Using: {selectedTemplate.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onSelectTemplate(null)}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Template grid */}
          <div className="grid grid-cols-3 gap-2">
            {filteredTemplates.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                selected={selectedTemplate?.id === template.id}
                onSelect={onSelectTemplate}
                aspectRatio={aspectRatio}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No templates for this category
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
