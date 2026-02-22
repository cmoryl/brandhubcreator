/**
 * IconStudioStepper - Visual step progress indicator for Icon Studio wizard
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  optional?: boolean;
}

interface IconStudioStepperProps {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  completedSteps: Set<number>;
}

export const IconStudioStepper = ({
  steps,
  currentStepIndex,
  onStepClick,
  completedSteps,
}: IconStudioStepperProps) => {
  return (
    <div className="flex items-center w-full px-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStepIndex;
        const isCompleted = completedSteps.has(index);
        const isPast = index < currentStepIndex;
        const isClickable = isCompleted || isPast || index === currentStepIndex;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <button
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1 group transition-all min-w-[60px]',
                isClickable ? 'cursor-pointer' : 'cursor-default opacity-40'
              )}
            >
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all border-2',
                  isActive && 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25',
                  isCompleted && !isActive && 'border-primary bg-primary/10 text-primary',
                  isPast && !isCompleted && !isActive && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                  !isActive && !isCompleted && !isPast && 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight text-center max-w-[72px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-1 mt-[-14px]">
                <div
                  className={cn(
                    'h-0.5 w-full rounded-full transition-colors',
                    index < currentStepIndex ? 'bg-primary' : 'bg-border'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
