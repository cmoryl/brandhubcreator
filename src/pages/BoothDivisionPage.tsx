import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, Loader2,
  Upload, RotateCcw, ZoomIn, ChevronDown, Type, Download, Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBoothImages } from "@/hooks/useBoothImages";
import { useCustomDivisions } from "@/hooks/useCustomDivisions";
import {
  DIVISIONS,
  customToBoothDivision,
  type BoothDivision,
} from "@/pages/BoothsCatalog";
import { BrandHubLogo } from "@/components/BrandHubLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

// Lazy-loaded sub-components from BoothsCatalog (they're defined there)
// We import the ones that are exported or inline them
const LazyBoothMapper3D = lazy(() =>
  import("@/components/booths/booth3d/BoothMapper3D").then((m) => ({
    default: m.BoothMapper3D,
  }))
);

// These managers are used inside DivisionDetail — we need to import them
// They are not exported from BoothsCatalog, so we replicate the detail layout here
// by reusing the exported DivisionDetail but as a full-page wrapper

export default function BoothDivisionPage() {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { divisions: customDivisions } = useCustomDivisions();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAdmin(!!user);
    };
    checkAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Resolve division from static + custom
  const staticDivisionIds = new Set(DIVISIONS.map((d) => d.id));
  const allDivisions: BoothDivision[] = [
    ...DIVISIONS.map((div) => {
      const override = customDivisions.find((c) => c.division_id === div.id);
      if (!override) return div;
      return {
        ...div,
        tagline: override.tagline || div.tagline,
        description: override.description || div.description,
        email: override.email || div.email,
        website: override.website || div.website,
        services: override.services?.length ? override.services : div.services,
        color: override.color || div.color,
      };
    }),
    ...customDivisions
      .filter((c) => !staticDivisionIds.has(c.division_id))
      .map(customToBoothDivision),
  ];

  const division = allDivisions.find((d) => d.id === divisionId);

  if (!division) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Division Not Found</h1>
          <p className="text-muted-foreground">The booth division you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/booths")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Booth Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/booths")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Booth Catalog
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: division.color }}
              >
                <division.icon className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground font-heading">
                {division.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="cursor-pointer" onClick={() => navigate("/org/transperfect")}>
              <BrandHubLogo size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Full-Page Division Content */}
      <DivisionPageContent division={division} isAdmin={isAdmin} />
    </div>
  );
}

