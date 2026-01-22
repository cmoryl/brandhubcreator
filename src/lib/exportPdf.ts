import html2pdf from 'html2pdf.js';
import { BaseGuide } from '@/types/brand';

export type PdfTheme = 'light' | 'dark';
export type PaperSize = 'a4' | 'letter';

export interface PaperConfig {
  width: number; // mm
  height: number; // mm
  label: string;
  margins: [number, number, number, number];
}

export const PAPER_SIZES: Record<PaperSize, PaperConfig> = {
  a4: {
    width: 210,
    height: 297,
    label: 'A4 (210 × 297 mm)',
    margins: [10, 10, 10, 10],
  },
  letter: {
    width: 215.9,
    height: 279.4,
    label: 'US Letter (8.5 × 11 in)',
    margins: [12.7, 12.7, 12.7, 12.7], // 0.5 inch margins
  },
};

export const exportToPdf = async (
  element: HTMLElement,
  guide: BaseGuide,
  theme: PdfTheme = 'light',
  paperSize: PaperSize = 'a4',
  onProgress?: (status: string) => void
) => {
  onProgress?.('Preparing PDF...');
  
  const paper = PAPER_SIZES[paperSize];
  
  const opt = {
    margin: paper.margins,
    filename: `${guide.hero.name.replace(/\s+/g, '_')}_Brand_Guide_${theme}_${paperSize.toUpperCase()}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      windowWidth: Math.round(paper.width * 3.78), // mm to pixels at 96dpi
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: paperSize === 'a4' ? 'a4' : 'letter',
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-break-before',
      after: '.pdf-page-break-after',
      avoid: '.pdf-avoid-break',
    }
  };

  onProgress?.('Generating PDF...');
  
  try {
    await html2pdf().set(opt).from(element).save();
    onProgress?.('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
};

// Section metadata for the selection UI
export interface SectionMeta {
  id: string;
  label: string;
  category: 'core' | 'visual' | 'content' | 'assets';
}

export const SECTION_METADATA: SectionMeta[] = [
  // Core sections
  { id: 'hero', label: 'Hero & Cover', category: 'core' },
  { id: 'tagline', label: 'Corporate Tagline', category: 'core' },
  { id: 'identity', label: 'Brand Identity', category: 'core' },
  { id: 'values', label: 'Core Values', category: 'core' },
  { id: 'bythenumbers', label: 'By the Numbers', category: 'core' },
  { id: 'services', label: 'Services', category: 'core' },
  { id: 'revenue', label: 'Revenue Growth', category: 'core' },
  
  // Visual Identity
  { id: 'logos', label: 'Logo Variations', category: 'visual' },
  { id: 'brandicon', label: 'Brand Icons', category: 'visual' },
  { id: 'colors', label: 'Color Palette', category: 'visual' },
  { id: 'gradients', label: 'Gradients', category: 'visual' },
  { id: 'patterns', label: 'Patterns', category: 'visual' },
  { id: 'typography', label: 'Typography', category: 'visual' },
  { id: 'textstyles', label: 'Text Styles', category: 'visual' },
  { id: 'iconography', label: 'Iconography', category: 'visual' },
  { id: 'socialicons', label: 'Social Icons', category: 'visual' },
  { id: 'imagery', label: 'Imagery Guidelines', category: 'visual' },
  { id: 'misuse', label: 'Logo Misuse', category: 'visual' },
  
  // Content & Communication
  { id: 'social', label: 'Social Profiles', category: 'content' },
  { id: 'socialassets', label: 'Social Assets & Specs', category: 'content' },
  { id: 'website', label: 'Website Links', category: 'content' },
  { id: 'signatures', label: 'Email Signatures', category: 'content' },
  { id: 'qr', label: 'QR Code', category: 'content' },
  { id: 'videos', label: 'Videos', category: 'content' },
  
  // Assets & Resources
  { id: 'assets', label: 'Brand Assets', category: 'assets' },
  { id: 'casestudies', label: 'Case Studies', category: 'assets' },
  { id: 'brochures', label: 'Brochures', category: 'assets' },
  { id: 'templates', label: 'Templates', category: 'assets' },
  { id: 'templatespecs', label: 'Template Specifications', category: 'assets' },
  { id: 'products', label: 'Linked Products', category: 'assets' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  core: 'Brand Fundamentals',
  visual: 'Visual Identity',
  content: 'Content & Communication',
  assets: 'Assets & Resources',
};
