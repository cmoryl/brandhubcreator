import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isApproved: boolean;
  isLoading: boolean;
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

  // Split loading into: (1) session hydration, (2) access checks.
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);
  const isLoading = sessionLoading || accessLoading;

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error('Error checking admin role:', err);
      return false;
    }
  };

  const checkApprovalStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking approval status:', error);
        return false;
      }
      return data?.is_approved ?? false;
    } catch (err) {
      console.error('Error checking approval status:', err);
      return false;
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
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (cancelled) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setSessionLoading(false);
    });

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
      setAccessLoading(false);
      return;
    }

    // Avoid redundant checks for same user
    if (lastAccessCheckUserIdRef.current === userId) return;
    lastAccessCheckUserIdRef.current = userId;

    setAccessLoading(true);
    setTimeout(() => {
      Promise.all([checkAdminRole(userId), checkApprovalStatus(userId)])
        .then(([adminVal, approvedVal]) => {
          if (cancelled) return;
          setIsAdmin(adminVal);
          // Admins are always considered approved
          setIsApproved(adminVal || approvedVal);
        })
        .catch((err) => {
          console.error('Error checking user access:', err);
        })
        .finally(() => {
          if (!cancelled) setAccessLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isApproved, isLoading, signIn, signUp, signInWithGoogle, signOut }}>
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
