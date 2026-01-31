/**
 * Tagline Animation Settings Component
 * Allows admins to select animation, hover, and environment effects for the tagline
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, MousePointer, Wind } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AnimatedTagline,
  TAGLINE_ANIMATION_OPTIONS,
  TAGLINE_HOVER_OPTIONS,
  TAGLINE_ENVIRONMENT_OPTIONS,
  TaglineAnimation,
  TaglineHoverEffect,
  TaglineEnvironment,
} from '@/components/ui/animated-tagline';
import { AnimationPreviewCards } from './settings/AnimationPreviewCards';

export interface TaglineAnimationSettingsProps {
  animation: TaglineAnimation;
  hoverEffect: TaglineHoverEffect;
  environment: TaglineEnvironment;
  onAnimationChange: (animation: TaglineAnimation) => void;
  onHoverEffectChange: (effect: TaglineHoverEffect) => void;
  onEnvironmentChange: (env: TaglineEnvironment) => void;
  previewText?: string;
}

export const TaglineAnimationSettings = ({ 
  animation,
  hoverEffect,
  environment,
  onAnimationChange,
  onHoverEffectChange,
  onEnvironmentChange,
  previewText = 'Your tagline here'
}: TaglineAnimationSettingsProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Animation
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Tagline Animation
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Customize how your tagline appears and interacts
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="min-h-[40px] flex items-center">
              <AnimatedTagline
                text={previewText}
                animation={animation}
                hoverEffect={hoverEffect}
                environment={environment}
                className="text-lg font-medium text-foreground"
                animateOnMount
                key={`${animation}-${hoverEffect}-${environment}`}
              />
            </div>
          </div>

          {/* Animation Selection with Visual Previews */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Load Animation
            </Label>
            <AnimationPreviewCards
              options={TAGLINE_ANIMATION_OPTIONS}
              value={animation}
              onChange={onAnimationChange}
            />
          </div>

          {/* Hover Effect Selection */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <MousePointer className="h-3 w-3" />
              Hover Effect
            </Label>
            <Select
              value={hoverEffect}
              onValueChange={(value: TaglineHoverEffect) => onHoverEffectChange(value)}
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
              value={environment}
              onValueChange={(value: TaglineEnvironment) => onEnvironmentChange(value)}
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
              {TAGLINE_ANIMATION_OPTIONS.find(o => o.value === animation)?.label}
            </Badge>
            {hoverEffect !== 'none' && (
              <Badge variant="outline" className="text-xs">
                {TAGLINE_HOVER_OPTIONS.find(o => o.value === hoverEffect)?.label}
              </Badge>
            )}
            {environment !== 'none' && (
              <Badge variant="outline" className="text-xs">
                {TAGLINE_ENVIRONMENT_OPTIONS.find(o => o.value === environment)?.label}
              </Badge>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TaglineAnimationSettings;
