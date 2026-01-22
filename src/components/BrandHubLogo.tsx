import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

interface BrandHubLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function BrandHubLogo({ className, size = 'md', showIcon = true }: BrandHubLogoProps) {
  const { resolvedTheme } = useTheme();
  
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

  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <img 
          src={logo} 
          alt="BrandHUB" 
          className={cn(iconSizes[size], 'object-contain')} 
        />
      )}
      <span className={cn('font-semibold tracking-tight text-foreground', sizeClasses[size])}>
        Brand<span className="text-accent">HUB</span>
      </span>
    </div>
  );
}
