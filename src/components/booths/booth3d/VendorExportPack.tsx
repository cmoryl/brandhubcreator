/**
 * VendorExportPack — Generates a ZIP containing all vendor-needed files:
 *  1. Graphic Panel Specs (dimensions, images, safe zones)
 *  2. Lighting Plan (rig config, color temps, par cans)
 *  3. Floor Plan (layout, furniture positions, dimensions)
 *  4. Electrical Needs (power drops from logistics markers)
 *  5. Shipping Manifest (furniture list with dimensions & estimated weights)
 */
import { useState, useCallback, useMemo } from 'react';
import {
  Package, Download, FileText, Lightbulb, LayoutGrid,
  Zap, Truck, Loader2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PanelConfig, BoothLayout } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';
import { getFurnitureById, FURNITURE_CATALOG } from './boothFurnitureConfigs';
import type { BoothLightingConfig } from './boothLightingConfig';
import type { FlooringConfig } from './BoothFloorpad';
import type { LogisticsMarker } from './logisticsTypes';

const M_TO_FT = 3.28084;
const M_TO_IN = 39.3701;

interface VendorExportPackProps {
  divisionName?: string;
  layout: BoothLayout;
  boothDimensions: string;
  boothFootprint: string;
  panels: PanelConfig[];
  assignments: Record<string, string>;
  backAssignments: Record<string, string>;
  placedAssets: PlacedAsset[];
  boothLighting: BoothLightingConfig;
  flooringConfig: FlooringConfig;
  logisticsMarkers: LogisticsMarker[];
  isAdmin: boolean;
}

interface ExportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
  itemCount: number;
}

/** Estimate shipping weight for a furniture asset (lbs) */
function estimateWeight(assetId: string): number {
  const weights: Record<string, number> = {
    'table-6ft': 45, 'table-8ft': 55, 'table-6ft-covered': 50, 'table-8ft-covered': 60,
    'counter-reception': 65, 'podium': 35, 'cocktail-table': 25,
    'tv-42': 30, 'tv-55': 45, 'tv-65': 60, 'tv-wall-42': 25, 'tv-wall-55': 40,
    'bar-stool': 12, 'lounge-chair': 35,
    'banner-stand': 15, 'banner-wide': 20,
    'literature-rack': 18, 'kiosk-ipad': 22, 'custom-box': 20,
  };
  return weights[assetId] || 20;
}

/** Estimate crate dimensions for a furniture asset */
function estimateCrate(assetId: string, size: [number, number, number]): string {
  const w = Math.ceil(size[0] * M_TO_IN + 4);
  const h = Math.ceil(size[1] * M_TO_IN + 4);
  const d = Math.ceil(size[2] * M_TO_IN + 4);
  return `${w}" × ${h}" × ${d}"`;
}

function formatMeters(m: number): string {
  const ft = m * M_TO_FT;
  return `${ft.toFixed(1)}' (${m.toFixed(2)}m)`;
}

