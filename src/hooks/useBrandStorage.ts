import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandGuide, ProductGuide, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS, DEFAULT_TEMPLATE_SPECS, SectionId, BrandAward, BrandWebinar } from '@/types/brand';
import { DEFAULT_SOCIAL_ASSETS, DEFAULT_DISPLAY_BANNERS } from '@/lib/socialAssetDefaults';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { 
  safeArray, 
  safeObject, 
  normalizeTypography, 
  normalizeTemplates, 
  normalizeBrochures,
  normalizeGradients 
} from '@/lib/guideNormalization';
import { stripBase64FromGuideData } from '@/lib/stripBase64FromGuideData';
import { logger } from '@/lib/logger';

// Debounce delay for database syncing (ms)
const SYNC_DEBOUNCE_MS = 500;
interface DbBrand {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  slug: string | null;
  is_favorite: boolean;
  is_public: boolean;
  share_token: string | null;
  section_order: string[] | null;
  hidden_sections: string[] | null;
  guide_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbProduct {
  id: string;
  user_id: string;
  organization_id: string | null;
  parent_brand_id: string | null;
  name: string;
  slug: string | null;
  is_favorite: boolean;
  is_public: boolean;
  section_order: string[] | null;
  hidden_sections: string[] | null;
  guide_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const createDefaultGuideData = (name: string, type: 'brand' | 'product') => ({
  hero: { 
    name, 
    tagline: type === 'brand' ? 'Crafting exceptional experiences' : 'Innovative product experience', 
    coverImage: '', 
    logoUrl: '' 
  },
  tagline: { primary: '', secondary: '', variations: [] },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  logos: [],
  brandIcons: [],
  colors: type === 'brand' 
    ? [
        { id: '1', name: 'Primary', hex: '#1a1a2e', usage: 'Main brand color' },
        { id: '2', name: 'Secondary', hex: '#e94560', usage: 'Accent and CTAs' },
        { id: '3', name: 'Background', hex: '#f8f7f4', usage: 'Light backgrounds' },
      ]
    : [
        { id: '1', name: 'Primary', hex: '#2563eb', usage: 'Main product color' },
        { id: '2', name: 'Secondary', hex: '#10b981', usage: 'Accent and CTAs' },
        { id: '3', name: 'Background', hex: '#f8fafc', usage: 'Light backgrounds' },
      ],
  colorCombinations: [],
  gradients: [],
  patterns: [],
  typography: [
    { id: '1', name: 'Heading', fontFamily: 'Poppins, sans-serif', weight: '600', usage: 'Headlines and titles' },
    { id: '2', name: 'Body', fontFamily: 'Poppins, sans-serif', weight: '400', usage: 'Body text' },
  ],
  textStyles: [],
  iconography: [],
  socialIcons: [],
  imagery: [],
  social: [],
  // Pre-populated Social Assets & Display Banners
  socialAssets: DEFAULT_SOCIAL_ASSETS,
  displayBanners: DEFAULT_DISPLAY_BANNERS,
  websites: [],
  signatures: [],
  qr: { 
    defaultUrl: type === 'brand' ? 'https://yourbrand.com' : 'https://yourproduct.com', 
    fgColor: type === 'brand' ? '#1a1a2e' : '#2563eb', 
    bgColor: '#ffffff' 
  },
  videos: [],
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  caseStudies: [],
  brochures: [],
  templates: [],
  templateSpecs: DEFAULT_TEMPLATE_SPECS, // Pre-populated 8-zone case study template
  sectionSubtitles: {},
  pageSettings: DEFAULT_PAGE_SETTINGS,
});

// Merge section order with default to ensure new sections are included for existing brands
const mergeSectionOrder = (dbOrder: string[] | null): BrandGuide['sectionOrder'] => {
  if (!dbOrder) return DEFAULT_SECTION_ORDER;

  // Get any new sections that don't exist in the stored order
  const missingSections = DEFAULT_SECTION_ORDER.filter(s => !dbOrder.includes(s));

  // Append missing sections to the end
  return [...dbOrder, ...missingSections] as BrandGuide['sectionOrder'];
};

// Use shared normalization utilities from lib/guideNormalization
// Local aliases for backward compatibility within this file
const asArray = safeArray;
const asObject = safeObject;

export const dbToBrandGuide = (db: DbBrand): BrandGuide => {
  const guideData = asObject<Record<string, unknown>>(db.guide_data, {});

  return {
    id: db.id,
    type: 'brand',
    slug: db.slug || undefined,
    organizationId: db.organization_id,
    isFavorite: db.is_favorite,
    isPublic: db.is_public ?? false,
    shareToken: db.share_token || undefined,
    sectionOrder: mergeSectionOrder(db.section_order),
    hiddenSections: asArray( db.hidden_sections, [] ) as BrandGuide['hiddenSections'],
    hero: asObject(guideData.hero, { name: db.name, tagline: '', coverImage: '', logoUrl: '' }) as BrandGuide['hero'],
    tagline: asObject(guideData.tagline, { primary: '', secondary: '', variations: [] }) as BrandGuide['tagline'],
    identity: asObject(guideData.identity, { missionStatement: '', archetype: '', toneOfVoice: [] }) as BrandGuide['identity'],
    values: asArray(guideData.values, []) as BrandGuide['values'],
    logos: asArray(guideData.logos, []) as BrandGuide['logos'],
    logoDownloadLinks: asArray(guideData.logoDownloadLinks, []) as BrandGuide['logoDownloadLinks'],
    brandIcons: asArray(guideData.brandIcons, []) as BrandGuide['brandIcons'],
    colors: asArray(guideData.colors, []) as BrandGuide['colors'],
    colorCombinations: asArray(guideData.colorCombinations, []) as BrandGuide['colorCombinations'],
    gradients: normalizeGradients(asArray(guideData.gradients, [])) as BrandGuide['gradients'],
    patterns: asArray(guideData.patterns, []) as BrandGuide['patterns'],
    customShapes: asArray(guideData.customShapes, []) as BrandGuide['customShapes'],
    typography: normalizeTypography(asArray(guideData.typography, [])) as BrandGuide['typography'],
    textStyles: asArray(guideData.textStyles, []) as BrandGuide['textStyles'],
    adminCustomStyle: guideData.adminCustomStyle as BrandGuide['adminCustomStyle'],
    iconography: asArray(guideData.iconography, []) as BrandGuide['iconography'],
    defaultIconColor: guideData.defaultIconColor as BrandGuide['defaultIconColor'],
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
    imageAssets: asArray(guideData.imageAssets, []) as BrandGuide['imageAssets'],
    misuse: asArray(guideData.misuse, []) as BrandGuide['misuse'],
    atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as BrandGuide['atmosphere'],
    caseStudies: asArray(guideData.caseStudies, []) as BrandGuide['caseStudies'],
    brochures: normalizeBrochures(asArray(guideData.brochures, [])) as BrandGuide['brochures'],
    templates: normalizeTemplates(asArray(guideData.templates, [])) as BrandGuide['templates'],
    services: asArray(guideData.services, []) as BrandGuide['services'],
    linkedGuides: asArray(guideData.linkedGuides, []) as BrandGuide['linkedGuides'],
    templateSpecs: asArray(guideData.templateSpecs, []) as BrandGuide['templateSpecs'],
    revenueData: asArray(guideData.revenueData, []) as BrandGuide['revenueData'],
    revenueChartColors: guideData.revenueChartColors as BrandGuide['revenueChartColors'],
    chartTheme: guideData.chartTheme as BrandGuide['chartTheme'],
    statistics: asArray(guideData.statistics, []) as BrandGuide['statistics'],
    sponsorLogos: asArray(guideData.sponsorLogos, []) as BrandGuide['sponsorLogos'],
    clientLogos: asArray(guideData.clientLogos, []) as BrandGuide['clientLogos'],
    webinars: asArray(guideData.webinars, []) as BrandWebinar[],
    awards: asArray(guideData.awards, []) as BrandAward[],
    infographicLayout: (guideData.infographicLayout as BrandGuide['infographicLayout']) || 'infographic',
    insights: asArray(guideData.insights, []) as BrandGuide['insights'],
    insightsLayout: guideData.insightsLayout as BrandGuide['insightsLayout'],
    locations: asArray(guideData.locations, []) as BrandGuide['locations'],
    locationStats: asArray(guideData.locationStats, []) as BrandGuide['locationStats'],
    locationsSectionTitle: guideData.locationsSectionTitle as BrandGuide['locationsSectionTitle'],
    locationsSectionDescription: guideData.locationsSectionDescription as BrandGuide['locationsSectionDescription'],
    useSharedLocations: guideData.useSharedLocations as BrandGuide['useSharedLocations'],
    sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as BrandGuide['sectionSubtitles'],
    sectionLayouts: asObject(guideData.sectionLayouts, {}) as BrandGuide['sectionLayouts'],
    pageSettings: asObject(guideData.pageSettings, DEFAULT_PAGE_SETTINGS) as BrandGuide['pageSettings'],
    eventSignage: asArray(guideData.eventSignage, []) as BrandGuide['eventSignage'],
    linkedBooths: asArray(guideData.linkedBooths, []) as BrandGuide['linkedBooths'],
    presentationTemplates: asArray(guideData.presentationTemplates, []) as BrandGuide['presentationTemplates'],
    approvedImagery: guideData.approvedImagery as BrandGuide['approvedImagery'],
    mapTheme: guideData.mapTheme as BrandGuide['mapTheme'],
    // Brand Visuals bundle (Foundation/Collaborate/Transform) — used by Layout Templates
    brandVisuals: guideData.brandVisuals as BrandGuide['brandVisuals'],
    layoutTemplateCustomizations: asArray(guideData.layoutTemplateCustomizations, []) as BrandGuide['layoutTemplateCustomizations'],
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
};

export const dbToProductGuide = (db: DbProduct): ProductGuide => {
  const guideData = asObject<Record<string, unknown>>(db.guide_data, {});

  return {
    id: db.id,
    type: 'product',
    slug: db.slug || undefined,
    organizationId: db.organization_id,
    parentBrandId: db.parent_brand_id ?? undefined,
    isFavorite: db.is_favorite,
    isPublic: db.is_public ?? false,
    sectionOrder: mergeSectionOrder(db.section_order),
    hiddenSections: asArray(db.hidden_sections, []) as ProductGuide['hiddenSections'],
    hero: asObject(guideData.hero, { name: db.name, tagline: '', coverImage: '', logoUrl: '' }) as ProductGuide['hero'],
    tagline: asObject(guideData.tagline, { primary: '', secondary: '', variations: [] }) as ProductGuide['tagline'],
    identity: asObject(guideData.identity, { missionStatement: '', archetype: '', toneOfVoice: [] }) as ProductGuide['identity'],
    values: asArray(guideData.values, []) as ProductGuide['values'],
    logos: asArray(guideData.logos, []) as ProductGuide['logos'],
    logoDownloadLinks: asArray(guideData.logoDownloadLinks, []) as ProductGuide['logoDownloadLinks'],
    brandIcons: asArray(guideData.brandIcons, []) as ProductGuide['brandIcons'],
    colors: asArray(guideData.colors, []) as ProductGuide['colors'],
    colorCombinations: asArray(guideData.colorCombinations, []) as ProductGuide['colorCombinations'],
    gradients: normalizeGradients(asArray(guideData.gradients, [])) as ProductGuide['gradients'],
    patterns: asArray(guideData.patterns, []) as ProductGuide['patterns'],
    customShapes: asArray(guideData.customShapes, []) as ProductGuide['customShapes'],
    typography: normalizeTypography(asArray(guideData.typography, [])) as ProductGuide['typography'],
    textStyles: asArray(guideData.textStyles, []) as ProductGuide['textStyles'],
    adminCustomStyle: guideData.adminCustomStyle as ProductGuide['adminCustomStyle'],
    iconography: asArray(guideData.iconography, []) as ProductGuide['iconography'],
    defaultIconColor: guideData.defaultIconColor as ProductGuide['defaultIconColor'],
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
    imageAssets: asArray(guideData.imageAssets, []) as ProductGuide['imageAssets'],
    misuse: asArray(guideData.misuse, []) as ProductGuide['misuse'],
    atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as ProductGuide['atmosphere'],
    caseStudies: asArray(guideData.caseStudies, []) as ProductGuide['caseStudies'],
    brochures: normalizeBrochures(asArray(guideData.brochures, [])) as ProductGuide['brochures'],
    templates: normalizeTemplates(asArray(guideData.templates, [])) as ProductGuide['templates'],
    services: asArray(guideData.services, []) as ProductGuide['services'],
    linkedGuides: asArray(guideData.linkedGuides, []) as ProductGuide['linkedGuides'],
    templateSpecs: asArray(guideData.templateSpecs, []) as ProductGuide['templateSpecs'],
    revenueData: asArray(guideData.revenueData, []) as ProductGuide['revenueData'],
    revenueChartColors: guideData.revenueChartColors as ProductGuide['revenueChartColors'],
    chartTheme: guideData.chartTheme as ProductGuide['chartTheme'],
    statistics: asArray(guideData.statistics, []) as ProductGuide['statistics'],
    sponsorLogos: asArray(guideData.sponsorLogos, []) as ProductGuide['sponsorLogos'],
    clientLogos: asArray(guideData.clientLogos, []) as ProductGuide['clientLogos'],
    webinars: asArray(guideData.webinars, []) as BrandWebinar[],
    awards: asArray(guideData.awards, []) as BrandAward[],
    infographicLayout: (guideData.infographicLayout as ProductGuide['infographicLayout']) || 'infographic',
    insights: asArray(guideData.insights, []) as ProductGuide['insights'],
    insightsLayout: guideData.insightsLayout as ProductGuide['insightsLayout'],
    locations: asArray(guideData.locations, []) as ProductGuide['locations'],
    locationStats: asArray(guideData.locationStats, []) as ProductGuide['locationStats'],
    locationsSectionTitle: guideData.locationsSectionTitle as ProductGuide['locationsSectionTitle'],
    locationsSectionDescription: guideData.locationsSectionDescription as ProductGuide['locationsSectionDescription'],
    useSharedLocations: guideData.useSharedLocations as ProductGuide['useSharedLocations'],
    sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as ProductGuide['sectionSubtitles'],
    sectionLayouts: asObject(guideData.sectionLayouts, {}) as ProductGuide['sectionLayouts'],
    pageSettings: asObject(guideData.pageSettings, DEFAULT_PAGE_SETTINGS) as ProductGuide['pageSettings'],
    eventSignage: asArray(guideData.eventSignage, []) as ProductGuide['eventSignage'],
    presentationTemplates: asArray(guideData.presentationTemplates, []) as ProductGuide['presentationTemplates'],
    approvedImagery: guideData.approvedImagery as ProductGuide['approvedImagery'],
    mapTheme: guideData.mapTheme as ProductGuide['mapTheme'],
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
};

const brandGuideToDb = (brand: Partial<BrandGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...guideData } = brand as BrandGuide;
  // Strip any remaining base64 blobs to prevent payload bloat
  const cleanedGuideData = stripBase64FromGuideData(guideData as Record<string, unknown>);
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    name: guideData.hero?.name ?? 'My Brand',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: cleanedGuideData as unknown as Json,
  };
};

const productGuideToDb = (product: Partial<ProductGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, parentBrandId, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...guideData } = product as ProductGuide;
  // Strip any remaining base64 blobs to prevent payload bloat
  const cleanedGuideData = stripBase64FromGuideData(guideData as Record<string, unknown>);
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    parent_brand_id: parentBrandId ?? null,
    name: guideData.hero?.name ?? 'My Product',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: cleanedGuideData as unknown as Json,
  };
};

