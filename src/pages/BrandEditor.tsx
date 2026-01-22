import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Sparkles, Menu, LayoutList, ScrollText, ArrowLeft, Lock, Shield, LogOut, Star, Brain } from 'lucide-react';
import { SectionId, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, BrandPageSettings, BrandGuide } from '@/types/brand';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSEO } from '@/hooks/useSEO';
import { ReorderableBrandSidebar } from '@/components/brand/ReorderableBrandSidebar';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { ShareButton } from '@/components/brand/ShareButton';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { ServicesSection } from '@/components/brand/ServicesSection';
import { RevenueChartSection } from '@/components/brand/RevenueChartSection';
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
import { VideosSection } from '@/components/brand/VideosSection';
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
import { HeroBackground } from '@/components/HeroBackground';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';
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
import { normalizeHiddenSections, normalizeSectionOrder } from '@/lib/sectionOrder';

type ViewMode = 'sections' | 'full';

const BrandEditor = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const previousThemeRef = useRef<string | undefined>(undefined);
  const { getBrand, updateBrand: updateBrandContext, toggleFavorite, isLoading } = useBrands();
  const { user, isAdmin, isApproved, signOut, isLoading: authLoading } = useAuth();
  const { userRole: orgRole } = useOrganization();
  
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [publicBrand, setPublicBrand] = useState<BrandGuide | null>(null);
  const [publicBrandLoading, setPublicBrandLoading] = useState(false);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);

  // Redirect unapproved users to pending approval page (admins are always allowed)
  useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Scroll to top when brand changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [brandSlug]);

  // Helper to check if the param is a UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  // Try to get brand from context by ID (for UUID) or by slug
  const contextBrand = useMemo(() => {
    if (!brandSlug) return undefined;
    // First try as UUID for backwards compatibility
    if (isUUID(brandSlug)) {
      return getBrand(brandSlug);
    }
    // Otherwise, we'll need to fetch by slug
    return undefined;
  }, [brandSlug, getBrand]);
  
  // Fetch public brand directly if not in context (for logged-out users or slug-based access)
  useEffect(() => {
    const fetchPublicBrand = async () => {
      if (!brandSlug || contextBrand || authLoading || isLoading) return;
      
      setPublicBrandLoading(true);
      try {
        // Build query - try by slug first, then by ID for backwards compatibility
        let query = supabase
          .from('brands')
          .select('*')
          .eq('is_public', true);
        
        if (isUUID(brandSlug)) {
          query = query.eq('id', brandSlug);
        } else {
          query = query.eq('slug', brandSlug);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (!error && data) {
          // Convert DB format to BrandGuide (defensive: legacy guide_data can contain invalid shapes)
          const asArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
            Array.isArray(value) ? (value as T[]) : fallback;

          const asObject = <T extends object>(value: unknown, fallback: T): T =>
            value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

          const guideData = asObject<Record<string, unknown>>(data.guide_data, {});

          const brand: BrandGuide = {
            id: data.id,
            type: 'brand',
            slug: data.slug,
            organizationId: data.organization_id,
            isFavorite: data.is_favorite ?? false,
            isPublic: data.is_public ?? false,
            sectionOrder: (Array.isArray(data.section_order) ? (data.section_order as SectionId[]) : DEFAULT_SECTION_ORDER),
            hiddenSections: (Array.isArray(data.hidden_sections) ? (data.hidden_sections as SectionId[]) : []),
            hero: asObject(guideData.hero, { name: data.name, tagline: '', coverImage: '', logoUrl: '' }) as BrandGuide['hero'],
            tagline: asObject(guideData.tagline, { primary: '', secondary: '', variations: [] }) as BrandGuide['tagline'],
            identity: asObject(guideData.identity, { missionStatement: '', archetype: '', toneOfVoice: [] }) as BrandGuide['identity'],
            values: asArray(guideData.values, []) as BrandGuide['values'],
            logos: asArray(guideData.logos, []) as BrandGuide['logos'],
            brandIcons: asArray(guideData.brandIcons, []) as BrandGuide['brandIcons'],
            colors: asArray(guideData.colors, []) as BrandGuide['colors'],
            colorCombinations: asArray(guideData.colorCombinations, []) as BrandGuide['colorCombinations'],
            gradients: asArray(guideData.gradients, []) as BrandGuide['gradients'],
            patterns: asArray(guideData.patterns, []) as BrandGuide['patterns'],
            typography: asArray(guideData.typography, []) as BrandGuide['typography'],
            textStyles: asArray(guideData.textStyles, []) as BrandGuide['textStyles'],
            iconography: asArray(guideData.iconography, []) as BrandGuide['iconography'],
            socialIcons: asArray(guideData.socialIcons, []) as BrandGuide['socialIcons'],
            imagery: asArray(guideData.imagery, []) as BrandGuide['imagery'],
            social: asArray(guideData.social, []) as BrandGuide['social'],
            socialAssets: asArray(guideData.socialAssets, []) as BrandGuide['socialAssets'],
            displayBanners: asArray(guideData.displayBanners, []) as BrandGuide['displayBanners'],
            websites: asArray(guideData.websites, []) as BrandGuide['websites'],
            signatures: asArray(guideData.signatures, []) as BrandGuide['signatures'],
            emailBanners: asArray(guideData.emailBanners, []) as BrandGuide['emailBanners'],
            qr: asObject(guideData.qr, { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' }) as BrandGuide['qr'],
            videos: asArray(guideData.videos, []) as BrandGuide['videos'],
            assets: asArray(guideData.assets, []) as BrandGuide['assets'],
            misuse: asArray(guideData.misuse, []) as BrandGuide['misuse'],
            atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as BrandGuide['atmosphere'],
            caseStudies: asArray(guideData.caseStudies, []) as BrandGuide['caseStudies'],
            brochures: asArray(guideData.brochures, []) as BrandGuide['brochures'],
            templates: asArray(guideData.templates, []) as BrandGuide['templates'],
            services: asArray(guideData.services, []) as BrandGuide['services'],
            linkedGuides: asArray(guideData.linkedGuides, []) as BrandGuide['linkedGuides'],
            sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as BrandGuide['sectionSubtitles'],
            pageSettings: asObject(guideData.pageSettings, DEFAULT_PAGE_SETTINGS) as BrandGuide['pageSettings'],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
          setPublicBrand(brand);
        }
      } catch (err) {
        console.error('Error fetching public brand:', err);
      } finally {
        setPublicBrandLoading(false);
      }
    };
    
    fetchPublicBrand();
  }, [brandSlug, contextBrand, authLoading, isLoading]);
  
  // Use context brand if available, otherwise use fetched public brand
  const brand = contextBrand || publicBrand;
  
  // Check if user can edit: global admin OR org member with appropriate role
  const canEditOrg = orgRole && ['owner', 'admin', 'member'].includes(orgRole);
  const canEdit = user && (isAdmin || canEditOrg);

  // In the editor experience, anyone who can edit should be able to see (and manage) all sections.
  // Otherwise, `hiddenSections` can unintentionally hide important areas (e.g. Social Assets) for org members.
  const isGuideAdmin = Boolean(isAdmin || canEditOrg);
  
  // Forward-compat: older guides may have persisted sectionOrder without newly-added sections (e.g., socialassets)
  const sectionOrder = useMemo(
    () => normalizeSectionOrder(brand?.sectionOrder),
    [brand?.sectionOrder]
  );
  const hiddenSections = useMemo(
    () => normalizeHiddenSections(brand?.hiddenSections, sectionOrder),
    [brand?.hiddenSections, sectionOrder]
  );
  const pageSettings = brand?.pageSettings || DEFAULT_PAGE_SETTINGS;

  // Apply brand-specific theme on mount and revert on unmount
  useEffect(() => {
    const brandDefaultTheme = pageSettings.defaultTheme;
    
    // Only apply if brand has a specific theme preference (not system)
    if (brandDefaultTheme && brandDefaultTheme !== 'system') {
      // Save current theme to restore later
      if (!previousThemeRef.current) {
        previousThemeRef.current = theme;
      }
      setTheme(brandDefaultTheme);
    }
    
    // Cleanup: revert to previous theme when leaving the brand page
    return () => {
      if (previousThemeRef.current) {
        setTheme(previousThemeRef.current);
        previousThemeRef.current = undefined;
      }
    };
  }, [pageSettings.defaultTheme, setTheme]);

  // Apply custom brand colors as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const originalPrimary = getComputedStyle(root).getPropertyValue('--primary').trim();
    const originalSecondary = getComputedStyle(root).getPropertyValue('--secondary').trim();
    
    // Helper to convert hex to HSL values
    const hexToHsl = (hex: string): string | null => {
      if (!hex || !hex.startsWith('#')) return null;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    
    if (pageSettings.customPrimaryColor) {
      const hsl = hexToHsl(pageSettings.customPrimaryColor);
      if (hsl) root.style.setProperty('--primary', hsl);
    }
    
    if (pageSettings.customSecondaryColor) {
      const hsl = hexToHsl(pageSettings.customSecondaryColor);
      if (hsl) root.style.setProperty('--secondary', hsl);
    }
    
    // Cleanup: restore original colors when leaving the brand page
    return () => {
      if (pageSettings.customPrimaryColor) {
        root.style.setProperty('--primary', originalPrimary);
      }
      if (pageSettings.customSecondaryColor) {
        root.style.setProperty('--secondary', originalSecondary);
      }
    };
  }, [pageSettings.customPrimaryColor, pageSettings.customSecondaryColor]);

  // SEO metadata for brand page
  useSEO({
    title: brand ? `${brand.hero.name} Brand Guidelines` : 'Brand Guidelines',
    description: brand?.hero.tagline 
      ? `${brand.hero.name} - ${brand.hero.tagline}. View the complete brand guidelines including logos, colors, typography, and more.`
      : brand ? `Complete brand guidelines for ${brand.hero.name}. Access logos, colors, typography, and visual identity standards.`
      : 'View brand guidelines',
    canonicalUrl: brand ? `${window.location.origin}/brand/${brand.id}` : undefined,
    ogTitle: brand ? `${brand.hero.name} - Brand Guidelines` : undefined,
    ogDescription: brand?.hero.tagline || (brand ? `Official brand guidelines for ${brand.hero.name}` : undefined),
    ogImage: brand?.hero.coverImage || brand?.hero.logoUrl || undefined,
    ogType: 'article',
  });

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

  // Determine background type for brand page
  const getBrandBackgroundType = (): HeroBackgroundType | undefined => {
    if (pageSettings.backgroundType === 'inherit' || pageSettings.backgroundType === 'solid') {
      return undefined;
    }
    return pageSettings.backgroundType as HeroBackgroundType;
  };

  const handlePageSettingsChange = useCallback((newSettings: BrandPageSettings) => {
    if (brand) {
      updateBrandContext(brand.id, { pageSettings: newSettings });
    }
  }, [brand, updateBrandContext]);

  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (brand) {
      updateBrandContext(brand.id, { sectionOrder: newOrder });
    }
  }, [brand, updateBrandContext]);

  // Auto-heal persisted sectionOrder when new sections are introduced
  useEffect(() => {
    if (!brand || !isGuideAdmin) return;
    const current = Array.isArray(brand.sectionOrder) ? brand.sectionOrder : [];
    const normalized = normalizeSectionOrder(current);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      updateBrandContext(brand.id, { sectionOrder: normalized });
    }
  }, [brand?.id, brand?.sectionOrder, isGuideAdmin, updateBrandContext]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: SectionId[]) => {
    if (brand) {
      updateBrandContext(brand.id, { hiddenSections: newHiddenSections });
    }
  }, [brand, updateBrandContext]);

  // Auto-heal invalid hidden sections (e.g., ids removed/renamed)
  useEffect(() => {
    if (!brand || !isGuideAdmin) return;
    const current = Array.isArray(brand.hiddenSections) ? brand.hiddenSections : [];
    const normalized = normalizeHiddenSections(current, sectionOrder);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      updateBrandContext(brand.id, { hiddenSections: normalized });
    }
  }, [brand?.id, brand?.hiddenSections, sectionOrder, isGuideAdmin, updateBrandContext]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  // Show loading state - AFTER all hooks
  // For public (logged out) views or slug-based access, show enhanced loading screen
  const isPublicView = !user && publicBrandLoading;
  
  if (authLoading || isLoading || publicBrandLoading) {
    // Use enhanced loading for public/anonymous access
    if (isPublicView || (!user && !contextBrand)) {
      return <PublicLoadingScreen type="brand" />;
    }
    // Simple loading for authenticated users
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Brand not found</h1>
          <p className="text-muted-foreground mb-4">The brand you&apos;s looking for doesn&apos;t exist.</p>
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

  const renderSection = () => {
    switch (activeSection) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={(hero) => updateBrand({ hero })} onOpenIntelligence={() => setIntelligenceOpen(true)} />;
      case 'tagline': return <TaglineSection tagline={brand.tagline} onTaglineChange={(tagline) => updateBrand({ tagline })} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={(identity) => updateBrand({ identity })} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={(values) => updateBrand({ values })} />;
      case 'services': return <ServicesSection services={brand.services || []} onServicesChange={(services) => updateBrand({ services })} />;
      case 'revenue': return <RevenueChartSection revenueData={brand.revenueData} onRevenueDataChange={(revenueData) => updateBrand({ revenueData })} brandName={brand.hero.name} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={(logos) => updateBrand({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={(brandIcons) => updateBrand({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => updateBrand({ colors })} colorCombinations={brand.colorCombinations} onColorCombinationsChange={(colorCombinations) => updateBrand({ colorCombinations })} brandName={brand.hero.name} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={(gradients) => updateBrand({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={(patterns) => updateBrand({ patterns })} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={(typography) => updateBrand({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={(textStyles) => updateBrand({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={(iconography) => updateBrand({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={(socialIcons) => updateBrand({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={(imagery) => updateBrand({ imagery })} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={(social) => updateBrand({ social })} />;
      case 'socialassets': return (
        <SocialAssetsSection
          socialAssets={brand.socialAssets || []}
          onSocialAssetsChange={(socialAssets) => updateBrand({ socialAssets })}
          displayBanners={brand.displayBanners || []}
          onDisplayBannersChange={(displayBanners) => updateBrand({ displayBanners })}
        />
      );
      case 'website': return <WebsiteSection websites={brand.websites} onWebsitesChange={(websites) => updateBrand({ websites })} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={(signatures) => updateBrand({ signatures })} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={(qr) => updateBrand({ qr })} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={(videos) => updateBrand({ videos })} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={(assets) => updateBrand({ assets })} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => updateBrand({ misuse })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => updateBrand({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => updateBrand({ brochures })} />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => updateBrand({ templates })} />;
      case 'products': return <ProductsSection brandId={brand.id} />;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <UnsavedChangesBlocker />
      <div className="min-h-screen bg-background flex relative">
        {/* Brand-specific Background */}
        {pageSettings.backgroundType !== 'inherit' && pageSettings.backgroundType !== 'solid' && (
          <div className="fixed inset-0 z-0 pointer-events-none">
            <HeroBackground 
              type={getBrandBackgroundType()} 
              image={pageSettings.backgroundImage}
              animationSpeed={pageSettings.animationSpeed}
              tintColor={pageSettings.animationTintColor || undefined}
            />
          </div>
        )}
        {pageSettings.backgroundType === 'solid' && pageSettings.backgroundColor && (
          <div 
            className="fixed inset-0 z-0 pointer-events-none" 
            style={{ backgroundColor: pageSettings.backgroundColor }}
          />
        )}

        {/* Desktop Sidebar - Sticky */}
        <div className="hidden lg:block sticky top-0 h-screen z-10">
          <ReorderableBrandSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
            brandName={brand.hero.name}
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
              brandName={brand.hero.name}
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isGuideAdmin}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Header */}
          {pageSettings.showHeader && (
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Brands</TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg hover-scale cursor-pointer">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-semibold text-foreground hidden sm:inline">BrandHub</span>
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
                  {canEdit && <SyncStatusIndicator compact />}
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
                <ShareButton 
                  guideId={brand.id} 
                  guideName={brand.hero.name} 
                  type="brand" 
                  isPublic={brand.isPublic}
                  onPublicChange={(isPublic) => updateBrand({ isPublic })}
                  canEdit={canEdit || false}
                />
                <BrandAuditButton brand={brand} />
                {canEdit && (
                  <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Brain className="h-5 w-5" />
                        <span className="sr-only">Brand Intelligence</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 overflow-y-auto">
                      <div className="p-6">
                        <BrandIntelligencePanel
                          entityType="brand"
                          entityId={brand.id}
                          entityName={brand.hero.name}
                          organizationId={brand.organizationId}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
                {canEdit && (
                  <BrandPageSettingsEditor
                    settings={pageSettings} 
                    onSettingsChange={handlePageSettingsChange} 
                  />
                )}
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
          )}

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in-up ${getSectionSpacingClass()}`}>
              {viewMode === 'sections' ? (
                <div className="animate-zoom-in">
                  {renderSection()}
                </div>
              ) : (
                <FullBrandPage 
                  brand={brand}
                  brandId={brand.id}
                  onBrandUpdate={updateBrand}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  isAdmin={isGuideAdmin}
                  heroFullWidth={pageSettings.heroFullWidth}
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

export default BrandEditor;
