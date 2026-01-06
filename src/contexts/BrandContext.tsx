import { createContext, useContext, ReactNode } from 'react';
import { BrandGuide, ProductGuide, BaseGuide } from '@/types/brand';
import { useBrandStorage } from '@/hooks/useBrandStorage';

interface BrandContextType {
  brands: BrandGuide[];
  products: ProductGuide[];
  isLoading: boolean;
  addBrand: (name: string) => Promise<BrandGuide | null>;
  addProduct: (name: string, parentBrandId?: string) => Promise<ProductGuide | null>;
  updateBrand: (id: string, updates: Partial<BrandGuide>) => void;
  updateProduct: (id: string, updates: Partial<ProductGuide>) => void;
  deleteBrand: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getBrand: (id: string) => BrandGuide | undefined;
  getProduct: (id: string) => ProductGuide | undefined;
  getRecentlyUpdated: () => BaseGuide[];
  toggleFavorite: (id: string, type: 'brand' | 'product') => Promise<void>;
  getFavorites: () => BaseGuide[];
  refetch: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const storage = useBrandStorage();

  return (
    <BrandContext.Provider value={storage}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrands = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrands must be used within a BrandProvider');
  }
  return context;
};