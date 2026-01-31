/**
 * IconStudio - Unified icon creation and management system
 * 
 * Consolidates all icon-related features into a single cohesive interface:
 * - Library: Manage organization icon libraries with hierarchy
 * - AI Generator: Generate complete icon sets with AI
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandIconography } from '@/types/brand';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';

// Import sub-components (to be embedded, not opened as separate dialogs)
import { IconStudioLibrary } from './studio/IconStudioLibrary';
import { IconStudioAIGenerator } from './studio/IconStudioAIGenerator';
import { IconStudioAppIcons } from './studio/IconStudioAppIcons';
import { IconStudioCreator } from './studio/IconStudioCreator';

export type IconStudioTab = 'library' | 'ai-generator' | 'app-icons' | 'creator';

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
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="gap-2 data-[state=active]:bg-background"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
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
