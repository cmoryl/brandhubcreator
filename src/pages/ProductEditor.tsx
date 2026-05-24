import React, { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText, LayoutGrid, ArrowLeft, Package, Star, Brain, Building2, Shield, LogOut, Lock, Download, Settings, HardDrive, ClipboardCheck, TrendingUp, LayoutDashboard, Users, HelpCircle, Globe2, Bot } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { SectionId, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, BrandPageSettings, ProductGuide } from '@/types/brand';
import { GlobalBrandToolbar } from '@/components/brand/GlobalBrandToolbar';
import { RegionalAnalysisPanel } from '@/components/brand/RegionalAnalysisPanel';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { useBrands } from '@/contexts/BrandContext';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgSlug } from '@/hooks/useOrgSlug';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';
import { useLatestComplianceScores } from '@/hooks/dataforce/useLatestComplianceScores';
import { supabase } from '@/integrations/supabase/client';
import { normalizeProductGuide } from '@/lib/guideNormalization';
import { trackEntityView } from '@/hooks/usePageTracking';
import { ReorderableBrandSidebar } from '@/components/brand/ReorderableBrandSidebar';
import { useAutoBiasMonitoring } from '@/hooks/useAutoBiasMonitoring';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { ShareButton } from '@/components/brand/ShareButton';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { ServicesSection } from '@/components/brand/ServicesSection';
import { VideosSection } from '@/components/brand/VideosSection';
import { RevenueChartSection } from '@/components/brand/RevenueChartSection';
import { ByTheNumbersSection } from '@/components/brand/ByTheNumbersSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
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
import { LayoutTemplatesSection } from '@/components/brand/LayoutTemplatesSection';
import { resolveBrandVisuals } from '@/lib/deriveBrandVisuals';
import { SocialSection } from '@/components/brand/SocialSection';
import { SocialAssetsSection } from '@/components/brand/SocialAssetsSection';
import { WebsiteSection } from '@/components/brand/WebsiteSection';
import { SignaturesSection } from '@/components/brand/SignaturesSection';
import { QRSection } from '@/components/brand/QRSection';
import { AssetsSection } from '@/components/brand/AssetsSection';
import { MisuseSection } from '@/components/brand/MisuseSection';
import { DigitalCollateralSection } from '@/components/brand/DigitalCollateralSection';
import { CaseStudiesSection } from '@/components/brand/CaseStudiesSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { ProductsSection } from '@/components/brand/ProductsSection';
import { SponsorLogosSection } from '@/components/brand/SponsorLogosSection';
import { ClientLogosSection } from '@/components/brand/ClientLogosSection';
import { InsightsSection } from '@/components/brand/InsightsSection';
import { WebinarSeriesSection } from '@/components/brand/WebinarSeriesSection';
import { ImageAssetsSection } from '@/components/brand/ImageAssetsSection';
import { EventsSection } from '@/components/brand/EventsSection';
import { BrandEventSignageSection } from '@/components/brand/BrandEventSignageSection';
import { PresentationTemplatesSection } from '@/components/brand/PresentationTemplatesSection';
import { ApprovedImagerySection } from '@/components/brand/approved-imagery/ApprovedImagerySection';
import { StudiosSection } from '@/components/brand/StudiosSection';
import { ExportPdfButton } from '@/components/brand/ExportPdfButton';
import { BrandAuditButton } from '@/components/brand/BrandAuditButton';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { BrandIntelligencePanel } from '@/components/brand/BrandIntelligencePanel';
import { BrandBackupManager } from '@/components/brand/BrandBackupManager';
import { QuickBackupButton } from '@/components/brand/QuickBackupButton';
import { AdminToolbar, type AdminToolbarAction } from '@/components/admin/AdminToolbar';
import { StickyBreadcrumbs } from '@/components/StickyBreadcrumbs';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { BackToTopButton } from '@/components/BackToTopButton';
import { GuideLanguageSelector } from '@/components/localization/GuideLanguageSelector';
import { TranslationHub } from '@/components/brand/TranslationHub';
import { MobileSectionNav } from '@/components/brand/MobileSectionNav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { normalizeHiddenSections, normalizeSectionOrder } from '@/lib/sectionOrder';
import { SectionCardGrid } from '@/components/brand/SectionCardGrid';
import { ActiveSectionHeader } from '@/components/brand/ActiveSectionHeader';
import { calculateBrandHealth } from '@/lib/brandHealthCalculator';
import { useExternalSectionCounts } from '@/hooks/useExternalSectionCounts';

type ViewMode = 'sections' | 'full' | 'cards';

const CompetitiveReportCardLazy = lazy(() =>
  import('@/components/brand/CompetitiveReportCard').then((m) => ({ default: m.CompetitiveReportCard }))
);
const LeafletLocationsSection = lazy(() => import('@/components/brand/LeafletLocationsSection').then(m => ({ default: m.LeafletLocationsSection })));
const AwardsSection = lazy(() => import('@/components/brand/AwardsSection'));
const GlobalLinkUniverseSection = lazy(() => import('@/components/brand/GlobalLinkUniverseSection'));

// Legacy/short slugs that may exist in old links, emails, or bookmarks.
// Keep this small and explicit to avoid unexpected matches.
const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  gl: 'globallink',
  'gl-tms': 'globallink-tms',
  'gl-portal': 'globallink-portal',
  'gl-web': 'globallink-web',
  'gl-now': 'globallink-now',
  'gl-scribe': 'globallink-scribe',
  'gl-voice': 'globallink-voice',
  'gl-live': 'globallink-live',
  'gl-media': 'globallink-media',
  'gl-tv': 'globallink-tv',
  'gl-strings': 'globallink-strings',
  'gl-share': 'globallink-share',
  'gl-write': 'globallink-write',
  'gl-ccms': 'globallink-ccms',
  ti: 'trial-interactive',
  'trial-int': 'trial-interactive',
};

