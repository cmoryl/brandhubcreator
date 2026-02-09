/**
 * GlobalLinkOnboarding - Activation prompt for GlobalLink suite features
 * Shows when an entity has no localization configured
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe2, 
  Languages, 
  Sparkles, 
  MapPin, 
  ArrowRight,
  Zap,
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalLinkOnboardingProps {
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  onGetStarted: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

const GLOBALLINK_PRODUCTS = [
  {
    id: 'translation',
    name: 'Translation',
    description: 'AI-powered translation for 50+ languages',
    icon: Languages,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'ai',
    name: 'AI Adaptation',
    description: 'Cultural context and tone optimization',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'regions',
    name: 'Regional Variants',
    description: 'Localized brand guides by region',
    icon: MapPin,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'connect',
    name: 'Workflow Automation',
    description: 'Automated translation pipelines',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

export const GlobalLinkOnboarding: React.FC<GlobalLinkOnboardingProps> = ({
  entityType,
  entityName,
  onGetStarted,
  onDismiss,
  compact = false,
}) => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  if (compact) {
    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Globe2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">Go Global with {entityName}</p>
                <p className="text-sm text-muted-foreground">
                  Translate and adapt for international markets
                </p>
              </div>
            </div>
            <Button onClick={onGetStarted} size="sm" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
              <Globe2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">GlobalLink Suite</h3>
              <p className="text-white/80">
                Take {entityName} global with enterprise localization
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            Not Configured
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {GLOBALLINK_PRODUCTS.map((product) => (
            <div
              key={product.id}
              className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer",
                hoveredProduct === product.id 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-primary/50"
              )}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", product.bgColor)}>
                  <product.icon className={cn("h-5 w-5", product.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{product.name}</h4>
                    {hoveredProduct === product.id && (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>50+ Languages</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-500" />
              <span>Cultural Adaptation</span>
            </div>
          </div>
          <div className="flex gap-2">
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Maybe Later
              </Button>
            )}
            <Button onClick={onGetStarted} className="gap-2">
              Configure GlobalLink
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalLinkOnboarding;
