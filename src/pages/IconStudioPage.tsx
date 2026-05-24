/**
 * IconStudioPage — Full-page Icon Studio (shell-only).
 *
 * Single source of truth: the StudioShell sections (Dashboard, Library,
 * Brands, Styles, Sets, QA, Export, Generate, Settings). The legacy
 * "expert mode" tab cluster has been removed — generate always launches
 * the guided IconSetWizard.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { StudioShell, type ShellSection, type Brand as ShellBrand } from '@/components/icon-studio/shell/StudioShell';
import { DashboardView } from '@/components/icon-studio/shell/DashboardView';
import { ProductionSummary } from '@/components/icon-studio/shell/ProductionSummary';

import { LibraryView } from '@/components/icon-studio/shell/LibraryView';
import { BrandsView } from '@/components/icon-studio/shell/BrandsView';
import { StyleSystemsView } from '@/components/icon-studio/shell/StyleSystemsView';
import { IconSetsView } from '@/components/icon-studio/shell/IconSetsView';
import { QAView } from '@/components/icon-studio/shell/QAView';
import { ExportCenterView } from '@/components/icon-studio/shell/ExportCenterView';
import { SettingsView } from '@/components/icon-studio/shell/SettingsView';
import '@/components/icon-studio/shell/tpTokens.css';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { useSEO } from '@/hooks/useSEO';

import { IconSetWizard } from '@/components/icon-studio/IconSetWizard';

const IconStudioPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const organizationName = organization?.name ?? '';

  const { canEdit } = useGuideAdmin({ entityOrgId: organizationId });

  useSEO({
    title: 'Icon Studio — BrandHub',
    description:
      'Step-by-step industry icon set creation. Build a company core, add specialized sub-sets, and export as SVG + transparent PNG bundles.',
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Honor deep-links like /icon-studio?section=library&library=<id>&brand=<id>
  const [searchParams] = useSearchParams();
  const validSections: ShellSection[] = ['dashboard','library','brands','styles','sets','qa','export','generate'];
  const urlSection = searchParams.get('section') as ShellSection | null;
  const urlLibrary = searchParams.get('library');
  const urlBrand = searchParams.get('brand');
  const initialSection: ShellSection =
    urlSection && validSections.includes(urlSection)
      ? urlSection
      : urlLibrary
      ? 'sets'
      : 'dashboard';

  const [shellSection, setShellSection] = useState<ShellSection>(initialSection);
  const [activeBrand, setActiveBrand] = useState<ShellBrand | undefined>(undefined);
  const [deepLinkLibraryId, setDeepLinkLibraryId] = useState<string | null>(urlLibrary);
  const wizardSaveRef = useRef<(() => void) | null>(null);
  const [wizardCanSave, setWizardCanSave] = useState(false);
  const registerWizardSave = useCallback((handle: (() => void) | null) => {
    wizardSaveRef.current = handle;
    setWizardCanSave(!!handle);
  }, []);

  // Clean URL once consumed so subsequent in-app nav isn't sticky.
  // IMPORTANT: use window.history.replaceState (not setSearchParams) — RootLayout
  // remounts on location.key change, which would reset shellSection to 'dashboard'.
  useEffect(() => {
    const s = searchParams.get('section') as ShellSection | null;
    const lib = searchParams.get('library');
    const br = searchParams.get('brand');
    if (!s && !lib && !br) return;
    if (s && validSections.includes(s)) setShellSection(s);
    if (lib) {
      setDeepLinkLibraryId(lib);
      if (!s) setShellSection('sets');
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('section');
      url.searchParams.delete('library');
      url.searchParams.delete('brand');
      window.history.replaceState(window.history.state, '', url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const {
    libraries,
    coreLibraries,
    isLoading: librariesLoading,
    createLibrary,
    updateLibrary,
  } = useIconLibraries(organizationId);

  const totalIcons = useMemo(
    () => libraries.reduce((sum, l) => sum + l.icons.length, 0),
    [libraries],
  );

  // Lightweight, defensible quality heuristics computed from the actual SVG payload.
  const qualityMetrics = useMemo(() => {
    const allIcons = libraries.flatMap((l) => l.icons);
    const n = allIcons.length;
    if (n === 0) {
      return { brandCompliance: 0, a11y: 0, svgHealth: 0, exportReadiness: 0 };
    }
    let healthy = 0;
    let named = 0;
    let exportable = 0;
    const fillModes: Record<string, number> = {};
    for (const ic of allIcons) {
      const path = (ic.svgPath || '').trim();
      const hasPath = path.length > 0;
      const hasViewBox = !!ic.viewBox && /\d/.test(ic.viewBox);
      if (hasPath && hasViewBox) healthy += 1;
      if (hasPath) exportable += 1;
      const nm = (ic.name || '').trim();
      if (nm.length >= 3 && nm.toLowerCase() !== 'icon') named += 1;
      const fm = ic.fillMode || 'stroke';
      fillModes[fm] = (fillModes[fm] || 0) + 1;
    }
    const dominant = Math.max(...Object.values(fillModes));
    return {
      brandCompliance: Math.round((dominant / n) * 100),
      a11y: Math.round((named / n) * 100),
      svgHealth: Math.round((healthy / n) * 100),
      exportReadiness: Math.round((exportable / n) * 100),
    };
  }, [libraries]);

  const { data: hierarchyBrands = [] } = useQuery({
    queryKey: ['icon-studio-page-hierarchy', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const [b, p, e] = await Promise.all([
        supabase.from('brands').select('id, name, slug').eq('organization_id', organizationId),
        supabase.from('products').select('id, name, slug').eq('organization_id', organizationId),
        supabase.from('events').select('id, name, slug').eq('organization_id', organizationId),
      ]);
      const items: Array<{ id: string; name: string; slug?: string; type: 'brand' | 'product' | 'event' }> = [];
      (b.data || []).forEach((x: any) => items.push({ id: x.id, name: x.name, slug: x.slug, type: 'brand' }));
      (p.data || []).forEach((x: any) => items.push({ id: x.id, name: x.name, slug: x.slug, type: 'product' }));
      (e.data || []).forEach((x: any) => items.push({ id: x.id, name: x.name, slug: x.slug, type: 'event' }));
      return items;
    },
    enabled: !!organizationId,
  });

  const shellBrands: ShellBrand[] = useMemo(() => {
    const base: ShellBrand[] = organization ? [{ id: organization.id, name: organization.name }] : [];
    const extras: ShellBrand[] = hierarchyBrands.map((b) => ({ id: b.id, name: b.name }));
    const seen = new Set<string>();
    return [...base, ...extras].filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)));
  }, [organization, hierarchyBrands]);

  // Restore active brand from URL or localStorage once brands load
  useEffect(() => {
    if (activeBrand || shellBrands.length === 0) return;
    const storageKey = `icon-studio:active-brand:${organizationId}`;
    const targetId = urlBrand || (typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null);
    if (targetId) {
      const match = shellBrands.find((b) => b.id === targetId);
      if (match) setActiveBrand(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellBrands, organizationId]);

  // Persist active brand selection
  const handleBrandChange = useCallback((b: ShellBrand) => {
    setActiveBrand(b);
    if (typeof window !== 'undefined' && organizationId) {
      window.localStorage.setItem(`icon-studio:active-brand:${organizationId}`, b.id);
    }
  }, [organizationId]);

  const handleSaveSetAsLibrary = useCallback(
    (name: string, icons: BrandIconography[]) => {
      if (!organizationId || !canEdit) return;
      createLibrary.mutate({
        organization_id: organizationId,
        name,
        level: 'core',
        description: `Created in Icon Studio wizard (${icons.length} icons)`,
        icons,
      });
    },
    [organizationId, createLibrary, canEdit],
  );

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <StudioShell
      activeSection={shellSection}
      onSectionChange={setShellSection}
      brands={shellBrands}
      activeBrand={activeBrand}
      onBrandChange={handleBrandChange}
      onBack={() => navigate(-1)}
      onSaveToLibrary={
        canEdit && shellSection === 'generate' && wizardCanSave
          ? () => wizardSaveRef.current?.()
          : undefined
      }
      rightRail={
        shellSection === 'generate' ? (
          <ProductionSummary
            metrics={{
              totalIcons,
              sections: libraries.length,
              approved: libraries.reduce((s, l) => s + (l.is_active ? l.icons.length : 0), 0),
              needsReview: libraries.reduce((s, l) => s + (l.is_active ? 0 : l.icons.length), 0),
              failed: 0,
              generating: 0,
              brandCompliance: qualityMetrics.brandCompliance,
              a11y: qualityMetrics.a11y,
              svgHealth: qualityMetrics.svgHealth,
              exportReadiness: qualityMetrics.exportReadiness,
            }}
            brandName={activeBrand?.name}
            industryName="Workspace"
            onSave={canEdit && wizardCanSave ? () => wizardSaveRef.current?.() : undefined}
            onExport={() => setShellSection('export')}
          />
        ) : undefined
      }
    >
      {!organizationId ? (
        <Card className="tp-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Select or create an organization to use Icon Studio.
          </CardContent>
        </Card>
      ) : librariesLoading && libraries.length === 0 ? (
        <Card className="tp-card">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading icon libraries…
          </CardContent>
        </Card>
      ) : shellSection === 'dashboard' ? (
        <DashboardView
          organizationName={organizationName}
          totalIcons={totalIcons}
          totalLibraries={libraries.length}
          onStartGenerate={() => setShellSection('generate')}
          onNavigate={(section) => setShellSection(section)}
          onOpenLibrary={(id) => {
            setDeepLinkLibraryId(id);
            setShellSection('library');
          }}
          recentLibraries={[...libraries]
            .sort((a: any, b: any) => {
              const ta = new Date(a.updated_at || a.created_at || 0).getTime();
              const tb = new Date(b.updated_at || b.created_at || 0).getTime();
              return tb - ta;
            })
            .slice(0, 5)
            .map((l) => ({
              id: l.id,
              name: l.name,
              level: l.level,
              iconCount: l.icons.length,
              isActive: l.is_active,
              icons: l.icons,
            }))}
          brandProfiles={hierarchyBrands.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            entityType: b.type,
            tone: b.type === 'brand' ? 'Brand' : b.type === 'product' ? 'Product' : 'Event',
          }))}
        />
      ) : shellSection === 'generate' ? (
        <IconSetWizard
          organizationName={organizationName}
          entityId={activeBrand?.id}
          entityType="brand"
          onSaveAsLibrary={canEdit ? handleSaveSetAsLibrary : undefined as any}
          registerSaveHandle={registerWizardSave}
        />
      ) : shellSection === 'library' ? (
        <LibraryView
          libraries={libraries}
          organizationId={organizationId}
          canEdit={canEdit}
          onCreate={() => setShellSection('generate')}
          onRemix={() => setShellSection('generate')}
          autoOpenLibraryId={deepLinkLibraryId}
          onAutoOpenConsumed={() => setDeepLinkLibraryId(null)}
        />
      ) : shellSection === 'brands' ? (
        <BrandsView organizationName={organizationName} organizationId={organizationId} brandProfiles={hierarchyBrands} />
      ) : shellSection === 'styles' ? (
        <StyleSystemsView onStartGenerate={() => setShellSection('generate')} />
      ) : shellSection === 'sets' ? (
        <IconSetsView
          libraries={libraries}
          organizationId={organizationId}
          canEdit={canEdit}
          onCreate={() => setShellSection('generate')}
          onRemix={() => setShellSection('generate')}
          onCompare={() => setShellSection('qa')}
          autoOpenLibraryId={deepLinkLibraryId}
          onAutoOpenConsumed={() => setDeepLinkLibraryId(null)}
        />
      ) : shellSection === 'qa' ? (
        <QAView
          libraries={libraries}
          totalIcons={totalIcons}
          organizationId={organizationId}
          onStartGenerate={() => setShellSection('generate')}
        />
      ) : shellSection === 'export' ? (
        <ExportCenterView
          libraries={libraries}
          organizationName={organizationName}
          onOpenLibrary={() => setShellSection('library')}
        />
      ) : (
        <SettingsView />
      )}
    </StudioShell>
  );
};

export default IconStudioPage;
