import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check } from 'lucide-react';
import { BrandGradient, LayoutPreset } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';
import { LayoutSelector, useLayoutClasses } from './LayoutSelector';

interface GradientsSectionProps {
  gradients: BrandGradient[];
  onGradientsChange: (gradients: BrandGradient[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

export const GradientsSection = ({ gradients, onGradientsChange, customSubtitle, onSubtitleChange, layout = 'grid-3', onLayoutChange }: GradientsSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const { gridClass, cardClass, isListView } = useLayoutClasses(layout);

  const addGradient = () => {
    const newGradient: BrandGradient = {
      id: crypto.randomUUID(),
      name: 'New Gradient',
      css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
    onGradientsChange([...gradients, newGradient]);
    setEditingId(newGradient.id);
  };

  const updateGradient = (id: string, updates: Partial<BrandGradient>) => {
    onGradientsChange(gradients.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGradient = (id: string) => {
    onGradientsChange(gradients.filter(g => g.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copyCSS = async (css: string, id: string) => {
    await navigator.clipboard.writeText(css);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Gradients"
            defaultSubtitle="Define atmospheric depth with CSS gradients"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'compact']}
              size="sm"
            />
          )}
          {onGradientsChange && (
            <Button onClick={addGradient} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Gradient</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      <div className={gridClass}>
        {gradients.map((gradient, index) => (
          <div
            key={gradient.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
          {/* Gradient preview */}
          <div
            className={`${isListView ? 'w-24 h-full' : 'h-32'} relative cursor-pointer`}
            style={{ background: gradient.css }}
            onClick={() => copyCSS(gradient.css, gradient.id)}
          >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                {copiedId === gradient.id ? (
                  <div className="flex items-center gap-1 text-white text-sm font-medium">
                    <Check className="h-4 w-4" />
                    Copied!
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white text-sm font-medium">
                    <Copy className="h-4 w-4" />
                    Copy CSS
                  </div>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); deleteGradient(gradient.id); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Gradient info */}
            <div className="p-4 space-y-3">
              {editingId === gradient.id ? (
                <div className="space-y-2">
                  <Input
                    value={gradient.name}
                    onChange={(e) => updateGradient(gradient.id, { name: e.target.value })}
                    placeholder="Gradient name"
                    className="h-8"
                  />
                  <Textarea
                    value={gradient.css}
                    onChange={(e) => updateGradient(gradient.id, { css: e.target.value })}
                    placeholder="CSS gradient value"
                    className="min-h-[60px] text-sm font-mono resize-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{gradient.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-[180px]">{gradient.css}</p>
                  </div>
                  <button
                    onClick={() => setEditingId(gradient.id)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {gradients.length === 0 && (
          <button
            onClick={addGradient}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first gradient</span>
          </button>
        )}
      </div>
    </section>
  );
};
