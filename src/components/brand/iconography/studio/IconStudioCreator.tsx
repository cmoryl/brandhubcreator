/**
 * IconStudioCreator - Unified icon creation hub
 * 
 * 4 tabs: Lucide Icons | Custom SVG | Upload & Convert | AI Suggestions
 * Features: drag-and-drop, batch import, brand color preview, AI recommendations
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Code, ImageIcon, Sparkles, Globe } from 'lucide-react';
import { BrandIconography } from '@/types/brand';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { LucideIconPicker } from './creator/LucideIconPicker';
import { CustomSvgImporter } from './creator/CustomSvgImporter';
import { AiIconSuggestions } from './creator/AiIconSuggestions';
import { IconStylizer } from './IconStylizer';
import { IconBrowser } from './IconBrowser';

interface IconStudioCreatorProps {
  organizationId: string;
  brandColors: Array<{ hex: string; name: string }>;
  libraries: IconLibrary[];
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

export const IconStudioCreator = ({
  organizationId,
  brandColors,
  libraries,
  onSaveIcons,
}: IconStudioCreatorProps) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedLibraryId, setSelectedLibraryId] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Icon Creator</h3>
        <p className="text-sm text-muted-foreground">
          Add icons from Lucide, upload SVGs, convert images, or get AI recommendations
        </p>
      </div>

      {/* Target Library */}
      {libraries.length > 0 && (
        <div className="space-y-2">
          <Label>Save to Library</Label>
          <Select value={selectedLibraryId || 'auto'} onValueChange={(v) => setSelectedLibraryId(v === 'auto' ? '' : v)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select target library..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (first Core library)</SelectItem>
              {libraries.filter(l => l.is_active).map((lib) => (
                <SelectItem key={lib.id} value={lib.id}>
                  {lib.name} ({lib.icons.length} icons)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="browse" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" />
            Browse 50K+
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs">
            <Library className="h-3.5 w-3.5" />
            Lucide
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5 text-xs">
            <Code className="h-3.5 w-3.5" />
            Custom SVG
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <ImageIcon className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="ai-suggest" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            AI Suggest
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <IconBrowser
            brandColors={brandColors}
            onAddIcon={(icon) => {
              onSaveIcons([icon], selectedLibraryId || undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <LucideIconPicker
            brandColors={brandColors}
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <CustomSvgImporter
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <IconStylizer
            brandColors={brandColors.map(c => c.hex)}
            onIconCreated={(icon) => {
              onSaveIcons([icon], selectedLibraryId || undefined);
            }}
          />
        </TabsContent>

        <TabsContent value="ai-suggest" className="space-y-4">
          <AiIconSuggestions
            organizationId={organizationId}
            brandColors={brandColors}
            selectedLibraryId={selectedLibraryId}
            onSaveIcons={onSaveIcons}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
