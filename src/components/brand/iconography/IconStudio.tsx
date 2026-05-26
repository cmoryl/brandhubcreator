/**
 * IconStudio - Tab-based icon creation, management, and export hub
 * 
 * Simplified from 6 sequential wizard steps to 4 clear tabs:
 * 1. Library  - Browse, manage, upload & import icons
 * 2. AI Generate - AI-powered icon generation
 * 3. Style    - Colorize, brand hierarchy, app icons
 * 4. Export   - Batch export in multiple formats
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Library,
  Wand2,
  Sparkles,
  Palette,
  Package,
  Smartphone,
  Globe,
} from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import sub-components
import { IconStudioLibrary } from './studio/IconStudioLibrary';
import { IconStudioAIGenerator } from './studio/IconStudioAIGenerator';
import { IconStudioColorizer } from './studio/IconStudioColorizer';
import { IconBrandHierarchy } from './studio/IconBrandHierarchy';
import { IconStudioAppIcons } from './studio/IconStudioAppIcons';
import { IconStudioCreator } from './studio/IconStudioCreator';
import { IconStudioExport } from './studio/IconStudioExport';

export type IconStudioTab = 'library' | 'ai-generator' | 'colorizer' | 'hierarchy' | 'app-icons' | 'creator' | 'export';

// Map old tab IDs to new simplified tabs
type SimplifiedTab = 'library' | 'creator' | 'generate' | 'style' | 'export';

const TAB_MAPPING: Record<IconStudioTab, SimplifiedTab> = {
  'library': 'library',
  'creator': 'creator',
  'ai-generator': 'generate',
  'colorizer': 'style',
  'hierarchy': 'style',
  'app-icons': 'style',
  'export': 'export',
};

interface IconStudioProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  asPage?: boolean;
  organizationId: string;
  organizationName?: string;
  brandColors?: Array<{ hex: string; name: string }>;
  initialTab?: IconStudioTab;
  onIconsCreated?: (icons: BrandIconography[], libraryId?: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  entityName?: string;
  brandIdentity?: {
    archetype?: string;
    services?: Array<{ name: string }>;
    values?: Array<{ text: string }>;
    industry?: string;
    missionStatement?: string;
  };
}

export const IconStudio = ({
  open = false,
  onOpenChange,
  asPage = false,
  organizationId,
  organizationName = '',
  brandColors = [],
  initialTab = 'library',
  onIconsCreated,
  entityId,
  entityType,
  entityName,
  brandIdentity,
}: IconStudioProps) => {
  const mappedInitial = TAB_MAPPING[initialTab] || 'library';
  const [activeTab, setActiveTab] = useState<SimplifiedTab>(mappedInitial);
  // Sub-view within the Style tab
  const [styleSubView, setStyleSubView] = useState<'colorize' | 'hierarchy' | 'app-icons'>('colorize');

  // Sync when dialog opens
  useEffect(() => {
    if (open) {
      const mapped = TAB_MAPPING[initialTab] || 'library';
      setActiveTab(mapped);
      // If initial tab maps to a style sub-view, set it
      if (initialTab === 'colorizer') setStyleSubView('colorize');
      else if (initialTab === 'hierarchy') setStyleSubView('hierarchy');
      else if (initialTab === 'app-icons') setStyleSubView('app-icons');
    }
  }, [open, initialTab]);

  // Shared icon library state
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

  const totalIcons = useMemo(() => libraries.reduce((sum, l) => sum + l.icons.length, 0), [libraries]);

  // Fetch brands, products, and events for the Hierarchy sub-view
  const { data: hierarchyBrands = [] } = useQuery({
    queryKey: ['hierarchy-brands', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, name').eq('organization_id', organizationId),
        supabase.from('products').select('id, name').eq('organization_id', organizationId),
        supabase.from('events').select('id, name').eq('organization_id', organizationId),
      ]);
      const items: Array<{ id: string; name: string; type: 'brand' | 'product' | 'event' }> = [];
      (brandsRes.data || []).forEach(b => items.push({ id: b.id, name: b.name, type: 'brand' }));
      (productsRes.data || []).forEach(p => items.push({ id: p.id, name: p.name, type: 'product' }));
      (eventsRes.data || []).forEach(e => items.push({ id: e.id, name: e.name, type: 'event' }));
      return items;
    },
    enabled: open && !!organizationId,
  });

  // Handle icons being created/saved
  const handleSaveIcons = useCallback((icons: BrandIconography[], libraryId?: string) => {
    if (libraryId) {
      const targetLibrary = libraries.find(l => l.id === libraryId);
      if (targetLibrary) {
        updateLibrary.mutate({
          id: libraryId,
          updates: { icons: [...targetLibrary.icons, ...icons] },
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
        description: 'AI-generated icon set',
        icons: icons,
      });
    }
    onIconsCreated?.(icons, libraryId);
  }, [libraries, coreLibraries, updateLibrary, createLibrary, organizationId, onIconsCreated]);

  const handleNavigateToTab = useCallback((tab: IconStudioTab) => {
    const mapped = TAB_MAPPING[tab];
    if (mapped) {
      setActiveTab(mapped);
      if (tab === 'colorizer') setStyleSubView('colorize');
      else if (tab === 'hierarchy') setStyleSubView('hierarchy');
      else if (tab === 'app-icons') setStyleSubView('app-icons');
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'library':
        return (
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
        );
      case 'creator':
        return (
          <IconStudioCreator
            organizationId={organizationId}
            brandColors={brandColors}
            libraries={libraries}
            onSaveIcons={handleSaveIcons}
          />
        );
      case 'generate':
        return (
          <IconStudioAIGenerator
            organizationId={organizationId}
            organizationName={organizationName}
            brandColors={brandColors}
            libraries={libraries}
            onSaveIcons={handleSaveIcons}
            brandIdentity={brandIdentity}
          />
        );
      case 'style':
        return (
          <div className="space-y-4">
            {/* Sub-navigation for Style tab */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
              <Button
                variant={styleSubView === 'colorize' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setStyleSubView('colorize')}
              >
                <Palette className="h-3.5 w-3.5" />
                Colorize
              </Button>
              <Button
                variant={styleSubView === 'hierarchy' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setStyleSubView('hierarchy')}
              >
                Brand Rules
              </Button>
              <Button
                variant={styleSubView === 'app-icons' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setStyleSubView('app-icons')}
              >
                <Smartphone className="h-3.5 w-3.5" />
                App Icons
              </Button>
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
                icons={libraries.flatMap(l => l.icons)}
                onExportCSS={(css) => { navigator.clipboard.writeText(css); }}
              />
            )}
            {styleSubView === 'app-icons' && (
              <IconStudioAppIcons brandColors={brandColors} />
            )}
          </div>
        );
      case 'export':
        return (
          <IconStudioExport
            libraries={libraries}
            brandColors={brandColors}
            organizationName={organizationName}
            entityId={entityId}
            entityType={entityType}
            entityName={entityName}
            onImportToEntity={entityId && onIconsCreated ? (icons) => onIconsCreated(icons) : undefined}
          />
        );
      default:
        return null;
    }
  };

  const body = (
    <>
      {/* Tab Navigation */}
      <div className="px-6 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {([
            { id: 'library' as const, label: 'Library', icon: Library, badge: totalIcons },
            { id: 'creator' as const, label: 'Browse & Add', icon: Globe },
            { id: 'generate' as const, label: 'AI Generate', icon: Wand2 },
            { id: 'style' as const, label: 'Style', icon: Palette },
            { id: 'export' as const, label: 'Export', icon: Package },
          ]).map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  'hover:bg-accent/50',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-0.5">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </>
  );

  if (asPage) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
        <div className="px-6 pt-6 pb-4 border-b">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Icon Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, manage, and export brand icons
          </p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Icon Studio
          </DialogTitle>
          <DialogDescription>
            Create, manage, and export brand icons
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};

// Export hook for external use
export { useIconLibraries } from '@/hooks/useIconLibraries';
export type { IconLibrary } from '@/hooks/useIconLibraries';
