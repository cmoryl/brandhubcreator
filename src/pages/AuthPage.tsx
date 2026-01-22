import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Mail, Lock, ArrowLeft, Loader2, Chrome, RotateCcw, Activity, AlertTriangle } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';
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

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      // If we can't verify approval/admin right now, don't shove users into /pending-approval.
      if (accessStatus === 'error') {
        toast({
          title: 'Signed in, but access could not be verified',
          description: accessError || 'Please refresh and try again.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Only route based on approval once the access checks are verified.
      if (accessStatus === 'ready') {
        if (isAdmin || isApproved) navigate('/');
        else navigate('/pending-approval');
      }
    }
  }, [user, isAdmin, isApproved, accessStatus, accessError, authLoading, navigate, toast]);
  
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
        // The useEffect will handle navigation based on approval status
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
                alt="TransPerfect" 
                className="h-8 w-auto"
              />
              <span className="font-semibold text-xl text-foreground">BrandHub</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-accent/10 rounded-2xl w-fit mb-4">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
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
          <CardContent>
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
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="admin@example.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetForm(true);
                          setResetEmail(loginEmail);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                    className="w-full"
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
                        // Use generic message for security
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
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
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
                    className="w-full"
                    onClick={async () => {
                      setIsGoogleLoading(true);
                      const { error } = await signInWithGoogle();
                      if (error) {
                        // Use generic message for security
                        console.error('[AUTH] Google sign-up failed:', error.message);
                        toast({
                          title: 'Sign-Up Failed',
                          description: 'Unable to sign up with Google. Please try again.',
                          variant: 'destructive',
                        });
                        setIsGoogleLoading(false);
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
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
