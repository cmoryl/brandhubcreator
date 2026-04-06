/**
 * IconStudio - Guided wizard for icon creation, management, and export
 * 
 * Step-by-step flow:
 * 1. Library - Manage or start icon collections
 * 2. AI Generator - Generate icon sets with AI
 * 3. Stylizer - Convert PNG images to SVG icons
 * 4. Colorizer - AI colors, gradients & duotone
 * 5. Hierarchy - Brand inheritance & overrides
 * 6. Export - Batch export in multiple formats
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Library,
  Wand2,
  Sparkles,
  Palette,
  Paintbrush,
  GitBranch,
  Package,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { useIconLibraries, IconLibrary } from '@/hooks/useIconLibraries';

// Import sub-components
import { IconStudioLibrary } from './studio/IconStudioLibrary';
import { IconStudioAIGenerator } from './studio/IconStudioAIGenerator';
// IconStylizer is now embedded inside IconStudioCreator
import { IconStudioColorizer } from './studio/IconStudioColorizer';
import { IconBrandHierarchy } from './studio/IconBrandHierarchy';
import { IconStudioAppIcons } from './studio/IconStudioAppIcons';
import { IconStudioCreator } from './studio/IconStudioCreator';
import { IconStudioExport } from './studio/IconStudioExport';
import { IconStudioStepper, WizardStep } from './studio/IconStudioStepper';

export type IconStudioTab = 'library' | 'ai-generator' | 'colorizer' | 'hierarchy' | 'app-icons' | 'creator' | 'export';

interface IconStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const WIZARD_STEPS: WizardStep[] = [
  { id: 'library', label: 'Library', icon: Library, description: 'Manage icon collections' },
  { id: 'ai-generator', label: 'Generate', icon: Wand2, description: 'AI icon generation' },
  { id: 'creator', label: 'Create', icon: Palette, description: 'Add & import icons' },
  { id: 'colorizer', label: 'Colorize', icon: Paintbrush, description: 'Colors & gradients' },
  { id: 'hierarchy', label: 'Organize', icon: GitBranch, description: 'Brand hierarchy' },
  { id: 'export', label: 'Export', icon: Package, description: 'Batch export' },
];

// Additional tools accessible from a "More tools" area
const EXTRA_TOOLS = [
  { id: 'app-icons' as const, label: 'App Icons', icon: Smartphone, description: 'iOS, Android & PWA' },
];

export const IconStudio = ({
  open,
  onOpenChange,
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
  const initialStepIndex = useMemo(() => {
    const idx = WIZARD_STEPS.findIndex(s => s.id === initialTab);
    return idx >= 0 ? idx : 0;
  }, [initialTab]);

  const [currentStep, setCurrentStep] = useState(initialStepIndex);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  // Track if user navigated to a bonus tool
  const [activeBonusTool, setActiveBonusTool] = useState<'app-icons' | null>(null);

  // Sync when dialog opens
  useEffect(() => {
    if (open) {
      const idx = WIZARD_STEPS.findIndex(s => s.id === initialTab);
      setCurrentStep(idx >= 0 ? idx : 0);
      setActiveBonusTool(null);
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

  // Fetch brands, products, and events for the Hierarchy tab
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

  const markStepComplete = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  }, []);

  const goNext = () => {
    markStepComplete(currentStep);
    setActiveBonusTool(null);
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    setActiveBonusTool(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNavigateToTab = useCallback((tab: IconStudioTab) => {
    // Check if it's a bonus tool
    if (tab === 'app-icons') {
      setActiveBonusTool(tab);
      return;
    }
    const idx = WIZARD_STEPS.findIndex(s => s.id === tab);
    if (idx >= 0) {
      setActiveBonusTool(null);
      setCurrentStep(idx);
    }
  }, []);

  const currentStepId = activeBonusTool || WIZARD_STEPS[currentStep]?.id;
  const currentStepConfig = WIZARD_STEPS[currentStep];

  const renderStepContent = () => {
    switch (currentStepId) {
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
      case 'ai-generator':
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
      
      case 'colorizer':
        return (
          <IconStudioColorizer
            brandColors={brandColors}
            libraries={libraries}
            onSaveIcons={handleSaveIcons}
          />
        );
      case 'hierarchy':
        return (
          <IconBrandHierarchy
            organizationId={organizationId}
            organizationName={organizationName}
            brands={hierarchyBrands}
            brandColors={brandColors}
            icons={libraries.flatMap(l => l.icons)}
            onExportCSS={(css) => { navigator.clipboard.writeText(css); }}
          />
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
      case 'app-icons':
        return <IconStudioAppIcons brandColors={brandColors} />;
      case 'creator':
        return (
          <IconStudioCreator
            organizationId={organizationId}
            brandColors={brandColors}
            libraries={libraries}
            onSaveIcons={handleSaveIcons}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Icon Studio
          </DialogTitle>
          <DialogDescription>
            Create, manage, and export icons — step by step
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Stepper */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <IconStudioStepper
            steps={WIZARD_STEPS}
            currentStepIndex={currentStep}
            onStepClick={(idx) => {
              setActiveBonusTool(null);
              setCurrentStep(idx);
            }}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={currentStep === 0 && !activeBonusTool}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {activeBonusTool ? 'Back to steps' : 'Back'}
            </Button>

            {/* Bonus tools */}
            {!activeBonusTool && (
              <div className="flex items-center gap-1 ml-3">
                {EXTRA_TOOLS.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground gap-1.5"
                      onClick={() => setActiveBonusTool(tool.id)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tool.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
              {activeBonusTool && ' (bonus tool)'}
            </span>
            {!activeBonusTool && currentStep < WIZARD_STEPS.length - 1 && (
              <Button size="sm" onClick={goNext}>
                {currentStep === WIZARD_STEPS.length - 2 ? 'Go to Export' : 'Next Step'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export hook for external use
export { useIconLibraries } from '@/hooks/useIconLibraries';
export type { IconLibrary } from '@/hooks/useIconLibraries';
