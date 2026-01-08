import { useState } from 'react';
import { Plus, X, Quote } from 'lucide-react';
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
        {/* Primary Tagline */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Primary Tagline</h3>
          {isEditing ? (
            <Input
              value={tagline.primary}
              onChange={(e) => onTaglineChange({ ...tagline, primary: e.target.value })}
              placeholder="Your main corporate tagline"
              className="text-lg"
            />
          ) : (
            <div className="flex items-center gap-3">
              <Quote className="h-6 w-6 text-primary shrink-0" />
              <p className="text-2xl font-serif font-semibold text-foreground italic">
                {tagline.primary || 'Add your primary tagline'}
              </p>
            </div>
          )}
        </div>

        {/* Secondary Tagline */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Secondary Tagline</h3>
          {isEditing ? (
            <Input
              value={tagline.secondary || ''}
              onChange={(e) => onTaglineChange({ ...tagline, secondary: e.target.value })}
              placeholder="An alternative or supporting tagline"
            />
          ) : (
            <p className="text-lg text-foreground">
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
              <Badge key={variation} variant="secondary" className="text-sm py-2 px-4">
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
