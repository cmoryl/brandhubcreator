import { createContext, useContext, useState, ReactNode } from 'react';
import { BrandGuide } from '@/types/brand';

interface BrandContextType {
  brands: BrandGuide[];
  addBrand: (name: string) => BrandGuide;
  updateBrand: (id: string, updates: Partial<BrandGuide>) => void;
  deleteBrand: (id: string) => void;
  getBrand: (id: string) => BrandGuide | undefined;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const createDefaultBrand = (name: string = 'My Brand'): BrandGuide => ({
  id: crypto.randomUUID(),
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

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brands, setBrands] = useState<BrandGuide[]>([
    createDefaultBrand('Acme Corporation'),
    createDefaultBrand('TechStart'),
  ]);

  const addBrand = (name: string): BrandGuide => {
    const newBrand = createDefaultBrand(name);
    setBrands(prev => [...prev, newBrand]);
    return newBrand;
  };

  const updateBrand = (id: string, updates: Partial<BrandGuide>) => {
    setBrands(prev => prev.map(brand =>
      brand.id === id
        ? { ...brand, ...updates, updatedAt: new Date() }
        : brand
    ));
  };

  const deleteBrand = (id: string) => {
    if (brands.length <= 1) return;
    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const getBrand = (id: string) => brands.find(b => b.id === id);

  return (
    <BrandContext.Provider value={{ brands, addBrand, updateBrand, deleteBrand, getBrand }}>
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
