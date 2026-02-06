import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Mail, Lock, ArrowLeft, Loader2, Chrome, RotateCcw, Activity, AlertTriangle } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectivityDiagnostics } from '@/components/ConnectivityDiagnostics';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { user, isAdmin, isApproved, accessStatus, accessError, isLoading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [authNetworkIssue, setAuthNetworkIssue] = useState<string | null>(null);
  // Detect stale session issues - if auth is loading for too long, offer recovery
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setShowSessionRecovery(true);
      }
    }, 8000); // Show recovery option after 8 seconds of loading

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Clear session recovery option when auth finishes
  useEffect(() => {
    if (!authLoading) {
      setShowSessionRecovery(false);
    }
  }, [authLoading]);

  const handleClearSession = async () => {
    try {
      // Sign out to clear any stale tokens
      await supabase.auth.signOut();
      // Clear all Supabase-related localStorage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      toast({
        title: 'Session cleared',
        description: 'Please try signing in again.',
      });
      // Reload to get a fresh state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  // Redirect authenticated users - wait for BOTH auth AND org to settle to prevent flash
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // No user = stay on auth page
    if (!user) return;

    // Handle access verification error
    if (accessStatus === 'error') {
      toast({
        title: 'Signed in, but access could not be verified',
        description: accessError || 'Please refresh and try again.',
        variant: 'destructive',
      });
      // Still redirect to dashboard on error - don't block user
      navigate('/dashboard', { replace: true });
      return;
    }

    // Wait for access to be verified
    if (accessStatus !== 'ready') return;

    // Handle unapproved users
    if (!isAdmin && !isApproved) {
      navigate('/pending-approval', { replace: true });
      return;
    }

    // Wait for org loading to complete to determine correct destination
    if (orgLoading) return;

    // Redirect directly to org portal if user has organization (prevents dashboard flash)
    if (organization) {
      sessionStorage.setItem('welcomeToast', JSON.stringify({
        orgName: organization.name,
        timestamp: Date.now()
      }));
      navigate(`/org/${organization.slug}`, { replace: true });
    } else {
      // No org - go to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAdmin, isApproved, accessStatus, accessError, authLoading, orgLoading, organization, navigate, toast]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      authSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);

      if (error) {
        const message = error.message || 'Unable to sign in.';
        const isNetwork = /failed to fetch|network error|timeout|unreachable/i.test(message);

        if (isNetwork) {
          setAuthNetworkIssue(message);
          // Show recovery tools immediately for connectivity issues.
          setShowSessionRecovery(true);
        }

        toast({
          title: 'Sign In Failed',
          description: isNetwork
            ? 'Network error: the app cannot reach the backend right now. Try disabling VPN/proxy/ad-blockers, switching networks, or using an incognito window. Then run diagnostics below.'
            : 'Invalid credentials. Please check your email and password.',
          variant: 'destructive',
        });

        // Avoid logging sensitive details; keep minimal.
        console.error('[AUTH] Login failed:', message);
      } else {
        setAuthNetworkIssue(null);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        // Navigation handled by useEffect watching user/accessStatus
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        console.error('[AUTH] Password reset failed:', error.message);
        // Generic message to prevent email enumeration
        toast({
          title: 'Reset Email Sent',
          description: 'If an account exists with this email, you will receive a password reset link.',
        });
      } else {
        toast({
          title: 'Reset Email Sent',
          description: 'Check your inbox for a password reset link.',
        });
      }
      setShowResetForm(false);
      setResetEmail('');
    } catch (err) {
      console.error('[AUTH] Password reset error:', err);
      toast({
        title: 'Error',
        description: 'Unable to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      authSchema.parse({ email: signupEmail, password: signupPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setIsLoading(false);

    if (error) {
      // Use generic message to prevent user enumeration attacks
      // Don't reveal whether the email exists or not
      console.error('[AUTH] Signup failed:', error.message);
      toast({
        title: 'Registration',
        description: 'If this email is available, you will be able to sign in. Please check your email or try logging in.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Your account is pending admin approval. You will be notified once approved.',
      });
      navigate('/pending-approval');
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Header - Mobile optimized with larger touch targets */}
      <header className="border-b border-border safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
                alt="TransPerfect" 
                className="h-7 sm:h-8 w-auto"
              />
              <span className="font-semibold text-lg sm:text-xl text-foreground">BrandHub</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Mobile optimized with safe area support */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 safe-area-inset-bottom">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center px-4 sm:px-6 pt-5 sm:pt-6">
            <div className="mx-auto p-3 bg-accent/10 rounded-2xl w-fit mb-3 sm:mb-4">
              <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Admin Access</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sign in to manage and publish brand guides
            </CardDescription>

            {/* Connectivity issue callout */}
            {authNetworkIssue && (
              <div className="mt-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Backend not reachable</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your browser can’t reach the authentication service (requests are failing to fetch). This is usually caused by a VPN/proxy,
                      ad-blocker/privacy extension, corporate firewall, or a backend outage.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <ConnectivityDiagnostics
                        trigger={
                          <Button type="button" variant="outline" size="sm" className="gap-2">
                            <Activity className="h-4 w-4" />
                            Run diagnostics
                          </Button>
                        }
                      />
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleClearSession}>
                        <RotateCcw className="h-4 w-4" />
                        Clear session
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Session recovery option */}
            {showSessionRecovery && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-2">
                <p className="text-muted-foreground">
                  Having trouble signing in? Your session may be stale.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSession}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear session
                  </Button>

                  <ConnectivityDiagnostics
                    trigger={
                      <Button type="button" variant="outline" size="sm" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Run diagnostics
                      </Button>
                    }
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
            {/* Password Reset Form */}
            {showResetForm ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isResetLoading}>
                  {isResetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResetForm(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </form>
            ) : (
            <div className="w-full">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="admin@example.com"
                        className="pl-10 h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetForm(true);
                          setResetEmail(loginEmail);
                        }}
                        className="text-xs text-primary hover:underline touch-manipulation py-1"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pl-10 h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 sm:h-10 text-base sm:text-sm touch-manipulation" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 sm:h-10 text-base sm:text-sm touch-manipulation"
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      const { error } = await signInWithGoogle();
                      if (error) {
                        const message = error.message || 'Unable to sign in with Google.';
                        const isNetwork = /failed to fetch|network error|timeout|unreachable/i.test(message);
                        if (isNetwork) {
                          setAuthNetworkIssue(message);
                          setShowSessionRecovery(true);
                        }
                        console.error('[AUTH] Google sign-in failed:', message);
                        toast({
                          title: 'Sign-In Failed',
                          description: isNetwork
                            ? 'Network error: the app cannot reach the backend right now. Run diagnostics and try disabling VPN/proxy/ad-blockers.'
                            : 'Unable to sign in with Google. Please try again.',
                          variant: 'destructive',
                        });
                        setIsGoogleLoading(false);
                      } else {
                        setAuthNetworkIssue(null);
                      }
                    }}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>
                </form>
                
                {/* Request Access & Back Options */}
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Need access? Get in touch with us.
                    </p>
                    <Button
                      variant="link"
                      className="text-primary"
                      onClick={() => navigate('/contact')}
                    >
                      Request Access
                    </Button>
                  </div>
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => navigate('/')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </div>
                </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
