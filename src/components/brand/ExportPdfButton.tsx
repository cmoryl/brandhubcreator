import { useState, useRef } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseGuide } from '@/types/brand';
import { exportToPdf } from '@/lib/exportPdf';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HeroSection } from './HeroSection';
import { IdentitySection } from './IdentitySection';
import { ValuesSection } from './ValuesSection';
import { LogoSection } from './LogoSection';
import { ColorPaletteSection } from './ColorPaletteSection';
import { TypographySection } from './TypographySection';

interface ExportPdfButtonProps {
  guide: BaseGuide;
}

export const ExportPdfButton = ({ guide }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    setShowPreview(true);
    setIsExporting(true);
    
    // Wait for dialog to render
    setTimeout(async () => {
      if (!exportRef.current) {
        toast.error('Export failed');
        setIsExporting(false);
        setShowPreview(false);
        return;
      }

      try {
        await exportToPdf(exportRef.current, guide, (status) => {
          console.log(status);
        });
        toast.success('PDF exported successfully!');
      } catch (error) {
        toast.error('Failed to export PDF');
      } finally {
        setIsExporting(false);
        setShowPreview(false);
      }
    }, 500);
  };

  // Dummy change handler for read-only sections
  const noop = () => {};

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        Export PDF
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Generating PDF...</DialogTitle>
            <DialogDescription>
              Please wait while we prepare your brand guide for export.
            </DialogDescription>
          </DialogHeader>
          
          {/* Hidden export content */}
          <div 
            ref={exportRef} 
            className="bg-white text-black p-8 space-y-8"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            {/* Cover Page */}
            <div className="text-center py-16 border-b-4 border-gray-900">
              {guide.hero.logoUrl && (
                <img 
                  src={guide.hero.logoUrl} 
                  alt={guide.hero.name}
                  className="h-20 mx-auto mb-8"
                />
              )}
              <h1 className="text-5xl font-bold mb-4">{guide.hero.name}</h1>
              <p className="text-xl text-gray-600">{guide.hero.tagline}</p>
              <div className="mt-8 text-sm text-gray-500">
                {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines
              </div>
            </div>

            {/* Identity Section */}
            {guide.identity.missionStatement && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Brand Identity</h2>
                <p className="text-lg mb-4">{guide.identity.missionStatement}</p>
                {guide.identity.archetype && (
                  <p className="text-gray-600">Archetype: {guide.identity.archetype}</p>
                )}
                {guide.identity.toneOfVoice.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium">Tone of Voice: </span>
                    {guide.identity.toneOfVoice.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Values Section */}
            {guide.values.length > 0 && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Core Values</h2>
                <div className="grid grid-cols-2 gap-4">
                  {guide.values.map((value) => (
                    <div key={value.id} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-1">{value.text}</h3>
                      <p className="text-sm text-gray-600">{value.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Colors Section */}
            {guide.colors.length > 0 && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Color Palette</h2>
                <div className="grid grid-cols-3 gap-4">
                  {guide.colors.map((color) => (
                    <div key={color.id} className="text-center">
                      <div 
                        className="w-full h-20 rounded-lg mb-2"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="font-medium">{color.name}</p>
                      <p className="text-sm text-gray-600">{color.hex}</p>
                      {color.usage && (
                        <p className="text-xs text-gray-500">{color.usage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Section */}
            {guide.typography.length > 0 && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Typography</h2>
                <div className="space-y-4">
                  {guide.typography.map((type) => (
                    <div key={type.id} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-sm" style={{ fontFamily: type.fontFamily }}>
                        {type.fontFamily} - {type.weight}
                      </p>
                      <p className="text-xs text-gray-600">{type.usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logos Section */}
            {guide.logos.length > 0 && (
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Logo Variations</h2>
                <div className="grid grid-cols-2 gap-4">
                  {guide.logos.map((logo) => (
                    <div key={logo.id} className="p-4 bg-gray-50 rounded-lg text-center">
                      <img 
                        src={logo.url} 
                        alt={logo.name}
                        className="h-16 mx-auto mb-2"
                      />
                      <p className="font-medium">{logo.name}</p>
                      <p className="text-xs text-gray-600">{logo.variant}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-8 text-center text-sm text-gray-500">
              <p>Generated on {new Date().toLocaleDateString()}</p>
              <p className="mt-1">© {new Date().getFullYear()} {guide.hero.name}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
