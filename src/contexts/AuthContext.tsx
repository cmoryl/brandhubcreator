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
  const [isLoading, setIsLoading] = useState(true);

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

  // Avoid duplicate admin-role checks (getSession + INITIAL_SESSION)
  const lastAdminCheckUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleSession = (nextSession: Session | null) => {
      if (cancelled) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      const nextUserId = nextSession?.user?.id ?? null;
      if (!nextUserId) {
        lastAdminCheckUserIdRef.current = null;
        setIsAdmin(false);
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      // Dedupe repeated checks for the same user during boot
      if (lastAdminCheckUserIdRef.current === nextUserId) {
        setIsLoading(false);
        return;
      }
      lastAdminCheckUserIdRef.current = nextUserId;

      setTimeout(() => {
        Promise.all([
          checkAdminRole(nextUserId),
          checkApprovalStatus(nextUserId),
        ]).then(([adminVal, approvedVal]) => {
          if (!cancelled) {
            setIsAdmin(adminVal);
            // Admins are always considered approved
            setIsApproved(adminVal || approvedVal);
          }
        });
      }, 0);

      setIsLoading(false);
    };

    // 1) Get current session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2) Subscribe for future changes (skip INITIAL_SESSION to avoid double-run)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return;
      handleSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsApproved(false);
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
