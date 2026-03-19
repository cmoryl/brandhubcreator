/**
 * Creative Studio Section
 * Main entry point for brand imagery generation and management
 */

import { useState } from 'react';
import { Sparkles, Image, BookOpen, Code, History, Wand2, Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ImageGenerator } from './ImageGenerator';
import { PromptLibrary } from './PromptLibrary';
import { DesignTokensExport } from './DesignTokensExport';
import { GeneratedAssetsGallery } from './GeneratedAssetsGallery';
import { CanvaTemplateGallery } from './CanvaTemplateGallery';
import { useCreativeStudio } from '@/hooks/useCreativeStudio';
import { BrandBrochure } from '@/types/brand';

interface CreativeStudioSectionProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string | null;
  guideData: Record<string, unknown>;
  brochures?: BrandBrochure[];
  isEditing?: boolean;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const CreativeStudioSection = ({
  entityId,
  entityType,
  entityName,
  organizationId,
  guideData,
  isEditing = false,
  customSubtitle,
  onSubtitleChange
}: CreativeStudioSectionProps) => {
  const [activeTab, setActiveTab] = useState('generate');
  
  const {
    prompts,
    generatedAssets,
    isLoadingPrompts,
    isLoadingAssets,
    isGenerating,
    generateImage,
    savePrompt,
    deletePrompt,
    rateAsset,
    approveAsset,
    deleteAsset,
    refreshAssets
  } = useCreativeStudio({
    entityId,
    entityType,
    organizationId
  });

  const defaultSubtitle = "Generate on-brand imagery, manage prompts, and export design tokens";

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Creative Studio</h2>
          <p className="text-sm text-muted-foreground">{customSubtitle || defaultSubtitle}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-12 bg-transparent gap-2">
              <TabsTrigger value="generate" className="gap-2 data-[state=active]:bg-primary/10">
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2 data-[state=active]:bg-primary/10">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Prompts</span>
                {prompts.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {prompts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary/10">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                {generatedAssets.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {generatedAssets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tokens" className="gap-2 data-[state=active]:bg-primary/10">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 md:p-6">
            <TabsContent value="generate" className="mt-0">
              <ImageGenerator
                entityName={entityName}
                guideData={guideData}
                prompts={prompts}
                isGenerating={isGenerating}
                onGenerate={generateImage}
                onSavePrompt={savePrompt}
              />
            </TabsContent>

            <TabsContent value="library" className="mt-0">
              <PromptLibrary
                prompts={prompts}
                isLoading={isLoadingPrompts}
                onUsePrompt={(prompt) => {
                  setActiveTab('generate');
                  // The prompt will be used in the generator
                }}
                onDeletePrompt={deletePrompt}
                onSavePrompt={savePrompt}
                entityName={entityName}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <GeneratedAssetsGallery
                assets={generatedAssets}
                isLoading={isLoadingAssets}
                onRate={rateAsset}
                onApprove={approveAsset}
                onDelete={deleteAsset}
                onRefresh={refreshAssets}
              />
            </TabsContent>

            <TabsContent value="tokens" className="mt-0">
              <DesignTokensExport
                entityName={entityName}
                guideData={guideData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
};
