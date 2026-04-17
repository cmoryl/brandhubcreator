import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Menu, LayoutList, ScrollText, LayoutGrid, ArrowLeft, Lock, Shield, LogOut, Star, Brain, FileText, Building2, Download, Settings, HardDrive, ClipboardCheck, TrendingUp, LayoutDashboard, Users, HelpCircle, Globe2, Languages, MapPin, Zap, Bot, ImageIcon } from 'lucide-react';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';
import { SectionId, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, BrandPageSettings, BrandGuide } from '@/types/brand';
import { GlobalBrandToolbar } from '@/components/brand/GlobalBrandToolbar';
import { RegionalAnalysisPanel } from '@/components/brand/RegionalAnalysisPanel';
import { UnsavedChangesBlocker } from '@/components/UnsavedChangesBlocker';
import { PublicLoadingScreen } from '@/components/PublicLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { normalizeBrandGuide } from '@/lib/guideNormalization';
import { calculateBrandHealth } from '@/lib/brandHealthCalculator';
import { useExternalSectionCounts } from '@/hooks/useExternalSectionCounts';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgSlug } from '@/hooks/useOrgSlug';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';
import { useSEO } from '@/hooks/useSEO';
import { useLatestComplianceScores } from '@/hooks/dataforce/useLatestComplianceScores';
import { trackEntityView } from '@/hooks/usePageTracking';
import { ReorderableBrandSidebar } from '@/components/brand/ReorderableBrandSidebar';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { ShareButton } from '@/components/brand/ShareButton';
import { HeroSection } from '@/components/brand/HeroSection';
import { TaglineSection } from '@/components/brand/TaglineSection';
import { IdentitySection } from '@/components/brand/IdentitySection';
import { ValuesSection } from '@/components/brand/ValuesSection';
import { ServicesSection } from '@/components/brand/ServicesSection';
import { RevenueChartSection } from '@/components/brand/RevenueChartSection';
import { ByTheNumbersSection } from '@/components/brand/ByTheNumbersSection';
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
import { DigitalCollateralSection } from '@/components/brand/DigitalCollateralSection';
import { TemplatesSection } from '@/components/brand/TemplatesSection';
import { TemplateSpecsSection } from '@/components/brand/TemplateSpecsSection';
import { ProductsSection } from '@/components/brand/ProductsSection';
import { WebinarSeriesSection } from '@/components/brand/WebinarSeriesSection';
import { SponsorLogosSection } from '@/components/brand/SponsorLogosSection';
import { ClientLogosSection } from '@/components/brand/ClientLogosSection';
import { InsightsSection } from '@/components/brand/InsightsSection';
import { EventsSection } from '@/components/brand/EventsSection';
import AwardsSection from '@/components/brand/AwardsSection';
import { ImageAssetsSection } from '@/components/brand/ImageAssetsSection';
import { GlobalLinkUniverseSection } from '@/components/brand/GlobalLinkUniverseSection';
import { BrandUniverseOrbit } from '@/components/brand/BrandUniverseOrbit';
import { BrandEventSignageSection } from '@/components/brand/BrandEventSignageSection';
import { PresentationTemplatesSection } from '@/components/brand/PresentationTemplatesSection';
import { ApprovedImagerySection } from '@/components/brand/approved-imagery/ApprovedImagerySection';
import { StudiosSection } from '@/components/brand/StudiosSection';
const LeafletLocationsSection = lazy(() => import('@/components/brand/LeafletLocationsSection').then(m => ({ default: m.LeafletLocationsSection })));
import { ExportPdfButton } from '@/components/brand/ExportPdfButton';
import { BrandAuditButton } from '@/components/brand/BrandAuditButton';
import { BrandPageSettingsEditor } from '@/components/brand/BrandPageSettingsEditor';
import { BrandIntelligencePanel } from '@/components/brand/BrandIntelligencePanel';
import { BrandBackupManager } from '@/components/brand/BrandBackupManager';
import { QuickBackupButton } from '@/components/brand/QuickBackupButton';
import { RegionalVariantWizard } from '@/components/brand/RegionalVariantWizard';
import { TranslationHub } from '@/components/brand/TranslationHub';
import { GlobalLinkWorkflowTrigger } from '@/components/brand/GlobalLinkWorkflowTrigger';
import { AdminToolbar, type AdminToolbarAction } from '@/components/admin/AdminToolbar';
import { StickyBreadcrumbs } from '@/components/StickyBreadcrumbs';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { GuideLanguageSelector } from '@/components/localization/GuideLanguageSelector';
import { HeroBackground } from '@/components/HeroBackground';
import { BackToTopButton } from '@/components/BackToTopButton';
const MobileSectionNav = lazy(() => import('@/components/brand/MobileSectionNav').then(m => ({ default: m.MobileSectionNav })));
import { SectionCardGrid } from '@/components/brand/SectionCardGrid';
import { ActiveSectionHeader } from '@/components/brand/ActiveSectionHeader';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { normalizeHiddenSections, normalizeSectionOrder } from '@/lib/sectionOrder';
import { useAutoBiasMonitoring } from '@/hooks/useAutoBiasMonitoring';
type ViewMode = 'sections' | 'full' | 'cards';

