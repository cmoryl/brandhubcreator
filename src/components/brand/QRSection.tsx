import { useState } from 'react';
import { Pencil, Check, QrCode, Copy } from 'lucide-react';
import { BrandQR } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QRSectionProps {
  qr: BrandQR;
  onQRChange: (qr: BrandQR) => void;
}

export const QRSection = ({ qr, onQRChange }: QRSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simple QR code SVG generator (basic representation)
  const generateQRPreview = () => {
    const size = 200;
    const modules = 21; // 21x21 for version 1 QR
    const moduleSize = size / modules;
    
    // Generate a simple pattern (not real QR encoding)
    const pattern: boolean[][] = [];
    for (let i = 0; i < modules; i++) {
      pattern[i] = [];
      for (let j = 0; j < modules; j++) {
        // Position markers
        const isPositionMarker = 
          (i < 7 && j < 7) || 
          (i < 7 && j >= modules - 7) || 
          (i >= modules - 7 && j < 7);
        
        if (isPositionMarker) {
          const inOuter = i < 7 && j < 7 ? (i === 0 || i === 6 || j === 0 || j === 6) :
                         i < 7 && j >= modules - 7 ? (i === 0 || i === 6 || j === modules - 7 || j === modules - 1) :
                         (i === modules - 7 || i === modules - 1 || j === 0 || j === 6);
          const inInner = i < 7 && j < 7 ? (i >= 2 && i <= 4 && j >= 2 && j <= 4) :
                         i < 7 && j >= modules - 7 ? (i >= 2 && i <= 4 && j >= modules - 5 && j <= modules - 3) :
                         (i >= modules - 5 && i <= modules - 3 && j >= 2 && j <= 4);
          pattern[i][j] = inOuter || inInner;
        } else {
          pattern[i][j] = Math.random() > 0.5;
        }
      }
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill={qr.bgColor} />
        {pattern.map((row, i) =>
          row.map((cell, j) =>
            cell ? (
              <rect
                key={`${i}-${j}`}
                x={j * moduleSize}
                y={i * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill={qr.fgColor}
              />
            ) : null
          )
        )}
      </svg>
    );
  };

  const copySettings = async () => {
    const settings = JSON.stringify(qr, null, 2);
    await navigator.clipboard.writeText(settings);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Access Ports</h2>
          <p className="text-muted-foreground mt-1">Physical-to-digital bridge - brand-compliant QR codes</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="bg-card rounded-xl p-8 border border-border flex flex-col items-center justify-center">
          <div className="rounded-xl overflow-hidden shadow-lg mb-4">
            {generateQRPreview()}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Preview with current color settings
          </p>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Default URL</label>
              {isEditing ? (
                <Input
                  value={qr.defaultUrl}
                  onChange={(e) => onQRChange({ ...qr, defaultUrl: e.target.value })}
                  placeholder="https://yourbrand.com"
                />
              ) : (
                <p className="text-foreground font-mono text-sm bg-secondary px-3 py-2 rounded-md">
                  {qr.defaultUrl || 'https://yourbrand.com'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Foreground Color</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={qr.fgColor}
                      onChange={(e) => onQRChange({ ...qr, fgColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={qr.fgColor}
                      onChange={(e) => onQRChange({ ...qr, fgColor: e.target.value })}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: qr.fgColor }} />
                    <span className="font-mono text-sm uppercase">{qr.fgColor}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Background Color</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={qr.bgColor}
                      onChange={(e) => onQRChange({ ...qr, bgColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={qr.bgColor}
                      onChange={(e) => onQRChange({ ...qr, bgColor: e.target.value })}
                      className="flex-1 font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: qr.bgColor }} />
                    <span className="font-mono text-sm uppercase">{qr.bgColor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={copySettings} className="w-full gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Settings'}
          </Button>
        </div>
      </div>
    </section>
  );
};
