import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Ruler, Paintbrush, Lightbulb, Monitor, Truck, Clock, Zap, Armchair, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface SpecSheet {
  boothTitle?: string;
  dimensions?: { width?: string; depth?: string; height?: string; footprint?: string };
  materials?: { component: string; material: string; finish: string; notes?: string }[];
  graphics?: { panel: string; size: string; resolution: string; format: string; bleed?: string }[];
  lighting?: { type: string; quantity: string; placement: string; color_temp?: string }[];
  electrical?: { totalPower?: string; outlets?: string; specialRequirements?: string };
  furniture?: { item: string; quantity: string; dimensions?: string; finish?: string }[];
  technology?: { device: string; specs: string; mounting?: string; connectivity?: string }[];
  colorSpecs?: { primary?: string; pantone?: string; cmyk?: string; vinyl?: string };
  productionTimeline?: { phase: string; duration: string; deliverable: string }[];
  installationNotes?: string;
  shippingSpecs?: { crates?: string; weight?: string; specialHandling?: string };
}

interface DigitalTemplatesSectionProps {
  division: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    color: string;
    email: string;
    website: string;
    services: string[];
  };
  isAdmin: boolean;
}

export const DigitalTemplatesSection = ({ division, isAdmin }: DigitalTemplatesSectionProps) => {
  const [generating, setGenerating] = useState(false);
  const [specSheet, setSpecSheet] = useState<SpecSheet | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-booth-template", {
        body: { division },
      });

      if (error) throw error;

      if (data?.specSheet) setSpecSheet(data.specSheet);
      if (data?.mockupImageUrl) setMockupUrl(data.mockupImageUrl);
      toast.success("Digital template generated successfully!");
    } catch (err: any) {
      console.error("Template generation error:", err);
      const msg = err?.message || "Failed to generate template";
      if (msg.includes("429") || msg.includes("rate limit")) {
        toast.error("Rate limit reached. Please try again in a moment.");
      } else if (msg.includes("402")) {
        toast.error("Usage limit reached. Please add credits.");
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const color = division.color;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color }} />
          Digital Templates
        </h3>
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs"
            style={{ borderColor: color + "60", color }}
          >
            {generating ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1" /> {specSheet ? "Regenerate" : "Generate with AI"}</>
            )}
          </Button>
        )}
      </div>

      {!specSheet && !mockupUrl && !generating && (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Click \"Generate with AI\" to create a digital booth mockup and full production spec sheet." : "No digital templates generated yet."}
          </p>
        </div>
      )}

      {generating && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating booth mockup and production specs...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">This may take 15-30 seconds</p>
        </div>
      )}

      {(mockupUrl || specSheet) && !generating && (
        <div className="space-y-6">
          {/* Booth Mockup */}
          {mockupUrl && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-4 py-2 bg-muted/30 border-b border-border/40 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Booth Mockup</span>
              </div>
              <div className="bg-card">
                <img src={mockupUrl} alt={`${division.name} booth mockup`} className="w-full h-auto" />
              </div>
            </div>
          )}

          {/* Spec Sheet */}
          {specSheet && (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-border/40">
                <h4 className="text-sm font-semibold" style={{ color }}>{specSheet.boothTitle || `${division.name} Production Spec Sheet`}</h4>
              </div>

              <div className="p-4 space-y-5">
                {/* Dimensions */}
                {specSheet.dimensions && (
                  <SpecSection icon={Ruler} title="Booth Dimensions" color={color}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(specSheet.dimensions).map(([key, val]) => (
                        <div key={key} className="bg-muted/30 rounded-lg p-2.5 text-center border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key}</p>
                          <p className="text-sm font-semibold mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>
                  </SpecSection>
                )}

                {/* Color Specs */}
                {specSheet.colorSpecs && (
                  <SpecSection icon={Paintbrush} title="Color Specifications" color={color}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="h-12 w-12 rounded-lg border border-border/40 shadow-sm" style={{ backgroundColor: specSheet.colorSpecs.primary || color }} />
                      <div className="space-y-1">
                        {Object.entries(specSheet.colorSpecs).map(([key, val]) => (
                          <p key={key} className="text-xs"><span className="text-muted-foreground uppercase">{key}:</span> <span className="font-medium">{val}</span></p>
                        ))}
                      </div>
                    </div>
                  </SpecSection>
                )}

                {/* Materials */}
                {specSheet.materials && specSheet.materials.length > 0 && (
                  <SpecSection icon={Paintbrush} title="Materials & Finishes" color={color}>
                    <SpecTable headers={["Component", "Material", "Finish", "Notes"]} rows={specSheet.materials.map(m => [m.component, m.material, m.finish, m.notes || "—"])} color={color} />
                  </SpecSection>
                )}

                {/* Graphics */}
                {specSheet.graphics && specSheet.graphics.length > 0 && (
                  <SpecSection icon={ImageIcon} title="Graphics & Panels" color={color}>
                    <SpecTable headers={["Panel", "Size", "Resolution", "Format", "Bleed"]} rows={specSheet.graphics.map(g => [g.panel, g.size, g.resolution, g.format, g.bleed || "—"])} color={color} />
                  </SpecSection>
                )}

                {/* Lighting */}
                {specSheet.lighting && specSheet.lighting.length > 0 && (
                  <SpecSection icon={Lightbulb} title="Lighting" color={color}>
                    <SpecTable headers={["Type", "Qty", "Placement", "Color Temp"]} rows={specSheet.lighting.map(l => [l.type, l.quantity, l.placement, l.color_temp || "—"])} color={color} />
                  </SpecSection>
                )}

                {/* Electrical */}
                {specSheet.electrical && (
                  <SpecSection icon={Zap} title="Electrical" color={color}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(specSheet.electrical).map(([key, val]) => (
                        <div key={key} className="bg-muted/30 rounded-lg p-2.5 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, " $1")}</p>
                          <p className="text-xs font-medium mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>
                  </SpecSection>
                )}

                {/* Furniture */}
                {specSheet.furniture && specSheet.furniture.length > 0 && (
                  <SpecSection icon={Armchair} title="Furniture" color={color}>
                    <SpecTable headers={["Item", "Qty", "Dimensions", "Finish"]} rows={specSheet.furniture.map(f => [f.item, f.quantity, f.dimensions || "—", f.finish || "—"])} color={color} />
                  </SpecSection>
                )}

                {/* Technology */}
                {specSheet.technology && specSheet.technology.length > 0 && (
                  <SpecSection icon={Monitor} title="Technology" color={color}>
                    <SpecTable headers={["Device", "Specs", "Mounting", "Connectivity"]} rows={specSheet.technology.map(t => [t.device, t.specs, t.mounting || "—", t.connectivity || "—"])} color={color} />
                  </SpecSection>
                )}

                {/* Production Timeline */}
                {specSheet.productionTimeline && specSheet.productionTimeline.length > 0 && (
                  <SpecSection icon={Clock} title="Production Timeline" color={color}>
                    <div className="space-y-2">
                      {specSheet.productionTimeline.map((phase, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: color }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{phase.phase}</p>
                            <p className="text-[10px] text-muted-foreground">{phase.deliverable}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: color + "40" }}>{phase.duration}</Badge>
                        </div>
                      ))}
                    </div>
                  </SpecSection>
                )}

                {/* Shipping */}
                {specSheet.shippingSpecs && (
                  <SpecSection icon={Truck} title="Shipping & Logistics" color={color}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(specSheet.shippingSpecs).map(([key, val]) => (
                        <div key={key} className="bg-muted/30 rounded-lg p-2.5 border border-border/30">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{key.replace(/([A-Z])/g, " $1")}</p>
                          <p className="text-xs font-medium mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>
                  </SpecSection>
                )}

                {/* Installation Notes */}
                {specSheet.installationNotes && (
                  <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Installation Notes</p>
                    <p className="text-xs leading-relaxed">{specSheet.installationNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper components
const SpecSection = ({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) => (
  <div>
    <h5 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color }}>
      <Icon className="h-3.5 w-3.5" /> {title}
    </h5>
    {children}
  </div>
);

const SpecTable = ({ headers, rows, color }: { headers: string[]; rows: string[][]; color: string }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border/40">
          {headers.map(h => (
            <th key={h} className="text-left py-1.5 px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border/20 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={`py-1.5 px-2 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
