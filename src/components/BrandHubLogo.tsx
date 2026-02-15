 import React, { forwardRef } from 'react';
 import { cn } from '@/lib/utils';
 import { useTheme } from 'next-themes';
 import tpLogoWhite from '@/assets/tp-logo-white.svg';
 import tpLogoColor from '@/assets/tp-logo-color.svg';
 
interface BrandHubLogoProps {
   className?: string;
   size?: 'sm' | 'md' | 'lg';
   showIcon?: boolean;
   forceDark?: boolean;
 }
 
export const BrandHubLogo = forwardRef<HTMLDivElement, BrandHubLogoProps>(
   ({ className, size = 'md', showIcon = true, forceDark = false }, ref) => {
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

     const logo = (forceDark || resolvedTheme === 'dark') ? tpLogoWhite : tpLogoColor;
 
     return (
       <div ref={ref} className={cn('flex items-center gap-2', className)}>
         {showIcon && (
           <img 
             src={logo} 
             alt="BrandHUB" 
             className={cn(iconSizes[size], 'object-contain')} 
           />
         )}
         <span className={cn('font-semibold tracking-tight', forceDark ? 'text-white' : 'text-foreground', sizeClasses[size])}>
           Brand<span style={{ color: '#139cd8' }}>HUB</span>
         </span>
       </div>
     );
   }
 );
 
 BrandHubLogo.displayName = 'BrandHubLogo';