// Legacy/short slugs that may exist in old links, emails, or bookmarks.
// Keep this small and explicit to avoid unexpected matches.
const BRAND_SLUG_ALIASES: Record<string, string> = {
  lifesci: 'life-sciences',
  'life-sciences-brand': 'life-sciences',
};

const CompetitiveReportCardLazy = lazy(() =>
  import('@/components/brand/CompetitiveReportCard').then((m) => ({ default: m.CompetitiveReportCard }))
);
const BrandAssistant = lazy(() => import('@/components/dataforce/BrandAssistant').then(m => ({ default: m.BrandAssistant })));
const BrandAgentWidget = lazy(() => import('@/components/brand/BrandAgentWidget').then(m => ({ default: m.BrandAgentWidget })));

const BrandEditor = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const previousThemeRef = useRef<string | undefined>(undefined);
  const { getBrand, getBrandBySlug, updateBrand: updateBrandContext, toggleFavorite, isLoading, saveNow, refetch: refetchBrands } = useBrands();
  const { user, isAdmin, isApproved, signOut, isLoading: authLoading } = useAuth();
  const { userRole: orgRole, organization, isLoading: orgLoading } = useOrganization();
  
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [scrollToSection, setScrollToSection] = useState<SectionId | null>(null);
  const [gridSections, setGridSections] = useState<string[]>([]);
  const [publicBrand, setPublicBrand] = useState<BrandGuide | null>(null);
  // Start as true to prevent flash of "not found" before fetch begins
  const [publicBrandLoading, setPublicBrandLoading] = useState(true);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  // Regional analysis panel state
  const [regionalAnalysisOpen, setRegionalAnalysisOpen] = useState(false);
  // Regional variant wizard state
  const [regionalWizardOpen, setRegionalWizardOpen] = useState(false);
  // Translation hub state
  const [translationHubOpen, setTranslationHubOpen] = useState(false);
  // Parent brand for hierarchical breadcrumbs
  const [parentBrand, setParentBrand] = useState<{ id: string; name: string; slug: string } | null>(null);
  // Favorites filter state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // Brand Assistant state
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Redirect unapproved users to pending approval page (admins are always allowed)
  useEffect(() => {
    if (!authLoading && user && !isApproved && !isAdmin) {
      navigate('/pending-approval');
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  // Refetch brand data when page becomes visible (e.g. returning from Imagery Hub)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchBrands();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    refetchBrands();
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetchBrands]);

  // Ref for scroll-to-top on brand load (effect placed after `brand` is resolved)
  const hasScrolledForBrandRef = useRef<string | null>(null);

  // Handle hash anchor scrolling on page load/navigation
  useEffect(() => {
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
  useEffect(() => {
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
  useEffect(() => {
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
  const effectiveBrandSlug = useMemo(() => {
    if (!brandSlug) return undefined;
    if (isUUID(brandSlug)) return brandSlug;
    return BRAND_SLUG_ALIASES[brandSlug] ?? brandSlug;
  }, [brandSlug]);
  
  // Try to get brand from context by ID (for UUID) or by slug
  const contextBrand = useMemo(() => {
    if (!effectiveBrandSlug) return undefined;
    // First try as UUID for backwards compatibility
    if (isUUID(effectiveBrandSlug)) {
      return getBrand(effectiveBrandSlug);
    }
    // Try by slug using the effective (alias-resolved) slug
    return getBrandBySlug(effectiveBrandSlug);
  }, [effectiveBrandSlug, getBrand, getBrandBySlug]);
  
  // Fetch public brand directly if not in context
  // IMPORTANT: Don't wait for authLoading/isLoading - fetch public data immediately
  // This ensures public visitors aren't blocked by auth checks
  const hasFetchedPublicRef = useRef<string | null>(null);
  
  useEffect(() => {
    const fetchPublicBrand = async () => {
      // Skip if we already have the brand from context OR already fetched this slug
      if (!effectiveBrandSlug || contextBrand || hasFetchedPublicRef.current === effectiveBrandSlug) {
        // Mark loading as done if we're skipping the fetch
        setPublicBrandLoading(false);
        return;
      }
      
      setPublicBrandLoading(true);
      hasFetchedPublicRef.current = effectiveBrandSlug;
      
      try {
        // Build query - try by slug first, then by ID for backwards compatibility
        let query = supabase
          .from('brands')
          .select('*')
          .eq('is_public', true);
        
        if (isUUID(effectiveBrandSlug)) {
          query = query.eq('id', effectiveBrandSlug);
        } else {
          query = query.eq('slug', effectiveBrandSlug);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (!error && data) {
          // If the user hit a legacy slug URL, normalize to canonical slug.
          if (brandSlug && !isUUID(brandSlug) && data.slug && data.slug !== brandSlug) {
            navigate(`/brand/${data.slug}`, { replace: true });
          }

          // Convert DB format to BrandGuide using centralized normalization
          const guideData = typeof data.guide_data === 'object' && data.guide_data ? data.guide_data : {};
          const brand = normalizeBrandGuide({
            ...guideData,
            id: data.id,
            slug: data.slug,
            organizationId: data.organization_id,
            isFavorite: data.is_favorite,
            isPublic: data.is_public,
            sectionOrder: data.section_order,
            hiddenSections: data.hidden_sections,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            // Ensure hero name is set from data.name if not in guide_data
            hero: { ...(guideData as any)?.hero, name: (guideData as any)?.hero?.name || data.name },
          });
          setPublicBrand(brand);
        }
      } catch (err) {
        console.error('Error fetching public brand:', err);
      } finally {
        setPublicBrandLoading(false);
      }
    };
    
    fetchPublicBrand();
  }, [brandSlug, effectiveBrandSlug, contextBrand, navigate]);
  
  // Use context brand if available, otherwise use fetched public brand
  const brand = contextBrand || publicBrand;

  // Scroll to top once when brand data finishes loading (unless there's a hash anchor).
  // Previously fired 8 times across 5s which intercepted navigation/breadcrumb clicks on
  // public/published views. A single instant scroll on first paint is sufficient.
  useEffect(() => {
    if (!brand?.id || location.hash) return;
    if (hasScrolledForBrandRef.current === brand.id) return;
    hasScrolledForBrandRef.current = brand.id;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [brand?.id, location.hash]);
  // Resolve org slug for breadcrumbs - always resolve from entity's organizationId
  const { orgSlug: resolvedOrgSlug, orgName: resolvedOrgName } = useOrgSlug(
    brand?.organizationId
  );
  const effectiveOrgSlug = resolvedOrgSlug || organization?.slug;
  const effectiveOrgName = resolvedOrgName || organization?.name;

  // Compliance scores
  const { data: complianceScores } = useLatestComplianceScores(brand?.organizationId);

  // Track brand view for analytics

  useEffect(() => {
    if (brand?.id && user?.id) {
      trackEntityView(user.id, 'brand', brand.id, brand.hero?.name || 'Unknown Brand');
    }
  }, [brand?.id, user?.id]);
  // Fetch parent brand for sub-brands (check if any master brand has this brand in linkedGuides)
  useEffect(() => {
    const fetchParentBrand = async () => {
      if (!brand?.id) return;
      
      try {
        // Query all brands to find any that reference this brand in linkedGuides
        const { data: masterBrands, error } = await supabase
          .from('brands')
          .select('id, name, slug, guide_data');
        
        if (error) throw error;
        
        // Check each master brand's linkedGuides for our current brand
        for (const masterBrand of masterBrands || []) {
          // Skip if this is the same brand
          if (masterBrand.id === brand.id) continue;
          
          const guideData = masterBrand.guide_data as any;
          const linkedGuides = guideData?.linkedGuides || [];
          
          // Handle both formats:
          // - Newer format: { id, name, slug, type }
          // - Legacy format: { guideId, guideType, id } where id is the link entry id
          const isLinked = linkedGuides.some((lg: any) => {
            // Check if it's a brand type link
            const isBrandType = lg.type === 'brand' || lg.guideType === 'brand';
            if (!isBrandType) return false;
            
            // Check if it references our current brand
            const linkedId = lg.guideId || lg.id; // guideId for legacy, id for newer
            return linkedId === brand.id || lg.slug === brand.slug;
          });
          
          if (isLinked) {
            setParentBrand({
              id: masterBrand.id,
              name: masterBrand.name,
              slug: masterBrand.slug || masterBrand.id,
            });
            return;
          }
        }
        
        // No parent found
        setParentBrand(null);
      } catch (err) {
        console.error('Error fetching parent brand:', err);
      }
    };
    
    fetchParentBrand();
  }, [brand?.id, brand?.slug]);
  // If we are rendering a brand that came from the public fetch fallback (not in BrandContext),
  // edits need to persist via a direct update from this page.
  const syncPublicBrandToDb = useCallback(async (merged: BrandGuide) => {
    try {
      const {
        id,
        type,
        slug,
        organizationId,
        isFavorite,
        isPublic,
        sectionOrder,
        hiddenSections,
        createdAt,
        updatedAt,
        ...cleanGuideData
      } = merged as unknown as BrandGuide & Record<string, unknown>;

      const { error } = await supabase
        .from('brands')
        .update({
          name: merged.hero?.name || 'Brand',
          guide_data: cleanGuideData as unknown as Json,
          section_order: (merged.sectionOrder as string[] | null) ?? null,
          hidden_sections: (merged.hiddenSections as string[] | null) ?? null,
        })
        .eq('id', merged.id);

      if (error) {
        console.error('[BrandEditor] Failed to save public-fallback brand updates:', error);
      }
    } catch (err) {
      console.error('[BrandEditor] Exception saving public-fallback brand updates:', err);
    }
  }, []);

  const applyBrandUpdates = useCallback((updates: Parameters<typeof updateBrandContext>[1]) => {
    if (!brand) return;

    const maybeHero = (updates as any)?.hero;

    // Normal path: editable brand is in BrandContext
    if (contextBrand) {
      updateBrandContext(brand.id, updates);

      // Ken Burns is commonly toggled and then the page is refreshed immediately to verify.
      // Force an immediate save to avoid losing the change due to debounced sync.
      if (maybeHero && typeof maybeHero === 'object' && 'kenBurnsEffect' in maybeHero) {
        void saveNow();
      }
      return;
    }

    // Fallback path: brand is coming from the public fetch state
    const merged = { ...brand, ...updates, updatedAt: new Date() } as BrandGuide;
    setPublicBrand(merged);
    void syncPublicBrandToDb(merged);
  }, [brand, contextBrand, syncPublicBrandToDb, updateBrandContext]);
  
  // Use centralized admin detection hook for consistent behavior across all editors
  const { isGuideAdmin, canEdit, canViewAnalytics } = useGuideAdmin({ 
    entityOrgId: brand?.organizationId 
  });
  
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

  // External insight source counts for accurate health scoring
  // Re-fetch when brand updates (updatedAt changes) for live health meter
  const brandRefreshTrigger = brand?.updatedAt ? new Date(String(brand.updatedAt)).getTime() : 0;
  const { counts: externalCounts } = useExternalSectionCounts(brand?.id, 'brand', brandRefreshTrigger);

  // Calculate brand health for card view
  const cardViewHealthScore = useMemo(() => {
    if (!brand) return undefined;
    const health = calculateBrandHealth(brand as unknown as Record<string, unknown>, hiddenSections, 'brand', sectionOrder, externalCounts);
    return health.overallScore;
  }, [brand, hiddenSections, sectionOrder, externalCounts]);

  // Continuous bias monitoring — triggers scan on content changes
  // MUST be called before any early returns to respect Rules of Hooks
  const { triggerMonitor: triggerBiasMonitor } = useAutoBiasMonitoring({
    organizationId: brand?.organizationId,
    entityType: 'brand',
    entityId: brand?.id || '',
    entityName: brand?.hero?.name || '',
    enabled: canEdit && Boolean(brand?.id),
  });

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
      applyBrandUpdates({ pageSettings: newSettings });
    }
  }, [brand, applyBrandUpdates]);

  const handleSectionOrderChange = useCallback((newOrder: SectionId[]) => {
    if (brand) {
      applyBrandUpdates({ sectionOrder: newOrder });
    }
  }, [brand, applyBrandUpdates]);

  // Auto-heal persisted sectionOrder when new sections are introduced
  useEffect(() => {
    if (!brand || !isGuideAdmin) return;
    const current = Array.isArray(brand.sectionOrder) ? brand.sectionOrder : [];
    const normalized = normalizeSectionOrder(current);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      applyBrandUpdates({ sectionOrder: normalized });
    }
  }, [brand?.id, brand?.sectionOrder, isGuideAdmin, applyBrandUpdates]);

  const handleHiddenSectionsChange = useCallback((newHiddenSections: SectionId[]) => {
    if (brand) {
      applyBrandUpdates({ hiddenSections: newHiddenSections });
    }
  }, [brand, applyBrandUpdates]);

  // Auto-heal invalid hidden sections (e.g., ids removed/renamed)
  useEffect(() => {
    if (!brand || !isGuideAdmin) return;
    const current = Array.isArray(brand.hiddenSections) ? brand.hiddenSections : [];
    const normalized = normalizeHiddenSections(current, sectionOrder);
    const isDifferent =
      current.length !== normalized.length || current.some((id, i) => id !== normalized[i]);
    if (isDifferent) {
      applyBrandUpdates({ hiddenSections: normalized });
    }
  }, [brand?.id, brand?.hiddenSections, sectionOrder, isGuideAdmin, applyBrandUpdates]);

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

  // Optimized loading: prevents flash for fast loads, smooth transition for slow ones
  // Key insight: show loading until we KNOW we have data or KNOW data doesn't exist
  const hasFetchedPublic = hasFetchedPublicRef.current === effectiveBrandSlug;
  const needsPublicData = !contextBrand && !publicBrand;
  // Show loading if: we need public data AND (still loading OR haven't even started fetching yet)
  const rawLoading = needsPublicData && (publicBrandLoading || !hasFetchedPublic);
  const stableLoading = useStableLoading(rawLoading, {
    showDelay: 100,      // Wait 100ms before showing loading
    minDisplayTime: 300, // Show for at least 300ms once visible
    maxLoadingTime: 6000
  });

  // Show loading state - AFTER all hooks
  // Use guide name if known for better UX
  if (stableLoading) {
    return (
      <PublicLoadingScreen 
        type="brand" 
        name={publicBrand?.hero?.name || brandSlug}
        organizationName={organization?.name}
      />
    );
  }

  // Not found state - only show AFTER we've completed fetch and have no data
  if (!brand && hasFetchedPublic && !publicBrandLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Brand not found</h1>
          <p className="text-muted-foreground mb-4">The brand you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(organization ? `/org/${organization.slug}` : '/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {organization ? `Back to ${organization.name}` : 'Back to Brands'}
          </Button>
        </div>
      </div>
    );
  }

  // Final guard - if somehow we still have no brand, show loading
  if (!brand) {
    return (
      <PublicLoadingScreen 
        type="brand" 
        name={brandSlug}
        organizationName={organization?.name}
      />
    );
  }

  // (hook moved above early returns to respect Rules of Hooks)

  const updateBrand = (updates: Parameters<typeof updateBrandContext>[1]) => {
    applyBrandUpdates(updates);
    // Feed content changes to continuous bias monitor
    if (brand) {
      triggerBiasMonitor({ ...brand, ...updates } as unknown as Record<string, unknown>);
    }
  };

  const renderSection = () => {
    // Helper to conditionally create change handler - when canEdit is false, editing is disabled
    const editHandler = <T,>(handler: (value: T) => void) => canEdit ? handler : undefined;
    
    switch (activeSection) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={editHandler((hero) => updateBrand({ hero }))} onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined} guideData={brand as unknown as Record<string, unknown>} entityType="brand" entityId={brand.id} complianceScore={complianceScores?.get(brand.id)?.score} hiddenSections={hiddenSections} sectionOrder={sectionOrder} compact={viewMode === 'cards'} />;
      case 'tagline': return <TaglineSection tagline={brand.tagline} onTaglineChange={editHandler((tagline) => updateBrand({ tagline }))} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={editHandler((identity) => updateBrand({ identity }))} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={editHandler((values) => updateBrand({ values }))} organizationId={brand.organizationId} brandId={brand.id} brandName={brand.hero.name} canEdit={canEdit} />;
      case 'bythenumbers': return <ByTheNumbersSection statistics={brand.statistics || []} onStatisticsChange={editHandler((statistics) => updateBrand({ statistics }))} brandName={brand.hero.name} infographicLayout={brand.infographicLayout || 'infographic'} onLayoutChange={canEdit ? (infographicLayout) => updateBrand({ infographicLayout }) : undefined} brandColors={brand.colors || []} />;
      case 'services': return <ServicesSection services={brand.services || []} onServicesChange={editHandler((services) => updateBrand({ services }))} entityId={brand.id} entityType="brand" />;
      case 'revenue': return <RevenueChartSection revenueData={brand.revenueData} onRevenueDataChange={editHandler((revenueData) => updateBrand({ revenueData }))} brandName={brand.hero.name} chartTheme={brand.chartTheme} onChartThemeChange={editHandler((chartTheme) => updateBrand({ chartTheme }))} brandColors={brand.colors || []} />;
      case 'webinars': return <WebinarSeriesSection webinars={brand.webinars || []} onWebinarsChange={editHandler((webinars) => updateBrand({ webinars }))} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={editHandler((logos) => updateBrand({ logos }))} entityId={brand.id} entityType="brand" logoDownloadLinks={brand.logoDownloadLinks} onLogoDownloadLinksChange={editHandler((logoDownloadLinks) => updateBrand({ logoDownloadLinks }))} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={editHandler((brandIcons) => updateBrand({ brandIcons }))} entityId={brand.id} entityType="brand" />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={editHandler((colors) => updateBrand({ colors }))} colorCombinations={brand.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => updateBrand({ colorCombinations }))} brandName={brand.hero.name} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={editHandler((gradients) => updateBrand({ gradients }))} brandName={brand.hero.name} brandColors={brand.colors} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={editHandler((patterns) => updateBrand({ patterns }))} brandName={brand.hero.name} brandColors={brand.colors} brandTagline={brand.tagline?.primary} brandArchetype={brand.identity?.archetype} brandSlug={brand.slug} customShapes={brand.customShapes} onCustomShapesChange={canEdit ? (customShapes) => updateBrand({ customShapes }) : undefined} entityId={brand.id} entityType="brand" />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={editHandler((typography) => updateBrand({ typography }))} isAdmin={isGuideAdmin} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={editHandler((textStyles) => updateBrand({ textStyles }))} adminCustomStyle={brand.adminCustomStyle} onAdminCustomStyleChange={canEdit ? (adminCustomStyle) => updateBrand({ adminCustomStyle }) : undefined} canEdit={canEdit} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={editHandler((iconography) => updateBrand({ iconography }))} defaultIconColor={brand.defaultIconColor} onDefaultIconColorChange={editHandler((defaultIconColor) => updateBrand({ defaultIconColor }))} brandColors={brand.colors?.map(c => ({ hex: c.hex, name: c.name })) || []} organizationId={organization?.id} brandId={brand.id} entityType="brand" entityName={brand.hero?.name || ''} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={editHandler((socialIcons) => updateBrand({ socialIcons }))} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={editHandler((imagery) => updateBrand({ imagery }))} entityId={brand.id} entityType="brand" isAdmin={isGuideAdmin} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={editHandler((social) => updateBrand({ social }))} entityId={brand.id} entityType="brand" organizationId={brand.organizationId} entityName={brand.hero?.name} />;
      case 'socialassets': return (
        <SocialAssetsSection
          socialAssets={brand.socialAssets || []}
          onSocialAssetsChange={editHandler((socialAssets) => updateBrand({ socialAssets }))}
            
        />
      );
      case 'website': return <WebsiteSection websites={brand.websites} onWebsitesChange={editHandler((websites) => updateBrand({ websites }))} entityType="brand" entityId={brand.id} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={editHandler((signatures) => updateBrand({ signatures }))} emailBanners={brand.emailBanners || []} onEmailBannersChange={editHandler((emailBanners) => updateBrand({ emailBanners }))} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={editHandler((qr) => updateBrand({ qr }))} entityType="brand" entityId={brand.id} logos={brand.logos} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={editHandler((videos) => updateBrand({ videos }))} entityName={brand.hero?.name} entityType="brand" industry={(brand as any).industry} websiteUrl={brand.websites?.[0]?.url} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={editHandler((assets) => updateBrand({ assets }))} websiteUrl={brand.websites?.[0]?.url} entityId={brand.id} entityType="brand" />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={editHandler((misuse) => updateBrand({ misuse }))} entityId={brand.id} entityType="brand" />;
      case 'casestudies': 
      case 'brochures': return <DigitalCollateralSection collateral={brand.brochures} onCollateralChange={editHandler((brochures) => updateBrand({ brochures }))} entityId={brand.id} entityType="brand" />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={editHandler((templates) => updateBrand({ templates }))} entityId={brand.id} entityType="brand" />;
      case 'templatespecs': return <TemplateSpecsSection templateSpecs={brand.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => updateBrand({ templateSpecs }))} brandColors={brand.colors || []} entityId={brand.id} entityType="brand" />;
      case 'products': return <ProductsSection brandId={brand.id} />;
      case 'sponsorlogos': return <SponsorLogosSection sponsors={brand.sponsorLogos || []} onSponsorsChange={editHandler((sponsorLogos) => updateBrand({ sponsorLogos }))} websiteUrl={brand.websites?.[0]?.url} isEditable={canEdit} entityId={brand.id} entityType="brand" />;
      case 'clientlogos': return <ClientLogosSection clientLogos={brand.clientLogos || []} onClientLogosChange={editHandler((clientLogos) => updateBrand({ clientLogos }))} entityId={brand.id} entityType="brand" />;
      case 'insights': return (
        <InsightsSection
          insights={brand.insights || []}
          layout={brand.insightsLayout}
          onInsightsChange={editHandler((insights) => updateBrand({ insights }))}
          onLayoutChange={canEdit ? (insightsLayout) => updateBrand({ insightsLayout }) : undefined}
          entityType="brand"
          entityId={brand.id}
          websites={brand.websites}
          entityName={brand.hero?.name}
          organizationId={organization?.id}
          brandContext={{
            colors: brand.colors?.map(c => c.hex),
            archetype: brand.identity?.archetype,
            mission: brand.identity?.missionStatement,
            tagline: brand.tagline?.primary,
          }}
          insightsAccessCode={brand.insightsAccessCode}
          onAccessCodeChange={canEdit ? (insightsAccessCode) => updateBrand({ insightsAccessCode }) : undefined}
        />
      );
      case 'locations': return (
        <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading map...</div>}>
          <LeafletLocationsSection
            locations={brand.locations || []}
            locationStats={brand.locationStats || []}
            onLocationsChange={editHandler((locations) => updateBrand({ locations }))}
            onLocationStatsChange={editHandler((locationStats) => updateBrand({ locationStats }))}
            accentColor={brand.colors?.[0]?.hex}
            sectionTitle={brand.locationsSectionTitle}
            sectionDescription={brand.locationsSectionDescription}
            onSectionTitleChange={canEdit ? (locationsSectionTitle: string) => updateBrand({ locationsSectionTitle }) : undefined}
            onSectionDescriptionChange={canEdit ? (locationsSectionDescription: string) => updateBrand({ locationsSectionDescription }) : undefined}
            useSharedLocations={brand.useSharedLocations ?? false}
            onUseSharedLocationsChange={canEdit ? (useSharedLocations: boolean) => updateBrand({ useSharedLocations }) : undefined}
          />
        </Suspense>
      );
      case 'awards': return <AwardsSection awards={brand.awards || []} onUpdate={editHandler((awards) => updateBrand({ awards }))} entityType="brand" entityId={brand.id} />;
      case 'imageassets': return <ImageAssetsSection imageAssets={brand.imageAssets || []} onImageAssetsChange={editHandler((imageAssets) => updateBrand({ imageAssets }))} canEdit={canEdit} entityId={brand.id} entityType="brand" />;
      case 'events': return <EventsSection brandId={brand.id} canEdit={canEdit} />;
      case 'eventsignage': return <BrandEventSignageSection eventSignage={brand.eventSignage || []} onEventSignageChange={editHandler((eventSignage) => updateBrand({ eventSignage }))} linkedBooths={brand.linkedBooths || []} onLinkedBoothsChange={editHandler((linkedBooths) => updateBrand({ linkedBooths }))} brandColors={brand.colors || []} isAdmin={isGuideAdmin} />;
      case 'universe': 
        if (brand.linkedGuides && brand.linkedGuides.length > 0) {
          return <GlobalLinkUniverseSection linkedGuides={brand.linkedGuides} primaryColor={brand.colors?.[0]?.hex} />;
        }
        return <BrandUniverseOrbit organizationId={brand.organizationId} brandColors={brand.colors} organizationName={brand.hero?.name} />;
      case 'presentations': return <PresentationTemplatesSection presentations={brand.presentationTemplates || []} onUpdate={editHandler((presentationTemplates) => updateBrand({ presentationTemplates }))} />;
      case 'approvedimagery':
        return <ApprovedImagerySection approvedImagery={brand.approvedImagery} onApprovedImageryChange={editHandler((approvedImagery) => updateBrand({ approvedImagery }))} canEdit={canEdit} entityId={brand.id} entityType="brand" organizationId={brand.organizationId} />;
      case 'studios':
        return <StudiosSection studios={brand.studios || []} onStudiosChange={editHandler((studios) => updateBrand({ studios }))} entityId={brand.id} />;
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

        {/* Desktop Sidebar - Hidden in cards mode */}
        {viewMode !== 'cards' && (
          <div className="hidden lg:block fixed top-0 left-0 h-screen w-72 z-30">
            <ReorderableBrandSidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
              brandName={brand.hero.name}
              brandId={brand.id}
              organizationId={brand.organizationId}
              entityType="brand"
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
              brandName={brand.hero.name}
              brandId={brand.id}
              organizationId={brand.organizationId}
              entityType="brand"
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
          {/* Header - Always shown for consistent navigation */}
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
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Regional Analysis Toolbar */}
                {brand.organizationId && (
                  <GlobalBrandToolbar
                    entityType="brand"
                    entityId={brand.id}
                    organizationId={brand.organizationId}
                    isAdmin={isGuideAdmin}
                    onOpenAnalysis={() => setRegionalAnalysisOpen(true)}
                    className="hidden md:flex"
                  />
                )}
                {/* Language Selector - Globe icon for translations (admin only) */}
                {isGuideAdmin && (
                  <GuideLanguageSelector
                    entityType="brand"
                    entityId={brand.id}
                    entityName={brand.hero.name}
                    onOpenLocalizationPanel={() => setTranslationHubOpen(true)}
                  />
                )}
                {isGuideAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => toggleFavorite(brand.id, 'brand')}
                      className={brand.isFavorite ? 'text-amber-500' : ''}
                    >
                      <Star className={`h-5 w-5 ${brand.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{brand.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
                </Tooltip>
                )}
                <ShareButton 
                  guideId={brand.id} 
                  guideName={brand.hero.name}
                  guideSlug={brand.slug || undefined}
                  type="brand" 
                  isPublic={brand.isPublic}
                  onPublicChange={(isPublic) => updateBrand({ isPublic })}
                  canEdit={canEdit || false}
                  organizationSlug={organization?.slug}
                  existingShareToken={brand.shareToken}
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
                          <DropdownMenuItem onClick={() => navigate('/admin')} className="gap-2 cursor-pointer">
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
                      
                      {isGuideAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/imagery-hub')} className="gap-2 cursor-pointer">
                            <ImageIcon className="h-4 w-4" />
                            Imagery Hub
                          </DropdownMenuItem>
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
            guideType="brand"
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
                    <Suspense fallback={<div className="p-6 animate-pulse"><div className="h-48 w-full rounded-md bg-muted" /></div>}>
                      <CompetitiveReportCardLazy
                        entityType="brand"
                        entityId={brand.id}
                        entityName={brand.hero.name}
                        organizationId={brand.organizationId}
                      />
                    </Suspense>
                  );
                },
              },
              {
                id: 'audit',
                label: 'Audit',
                icon: ClipboardCheck,
                render: () => <BrandAuditButton brand={brand} />,
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
                  render: () => <ExportPdfButton guide={brand} />,
                },
                {
                  id: 'quick-backup',
                  label: 'Quick Backup',
                  icon: HardDrive,
                  render: () => <QuickBackupButton guide={brand} />,
                },
                {
                  id: 'backups',
                  label: 'Manage Backups',
                  icon: HardDrive,
                  render: () => <BrandBackupManager guide={brand} />,
                },
                {
                  id: 'regional',
                  label: 'Regional Variants',
                  icon: MapPin,
                  onClick: () => setRegionalWizardOpen(true),
                },
                {
                  id: 'translations',
                  label: 'Translations',
                  icon: Languages,
                  onClick: () => setTranslationHubOpen(true),
                },
                {
                  id: 'workflow',
                  label: 'GlobalLink Workflow',
                  icon: Zap,
                  render: () => organization?.id ? (
                    <GlobalLinkWorkflowTrigger
                      entityId={brand.id}
                      entityType="brand"
                      entityName={brand.hero.name}
                      organizationId={organization.id}
                    />
                  ) : null,
                },
              ] as AdminToolbarAction[] : []),
            ]}
          />

          {/* Regional Variant Wizard */}
          <RegionalVariantWizard
            open={regionalWizardOpen}
            onOpenChange={setRegionalWizardOpen}
            entityId={brand.id}
            entityType="brand"
            entityName={brand.hero.name}
            organizationId={brand.organizationId}
          />

          {/* Translation Hub */}
          <TranslationHub
            open={translationHubOpen}
            onOpenChange={setTranslationHubOpen}
            entityId={brand.id}
            entityType="brand"
            entityName={brand.hero.name}
            organizationId={brand.organizationId}
          />

          {/* Content */}
          <main className="flex-1 pt-2 px-4 pb-4 sm:pt-2 sm:px-6 sm:pb-6 lg:pt-3 lg:px-8 lg:pb-8 overflow-x-hidden">
            <div className={`${getContentWidthClass()} mx-auto animate-fade-in-up ${getSectionSpacingClass()}`}>
              {/* Sticky Breadcrumbs */}
              <StickyBreadcrumbs
                homeHref={effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/'}
                items={[
                  { label: effectiveOrgName || 'Brands', icon: effectiveOrgSlug ? Building2 : FileText, href: effectiveOrgSlug ? `/org/${effectiveOrgSlug}` : '/' },
                  // Only show parent brand breadcrumb if:
                  // 1. There is a parent brand, AND
                  // 2. It's not the same entity name as the org (avoid "TransPerfect > TransPerfect > Games")
                  //    When org and master brand share a name, showing both is redundant
                  ...(parentBrand && (!effectiveOrgName || parentBrand.name.toLowerCase() !== effectiveOrgName.toLowerCase()) 
                    ? [{ label: parentBrand.name, icon: FileText, href: `/brand/${parentBrand.slug}` }] 
                    : []),
                ]}
                currentPage={brand.hero.name}
                currentIcon={FileText}
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
                    onEntityLogoChange={canEdit ? (variant: 'light' | 'dark', url: string) => {
                      handlePageSettingsChange({
                        ...pageSettings,
                        ...(variant === 'light' ? { cardViewLightLogo: url } : { cardViewDarkLogo: url }),
                      });
                    } : undefined}
                    entityName={brand?.hero?.name}
                    entityTagline={brand?.hero?.tagline}
                    healthScore={isGuideAdmin ? cardViewHealthScore : undefined}
                    complianceScore={isGuideAdmin ? complianceScores?.get(brand.id)?.score : undefined}
                    onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined}
                    entityType="brand"
                    entityId={brand?.id}
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
                <div className="animate-zoom-in">
                  {renderSection()}
                </div>
              ) : (
                <FullBrandPage 
                  brand={brand}
                  brandId={brand.id}
                  organizationId={brand.organizationId}
                  onBrandUpdate={updateBrand}
                  scrollToSection={scrollToSection}
                  onSectionVisible={handleSectionVisible}
                  sectionOrder={sectionOrder}
                  hiddenSections={hiddenSections}
                  isAdmin={isGuideAdmin}
                  canEdit={canEdit || false}
                  heroFullWidth={pageSettings.heroFullWidth}
                  onOpenIntelligence={canViewAnalytics ? () => setIntelligenceOpen(true) : undefined}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile Section Navigation */}
      <Suspense fallback={null}>
        <MobileSectionNav
          sectionOrder={sectionOrder}
          hiddenSections={hiddenSections}
          activeSection={activeSection}
          onSectionSelect={handleSectionChange}
          brandName={brand.hero.name}
          isAdmin={isGuideAdmin}
          onHiddenSectionsChange={handleHiddenSectionsChange}
        />
      </Suspense>
      
      {/* Back to top button */}
      <BackToTopButton />

      {/* Regional Analysis Panel (admin only) */}
      {isGuideAdmin && brand.organizationId && (
        <RegionalAnalysisPanel
          entityType="brand"
          entityId={brand.id}
          organizationId={brand.organizationId}
          guideData={brand as unknown as Record<string, unknown>}
          isOpen={regionalAnalysisOpen}
          onOpenChange={setRegionalAnalysisOpen}
        />
      )}

      {/* Intelligence Panel - rendered at top level so hero button works */}
      <Sheet open={intelligenceOpen} onOpenChange={setIntelligenceOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-xl p-0 flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-6 flex-1 min-h-0">
            <BrandIntelligencePanel
              entityType="brand"
              entityId={brand.id}
              entityName={brand.hero.name}
              organizationId={brand.organizationId}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Brand Assistant Floating Button (admin) */}
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
              entityType="brand"
              entityId={brand.id}
              entityName={brand.hero.name}
            />
          </Suspense>
        </>
      )}

      {/* Per-Brand Agent Widget (all authenticated users) */}
      <Suspense fallback={null}>
        <BrandAgentWidget
          brandId={brand.id}
          brandName={brand.hero.name}
          primaryColor={brand.colors?.[0]?.hex}
        />
      </Suspense>
    </TooltipProvider>
  );
};

export default BrandEditor;