export const useBrandStorage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const [brands, setBrands] = useState<BrandGuide[]>([]);
  const [products, setProducts] = useState<ProductGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lightweight local cache to keep the UI usable during temporary backend/network issues.
  // NOTE: This is not a source of truth; it only helps with resilience.
  const CACHE_KEY = 'brandhub_guides_cache_v1';
  const saveCache = useCallback((nextBrands: BrandGuide[], nextProducts: ProductGuide[]) => {
    try {
      const payload = {
        savedAt: Date.now(),
        userId: user?.id ?? null,
        brands: nextBrands,
        products: nextProducts,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [user?.id]);

  const loadCache = useCallback((): { brands: BrandGuide[]; products: ProductGuide[] } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        savedAt?: number;
        userId?: string | null;
        brands?: BrandGuide[];
        products?: ProductGuide[];
      };
      // Only load cache for the current user.
      if ((parsed.userId ?? null) !== (user?.id ?? null)) return null;
      
      // Rehydrate Date objects that were serialized as strings
      const rehydrateDates = <T extends { createdAt?: unknown; updatedAt?: unknown }>(item: T): T => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
      });
      
      return {
        brands: Array.isArray(parsed.brands) ? parsed.brands.map(rehydrateDates) : [],
        products: Array.isArray(parsed.products) ? parsed.products.map(rehydrateDates) : [],
      };
    } catch {
      return null;
    }
  }, [user?.id]);

  // Sync state (for UI indicator)
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Helper to detect connectivity-related errors (not a hook)
  const isConnectivityLikeError = (message: string) => {
    return /timeout|request timeout|connection|network|failed to fetch|fetch/i.test(message);
  };

  // Helper to set sync failure state appropriately (not a hook)
  const setSyncFailure = (err: unknown, context: string) => {
    const msg = err instanceof Error ? err.message : String(err);
    const isConnectivity = isConnectivityLikeError(msg);

    // Connectivity-like issues should not be shown as a hard "Sync error".
    // Treat them as offline/reconnecting so the UI doesn't look broken.
    if (isConnectivity) {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      setSyncStatus('offline');
      setLastSyncError('Backend temporarily unreachable. Your changes will sync automatically when the connection recovers.');
      console.warn('[SYNC]', context, 'connectivity issue:', msg);
      return;
    }

    setSyncStatus('error');
    setLastSyncError(msg || 'Unknown sync error');
    console.error('[SYNC]', context, 'error:', err);
  };

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setSyncStatus((s) => (s === 'offline' ? 'idle' : s));
    };
    const onOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Refs to always have latest state in callbacks
  const brandsRef = useRef<BrandGuide[]>([]);
  const productsRef = useRef<ProductGuide[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    brandsRef.current = brands;
  }, [brands]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Track if initial fetch has been done to prevent double-fetching
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const lastOrgIdRef = useRef<string | null>(null);

  // If a fetch fails (e.g., timeout), we keep current data and allow a retry after cooldown with exponential backoff.
  const lastFetchFailedAtRef = useRef<number | null>(null);
  const failureCountRef = useRef<number>(0);
  const BASE_RETRY_COOLDOWN_MS = 4000;
  const MAX_RETRY_COOLDOWN_MS = 60000; // Cap at 1 minute
  
  const getRetryCooldown = useCallback(() => {
    // Exponential backoff: 4s, 8s, 16s, 32s, 60s (capped)
    const cooldown = BASE_RETRY_COOLDOWN_MS * Math.pow(2, failureCountRef.current);
    return Math.min(cooldown, MAX_RETRY_COOLDOWN_MS);
  }, []);

  // Fetch brands and products - depends on user auth state for RLS
  const fetchData = useCallback(
    async (force = false) => {
      const currentUserId = user?.id ?? null;
      const currentOrgId = organization?.id ?? null;

      // If signed out, clear immediately (don’t hit the backend)
      if (!currentUserId) {
        hasFetchedRef.current = true;
        lastUserIdRef.current = null;
        lastOrgIdRef.current = null;
        lastFetchFailedAtRef.current = null;
        setBrands([]);
        setProducts([]);
        setIsLoading(false);
        setSyncStatus('idle');
        setLastSyncError(null);
        return;
      }

      // Offline: don't clear; just mark and avoid request spam
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setSyncStatus('offline');
        lastFetchFailedAtRef.current = Date.now();
        hasFetchedRef.current = true;
        lastUserIdRef.current = currentUserId;
        lastOrgIdRef.current = currentOrgId;
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      const retryCooldown = getRetryCooldown();
      const inFailureCooldown =
        !force &&
        lastFetchFailedAtRef.current != null &&
        now - lastFetchFailedAtRef.current < retryCooldown;

      // If we recently failed, avoid retry-spam; the effect below will retry after cooldown.
      if (inFailureCooldown) {
        setIsLoading(false);
        return;
      }

      // Skip if already fetched for same user/org (unless forced).
      if (
        !force &&
        hasFetchedRef.current &&
        lastUserIdRef.current === currentUserId &&
        lastOrgIdRef.current === currentOrgId
      ) {
        return;
      }

      setIsLoading(true);
      setSyncStatus('syncing');
      setLastSyncError(null);

      try {
        const withTimeout = <T,>(p: Promise<T>, ms: number) =>
          Promise.race([
            p,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), ms)
            ),
          ]);

        // Fetch in parallel for faster loading
        const [brandsRes, productsRes] = await withTimeout(
          Promise.all([
            supabase
              .from('brands')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(250),
            supabase
              .from('products')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(250),
          ]),
          60000
        );

        if (brandsRes.error) throw brandsRes.error;
        if (productsRes.error) throw productsRes.error;

        const nextBrands = (brandsRes.data as DbBrand[]).map(dbToBrandGuide);
        const nextProducts = (productsRes.data as DbProduct[]).map(dbToProductGuide);

        setBrands(nextBrands);
        setProducts(nextProducts);
        saveCache(nextBrands, nextProducts);

        setIsOnline(true);
        setSyncStatus('idle');
        setLastSyncError(null);
        setLastSyncedAt(new Date());

        // Mark as fetched and reset failure tracking
        hasFetchedRef.current = true;
        lastUserIdRef.current = currentUserId;
        lastOrgIdRef.current = currentOrgId;
        lastFetchFailedAtRef.current = null;
        failureCountRef.current = 0; // Reset on success
      } catch (err) {
        console.error('Error fetching data:', err);

        const msg = err instanceof Error ? err.message : 'Unknown error';
        const isTimeout = isConnectivityLikeError(msg);
        setSyncFailure(err, 'fetchData');

        // If we have nothing in memory yet, try a last-known-good cache so the UI isn't blank.
        if (brandsRef.current.length === 0 && productsRef.current.length === 0) {
          const cached = loadCache();
          if (cached && (cached.brands.length > 0 || cached.products.length > 0)) {
            setBrands(cached.brands);
            setProducts(cached.products);
            logger.storage('Loaded from cache during backend outage');
          }
        }

        // IMPORTANT: Do NOT clear existing data on transient failures.
        // Just record failure time and increment counter for exponential backoff.
        lastFetchFailedAtRef.current = Date.now();
        failureCountRef.current = Math.min(failureCountRef.current + 1, 5); // Cap at 5 for max 60s backoff

        // Only show toast on first failure, not on every retry
        if (!hasFetchedRef.current) {
          toast.error(isTimeout 
            ? 'Backend is temporarily unreachable. Using cached data.' 
            : 'Could not load your data. Will retry automatically.'
          );
        }

        // Allow a retry soon; don't lock into an empty state.
        hasFetchedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, organization?.id, saveCache, loadCache, getRetryCooldown]
  );

  // Refetch when user/org auth state changes to ensure RLS policies apply correctly
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const currentOrgId = organization?.id ?? null;

    // If auth is still loading, don't do anything yet
    if (authLoading) return;

    // If no user, clear data immediately
    if (!currentUserId) {
      // IMPORTANT: anonymous/public visitors should never be stuck in a loading state.
      // Even if we've never fetched anything, we must mark loading as complete.
      hasFetchedRef.current = false;
      lastUserIdRef.current = null;
      lastOrgIdRef.current = null;
      lastFetchFailedAtRef.current = null;
      setBrands([]);
      setProducts([]);
      setIsLoading(false);
      setSyncStatus('idle');
      setLastSyncError(null);
      return;
    }

    // Wait for org loading to complete before fetching (prevents double-fetch)
    if (orgLoading) return;

    const now = Date.now();
    const retryCooldown = getRetryCooldown();
    const shouldRetryAfterFailure =
      lastFetchFailedAtRef.current != null &&
      now - lastFetchFailedAtRef.current >= retryCooldown;

    // Force refetch if user or org changed, or if we haven't fetched yet, or if a previous fetch failed.
    const shouldFetch =
      !hasFetchedRef.current ||
      lastUserIdRef.current !== currentUserId ||
      lastOrgIdRef.current !== currentOrgId ||
      shouldRetryAfterFailure;

    if (shouldFetch) {
      fetchData(false);
    }
  }, [fetchData, user?.id, organization?.id, authLoading, orgLoading]);

  const addBrand = async (name: string): Promise<BrandGuide | null> => {
    if (!user) {
      toast.error('Please sign in to create a brand');
      return null;
    }

    const guideData = createDefaultGuideData(name, 'brand');
    const dbData = {
      user_id: user.id,
      organization_id: organization?.id ?? null,
      name,
      is_favorite: false,
      section_order: DEFAULT_SECTION_ORDER as string[],
      hidden_sections: [] as string[],
      guide_data: guideData as unknown as Json,
    };

    const { data, error } = await supabase
      .from('brands')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand. Please try again.');
      return null;
    }

    const newBrand = dbToBrandGuide(data as DbBrand);
    setBrands(prev => [newBrand, ...prev]);
    toast.success('Brand created successfully!');
    return newBrand;
  };

  const addProduct = async (name: string, parentBrandId?: string): Promise<ProductGuide | null> => {
    if (!user) {
      toast.error('Please sign in to create a product');
      return null;
    }

    const guideData = createDefaultGuideData(name, 'product');
    
    // Generate a unique slug with timestamp suffix to avoid conflicts
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    
    const dbData = {
      user_id: user.id,
      organization_id: organization?.id ?? null,
      parent_brand_id: parentBrandId ?? null,
      name,
      slug: uniqueSlug,
      is_favorite: false,
      section_order: DEFAULT_SECTION_ORDER as string[],
      hidden_sections: [] as string[],
      guide_data: guideData as unknown as Json,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      // Provide more specific error message for duplicate slugs
      if (error.code === '23505') {
        toast.error('A product with this name already exists. Please try a different name.');
      } else {
        toast.error('Failed to create product. Please try again.');
      }
      return null;
    }

    const newProduct = dbToProductGuide(data as DbProduct);
    setProducts(prev => [newProduct, ...prev]);
    toast.success('Product created successfully!');
    return newProduct;
  };

  // Debounce refs for batching updates
  const brandSyncTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const productSyncTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingBrandUpdates = useRef<Map<string, Partial<BrandGuide>>>(new Map());
  const pendingProductUpdates = useRef<Map<string, Partial<ProductGuide>>>(new Map());

  // Keep user/org refs for flush callbacks (avoid stale closures)
  const userRef = useRef(user);
  const orgRef = useRef(organization);
  const accessTokenRef = useRef<string | null>(null);
  
  useEffect(() => {
    userRef.current = user;
    orgRef.current = organization;
  }, [user, organization]);
  
  // Keep access token updated for flushPendingUpdates
  useEffect(() => {
    const updateToken = async () => {
      const { data } = await supabase.auth.getSession();
      accessTokenRef.current = data.session?.access_token ?? null;
    };
    updateToken();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      accessTokenRef.current = session?.access_token ?? null;
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Auto-backup helper - stores snapshot before significant saves
  const createAutoBackup = useCallback((guide: BrandGuide | ProductGuide) => {
    try {
      const BACKUP_KEY = 'brandhub_auto_backups_v2';
      const MAX_BACKUPS_PER_GUIDE = 5;
      
      const backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
      
      const newBackup = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        guideId: guide.id,
        guideName: guide.hero.name,
        guideType: guide.type,
        data: {
          version: '2.0',
          exportedAt: new Date().toISOString(),
          type: guide.type,
          guide,
          metadata: {
            originalId: guide.id,
            originalSlug: guide.slug,
            organizationId: guide.organizationId,
          },
        },
      };

      // Keep only the most recent backups per guide
      const otherGuideBackups = backups.filter((b: { guideId?: string }) => b.guideId !== guide.id);
      const thisGuideBackups = backups
        .filter((b: { guideId?: string }) => b.guideId === guide.id)
        .sort((a: { timestamp?: number }, b: { timestamp?: number }) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, MAX_BACKUPS_PER_GUIDE - 1);

      const updatedBackups = [...otherGuideBackups, ...thisGuideBackups, newBackup]
        .sort((a: { timestamp?: number }, b: { timestamp?: number }) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, MAX_BACKUPS_PER_GUIDE * 20); // Total cap

      localStorage.setItem(BACKUP_KEY, JSON.stringify(updatedBackups));
    } catch (err) {
      console.warn('[BACKUP] Failed to create auto-backup:', err);
    }
  }, []);

  const syncBrandToDb = useCallback(async (id: string, merged: BrandGuide) => {
    if (!user) {
      console.warn('[SYNC] syncBrandToDb: No user, skipping');
      return;
    }

    try {
      logger.sync('syncBrandToDb: Starting sync for brand', id);
      
      // Validate merged data before sending
      if (!merged || typeof merged !== 'object') {
        console.error('[SYNC] syncBrandToDb: Invalid merged data', merged);
        pendingBrandUpdates.current.delete(id);
        return;
      }

      // Create auto-backup before saving
      createAutoBackup(merged);

      // IMPORTANT: only include organization_id when we actually have one,
      // otherwise we risk overwriting an existing org association with null.
      const dbData = brandGuideToDb(merged, user.id, organization?.id);
      
      logger.sync('syncBrandToDb: Sending update', { id, name: dbData.name });
      
      const { error } = await supabase
        .from('brands')
        .update(dbData)
        .eq('id', id);

      if (error) {
        console.error('[SYNC] syncBrandToDb: Error updating brand:', error);
        setSyncFailure(error, 'syncBrandToDb');
        toast.error('Failed to save changes. Please try again.');
      } else {
        logger.sync('syncBrandToDb: Success for brand', id);
        setSyncStatus('idle');
        setLastSyncedAt(new Date());
        setLastSyncError(null);
      }
    } catch (err) {
      console.error('[SYNC] syncBrandToDb: Caught exception:', err);
      setSyncFailure(err, 'syncBrandToDb');
    } finally {
      pendingBrandUpdates.current.delete(id);
    }
  }, [user, organization?.id, createAutoBackup]);

  const syncProductToDb = useCallback(async (id: string, merged: ProductGuide) => {
    if (!user) {
      console.warn('[SYNC] syncProductToDb: No user, skipping');
      return;
    }

    try {
      logger.sync('syncProductToDb: Starting sync for product', id);
      
      // Validate merged data before sending
      if (!merged || typeof merged !== 'object') {
        console.error('[SYNC] syncProductToDb: Invalid merged data', merged);
        pendingProductUpdates.current.delete(id);
        return;
      }

      // Create auto-backup before saving
      createAutoBackup(merged);

      const dbData = productGuideToDb(merged, user.id, organization?.id);
      
      logger.sync('syncProductToDb: Sending update', { id, name: dbData.name });
      
      const { error } = await supabase
        .from('products')
        .update(dbData)
        .eq('id', id);

      if (error) {
        console.error('[SYNC] syncProductToDb: Error updating product:', error);
        setSyncFailure(error, 'syncProductToDb');
        toast.error('Failed to save changes. Please try again.');
      } else {
        logger.sync('syncProductToDb: Success for product', id);
        setSyncStatus('idle');
        setLastSyncedAt(new Date());
        setLastSyncError(null);
      }
    } catch (err) {
      console.error('[SYNC] syncProductToDb: Caught exception:', err);
      setSyncFailure(err, 'syncProductToDb');
    } finally {
      pendingProductUpdates.current.delete(id);
    }
  }, [user, organization?.id, createAutoBackup]);

  // Flush all pending updates immediately (for unmount/beforeunload)
  const flushPendingUpdates = useCallback(() => {
    try {
      const currentUser = userRef.current;
      const accessToken = accessTokenRef.current;
      
      if (!currentUser || !accessToken) {
        logger.sync('flushPendingUpdates: No user or token, skipping');
        return;
      }

      logger.sync('flushPendingUpdates: Flushing', {
        brands: brandSyncTimeouts.current.size,
        products: productSyncTimeouts.current.size,
      });

      // Clear all pending timeouts and sync immediately
      brandSyncTimeouts.current.forEach((timeout, id) => {
        try {
          clearTimeout(timeout);
          const brand = brandsRef.current.find(b => b.id === id);
          const pending = pendingBrandUpdates.current.get(id);
          if (brand && pending) {
            const merged = { ...brand, ...pending };
            const dbData = brandGuideToDb(merged, currentUser.id, orgRef.current?.id);
            // Use fetch with keepalive for reliability during unload
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/brands?id=eq.${id}`;
            const headers = {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=minimal',
            };
            fetch(url, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(dbData),
              keepalive: true,
            }).catch((err) => {
              console.error('[SYNC] flushPendingUpdates: Brand fetch error', err);
            });
            pendingBrandUpdates.current.delete(id);
          }
        } catch (err) {
          console.error('[SYNC] flushPendingUpdates: Error processing brand', id, err);
        }
      });
      brandSyncTimeouts.current.clear();

      productSyncTimeouts.current.forEach((timeout, id) => {
        try {
          clearTimeout(timeout);
          const product = productsRef.current.find(p => p.id === id);
          const pending = pendingProductUpdates.current.get(id);
          if (product && pending) {
            const merged = { ...product, ...pending };
            const dbData = productGuideToDb(merged, currentUser.id, orgRef.current?.id);
            const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?id=eq.${id}`;
            const headers = {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=minimal',
            };
            fetch(url, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(dbData),
              keepalive: true,
            }).catch((err) => {
              console.error('[SYNC] flushPendingUpdates: Product fetch error', err);
            });
            pendingProductUpdates.current.delete(id);
          }
        } catch (err) {
          console.error('[SYNC] flushPendingUpdates: Error processing product', id, err);
        }
      });
      productSyncTimeouts.current.clear();
    } catch (err) {
      console.error('[SYNC] flushPendingUpdates: Critical error', err);
    }
  }, []);

  // Flush pending updates on unmount and beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingUpdates();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush on unmount as well
      flushPendingUpdates();
    };
  }, [flushPendingUpdates]);

  const updateBrand = useCallback((id: string, updates: Partial<BrandGuide>) => {
    try {
      if (!user) {
        console.warn('[SYNC] updateBrand: No user, skipping save');
        toast.error('Please sign in to save changes');
        return;
      }

      if (!id || typeof id !== 'string') {
        console.error('[SYNC] updateBrand: Invalid id', id);
        return;
      }

      if (!updates || typeof updates !== 'object') {
        console.error('[SYNC] updateBrand: Invalid updates', updates);
        return;
      }

      logger.sync('updateBrand: Scheduling update for', id, 'keys:', Object.keys(updates));

      // Get current brand state using ref to avoid stale closure issues
      const currentBrand = brandsRef.current.find(b => b.id === id);
      if (!currentBrand) {
        console.warn('[SYNC] updateBrand: Brand not found in local state, attempting update anyway:', id);
      }

      // Merge with any pending updates using functional approach
      // This ensures we always work with the latest pending state
      const existingPending = pendingBrandUpdates.current.get(id) || {};
      const allUpdates = { ...existingPending, ...updates };
      pendingBrandUpdates.current.set(id, allUpdates);

      // Optimistic update - update UI immediately using functional setState
      // to ensure we're working with the latest state
      setBrands(prev => prev.map(brand =>
        brand.id === id ? { ...brand, ...updates, updatedAt: new Date() } : brand
      ));

      // Indicate sync in progress
      setSyncStatus('syncing');

      // Clear existing timeout for this brand
      const existingTimeout = brandSyncTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new debounced sync
      const timeout = setTimeout(async () => {
        try {
          logger.sync('updateBrand: Debounce timer fired for', id);
          
          // Get the LATEST brand state and pending updates at sync time
          const latestBrand = brandsRef.current.find(b => b.id === id);
          const finalUpdates = pendingBrandUpdates.current.get(id) || {};
          
          logger.sync('updateBrand: latestBrand exists:', !!latestBrand, 'finalUpdates keys:', Object.keys(finalUpdates));
          
          // If brand not in local state, fetch current data from DB first
          let baseData = latestBrand || currentBrand;
          
          if (!baseData) {
            logger.sync('updateBrand: Brand not in local state, fetching from DB first:', id);
            const { data: dbBrand, error } = await supabase
              .from('brands')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (error || !dbBrand) {
              console.error('[SYNC] updateBrand: Failed to fetch brand from DB:', error);
              pendingBrandUpdates.current.delete(id);
              brandSyncTimeouts.current.delete(id);
              setSyncStatus('error');
              return;
            }
            
            // Convert DB format to BrandGuide and merge pending updates
            baseData = { ...dbToBrandGuide(dbBrand as DbBrand), ...finalUpdates };
          }
          
          // Always merge pending updates at sync time.
          // Even when latestBrand exists, refs/state can lag one render behind the queued update,
          // which would otherwise drop freshly imported sections like approved imagery.
          const mergedData = { ...baseData, ...finalUpdates };
          
          logger.sync('updateBrand: Syncing to DB for', id);
          await syncBrandToDb(id, mergedData as BrandGuide);
          
          brandSyncTimeouts.current.delete(id);
        } catch (err) {
          console.error('[SYNC] updateBrand: Error in debounced sync', err);
          brandSyncTimeouts.current.delete(id);
          setSyncStatus('error');
        }
      }, SYNC_DEBOUNCE_MS);
      
      brandSyncTimeouts.current.set(id, timeout);
    } catch (err) {
      console.error('[SYNC] updateBrand: Critical error', err);
      setSyncStatus('error');
    }
  }, [user, syncBrandToDb]);

  const updateProduct = useCallback((id: string, updates: Partial<ProductGuide>) => {
    try {
      if (!user) {
        console.warn('[SYNC] updateProduct: No user, skipping save');
        toast.error('Please sign in to save changes');
        return;
      }

      if (!id || typeof id !== 'string') {
        console.error('[SYNC] updateProduct: Invalid id', id);
        return;
      }

      if (!updates || typeof updates !== 'object') {
        console.error('[SYNC] updateProduct: Invalid updates', updates);
        return;
      }

      logger.sync('updateProduct: Scheduling update for', id, 'keys:', Object.keys(updates));

      // Get current product state using ref to avoid stale closure issues
      const currentProduct = productsRef.current.find(p => p.id === id);
      if (!currentProduct) {
        console.warn('[SYNC] updateProduct: Product not found in local state, attempting update anyway:', id);
      }

      // Merge with any pending updates using functional approach
      const existingPending = pendingProductUpdates.current.get(id) || {};
      const allUpdates = { ...existingPending, ...updates };
      pendingProductUpdates.current.set(id, allUpdates);

      // Optimistic update - update UI immediately using functional setState
      setProducts(prev => prev.map(product =>
        product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
      ));

      // Indicate sync in progress
      setSyncStatus('syncing');

      // Clear existing timeout for this product
      const existingTimeout = productSyncTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new debounced sync
      const timeout = setTimeout(async () => {
        try {
          logger.sync('updateProduct: Debounce timer fired for', id);
          
          // Get the LATEST product state at sync time
          const latestProduct = productsRef.current.find(p => p.id === id);
          const finalUpdates = pendingProductUpdates.current.get(id) || {};
          
          logger.sync('updateProduct: latestProduct exists:', !!latestProduct, 'finalUpdates keys:', Object.keys(finalUpdates));
          
          // If product not in local state, fetch current data from DB first
          let baseData = latestProduct || currentProduct;
          
          if (!baseData) {
            logger.sync('updateProduct: Product not in local state, fetching from DB first:', id);
            const { data: dbProduct, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (error || !dbProduct) {
              console.error('[SYNC] updateProduct: Failed to fetch product from DB:', error);
              pendingProductUpdates.current.delete(id);
              productSyncTimeouts.current.delete(id);
              setSyncStatus('error');
              return;
            }
            
            // Convert DB format to ProductGuide and merge pending updates
            baseData = { ...dbToProductGuide(dbProduct as DbProduct), ...finalUpdates };
          }
          
          // Always merge pending updates at sync time to avoid losing queued edits when
          // refs/state are briefly behind the optimistic update.
          const mergedData = { ...baseData, ...finalUpdates };
          
          logger.sync('updateProduct: Syncing to DB for', id);
          await syncProductToDb(id, mergedData as ProductGuide);
          
          productSyncTimeouts.current.delete(id);
        } catch (err) {
          console.error('[SYNC] updateProduct: Error in debounced sync', err);
          productSyncTimeouts.current.delete(id);
          setSyncStatus('error');
        }
      }, SYNC_DEBOUNCE_MS);
      
      productSyncTimeouts.current.set(id, timeout);
    } catch (err) {
      console.error('[SYNC] updateProduct: Critical error', err);
      setSyncStatus('error');
    }
  }, [user, syncProductToDb]);

  const deleteBrand = async (id: string) => {
    if (!user || brands.length <= 1) return;

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      return;
    }

    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getBrand = (id: string) => brands.find(b => b.id === id);
  const getBrandBySlug = (slug: string) => brands.find(b => b.slug === slug);
  const getProduct = (id: string) => products.find(p => p.id === id);
  const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);

  const getRecentlyUpdated = () => {
    const all = [...brands, ...products];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return all
      .filter(item => item.updatedAt >= oneDayAgo)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  };

  const toggleFavorite = async (id: string, type: 'brand' | 'product') => {
    if (!user) return;

    if (type === 'brand') {
      const brand = brands.find(b => b.id === id);
      if (!brand) return;
      await updateBrand(id, { isFavorite: !brand.isFavorite });
    } else {
      const product = products.find(p => p.id === id);
      if (!product) return;
      await updateProduct(id, { isFavorite: !product.isFavorite });
    }
  };

  const getFavorites = () => {
    const all = [...brands, ...products];
    return all.filter(item => item.isFavorite);
  };

  // Check if there are pending unsaved changes
  const hasPendingChanges = useCallback(() => {
    return pendingBrandUpdates.current.size > 0 || 
           pendingProductUpdates.current.size > 0 ||
           brandSyncTimeouts.current.size > 0 ||
           productSyncTimeouts.current.size > 0;
  }, []);

  // Force save all pending changes immediately (returns promise)
  const saveNow = useCallback(async () => {
    // Clear all timeouts and sync immediately using Supabase client
    const brandPromises: Promise<void>[] = [];
    const productPromises: Promise<void>[] = [];

    brandSyncTimeouts.current.forEach((timeout, id) => {
      clearTimeout(timeout);
      const brand = brandsRef.current.find(b => b.id === id);
      const pending = pendingBrandUpdates.current.get(id);
      if (pending && user) {
        if (brand) {
          const merged = { ...brand, ...pending } as BrandGuide;
          brandPromises.push(syncBrandToDb(id, merged));
        } else {
          // Brand not in local state - fetch from DB then merge
          brandPromises.push(
            Promise.resolve(supabase.from('brands').select('*').eq('id', id).maybeSingle())
              .then(({ data }) => {
                if (data) {
                  const merged = { ...dbToBrandGuide(data as DbBrand), ...pending } as BrandGuide;
                  return syncBrandToDb(id, merged);
                }
              })
          );
        }
      }
    });
    brandSyncTimeouts.current.clear();

    productSyncTimeouts.current.forEach((timeout, id) => {
      clearTimeout(timeout);
      const product = productsRef.current.find(p => p.id === id);
      const pending = pendingProductUpdates.current.get(id);
      if (pending && user) {
        if (product) {
          const merged = { ...product, ...pending } as ProductGuide;
          productPromises.push(syncProductToDb(id, merged));
        } else {
          // Product not in local state - fetch from DB then merge
          productPromises.push(
            Promise.resolve(supabase.from('products').select('*').eq('id', id).maybeSingle())
              .then(({ data }) => {
                if (data) {
                  const merged = { ...dbToProductGuide(data as DbProduct), ...pending } as ProductGuide;
                  return syncProductToDb(id, merged);
                }
              })
          );
        }
      }
    });
    productSyncTimeouts.current.clear();

    await Promise.all([...brandPromises, ...productPromises]);
  }, [user, syncBrandToDb, syncProductToDb]);

  return {
    brands,
    products,
    isLoading,

    syncStatus,
    lastSyncedAt,
    isOnline,
    lastSyncError,

    addBrand,
    addProduct,
    updateBrand,
    updateProduct,
    deleteBrand,
    deleteProduct,
    getBrand,
    getBrandBySlug,
    getProduct,
    getProductBySlug,
    getRecentlyUpdated,
    toggleFavorite,
    getFavorites,
    hasPendingChanges,
    saveNow,
    refetch: () => fetchData(true),
  };
};