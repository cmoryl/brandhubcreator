// html2pdf is dynamically imported at usage site to avoid pulling 416KB into synchronous bundles
import { BaseGuide } from '@/types/brand';

export type PdfTheme = 'light' | 'dark';
export type PaperSize = 'a4' | 'letter';
export type PdfQuality = 'draft' | 'standard' | 'print';

export interface QualityConfig {
  scale: number;
  imageQuality: number;
  maxImageWidth: number; // px — images wider than this are downsampled in onclone
  label: string;
  description: string;
  estimatedSizeFactor: string;
}

export const PDF_QUALITY_PRESETS: Record<PdfQuality, QualityConfig> = {
  draft: {
    scale: 1,
    imageQuality: 0.5,
    maxImageWidth: 600,
    label: 'Draft',
    description: 'Smaller file, faster export (~3–8 MB)',
    estimatedSizeFactor: '~40%',
  },
  standard: {
    scale: 1.5,
    imageQuality: 0.75,
    maxImageWidth: 1000,
    label: 'Standard',
    description: 'Balanced quality & size (~8–20 MB)',
    estimatedSizeFactor: '~100%',
  },
  print: {
    scale: 2,
    imageQuality: 0.92,
    maxImageWidth: 2000,
    label: 'Print',
    description: 'Maximum quality for printing (~20–40 MB)',
    estimatedSizeFactor: '~200%',
  },
};

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

// Helper to preload images before PDF generation
const preloadImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map((img) => {
    return new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        // Force reload if src is set
        if (img.src) {
          const src = img.src;
          img.src = '';
          img.src = src;
        }
      }
    });
  });
  
  // Wait for all images with a timeout
  await Promise.race([
    Promise.all(imagePromises),
    new Promise(resolve => setTimeout(resolve, 5000)), // 5s timeout
  ]);
};

