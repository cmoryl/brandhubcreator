import { useMemo } from "react";
import auditData from "@/data/gamesIconAudit.json";

type Brand = {
  name: string;
  count: number;
  has_svg: boolean;
  has_color: boolean;
  has_black: boolean;
  has_white: boolean;
  max_raster_px: number;
  effective_max_px: number;
  sizes_ok: Record<string, boolean>;
  raster_files: Array<{ variant: string; format: string; w?: number; h?: number; error?: string }>;
  issues: string[];
  status: "pass" | "warn" | "fail";
};

const REQUIRED_SIZES = (auditData as { required_sizes: number[] }).required_sizes;
const BRANDS = (auditData as { brands: Brand[] }).brands;

export default function PublicLogoHubGamesIconQA() {
  const { pass, warn, fail } = useMemo(() => {
    const p = BRANDS.filter((b) => b.status === "pass").length;
    const w = BRANDS.filter((b) => b.status === "warn").length;
    const f = BRANDS.filter((b) => b.status === "fail").length;
    return { pass: p, warn: w, fail: f };
  }, []);

  const sorted = useMemo(
    () =>
      [...BRANDS].sort((a, b) => {
        const order = { fail: 0, warn: 1, pass: 2 } as const;
        return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
      }),
    []
  );

  return (
    <div className="container mx-auto max-w-6xl py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Games Icon Size Audit</h1>
        <p className="text-muted-foreground mt-2">
          Verifies every Games brand has icons meeting required raster sizes:{" "}
          {REQUIRED_SIZES.map((s) => `${s}px`).join(", ")}. SVG icons automatically satisfy all sizes.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total brands" value={BRANDS.length} tone="default" />
        <Stat label="Passing" value={pass} tone="pass" />
        <Stat label="Warnings" value={warn} tone="warn" />
        <Stat label="Failing" value={fail} tone="fail" />
      </section>

      <section className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Brand</th>
              <th className="p-3">Status</th>
              <th className="p-3">Vector</th>
              <th className="p-3">Variants</th>
              <th className="p-3">Max raster</th>
              {REQUIRED_SIZES.map((s) => (
                <th key={s} className="p-3 text-center">{s}px</th>
              ))}
              <th className="p-3">Issues</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.name} className="border-t border-border">
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3">
                  <StatusPill status={b.status} />
                </td>
                <td className="p-3">{b.has_svg ? "SVG" : "—"}</td>
                <td className="p-3 text-xs">
                  <Variant ok={b.has_color} label="C" />
                  <Variant ok={b.has_black} label="B" />
                  <Variant ok={b.has_white} label="W" />
                </td>
                <td className="p-3 tabular-nums">
                  {b.has_svg ? "∞" : b.max_raster_px ? `${b.max_raster_px}px` : "—"}
                </td>
                {REQUIRED_SIZES.map((s) => (
                  <td key={s} className="p-3 text-center">
                    {b.sizes_ok[String(s)] ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="text-red-600">✕</span>
                    )}
                  </td>
                ))}
                <td className="p-3 text-xs text-muted-foreground">
                  {b.issues.length ? b.issues.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="text-xs text-muted-foreground">
        Generated {new Date((auditData as { generated_at: string }).generated_at).toLocaleString()}.
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "default" | "pass" | "warn" | "fail" }) {
  const toneClass =
    tone === "pass"
      ? "text-emerald-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "fail"
      ? "text-red-600"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    fail: "bg-red-500/10 text-red-700 border-red-500/30",
  } as const;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function Variant({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded mr-1 border ${
        ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-muted border-border text-muted-foreground"
      }`}
      title={label}
    >
      {label}
    </span>
  );
}
