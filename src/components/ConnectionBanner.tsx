import { useMemo, useState, useEffect } from "react";
import { WifiOff, AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-import context hooks so we don't crash if providers aren't ready yet.
let useBrandsHook: typeof import("@/contexts/BrandContext").useBrands | null = null;
let useAuthHook: typeof import("@/contexts/AuthContext").useAuth | null = null;

try {
  // These may throw if used outside provider, we'll handle that gracefully.
  useBrandsHook = require("@/contexts/BrandContext").useBrands;
  useAuthHook = require("@/contexts/AuthContext").useAuth;
} catch {
  // Fallback – hooks not available yet.
}

/**
 * Global, lightweight banner that appears when the backend can't be reached.
 * This prevents "missing features" + "pending approval" false-positives during outages.
 */
export function ConnectionBanner() {
  const [ready, setReady] = useState(false);

  // Wait a tick for providers to mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) return null;

  return <ConnectionBannerInner />;
}

function ConnectionBannerInner() {
  // Safe access to contexts – if provider not mounted, return null.
  let syncStatus: "idle" | "syncing" | "offline" | "error" = "idle";
  let isOnline = true;
  let lastSyncError: string | null = null;
  let refetch: (() => Promise<void>) | null = null;

  let user: unknown = null;
  let accessStatus: "idle" | "loading" | "ready" | "error" = "idle";
  let accessError: string | null = null;
  let refreshAccess: (() => void) | null = null;
  let isLoading = false;

  try {
    if (useBrandsHook) {
      const brands = useBrandsHook();
      syncStatus = brands.syncStatus;
      isOnline = brands.isOnline;
      lastSyncError = brands.lastSyncError;
      refetch = brands.refetch;
    }
  } catch {
    // Context not available – skip brand info.
  }

  try {
    if (useAuthHook) {
      const auth = useAuthHook();
      user = auth.user;
      accessStatus = auth.accessStatus;
      accessError = auth.accessError;
      refreshAccess = auth.refreshAccess;
      isLoading = auth.isLoading;
    }
  } catch {
    // Context not available – skip auth info.
  }

  const state = useMemo(() => {
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
    if (syncStatus === "error") {
      return {
        kind: "data" as const,
        title: "Can't reach the backend",
        description: lastSyncError || "Some data couldn't be loaded. Please retry in a moment.",
      };
    }

    return null;
  }, [isOnline, syncStatus, lastSyncError, user, accessStatus, accessError]);

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
          {user && state.kind === "auth" && refreshAccess && (
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

          {(state.kind === "data" || state.kind === "offline") && refetch && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => refetch()}
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
