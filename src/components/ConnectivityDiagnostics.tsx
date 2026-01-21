import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Shield,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TestStatus = "idle" | "testing" | "pass" | "fail";

interface DiagnosticResult {
  status: TestStatus;
  latency?: number;
  error?: string;
}

interface DiagnosticsState {
  network: DiagnosticResult;
  auth: DiagnosticResult;
  database: DiagnosticResult;
}

const initialState: DiagnosticsState = {
  network: { status: "idle" },
  auth: { status: "idle" },
  database: { status: "idle" },
};

export function ConnectivityDiagnostics({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<DiagnosticsState>(initialState);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (
    key: keyof DiagnosticsState,
    result: DiagnosticResult
  ) => {
    setResults((prev) => ({ ...prev, [key]: result }));
  };

  const testNetwork = useCallback(async (): Promise<DiagnosticResult> => {
    const start = performance.now();

    // Fast fail if the browser knows we're offline.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { status: "fail", error: "Browser reports you are offline." };
    }

    try {
      // Test reachability to the backend host specifically (most common cause is corporate/VPN blocking).
      const backendOrigin = new URL(import.meta.env.VITE_SUPABASE_URL).origin;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // no-cors yields an opaque response, but will still fail on DNS/TCP blocks.
      await fetch(backendOrigin, { mode: "no-cors", signal: controller.signal });

      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);
      return { status: "pass", latency };
    } catch (error) {
      return {
        status: "fail",
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach the backend host",
      };
    }
  }, []);

  const testAuth = useCallback(async (): Promise<DiagnosticResult> => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      // Test auth endpoint by getting current session
      const { error } = await supabase.auth.getSession();

      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);

      if (error) {
        return { status: "fail", error: error.message };
      }
      return { status: "pass", latency };
    } catch (error) {
      return {
        status: "fail",
        error:
          error instanceof Error ? error.message : "Auth service unreachable",
      };
    }
  }, []);

  const testDatabase = useCallback(async (): Promise<DiagnosticResult> => {
    const start = performance.now();
    try {
      // Test database connectivity with the secure RPC function
      const { error } = await supabase
        .rpc("get_public_organization_info")
        .limit(1);

      const latency = Math.round(performance.now() - start);

      if (error) {
        // Check if it's an RLS/permission error (which means DB is reachable)
        if (
          error.code === "PGRST116" ||
          error.message.includes("permission") ||
          error.message.includes("RLS")
        ) {
          return { status: "pass", latency };
        }
        return { status: "fail", error: error.message };
      }
      return { status: "pass", latency };
    } catch (error) {
      return {
        status: "fail",
        error:
          error instanceof Error
            ? error.message
            : "Database service unreachable",
      };
    }
  }, []);

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setResults(initialState);

    // Test network first
    updateResult("network", { status: "testing" });
    const networkResult = await testNetwork();
    updateResult("network", networkResult);

    // Test auth endpoint
    updateResult("auth", { status: "testing" });
    const authResult = await testAuth();
    updateResult("auth", authResult);

    // Test database
    updateResult("database", { status: "testing" });
    const dbResult = await testDatabase();
    updateResult("database", dbResult);

    setIsRunning(false);
  }, [testNetwork, testAuth, testDatabase]);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case "testing":
        return <Badge variant="secondary">Testing...</Badge>;
      case "pass":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Passed</Badge>;
      case "fail":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not tested</Badge>;
    }
  };

  const allPassed =
    results.network.status === "pass" &&
    results.auth.status === "pass" &&
    results.database.status === "pass";

  const hasFailures =
    results.network.status === "fail" ||
    results.auth.status === "fail" ||
    results.database.status === "fail";

  const getTroubleshootingSteps = () => {
    const steps: string[] = [];

    if (results.network.status === "fail") {
      steps.push("Check your internet connection");
      steps.push("If you're on a corporate network, try a hotspot to confirm it's not a firewall restriction");
    }

    if (results.auth.status === "fail" || results.database.status === "fail") {
      steps.push("Disable VPN / proxy temporarily");
      steps.push("Disable ad-blockers / privacy extensions for this site");
      steps.push("Try an Incognito/Private window");
      steps.push("Try a different network (hotspot) to rule out firewall blocks");
      steps.push("Ask your IT/security team to allowlist the app's backend domain");
    }

    if (
      results.auth.error?.toLowerCase().includes("timeout") ||
      results.database.error?.toLowerCase().includes("timeout")
    ) {
      steps.push("Backend may be under load — wait 1–2 minutes and retry");
    }

    return steps.length > 0 ? steps : null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="h-4 w-4" />
            Diagnostics
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Connectivity Diagnostics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Test Results */}
          <div className="space-y-3">
            {/* Network Test */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.network.status)}
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Internet Connection</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {results.network.latency && (
                  <span className="text-xs text-muted-foreground">
                    {results.network.latency}ms
                  </span>
                )}
                {getStatusBadge(results.network.status)}
              </div>
            </div>

            {/* Auth Test */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.auth.status)}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Authentication Service</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {results.auth.latency && (
                  <span className="text-xs text-muted-foreground">
                    {results.auth.latency}ms
                  </span>
                )}
                {getStatusBadge(results.auth.status)}
              </div>
            </div>

            {/* Database Test */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(results.database.status)}
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Database Service</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {results.database.latency && (
                  <span className="text-xs text-muted-foreground">
                    {results.database.latency}ms
                  </span>
                )}
                {getStatusBadge(results.database.status)}
              </div>
            </div>
          </div>

          {/* Error Details */}
          {hasFailures && (
            <div className="space-y-2">
              {results.network.error && (
                <p className="text-xs text-destructive">
                  Network: {results.network.error}
                </p>
              )}
              {results.auth.error && (
                <p className="text-xs text-destructive">
                  Auth: {results.auth.error}
                </p>
              )}
              {results.database.error && (
                <p className="text-xs text-destructive">
                  Database: {results.database.error}
                </p>
              )}
            </div>
          )}

          {/* Troubleshooting Steps */}
          {hasFailures && getTroubleshootingSteps() && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">
                  Troubleshooting Steps
                </span>
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                {getTroubleshootingSteps()?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {allPassed && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  All systems operational
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your connection to all backend services is working correctly.
              </p>
            </div>
          )}

          {/* Run Button */}
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="w-full gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRunning ? "Running Tests..." : "Run Diagnostics"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
