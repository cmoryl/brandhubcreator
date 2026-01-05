import { createContext, useContext, useState, ReactNode } from 'react';
import { BrandGuide, ProductGuide, BaseGuide } from '@/types/brand';

interface BrandContextType {
  brands: BrandGuide[];
  products: ProductGuide[];
  addBrand: (name: string) => BrandGuide;
  addProduct: (name: string, parentBrandId?: string) => ProductGuide;
  updateBrand: (id: string, updates: Partial<BrandGuide>) => void;
  updateProduct: (id: string, updates: Partial<ProductGuide>) => void;
  deleteBrand: (id: string) => void;
  deleteProduct: (id: string) => void;
  getBrand: (id: string) => BrandGuide | undefined;
  getProduct: (id: string) => ProductGuide | undefined;
  getRecentlyUpdated: () => BaseGuide[];
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const createDefaultBrand = (name: string = 'My Brand'): BrandGuide => ({
  id: crypto.randomUUID(),
  type: 'brand',
  hero: { name, tagline: 'Crafting exceptional experiences', coverImage: '', logoUrl: '' },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  logos: [],
  brandIcons: [],
  colors: [
    { id: '1', name: 'Primary', hex: '#1a1a2e', usage: 'Main brand color' },
    { id: '2', name: 'Secondary', hex: '#e94560', usage: 'Accent and CTAs' },
    { id: '3', name: 'Background', hex: '#f8f7f4', usage: 'Light backgrounds' },
  ],
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
  signatures: [],
  qr: { defaultUrl: 'https://yourbrand.com', fgColor: '#1a1a2e', bgColor: '#ffffff' },
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  caseStudies: [],
  brochures: [],
  templates: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createDefaultProduct = (name: string = 'My Product', parentBrandId?: string): ProductGuide => ({
  id: crypto.randomUUID(),
  type: 'product',
  parentBrandId,
  hero: { name, tagline: 'Innovative product experience', coverImage: '', logoUrl: '' },
  identity: { missionStatement: '', archetype: '', toneOfVoice: [] },
  values: [],
  logos: [],
  brandIcons: [],
  colors: [
    { id: '1', name: 'Primary', hex: '#2563eb', usage: 'Main product color' },
    { id: '2', name: 'Secondary', hex: '#10b981', usage: 'Accent and CTAs' },
    { id: '3', name: 'Background', hex: '#f8fafc', usage: 'Light backgrounds' },
  ],
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
  signatures: [],
  qr: { defaultUrl: 'https://yourproduct.com', fgColor: '#2563eb', bgColor: '#ffffff' },
  assets: [],
  misuse: [],
  atmosphere: { style: 'gradient', animate: true, opacity: 0.5, blur: 0 },
  caseStudies: [],
  brochures: [],
  templates: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brands, setBrands] = useState<BrandGuide[]>([
    createDefaultBrand('Acme Corporation'),
    createDefaultBrand('TechStart'),
  ]);
  const [products, setProducts] = useState<ProductGuide[]>([]);

  const addBrand = (name: string): BrandGuide => {
    const newBrand = createDefaultBrand(name);
    setBrands(prev => [...prev, newBrand]);
    return newBrand;
  };

  const addProduct = (name: string, parentBrandId?: string): ProductGuide => {
    const newProduct = createDefaultProduct(name, parentBrandId);
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateBrand = (id: string, updates: Partial<BrandGuide>) => {
    setBrands(prev => prev.map(brand =>
      brand.id === id
        ? { ...brand, ...updates, updatedAt: new Date() }
        : brand
    ));
  };

  const updateProduct = (id: string, updates: Partial<ProductGuide>) => {
    setProducts(prev => prev.map(product =>
      product.id === id
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    ));
  };

  const deleteBrand = (id: string) => {
    if (brands.length <= 1) return;
    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const getBrand = (id: string) => brands.find(b => b.id === id);
  const getProduct = (id: string) => products.find(p => p.id === id);

  const getRecentlyUpdated = (): BaseGuide[] => {
    const all = [...brands, ...products];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return all
      .filter(item => item.updatedAt >= oneDayAgo)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  };

  return (
    <BrandContext.Provider value={{ 
      brands, 
      products, 
      addBrand, 
      addProduct, 
      updateBrand, 
      updateProduct, 
      deleteBrand, 
      deleteProduct, 
      getBrand, 
      getProduct,
      getRecentlyUpdated 
    }}>
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
