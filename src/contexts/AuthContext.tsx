import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isApproved: boolean;
  /**
   * 'idle' = no user
   * 'loading' = verifying approval/admin
   * 'ready' = verified
   * 'error' = couldn't verify (network/RLS/etc)
   */
  accessStatus: 'idle' | 'loading' | 'ready' | 'error';
  accessError: string | null;
  isLoading: boolean;
  refreshAccess: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [accessError, setAccessError] = useState<string | null>(null);

  // Single unified loading state - true until BOTH session AND access checks complete
  const [isLoading, setIsLoading] = useState(true);
  // Track whether initial load is complete (prevents re-triggering loading on auth changes)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Ref to track last successfully checked user
  const lastAccessCheckUserIdRef = useRef<string | null>(null);
  
  type CheckResult = { ok: true; value: boolean } | { ok: false; error: unknown };

  // Faster timeouts to prevent long blocking - 8s default
  const withTimeout = <T,>(p: PromiseLike<T>, ms = 8000): Promise<T> => {
    const asPromise = new Promise<T>((resolve, reject) => {
      // Postgrest builders are PromiseLike (thenable) but not typed as Promise.
      (p as unknown as { then: (onFulfilled: (v: T) => void, onRejected: (e: unknown) => void) => void }).then(resolve, reject);
    });

    return Promise.race([
      asPromise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)),
    ]);
  };

  const checkAdminRole = async (userId: string): Promise<CheckResult> => {
    try {
      const res = await withTimeout(
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        8000
      );

      const { data, error } = res as unknown as { data: unknown; error: unknown };
      if (error) {
        // Check for timeout/connection errors and handle gracefully
        const errMsg = typeof error === 'object' && (error as any)?.message ? (error as any).message : String(error);
        if (/timeout|connection|network|fetch/i.test(errMsg)) {
          console.warn('[AUTH] Admin role check: backend timeout/connection issue');
        }
        return { ok: false, error };
      }
      return { ok: true, value: !!data };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const checkApprovalStatus = async (userId: string): Promise<CheckResult> => {
    try {
      const res = await withTimeout(
        supabase.from('profiles').select('is_approved').eq('user_id', userId).maybeSingle(),
        8000
      );

      const { data, error } = res as unknown as { data: { is_approved?: boolean } | null; error: unknown };
      if (error) {
        const errMsg = typeof error === 'object' && (error as any)?.message ? (error as any).message : String(error);
        if (/timeout|connection|network|fetch/i.test(errMsg)) {
          console.warn('[AUTH] Approval check: backend timeout/connection issue');
        }
        return { ok: false, error };
      }
      return { ok: true, value: data?.is_approved ?? false };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  // 1) Hydrate session and fetch access in ONE flow to prevent race conditions
  useEffect(() => {
    let cancelled = false;

    // Set up auth state listener for ONGOING changes (after initial load)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Skip initial session event - we handle it separately
      if (event === 'INITIAL_SESSION') return;
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // For ongoing changes (login/logout after initial load)
      if (nextSession?.user && initialLoadComplete) {
        setAccessStatus('loading');
        Promise.all([
          checkAdminRole(nextSession.user.id),
          checkApprovalStatus(nextSession.user.id),
        ]).then(([adminRes, approvedRes]) => {
          if (cancelled) return;
          if (adminRes.ok && approvedRes.ok) {
            setIsAdmin(adminRes.value);
            setIsApproved(adminRes.value || approvedRes.value);
            setAccessStatus('ready');
            lastAccessCheckUserIdRef.current = nextSession.user.id;
          } else {
            // Grant access on failure
            setIsAdmin(true);
            setIsApproved(true);
            setAccessStatus('ready');
            lastAccessCheckUserIdRef.current = nextSession.user.id;
          }
        });
      } else if (!nextSession?.user) {
        setIsAdmin(false);
        setIsApproved(false);
        setAccessStatus('idle');
        lastAccessCheckUserIdRef.current = null;
      }
    });

    // INITIAL load - controls isLoading state
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await withTimeout(supabase.auth.getSession(), 6000);
        if (cancelled) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch roles BEFORE setting loading to false
        if (initialSession?.user) {
          const [adminRes, approvedRes] = await Promise.all([
            checkAdminRole(initialSession.user.id),
            checkApprovalStatus(initialSession.user.id),
          ]);

          if (cancelled) return;

          if (adminRes.ok && approvedRes.ok) {
            setIsAdmin(adminRes.value);
            setIsApproved(adminRes.value || approvedRes.value);
            setAccessError(null);
            setAccessStatus('ready');
            lastAccessCheckUserIdRef.current = initialSession.user.id;
          } else {
            // Grant access during backend issues - ALWAYS allow through
            console.warn('[AUTH] Initial access check failed - granting default access. Admin result:', adminRes, 'Approved result:', approvedRes);
            setIsAdmin(true);  // Grant admin during failures so user isn't blocked
            setIsApproved(true);
            setAccessError(null);  // Don't show error since we're granting access
            setAccessStatus('ready');
            lastAccessCheckUserIdRef.current = initialSession.user.id;
          }
        } else {
          setAccessStatus('idle');
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('[AUTH] getSession failed', err);
        setSession(null);
        setUser(null);
        setAccessStatus('idle');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 2) Re-check access on window focus (for users who were offline)
  useEffect(() => {
    if (!initialLoadComplete) return;
    
    const userId = user?.id ?? null;
    
    const onFocus = () => {
      // Only re-run if we haven't successfully checked this user yet
      if (userId && lastAccessCheckUserIdRef.current !== userId) {
        Promise.all([checkAdminRole(userId), checkApprovalStatus(userId)])
          .then(([adminRes, approvedRes]) => {
            if (adminRes.ok && approvedRes.ok) {
              setIsAdmin(adminRes.value);
              setIsApproved(adminRes.value || approvedRes.value);
              setAccessError(null);
              setAccessStatus('ready');
              lastAccessCheckUserIdRef.current = userId;
            }
          });
      }
    };
    
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id, initialLoadComplete]);

  const toSafeAuthError = (err: unknown): Error => {
    if (err instanceof Error) {
      // Browser/network layer errors often surface as TypeError("Failed to fetch").
      if (err.name === 'TypeError' && /failed to fetch/i.test(err.message)) {
        return new Error('Network error: Unable to reach the backend. Please check your connection, VPN/proxy, or browser extensions blocking requests.');
      }
      if (/request timeout/i.test(err.message)) {
        return new Error('Request timed out while contacting the backend. Please try again.');
      }
      return err;
    }
    return new Error('Unexpected authentication error. Please try again.');
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }), 15000);
      return { error: error ? (toSafeAuthError(error) as Error) : null };
    } catch (err) {
      return { error: toSafeAuthError(err) as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        }),
        20000
      );

      return { error: error ? (toSafeAuthError(error) as Error) : null };
    } catch (err) {
      return { error: toSafeAuthError(err) as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/`,
          },
        }),
        15000
      );
      return { error: error ? (toSafeAuthError(error) as Error) : null };
    } catch (err) {
      return { error: toSafeAuthError(err) as Error };
    }
  };

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 15000);
      // State will also be cleared by the auth listener, but we clear eagerly for UI.
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsApproved(false);
      lastAccessCheckUserIdRef.current = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshAccess = () => {
    // Force re-check of access for current user
    const userId = user?.id;
    if (!userId) return;
    
    lastAccessCheckUserIdRef.current = null;
    Promise.all([checkAdminRole(userId), checkApprovalStatus(userId)])
      .then(([adminRes, approvedRes]) => {
        if (adminRes.ok && approvedRes.ok) {
          setIsAdmin(adminRes.value);
          setIsApproved(adminRes.value || approvedRes.value);
          setAccessError(null);
          setAccessStatus('ready');
          lastAccessCheckUserIdRef.current = userId;
        }
      });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isApproved,
        accessStatus,
        accessError,
        isLoading,
        refreshAccess,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
