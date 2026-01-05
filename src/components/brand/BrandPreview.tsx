import { BrandGuide } from '@/types/brand';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrandPreviewProps {
  brand: BrandGuide;
}

export const BrandPreview = ({ brand }: BrandPreviewProps) => {
  const primaryLogo = brand.logos.find(l => l.variant === 'primary');
  const headingFont = brand.typography.find(t => t.name.toLowerCase().includes('heading') || t.usage.toLowerCase().includes('headline'));
  const bodyFont = brand.typography.find(t => t.name.toLowerCase().includes('body') || t.usage.toLowerCase().includes('body'));

  const exportToPDF = () => {
    // In a real app, this would generate a PDF
    alert('PDF export would be implemented with a library like jsPDF or html2pdf');
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wide opacity-80">Brand Guide Preview</span>
          </div>
          <Button variant="secondary" size="sm" onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        
        <div className="flex items-center gap-6">
          {primaryLogo && (
            <div className="h-16 w-16 bg-primary-foreground rounded-lg flex items-center justify-center p-2">
              <img src={primaryLogo.url} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div>
            <h1 
              className="text-3xl font-semibold"
              style={headingFont ? { fontFamily: headingFont.fontFamily, fontWeight: parseInt(headingFont.weight) } : undefined}
            >
              {brand.name || 'Your Brand'}
            </h1>
            <p 
              className="opacity-80 mt-1"
              style={bodyFont ? { fontFamily: bodyFont.fontFamily } : undefined}
            >
              {brand.description || 'Brand Guidelines'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Colors */}
        {brand.colors.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Color Palette</h3>
            <div className="flex flex-wrap gap-3">
              {brand.colors.map(color => (
                <div key={color.id} className="text-center">
                  <div
                    className="w-16 h-16 rounded-lg shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-xs font-medium mt-2 text-foreground">{color.name}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography */}
        {brand.typography.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Typography</h3>
            <div className="space-y-4">
              {brand.typography.map(type => (
                <div key={type.id} className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{type.name}</span>
                  <span
                    className="text-xl text-foreground"
                    style={{ fontFamily: type.fontFamily, fontWeight: parseInt(type.weight) }}
                  >
                    Aa Bb Cc Dd Ee Ff Gg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logos */}
        {brand.logos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Logo Variations</h3>
            <div className="flex flex-wrap gap-4">
              {brand.logos.slice(0, 4).map(logo => (
                <div
                  key={logo.id}
                  className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center p-3"
                >
                  <img src={logo.url} alt={logo.name} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {brand.colors.length === 0 && brand.typography.length === 0 && brand.logos.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Start adding colors, typography, and logos to see your brand guide preview</p>
          </div>
        )}
      </div>
    </div>
  );
};
