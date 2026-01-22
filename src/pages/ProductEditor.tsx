import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText, ArrowLeft, Package, Star, Brain } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { SectionId, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, BrandPageSettings, ProductGuide } from '@/types/brand';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { ReorderableBrandSidebar } from '@/components/brand/ReorderableBrandSidebar';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { ShareButton } from '@/components/brand/ShareButton';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { ServicesSection } from '@/components/brand/ServicesSection';
import { VideosSection } from '@/components/brand/VideosSection';
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
import { SocialAssetsSection } from '@/components/brand/SocialAssetsSection';
import { WebsiteSection } from '@/components/brand/WebsiteSection';
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { ProductsSection } from '@/components/brand/ProductsSection';
import { ExportPdfButton } from '@/components/brand/ExportPdfButton';
import { BrandAuditButton } from '@/components/brand/BrandAuditButton';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { BrandIntelligencePanel } from '@/components/brand/BrandIntelligencePanel';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { normalizeHiddenSections, normalizeSectionOrder } from '@/lib/sectionOrder';

type ViewMode = 'sections' | 'full';

const ProductEditor = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getProduct, getProductBySlug, updateProduct, toggleFavorite, isLoading } = useBrands();
  const { user, isAdmin, isApproved, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization } = useOrganization();

  // Treat organization owners/admins as "admins" within the guide as well.
  // Otherwise they are treated as viewers and hiddenSections can hide key areas (e.g., Social sections).
  const isGuideAdmin = Boolean(isAdmin || (orgRole && ['owner', 'admin'].includes(orgRole)));
  
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);

  // Public product fallback (for logged-out users / public URLs)
  const [publicProduct, setPublicProduct] = useState<ProductGuide | null>(null);
  const [publicProductLoading, setPublicProductLoading] = useState(false);

  // Redirect unapproved users to pending approval page (admins are always allowed)
  React.useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Scroll to top when product changes
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [productSlug]);

  // Helper to check if the param is a UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Try to get product from context by ID (for UUID) or by slug
  const contextProduct = React.useMemo(() => {
    if (!productSlug) return undefined;
    // First try as UUID for backwards compatibility
    if (isUUID(productSlug)) {
      return getProduct(productSlug);
    }
    // Try by slug
    return getProductBySlug ? getProductBySlug(productSlug) : undefined;
  }, [productSlug, getProduct, getProductBySlug]);

  // Fetch public product directly if not in context
  React.useEffect(() => {
    const fetchPublicProduct = async () => {
      if (!productSlug || contextProduct || authLoading || isLoading) return;

      setPublicProductLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_public', true);

        if (isUUID(productSlug)) {
          query = query.eq('id', productSlug);
        } else {
          query = query.eq('slug', productSlug);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (data) {
          const asArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
            Array.isArray(value) ? (value as T[]) : fallback;

          const asObject = <T extends object>(value: unknown, fallback: T): T =>
            value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

          const guideData = asObject<Record<string, unknown>>(data.guide_data, {});

          const product: ProductGuide = {
            id: data.id,
            type: 'product',
            slug: data.slug,
            organizationId: data.organization_id,
            parentBrandId: data.parent_brand_id ?? undefined,
            isFavorite: data.is_favorite ?? false,
            isPublic: data.is_public ?? false,
            sectionOrder: (Array.isArray(data.section_order) ? (data.section_order as SectionId[]) : DEFAULT_SECTION_ORDER),
            hiddenSections: (Array.isArray(data.hidden_sections) ? (data.hidden_sections as SectionId[]) : []),
            hero: asObject(guideData.hero, { name: data.name, tagline: '', coverImage: '', logoUrl: '' }) as ProductGuide['hero'],
            tagline: asObject(guideData.tagline, { primary: '', secondary: '', variations: [] }) as ProductGuide['tagline'],
            identity: asObject(guideData.identity, { missionStatement: '', archetype: '', toneOfVoice: [] }) as ProductGuide['identity'],
            values: asArray(guideData.values, []) as ProductGuide['values'],
            logos: asArray(guideData.logos, []) as ProductGuide['logos'],
            brandIcons: asArray(guideData.brandIcons, []) as ProductGuide['brandIcons'],
            colors: asArray(guideData.colors, []) as ProductGuide['colors'],
            colorCombinations: asArray(guideData.colorCombinations, []) as ProductGuide['colorCombinations'],
            gradients: asArray(guideData.gradients, []) as ProductGuide['gradients'],
            patterns: asArray(guideData.patterns, []) as ProductGuide['patterns'],
            typography: asArray(guideData.typography, []) as ProductGuide['typography'],
            textStyles: asArray(guideData.textStyles, []) as ProductGuide['textStyles'],
            iconography: asArray(guideData.iconography, []) as ProductGuide['iconography'],
            socialIcons: asArray(guideData.socialIcons, []) as ProductGuide['socialIcons'],
            imagery: asArray(guideData.imagery, []) as ProductGuide['imagery'],
            social: asArray(guideData.social, []) as ProductGuide['social'],
            socialAssets: asArray(guideData.socialAssets, []) as ProductGuide['socialAssets'],
            displayBanners: asArray(guideData.displayBanners, []) as ProductGuide['displayBanners'],
            websites: asArray(guideData.websites, []) as ProductGuide['websites'],
            signatures: asArray(guideData.signatures, []) as ProductGuide['signatures'],
            emailBanners: asArray(guideData.emailBanners, []) as ProductGuide['emailBanners'],
            qr: asObject(guideData.qr, { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' }) as ProductGuide['qr'],
            videos: asArray(guideData.videos, []) as ProductGuide['videos'],
            assets: asArray(guideData.assets, []) as ProductGuide['assets'],
            misuse: asArray(guideData.misuse, []) as ProductGuide['misuse'],
            atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as ProductGuide['atmosphere'],
            caseStudies: asArray(guideData.caseStudies, []) as ProductGuide['caseStudies'],
            brochures: asArray(guideData.brochures, []) as ProductGuide['brochures'],
            templates: asArray(guideData.templates, []) as ProductGuide['templates'],
            services: asArray(guideData.services, []) as ProductGuide['services'],
            linkedGuides: asArray(guideData.linkedGuides, []) as ProductGuide['linkedGuides'],
            sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as ProductGuide['sectionSubtitles'],
            pageSettings: asObject(guideData.pageSettings, DEFAULT_PAGE_SETTINGS) as ProductGuide['pageSettings'],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          setPublicProduct(product);
        }
      } catch (err) {
        console.error('Error fetching public product:', err);
      } finally {
        setPublicProductLoading(false);
      }
    };

    fetchPublicProduct();
  }, [productSlug, contextProduct, authLoading, isLoading]);

  // Use context product if available, otherwise use fetched public product
  const currentProduct = contextProduct || publicProduct;
  
  // Forward-compat: older products may have persisted sectionOrder without newly-added sections (e.g., socialassets)
  const sectionOrder = useMemo(
    () => normalizeSectionOrder(currentProduct?.sectionOrder),
    [currentProduct?.sectionOrder]
  );
  const hiddenSections = useMemo(
    () => normalizeHiddenSections(currentProduct?.hiddenSections, sectionOrder),
    [currentProduct?.hiddenSections, sectionOrder]
  );
  
  // Page settings with defaults
  const pageSettings = useMemo(() => {
    return currentProduct?.pageSettings ?? DEFAULT_PAGE_SETTINGS;
  }, [currentProduct?.pageSettings]);

  const handlePageSettingsChange = useCallback((newSettings: BrandPageSettings) => {
    if (currentProduct) {
      updateProduct(currentProduct.id, { pageSettings: newSettings });
    }
  }, [currentProduct, updateProduct]);

  // Get content width class based on settings
  const getContentWidthClass = () => {
    switch (pageSettings.contentWidth) {
      case 'wide': return 'max-w-6xl';
      case 'full': return 'max-w-full px-4';
      default: return 'max-w-5xl';
    }
  };

  // Get section spacing class based on settings
  const getSectionSpacingClass = () => {
    switch (pageSettings.sectionSpacing) {
      case 'compact': return 'space-y-4';
      case 'spacious': return 'space-y-16';
      default: return 'space-y-8';
    }
  };

  // Get header style classes
  const getHeaderClasses = () => {
    const base = 'sticky top-0 z-40 animate-fade-in-down';
    switch (pageSettings.headerStyle) {
      case 'minimal': return `${base} bg-background border-b border-border`;
      case 'transparent': return `${base} bg-transparent`;
      default: return `${base} bg-background/80 backdrop-blur-lg border-b border-border`;
    }
  };

  // Show loading state
  // Always use enhanced loading screen with organization context when available
  if (authLoading || isLoading || publicProductLoading) {
    return (
      <PublicLoadingScreen 
        type="product" 
        name={currentProduct?.hero?.name}
        organizationName={organization?.name}
      />
    );
  }

  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (currentProduct) {
      updateProduct(currentProduct.id, { sectionOrder: newOrder });
    }
  }, [currentProduct, updateProduct]);

  // Auto-heal persisted sectionOrder when new sections are introduced
  React.useEffect(() => {
    if (!currentProduct || !isGuideAdmin) return;
    const current = Array.isArray(currentProduct.sectionOrder) ? currentProduct.sectionOrder : [];
    const normalized = normalizeSectionOrder(current);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      updateProduct(currentProduct.id, { sectionOrder: normalized });
    }
  }, [currentProduct?.id, currentProduct?.sectionOrder, isGuideAdmin, updateProduct]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: SectionId[]) => {
    if (currentProduct) {
      updateProduct(currentProduct.id, { hiddenSections: newHiddenSections });
    }
  }, [currentProduct, updateProduct]);

  // Auto-heal invalid hidden sections
  React.useEffect(() => {
    if (!currentProduct || !isGuideAdmin) return;
    const current = Array.isArray(currentProduct.hiddenSections) ? currentProduct.hiddenSections : [];
    const normalized = normalizeHiddenSections(current, sectionOrder);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      updateProduct(currentProduct.id, { hiddenSections: normalized });
    }
  }, [currentProduct?.id, currentProduct?.hiddenSections, sectionOrder, isGuideAdmin, updateProduct]);

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
    if (currentProduct) {
      updateProduct(currentProduct.id, updates);
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
      case 'hero': return <HeroSection hero={currentProduct.hero} onHeroChange={(hero) => handleUpdateProduct({ hero })} onOpenIntelligence={() => setIntelligenceOpen(true)} />;
      case 'tagline': return <TaglineSection tagline={currentProduct.tagline} onTaglineChange={(tagline) => handleUpdateProduct({ tagline })} />;
      case 'identity': return <IdentitySection identity={currentProduct.identity} onIdentityChange={(identity) => handleUpdateProduct({ identity })} />;
      case 'values': return <ValuesSection values={currentProduct.values} onValuesChange={(values) => handleUpdateProduct({ values })} />;
      case 'services': return <ServicesSection services={currentProduct.services || []} onServicesChange={(services) => handleUpdateProduct({ services })} />;
      case 'logos': return <LogoSection logos={currentProduct.logos} onLogosChange={(logos) => handleUpdateProduct({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={currentProduct.brandIcons} onBrandIconsChange={(brandIcons) => handleUpdateProduct({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={currentProduct.colors} onColorsChange={(colors) => handleUpdateProduct({ colors })} colorCombinations={currentProduct.colorCombinations} onColorCombinationsChange={(colorCombinations) => handleUpdateProduct({ colorCombinations })} brandName={currentProduct.hero.name} />;
      case 'gradients': return <GradientsSection gradients={currentProduct.gradients} onGradientsChange={(gradients) => handleUpdateProduct({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={currentProduct.patterns} onPatternsChange={(patterns) => handleUpdateProduct({ patterns })} />;
      case 'typography': return <TypographySection typography={currentProduct.typography} onTypographyChange={(typography) => handleUpdateProduct({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={currentProduct.textStyles} onTextStylesChange={(textStyles) => handleUpdateProduct({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={currentProduct.iconography} onIconographyChange={(iconography) => handleUpdateProduct({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={currentProduct.socialIcons} onSocialIconsChange={(socialIcons) => handleUpdateProduct({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={currentProduct.imagery} onImageryChange={(imagery) => handleUpdateProduct({ imagery })} />;
      case 'social': return <SocialSection social={currentProduct.social} onSocialChange={(social) => handleUpdateProduct({ social })} />;
      case 'socialassets':
        return (
          <SocialAssetsSection
            socialAssets={currentProduct.socialAssets || []}
            onSocialAssetsChange={(socialAssets) => handleUpdateProduct({ socialAssets })}
            displayBanners={currentProduct.displayBanners || []}
            onDisplayBannersChange={(displayBanners) => handleUpdateProduct({ displayBanners })}
          />
        );
      case 'website': return <WebsiteSection websites={currentProduct.websites} onWebsitesChange={(websites) => handleUpdateProduct({ websites })} />;
      case 'signatures': return <SignaturesSection signatures={currentProduct.signatures} onSignaturesChange={(signatures) => handleUpdateProduct({ signatures })} />;
      case 'qr': return <QRSection qr={currentProduct.qr} onQRChange={(qr) => handleUpdateProduct({ qr })} />;
      case 'videos': return <VideosSection videos={currentProduct.videos} onVideosChange={(videos) => handleUpdateProduct({ videos })} />;
      case 'assets': return <AssetsSection assets={currentProduct.assets} onAssetsChange={(assets) => handleUpdateProduct({ assets })} />;
      case 'misuse': return <MisuseSection misuse={currentProduct.misuse} onMisuseChange={(misuse) => handleUpdateProduct({ misuse })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={currentProduct.caseStudies} onCaseStudiesChange={(caseStudies) => handleUpdateProduct({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={currentProduct.brochures} onBrochuresChange={(brochures) => handleUpdateProduct({ brochures })} />;
      case 'templates': return <TemplatesSection templates={currentProduct.templates} onTemplatesChange={(templates) => handleUpdateProduct({ templates })} />;
      case 'products': return <ProductsSection productId={currentProduct.id} linkedGuides={currentProduct.linkedGuides || []} onLinkedGuidesChange={(linkedGuides) => handleUpdateProduct({ linkedGuides })} />;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <UnsavedChangesBlocker />
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
            isAdmin={isGuideAdmin}
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
              isAdmin={isGuideAdmin}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className={getHeaderClasses()}>
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
                  <img 
                    src={theme === 'dark' ? tpLogoWhite : tpLogoColor} 
                    alt="BrandHUB" 
                    className="h-6 w-6 object-contain flex-shrink-0" 
                  />
                  <span className="font-semibold text-foreground hidden sm:inline">
                    Brand<span className="text-accent">HUB</span>
                  </span>
                </div>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    Product
                  </Badge>
                  <span className="font-medium text-foreground">{currentProduct.hero.name}</span>
                  <SyncStatusIndicator compact />
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
                  organizationSlug={organization?.slug}
                />
                {!!user && isAdmin && <BrandAuditButton brand={currentProduct} />}
                {!!user && (
                  <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Brain className="h-5 w-5" />
                        <span className="sr-only">Product Intelligence</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 overflow-y-auto">
                      <div className="p-6">
                        <BrandIntelligencePanel
                          entityType="product"
                          entityId={currentProduct.id}
                          entityName={currentProduct.hero.name}
                          organizationId={currentProduct.organizationId}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
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
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in ${getSectionSpacingClass()}`}>
              {viewMode === 'sections' ? (
                renderSection()
              ) : (
                <FullBrandPage 
                  brand={currentProduct}
                  brandId={currentProduct.id}
                  onBrandUpdate={handleUpdateProduct}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  isAdmin={isGuideAdmin}
                  onOpenIntelligence={() => setIntelligenceOpen(true)}
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
