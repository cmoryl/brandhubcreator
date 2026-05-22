/**
 * IconStudioPage — Full-page Icon Studio.
 *
 * Default view: a friendly 5-step wizard (IconSetWizard) that walks users
 * through Industry → Core → Sub-sets → Preflight → Export.
 *
 * "Expert mode" toggle reveals the original power-user tabs (Library, Browse,
 * AI Generate, Style, Custom Set, Bulk Export) for advanced workflows.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Library,
  Wand2,
  Sparkles,
  Palette,
  Package,
  Smartphone,
  Globe,
  ArrowLeft,
  Layers,
  Search,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useIconLibraries } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { useSEO } from '@/hooks/useSEO';

import { IconStudioLibrary } from '@/components/brand/iconography/studio/IconStudioLibrary';
import { IconStudioAIGenerator } from '@/components/brand/iconography/studio/IconStudioAIGenerator';
import { IconStudioColorizer } from '@/components/brand/iconography/studio/IconStudioColorizer';
import { IconBrandHierarchy } from '@/components/brand/iconography/studio/IconBrandHierarchy';
import { IconStudioAppIcons } from '@/components/brand/iconography/studio/IconStudioAppIcons';
import { IconStudioCreator } from '@/components/brand/iconography/studio/IconStudioCreator';
import { IconStudioExport } from '@/components/brand/iconography/studio/IconStudioExport';
import type { IconStudioTab } from '@/components/brand/iconography/IconStudio';
import { IconSetWizard } from '@/components/icon-studio/IconSetWizard';

type ExpertTab =
  | 'library'
  | 'creator'
  | 'generate'
  | 'style'
  | 'custom-set'
  | 'export';

const IconStudioPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const organizationName = organization?.name ?? '';

  useSEO({
    title: 'Icon Studio — BrandHub',
    description:
      'Step-by-step industry icon set creation. Build a company core, add specialized sub-sets, and export as SVG + transparent PNG bundles.',
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const [expertMode, setExpertMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ExpertTab>('library');
  const [styleSubView, setStyleSubView] = useState<
    'colorize' | 'hierarchy' | 'app-icons'
  >('colorize');

  const {
    libraries,
    coreLibraries,
    productLineLibraries,
    brandLibraries,
    isLoading: librariesLoading,
    createLibrary,
    updateLibrary,
    deleteLibrary,
  } = useIconLibraries(organizationId);

  const totalIcons = useMemo(
    () => libraries.reduce((sum, l) => sum + l.icons.length, 0),
    [libraries],
  );

  const { data: brandColors = [] } = useQuery({
    queryKey: ['icon-studio-brand-colors', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('brands')
        .select('guide_data')
        .eq('organization_id', organizationId)
        .limit(5);
      const colors: Array<{ hex: string; name: string }> = [];
      const seen = new Set<string>();
      (data || []).forEach((b: any) => {
        const palette = b.guide_data?.colors?.primary || [];
        (Array.isArray(palette) ? palette : []).forEach((c: any) => {
          const hex = c?.hex;
          if (hex && !seen.has(hex)) {
            seen.add(hex);
            colors.push({ hex, name: c.name || hex });
          }
        });
      });
      return colors;
    },
    enabled: !!organizationId,
  });

  const { data: hierarchyBrands = [] } = useQuery({
    queryKey: ['icon-studio-page-hierarchy', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const [b, p, e] = await Promise.all([
        supabase.from('brands').select('id, name').eq('organization_id', organizationId),
        supabase.from('products').select('id, name').eq('organization_id', organizationId),
        supabase.from('events').select('id, name').eq('organization_id', organizationId),
      ]);
      const items: Array<{ id: string; name: string; type: 'brand' | 'product' | 'event' }> = [];
      (b.data || []).forEach((x) => items.push({ id: x.id, name: x.name, type: 'brand' }));
      (p.data || []).forEach((x) => items.push({ id: x.id, name: x.name, type: 'product' }));
      (e.data || []).forEach((x) => items.push({ id: x.id, name: x.name, type: 'event' }));
      return items;
    },
    enabled: !!organizationId,
  });

  const handleSaveIcons = useCallback(
    (icons: BrandIconography[], libraryId?: string) => {
      if (libraryId) {
        const target = libraries.find((l) => l.id === libraryId);
        if (target) {
          updateLibrary.mutate({
            id: libraryId,
            updates: { icons: [...target.icons, ...icons] },
          });
        }
      } else if (coreLibraries.length > 0) {
        updateLibrary.mutate({
          id: coreLibraries[0].id,
          updates: { icons: [...coreLibraries[0].icons, ...icons] },
        });
      } else {
        createLibrary.mutate({
          organization_id: organizationId,
          name: 'Generated Icons',
          level: 'core',
          description: 'Created in Icon Studio',
          icons,
        });
      }
    },
    [libraries, coreLibraries, updateLibrary, createLibrary, organizationId],
  );

  const handleSaveSetAsLibrary = useCallback(
    (name: string, icons: BrandIconography[]) => {
      if (!organizationId) return;
      createLibrary.mutate({
        organization_id: organizationId,
        name,
        level: 'core',
        description: `Created in Icon Studio wizard (${icons.length} icons)`,
        icons,
      });
    },
    [organizationId, createLibrary],
  );

  const handleNavigateToTab = useCallback((tab: IconStudioTab) => {
    if (tab === 'colorizer') {
      setActiveTab('style');
      setStyleSubView('colorize');
    } else if (tab === 'hierarchy') {
      setActiveTab('style');
      setStyleSubView('hierarchy');
    } else if (tab === 'app-icons') {
      setActiveTab('style');
      setStyleSubView('app-icons');
    } else if (tab === 'ai-generator') {
      setActiveTab('generate');
    } else {
      setActiveTab(tab as ExpertTab);
    }
  }, []);

  const expertTabs: Array<{ id: ExpertTab; label: string; icon: any; badge?: number }> = [
    { id: 'library', label: 'Library', icon: Library, badge: totalIcons },
    { id: 'creator', label: 'Browse & Add', icon: Globe },
    { id: 'generate', label: 'AI Generate', icon: Wand2 },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'custom-set', label: 'Custom Set', icon: Layers },
    { id: 'export', label: 'Bulk Export', icon: Package },
  ];

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/40 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
              <h1 className="text-xl font-semibold tracking-tight truncate">Icon Studio</h1>
              <Badge variant="secondary" className="ml-1 flex-shrink-0">
                {totalIcons} icons · {libraries.length} sets
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
              <span>Guided</span>
              <Switch
                checked={expertMode}
                onCheckedChange={setExpertMode}
                aria-label="Toggle expert mode"
              />
              <span>Expert</span>
            </div>
          </div>
        </div>

        {expertMode && (
          <nav className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
              {expertTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border',
                      'hover:bg-accent/50',
                      isActive
                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                        : 'text-muted-foreground border-transparent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-0.5">
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!organizationId ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select or create an organization to use Icon Studio.
            </CardContent>
          </Card>
        ) : !expertMode ? (
          /* ---------- GUIDED WIZARD (default) ---------- */
          <IconSetWizard
            organizationName={organizationName}
            onSaveAsLibrary={handleSaveSetAsLibrary}
          />
        ) : (
          /* ---------- EXPERT TABS (advanced) ---------- */
          <>
            {activeTab === 'library' && (
              <IconStudioLibrary
                organizationId={organizationId}
                libraries={libraries}
                coreLibraries={coreLibraries}
                productLineLibraries={productLineLibraries}
                brandLibraries={brandLibraries}
                isLoading={librariesLoading}
                createLibrary={createLibrary}
                updateLibrary={updateLibrary}
                deleteLibrary={deleteLibrary}
                onNavigateToTab={handleNavigateToTab}
              />
            )}

            {activeTab === 'creator' && (
              <IconStudioCreator
                organizationId={organizationId}
                brandColors={brandColors}
                libraries={libraries}
                onSaveIcons={handleSaveIcons}
              />
            )}

            {activeTab === 'generate' && (
              <IconStudioAIGenerator
                organizationId={organizationId}
                organizationName={organizationName}
                brandColors={brandColors}
                libraries={libraries}
                onSaveIcons={handleSaveIcons}
              />
            )}

            {activeTab === 'style' && (
              <div className="space-y-4">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                  {(
                    [
                      { id: 'colorize', label: 'Colorize', icon: Palette },
                      { id: 'hierarchy', label: 'Brand Rules', icon: Layers },
                      { id: 'app-icons', label: 'App Icons', icon: Smartphone },
                    ] as const
                  ).map((s) => {
                    const Icon = s.icon;
                    return (
                      <Button
                        key={s.id}
                        variant={styleSubView === s.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => setStyleSubView(s.id)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {s.label}
                      </Button>
                    );
                  })}
                </div>

                {styleSubView === 'colorize' && (
                  <IconStudioColorizer
                    brandColors={brandColors}
                    libraries={libraries}
                    onSaveIcons={handleSaveIcons}
                  />
                )}
                {styleSubView === 'hierarchy' && (
                  <IconBrandHierarchy
                    organizationId={organizationId}
                    organizationName={organizationName}
                    brands={hierarchyBrands}
                    brandColors={brandColors}
                    icons={libraries.flatMap((l) => l.icons)}
                    onExportCSS={(css) => {
                      navigator.clipboard.writeText(css);
                    }}
                  />
                )}
                {styleSubView === 'app-icons' && (
                  <IconStudioAppIcons brandColors={brandColors} />
                )}
              </div>
            )}

            {activeTab === 'custom-set' && (
              <CustomSetBuilder
                libraries={libraries}
                brandColors={brandColors}
                organizationName={organizationName}
                onSaveAsLibrary={(name, icons) =>
                  createLibrary.mutate({
                    organization_id: organizationId,
                    name,
                    level: 'core',
                    description: `Custom set built in Icon Studio (${icons.length} icons)`,
                    icons,
                  })
                }
              />
            )}

            {activeTab === 'export' && (
              <IconStudioExport
                libraries={libraries}
                brandColors={brandColors}
                organizationName={organizationName}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Custom Set Builder (Expert tab)                                            */
/* -------------------------------------------------------------------------- */

interface CustomSetBuilderProps {
  libraries: ReturnType<typeof useIconLibraries>['libraries'];
  brandColors: Array<{ hex: string; name: string }>;
  organizationName: string;
  onSaveAsLibrary: (name: string, icons: BrandIconography[]) => void;
}

const CustomSetBuilder = ({
  libraries,
  brandColors,
  organizationName,
  onSaveAsLibrary,
}: CustomSetBuilderProps) => {
  const [search, setSearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [setName, setSetName] = useState('My Custom Set');

  const allIcons = useMemo(() => {
    return libraries.flatMap((lib) =>
      lib.icons.map((icon) => ({
        icon,
        libraryId: lib.id,
        libraryName: lib.name,
        key: `${lib.id}::${icon.id}`,
      })),
    );
  }, [libraries]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allIcons.forEach((i) => {
      if (i.icon.category) set.add(i.icon.category);
    });
    return Array.from(set).sort();
  }, [allIcons]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allIcons.filter((i) => {
      if (libraryFilter !== 'all' && i.libraryId !== libraryFilter) return false;
      if (categoryFilter !== 'all' && i.icon.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        i.icon.name.toLowerCase().includes(q) ||
        (i.icon.category?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [allIcons, search, libraryFilter, categoryFilter]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((i) => next.add(i.key));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedIcons = useMemo(
    () => allIcons.filter((i) => selected.has(i.key)).map((i) => i.icon),
    [allIcons, selected],
  );

  const customLibrary = useMemo(
    () => [
      {
        id: 'custom-set',
        organization_id: '',
        name: setName || 'Custom Set',
        level: 'core' as const,
        description: 'Ad-hoc custom set',
        icons: selectedIcons,
        is_active: true,
        parent_library_id: null,
        display_order: 0,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any,
    ],
    [selectedIcons, setName],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-primary" />
            Custom Set Builder
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cherry-pick icons across all your libraries and export them as one
            bundle, or save the selection as a new library.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons by name or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={libraryFilter}
              onChange={(e) => setLibraryFilter(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All libraries</option>
              {libraries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.icons.length})
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {filtered.length} shown · <strong>{selected.size}</strong> selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                Select all shown
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                disabled={selected.size === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[460px] overflow-y-auto p-1 rounded-md border bg-muted/20">
            {filtered.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                No icons match your filters.
              </div>
            ) : (
              filtered.map((i) => {
                const isSelected = selected.has(i.key);
                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => toggle(i.key)}
                    className={cn(
                      'group relative flex flex-col items-center gap-1 rounded-md border bg-card p-2 text-xs transition-all',
                      'hover:border-primary/40 hover:shadow-sm',
                      isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
                    )}
                    title={`${i.icon.name} · ${i.libraryName}`}
                  >
                    <div className="absolute top-1 right-1">
                      <Checkbox checked={isSelected} className="pointer-events-none h-3.5 w-3.5" />
                    </div>
                    <div
                      className="h-10 w-10 flex items-center justify-center text-foreground"
                      dangerouslySetInnerHTML={{ __html: i.icon.svgPath || '' }}
                    />
                    <span className="truncate w-full text-center text-[10px] text-muted-foreground">
                      {i.icon.name}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-medium text-muted-foreground">
                Set name
              </label>
              <Input
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="My Custom Set"
              />
            </div>
            <Button
              variant="outline"
              disabled={selected.size === 0 || !setName.trim()}
              onClick={() => {
                onSaveAsLibrary(setName.trim(), selectedIcons);
                clearSelection();
              }}
            >
              Save as new library
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export selection</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selected.size} icon{selected.size === 1 ? '' : 's'} ready to bundle.
            </p>
          </CardHeader>
          <CardContent>
            <IconStudioExport
              libraries={customLibrary}
              brandColors={brandColors}
              organizationName={`${organizationName || 'icons'}-${(setName || 'set')
                .toLowerCase()
                .replace(/\s+/g, '-')}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IconStudioPage;
