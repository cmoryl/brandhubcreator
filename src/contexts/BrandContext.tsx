import { createContext, useContext, ReactNode } from 'react';
import { BrandGuide, ProductGuide, BaseGuide } from '@/types/brand';
import { useBrandStorage } from '@/hooks/useBrandStorage';
import { CACHE_KEYS } from '@/lib/cacheManager';

interface BrandContextType {
  brands: BrandGuide[];
  products: ProductGuide[];
  isLoading: boolean;

  /** Background sync state for backend persistence */
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: Date | null;
  isOnline: boolean;
  lastSyncError: string | null;

  addBrand: (name: string) => Promise<BrandGuide | null>;
  addProduct: (name: string, parentBrandId?: string) => Promise<ProductGuide | null>;
  updateBrand: (id: string, updates: Partial<BrandGuide>) => void;
  updateProduct: (id: string, updates: Partial<ProductGuide>) => void;
  deleteBrand: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getBrand: (id: string) => BrandGuide | undefined;
  getBrandBySlug: (slug: string) => BrandGuide | undefined;
  getProduct: (id: string) => ProductGuide | undefined;
  getProductBySlug: (slug: string) => ProductGuide | undefined;
  getRecentlyUpdated: () => BaseGuide[];
  toggleFavorite: (id: string, type: 'brand' | 'product') => Promise<void>;
  getFavorites: () => BaseGuide[];
  hasPendingChanges: () => boolean;
  saveNow: () => Promise<void>;
  refetch: () => Promise<void>;
  /** Clear local cache (for cache management) */
  clearLocalCache: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const storage = useBrandStorage();

  // Add clearLocalCache function
  const clearLocalCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.BRANDS);
    } catch {
      // Ignore errors
    }
  };

  return (
    <BrandContext.Provider value={{ ...storage, clearLocalCache }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrands = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};