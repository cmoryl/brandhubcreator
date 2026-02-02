import { Calendar, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ActionPlan } from '@/types/competitiveAnalysis';

interface ActionPlanTimelineProps {
  actionPlan: ActionPlan;
}

export function ActionPlanTimeline({ actionPlan }: ActionPlanTimelineProps) {
  const phases = [
    {
      title: '30-Day Actions',
      icon: Clock,
      items: actionPlan.thirtyDay,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      title: '60-Day Actions',
      icon: Calendar,
      items: actionPlan.sixtyDay,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      title: '90-Day Actions',
      icon: Target,
      items: actionPlan.ninetyDay,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <div className="relative">
      {/* Timeline connector line */}
      <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-border hidden md:block" />
      
      <div className="grid gap-6">
        {phases.map((phase, phaseIndex) => (
          <Card key={phase.title} className={cn('relative', phase.borderColor, 'border-l-4')}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-full', phase.bgColor)}>
                  <phase.icon className={cn('w-5 h-5', phase.color)} />
                </div>
                <CardTitle className="text-lg">{phase.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <li 
                    key={itemIndex} 
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', phase.color.replace('text-', 'bg-'))} />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
