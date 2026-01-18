import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { WifiOff, AlertTriangle, RefreshCw, LogIn, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ConnectivityDiagnostics } from "@/components/ConnectivityDiagnostics";

/**
 * Global, lightweight banner that appears when the backend can't be reached.
 * Shows connectivity and access issues to help users understand what's happening.
 */
export function ConnectionBanner() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith("/auth");

  const { user, accessStatus, accessError, refreshAccess, isLoading } = useAuth();

  const state = useMemo(() => {
    // Check browser online status
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Network offline takes priority.
    if (!isOnline) {
      return {
        kind: "offline" as const,
        title: "You're offline",
        description: "Changes will stay on this device and sync when you're back online.",
      };
    }

    // Access check failure means we couldn't confirm approval/admin, not that you're unapproved.
    if (user && accessStatus === "error") {
      return {
        kind: "auth" as const,
        title: "Signed in, but access can't be verified",
        description: accessError || "The backend couldn't confirm your approval/admin status right now.",
      };
    }

    return null;
  }, [user, accessStatus, accessError]);

  if (!state) return null;

  const Icon = state.kind === "offline" ? WifiOff : AlertTriangle;

  return (
    <div className="sticky top-0 z-[60] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 py-3 sm:items-center sm:px-6 lg:px-8">
        <div className="mt-0.5 rounded-md bg-muted px-2 py-2">
          <Icon className="h-4 w-4 text-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{state.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{state.description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Diagnostics button */}
          <ConnectivityDiagnostics
            trigger={
              <Button type="button" size="sm" variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                Run Diagnostics
              </Button>
            }
          />

          {user && state.kind === "auth" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={isLoading}
              onClick={() => refreshAccess()}
            >
              <RefreshCw className="h-4 w-4" />
              Retry access
            </Button>
          )}

          {state.kind === "offline" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </Button>
          )}

          {!user && !isAuthRoute && (
            <Button type="button" size="sm" variant="outline" className="gap-2" asChild>
              <a href="/auth">
                <LogIn className="h-4 w-4" />
                Sign in
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
