/**
 * AssistantOrb - Animated orb visual for the Brand Assistant
 * Inspired by voice-assistant orb design with concentric rings and glow effects
 */

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface AssistantOrbProps {
  state: OrbState;
  onClick?: () => void;
  className?: string;
}

export function AssistantOrb({ state, onClick, className }: AssistantOrbProps) {
  const isActive = state !== 'idle';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer focus:outline-none transition-transform hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      aria-label={state === 'listening' ? 'Listening - tap to stop' : 'Tap to start voice'}
    >
      {/* Outer glow ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-700',
          state === 'listening' && 'animate-pulse shadow-[0_0_60px_20px_hsl(var(--primary)/0.3)]',
          state === 'speaking' && 'animate-pulse shadow-[0_0_60px_20px_hsl(var(--accent)/0.25)]',
          state === 'thinking' && 'shadow-[0_0_40px_15px_hsl(var(--primary)/0.15)]',
          state === 'idle' && 'group-hover:shadow-[0_0_40px_10px_hsl(var(--primary)/0.15)]'
        )}
      />

      {/* Outermost ring */}
      <div
        className={cn(
          'w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500',
          'bg-gradient-to-b from-muted/80 to-muted/40 border border-border/30',
          isActive && 'from-primary/15 to-primary/5 border-primary/20'
        )}
      >
        {/* Middle ring */}
        <div
          className={cn(
            'w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500',
            'bg-gradient-to-b from-muted to-muted/60 border border-border/40 shadow-inner',
            isActive && 'from-primary/20 to-primary/10 border-primary/30'
          )}
        >
          {/* Inner ring / core */}
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500',
              'bg-gradient-to-b from-muted-foreground/10 to-muted/80 border border-border/50',
              'shadow-[inset_0_-4px_12px_rgba(0,0,0,0.15),inset_0_4px_8px_rgba(255,255,255,0.05)]',
              state === 'listening' && 'from-primary/30 to-primary/15 border-primary/40 shadow-[inset_0_-4px_12px_hsl(var(--primary)/0.2),0_0_20px_hsl(var(--primary)/0.2)]',
              state === 'speaking' && 'from-accent/20 to-accent/10 border-accent/30',
              state === 'thinking' && 'from-primary/20 to-primary/10 border-primary/25'
            )}
          >
            {state === 'thinking' ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : state === 'listening' ? (
              <Mic className={cn(
                'h-8 w-8 text-primary transition-all duration-300',
                'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
              )} />
            ) : (
              <Mic className="h-8 w-8 text-muted-foreground/70 group-hover:text-foreground transition-colors duration-300" />
            )}
          </div>
        </div>
      </div>

      {/* Pulsing ring animation for listening */}
      {state === 'listening' && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </>
      )}

      {/* Speaking wave indicator */}
      {state === 'speaking' && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 items-end h-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-1 bg-accent/60 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s',
                height: `${8 + Math.random() * 8}px`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