const BrandAssistant = lazy(() => import('@/components/dataforce/BrandAssistant').then(m => ({ default: m.BrandAssistant })));

const ProductEditor = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { getProduct, getProductBySlug, updateProduct, toggleFavorite, isLoading, refetch: refetchProducts } = useBrands();
  const { user, isAdmin, isApproved, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization, isLoading: orgLoading } = useOrganization();

  // Note: canEdit and isGuideAdmin are calculated below after currentProduct is defined
  // to ensure we check against the correct organization

  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [gridSections, setGridSections] = useState<string[]>([]);
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  // Regional analysis panel state
  const [regionalAnalysisOpen, setRegionalAnalysisOpen] = useState(false);
  // Translation hub state
  const [translationHubOpen, setTranslationHubOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Refetch product data when page becomes visible (e.g. returning from Imagery Hub)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    refetchProducts();
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetchProducts]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  const [publicProduct, setPublicProduct] = useState<ProductGuide | null>(null);
  // Start as false to prevent flash - will be set true when fetch actually starts
  const [publicProductLoading, setPublicProductLoading] = useState(false);
  // Track if fetch has been initiated to handle the "skip if context has data" case
  const fetchInitiatedRef = React.useRef(false);
  // Parent product for hierarchical breadcrumbs (when linked via linkedGuides in another product)
  const [parentProduct, setParentProduct] = useState<{ id: string; name: string; slug: string } | null>(null);
  // Parent brand for hierarchical breadcrumbs (when linked via parent_brand_id)
  const [parentBrand, setParentBrand] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Redirect unapproved users to pending approval page (admins are always allowed)
  React.useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Scroll to top when product changes (unless there's a hash anchor)
  // Note: scroll-to-top on route change is handled by ScrollToTop component

  // Handle hash anchor scrolling on page load/navigation
  React.useEffect(() => {
    if (location.hash && viewMode === 'full') {
      const sectionId = location.hash.replace('#', '') as SectionId;
      // Small delay to ensure the page has rendered
      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Add highlight flash
          setTimeout(() => {
            element.classList.add('section-highlight-flash');
            setTimeout(() => element.classList.remove('section-highlight-flash'), 1300);
          }, 400);
        }
      }, 100);
      return () => clearTimeout(scrollTimeout);
    }
  }, [location.hash, viewMode]);

  // Scroll to section when sidebar nav is clicked, then flash highlight
  React.useEffect(() => {
    if (scrollToSection && viewMode === 'full') {
      const element = document.getElementById(scrollToSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add highlight flash after scroll completes
        const flashTimeout = setTimeout(() => {
          element.classList.add('section-highlight-flash');
          
          // Remove the class after animation completes
          const cleanupTimeout = setTimeout(() => {
            element.classList.remove('section-highlight-flash');
          }, 1300);
          
          return () => clearTimeout(cleanupTimeout);
        }, 400); // Wait for scroll to mostly complete
        
        return () => clearTimeout(flashTimeout);
      }
    }
  }, [scrollToSection, viewMode]);

  // Sync sidebar with scroll position using Intersection Observer
  React.useEffect(() => {
    if (viewMode !== 'full') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id as SectionId;
            if (sectionId && DEFAULT_SECTION_ORDER.includes(sectionId)) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    // Observe all section elements
    const sectionElements = document.querySelectorAll('[id]');
    sectionElements.forEach((el) => {
      // Only observe valid section IDs
      if (DEFAULT_SECTION_ORDER.includes(el.id as SectionId)) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [viewMode]);

  // Helper to check if the param is a UUID
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Normalize legacy slugs to the canonical slug.
  const effectiveProductSlug = React.useMemo(() => {
    if (!productSlug) return undefined;
    if (isUUID(productSlug)) return productSlug;
    return PRODUCT_SLUG_ALIASES[productSlug] ?? productSlug;
  }, [productSlug]);

  // Try to get product from context by ID (for UUID) or by slug
  const contextProduct = React.useMemo(() => {
    if (!effectiveProductSlug) return undefined;
    // First try as UUID for backwards compatibility
    if (isUUID(effectiveProductSlug)) {
      return getProduct(effectiveProductSlug);
    }
    // Try by slug using the effective (alias-resolved) slug
    return getProductBySlug(effectiveProductSlug);
  }, [effectiveProductSlug, getProduct, getProductBySlug]);

  // Track if we've already fetched for this slug to avoid duplicate calls
  const hasFetchedPublicRef = React.useRef<string | null>(null);

  // Fetch public product directly if not in context
  // IMPORTANT: Don't wait for authLoading/isLoading - fetch public data immediately
  React.useEffect(() => {
    const fetchPublicProduct = async () => {
      // Skip if we already have the product from context OR already fetched this slug
      if (!effectiveProductSlug || contextProduct || hasFetchedPublicRef.current === effectiveProductSlug) {
        setPublicProductLoading(false);
        return;
      }

      setPublicProductLoading(true);
      hasFetchedPublicRef.current = effectiveProductSlug;
      
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_public', true);

        if (isUUID(effectiveProductSlug)) {
          query = query.eq('id', effectiveProductSlug);
        } else {
          query = query.eq('slug', effectiveProductSlug);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (data) {
          // If the user hit a legacy slug URL, normalize to canonical slug.
          if (productSlug && !isUUID(productSlug) && data.slug && data.slug !== productSlug) {
            navigate(`/product/${data.slug}`, { replace: true });
          }

          // Convert DB format to ProductGuide using centralized normalization
          const guideData = typeof data.guide_data === 'object' && data.guide_data ? data.guide_data : {};
          const product = normalizeProductGuide({
            ...guideData,
            id: data.id,
            slug: data.slug,
            organizationId: data.organization_id,
            parentBrandId: data.parent_brand_id,
            isFavorite: data.is_favorite,
            isPublic: data.is_public,
            sectionOrder: data.section_order,
            hiddenSections: data.hidden_sections,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            // Ensure hero name is set from data.name if not in guide_data
            hero: { ...(guideData as any)?.hero, name: (guideData as any)?.hero?.name || data.name },
          });
          setPublicProduct(product);
        }
      } catch (err) {
        console.error('Error fetching public product:', err);
      } finally {
        setPublicProductLoading(false);
      }
    };

    fetchPublicProduct();
  }, [effectiveProductSlug, productSlug, contextProduct, navigate]);

  // Use context product if available, otherwise use fetched public product
  const currentProduct = contextProduct || publicProduct;

  // Resolve org slug for breadcrumbs - always resolve from entity's organizationId
  // since the auth-based organization context may not match the entity's org
  const { orgSlug: resolvedOrgSlug, orgName: resolvedOrgName } = useOrgSlug(
    currentProduct?.organizationId
  );
  const effectiveOrgSlug = resolvedOrgSlug || organization?.slug;
  const effectiveOrgName = resolvedOrgName || organization?.name;

  // Use centralized admin detection hook for consistent behavior across all editors
  const { isGuideAdmin, canEdit, canViewAnalytics } = useGuideAdmin({ 
    entityOrgId: currentProduct?.organizationId 
  });

  // Compliance scores
  const { data: complianceScores } = useLatestComplianceScores(currentProduct?.organizationId);

  useEffect(() => {
    if (currentProduct?.id && user?.id) {
      trackEntityView(user.id, 'product', currentProduct.id, currentProduct.hero?.name || 'Unknown Product');
    }
  }, [currentProduct?.id, user?.id]);
  // Fetch parent product for sub-products (check if any master product has this product in linkedGuides)
  React.useEffect(() => {
    const fetchParentProduct = async () => {
      if (!currentProduct?.id) return;
      
      try {
        // Query all products to find any that reference this product in linkedGuides
        // We need to check both public and non-public parents as a sub-product might be public
        // while its parent is not (yet)
        const { data: masterProducts, error } = await supabase
          .from('products')
          .select('id, name, slug, guide_data, is_public');
        
        if (error) throw error;
        
        // Check each master product's linkedGuides for our current product
        for (const masterProduct of masterProducts || []) {
          // Skip if this is the same product
          if (masterProduct.id === currentProduct.id) continue;
          
          const guideData = masterProduct.guide_data as any;
          const linkedGuides = guideData?.linkedGuides || [];
          const isLinked = linkedGuides.some((lg: any) => 
            lg.id === currentProduct.id || lg.slug === currentProduct.slug
          );
          
          if (isLinked) {
            setParentProduct({
              id: masterProduct.id,
              name: masterProduct.name,
              slug: masterProduct.slug || masterProduct.id,
            });
            return;
          }
        }
        
        // No parent found
        setParentProduct(null);
      } catch (err) {
        console.error('Error fetching parent product:', err);
      }
    };
    
    fetchParentProduct();
  }, [currentProduct?.id, currentProduct?.slug]);

  // Fetch parent brand for products linked via parent_brand_id
  React.useEffect(() => {
    const fetchParentBrand = async () => {
      const parentBrandId = currentProduct?.parentBrandId;
      if (!parentBrandId) {
        setParentBrand(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name, slug')
          .eq('id', parentBrandId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setParentBrand({
            id: data.id,
            name: data.name,
            slug: data.slug || data.id,
          });
        } else {
          setParentBrand(null);
        }
      } catch (err) {
        console.error('Error fetching parent brand:', err);
        setParentBrand(null);
      }
    };
    
    fetchParentBrand();
  }, [currentProduct?.parentBrandId]);

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

  const productRefreshTrigger = currentProduct?.updatedAt ? new Date(String(currentProduct.updatedAt)).getTime() : 0;
  const { counts: externalCounts } = useExternalSectionCounts(currentProduct?.id, 'product', productRefreshTrigger);

  // Calculate health for card view
  const cardViewHealthScore = useMemo(() => {
    if (!currentProduct) return undefined;
    const health = calculateBrandHealth(currentProduct as unknown as Record<string, unknown>, hiddenSections, 'product', sectionOrder, externalCounts);
    return health.overallScore;
  }, [currentProduct, hiddenSections, sectionOrder, externalCounts]);

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

  // Optimized loading: prevents flash for fast loads
  // Key insight: show loading until we KNOW we have data or KNOW data doesn't exist
  const hasFetchedPublic = hasFetchedPublicRef.current === effectiveProductSlug;
  const needsPublicData = !contextProduct && !publicProduct;
  // Show loading if: we need public data AND (still loading OR haven't even started fetching yet)
  const rawLoading = needsPublicData && (publicProductLoading || !hasFetchedPublic);
  const stableLoading = useStableLoading(rawLoading, {
    showDelay: 100,
    minDisplayTime: 300,
    maxLoadingTime: 6000
  });

  // ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (currentProduct) {
      if (!contextProduct && publicProduct) {
        setPublicProduct(prev => prev ? { ...prev, sectionOrder: newOrder, updatedAt: new Date() } : prev);
      }
      updateProduct(currentProduct.id, { sectionOrder: newOrder });
    }
  }, [currentProduct, contextProduct, publicProduct, updateProduct]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: SectionId[]) => {
    if (currentProduct) {
      if (!contextProduct && publicProduct) {
        setPublicProduct(prev => prev ? { ...prev, hiddenSections: newHiddenSections, updatedAt: new Date() } : prev);
      }
      updateProduct(currentProduct.id, { hiddenSections: newHiddenSections });
    }
  }, [currentProduct, contextProduct, publicProduct, updateProduct]);

  const handleSectionVisible = useCallback((section: SectionId) => {
    if (viewMode === 'full') {
      setActiveSection(section);
    }
  }, [viewMode]);

  // Continuous bias monitoring for products
  const { triggerMonitor: triggerBiasMonitor } = useAutoBiasMonitoring({
    organizationId: currentProduct?.organizationId,
    entityType: 'product',
    entityId: currentProduct?.id || '',
    entityName: currentProduct?.hero?.name || '',
    enabled: canEdit && Boolean(currentProduct?.id),
  });

  const handleUpdateProduct = useCallback((updates: Partial<ProductGuide>) => {
    if (currentProduct) {
      if (!contextProduct && publicProduct) {
        setPublicProduct(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : prev);
      }
      updateProduct(currentProduct.id, updates);
      // Feed to continuous bias monitor
      triggerBiasMonitor({ ...currentProduct, ...updates } as unknown as Record<string, unknown>);
    }
  }, [currentProduct, contextProduct, publicProduct, updateProduct, triggerBiasMonitor]);

  const handleSectionChange = useCallback((section: SectionId) => {
    setActiveSection(section);
    if (viewMode === 'full') {
      setScrollToSection(section);
      setTimeout(() => setScrollToSection(null), 100);
    }
  }, [viewMode]);

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

  // Show loading state
  // Use guide name if known for better UX
  if (stableLoading) {
    return (
      <PublicLoadingScreen 
        type="product" 
        name={publicProduct?.hero?.name || productSlug}
        organizationName={organization?.name}
      />
    );
  }

  // Not found state - only show AFTER we've completed fetch and have no data
  if (!currentProduct && hasFetchedPublic && !publicProductLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Product not found</h1>
          <Button onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}>{organization ? `Back to ${organization.name}` : 'Go back home'}</Button>
        </div>
      </div>
    );
  }

  // Final guard - if somehow we still have no product, show loading
  if (!currentProduct) {
    return (
      <PublicLoadingScreen 
        type="product" 
        name={productSlug}
        organizationName={organization?.name}
      />
    );
  }

  const renderSection = () => {
    // Helper to conditionally create change handler - when canEdit is false, editing is disabled
    const editHandler = <T,>(handler: (value: T) => void) => canEdit ? handler : undefined;
    
    switch (activeSection) {
      case 'hero': return <HeroSection hero={currentProduct.hero} onHeroChange={editHandler((hero) => handleUpdateProduct({ hero }))} onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined} guideData={currentProduct as unknown as Record<string, unknown>} entityType="product" entityId={currentProduct.id} complianceScore={complianceScores?.get(currentProduct.id)?.score} hiddenSections={hiddenSections} sectionOrder={sectionOrder} compact={viewMode === 'cards'} />;
      case 'tagline': return <TaglineSection tagline={currentProduct.tagline} onTaglineChange={editHandler((tagline) => handleUpdateProduct({ tagline }))} />;
      case 'identity': return <IdentitySection identity={currentProduct.identity} onIdentityChange={editHandler((identity) => handleUpdateProduct({ identity }))} />;
      case 'values': return <ValuesSection values={currentProduct.values} onValuesChange={editHandler((values) => handleUpdateProduct({ values }))} organizationId={currentProduct.organizationId} brandId={currentProduct.id} brandName={currentProduct.hero.name} canEdit={canEdit} />;
      case 'bythenumbers': return <ByTheNumbersSection statistics={currentProduct.statistics || []} onStatisticsChange={editHandler((statistics) => handleUpdateProduct({ statistics }))} brandName={currentProduct.hero.name} infographicLayout={currentProduct.infographicLayout || 'infographic'} onLayoutChange={canEdit ? (infographicLayout) => handleUpdateProduct({ infographicLayout }) : undefined} brandColors={currentProduct.colors || []} />;
      case 'services': return <ServicesSection services={currentProduct.services || []} onServicesChange={editHandler((services) => handleUpdateProduct({ services }))} entityId={currentProduct.id} entityType="product" brandWebsites={currentProduct.websites || []} brandName={currentProduct.hero?.name} />;
      case 'revenue': return <RevenueChartSection revenueData={currentProduct.revenueData} onRevenueDataChange={editHandler((revenueData) => handleUpdateProduct({ revenueData }))} brandName={currentProduct.hero.name} chartTheme={currentProduct.chartTheme} onChartThemeChange={editHandler((chartTheme) => handleUpdateProduct({ chartTheme }))} brandColors={currentProduct.colors || []} />;
      case 'brandicon': return <BrandIconsSection brandIcons={currentProduct.brandIcons} onBrandIconsChange={editHandler((brandIcons) => handleUpdateProduct({ brandIcons }))} entityId={currentProduct.id} entityType="product" />;
      case 'colors': return <ColorPaletteSection colors={currentProduct.colors} onColorsChange={editHandler((colors) => handleUpdateProduct({ colors }))} colorCombinations={currentProduct.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => handleUpdateProduct({ colorCombinations }))} brandName={currentProduct.hero.name} brandSlug={parentBrand?.slug} />;
      case 'gradients': return <GradientsSection gradients={currentProduct.gradients} onGradientsChange={editHandler((gradients) => handleUpdateProduct({ gradients }))} brandName={currentProduct.hero.name} brandColors={currentProduct.colors} />;
      case 'patterns': return <PatternsSection patterns={currentProduct.patterns} onPatternsChange={editHandler((patterns) => handleUpdateProduct({ patterns }))} brandName={currentProduct.hero.name} brandColors={currentProduct.colors} brandTagline={currentProduct.tagline?.primary} brandArchetype={currentProduct.identity?.archetype} entityId={currentProduct.id} entityType="product" />;
      case 'typography': return <TypographySection typography={currentProduct.typography} onTypographyChange={editHandler((typography) => handleUpdateProduct({ typography }))} isAdmin={isGuideAdmin} />;
      case 'textstyles': return <TextStylesSection textStyles={currentProduct.textStyles} onTextStylesChange={editHandler((textStyles) => handleUpdateProduct({ textStyles }))} adminCustomStyle={currentProduct.adminCustomStyle} onAdminCustomStyleChange={canEdit ? (adminCustomStyle) => handleUpdateProduct({ adminCustomStyle }) : undefined} canEdit={canEdit} />;
      case 'iconography': return <IconographySection iconography={currentProduct.iconography} onIconographyChange={editHandler((iconography) => handleUpdateProduct({ iconography }))} defaultIconColor={currentProduct.defaultIconColor} onDefaultIconColorChange={editHandler((defaultIconColor) => handleUpdateProduct({ defaultIconColor }))} brandColors={currentProduct.colors?.map(c => ({ hex: c.hex, name: c.name })) || []} organizationId={organization?.id} brandId={currentProduct.id} entityType="product" entityName={currentProduct.hero?.name || ''} entitySlug={currentProduct.slug} />;
      case 'socialicons': return <SocialIconsSection socialIcons={currentProduct.socialIcons} onSocialIconsChange={editHandler((socialIcons) => handleUpdateProduct({ socialIcons }))} />;
      case 'imagery': return <ImagerySection imagery={currentProduct.imagery} onImageryChange={editHandler((imagery) => handleUpdateProduct({ imagery }))} entityId={currentProduct.id} entityType="product" isAdmin={isGuideAdmin} brandSlug={parentBrand?.slug} />;
      case 'layouttemplates': {
        const explicitVisuals = (currentProduct as any).brandVisuals;
        const derivedVisuals = resolveBrandVisuals(explicitVisuals, {
          brandSlug: (currentProduct as any).brandSlug || (currentProduct as any).parentBrandSlug,
          hero: currentProduct.hero,
          logos: currentProduct.logos,
          imagery: currentProduct.imagery,
          patterns: currentProduct.patterns,
          gradients: currentProduct.gradients,
          approvedImagery: (currentProduct as any).approvedImagery,
        });
        const isDerived = !((explicitVisuals?.staticAssets?.length ?? 0) + (explicitVisuals?.motionAssets?.length ?? 0));
        return <LayoutTemplatesSection brandVisuals={derivedVisuals} isDerived={isDerived} />;
      }
      case 'social': return <SocialSection social={currentProduct.social} onSocialChange={editHandler((social) => handleUpdateProduct({ social }))} entityId={currentProduct.id} entityType="product" organizationId={currentProduct.organizationId} entityName={currentProduct.hero?.name} />;
      case 'socialassets':
        return (
          <SocialAssetsSection
            socialAssets={currentProduct.socialAssets || []}
            onSocialAssetsChange={editHandler((socialAssets) => handleUpdateProduct({ socialAssets }))}
            entityId={currentProduct.id}
            entityType="product"
            brandLogos={currentProduct.logos}
          />
        );
      case 'website': return <WebsiteSection websites={currentProduct.websites} onWebsitesChange={editHandler((websites) => handleUpdateProduct({ websites }))} entityType="product" entityId={currentProduct.id} />;
      case 'signatures': return <SignaturesSection signatures={currentProduct.signatures} onSignaturesChange={editHandler((signatures) => handleUpdateProduct({ signatures }))} emailBanners={currentProduct.emailBanners || []} onEmailBannersChange={editHandler((emailBanners) => handleUpdateProduct({ emailBanners }))} />;
      case 'qr': return <QRSection qr={currentProduct.qr} onQRChange={editHandler((qr) => handleUpdateProduct({ qr }))} entityType="product" entityId={currentProduct.id} logos={currentProduct.logos} />;
      case 'videos': return <VideosSection videos={currentProduct.videos} onVideosChange={editHandler((videos) => handleUpdateProduct({ videos }))} entityName={currentProduct.hero?.name} entityType="product" industry={(currentProduct as any).industry} websiteUrl={(currentProduct as any).websites?.[0]?.url} />;
      case 'assets': return <AssetsSection assets={currentProduct.assets} onAssetsChange={editHandler((assets) => handleUpdateProduct({ assets }))} websiteUrl={currentProduct.websites?.[0]?.url} entityId={currentProduct.id} entityType="product" />;
      case 'misuse': return <MisuseSection misuse={currentProduct.misuse} onMisuseChange={editHandler((misuse) => handleUpdateProduct({ misuse }))} entityId={currentProduct.id} entityType="product" />;
      case 'casestudies': return <CaseStudiesSection caseStudies={(currentProduct as any).caseStudies || []} onCaseStudiesChange={editHandler((caseStudies) => handleUpdateProduct({ caseStudies } as any))} entityId={currentProduct.id} entityType="product" brandLogos={currentProduct.logos} />;
      case 'brochures': return <DigitalCollateralSection collateral={currentProduct.brochures} onCollateralChange={editHandler((brochures) => handleUpdateProduct({ brochures }))} entityId={currentProduct.id} entityType="product" brandLogos={currentProduct.logos} />;
      case 'templates': return <TemplatesSection templates={currentProduct.templates} onTemplatesChange={editHandler((templates) => handleUpdateProduct({ templates }))} entityId={currentProduct.id} entityType="product" />;
      case 'templatespecs': return <TemplateSpecsSection templateSpecs={currentProduct.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => handleUpdateProduct({ templateSpecs }))} brandColors={currentProduct.colors || []} entityId={currentProduct.id} entityType="product" />;
      case 'products': return <ProductsSection productId={currentProduct.id} linkedGuides={currentProduct.linkedGuides || []} onLinkedGuidesChange={editHandler((linkedGuides) => handleUpdateProduct({ linkedGuides }))} />;
      case 'sponsorlogos': return <SponsorLogosSection sponsors={currentProduct.sponsorLogos || []} onSponsorsChange={editHandler((sponsorLogos) => handleUpdateProduct({ sponsorLogos }))} websiteUrl={currentProduct.websites?.[0]?.url} isEditable={canEdit} entityId={currentProduct.id} entityType="product" />;
      case 'clientlogos': return <ClientLogosSection clientLogos={currentProduct.clientLogos || []} onClientLogosChange={editHandler((clientLogos) => handleUpdateProduct({ clientLogos }))} entityId={currentProduct.id} entityType="product" />;
      case 'insights': return (
        <InsightsSection
          insights={(currentProduct as any).insights || []}
          layout={(currentProduct as any).insightsLayout}
          onInsightsChange={editHandler((insights) => handleUpdateProduct({ insights } as any))}
          onLayoutChange={canEdit ? (insightsLayout) => handleUpdateProduct({ insightsLayout } as any) : undefined}
          entityType="product"
          entityId={currentProduct.id}
          websites={currentProduct.websites}
          entityName={currentProduct.hero?.name}
          industry={currentProduct.identity?.archetype}
          organizationId={currentProduct.organizationId}
          brandContext={{ colors: currentProduct.colors?.map?.((c: any) => c.hex) || [], archetype: currentProduct.identity?.archetype, mission: currentProduct.identity?.missionStatement, tagline: currentProduct.hero?.tagline }}
          insightsAccessCode={(currentProduct as any).insightsAccessCode}
          onAccessCodeChange={canEdit ? (insightsAccessCode) => handleUpdateProduct({ insightsAccessCode } as any) : undefined}
        />
      );
      case 'logos': return <LogoSection logos={currentProduct.logos} onLogosChange={editHandler((logos) => handleUpdateProduct({ logos }))} entityId={currentProduct.id} entityType="product" logoDownloadLinks={currentProduct.logoDownloadLinks} onLogoDownloadLinksChange={editHandler((logoDownloadLinks) => handleUpdateProduct({ logoDownloadLinks }))} />;
      case 'imageassets': return <ImageAssetsSection imageAssets={(currentProduct as any).imageAssets || []} onImageAssetsChange={editHandler((imageAssets) => handleUpdateProduct({ imageAssets } as any))} imageryAvoidList={(currentProduct as any).imageryAvoidList || []} onImageryAvoidListChange={editHandler((imageryAvoidList) => handleUpdateProduct({ imageryAvoidList } as any))} />;
      case 'webinars': return <WebinarSeriesSection webinars={(currentProduct as any).webinars || []} onWebinarsChange={editHandler((webinars) => handleUpdateProduct({ webinars } as any))} entityName={currentProduct.hero?.name} entityType="product" industry={(currentProduct as any).industry} websiteUrl={(currentProduct as any).websites?.[0]?.url} />;
      case 'awards': return <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}><AwardsSection awards={(currentProduct as any).awards || []} onUpdate={editHandler((awards) => handleUpdateProduct({ awards } as any))} entityType="product" entityId={currentProduct.id} /></Suspense>;
      case 'events': return <EventsSection brandId={currentProduct.id} />;
      case 'universe': return <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>}><GlobalLinkUniverseSection linkedGuides={currentProduct.linkedGuides || []} primaryColor={currentProduct.colors?.[0]?.hex} /></Suspense>;
      case 'eventsignage': return <BrandEventSignageSection eventSignage={(currentProduct as any).eventSignage || []} onEventSignageChange={editHandler((eventSignage) => handleUpdateProduct({ eventSignage } as any))} isAdmin={isGuideAdmin} />;
      case 'presentations': return <PresentationTemplatesSection presentations={(currentProduct as any).presentations || []} onUpdate={canEdit ? (presentations) => handleUpdateProduct({ presentations } as any) : undefined} isEditable={canEdit} />;
      case 'approvedimagery': return <ApprovedImagerySection approvedImagery={(currentProduct as any).approvedImagery} onApprovedImageryChange={editHandler((approvedImagery) => handleUpdateProduct({ approvedImagery } as any))} canEdit={canEdit} entityId={currentProduct.id} entityType="product" organizationId={currentProduct.organizationId} />;
      case 'studios': return <StudiosSection studios={(currentProduct as any).studios || []} onStudiosChange={editHandler((studios) => handleUpdateProduct({ studios } as any))} entityId={currentProduct.id} />;
      case 'locations': return (
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading map...</div>}>
          <LeafletLocationsSection
            locations={(currentProduct as any).locations || []}
            locationStats={(currentProduct as any).locationStats || []}
            onLocationsChange={editHandler((locations) => handleUpdateProduct({ locations } as any))}
            onLocationStatsChange={editHandler((locationStats) => handleUpdateProduct({ locationStats } as any))}
            accentColor={currentProduct.colors?.[0]?.hex}
          />
        </Suspense>
      );
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <UnsavedChangesBlocker />
      <div className="min-h-screen bg-background flex relative">
        {/* Desktop Sidebar - Hidden in cards mode */}
        {viewMode !== 'cards' && (
          <div className="hidden lg:block fixed top-0 left-0 h-screen w-72 z-30">
            <ReorderableBrandSidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
              brandName={currentProduct.hero.name}
              brandId={currentProduct.id}
              organizationId={currentProduct.organizationId}
              entityType="product"
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isGuideAdmin}
              showFavoritesOnly={showFavoritesOnly}
              onShowFavoritesOnlyChange={setShowFavoritesOnly}
            />
          </div>
        )}
        
        {/* Sidebar spacer for fixed positioning - Hidden in cards mode */}
        {viewMode !== 'cards' && (
          <div className="hidden lg:block w-72 flex-shrink-0" />
        )}

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <ReorderableBrandSidebar 
              activeSection={activeSection} 
              onSectionChange={(section) => { handleSectionChange(section); setSidebarOpen(false); }} 
              brandName={currentProduct.hero.name}
              brandId={currentProduct.id}
              organizationId={currentProduct.organizationId}
              entityType="product"
              sectionOrder={sectionOrder}
              onSectionOrderChange={handleSectionOrderChange}
              hiddenSections={hiddenSections}
              onHiddenSectionsChange={handleHiddenSectionsChange}
              isAdmin={isGuideAdmin}
              showFavoritesOnly={showFavoritesOnly}
              onShowFavoritesOnlyChange={setShowFavoritesOnly}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Back to Dashboard</TooltipContent>
                </Tooltip>
                <button 
                  onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img 
                    src={theme === 'dark' ? tpLogoWhite : tpLogoColor} 
                    alt="BrandHUB" 
                    className="h-6 w-6 object-contain flex-shrink-0" 
                  />
                  <span className="font-semibold text-foreground hidden sm:inline">
                    Brand<span className="text-accent">HUB</span>
                  </span>
                </button>
                <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Package className="h-3 w-3" />
                    Product
                  </Badge>
                  <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">{currentProduct.hero.name}</span>
                  {canEdit && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                      Editing
                    </Badge>
                  )}
                  {canEdit && <SyncStatusIndicator compact />}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Regional Analysis Toolbar */}
                {currentProduct.organizationId && (
                  <GlobalBrandToolbar
                    entityType="product"
                    entityId={currentProduct.id}
                    organizationId={currentProduct.organizationId}
                    isAdmin={isGuideAdmin}
                    onOpenAnalysis={() => setRegionalAnalysisOpen(true)}
                    className="hidden md:flex"
                  />
                )}
                {/* Language Selector (admin only) */}
                {isGuideAdmin && (
                  <GuideLanguageSelector
                    entityType="product"
                    entityId={currentProduct.id}
                    entityName={currentProduct.hero.name}
                    onOpenLocalizationPanel={() => setTranslationHubOpen(true)}
                  />
                )}
                {isGuideAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleFavorite(currentProduct.id, 'product')}
                      className={currentProduct.isFavorite ? 'text-amber-500' : ''}
                    >
                      <Star className={`h-5 w-5 ${currentProduct.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{currentProduct.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                </Tooltip>
                )}
                <ShareButton 
                  guideId={currentProduct.id} 
                  guideName={currentProduct.hero.name}
                  guideSlug={currentProduct.slug || undefined}
                  type="product"
                  isPublic={currentProduct.isPublic}
                  onPublicChange={(isPublic) => handleUpdateProduct({ isPublic })}
                  canEdit={canEdit || false}
                  organizationSlug={organization?.slug}
                />
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
                      <ToggleGroupItem value="cards" aria-label="Card grid view" className="h-8 w-8 data-[state=on]:bg-background">
                        <LayoutGrid className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Card Grid View</TooltipContent>
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
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.email}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {isAdmin ? (
                              <>
                                <Shield className="h-3 w-3 text-accent" />
                                <span className="text-accent">Admin</span>
                              </>
                            ) : orgRole ? (
                              <span className="capitalize">{orgRole}</span>
                            ) : (
                              'Member'
                            )}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Quick Navigation */}
                      <DropdownMenuItem onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')} className="gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                              navigate('/admin');
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </DropdownMenuItem>
                          {organization && (
                            <DropdownMenuItem onClick={() => navigate(`/org/${organization.slug}/settings`)} className="gap-2 cursor-pointer">
                              <Settings className="h-4 w-4" />
                              Organization Settings
                            </DropdownMenuItem>
                          )}
                          {organization && (
                            <DropdownMenuItem onClick={() => navigate(`/org/${organization.slug}/settings`)} className="gap-2 cursor-pointer">
                              <Users className="h-4 w-4" />
                              Manage Members
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/help')} className="gap-2 cursor-pointer">
                        <HelpCircle className="h-4 w-4" />
                        Help Center
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      >
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

          {/* Admin Toolbar - visible to members (analytics) and admins (full) */}
          <AdminToolbar
            isVisible={canViewAnalytics || false}
            guideType="product"
            hiddenSectionCount={canEdit ? hiddenSections.length : 0}
            actions={[
              {
                id: 'intelligence',
                label: 'Intelligence',
                icon: Brain,
                onClick: () => setIntelligenceOpen(true),
              },
              {
                id: 'competitive',
                label: 'Competitive',
                icon: TrendingUp,
                render: () => {
                  return (
                    <Suspense fallback={null}>
                      <CompetitiveReportCardLazy
                        entityType="product"
                        entityId={currentProduct.id}
                        entityName={currentProduct.hero.name}
                        organizationId={currentProduct.organizationId}
                      />
                    </Suspense>
                  );
                },
              },
              {
                id: 'audit',
                label: 'Audit',
                icon: ClipboardCheck,
                render: () => <BrandAuditButton brand={currentProduct} />,
              },
              // Admin-only actions below
              ...(canEdit ? [
                {
                  id: 'settings',
                  label: 'Page Settings',
                  icon: Settings,
                  render: () => (
                    <BrandPageSettingsEditor 
                      settings={pageSettings} 
                      onSettingsChange={handlePageSettingsChange}
                    />
                  ),
                },
                {
                  id: 'export',
                  label: 'Export PDF',
                  icon: Download,
                  render: () => <ExportPdfButton guide={currentProduct} />,
                },
                {
                  id: 'quick-backup',
                  label: 'Quick Backup',
                  icon: HardDrive,
                  render: () => <QuickBackupButton guide={currentProduct} />,
                },
                {
                  id: 'backups',
                  label: 'Manage Backups',
                  icon: HardDrive,
                  render: () => <BrandBackupManager guide={currentProduct} />,
                },
              ] as AdminToolbarAction[] : []),
            ]}
          />

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in ${getSectionSpacingClass()}`}>
              {/* Sticky Breadcrumbs */}
              <StickyBreadcrumbs
                homeHref={effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/'}
                items={[
                  { label: effectiveOrgName || 'Products', icon: effectiveOrgSlug ? Building2 : Package, href: effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/' },
                  // Parent brand (if linked via parent_brand_id)
                  ...(parentBrand ? [{ label: parentBrand.name, icon: Building2, href: `/brand/${parentBrand.slug}` }] : []),
                  // "Linked Guides" section link to parent's products section
                  ...(parentBrand ? [{ label: 'Linked Guides', icon: Package, href: `/brand/${parentBrand.slug}#products` }] : []),
                  // Parent product (if linked via linkedGuides in another product)
                  ...(parentProduct ? [{ label: parentProduct.name, icon: Package, href: `/product/${parentProduct.slug}` }] : []),
                  // "Linked Guides" section link to parent product's products section
                  ...(!parentBrand && parentProduct ? [{ label: 'Linked Guides', icon: Package, href: `/product/${parentProduct.slug}#products` }] : []),
                ]}
                currentPage={currentProduct.hero.name}
                currentIcon={Package}
              />
              
              {viewMode === 'cards' ? (
                <div className="animate-fade-in">
                  <SectionCardGrid
                    sectionOrder={sectionOrder}
                    hiddenSections={hiddenSections}
                    activeSection={activeSection}
                    onSectionSelect={(section) => { setActiveSection(section as SectionId); }}
                    isAdmin={isGuideAdmin}
                    cardViewBackground={pageSettings.cardViewBackground}
                    cardViewBackgroundTint={pageSettings.cardViewBackgroundTint}
                    onCardViewBackgroundChange={(bg, tint) => {
                      handlePageSettingsChange({
                        ...pageSettings,
                        cardViewBackground: bg,
                        cardViewBackgroundTint: tint,
                      });
                    }}
                    entityLightLogoUrl={pageSettings.cardViewLightLogo}
                    entityDarkLogoUrl={pageSettings.cardViewDarkLogo}
                    onEntityLogoChange={isGuideAdmin ? (variant: 'light' | 'dark', url: string) => {
                      handlePageSettingsChange({
                        ...pageSettings,
                        ...(variant === 'light' ? { cardViewLightLogo: url } : { cardViewDarkLogo: url }),
                      });
                    } : undefined}
                    entityName={currentProduct?.hero?.name}
                    entityTagline={currentProduct?.hero?.tagline}
                    healthScore={isGuideAdmin ? cardViewHealthScore : undefined}
                    complianceScore={isGuideAdmin ? complianceScores?.get(currentProduct.id)?.score : undefined}
                    onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined}
                    entityType="product"
                    entityId={currentProduct?.id}
                    onSectionsComputed={setGridSections}
                  />
                  {activeSection !== 'hero' && (
                    <>
                      <ActiveSectionHeader
                        activeSection={activeSection}
                        sectionOrder={sectionOrder}
                        hiddenSections={hiddenSections}
                        gridSections={gridSections}
                      />
                      <div className="animate-zoom-in">
                        {renderSection()}
                      </div>
                    </>
                  )}
                </div>
              ) : viewMode === 'sections' ? (
                renderSection()
              ) : (
                <FullBrandPage 
                  brand={currentProduct}
                  brandId={currentProduct.id}
                  organizationId={currentProduct.organizationId}
                  onBrandUpdate={handleUpdateProduct}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  isAdmin={isGuideAdmin}
                  canEdit={canEdit || false}
                  onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined}
                  entityType="product"
                />
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Section Navigation */}
      <MobileSectionNav
        sectionOrder={sectionOrder}
        hiddenSections={hiddenSections}
        activeSection={activeSection}
        onSectionSelect={handleSectionChange}
        brandName={currentProduct.hero.name}
        isAdmin={isGuideAdmin}
        onHiddenSectionsChange={handleHiddenSectionsChange}
      />
      
      {/* Back to top button */}
      <BackToTopButton />

      {/* Regional Analysis Panel (admin only) */}
      {isGuideAdmin && currentProduct.organizationId && (
        <RegionalAnalysisPanel
          entityType="product"
          entityId={currentProduct.id}
          organizationId={currentProduct.organizationId}
          guideData={currentProduct as unknown as Record<string, unknown>}
          isOpen={regionalAnalysisOpen}
          onOpenChange={setRegionalAnalysisOpen}
        />
      )}

      {/* Translation Hub */}
      <TranslationHub
        open={translationHubOpen}
        onOpenChange={setTranslationHubOpen}
        entityId={currentProduct.id}
        entityType="product"
        entityName={currentProduct.hero.name}
      />

      {/* Intelligence Panel - rendered at top level so hero button works */}
      <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-6 flex-1 min-h-0">
            <BrandIntelligencePanel
              entityType="product"
              entityId={currentProduct.id}
              entityName={currentProduct.hero.name}
              organizationId={currentProduct.organizationId}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Brand Assistant Floating Button */}
      {canEdit && (
        <>
          <Button
            onClick={() => setAssistantOpen(true)}
            className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-0"
            aria-label="Open Brand Assistant"
          >
            <Bot className="h-5 w-5" />
          </Button>
          <Suspense fallback={null}>
            <BrandAssistant
              open={assistantOpen}
              onOpenChange={setAssistantOpen}
              entityType="product"
              entityId={currentProduct.id}
              entityName={currentProduct.hero.name}
            />
          </Suspense>
        </>
      )}
    </TooltipProvider>
  );
};

export default ProductEditor;
