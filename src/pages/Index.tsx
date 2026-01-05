import { useState } from 'react';
import { Palette, Type, Image, Eye, Sparkles } from 'lucide-react';
import { BrandGuide, BrandColor, BrandTypography, BrandLogo } from '@/types/brand';
import { BrandHeader } from '@/components/brand/BrandHeader';
import { ColorPaletteSection } from '@/components/brand/ColorPaletteSection';
import { TypographySection } from '@/components/brand/TypographySection';
import { LogoSection } from '@/components/brand/LogoSection';
import { BrandPreview } from '@/components/brand/BrandPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const defaultColors: BrandColor[] = [
  { id: '1', name: 'Primary', hex: '#1a1a2e', usage: 'Main brand color' },
  { id: '2', name: 'Secondary', hex: '#e94560', usage: 'Accent and CTAs' },
  { id: '3', name: 'Background', hex: '#f8f7f4', usage: 'Light backgrounds' },
  { id: '4', name: 'Text', hex: '#16213e', usage: 'Body text' },
];

const defaultTypography: BrandTypography[] = [
  { id: '1', name: 'Heading', fontFamily: 'Fraunces, serif', weight: '600', usage: 'Headlines and titles' },
  { id: '2', name: 'Body', fontFamily: 'DM Sans, sans-serif', weight: '400', usage: 'Body text and paragraphs' },
];

const Index = () => {
  const [brand, setBrand] = useState<BrandGuide>({
    id: crypto.randomUUID(),
    name: 'My Brand',
    description: 'A comprehensive guide to our visual identity and brand standards.',
    colors: defaultColors,
    typography: defaultTypography,
    logos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const updateBrand = (updates: Partial<BrandGuide>) => {
    setBrand(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <span className="text-lg font-serif font-semibold text-foreground">BrandForge</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Last saved: {brand.updatedAt.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrandHeader
          name={brand.name}
          description={brand.description}
          onNameChange={(name) => updateBrand({ name })}
          onDescriptionChange={(description) => updateBrand({ description })}
        />

        <div className="mt-8">
          <Tabs defaultValue="colors" className="space-y-8">
            <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="colors" className="gap-2 data-[state=active]:bg-background">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Colors</span>
              </TabsTrigger>
              <TabsTrigger value="typography" className="gap-2 data-[state=active]:bg-background">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Typography</span>
              </TabsTrigger>
              <TabsTrigger value="logos" className="gap-2 data-[state=active]:bg-background">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Logos</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 data-[state=active]:bg-background">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="animate-fade-in">
              <ColorPaletteSection
                colors={brand.colors}
                onColorsChange={(colors) => updateBrand({ colors })}
              />
            </TabsContent>

            <TabsContent value="typography" className="animate-fade-in">
              <TypographySection
                typography={brand.typography}
                onTypographyChange={(typography) => updateBrand({ typography })}
              />
            </TabsContent>

            <TabsContent value="logos" className="animate-fade-in">
              <LogoSection
                logos={brand.logos}
                onLogosChange={(logos) => updateBrand({ logos })}
              />
            </TabsContent>

            <TabsContent value="preview" className="animate-fade-in">
              <BrandPreview brand={brand} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Create and export beautiful brand guidelines
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
