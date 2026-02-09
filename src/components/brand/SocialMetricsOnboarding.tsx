/**
 * SocialMetricsOnboarding - Empty state with onboarding prompts for social metrics
 */

import { BarChart3, Plus, TrendingUp, Users, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SocialMetricsOnboardingProps {
  onAddMetrics: () => void;
  platformCount: number;
}

export const SocialMetricsOnboarding = ({ onAddMetrics, platformCount }: SocialMetricsOnboardingProps) => {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'Track Growth',
      description: 'Monitor follower growth and engagement trends over time'
    },
    {
      icon: Users,
      title: 'Compare Platforms',
      description: 'See which social channels perform best for your brand'
    },
    {
      icon: Target,
      title: 'Measure Sentiment',
      description: 'Track brand mentions and audience sentiment'
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Get AI-powered recommendations for social strategy'
    }
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Start Tracking Social Metrics</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Add metrics to your {platformCount} social profile{platformCount !== 1 ? 's' : ''} to unlock 
          powerful analytics, comparisons, and AI-driven insights.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-2 gap-3">
        {benefits.map((benefit, idx) => (
          <Card 
            key={benefit.title}
            className={cn(
              "bg-muted/30 border-muted animate-scale-in",
            )}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <CardContent className="pt-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{benefit.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Button onClick={onAddMetrics} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Your First Metrics
        </Button>
      </div>

      {/* Quick Tips */}
      <div className="bg-muted/30 rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Hover over any social profile card and click "Add metrics" to start tracking.
          You can enter data manually or integrate with analytics tools.
        </p>
      </div>
    </div>
  );
};
