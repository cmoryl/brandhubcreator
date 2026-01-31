/**
 * IconStudio - Unified icon creation and management system
 * 
 * Consolidates all icon-related features into a single cohesive interface:
 * - Library: Manage organization icon libraries with hierarchy
 * - AI Generator: Generate complete icon sets with AI
 * - Stylizer: Convert PNG images to brand-aligned SVG icons
 * - Advanced: Responsive, stateful, and animated icon variants
 * - App Icons: Create platform-specific app icons (Android, iOS, PWA)
 * - Creator: Design individual custom icons
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Library,
  Wand2,
  Smartphone,
  Palette,
  Sparkles,
  ImageIcon,
  Zap,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandIconography } from '@/types/brand';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';

// Import sub-components (to be embedded, not opened as separate dialogs)
import { IconStudioLibrary } from './studio/IconStudioLibrary';
import { IconStudioAIGenerator } from './studio/IconStudioAIGenerator';
import { IconStudioAppIcons } from './studio/IconStudioAppIcons';
import { IconStudioCreator } from './studio/IconStudioCreator';
import { IconStylizer } from './studio/IconStylizer';
import { IconAdvancedFeatures } from './studio/IconAdvancedFeatures';
import { IconBrandHierarchy } from './studio/IconBrandHierarchy';

export type IconStudioTab = 'library' | 'ai-generator' | 'stylizer' | 'advanced' | 'hierarchy' | 'app-icons' | 'creator';

interface IconStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName?: string;
  brandColors?: Array<{ hex: string; name: string }>;
  initialTab?: IconStudioTab;
  onIconsCreated?: (icons: BrandIconography[], libraryId?: string) => void;
}

const TAB_CONFIG = [
  {
    id: 'library' as const,
    label: 'Library',
    icon: Library,
    description: 'Manage icon libraries',
  },
  {
    id: 'ai-generator' as const,
    label: 'AI Generator',
    icon: Wand2,
    description: 'Generate icon sets with AI',
  },
  {
    id: 'stylizer' as const,
    label: 'Stylizer',
    icon: ImageIcon,
    description: 'PNG to SVG conversion',
  },
  {
    id: 'advanced' as const,
    label: 'Advanced',
    icon: Zap,
    description: 'Responsive, states & animation',
  },
  {
    id: 'hierarchy' as const,
    label: 'Hierarchy',
    icon: GitBranch,
    description: 'Brand inheritance & overrides',
  },
  {
    id: 'app-icons' as const,
    label: 'App Icons',
    icon: Smartphone,
    description: 'Android, iOS & PWA icons',
  },
  {
    id: 'creator' as const,
    label: 'Creator',
    icon: Palette,
    description: 'Design custom icons',
  },
];

export const IconStudio = ({
  open,
  onOpenChange,
  organizationId,
  organizationName = '',
  brandColors = [],
  initialTab = 'library',
  onIconsCreated,
}: IconStudioProps) => {
  const [activeTab, setActiveTab] = useState<IconStudioTab>(initialTab);
  const [selectedIcon, setSelectedIcon] = useState<BrandIconography | null>(null);
  
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

  // Handle icons being created/saved from any sub-component
  const handleSaveIcons = useCallback((icons: BrandIconography[], libraryId?: string) => {
    if (libraryId) {
      const targetLibrary = libraries.find(l => l.id === libraryId);
      if (targetLibrary) {
        updateLibrary.mutate({
          id: libraryId,
          updates: {
            icons: [...targetLibrary.icons, ...icons],
          },
        });
      }
    } else if (coreLibraries.length > 0) {
      // Default to first core library
      updateLibrary.mutate({
        id: coreLibraries[0].id,
        updates: {
          icons: [...coreLibraries[0].icons, ...icons],
        },
      });
    } else {
      // Create a new library
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Icon Studio
          </DialogTitle>
          <DialogDescription>
            Create, manage, and export icons for your organization
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as IconStudioTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="px-6 pt-4 pb-2 border-b bg-muted/30">
            <TabsList className="grid grid-cols-7 w-full max-w-5xl">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="gap-2 data-[state=active]:bg-background text-xs"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="library" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
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
                    onNavigateToTab={setActiveTab}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai-generator" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconStudioAIGenerator
                    organizationId={organizationId}
                    organizationName={organizationName}
                    brandColors={brandColors}
                    libraries={libraries}
                    onSaveIcons={handleSaveIcons}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="stylizer" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconStylizer
                    brandColors={brandColors.map(c => c.hex)}
                    onIconCreated={(icon) => {
                      handleSaveIcons([icon]);
                      setSelectedIcon(icon);
                    }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="advanced" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconAdvancedFeatures
                    selectedIcon={selectedIcon}
                    brandColors={brandColors.map(c => c.hex)}
                    onIconUpdate={(icon) => {
                      setSelectedIcon(icon);
                    }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hierarchy" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconBrandHierarchy
                    organizationId={organizationId}
                    organizationName={organizationName}
                    brands={[]} // Would be populated from actual brands/products
                    brandColors={brandColors}
                    icons={libraries.flatMap(l => l.icons)}
                    onExportCSS={(css) => {
                      navigator.clipboard.writeText(css);
                    }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="app-icons" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconStudioAppIcons brandColors={brandColors} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="creator" className="h-full m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <IconStudioCreator
                    brandColors={brandColors}
                    libraries={libraries}
                    onSaveIcons={handleSaveIcons}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Export hook for external use
export { useIconLibraries } from '@/hooks/useIconLibraries';
export type { IconLibrary } from '@/hooks/useIconLibraries';