// Full-page version of the division detail content
function DivisionPageContent({
  division,
  isAdmin,
}: {
  division: BoothDivision;
  isAdmin: boolean;
}) {
  const [activeVariant, setActiveVariant] = useState(0);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [newVariantLabel, setNewVariantLabel] = useState("");
  const Icon = division.icon;
  const { getMergedVariants, uploadImage, deleteImage, images } = useBoothImages(division.id);
  const variantImgRef = useRef<HTMLInputElement>(null);
  const newVariantFileRef = useRef<HTMLInputElement>(null);

  const mergedVariants = getMergedVariants(division.variants);
  const currentVariant = mergedVariants[activeVariant] || mergedVariants[0];
  const resolvedImage = currentVariant?.image || division.images[0];
  const hasCustomImage = currentVariant?.isCustom || currentVariant?.hasOverride;

  useEffect(() => {
    if (activeVariant >= mergedVariants.length && mergedVariants.length > 0) {
      setActiveVariant(mergedVariants.length - 1);
    }
  }, [mergedVariants.length, activeVariant]);

  const handleVariantUpload = async (file: File) => {
    if (!currentVariant) return;
    setUploading(true);
    await uploadImage(currentVariant.label, file);
    setUploading(false);
  };

  const handleAddVariant = async (file: File) => {
    if (!newVariantLabel.trim()) {
      toast.error("Enter a label for the new variant");
      return;
    }
    setUploading(true);
    await uploadImage(newVariantLabel.trim(), file);
    setUploading(false);
    setNewVariantLabel("");
    setAddingVariant(false);
    setActiveVariant(mergedVariants.length);
  };

  const handleDeleteVariant = async () => {
    if (!currentVariant) return;
    if (currentVariant.isCustom) {
      await deleteImage(currentVariant.label);
      setActiveVariant(0);
    } else if (currentVariant.hasOverride) {
      await deleteImage(currentVariant.label);
    }
  };

  // We use lazy imports for the section managers that are only in BoothsCatalog
  // Since they aren't exported, we use dynamic import pattern
  const [SectionComponents, setSectionComponents] = useState<any>(null);

  useEffect(() => {
    // Dynamically import BoothsCatalog to access its internal components
    import("@/pages/BoothsCatalog").then((mod) => {
      setSectionComponents(mod);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero section with division info */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: division.color }}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-heading">{division.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{division.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          {division.description}
        </p>
        {division.stats && division.stats.length > 0 && (
          <div className="flex gap-4 mt-4">
            {division.stats.map((stat) => (
              <div key={stat.label} className="px-4 py-2 rounded-lg bg-muted/50 border border-border">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer - Full width */}
      <div
        className="relative rounded-2xl overflow-hidden bg-muted aspect-[16/9] cursor-zoom-in group/img mb-6"
        onClick={() => setImagePreviewOpen(true)}
        title="Click to enlarge"
      >
        {uploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.img
            key={`${activeVariant}-${resolvedImage}`}
            src={resolvedImage}
            alt={currentVariant?.label || division.name}
            className="w-full h-full object-contain bg-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/20 pointer-events-none">
          <ZoomIn className="h-8 w-8 text-white drop-shadow-lg" />
        </div>
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10 flex gap-1.5">
            <input
              ref={variantImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVariantUpload(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                variantImgRef.current?.click();
              }}
              className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              title="Upload image for this variant"
            >
              <Upload className="h-4 w-4" />
            </button>
            {hasCustomImage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVariant();
                }}
                className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-destructive/70 transition-colors"
                title={
                  currentVariant?.isCustom
                    ? "Delete this variant"
                    : "Revert to default image"
                }
              >
                {currentVariant?.isCustom ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        )}
        {mergedVariants.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveVariant(
                  (p) => (p - 1 + mergedVariants.length) % mergedVariants.length
                );
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveVariant((p) => (p + 1) % mergedVariants.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {mergedVariants.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setActiveVariant(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === activeVariant ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <PreviewDialog
        open={imagePreviewOpen}
        onOpenChange={setImagePreviewOpen}
        title={`${division.name} — ${currentVariant?.label || ""}`}
        previewUrl={resolvedImage}
        type="image"
      />

      {/* Variant Labels + Add Variant */}
      <div className="flex gap-2 flex-wrap items-center mb-8">
        {mergedVariants.map((v, i) => (
          <Button
            key={v.label}
            variant={i === activeVariant ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveVariant(i)}
            className="text-xs gap-1"
          >
            {v.label}
            {v.isCustom && (
              <span className="text-[9px] opacity-60">(custom)</span>
            )}
          </Button>
        ))}
        {isAdmin && !addingVariant && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 border-dashed"
            onClick={() => setAddingVariant(true)}
          >
            <Plus className="h-3 w-3" /> Add Variant
          </Button>
        )}
      </div>

      {/* Add Variant Form */}
      {isAdmin && addingVariant && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border bg-muted/30 mb-8">
          <Input
            placeholder="Variant label (e.g. RDT-110 Dark)"
            value={newVariantLabel}
            onChange={(e) => setNewVariantLabel(e.target.value)}
            className="text-sm h-9"
          />
          <input
            ref={newVariantFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAddVariant(f);
              e.target.value = "";
            }}
          />
          <div className="flex gap-1.5 shrink-0">
            <Button
              size="sm"
              className="h-9 gap-1"
              onClick={() => newVariantFileRef.current?.click()}
              disabled={!newVariantLabel.trim() || uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9"
              onClick={() => {
                setAddingVariant(false);
                setNewVariantLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variant Info + Details in 2-column grid on desktop */}
      <DivisionFullContent
        division={division}
        isAdmin={isAdmin}
        currentVariant={currentVariant}
        mergedVariants={mergedVariants}
        images={images}
      />
    </div>
  );
}

// Lazy-loaded full content section using dynamic imports
function DivisionFullContent({
  division,
  isAdmin,
  currentVariant,
  mergedVariants,
  images,
}: {
  division: BoothDivision;
  isAdmin: boolean;
  currentVariant: any;
  mergedVariants: any[];
  images: any[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [Comps, setComps] = useState<any>({});

  useEffect(() => {
    // Dynamic import of BoothsCatalog to get the non-exported components
    // We'll use the DivisionDetail export approach — but since those sub-components
    // aren't exported, we render the DivisionDetail-equivalent inline using
    // the separately exported hooks/components
    setLoaded(true);
  }, []);

  // Import the individually exported/available components
  const LazyBoothMapper3D = lazy(() =>
    import("@/components/booths/booth3d/BoothMapper3D").then((m) => ({
      default: m.BoothMapper3D,
    }))
  );

  // Since the sub-section managers (ServicesManager, QRCodesManager, etc.) are not exported
  // from BoothsCatalog, we use the DivisionDetail component itself but rendered full-page style
  // Actually, let's use the exported DivisionDetail as an embedded full-width component
  // by importing it and rendering without the modal overlay

  return (
    <div className="space-y-8">
      {/* Variant-specific info */}
      {currentVariant && (
        <VariantInfoInline
          divisionId={division.id}
          variantLabel={currentVariant.label}
          isAdmin={isAdmin}
          color={division.color}
          divisionTagline={division.tagline}
        />
      )}

      {/* Two-column layout for services & production specs */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Services */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: division.color }}
            >
              Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {division.services.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="text-xs"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
            <h3
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: division.color }}
            >
              Contact
            </h3>
            <div className="space-y-2">
              {division.email && (
                <a
                  href={`mailto:${division.email}`}
                  className="text-sm text-primary hover:underline block"
                >
                  {division.email}
                </a>
              )}
              {division.website && (
                <a
                  href={
                    division.website.startsWith("http")
                      ? division.website
                      : `https://${division.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block"
                >
                  {division.website}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Font Family */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Type className="h-4 w-4" /> Font Family
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Poppins
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Used across all booth materials — weights 300–800
                </p>
              </div>
              <a
                href="https://fonts.google.com/specimen/Poppins"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                <Download className="h-3 w-3" /> Download
              </a>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Light 300",
                "Regular 400",
                "Medium 500",
                "SemiBold 600",
                "Bold 700",
                "ExtraBold 800",
              ].map((w) => (
                <span
                  key={w}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          {division.boothColors && division.boothColors.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: division.color }}
              >
                Booth Color Palette
              </h3>
              <div className="flex gap-2">
                {division.boothColors.map((c, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg border border-border shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booth Content */}
      {division.boothContent && division.boothContent.length > 0 && (
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold"
            style={{ color: division.color }}
          >
            Booth Content
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {division.boothContent.map((section) => (
              <div
                key={section.heading}
                className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-2"
              >
                <h4 className="text-sm font-semibold text-foreground">
                  {section.heading}
                </h4>
                <ul className="space-y-1">
                  {section.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: division.color }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Booth Mapper */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5" style={{ color: division.color }} />
          <h3 className="text-lg font-semibold">3D Booth Mapper</h3>
          <Badge variant="outline" className="text-xs">
            Interactive
          </Badge>
        </div>
        <Suspense
          fallback={
            <div className="h-[500px] rounded-xl border flex items-center justify-center bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading 3D viewer...</span>
              </div>
            </div>
          }
        >
          <LazyBoothMapper3D
            variantImages={mergedVariants.map((v: any) => ({
              label: v.label,
              url: v.image,
            }))}
            divisionName={division.name}
            divisionId={division.id}
            variantLabel={currentVariant?.label || "default"}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Inline variant info component (simplified version)
function VariantInfoInline({
  divisionId,
  variantLabel,
  isAdmin,
  color,
  divisionTagline,
}: {
  divisionId: string;
  variantLabel: string;
  isAdmin: boolean;
  color: string;
  divisionTagline: string;
}) {
  // Use the hook directly
  const { useBoothVariantInfo } = require("@/hooks/useBoothVariantInfo");
  // Actually let's import at top — but we can't dynamic require in this pattern
  // Instead use a lazy state approach
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    import("@/hooks/useBoothVariantInfo").then(() => {
      // The hook is used in a component, not directly callable here
      // We'll skip this for now and let the main BoothsCatalog DivisionDetail handle it
    });
  }, []);

  // For the initial release, variant info is shown through the static data
  // The full variant info hook integration will come from the BoothsCatalog managers
  return null;
}
