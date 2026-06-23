import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import {
  StudioGradient,
  toCssGradient,
  toSvg,
  exportCssBlock,
  exportTailwindConfig,
  rasterizeSvg,
  downloadBlob,
} from "@/lib/gradientStudio";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Props { gradient: StudioGradient }

const SIZES = [
  { label: "1x", w: 800, h: 600 },
  { label: "2x", w: 1600, h: 1200 },
  { label: "4x", w: 3200, h: 2400 },
];

const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gradient";

export const GradientExportPanel = ({ gradient }: Props) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadSvg = () => {
    const svg = toSvg(gradient, { width: 1600, height: 1200 });
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${slug(gradient.name)}.svg`);
  };

  const downloadRaster = async (format: "png" | "jpg", w: number, h: number, label: string) => {
    try {
      const svg = toSvg(gradient, { width: w, height: h });
      const blob = await rasterizeSvg(svg, format, w, h);
      downloadBlob(blob, `${slug(gradient.name)}-${label}.${format}`);
    } catch {
      toast.error("Export failed");
    }
  };

  const cssShort = `background: ${toCssGradient(gradient)};`;
  const cssBlock = exportCssBlock(gradient);
  const tw = exportTailwindConfig(gradient);

  return (
    <Tabs defaultValue="css" className="w-full">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
        <TabsTrigger value="tailwind" className="text-xs">Tailwind</TabsTrigger>
        <TabsTrigger value="svg" className="text-xs">SVG</TabsTrigger>
        <TabsTrigger value="raster" className="text-xs">PNG/JPG</TabsTrigger>
      </TabsList>

      <TabsContent value="css" className="space-y-3 mt-3">
        <CodeBlock label="background string" value={cssShort} onCopy={(v) => copy("short", v)} copied={copied === "short"} />
        <CodeBlock label="full class + keyframes" value={cssBlock} onCopy={(v) => copy("block", v)} copied={copied === "block"} />
      </TabsContent>

      <TabsContent value="tailwind" className="mt-3">
        <CodeBlock label="tailwind.config" value={tw} onCopy={(v) => copy("tw", v)} copied={copied === "tw"} />
      </TabsContent>

      <TabsContent value="svg" className="space-y-2 mt-3">
        <p className="text-xs text-muted-foreground">
          Inline SVG (renders mesh, noise, conic via foreignObject).
        </p>
        <Button onClick={downloadSvg} size="sm" className="gap-2">
          <Download className="h-3.5 w-3.5" /> Download .svg
        </Button>
      </TabsContent>

      <TabsContent value="raster" className="space-y-3 mt-3">
        {(["png", "jpg"] as const).map((fmt) => (
          <div key={fmt} className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">.{fmt}</div>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((s) => (
                <Button
                  key={s.label}
                  variant="outline" size="sm" className="gap-1.5"
                  onClick={() => downloadRaster(fmt, s.w, s.h, s.label)}
                >
                  <Download className="h-3.5 w-3.5" />
                  {s.label} <span className="text-muted-foreground">({s.w}×{s.h})</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  );
};

const CodeBlock = ({
  label, value, onCopy, copied,
}: { label: string; value: string; onCopy: (v: string) => void; copied: boolean }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs" onClick={() => onCopy(value)}>
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
    <pre className="text-[11px] font-mono bg-muted/40 border border-border rounded-md p-2 overflow-auto max-h-48">
{value}
    </pre>
  </div>
);
