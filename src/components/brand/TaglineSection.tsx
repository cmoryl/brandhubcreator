import { useState } from 'react';
import { Plus, X, Quote, Sparkles } from 'lucide-react';
import { BrandTagline } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';

interface TaglineSectionProps {
  tagline: BrandTagline;
  onTaglineChange: (tagline: BrandTagline) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const TaglineSection = ({ tagline, onTaglineChange, customSubtitle, onSubtitleChange }: TaglineSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newVariation, setNewVariation] = useState('');

  const addVariation = () => {
    if (newVariation.trim() && !tagline.variations?.includes(newVariation.trim())) {
      onTaglineChange({ 
        ...tagline, 
        variations: [...(tagline.variations || []), newVariation.trim()] 
      });
      setNewVariation('');
    }
  };

  const removeVariation = (variation: string) => {
    onTaglineChange({ 
      ...tagline, 
      variations: tagline.variations?.filter(v => v !== variation) || [] 
    });
  };

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Corporate Tagline"
        defaultSubtitle="Your brand's memorable signature phrases"
        customSubtitle={customSubtitle}
        onSubtitleChange={onSubtitleChange}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <div className="grid gap-6">
        {/* Primary Tagline - Flashy Design */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-[gradient-shift_8s_ease_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_40%)]" />
          
          {/* Floating sparkle effects */}
          <div className="absolute top-4 left-8 animate-pulse">
            <Sparkles className="h-5 w-5 text-white/40" />
          </div>
          <div className="absolute bottom-6 right-12 animate-pulse delay-300">
            <Sparkles className="h-4 w-4 text-white/30" />
          </div>
          <div className="absolute top-1/2 right-8 animate-pulse delay-700">
            <Sparkles className="h-3 w-3 text-white/25" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-[0.3em]">Primary Tagline</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
            
            {isEditing ? (
              <Input
                value={tagline.primary}
                onChange={(e) => onTaglineChange({ ...tagline, primary: e.target.value })}
                placeholder="Your main corporate tagline"
                className="text-xl md:text-2xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm"
              />
            ) : (
              <div className="flex flex-col items-center text-center">
                <Quote className="h-10 w-10 text-white/40 mb-4 rotate-180" />
                <p className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  {tagline.primary || 'Add your primary tagline'}
                </p>
                <Quote className="h-10 w-10 text-white/40 mt-4" />
              </div>
            )}
          </div>
          
          {/* Bottom glow line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm" />
        </div>

        {/* Secondary Tagline */}
        <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Secondary Tagline</h3>
          {isEditing ? (
            <Input
              value={tagline.secondary || ''}
              onChange={(e) => onTaglineChange({ ...tagline, secondary: e.target.value })}
              placeholder="An alternative or supporting tagline"
            />
          ) : (
            <p className="text-xl font-medium text-foreground">
              {tagline.secondary || 'No secondary tagline set'}
            </p>
          )}
        </div>

        {/* Tagline Variations */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Tagline Variations</h3>
          <p className="text-sm text-muted-foreground mb-4">Campaign or context-specific tagline variations</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tagline.variations?.map((variation) => (
              <Badge key={variation} variant="secondary" className="text-sm py-2 px-4 bg-primary/10 hover:bg-primary/20 transition-colors">
                "{variation}"
                {isEditing && (
                  <button onClick={() => removeVariation(variation)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(!tagline.variations || tagline.variations.length === 0) && !isEditing && (
              <span className="text-muted-foreground">No variations added yet</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newVariation}
                onChange={(e) => setNewVariation(e.target.value)}
                placeholder="e.g., Campaign-specific tagline..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation())}
                className="max-w-md"
              />
              <Button variant="outline" size="icon" onClick={addVariation}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
