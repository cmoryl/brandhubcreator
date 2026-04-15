/**
 * Section metadata - canonical labels and icons for brand/product sections.
 * Extracted to avoid pulling in DnD libraries when only metadata is needed.
 */
import { 
  Shield, Scroll, Heart, Image, Bookmark, Palette, Blend, Grid3X3, 
  Type, Code, Layers, Share2, Camera, Users, Mail, QrCode, Globe,
  FolderArchive, Ban, FileText, BookOpen, FileType, Video, Quote, Package, Briefcase, LayoutGrid, TrendingUp, BarChart3, Presentation, Calendar, Award, ImageIcon, Crown, Maximize, Star, Building2
} from 'lucide-react';
import { SectionId } from '@/types/brand';

// NOTE: casestudies and templates are deprecated aliases, kept only for backwards compatibility
export const sectionMeta: Record<SectionId, { label: string; icon: React.ElementType; category: string }> = {
  hero: { label: 'Identity Shield', icon: Shield, category: 'Identity' },
  tagline: { label: 'Corporate Tagline', icon: Quote, category: 'Identity' },
  identity: { label: 'Narrative Architecture', icon: Scroll, category: 'Identity' },
  values: { label: 'Philosophical Pillars', icon: Heart, category: 'Identity' },
  bythenumbers: { label: 'By the Numbers', icon: BarChart3, category: 'Identity' },
  services: { label: 'Our Services', icon: Briefcase, category: 'Identity' },
  revenue: { label: 'Revenue Growth', icon: TrendingUp, category: 'Identity' },
  awards: { label: 'Awards & Recognition', icon: Award, category: 'Identity' },
  brief: { label: 'Brand Brief', icon: FileText, category: 'Identity' },
  locations: { label: 'Global Locations', icon: Globe, category: 'Identity' },
  logos: { label: 'Logos', icon: Image, category: 'Visual' },
  brandicon: { label: 'Symbol Standards', icon: Bookmark, category: 'Visual' },
  colors: { label: 'Color Palette', icon: Palette, category: 'Visual' },
  gradients: { label: 'Gradients', icon: Blend, category: 'Visual' },
  patterns: { label: 'Geometric Primitives', icon: Grid3X3, category: 'Visual' },
  typography: { label: 'Type Registry', icon: Type, category: 'Typography' },
  textstyles: { label: 'CSS Hierarchies', icon: Code, category: 'Typography' },
  iconography: { label: 'Iconography', icon: Layers, category: 'Assets' },
  socialicons: { label: 'Platform Markers', icon: Share2, category: 'Assets' },
  imagery: { label: 'Visual Direction', icon: Camera, category: 'Assets' },
  social: { label: 'Social Registry', icon: Users, category: 'Communication' },
  socialassets: { label: 'Social Assets & Guidelines', icon: LayoutGrid, category: 'Communication' },
  website: { label: 'Website', icon: Globe, category: 'Communication' },
  signatures: { label: 'Signature Protocol', icon: Mail, category: 'Communication' },
  qr: { label: 'QR Codes', icon: QrCode, category: 'Communication' },
  videos: { label: 'Video Resources', icon: Video, category: 'Resources' },
  webinars: { label: 'Webinar Series', icon: Presentation, category: 'Resources' },
  assets: { label: 'Operational Vault', icon: FolderArchive, category: 'Resources' },
  imageassets: { label: 'Image Assets', icon: ImageIcon, category: 'Resources' },
  misuse: { label: 'Anti-Patterns', icon: Ban, category: 'Resources' },
  insights: { label: 'Insights & Updates', icon: TrendingUp, category: 'Resources' },
  brochures: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templatespecs: { label: 'Template Specs', icon: FileText, category: 'Collateral' },
  presentations: { label: 'Presentation Templates', icon: Presentation, category: 'Collateral' },
  products: { label: 'Products', icon: Package, category: 'Collateral' },
  events: { label: 'Events', icon: Calendar, category: 'Collateral' },
  universe: { label: 'Product Universe', icon: Globe, category: 'Collateral' },
  sponsorlogos: { label: 'Sponsor Logos', icon: Crown, category: 'Collateral' },
  clientlogos: { label: 'Client Logos', icon: Users, category: 'Collateral' },
  eventsignage: { label: 'Event Signage', icon: Maximize, category: 'Collateral' },
  socialmetrics: { label: 'Social Performance', icon: TrendingUp, category: 'Communication' },
  approvedimagery: { label: 'Approved Imagery', icon: ImageIcon, category: 'Assets' },
  casestudies: { label: 'Digital Collateral', icon: BookOpen, category: 'Collateral' },
  templates: { label: 'Presentation Templates', icon: Presentation, category: 'Collateral' },
  studios: { label: 'Our Studios', icon: Building2, category: 'Ecosystem' },
};
