/**
 * BrandIconHubPage — Per-brand icon hub.
 *
 * Route: /icon-studio/brand/:slug
 *
 * Acts as the dedicated icon page for a single brand:
 *  - Linked icon collections (with link/unlink controls)
 *  - Quick actions (generate set scoped to brand, open style systems, export)
 *  - Brand-scoped settings placeholders for advanced integrations
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Building2, Library, Palette, Package, ShieldCheck,
  Wand2, Plus, Link as LinkIcon, Unlink, ExternalLink, Settings,
  Search, ArrowRight, FileDown, Loader2, Eye, Download, Copy, FileCode,
} from 'lucide-react';
import { downloadIconSvg, downloadIconPng, downloadIconBundle } from '@/lib/iconStudio/exportIcon';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import DOMPurify from 'dompurify';
import type { BrandIconography } from '@/types/brand';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { useSEO } from '@/hooks/useSEO';
import { IconSetPreview } from '@/components/icon-studio/shell/IconSetPreview';
import { IconSvgRender } from '@/components/icon-studio/IconSvgRender';
import '@/components/icon-studio/shell/tpTokens.css';
import { toast } from 'sonner';
import { buildBrandIconPdf } from '@/lib/iconStudio/brandIconPdf';
import { PdfPreviewDialog } from '@/components/icon-studio/PdfPreviewDialog';
import { PdfBrandingPopover, defaultPdfBranding, type PdfBrandingState } from '@/components/icon-studio/PdfBrandingPopover';
import { useHiddenItems } from '@/components/icon-studio/shell/useHiddenItems';

const SAMPLE_FOR = (name: string): string[] => {
  const n = name.toLowerCase();
  if (n.includes('global')) return ['🔗', '🌍', '⚙️', '📡', '🧩', '🔁'];
  if (n.includes('health')) return ['🩺', '💊', '🏥', '❤️', '📋', '🧬'];
  if (n.includes('travel')) return ['✈️', '🏨', '🎫', '⭐', '🗺️', '🧳'];
  if (n.includes('finance') || n.includes('bank')) return ['💳', '🏦', '📈', '💰', '🔐', '🧾'];
  if (n.includes('ai')) return ['✨', '🧠', '🤖', '⚡', '🪄', '🧪'];
  return ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'];
};

type EntityType = 'brand' | 'product' | 'event';

interface BrandIconHubPageProps {
  entityType?: EntityType;
}

const TABLE_FOR: Record<EntityType, 'brands' | 'products' | 'events'> = {
  brand: 'brands',
  product: 'products',
  event: 'events',
};

const LABEL_FOR: Record<EntityType, string> = {
  brand: 'Brand Icon Hub',
  product: 'Product Icon Hub',
  event: 'Event Icon Hub',
};

const BrandIconHubPage = ({ entityType = 'brand' }: BrandIconHubPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Resolve entity (brand/product/event) by slug within active org
  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ['entity-by-slug', entityType, slug, organizationId],
    queryFn: async () => {
      if (!slug || !organizationId) return null;
      const { data } = await supabase
        .from(TABLE_FOR[entityType])
        .select('id, name, slug, guide_data')
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .maybeSingle();
      return data;
    },
    enabled: !!slug && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });


  useSEO({
    title: brand?.name ? `${brand.name} · Icon Hub — BrandHub` : 'Brand Icon Hub',
    description: 'Dedicated icon hub for this brand — linked collections, generation, style systems, and export.',
  });

  const { libraries, isLoading: librariesLoading } = useIconLibraries(organizationId);
  const {
    links,
    linkLibraryToBrand,
    unlinkLibraryFromBrand,
    linkLibraryToEntity,
    unlinkLibraryFromEntity,
    getLinkedLibraryIdsForEntity,
  } = useIconLibraryBrandLinks(organizationId);

  // Explicit links from the join table (entity-type aware: brand/product/event)
  const explicitLinkedIds = useMemo(
    () => (brand?.id ? new Set(getLinkedLibraryIdsForEntity(brand.id, entityType)) : new Set<string>()),
    [brand?.id, entityType, links],
  );

  // Implicit inheritance: every entity inherits "core" org-wide collections,
  // plus any brand/product_line collection whose name matches the entity name.
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const entityKey = normalize(brand?.name || '');
  const implicitLinkedIds = useMemo(() => {
    const set = new Set<string>();
    for (const lib of libraries) {
      if (lib.level === 'core') { set.add(lib.id); continue; }
      const libKey = normalize(lib.name);
      if (!libKey || !entityKey) continue;
      if (libKey === entityKey || libKey.includes(entityKey) || entityKey.includes(libKey)) {
        set.add(lib.id);
      }
    }
    return set;
  }, [libraries, entityKey]);

  // Per-entity hide list (suppresses inherited collections from this hub)
  const { isHidden, hide: hideLink, unhide: unhideLink } = useHiddenItems(
    `linked-libs:${entityType}:${brand?.id || 'none'}`,
    organizationId,
  );

  const linkedIds = useMemo(() => {
    const merged = new Set<string>(implicitLinkedIds);
    explicitLinkedIds.forEach((id) => merged.add(id));
    // Remove any user-hidden ids
    for (const id of Array.from(merged)) {
      if (isHidden(id)) merged.delete(id);
    }
    return merged;
  }, [implicitLinkedIds, explicitLinkedIds, isHidden]);

  const linkedLibraries = useMemo(
    () => libraries.filter((l) => linkedIds.has(l.id)),
    [libraries, linkedIds],
  );

  const availableLibraries = useMemo(
    () => libraries.filter((l) => !linkedIds.has(l.id)),
    [libraries, linkedIds],
  );

  const totalLinkedIcons = useMemo(
    () => linkedLibraries.reduce((sum, l) => sum + l.icons.length, 0),
    [linkedLibraries],
  );

  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewLibId, setPreviewLibId] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<{ open: boolean; url: string | null; filename: string; title: string }>(
    { open: false, url: null, filename: '', title: '' },
  );
  // null = use computed defaults from current brand/accent
  const [pdfBranding, setPdfBranding] = useState<PdfBrandingState | null>(null);
  const previewLib = useMemo(
    () => linkedLibraries.find((l) => l.id === previewLibId) || null,
    [linkedLibraries, previewLibId],
  );
  const [selectedIcon, setSelectedIcon] = useState<{ icon: BrandIconography; libraryName: string } | null>(null);
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('dark');
  const openIconDetail = (icon: BrandIconography, libraryName: string) => {
    setSelectedIcon({ icon, libraryName });
  };
  const handleDownloadPdf = async () => {
    if (!brand) return;
    if (linkedLibraries.length === 0) {
      toast.info('Link at least one collection before exporting a PDF.');
      return;
    }
    setExportingPdf(true);
    // Open the preview dialog immediately in a loading state so the user gets feedback.
    setPdfPreview({ open: true, url: null, filename: '', title: `${brand.name} · Icon system` });
    const toastId = toast.loading(`Building ${brand.name} icon PDF preview…`);
    try {
      const guide: any = (brand as any).guide_data || {};
      const colors: Array<{ hex: string; role?: string }> = Array.isArray(guide?.colors) ? guide.colors : [];
      const primary = colors.find((c) => c?.role === 'primary')?.hex || colors[0]?.hex;
      const logos: Array<{ url: string; variant?: string }> = Array.isArray(guide?.logos) ? guide.logos : [];
      const logo =
        logos.find((l) => l?.variant === 'primary')?.url ||
        logos.find((l) => l?.variant === 'icon')?.url ||
        logos[0]?.url;
      const tagline: string | undefined = guide?.hero?.tagline || undefined;

      const entityKindLabel: 'Brand' | 'Product' | 'Event' =
        entityType === 'product' ? 'Product' : entityType === 'event' ? 'Event' : 'Brand';
      const effectiveBranding =
        pdfBranding ?? defaultPdfBranding(brand.name, entityKindLabel, primary || '#0f172a');

      const { url, filename } = await buildBrandIconPdf({
        entityName: brand.name,
        entityKind: entityKindLabel,
        accentColor: primary,
        palette: colors.map((c) => c?.hex).filter(Boolean),
        logoUrl: logo,
        tagline,
        autoDownload: false,
        branding: effectiveBranding,
        libraries: linkedLibraries.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description || undefined,
          level: l.level,
          icons: l.icons,
        })),
      });
      setPdfPreview({ open: true, url, filename, title: `${brand.name} · Icon system` });
      toast.success('Preview ready — review then download.', { id: toastId });
    } catch (err) {
      console.error('Icon PDF export failed', err);
      toast.error('Failed to build PDF', { id: toastId });
      setPdfPreview({ open: false, url: null, filename: '', title: '' });
    } finally {
      setExportingPdf(false);
    }
  };


  // Brand-scoped icon search across linked collections
  const [iconQuery, setIconQuery] = useState('');
  const searchResults = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return [] as Array<{ icon: BrandIconography; libraryId: string; libraryName: string }>;
    const out: Array<{ icon: BrandIconography; libraryId: string; libraryName: string }> = [];
    for (const lib of linkedLibraries) {
      for (const icon of lib.icons) {
        const name = (icon.name || '').toLowerCase();
        const cat = (icon.category || '').toLowerCase();
        if (name.includes(q) || cat.includes(q)) {
          out.push({ icon, libraryId: lib.id, libraryName: lib.name });
          if (out.length >= 60) break;
        }
      }
      if (out.length >= 60) break;
    }
    return out;
  }, [iconQuery, linkedLibraries]);

  const renderIconSvg = (icon: BrandIconography) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullSvg = icon.svgPath?.includes('<');
    if (isFullSvg) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      return (
        <svg viewBox={viewBox} className="w-full h-full" fill="currentColor">
          <g dangerouslySetInnerHTML={{ __html: sanitized }} />
        </svg>
      );
    }
    return (
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
        strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
      >
        <path d={icon.svgPath} />
      </svg>
    );
  };

  const brandColors = useMemo(() => {
    const palette: any[] = (brand as any)?.guide_data?.colors?.primary || [];
    return Array.isArray(palette) ? palette.slice(0, 6) : [];
  }, [brand]);

  if (authLoading || !user || brandLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="icon-studio-tp min-h-screen" style={{ background: 'hsl(var(--tp-surface-0))' }}>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-4">
          <h1 className="text-2xl font-semibold">{entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found</h1>
          <p className="text-muted-foreground">
            We couldn't find a {entityType} with the slug “{slug}” in this workspace.
          </p>
          <Button onClick={() => navigate('/icon-studio')} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Icon Studio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="icon-studio-tp min-h-screen"
      style={{ background: 'hsl(var(--tp-surface-0))' }}
      data-theme="light"
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{
          background: 'hsl(var(--tp-surface-1) / 0.92)',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/icon-studio')}
              className="gap-1.5 h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Icon Studio</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: 'linear-gradient(135deg, hsl(var(--tp-digital-blue)), hsl(var(--tp-light-blue)))' }}
              >
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-sm font-semibold truncate">{brand.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {LABEL_FOR[entityType]}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" asChild>
              <Link to={`/${entityType}/${brand.slug}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{entityType === 'brand' ? 'Brand profile' : entityType === 'product' ? 'Product profile' : 'Event profile'}</span>
              </Link>
            </Button>
            {(() => {
              const guide: any = (brand as any).guide_data || {};
              const colors: Array<{ hex: string; role?: string }> = Array.isArray(guide?.colors) ? guide.colors : [];
              const primary = colors.find((c) => c?.role === 'primary')?.hex || colors[0]?.hex || '#0f172a';
              const kind: 'Brand' | 'Product' | 'Event' =
                entityType === 'product' ? 'Product' : entityType === 'event' ? 'Event' : 'Brand';
              const current = pdfBranding ?? defaultPdfBranding(brand.name, kind, primary);
              return (
                <PdfBrandingPopover
                  value={current}
                  onChange={setPdfBranding}
                  onReset={() => setPdfBranding(null)}
                />
              );
            })()}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={handleDownloadPdf}
              disabled={exportingPdf || linkedLibraries.length === 0}
              title="Download a printable PDF of every linked icon"
            >
              {exportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => navigate('/icon-studio')}>
              <Wand2 className="h-3.5 w-3.5" />
              Generate
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Hero */}
        <section className="tp-card relative overflow-hidden p-7">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(60% 60% at 15% 0%, hsl(var(--tp-digital-blue) / 0.25), transparent 70%), radial-gradient(50% 80% at 100% 100%, hsl(var(--tp-pink) / 0.15), transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{organization?.name || 'Workspace'}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{brand.name} — Icon Hub</h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                The dedicated icon command center for this brand. Manage which icon collections
                it inherits, generate new sets scoped to its identity, and configure advanced
                integrations.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {brandColors.map((c: any, i: number) => (
                <div
                  key={i}
                  title={c.name || c.hex}
                  className="h-7 w-7 rounded-md border border-border"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Metric tiles */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricTile label="Linked collections" value={linkedLibraries.length} icon={Library} accent="--tp-light-blue" />
          <MetricTile label="Total icons" value={totalLinkedIcons} icon={Package} accent="--tp-digital-blue" />
          <MetricTile label="Brand colors" value={brandColors.length} icon={Palette} accent="--tp-pink" />
          <MetricTile label="QA score" value="—" icon={ShieldCheck} accent="--tp-green" />
        </section>

        <Tabs defaultValue="collections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="collections" className="gap-1.5">
              <Library className="h-3.5 w-3.5" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Style & Rules
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* === COLLECTIONS === */}
          <TabsContent value="collections" className="space-y-6">
            {/* Brand icon search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search icons in {brand.name}'s system
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Searches across every collection linked to this brand ({totalLinkedIcons} icons).
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={iconQuery}
                    onChange={(e) => setIconQuery(e.target.value)}
                    placeholder="Search by icon name or category…"
                    className="pl-9"
                  />
                </div>
                {iconQuery.trim() && (
                  searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No icons match “{iconQuery}” in this brand's linked collections.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {searchResults.map(({ icon, libraryId, libraryName }) => (
                        <button
                          key={`${libraryId}-${icon.id}`}
                          type="button"
                          onClick={() => openIconDetail(icon, libraryName)}
                          title={`${icon.name} · ${libraryName}`}
                          className="group flex flex-col items-center gap-1 p-2 rounded-md border border-border/60 bg-card hover:border-primary/50 hover:shadow-sm transition-all text-foreground"
                        >
                          <div className="h-8 w-8 text-foreground/80 group-hover:text-primary">
                            {renderIconSvg(icon)}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {icon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Linked */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Linked collections</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    These collections render on this brand's pages by default.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('/icon-studio')}>
                  <Plus className="h-3.5 w-3.5" />
                  New collection
                </Button>
              </CardHeader>
              <CardContent>
                {librariesLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
                ) : linkedLibraries.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground">
                    No collections linked yet. Link one below or create a new set.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {linkedLibraries.map((lib) => {
                      const isExplicit = explicitLinkedIds.has(lib.id);
                      const openLib = () => setPreviewLibId(lib.id);
                      const handleUnlink = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (isExplicit) {
                          unlinkLibraryFromEntity.mutate({ libraryId: lib.id, entityId: brand.id, entityType });
                        } else {
                          hideLink(lib.id);
                          toast.success(`${lib.name} removed from this hub`, {
                            action: { label: 'Undo', onClick: () => unhideLink(lib.id) },
                          });
                        }
                      };
                      return (
                        <article
                          key={lib.id}
                          role="button"
                          tabIndex={0}
                          onClick={openLib}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLib(); } }}
                          className="tp-card tp-card-interactive p-4 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl"
                          style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--tp-digital-blue) / 0.07), transparent 60%)' }}
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold truncate">{lib.name}</h3>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {lib.description || `${lib.level} collection`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!isExplicit && (
                                <Badge variant="outline" className="text-[10px] h-5">
                                  Inherited
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px]">
                                {lib.icons.length}
                              </Badge>
                            </div>
                          </div>
                          {lib.icons.length > 0 ? (
                            <div className="grid grid-cols-6 gap-1.5">
                              {lib.icons.slice(0, 6).map((ic) => (
                                <button
                                  key={ic.id}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openIconDetail(ic, lib.name); }}
                                  className="aspect-square rounded-md border border-border/50 bg-background/40 flex items-center justify-center text-foreground hover:border-primary/60 hover:bg-background transition-colors"
                                  title={ic.name}
                                >
                                  <IconSvgRender icon={ic} size={20} />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <IconSetPreview
                              emojis={SAMPLE_FOR(lib.name)}
                              accent="hsl(var(--tp-digital-blue))"
                              size="sm"
                              count={6}
                              variant="glass"
                            />
                          )}
                          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              Open <ArrowRight className="h-3 w-3" />
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                              onClick={handleUnlink}
                              title={isExplicit ? 'Remove explicit link' : 'Hide this inherited collection from this hub'}
                            >
                              <Unlink className="h-3 w-3" />
                              Unlink
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available to link */}
            {availableLibraries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available collections</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Other collections in this workspace you can link to {brand.name}.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border/60">
                    {availableLibraries.map((lib) => (
                      <li key={lib.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-md border bg-secondary/40 flex items-center justify-center text-muted-foreground">
                            <Library className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{lib.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {lib.icons.length} icons · {lib.level}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-8"
                          onClick={() => {
                            // If it was an inherited collection the user previously hid, just unhide it.
                            if (isHidden(lib.id) && (implicitLinkedIds.has(lib.id) || explicitLinkedIds.has(lib.id))) {
                              unhideLink(lib.id);
                              toast.success(`${lib.name} restored`);
                            } else {
                              linkLibraryToEntity.mutate({ libraryId: lib.id, entityId: brand.id, entityType });
                            }
                          }}
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Link
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === STYLE & RULES === */}
          <TabsContent value="style" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brand DNA & overrides</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Define the global stroke, fill, and color rules that every icon in this brand
                  inherits. Use the Style Systems area to choose a base, then customize here.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/icon-studio')}>
                  <Palette className="h-4 w-4" />
                  Open Style Systems
                </Button>
                <p className="text-xs text-muted-foreground">
                  Brand-scoped overrides (stroke width, corner radius, color slot maps) coming
                  next — they'll live here and cascade to every linked collection automatically.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === INTEGRATIONS === */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Advanced integrations</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Brand-scoped settings for how this hub's icons surface across the platform.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/60">
                  <IntegrationRow
                    title="Auto-inherit from parent brand"
                    description="New collections added at the org level are automatically linked here."
                    defaultEnabled
                  />
                  <IntegrationRow
                    title="Sync to brand portal"
                    description="Expose the linked icon set on this brand's public portal page."
                    defaultEnabled={false}
                  />
                  <IntegrationRow
                    title="Lock for export"
                    description="Prevent further edits — icons can only be downloaded, not modified."
                    defaultEnabled={false}
                  />
                  <IntegrationRow
                    title="Webhook on generation"
                    description="Notify an external endpoint when a new set is approved for this brand."
                    defaultEnabled={false}
                  />
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!previewLib} onOpenChange={(o) => !o && setPreviewLibId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {previewLib && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  {previewLib.name}
                  <Badge variant="secondary" className="text-[10px] ml-1">{previewLib.icons.length} icons</Badge>
                </DialogTitle>
                <DialogDescription>
                  {previewLib.description || `${previewLib.level} collection linked to ${brand?.name}.`}
                </DialogDescription>
              </DialogHeader>

              {previewLib.icons.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  This collection has no icons yet.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 py-2">
                  {previewLib.icons.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => openIconDetail(ic, previewLib.name)}
                      className="aspect-square rounded-md border border-border/50 bg-background/40 flex flex-col items-center justify-center text-foreground p-2 gap-1 hover:border-primary/60 hover:bg-background transition-colors"
                      title={ic.name}
                    >
                      <IconSvgRender icon={ic} size={28} />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">{ic.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setPreviewLibId(null)}>Close</Button>
                <Button
                  className="gap-1.5"
                  onClick={() => navigate(`/icon-studio?section=sets&library=${previewLib.id}`)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Icon Studio
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* In-app PDF preview before download */}
      <PdfPreviewDialog
        open={pdfPreview.open}
        onOpenChange={(o) => setPdfPreview((p) => ({ ...p, open: o }))}
        url={pdfPreview.url}
        filename={pdfPreview.filename}
        title={pdfPreview.title}
        loading={exportingPdf}
      />



      {/* Per-icon detail + downloads */}
      <Dialog open={!!selectedIcon} onOpenChange={(o) => !o && setSelectedIcon(null)}>
        <DialogContent className="max-w-lg">
          {selectedIcon && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  {selectedIcon.icon.name}
                </DialogTitle>
                <DialogDescription>
                  From <span className="font-medium">{selectedIcon.libraryName}</span>
                  {selectedIcon.icon.category ? ` · ${selectedIcon.icon.category}` : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewBg === 'light' ? 'default' : 'outline'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setPreviewBg('light')}
                  >
                    Light
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewBg === 'dark' ? 'default' : 'outline'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setPreviewBg('dark')}
                  >
                    Dark
                  </Button>
                </div>
                <div
                  className={`flex items-center justify-center py-6 border rounded-lg ${
                    previewBg === 'light'
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-50'
                  }`}
                >
                  <IconSvgRender icon={selectedIcon.icon} size={128} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-muted-foreground">Fill mode</dt>
                <dd className="font-medium">{selectedIcon.icon.fillMode || 'auto'}</dd>
                <dt className="text-muted-foreground">ViewBox</dt>
                <dd className="font-mono">{selectedIcon.icon.viewBox || '0 0 24 24'}</dd>
                {(selectedIcon.icon as any).tags && (selectedIcon.icon as any).tags.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {((selectedIcon.icon as any).tags as string[]).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </dd>
                  </>
                )}
              </dl>

              <DialogFooter className="flex-wrap gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selectedIcon.icon.svgPath || '');
                      toast.success('SVG copied to clipboard');
                    } catch {
                      toast.error('Could not copy');
                    }
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { downloadIconSvg(selectedIcon.icon); toast.success('SVG downloaded'); }}
                >
                  <Download className="h-3.5 w-3.5" />
                  SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    try { await downloadIconPng(selectedIcon.icon, 512); toast.success('PNG downloaded'); }
                    catch { toast.error('PNG export failed'); }
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  PNG 512
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    try { await downloadIconBundle(selectedIcon.icon); toast.success('Bundle downloaded'); }
                    catch { toast.error('Bundle export failed'); }
                  }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  All sizes (.zip)
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ----- helpers ----- */

const MetricTile = ({
  label, value, icon: Icon, accent,
}: { label: string; value: string | number; icon: any; accent: string }) => (
  <div className="tp-card p-4">
    <div className="flex items-start justify-between">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: `hsl(var(${accent}) / 0.12)`, color: `hsl(var(${accent}))` }}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3 text-xl font-semibold tabular-nums tracking-tight">{value}</div>
    <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
  </div>
);

const IntegrationRow = ({
  title, description, defaultEnabled,
}: { title: string; description: string; defaultEnabled: boolean }) => {
  const [on, setOn] = useState(defaultEnabled);
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch
        checked={on}
        onCheckedChange={(v) => {
          setOn(v);
          toast.success(`${title} ${v ? 'enabled' : 'disabled'}`);
        }}
      />
    </li>
  );
};

export default BrandIconHubPage;
