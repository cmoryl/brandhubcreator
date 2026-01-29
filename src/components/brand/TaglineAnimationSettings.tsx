/**
 * Tagline Animation Settings Component
 * Allows admins to select animation, hover, and environment effects for the tagline
 */

import { BrandHero } from '@/types/brand';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MousePointer, Wind } from 'lucide-react';
import {
  AnimatedTagline,
  TAGLINE_ANIMATION_OPTIONS,
  TAGLINE_HOVER_OPTIONS,
  TAGLINE_ENVIRONMENT_OPTIONS,
  TaglineAnimation,
  TaglineHoverEffect,
  TaglineEnvironment,
} from '@/components/ui/animated-tagline';

interface TaglineAnimationSettingsProps {
  hero: BrandHero;
  onHeroChange: (hero: BrandHero) => void;
}

export const TaglineAnimationSettings = ({ hero, onHeroChange }: TaglineAnimationSettingsProps) => {
  const currentAnimation = hero.taglineAnimation || 'fade-slide';
  const currentHover = hero.taglineHoverEffect || 'none';
  const currentEnvironment = hero.taglineEnvironment || 'none';

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Tagline Animation
        </CardTitle>
        <CardDescription className="text-xs">
          Customize how your tagline appears and interacts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className="min-h-[40px] flex items-center">
            <AnimatedTagline
              text={hero.tagline || 'Your brand tagline'}
              animation={currentAnimation}
              hoverEffect={currentHover}
              environment={currentEnvironment}
              className="text-lg font-medium text-foreground"
              animateOnMount
              key={`${currentAnimation}-${currentHover}-${currentEnvironment}`}
            />
          </div>
        </div>

        {/* Animation Selection */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Load Animation
          </Label>
          <Select
            value={currentAnimation}
            onValueChange={(value: TaglineAnimation) => 
              onHeroChange({ ...hero, taglineAnimation: value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAGLINE_ANIMATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hover Effect Selection */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <MousePointer className="h-3 w-3" />
            Hover Effect
          </Label>
          <Select
            value={currentHover}
            onValueChange={(value: TaglineHoverEffect) => 
              onHeroChange({ ...hero, taglineHoverEffect: value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAGLINE_HOVER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Environment Effect Selection */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <Wind className="h-3 w-3" />
            Environment Effect
          </Label>
          <Select
            value={currentEnvironment}
            onValueChange={(value: TaglineEnvironment) => 
              onHeroChange({ ...hero, taglineEnvironment: value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAGLINE_ENVIRONMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Effects Summary */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <Badge variant="secondary" className="text-xs">
            {TAGLINE_ANIMATION_OPTIONS.find(o => o.value === currentAnimation)?.label}
          </Badge>
          {currentHover !== 'none' && (
            <Badge variant="outline" className="text-xs">
              {TAGLINE_HOVER_OPTIONS.find(o => o.value === currentHover)?.label}
            </Badge>
          )}
          {currentEnvironment !== 'none' && (
            <Badge variant="outline" className="text-xs">
              {TAGLINE_ENVIRONMENT_OPTIONS.find(o => o.value === currentEnvironment)?.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaglineAnimationSettings;
