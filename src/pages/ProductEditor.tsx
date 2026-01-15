import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Menu, LayoutList, ScrollText, ArrowLeft, Package, Star } from 'lucide-react';
import { SectionId, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, BrandPageSettings } from '@/types/brand';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReorderableBrandSidebar } from '@/components/brand/ReorderableBrandSidebar';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { ShareButton } from '@/components/brand/ShareButton';
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
import { WebsiteSection } from '@/components/brand/WebsiteSection';
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { AtmosphereSection } from '@/components/brand/AtmosphereSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { ExportPdfButton } from '@/components/brand/ExportPdfButton';
import { BrandAuditButton } from '@/components/brand/BrandAuditButton';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'sections' | 'full';

const ProductEditor = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { getProduct, updateProduct, toggleFavorite, isLoading } = useBrands();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);

  // Scroll to top when product changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

const currentProduct = getProduct(productId || '');
  
  const sectionOrder = currentProduct?.sectionOrder || DEFAULT_SECTION_ORDER;
  const hiddenSections = currentProduct?.hiddenSections || [];
  
  // Page settings with defaults
  const pageSettings = useMemo(() => {
    return currentProduct?.pageSettings ?? DEFAULT_PAGE_SETTINGS;
  }, [currentProduct?.pageSettings]);

  const handlePageSettingsChange = useCallback((newSettings: BrandPageSettings) => {
    if (currentProduct) {
      updateProduct(productId || '', { pageSettings: newSettings });
    }
  }, [currentProduct, productId, updateProduct]);

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (productId && currentProduct) {
      updateProduct(productId, { sectionOrder: newOrder });
    }
  }, [productId, currentProduct, updateProduct]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: SectionId[]) => {
    if (productId && currentProduct) {
      updateProduct(productId, { hiddenSections: newHiddenSections });
    }
  }, [productId, currentProduct, updateProduct]);

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Product not found</h1>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  const handleUpdateProduct = (updates: Partial<typeof currentProduct>) => {
    if (productId) {
      updateProduct(productId, updates);
    }
  };

  const handleSectionChange = (section: SectionId) => {
    setActiveSection(section);
    if (viewMode === 'full') {
      setScrollToSection(section);
      setTimeout(() => setScrollToSection(null), 100);
    }
  };

  const handleSectionVisible = useCallback((section: SectionId) => {
    if (viewMode === 'full') {
      setActiveSection(section);
    }
  }, [viewMode]);

  const renderSection = () => {
    switch (activeSection) {
      case 'hero': return <HeroSection hero={currentProduct.hero} onHeroChange={(hero) => handleUpdateProduct({ hero })} />;
      case 'identity': return <IdentitySection identity={currentProduct.identity} onIdentityChange={(identity) => handleUpdateProduct({ identity })} />;
      case 'values': return <ValuesSection values={currentProduct.values} onValuesChange={(values) => handleUpdateProduct({ values })} />;
      case 'logos': return <LogoSection logos={currentProduct.logos} onLogosChange={(logos) => handleUpdateProduct({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={currentProduct.brandIcons} onBrandIconsChange={(brandIcons) => handleUpdateProduct({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={currentProduct.colors} onColorsChange={(colors) => handleUpdateProduct({ colors })} colorCombinations={currentProduct.colorCombinations} onColorCombinationsChange={(colorCombinations) => handleUpdateProduct({ colorCombinations })} />;
      case 'gradients': return <GradientsSection gradients={currentProduct.gradients} onGradientsChange={(gradients) => handleUpdateProduct({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={currentProduct.patterns} onPatternsChange={(patterns) => handleUpdateProduct({ patterns })} />;
      case 'typography': return <TypographySection typography={currentProduct.typography} onTypographyChange={(typography) => handleUpdateProduct({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={currentProduct.textStyles} onTextStylesChange={(textStyles) => handleUpdateProduct({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={currentProduct.iconography} onIconographyChange={(iconography) => handleUpdateProduct({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={currentProduct.socialIcons} onSocialIconsChange={(socialIcons) => handleUpdateProduct({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={currentProduct.imagery} onImageryChange={(imagery) => handleUpdateProduct({ imagery })} />;
      case 'social': return <SocialSection social={currentProduct.social} onSocialChange={(social) => handleUpdateProduct({ social })} />;
      case 'website': return <WebsiteSection websites={currentProduct.websites} onWebsitesChange={(websites) => handleUpdateProduct({ websites })} />;
      case 'signatures': return <SignaturesSection signatures={currentProduct.signatures} onSignaturesChange={(signatures) => handleUpdateProduct({ signatures })} />;
      case 'qr': return <QRSection qr={currentProduct.qr} onQRChange={(qr) => handleUpdateProduct({ qr })} />;
      case 'assets': return <AssetsSection assets={currentProduct.assets} onAssetsChange={(assets) => handleUpdateProduct({ assets })} />;
      case 'misuse': return <MisuseSection misuse={currentProduct.misuse} onMisuseChange={(misuse) => handleUpdateProduct({ misuse })} />;
      case 'atmosphere': return <AtmosphereSection atmosphere={currentProduct.atmosphere} onAtmosphereChange={(atmosphere) => handleUpdateProduct({ atmosphere })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={currentProduct.caseStudies} onCaseStudiesChange={(caseStudies) => handleUpdateProduct({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={currentProduct.brochures} onBrochuresChange={(brochures) => handleUpdateProduct({ brochures })} />;
      case 'templates': return <TemplatesSection templates={currentProduct.templates} onTemplatesChange={(templates) => handleUpdateProduct({ templates })} />;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block sticky top-0 h-screen">
          <ReorderableBrandSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            brandName={currentProduct.hero.name}
            sectionOrder={sectionOrder}
            onSectionOrderChange={handleSectionOrderChange}
            hiddenSections={hiddenSections}
            onHiddenSectionsChange={handleHiddenSectionsChange}
            isAdmin={isAdmin}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <ReorderableBrandSidebar 
              activeSection={activeSection} 
              onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} 
              brandName={currentProduct.hero.name}
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isAdmin}
            />
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
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-serif font-semibold text-foreground hidden sm:inline">BrandHub</span>
                </div>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    Product
                  </Badge>
                  <span className="font-medium text-foreground">{currentProduct.hero.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleFavorite(currentProduct.id, 'product')}
                      className={currentProduct.isFavorite ? 'text-yellow-500' : ''}
                    >
                      <Star className={`h-5 w-5 ${currentProduct.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{currentProduct.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                </Tooltip>
                <ShareButton 
                  guideId={currentProduct.id} 
                  guideName={currentProduct.hero.name} 
                  type="product"
                  isPublic={currentProduct.isPublic}
                  onPublicChange={(isPublic) => handleUpdateProduct({ isPublic })}
                  canEdit={!!user && isAdmin}
                />
                <BrandAuditButton brand={currentProduct} />
                {!!user && (
                  <BrandPageSettingsEditor 
                    settings={pageSettings} 
                    onSettingsChange={handlePageSettingsChange}
                  />
                )}
                <ExportPdfButton guide={currentProduct} />
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
                  Saved {currentProduct.updatedAt.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-5xl mx-auto animate-fade-in">
              {viewMode === 'sections' ? (
                renderSection()
              ) : (
                <FullBrandPage 
                  brand={currentProduct}
                  brandId={productId || ''}
                  onBrandUpdate={handleUpdateProduct}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  isAdmin={isAdmin}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ProductEditor;
