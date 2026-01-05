import html2pdf from 'html2pdf.js';
import { BaseGuide } from '@/types/brand';

export type PdfTheme = 'light' | 'dark';

export const exportToPdf = async (
  element: HTMLElement,
  guide: BaseGuide,
  theme: PdfTheme = 'light',
  onProgress?: (status: string) => void
) => {
  onProgress?.('Preparing PDF...');
  
  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `${guide.hero.name.replace(/\s+/g, '_')}_Brand_Guide_${theme}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4', 
      orientation: 'portrait' as const
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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
