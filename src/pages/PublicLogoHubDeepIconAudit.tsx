import auditData from "@/data/iconResolutionAudit.json";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = [string, string, string, number, string]; // [category, name, status, dim, meta]

const STATUS_TONE: Record<string, string> = {
  "PASS-SVG": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  PASS: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  WARN: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  LOW: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  MISSING: "bg-destructive/15 text-destructive border-destructive/30",
  UNREADABLE: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function PublicLogoHubDeepIconAudit() {
  const rows = auditData as Row[];
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const cats = useMemo(() => Array.from(new Set(rows.map((r) => r[0]))).sort(), [rows]);
  const statuses = useMemo(() => Array.from(new Set(rows.map((r) => r[2]))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (cat !== "all" && r[0] !== cat) return false;
    if (status !== "all" && r[2] !== status) return false;
    if (q && !r[1].toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const stats = useMemo(() => {
    const s: Record<string, number> = {};
    rows.forEach((r) => (s[r[2]] = (s[r[2]] || 0) + 1));
    return s;
  }, [rows]);

  return (
    <div className="container mx-auto max-w-7xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Deep Icon Resolution Audit</h1>
      <p className="text-muted-foreground mb-6">
        High-resolution icon coverage across newly added industry categories (Automotive, Digital, Games,
        Legal, Life Sciences, Manufacturing, Marketing & Advertising, Retail, Travel). SVG = vector
        (unlimited resolution), PASS = ≥512px raster, WARN = 256–511px, LOW = &lt;256px.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k} className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search brand…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground self-center ml-auto">
          {filtered.length} of {rows.length} brands
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Best Size</th>
              <th className="px-4 py-2">Format / Variant</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([c, n, s, d, m], i) => (
              <tr key={i} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 font-medium">{n}</td>
                <td className="px-4 py-2 text-muted-foreground">{c}</td>
                <td className="px-4 py-2">
                  <Badge variant="outline" className={STATUS_TONE[s] || ""}>{s}</Badge>
                </td>
                <td className="px-4 py-2 tabular-nums">{d >= 9999 ? "∞ (vector)" : d ? `${d}px` : "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
