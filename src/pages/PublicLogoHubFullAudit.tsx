import { useMemo, useState } from "react";
import audit from "@/data/globalLogoAudit.json";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Download } from "lucide-react";

type Brand = {
  category: string;
  name: string;
  wb_svg: boolean;
  ww_svg: boolean;
  wc_svg: boolean;
  wb_png: boolean;
  ww_png: boolean;
  icon_black: boolean;
  icon_white: boolean;
  icon_color: boolean;
  dropbox_updated: boolean;
  updated_at: string;
};

const Cell = ({ ok }: { ok: boolean }) =>
  ok ? (
    <Check className="h-4 w-4 text-emerald-500 mx-auto" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
  );

export default function PublicLogoHubFullAudit() {
  const data = audit as unknown as {
    generated_at: string;
    totals: Record<string, number>;
    categories: Record<
      string,
      { total: number; wm_black: number; wm_white: number; wm_color: number; icon_any: number; complete: number; dropbox_updated: number }
    >;
    brands: Brand[];
  };

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [gapsOnly, setGapsOnly] = useState(false);

  const cats = useMemo(() => ["All", ...Object.keys(data.categories).sort()], [data.categories]);

  const rows = useMemo(() => {
    return data.brands.filter((b) => {
      if (cat !== "All" && b.category !== cat) return false;
      if (q && !b.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (gapsOnly) {
        const iconOk = b.icon_black || b.icon_white || b.icon_color;
        const complete = (b.wb_svg || b.wc_svg) && b.ww_svg && iconOk;
        if (complete) return false;
      }
      return true;
    });
  }, [data.brands, q, cat, gapsOnly]);

  const exportCsv = () => {
    const header = [
      "category",
      "name",
      "wm_black_svg",
      "wm_white_svg",
      "wm_color_svg",
      "wm_black_png",
      "wm_white_png",
      "icon_black",
      "icon_white",
      "icon_color",
      "dropbox_updated",
      "updated_at",
    ];
    const lines = [header.join(",")];
    for (const b of rows) {
      lines.push(
        [
          b.category,
          `"${b.name.replace(/"/g, '""')}"`,
          +b.wb_svg,
          +b.ww_svg,
          +b.wc_svg,
          +b.wb_png,
          +b.ww_png,
          +b.icon_black,
          +b.icon_white,
          +b.icon_color,
          +b.dropbox_updated,
          b.updated_at,
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "global-logo-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Global Logo Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Snapshot generated {data.generated_at} · {data.totals.brands} brands ·{" "}
            {data.totals.complete} complete · {data.totals.dropbox_updated} refreshed from your
            Dropbox drop
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Brands", value: data.totals.brands },
          { label: "Wordmark Black", value: data.totals.wm_black },
          { label: "Wordmark White", value: data.totals.wm_white },
          { label: "Any Icon", value: data.totals.icon_any },
          { label: "Complete", value: data.totals.complete },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Per-category */}
      <Card className="p-4">
        <div className="text-sm font-medium mb-3">By category</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-2">Category</th>
                <th className="text-right">Total</th>
                <th className="text-right">WM Black</th>
                <th className="text-right">WM White</th>
                <th className="text-right">Icon</th>
                <th className="text-right">Complete</th>
                <th className="text-right">Dropbox ✓</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.categories)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([name, s]) => {
                  const pct = Math.round((s.complete / s.total) * 100);
                  return (
                    <tr key={name} className="border-t border-border/50">
                      <td className="py-2 font-medium">{name}</td>
                      <td className="text-right">{s.total}</td>
                      <td className="text-right">{s.wm_black}</td>
                      <td className="text-right">{s.wm_white}</td>
                      <td className="text-right">{s.icon_any}</td>
                      <td className="text-right">
                        {s.complete}{" "}
                        <span className="text-muted-foreground">({pct}%)</span>
                      </td>
                      <td className="text-right">{s.dropbox_updated}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search brand…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant={gapsOnly ? "default" : "outline"}
          onClick={() => setGapsOnly((v) => !v)}
        >
          Gaps only
        </Button>
        <div className="text-sm text-muted-foreground ml-auto">{rows.length} shown</div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">Brand</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="px-2">WM ⚫ SVG</th>
                <th className="px-2">WM ⚪ SVG</th>
                <th className="px-2">WM 🎨 SVG</th>
                <th className="px-2">WM ⚫ PNG</th>
                <th className="px-2">WM ⚪ PNG</th>
                <th className="px-2">Icon ⚫</th>
                <th className="px-2">Icon ⚪</th>
                <th className="px-2">Icon 🎨</th>
                <th className="px-2">Dropbox</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={`${b.category}-${b.name}`} className="border-t border-border/40">
                  <td className="px-3 py-2 font-medium">{b.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.category}</td>
                  <td><Cell ok={b.wb_svg} /></td>
                  <td><Cell ok={b.ww_svg} /></td>
                  <td><Cell ok={b.wc_svg} /></td>
                  <td><Cell ok={b.wb_png} /></td>
                  <td><Cell ok={b.ww_png} /></td>
                  <td><Cell ok={b.icon_black} /></td>
                  <td><Cell ok={b.icon_white} /></td>
                  <td><Cell ok={b.icon_color} /></td>
                  <td className="text-center">
                    {b.dropbox_updated ? (
                      <Badge variant="secondary" className="text-[10px]">✓</Badge>
                    ) : (
                      <span className="text-muted-foreground/40">·</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
