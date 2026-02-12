import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const UNIVERSAL_ACCESS_CODE = 'MarComm';

interface InsightsAccessGateProps {
  accessCode?: string;
  onAccessCodeChange?: (code: string) => void;
  canEdit: boolean;
  children: React.ReactNode;
}

export const InsightsAccessGate = ({
  accessCode,
  onAccessCodeChange,
  canEdit,
  children,
}: InsightsAccessGateProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState(accessCode || '');

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Admins and authenticated users bypass the gate; public users always see the gate
  const shouldShowGate = !canEdit && !isAuthenticated && !isUnlocked;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = codeInput.trim();
    // Accept universal code always, or entity-specific code if one is set
    if (trimmed === UNIVERSAL_ACCESS_CODE || (accessCode && trimmed === accessCode)) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Incorrect access code');
    }
  };

  const handleSaveCode = () => {
    onAccessCodeChange?.(newCode.trim());
    setIsEditingCode(false);
  };

  return (
    <div className="relative">
      {/* Admin access code settings */}
      {canEdit && (
        <div className="mb-4 flex items-center gap-3">
          {isEditingCode ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 w-full">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Set access code for public users (leave empty to disable)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="h-8 text-sm flex-1"
              />
              <Button size="sm" variant="default" onClick={handleSaveCode}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditingCode(false); setNewCode(accessCode || ''); }}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingCode(true)}
              className="gap-2 text-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              {accessCode ? `Access Code: ${accessCode}` : 'Set Access Code'}
            </Button>
          )}
        </div>
      )}

      {/* Gate overlay for public users */}
      {shouldShowGate ? (
        <div className="relative min-h-[420px] rounded-2xl overflow-hidden">
          {/* Blurred content preview */}
          <div className="pointer-events-none select-none blur-lg opacity-30 scale-[1.02]" aria-hidden>
            {children}
          </div>

          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 z-[1]">
            <div 
              className="absolute inset-0 opacity-60"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.1) 30%, hsl(var(--muted) / 0.2) 60%, hsl(var(--primary) / 0.12) 100%)',
                backgroundSize: '300% 300%',
                animation: 'aurora 10s ease-in-out infinite',
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.6) 50%, transparent 80%)',
              }}
            />
          </div>

          {/* Glass card */}
          <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
            <div 
              className="relative max-w-sm w-full text-center space-y-5 p-8 rounded-3xl border border-border/30"
              style={{
                background: 'hsl(var(--card) / 0.7)',
                backdropFilter: 'blur(24px) saturate(1.4)',
                boxShadow: '0 8px 32px hsl(var(--primary) / 0.08), 0 2px 8px hsl(var(--foreground) / 0.04), inset 0 1px 0 hsl(var(--background) / 0.5)',
              }}
            >
              {/* Accent line */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-16 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }}
              />

              {/* Icon with glow */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.12)',
                }}
              >
                <Lock className="h-7 w-7 text-primary" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground tracking-tight">Protected Insights</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter your access code to unlock analytics, intelligence reports, and brand insights.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div className="relative group">
                  <Input
                    type={showCode ? 'text' : 'password'}
                    placeholder="Access code"
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setError(''); }}
                    className={cn(
                      "pr-10 h-11 rounded-xl bg-background/60 border-border/50 text-center text-sm tracking-widest font-medium placeholder:tracking-normal placeholder:font-normal transition-all duration-200 focus:bg-background/80 focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]",
                      error && "border-destructive/60 focus:border-destructive/60 focus:shadow-[0_0_0_3px_hsl(var(--destructive)/0.1)]"
                    )}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-destructive animate-fade-in-up">{error}</p>
                )}
                <Button 
                  type="submit" 
                  className="w-full gap-2 h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                  }}
                >
                  <Lock className="h-4 w-4" />
                  Unlock Insights
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
