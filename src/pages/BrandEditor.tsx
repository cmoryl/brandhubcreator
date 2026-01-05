import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Menu, LayoutList, ScrollText, ArrowLeft, Lock, Shield, LogOut, Star } from 'lucide-react';
import { SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
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
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { AtmosphereSection } from '@/components/brand/AtmosphereSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { BrochuresSection } from '@/components/brand/BrochuresSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { ExportPdfButton } from '@/components/brand/ExportPdfButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'sections' | 'full';

const BrandEditor = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { getBrand, updateBrand: updateBrandContext, toggleFavorite } = useBrands();
  const { user, isAdmin, signOut } = useAuth();
  
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);

  const brand = getBrand(brandId || '');
  const canEdit = user && isAdmin;
  
  const sectionOrder = brand?.sectionOrder || DEFAULT_SECTION_ORDER;

  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (brand) {
      updateBrandContext(brand.id, { sectionOrder: newOrder });
    }
  }, [brand, updateBrandContext]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Brand not found</h1>
          <p className="text-muted-foreground mb-4">The brand you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

  const updateBrand = (updates: Parameters<typeof updateBrandContext>[1]) => {
    updateBrandContext(brand.id, updates);
  };

  const handleSectionChange = useCallback((section: SectionId) => {
    setActiveSection(section);
    if (viewMode === 'full') {
      setScrollToSection(section);
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
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar - Sticky */}
        <div className="hidden lg:block sticky top-0 h-screen">
          <ReorderableBrandSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            brandName={brand.hero.name}
            sectionOrder={sectionOrder}
            onSectionOrderChange={handleSectionOrderChange}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <ReorderableBrandSidebar 
              activeSection={activeSection} 
              onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} 
              brandName={brand.hero.name}
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Brands</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-semibold text-foreground hidden sm:inline">BrandForge</span>
                </div>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
                    {brand.hero.name}
                  </span>
                  {canEdit && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Editing
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleFavorite(brand.id, 'brand')}
                      className={brand.isFavorite ? 'text-yellow-500' : ''}
                    >
                      <Star className={`h-5 w-5 ${brand.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{brand.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                </Tooltip>
                <ShareButton guideId={brand.id} guideName={brand.hero.name} type="brand" />
                <ExportPdfButton guide={brand} />
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
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent/10 text-accent text-sm">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs text-muted-foreground">
                        {user.email}
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem className="gap-2 text-accent">
                          <Shield className="h-4 w-4" />
                          Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-2">
                    <Lock className="h-4 w-4" />
                    Login
                  </Button>
                )}
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
                  brand={brand} 
                  onBrandUpdate={updateBrand}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BrandEditor;