export function VendorExportPack({
  divisionName, layout, boothDimensions, boothFootprint,
  panels, assignments, backAssignments, placedAssets,
  boothLighting, flooringConfig, logisticsMarkers, isAdmin,
}: VendorExportPackProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // Section toggles
  const [sections, setSections] = useState({
    panels: true,
    lighting: true,
    floorplan: true,
    electrical: true,
    shipping: true,
  });

  const toggleSection = useCallback((id: string) => {
    setSections(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  }, []);

  const powerDrops = useMemo(() =>
    logisticsMarkers.filter(m => m.category === 'power'),
  [logisticsMarkers]);

  const internetDrops = useMemo(() =>
    logisticsMarkers.filter(m => m.category === 'internet'),
  [logisticsMarkers]);

  const sectionList: ExportSection[] = useMemo(() => [
    { id: 'panels', label: 'Graphic Panel Specs', icon: <LayoutGrid className="h-3.5 w-3.5" />, description: 'Panel dimensions, image assignments, safe zones', enabled: sections.panels, itemCount: panels.length },
    { id: 'lighting', label: 'Lighting Plan', icon: <Lightbulb className="h-3.5 w-3.5" />, description: 'Booth lighting rig, color temps, par cans', enabled: sections.lighting, itemCount: boothLighting.boothSpots.length },
    { id: 'floorplan', label: 'Floor Plan', icon: <FileText className="h-3.5 w-3.5" />, description: 'Layout, furniture positions, flooring specs', enabled: sections.floorplan, itemCount: placedAssets.length },
    { id: 'electrical', label: 'Electrical Needs', icon: <Zap className="h-3.5 w-3.5" />, description: 'Power drops, internet, rigging points', enabled: sections.electrical, itemCount: powerDrops.length + internetDrops.length },
    { id: 'shipping', label: 'Shipping Manifest', icon: <Truck className="h-3.5 w-3.5" />, description: 'Crate list, weights, dimensions', enabled: sections.shipping, itemCount: placedAssets.length },
  ], [sections, panels, boothLighting, placedAssets, powerDrops, internetDrops]);

  // ── Generate documents ──────────────────────────

  const generatePanelSpecs = useCallback((): string => {
    let doc = `GRAPHIC PANEL SPECIFICATIONS\n${'='.repeat(50)}\n`;
    doc += `Booth: ${divisionName || 'Unnamed'}\nLayout: ${boothDimensions}\nFootprint: ${boothFootprint}\n\n`;

    for (const panel of panels) {
      doc += `── ${panel.label} (${panel.id}) ──\n`;
      doc += `  Physical Size: ${panel.specLabel || `${formatMeters(panel.size[0])} × ${formatMeters(panel.size[1])}`}\n`;
      doc += `  Width: ${formatMeters(panel.size[0])}\n`;
      doc += `  Height: ${formatMeters(panel.size[1])}\n`;
      doc += `  Position: [${panel.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
      doc += `  Front Image: ${assignments[panel.id] ? 'ASSIGNED' : 'NOT ASSIGNED'}\n`;
      doc += `  Back Image: ${backAssignments[panel.id] ? 'ASSIGNED' : 'N/A'}\n`;

      // Safe zone info (5% inset)
      const safeW = (panel.size[0] * 0.9 * M_TO_IN).toFixed(1);
      const safeH = (panel.size[1] * 0.9 * M_TO_IN).toFixed(1);
      doc += `  Safe Zone: ${safeW}" × ${safeH}" (5% inset all sides)\n`;
      doc += `  Bleed: 1" beyond trim on all sides\n`;
      doc += `  Resolution: 150 DPI minimum at full size\n\n`;
    }

    return doc;
  }, [divisionName, boothDimensions, boothFootprint, panels, assignments, backAssignments]);

  const generateLightingPlan = useCallback((): string => {
    let doc = `LIGHTING PLAN\n${'='.repeat(50)}\n`;
    doc += `Booth: ${divisionName || 'Unnamed'}\n\n`;

    doc += `HALL AMBIENT\n`;
    doc += `  Brightness: ${(boothLighting.hallAmbient * 100).toFixed(0)}%\n`;
    doc += `  Temperature: ${boothLighting.hallTemperature}\n\n`;

    doc += `BOOTH SPOTLIGHTS (${boothLighting.boothSpots.length})\n`;
    boothLighting.boothSpots.forEach((spot, i) => {
      doc += `  Spot ${i + 1}:\n`;
      doc += `    Position: [${spot.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
      doc += `    Cone Angle: ${(spot.angle * 180 / Math.PI).toFixed(0)}°\n`;
      doc += `    Intensity: ${(spot.intensity * 100).toFixed(0)}%\n`;
      doc += `    Temperature: ${spot.temperature}\n`;
      doc += `    Cast Shadow: ${spot.castShadow ? 'Yes' : 'No'}\n`;
    });

    doc += `\nPAR CAN WASH\n`;
    doc += `  Color: ${boothLighting.parCanColor}\n`;
    doc += `  Intensity: ${(boothLighting.parCanIntensity * 100).toFixed(0)}%\n\n`;

    doc += `EDGE LIGHTING\n`;
    doc += `  Panel Glow: ${(boothLighting.edgeLightIntensity * 100).toFixed(0)}%\n`;

    return doc;
  }, [divisionName, boothLighting]);

  const generateFloorPlan = useCallback((): string => {
    let doc = `FLOOR PLAN\n${'='.repeat(50)}\n`;
    doc += `Booth: ${divisionName || 'Unnamed'}\nLayout: ${layout} — ${boothDimensions}\nFootprint: ${boothFootprint}\n\n`;

    doc += `FLOORING\n`;
    doc += `  Type: ${flooringConfig.type}\n`;
    doc += `  Color: ${flooringConfig.color}\n`;
    doc += `  Border: ${flooringConfig.showBorder ? 'Yes' : 'No'}\n\n`;

    doc += `WALL PANELS (${panels.length})\n`;
    panels.forEach(p => {
      doc += `  ${p.label}: ${p.specLabel || formatMeters(p.size[0]) + ' × ' + formatMeters(p.size[1])}\n`;
      doc += `    Position: [${p.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
    });

    doc += `\nFURNITURE & ASSETS (${placedAssets.length})\n`;
    placedAssets.forEach((asset, i) => {
      const catalog = getFurnitureById(asset.assetId);
      const name = catalog?.name || asset.assetId;
      const sz = asset.customSize || catalog?.size || [1, 1, 1];
      doc += `  ${i + 1}. ${name}${asset.label ? ` — "${asset.label}"` : ''}\n`;
      doc += `     Size: ${(sz[0] * M_TO_IN).toFixed(0)}" × ${(sz[1] * M_TO_IN).toFixed(0)}" × ${(sz[2] * M_TO_IN).toFixed(0)}"\n`;
      doc += `     Position: [${asset.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
      if (catalog?.hasScreen) doc += `     Screen: Yes\n`;
      if (asset.tableCoverColor) doc += `     Table Cover: ${asset.tableCoverStyle || 'fitted'} — ${asset.tableCoverColor}\n`;
    });

    return doc;
  }, [divisionName, layout, boothDimensions, boothFootprint, flooringConfig, panels, placedAssets]);

  const generateElectricalNeeds = useCallback((): string => {
    let doc = `ELECTRICAL & UTILITY REQUIREMENTS\n${'='.repeat(50)}\n`;
    doc += `Booth: ${divisionName || 'Unnamed'}\n\n`;

    // Power
    const allPower = logisticsMarkers.filter(m => m.category === 'power');
    doc += `POWER DROPS (${allPower.length})\n`;
    if (allPower.length === 0) {
      doc += `  None specified — review with vendor\n`;
    } else {
      allPower.forEach((m, i) => {
        doc += `  ${i + 1}. ${m.label}\n`;
        doc += `     Position: [${m.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
        doc += `     Status: ${m.status}\n`;
        if (m.spec) doc += `     Specs: ${m.spec}\n`;
        if (m.notes) doc += `     Notes: ${m.notes}\n`;
      });
    }

    // Estimate power from furniture
    const screens = placedAssets.filter(a => getFurnitureById(a.assetId)?.hasScreen);
    doc += `\nESTIMATED POWER LOAD\n`;
    doc += `  Screens/Displays: ${screens.length} × ~200W = ${screens.length * 200}W\n`;
    doc += `  Lighting Rig: ${boothLighting.boothSpots.length} spots × ~150W = ${boothLighting.boothSpots.length * 150}W\n`;
    doc += `  iPad Kiosks: ${placedAssets.filter(a => a.assetId === 'kiosk-ipad').length} × ~50W\n`;
    const totalW = screens.length * 200 + boothLighting.boothSpots.length * 150 + placedAssets.filter(a => a.assetId === 'kiosk-ipad').length * 50;
    doc += `  TOTAL ESTIMATED: ${totalW}W (${(totalW / 120).toFixed(1)}A @ 120V)\n`;
    doc += `  RECOMMENDED: ${Math.ceil(totalW / 1800)} × 20A circuits\n`;

    // Internet
    const allInternet = logisticsMarkers.filter(m => m.category === 'internet');
    doc += `\nINTERNET DROPS (${allInternet.length})\n`;
    if (allInternet.length === 0) {
      doc += `  None specified\n`;
    } else {
      allInternet.forEach((m, i) => {
        doc += `  ${i + 1}. ${m.label} — Position: [${m.position.map(v => v.toFixed(2)).join(', ')}]m\n`;
        if (m.spec) doc += `     Specs: ${m.spec}\n`;
      });
    }

    // Rigging
    const allRigging = logisticsMarkers.filter(m => m.category === 'rigging');
    doc += `\nRIGGING POINTS (${allRigging.length})\n`;
    if (allRigging.length === 0) {
      doc += `  None specified\n`;
    } else {
      allRigging.forEach((m, i) => {
        doc += `  ${i + 1}. ${m.label} — Height: ${formatMeters(m.position[1])}\n`;
        if (m.spec) doc += `     Specs: ${m.spec}\n`;
      });
    }

    return doc;
  }, [divisionName, logisticsMarkers, placedAssets, boothLighting]);

  const generateShippingManifest = useCallback((): string => {
    let doc = `SHIPPING MANIFEST & CRATE LIST\n${'='.repeat(50)}\n`;
    doc += `Booth: ${divisionName || 'Unnamed'}\nLayout: ${boothDimensions}\n\n`;

    let totalWeight = 0;
    let crateCount = 0;

    // Group by asset type
    const grouped = new Map<string, { count: number; weight: number; crate: string; name: string }>();
    for (const asset of placedAssets) {
      const catalog = getFurnitureById(asset.assetId);
      const name = catalog?.name || asset.assetId;
      const sz = asset.customSize || catalog?.size || [1, 1, 1];
      const weight = estimateWeight(asset.assetId);
      const crate = estimateCrate(asset.assetId, sz);

      const existing = grouped.get(asset.assetId);
      if (existing) {
        existing.count++;
        existing.weight += weight;
      } else {
        grouped.set(asset.assetId, { count: 1, weight, crate, name });
      }
      totalWeight += weight;
      crateCount++;
    }

    // Panel crates
    doc += `PANEL CRATES\n`;
    panels.forEach(p => {
      const wIn = (p.size[0] * M_TO_IN).toFixed(0);
      const hIn = (p.size[1] * M_TO_IN).toFixed(0);
      const panelWeight = Math.ceil(p.size[0] * p.size[1] * 8); // ~8 lbs/sqm for fabric panels
      doc += `  ${p.label}: ${wIn}" × ${hIn}" × 4" crate — ~${panelWeight} lbs\n`;
      totalWeight += panelWeight;
      crateCount++;
    });

    doc += `\nFURNITURE & EQUIPMENT\n`;
    doc += `${'─'.repeat(60)}\n`;
    doc += `  Qty  Item                        Crate Size        Weight\n`;
    doc += `${'─'.repeat(60)}\n`;

    for (const [, item] of grouped) {
      const name = item.name.padEnd(28);
      const crate = item.crate.padEnd(18);
      doc += `  ${String(item.count).padStart(2)}×  ${name}${crate}${item.weight} lbs\n`;
    }

    doc += `${'─'.repeat(60)}\n`;
    doc += `  TOTAL CRATES: ${crateCount}\n`;
    doc += `  TOTAL ESTIMATED WEIGHT: ${totalWeight} lbs (${(totalWeight * 0.453592).toFixed(0)} kg)\n\n`;

    doc += `NOTES:\n`;
    doc += `  - Weights are estimates; verify with vendor\n`;
    doc += `  - Crate dimensions include 2" padding on each side\n`;
    doc += `  - Fragile items (TVs, kiosks) require foam-lined crates\n`;
    doc += `  - Advance warehouse delivery recommended: 3 days prior\n`;

    return doc;
  }, [divisionName, boothDimensions, panels, placedAssets]);

  // ── Export ZIP ──────────────────────────

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportDone(false);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const boothName = (divisionName || 'Booth').replace(/[^a-zA-Z0-9]/g, '_');
      const folder = zip.folder(`${boothName}_Vendor_Kit`)!;

      if (sections.panels) {
        folder.file('01_Graphic_Panel_Specs.txt', generatePanelSpecs());
      }
      if (sections.lighting) {
        folder.file('02_Lighting_Plan.txt', generateLightingPlan());
      }
      if (sections.floorplan) {
        folder.file('03_Floor_Plan.txt', generateFloorPlan());
      }
      if (sections.electrical) {
        folder.file('04_Electrical_Needs.txt', generateElectricalNeeds());
      }
      if (sections.shipping) {
        folder.file('05_Shipping_Manifest.txt', generateShippingManifest());
      }

      // Add a cover sheet
      let cover = `VENDOR KIT — ${boothName}\n${'='.repeat(50)}\n`;
      cover += `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      cover += `Layout: ${boothDimensions}\nFootprint: ${boothFootprint}\n`;
      cover += `Panels: ${panels.length}\nFurniture Items: ${placedAssets.length}\n`;
      cover += `Power Drops: ${powerDrops.length}\nInternet Drops: ${internetDrops.length}\n\n`;
      cover += `CONTENTS:\n`;
      if (sections.panels) cover += `  ✓ 01_Graphic_Panel_Specs.txt\n`;
      if (sections.lighting) cover += `  ✓ 02_Lighting_Plan.txt\n`;
      if (sections.floorplan) cover += `  ✓ 03_Floor_Plan.txt\n`;
      if (sections.electrical) cover += `  ✓ 04_Electrical_Needs.txt\n`;
      if (sections.shipping) cover += `  ✓ 05_Shipping_Manifest.txt\n`;
      folder.file('00_README.txt', cover);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${boothName}_Vendor_Kit.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setExportDone(true);
      toast.success('Vendor Kit exported!', {
        description: `${Object.values(sections).filter(Boolean).length + 1} files in ZIP`,
      });
    } catch (e: any) {
      toast.error('Export failed', { description: e?.message || 'Unknown error' });
    } finally {
      setIsExporting(false);
    }
  }, [sections, divisionName, boothDimensions, boothFootprint, panels, placedAssets, powerDrops, internetDrops, generatePanelSpecs, generateLightingPlan, generateFloorPlan, generateElectricalNeeds, generateShippingManifest]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Vendor Export Pack</h3>
          <Badge variant="outline" className="text-[10px]">{boothDimensions}</Badge>
        </div>
        {isAdmin && (
          <Button
            onClick={handleExport}
            disabled={isExporting || !Object.values(sections).some(Boolean)}
            size="sm"
            className="h-7 text-[10px] gap-1.5"
          >
            {isExporting ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
            ) : exportDone ? (
              <><CheckCircle2 className="h-3 w-3" /> Re-Export ZIP</>
            ) : (
              <><Download className="h-3 w-3" /> Export Vendor Kit.zip</>
            )}
          </Button>
        )}
      </div>

      {/* Section toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sectionList.map(sec => (
          <button
            key={sec.id}
            onClick={() => isAdmin && toggleSection(sec.id)}
            className={cn(
              "flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors",
              sec.enabled
                ? "border-primary/30 bg-primary/5"
                : "border-muted-foreground/20 bg-muted/10 opacity-60"
            )}
          >
            <div className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5",
              sec.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {sec.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold">{sec.label}</span>
                {sec.itemCount > 0 && (
                  <Badge variant="secondary" className="text-[8px] h-4 px-1">{sec.itemCount}</Badge>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground leading-snug mt-0.5">{sec.description}</p>
            </div>
            {isAdmin && (
              <Switch
                checked={sec.enabled}
                onCheckedChange={() => toggleSection(sec.id)}
                className="shrink-0 scale-75 mt-1"
              />
            )}
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: 'Panels', value: panels.length, icon: <LayoutGrid className="h-3 w-3" /> },
          { label: 'Furniture', value: placedAssets.length, icon: <Package className="h-3 w-3" /> },
          { label: 'Spotlights', value: boothLighting.boothSpots.length, icon: <Lightbulb className="h-3 w-3" /> },
          { label: 'Power Drops', value: powerDrops.length, icon: <Zap className="h-3 w-3" /> },
          { label: 'Est. Weight', value: `${placedAssets.reduce((sum, a) => sum + estimateWeight(a.assetId), 0)} lbs`, icon: <Truck className="h-3 w-3" /> },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border bg-card p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
              {stat.icon}
              <span className="text-[8px] uppercase tracking-wider font-semibold">{stat.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
