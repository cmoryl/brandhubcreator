import { useState } from 'react';
import { Sparkles, Menu } from 'lucide-react';
import { BrandGuide, SectionId } from '@/types/brand';
import { BrandSidebar } from '@/components/brand/BrandSidebar';
import { HeroSection } from '@/components/brand/HeroSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { LogoSection } from '@/components/brand/LogoSection';
import { BrandIconsSection } from '@/components/brand/BrandIconsSection';
import { ColorPaletteSection } from '@/components/brand/ColorPaletteSection';
import { GradientsSection } from '@/components/brand/GradientsSection';
import { PatternsSection } from '@/components/brand/PatternsSection';
import { TypographySection } from '@/components/brand/TypographySection';
import { TextStylesSection } from '@/components/brand/TextStylesSection';
import { IconographySection } from '@/components/brand/IconographySection';
import { SocialIconsSection } from '@/components/brand/SocialIconsSection';
import { ImagerySection } from '@/components/brand/ImagerySection';
import { SocialSection } from '@/components/brand/SocialSection';
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { AtmosphereSection } from '@/components/brand/AtmosphereSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const defaultBrand: BrandGuide = {
  id: crypto.randomUUID(),
  hero: { name: 'My Brand', tagline: 'Crafting exceptional experiences', coverImage: '', logoUrl: '' },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  logos: [],
  brandIcons: [],
  colors: [
    { id: '1', name: 'Primary', hex: '#1a1a2e', usage: 'Main brand color' },
    { id: '2', name: 'Secondary', hex: '#e94560', usage: 'Accent and CTAs' },
    { id: '3', name: 'Background', hex: '#f8f7f4', usage: 'Light backgrounds' },
  ],
  gradients: [],
  patterns: [],
  typography: [
    { id: '1', name: 'Heading', fontFamily: 'Fraunces, serif', weight: '600', usage: 'Headlines and titles' },
    { id: '2', name: 'Body', fontFamily: 'DM Sans, sans-serif', weight: '400', usage: 'Body text' },
  ],
  textStyles: [],
  iconography: [],
  socialIcons: [],
  imagery: [],
  social: [],
  signatures: [],
  qr: { defaultUrl: 'https://yourbrand.com', fgColor: '#1a1a2e', bgColor: '#ffffff' },
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  caseStudies: [],
  brochures: [],
  templates: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const Index = () => {
  const [brand, setBrand] = useState<BrandGuide>(defaultBrand);
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateBrand = (updates: Partial<BrandGuide>) => {
    setBrand(prev => ({ ...prev, ...updates, updatedAt: new Date() }));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={(hero) => updateBrand({ hero })} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={(identity) => updateBrand({ identity })} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={(values) => updateBrand({ values })} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={(logos) => updateBrand({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={(brandIcons) => updateBrand({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => updateBrand({ colors })} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={(gradients) => updateBrand({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={(patterns) => updateBrand({ patterns })} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={(typography) => updateBrand({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={(textStyles) => updateBrand({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={(iconography) => updateBrand({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={(socialIcons) => updateBrand({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={(imagery) => updateBrand({ imagery })} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={(social) => updateBrand({ social })} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={(signatures) => updateBrand({ signatures })} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={(qr) => updateBrand({ qr })} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={(assets) => updateBrand({ assets })} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => updateBrand({ misuse })} />;
      case 'atmosphere': return <AtmosphereSection atmosphere={brand.atmosphere} onAtmosphereChange={(atmosphere) => updateBrand({ atmosphere })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => updateBrand({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => updateBrand({ brochures })} />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => updateBrand({ templates })} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <BrandSidebar activeSection={activeSection} onSectionChange={setActiveSection} brandName={brand.hero.name} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <BrandSidebar activeSection={activeSection} onSectionChange={(section) => { setActiveSection(section); setSidebarOpen(false); }} brandName={brand.hero.name} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <span className="font-serif font-semibold text-foreground">BrandForge</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Saved {brand.updatedAt.toLocaleTimeString()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto animate-fade-in">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
