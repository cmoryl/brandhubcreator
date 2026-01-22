import { cn } from '@/lib/utils';

interface BrandHubLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function BrandHubLogo({ className, size = 'md', showIcon = true }: BrandHubLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <div className={cn(
          'rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center',
          iconSizes[size]
        )}>
          <span className="text-white font-bold text-xs">BH</span>
        </div>
      )}
      <span className={cn('font-semibold tracking-tight text-foreground', sizeClasses[size])}>
        Brand<span className="text-accent">HUB</span>
      </span>
    </div>
  );
}
