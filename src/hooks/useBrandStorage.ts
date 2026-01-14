import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandGuide, ProductGuide, DEFAULT_SECTION_ORDER, DEFAULT_PAGE_SETTINGS } from '@/types/brand';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Debounce delay for database syncing (ms)
const SYNC_DEBOUNCE_MS = 500;
interface DbBrand {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  is_favorite: boolean;
  is_public: boolean;
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

const dbToBrandGuide = (db: DbBrand): BrandGuide => {
  const guideData = db.guide_data as Record<string, unknown>;
  return {
    id: db.id,
    type: 'brand',
    organizationId: db.organization_id,
    isFavorite: db.is_favorite,
    isPublic: db.is_public ?? false,
    sectionOrder: mergeSectionOrder(db.section_order),
    hiddenSections: db.hidden_sections as BrandGuide['hiddenSections'] ?? [],
    hero: (guideData.hero as BrandGuide['hero']) ?? { name: db.name, tagline: '', coverImage: '', logoUrl: '' },
    tagline: (guideData.tagline as BrandGuide['tagline']) ?? { primary: '', secondary: '', variations: [] },
    identity: (guideData.identity as BrandGuide['identity']) ?? { missionStatement: '', archetype: '', toneOfVoice: [] },
    values: (guideData.values as BrandGuide['values']) ?? [],
    logos: (guideData.logos as BrandGuide['logos']) ?? [],
    brandIcons: (guideData.brandIcons as BrandGuide['brandIcons']) ?? [],
    colors: (guideData.colors as BrandGuide['colors']) ?? [],
    colorCombinations: (guideData.colorCombinations as BrandGuide['colorCombinations']) ?? [],
    gradients: (guideData.gradients as BrandGuide['gradients']) ?? [],
    patterns: (guideData.patterns as BrandGuide['patterns']) ?? [],
    typography: (guideData.typography as BrandGuide['typography']) ?? [],
    textStyles: (guideData.textStyles as BrandGuide['textStyles']) ?? [],
    iconography: (guideData.iconography as BrandGuide['iconography']) ?? [],
    socialIcons: (guideData.socialIcons as BrandGuide['socialIcons']) ?? [],
    imagery: (guideData.imagery as BrandGuide['imagery']) ?? [],
    social: (guideData.social as BrandGuide['social']) ?? [],
    websites: (guideData.websites as BrandGuide['websites']) ?? [],
    signatures: (guideData.signatures as BrandGuide['signatures']) ?? [],
    qr: (guideData.qr as BrandGuide['qr']) ?? { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' },
    videos: (guideData.videos as BrandGuide['videos']) ?? [],
    assets: (guideData.assets as BrandGuide['assets']) ?? [],
    misuse: (guideData.misuse as BrandGuide['misuse']) ?? [],
    atmosphere: (guideData.atmosphere as BrandGuide['atmosphere']) ?? { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
    caseStudies: (guideData.caseStudies as BrandGuide['caseStudies']) ?? [],
    brochures: (guideData.brochures as BrandGuide['brochures']) ?? [],
    templates: (guideData.templates as BrandGuide['templates']) ?? [],
    services: (guideData.services as BrandGuide['services']) ?? [],
    sectionSubtitles: (guideData.sectionSubtitles as BrandGuide['sectionSubtitles']) ?? {},
    pageSettings: (guideData.pageSettings as BrandGuide['pageSettings']) ?? DEFAULT_PAGE_SETTINGS,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
};

const dbToProductGuide = (db: DbProduct): ProductGuide => {
  const guideData = db.guide_data as Record<string, unknown>;
  return {
    id: db.id,
    type: 'product',
    organizationId: db.organization_id,
    parentBrandId: db.parent_brand_id ?? undefined,
    isFavorite: db.is_favorite,
    isPublic: db.is_public ?? false,
    sectionOrder: mergeSectionOrder(db.section_order),
    hiddenSections: db.hidden_sections as ProductGuide['hiddenSections'] ?? [],
    hero: (guideData.hero as ProductGuide['hero']) ?? { name: db.name, tagline: '', coverImage: '', logoUrl: '' },
    tagline: (guideData.tagline as ProductGuide['tagline']) ?? { primary: '', secondary: '', variations: [] },
    identity: (guideData.identity as ProductGuide['identity']) ?? { missionStatement: '', archetype: '', toneOfVoice: [] },
    values: (guideData.values as ProductGuide['values']) ?? [],
    logos: (guideData.logos as ProductGuide['logos']) ?? [],
    brandIcons: (guideData.brandIcons as ProductGuide['brandIcons']) ?? [],
    colors: (guideData.colors as ProductGuide['colors']) ?? [],
    colorCombinations: (guideData.colorCombinations as ProductGuide['colorCombinations']) ?? [],
    gradients: (guideData.gradients as ProductGuide['gradients']) ?? [],
    patterns: (guideData.patterns as ProductGuide['patterns']) ?? [],
    typography: (guideData.typography as ProductGuide['typography']) ?? [],
    textStyles: (guideData.textStyles as ProductGuide['textStyles']) ?? [],
    iconography: (guideData.iconography as ProductGuide['iconography']) ?? [],
    socialIcons: (guideData.socialIcons as ProductGuide['socialIcons']) ?? [],
    imagery: (guideData.imagery as ProductGuide['imagery']) ?? [],
    social: (guideData.social as ProductGuide['social']) ?? [],
    websites: (guideData.websites as ProductGuide['websites']) ?? [],
    signatures: (guideData.signatures as ProductGuide['signatures']) ?? [],
    qr: (guideData.qr as ProductGuide['qr']) ?? { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' },
    videos: (guideData.videos as ProductGuide['videos']) ?? [],
    assets: (guideData.assets as ProductGuide['assets']) ?? [],
    misuse: (guideData.misuse as ProductGuide['misuse']) ?? [],
    atmosphere: (guideData.atmosphere as ProductGuide['atmosphere']) ?? { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
    caseStudies: (guideData.caseStudies as ProductGuide['caseStudies']) ?? [],
    brochures: (guideData.brochures as ProductGuide['brochures']) ?? [],
    templates: (guideData.templates as ProductGuide['templates']) ?? [],
    services: (guideData.services as ProductGuide['services']) ?? [],
    sectionSubtitles: (guideData.sectionSubtitles as ProductGuide['sectionSubtitles']) ?? {},
    pageSettings: (guideData.pageSettings as ProductGuide['pageSettings']) ?? DEFAULT_PAGE_SETTINGS,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
};

const brandGuideToDb = (brand: Partial<BrandGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...guideData } = brand as BrandGuide;
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    name: guideData.hero?.name ?? 'My Brand',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: guideData as unknown as Json,
  };
};

const productGuideToDb = (product: Partial<ProductGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, parentBrandId, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, ...guideData } = product as ProductGuide;
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    parent_brand_id: parentBrandId ?? null,
    name: guideData.hero?.name ?? 'My Product',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: guideData as unknown as Json,
  };
};

export const useBrandStorage = () => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [brands, setBrands] = useState<BrandGuide[]>([]);
  const [products, setProducts] = useState<ProductGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch brands and products - depends on user auth state for RLS
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Add timeout to prevent infinite loading on connection issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const [brandsRes, productsRes] = await Promise.all([
        supabase.from('brands').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ]);

      clearTimeout(timeoutId);

      if (brandsRes.error) throw brandsRes.error;
      if (productsRes.error) throw productsRes.error;

      setBrands((brandsRes.data as DbBrand[]).map(dbToBrandGuide));
      setProducts((productsRes.data as DbProduct[]).map(dbToProductGuide));
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error so UI isn't stuck loading
      setBrands([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch when user/org auth state changes to ensure RLS policies apply correctly
  useEffect(() => {
    fetchData();
  }, [fetchData, user?.id, organization?.id]);

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
    const dbData = {
      user_id: user.id,
      organization_id: organization?.id ?? null,
      parent_brand_id: parentBrandId ?? null,
      name,
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
      toast.error('Failed to create product. Please try again.');
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

  const syncBrandToDb = useCallback(async (id: string, merged: BrandGuide) => {
    if (!user) return;

    // IMPORTANT: only include organization_id when we actually have one,
    // otherwise we risk overwriting an existing org association with null.
    const dbData = brandGuideToDb(merged, user.id, organization?.id);
    const { error } = await supabase
      .from('brands')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to save changes. Please try again.');
    }

    pendingBrandUpdates.current.delete(id);
  }, [user, organization?.id]);

  const syncProductToDb = useCallback(async (id: string, merged: ProductGuide) => {
    if (!user) return;

    const dbData = productGuideToDb(merged, user.id, organization?.id);
    const { error } = await supabase
      .from('products')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to save changes. Please try again.');
    }

    pendingProductUpdates.current.delete(id);
  }, [user, organization?.id]);

  const updateBrand = useCallback((id: string, updates: Partial<BrandGuide>) => {
    if (!user) {
      toast.error('Please sign in to save changes');
      return;
    }

    // Get current brand state using ref to avoid stale closure issues
    const currentBrand = brandsRef.current.find(b => b.id === id);
    if (!currentBrand) {
      console.warn('Brand not found in local state, attempting update anyway:', id);
    }

    // Merge with any pending updates
    const existingPending = pendingBrandUpdates.current.get(id) || {};
    const allUpdates = { ...existingPending, ...updates };
    pendingBrandUpdates.current.set(id, allUpdates);

    // Optimistic update - update UI immediately
    setBrands(prev => prev.map(brand =>
      brand.id === id ? { ...brand, ...updates, updatedAt: new Date() } : brand
    ));

    // Clear existing timeout for this brand
    const existingTimeout = brandSyncTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounced sync
    const timeout = setTimeout(() => {
      const latestBrand = brandsRef.current.find(b => b.id === id);
      const finalUpdates = pendingBrandUpdates.current.get(id) || {};
      
      // Even if brand not in local state, sync using pending updates with a base object
      const baseData = latestBrand || currentBrand || { id } as BrandGuide;
      const merged = { ...baseData, ...finalUpdates };
      syncBrandToDb(id, merged as BrandGuide);
      
      brandSyncTimeouts.current.delete(id);
    }, SYNC_DEBOUNCE_MS);
    
    brandSyncTimeouts.current.set(id, timeout);
  }, [user, syncBrandToDb]);

  const updateProduct = useCallback((id: string, updates: Partial<ProductGuide>) => {
    if (!user) {
      toast.error('Please sign in to save changes');
      return;
    }

    // Get current product state using ref to avoid stale closure issues
    const currentProduct = productsRef.current.find(p => p.id === id);
    if (!currentProduct) {
      console.warn('Product not found in local state, attempting update anyway:', id);
    }

    // Merge with any pending updates
    const existingPending = pendingProductUpdates.current.get(id) || {};
    const allUpdates = { ...existingPending, ...updates };
    pendingProductUpdates.current.set(id, allUpdates);

    // Optimistic update - update UI immediately
    setProducts(prev => prev.map(product =>
      product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
    ));

    // Clear existing timeout for this product
    const existingTimeout = productSyncTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounced sync
    const timeout = setTimeout(() => {
      const latestProduct = productsRef.current.find(p => p.id === id);
      const finalUpdates = pendingProductUpdates.current.get(id) || {};
      
      // Even if product not in local state, sync using pending updates with a base object
      const baseData = latestProduct || currentProduct || { id } as ProductGuide;
      const merged = { ...baseData, ...finalUpdates };
      syncProductToDb(id, merged as ProductGuide);
      
      productSyncTimeouts.current.delete(id);
    }, SYNC_DEBOUNCE_MS);
    
    productSyncTimeouts.current.set(id, timeout);
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
  const getProduct = (id: string) => products.find(p => p.id === id);

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

  return {
    brands,
    products,
    isLoading,
    addBrand,
    addProduct,
    updateBrand,
    updateProduct,
    deleteBrand,
    deleteProduct,
    getBrand,
    getProduct,
    getRecentlyUpdated,
    toggleFavorite,
    getFavorites,
    refetch: fetchData,
  };
};