export const exportToPdf = async (
  element: HTMLElement,
  guide: BaseGuide,
  theme: PdfTheme = 'light',
  paperSize: PaperSize = 'a4',
  onProgress?: (status: string) => void,
  quality: PdfQuality = 'standard',
) => {
  const qualityConfig = PDF_QUALITY_PRESETS[quality];
  onProgress?.('Preparing PDF...');
  
  const paper = PAPER_SIZES[paperSize];
  
  // Preload all images before generating PDF
  onProgress?.('Loading images...');
  await preloadImages(element);
  
  // Calculate proper width for PDF rendering (mm to pixels at higher DPI for quality)
  const pdfWidthPx = Math.round((paper.width - paper.margins[1] - paper.margins[3]) * 3.78);
  
  const opt = {
    margin: paper.margins,
    filename: `${guide.hero.name.replace(/\s+/g, '_')}_Brand_Guide_${theme}_${paperSize.toUpperCase()}.pdf`,
    image: { type: 'jpeg' as const, quality: qualityConfig.imageQuality },
    html2canvas: { 
      scale: qualityConfig.scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      letterRendering: true,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      windowWidth: pdfWidthPx,
      imageTimeout: 15000, // 15 second timeout for images
      onclone: (clonedDoc: Document) => {
        // Ensure all images in cloned doc have proper styling for PDF
        const imgs = clonedDoc.querySelectorAll('img');
        const maxW = qualityConfig.maxImageWidth;
        imgs.forEach((img) => {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.crossOrigin = 'anonymous';
          img.style.pageBreakInside = 'avoid';
          img.style.breakInside = 'avoid';
          // Downsample oversized images to reduce file size
          if (img.naturalWidth > maxW && img.complete) {
            try {
              const canvas = clonedDoc.createElement('canvas');
              const ratio = maxW / img.naturalWidth;
              canvas.width = maxW;
              canvas.height = Math.round(img.naturalHeight * ratio);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                img.src = canvas.toDataURL('image/jpeg', qualityConfig.imageQuality);
              }
            } catch { /* CORS or tainted canvas — keep original */ }
          }
        });
        
        // Apply orphan control to all section headers
        const headers = clonedDoc.querySelectorAll('.pdf-section-header, h1, h2, h3, h4');
        headers.forEach((header) => {
          (header as HTMLElement).style.pageBreakAfter = 'avoid';
          (header as HTMLElement).style.breakAfter = 'avoid';
        });
        
        // Ensure cards and atomic elements don't break
        const atomicElements = clonedDoc.querySelectorAll(
          '.pdf-card, .pdf-logo-item, .pdf-color-swatch, .pdf-value-card, .pdf-stat-card, ' +
          '.pdf-type-specimen, .pdf-gradient-item, .pdf-case-study-card, .pdf-image-container, ' +
          '.pdf-signature-card, .pdf-qr-container, .pdf-avoid-break'
        );
        atomicElements.forEach((el) => {
          (el as HTMLElement).style.pageBreakInside = 'avoid';
          (el as HTMLElement).style.breakInside = 'avoid';
        });
      },
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: paperSize === 'a4' ? 'a4' : 'letter',
      orientation: 'portrait' as const,
      compress: true,
      hotfixes: ['px_scaling'],
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.pdf-page-break-before',
      after: '.pdf-page-break-after',
      avoid: [
        '.pdf-avoid-break',
        '.pdf-card',
        '.pdf-logo-item',
        '.pdf-color-swatch',
        '.pdf-value-card',
        '.pdf-stat-card',
        '.pdf-type-specimen',
        '.pdf-gradient-item',
        '.pdf-case-study-card',
        '.pdf-image-container',
        '.pdf-section-header',
        '.pdf-signature-card',
        '.pdf-qr-container',
        '.pdf-keep-with-next',
        'img'
      ].join(','),
    }
  };

  onProgress?.('Generating PDF...');
  
  try {
    const html2pdf = (await import('html2pdf.js')).default;
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
  { id: 'awards', label: 'Awards & Recognition', category: 'core' },
  { id: 'brief', label: 'Brand Brief & Intelligence', category: 'core' },
  { id: 'insights', label: 'Insights & Updates', category: 'core' },
  
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
  { id: 'approvedimagery', label: 'Approved Imagery', category: 'visual' },
  
  // Content & Communication
  { id: 'social', label: 'Social Profiles', category: 'content' },
  { id: 'socialassets', label: 'Social Assets & Specs', category: 'content' },
  { id: 'socialmetrics', label: 'Social Media Performance', category: 'content' },
  { id: 'website', label: 'Website Links', category: 'content' },
  { id: 'signatures', label: 'Email Signatures', category: 'content' },
  { id: 'qr', label: 'QR Code', category: 'content' },
  { id: 'videos', label: 'Videos', category: 'content' },
  { id: 'webinars', label: 'Webinars', category: 'content' },
  
  // Assets & Resources
  { id: 'assets', label: 'Brand Assets', category: 'assets' },
  { id: 'imageassets', label: 'Image Library', category: 'assets' },
  { id: 'casestudies', label: 'Case Studies', category: 'assets' },
  { id: 'brochures', label: 'Digital Collateral', category: 'assets' },
  { id: 'templates', label: 'Templates', category: 'assets' },
  { id: 'templatespecs', label: 'Template Specifications', category: 'assets' },
  { id: 'presentations', label: 'Presentations', category: 'assets' },
  { id: 'eventsignage', label: 'Event Signage', category: 'assets' },
  { id: 'sponsorlogos', label: 'Sponsor Logos', category: 'assets' },
  { id: 'clientlogos', label: 'Client Logos', category: 'assets' },
  { id: 'locations', label: 'Locations', category: 'assets' },
  { id: 'studios', label: 'Our Studios', category: 'assets' },
  { id: 'products', label: 'Linked Products', category: 'assets' },
  { id: 'events', label: 'Linked Events', category: 'assets' },
  { id: 'universe', label: 'Brand Universe', category: 'assets' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  core: 'Brand Fundamentals',
  visual: 'Visual Identity',
  content: 'Content & Communication',
  assets: 'Assets & Resources',
};
