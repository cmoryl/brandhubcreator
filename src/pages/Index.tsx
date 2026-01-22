import { useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { BrandGuide, SectionId } from '@/types/brand';
import { BrandSidebar } from '@/components/brand/BrandSidebar';
import { BrandSelector } from '@/components/brand/BrandSelector';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
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
import { VideosSection } from '@/components/brand/VideosSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';

const createDefaultBrand = (name: string = 'My Brand'): BrandGuide => ({
  id: crypto.randomUUID(),
  type: 'brand',
  hero: { name, tagline: 'Crafting exceptional experiences', coverImage: '', logoUrl: '' },
  tagline: { primary: '', secondary: '', variations: [] },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  logos: [],
  brandIcons: [],
  colors: [
    { id: '1', name: 'Primary', hex: '#1a1a2e', usage: 'Main brand color' },
    { id: '2', name: 'Secondary', hex: '#e94560', usage: 'Accent and CTAs' },
    { id: '3', name: 'Background', hex: '#f8f7f4', usage: 'Light backgrounds' },
  ],
  colorCombinations: [],
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
  websites: [],
  signatures: [],
  qr: { defaultUrl: 'https://yourbrand.com', fgColor: '#1a1a2e', bgColor: '#ffffff' },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  caseStudies: [],
  brochures: [],
  templates: [],
  services: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

type ViewMode = 'sections' | 'full';

const Index = () => {
  const { resolvedTheme } = useTheme();
  const [brands, setBrands] = useState<BrandGuide[]>([createDefaultBrand()]);
  const [currentBrandId, setCurrentBrandId] = useState<string>(brands[0].id);
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('sections');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);

  const currentBrand = brands.find(b => b.id === currentBrandId) || brands[0];

  const updateBrand = (updates: Partial<BrandGuide>) => {
    setBrands(prev => prev.map(brand => 
      brand.id === currentBrandId 
        ? { ...brand, ...updates, updatedAt: new Date() }
        : brand
    ));
  };

  const handleBrandCreate = (name: string) => {
    const newBrand = createDefaultBrand(name);
    setBrands(prev => [...prev, newBrand]);
    setCurrentBrandId(newBrand.id);
    setActiveSection('hero');
  };

  const handleBrandDelete = (brandId: string) => {
    if (brands.length <= 1) return;
    
    setBrands(prev => prev.filter(b => b.id !== brandId));
    if (currentBrandId === brandId) {
      const remainingBrands = brands.filter(b => b.id !== brandId);
      setCurrentBrandId(remainingBrands[0].id);
    }
  };

  const handleBrandSelect = (brandId: string) => {
    setCurrentBrandId(brandId);
    setActiveSection('hero');
  };

  const handleSectionChange = useCallback((section: SectionId) => {
    setActiveSection(section);
    if (viewMode === 'full') {
      setScrollToSection(section);
      // Reset after triggering scroll
      setTimeout(() => setScrollToSection(null), 100);
    }
  }, [viewMode]);

  const handleSectionVisible = useCallback((section: SectionId) => {
    if (viewMode === 'full') {
      setActiveSection(section);
    }
  }, [viewMode]);

  const renderSection = () => {
    switch (activeSection) {
      case 'hero': return <HeroSection hero={currentBrand.hero} onHeroChange={(hero) => updateBrand({ hero })} />;
      case 'tagline': return <TaglineSection tagline={currentBrand.tagline} onTaglineChange={(tagline) => updateBrand({ tagline })} />;
      case 'identity': return <IdentitySection identity={currentBrand.identity} onIdentityChange={(identity) => updateBrand({ identity })} />;
      case 'values': return <ValuesSection values={currentBrand.values} onValuesChange={(values) => updateBrand({ values })} />;
      case 'logos': return <LogoSection logos={currentBrand.logos} onLogosChange={(logos) => updateBrand({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={currentBrand.brandIcons} onBrandIconsChange={(brandIcons) => updateBrand({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={currentBrand.colors} onColorsChange={(colors) => updateBrand({ colors })} colorCombinations={currentBrand.colorCombinations} onColorCombinationsChange={(colorCombinations) => updateBrand({ colorCombinations })} />;
      case 'gradients': return <GradientsSection gradients={currentBrand.gradients} onGradientsChange={(gradients) => updateBrand({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={currentBrand.patterns} onPatternsChange={(patterns) => updateBrand({ patterns })} />;
      case 'typography': return <TypographySection typography={currentBrand.typography} onTypographyChange={(typography) => updateBrand({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={currentBrand.textStyles} onTextStylesChange={(textStyles) => updateBrand({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={currentBrand.iconography} onIconographyChange={(iconography) => updateBrand({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={currentBrand.socialIcons} onSocialIconsChange={(socialIcons) => updateBrand({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={currentBrand.imagery} onImageryChange={(imagery) => updateBrand({ imagery })} />;
      case 'social': return <SocialSection social={currentBrand.social} onSocialChange={(social) => updateBrand({ social })} />;
      case 'signatures': return <SignaturesSection signatures={currentBrand.signatures} onSignaturesChange={(signatures) => updateBrand({ signatures })} />;
      case 'qr': return <QRSection qr={currentBrand.qr} onQRChange={(qr) => updateBrand({ qr })} />;
      case 'videos': return <VideosSection videos={currentBrand.videos} onVideosChange={(videos) => updateBrand({ videos })} />;
      case 'assets': return <AssetsSection assets={currentBrand.assets} onAssetsChange={(assets) => updateBrand({ assets })} />;
      case 'misuse': return <MisuseSection misuse={currentBrand.misuse} onMisuseChange={(misuse) => updateBrand({ misuse })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={currentBrand.caseStudies} onCaseStudiesChange={(caseStudies) => updateBrand({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={currentBrand.brochures} onBrochuresChange={(brochures) => updateBrand({ brochures })} />;
      case 'templates': return <TemplatesSection templates={currentBrand.templates} onTemplatesChange={(templates) => updateBrand({ templates })} />;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <BrandSidebar activeSection={activeSection} onSectionChange={handleSectionChange} brandName={currentBrand.hero.name} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <BrandSidebar activeSection={activeSection} onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} brandName={currentBrand.hero.name} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border animate-fade-in-down">
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
                  <img 
                    src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
                    alt="TransPerfect" 
                    className="h-6 w-auto"
                  />
                  <span className="font-serif font-semibold text-foreground hidden sm:inline">BrandHub</span>
                </div>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <BrandSelector
                  brands={brands}
                  currentBrandId={currentBrandId}
                  onBrandSelect={handleBrandSelect}
                  onBrandCreate={handleBrandCreate}
                  onBrandDelete={handleBrandDelete}
                />
              </div>
              <div className="flex items-center gap-4">
                <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="bg-muted rounded-lg p-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="sections" aria-label="Section view" className="h-8 w-8 data-[state=on]:bg-background">
                        <LayoutList className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Section View</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="full" aria-label="Full page view" className="h-8 w-8 data-[state=on]:bg-background">
                        <ScrollText className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Full Page View</TooltipContent>
                  </Tooltip>
                </ToggleGroup>
                <ThemeToggle />
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Saved {currentBrand.updatedAt.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-5xl mx-auto animate-fade-in-up">
              {viewMode === 'sections' ? (
                <div className="animate-zoom-in">{renderSection()}</div>
              ) : (
                <FullBrandPage 
                  brand={currentBrand}
                  brandId={currentBrand.id}
                  onBrandUpdate={updateBrand}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
