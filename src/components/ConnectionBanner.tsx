import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { WifiOff, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { useBrands } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

/**
 * Global, lightweight banner that appears when the backend can't be reached.
 * IMPORTANT: On /auth we avoid touching BrandContext to prevent brand-sync calls
 * from interfering with login flows during outages.
 */
export function ConnectionBanner() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname.startsWith("/auth");

  const { user, accessStatus, accessError, refreshAccess, isLoading } = useAuth();

  // Only read brand sync state when not on auth route.
  const brands = isAuthRoute
    ? null
    : (() => {
        try {
          return useBrands();
        } catch {
          return null;
        }
      })();

  const state = useMemo(() => {
    const syncStatus = brands?.syncStatus;
    const isOnline = brands?.isOnline ?? true;
    const lastSyncError = brands?.lastSyncError ?? null;

    // Network offline takes priority.
    if (!isOnline || syncStatus === "offline") {
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

    // Data sync failures (brands/products/org/etc) generally present as "features missing".
    if (!isAuthRoute && syncStatus === "error") {
      return {
        kind: "data" as const,
        title: "Can't reach the backend",
        description: lastSyncError || "Some data couldn't be loaded. Please retry in a moment.",
      };
    }

    return null;
  }, [brands?.syncStatus, brands?.isOnline, brands?.lastSyncError, user, accessStatus, accessError, isAuthRoute]);

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

          {!isAuthRoute && (state.kind === "data" || state.kind === "offline") && brands?.refetch && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                void brands.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Retry data
            </Button>
          )}

          {!user && (
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

