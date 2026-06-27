import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import auditData from "@/data/travelLogoAudit.json";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, Download } from "lucide-react";

type Issue = {
  severity: "error" | "warn" | "ok";
  reason: string;
  slot?: string;
  url?: string;
  w?: number;
  h?: number;
  bytes?: number;
};
type Item = {
  id: string;
  name: string;
  issues: Issue[];
  error_count: number;
  warn_count: number;
};
type Report = {
  generated_at: string;
  total: number;
  clean: number;
  errors: number;
  warnings: number;
  items: Item[];
};

const REASON_LABEL: Record<string, string> = {
  missing_variant: "Missing variant",
  very_low_res: "Very low resolution",
  low_res: "Low resolution",
  invalid_svg: "Invalid SVG",
  svg_wraps_raster: "SVG wraps raster image",
  unreadable: "Unreadable file",
  missing_url: "Missing URL",
};

function labelFor(reason: string) {
  const base = reason.split(":")[0];
  return REASON_LABEL[base] ?? reason;
}

export default function PublicLogoHubTravelQA() {
  const report = auditData as Report;
  const [filter, setFilter] = useState<"all" | "errors" | "warnings" | "clean">("errors");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    return report.items
      .filter((it) => {
        if (filter === "errors") return it.error_count > 0;
        if (filter === "warnings") return it.warn_count > 0 && it.error_count === 0;
        if (filter === "clean") return it.issues.length === 0;
        return true;
      })
      .filter((it) => (query ? it.name.toLowerCase().includes(query.toLowerCase()) : true));
  }, [report, filter, query]);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "travel-logo-audit.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Travel Logo QA</h1>
          <p className="mt-1 text-muted-foreground">
            Automated quality audit of Travel-category brand assets. Flags broken URLs,
            low-resolution rasters, missing variants, and malformed SVGs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadJson}>
            <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          <Button asChild size="sm">
            <Link to="/logohub/travel-review">Open review tool</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Brands" value={report.total} />
        <StatCard label="Clean" value={report.clean} tone="ok" />
        <StatCard label="Errors" value={report.errors} tone="error" />
        <StatCard label="Warnings" value={report.warnings} tone="warn" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["errors", "warnings", "all", "clean"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brand…"
          className="ml-auto max-w-xs"
        />
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No brands match this filter.</Card>
        )}
        {items.map((it) => (
          <Card key={it.id} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {it.error_count > 0 ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : it.warn_count > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                )}
                <span className="text-lg font-semibold">{it.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {it.error_count > 0 && (
                  <Badge variant="destructive">{it.error_count} error{it.error_count !== 1 && "s"}</Badge>
                )}
                {it.warn_count > 0 && (
                  <Badge variant="secondary">{it.warn_count} warning{it.warn_count !== 1 && "s"}</Badge>
                )}
              </div>
            </div>
            {it.issues.length > 0 && (
              <ul className="space-y-1.5">
                {it.issues.map((iss, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge
                        variant={iss.severity === "error" ? "destructive" : "outline"}
                        className="shrink-0"
                      >
                        {labelFor(iss.reason)}
                      </Badge>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {iss.slot ?? "—"}
                      </span>
                      {iss.w != null && iss.h != null && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {iss.w}×{iss.h}px
                        </span>
                      )}
                      {iss.bytes != null && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {(iss.bytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                    {iss.url && (
                      <a
                        href={iss.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        title="Open asset"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "error";
}) {
  const toneClass =
    tone === "error"
      ? "text-destructive"
      : tone === "warn"
        ? "text-yellow-500"
        : tone === "ok"
          ? "text-emerald-500"
          : "text-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${toneClass}`}>{value}</div>
    </Card>
  );
}
