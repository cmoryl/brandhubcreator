import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

const PendingApprovalPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold text-xl text-foreground">BrandHub</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto p-4 bg-amber-500/10 rounded-full w-fit mb-4">
              <Clock className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
            <CardDescription className="text-base">
              Your account is awaiting administrator approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Signed in as</span>
              </div>
              <p className="font-medium">{user?.email}</p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Thank you for signing up! An administrator will review your account shortly.
              </p>
              <p>
                You'll receive full access once your account has been approved.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleRefresh} variant="default" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Check Approval Status
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
