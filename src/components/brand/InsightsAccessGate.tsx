import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

  // Admins and authenticated users bypass the gate
  const shouldShowGate = !canEdit && !isAuthenticated && !!accessCode && !isUnlocked;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim() === accessCode) {
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
        <div className="relative">
          {/* Blurred content preview */}
          <div className="pointer-events-none select-none blur-md opacity-50" aria-hidden>
            {children}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto">
                <Lock className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Protected Content</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the access code to view Insights & Updates.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Input
                    type={showCode ? 'text' : 'password'}
                    placeholder="Enter access code"
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setError(''); }}
                    className={cn("pr-10", error && "border-destructive")}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full gap-2">
                  <Lock className="h-4 w-4" />
                  Unlock
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
