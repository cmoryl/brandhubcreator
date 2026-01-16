import { useState, useEffect } from 'react';
import { Pencil, Check, Copy, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { BrandQR } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './SectionHeader';

interface QRSectionProps {
  qr: BrandQR;
  onQRChange: (qr: BrandQR) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const QRSection = ({ qr, onQRChange, customSubtitle, onSubtitleChange }: QRSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate real QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = qr.defaultUrl || 'https://yourbrand.com';
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: qr.fgColor,
            light: qr.bgColor,
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    };
    generateQR();
  }, [qr.defaultUrl, qr.fgColor, qr.bgColor]);

  const copySettings = async () => {
    const settings = JSON.stringify(qr, null, 2);
    await navigator.clipboard.writeText(settings);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = async () => {
    try {
      const url = qr.defaultUrl || 'https://yourbrand.com';
      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: qr.fgColor,
          light: qr.bgColor,
        },
        errorCorrectionLevel: 'H',
      });
      const link = document.createElement('a');
      link.download = 'brand-qr-code.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('QR download error:', err);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Access Ports"
            defaultSubtitle="Physical-to-digital bridge - brand-compliant QR codes"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2 shrink-0"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Done' : 'Edit QR'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="bg-card rounded-xl p-8 border border-border flex flex-col items-center justify-center">
          <div className="rounded-xl overflow-hidden shadow-lg mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded" />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Scannable QR code with your brand colors
          </p>
          <Button variant="outline" size="sm" onClick={downloadQR} className="gap-2">
            <Download className="h-4 w-4" />
            Download HD
          </Button>
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