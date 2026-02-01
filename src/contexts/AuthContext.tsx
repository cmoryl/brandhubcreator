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
  const [accessCheckVersion, setAccessCheckVersion] = useState(0);

  // Split loading into: (1) session hydration, (2) access checks.
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const isLoading = sessionLoading || accessLoading;

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

  // 1) Hydrate session (must be synchronous inside auth callbacks)
  useEffect(() => {
    let cancelled = false;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return;
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    // THEN check for existing session
    (async () => {
      try {
        const { data: { session: initialSession } } = await withTimeout(supabase.auth.getSession(), 6000);
        if (cancelled) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        // If the backend/network is temporarily unreachable, don't deadlock the app in "loading".
        if (cancelled) return;
        console.warn('[AUTH] getSession failed', err);
        setSession(null);
        setUser(null);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 2) Fetch access flags AFTER user is known (defer Supabase calls)
  const lastAccessCheckUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const userId = user?.id ?? null;

    if (!userId) {
      lastAccessCheckUserIdRef.current = null;
      setIsAdmin(false);
      setIsApproved(false);
      setAccessError(null);
      setAccessStatus('idle');
      setAccessLoading(false);
      return;
    }

    let attempt = 0;
    const MAX_ATTEMPTS = 5;
    const RETRY_MS = 1500;

    // Mark "auth still settling" immediately so pages don't route to /pending-approval
    // during the tiny window between session hydration and access checks.
    setAccessError(null);
    setAccessStatus('loading');
    setAccessLoading(true);

    const runCheck = () => {
      if (cancelled) return;

      // If we already successfully checked this user, don't repeat.
      if (lastAccessCheckUserIdRef.current === userId) return;

      attempt += 1;

      // Run both checks in parallel for faster resolution
      Promise.all([checkAdminRole(userId), checkApprovalStatus(userId)])
        .then(([adminRes, approvedRes]) => {
          if (cancelled) return;

          const allOk = adminRes.ok && approvedRes.ok;
          if (!allOk) {
            console.warn('[AUTH] Access check failed', {
              attempt,
              adminOk: adminRes.ok,
              approvedOk: approvedRes.ok,
            });

            // Keep previous flags on transient failure.
            if (attempt < MAX_ATTEMPTS) {
              setTimeout(runCheck, RETRY_MS);
            } else {
              // Stop "loading" so the UI remains usable; user can refresh/focus to retry.
              // IMPORTANT: On backend timeout, assume user is approved so they can use the app
              // This prevents users from being locked out during temporary infrastructure issues
              console.warn('[AUTH] Backend unreachable after retries - allowing app access');
              setIsAdmin(false);
              setIsApproved(true); // Grant access during outage
              setAccessError('Backend temporarily unreachable. Access granted with limited features.');
              setAccessStatus('ready'); // Mark as ready so user isn't stuck
              // CRITICAL: Do NOT mark the user as "checked" here.
              // If we cache this userId, we will never re-run the admin/approval checks on focus,
              // which can incorrectly hide admin-only UI (e.g., section visibility eye icons)
              // even after the backend becomes reachable again.
              setAccessLoading(false);
            }
            return;
          }

          const adminVal = adminRes.value;
          const approvedVal = approvedRes.value;

          setIsAdmin(adminVal);
          setIsApproved(adminVal || approvedVal);
          setAccessError(null);
          setAccessStatus('ready');
          lastAccessCheckUserIdRef.current = userId;
          setAccessLoading(false);
        })
        .catch((err) => {
          console.error('Error checking user access:', err);
          if (attempt < MAX_ATTEMPTS) {
            setTimeout(runCheck, RETRY_MS);
          } else {
            // Grant access during backend outage
            console.warn('[AUTH] Backend unreachable - granting app access');
            setIsAdmin(false);
            setIsApproved(true);
            setAccessError('Backend temporarily unreachable. Access granted with limited features.');
            setAccessStatus('ready');
            // Do not cache the check result on outage; allow re-check on focus/refresh.
            setAccessLoading(false);
          }
        });
    };

    // Initial check
    setTimeout(runCheck, 0);

    // Also retry when the tab regains focus (useful after waking from sleep / network hiccups)
    const onFocus = () => {
      // Only re-run if we haven't successfully checked yet.
      if (lastAccessCheckUserIdRef.current !== userId) {
        setAccessLoading(true);
        runCheck();
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id, accessCheckVersion]);

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
    // Force the access-check effect to run again for the current user.
    lastAccessCheckUserIdRef.current = null;
    setAccessCheckVersion((v) => v + 1);
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
