import { useState, useRef } from 'react';
import { FileDown, Loader2, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseGuide, DEFAULT_SECTION_ORDER, SectionId } from '@/types/brand';
import { exportToPdf } from '@/lib/exportPdf';
import { getAllColorFormats } from '@/lib/colorUtils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ExportPdfButtonProps {
  guide: BaseGuide;
}

type PdfTheme = 'light' | 'dark';

export const ExportPdfButton = ({ guide }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('light');
  const exportRef = useRef<HTMLDivElement>(null);

  const sectionOrder = guide.sectionOrder || DEFAULT_SECTION_ORDER;

  const handleExport = async () => {
    setIsExporting(true);
    
    // Wait for dialog content to render
    setTimeout(async () => {
      if (!exportRef.current) {
        toast.error('Export failed');
        setIsExporting(false);
        return;
      }

      try {
        await exportToPdf(exportRef.current, guide, pdfTheme, (status) => {
          console.log(status);
        });
        toast.success('PDF exported successfully!');
        setShowPreview(false);
      } catch (error) {
        toast.error('Failed to export PDF');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const themeClasses = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      textSubtle: 'text-gray-500',
      border: 'border-gray-200',
      card: 'bg-gray-50',
      accent: 'border-gray-900',
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-white',
      textMuted: 'text-gray-300',
      textSubtle: 'text-gray-400',
      border: 'border-gray-700',
      card: 'bg-gray-800',
      accent: 'border-white',
    },
  };

  const t = themeClasses[pdfTheme];

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'hero':
        return (
          <div className={cn("text-center py-16 border-b-4", t.accent)} key="hero">
            {guide.hero.logoUrl && (
              <img 
                src={guide.hero.logoUrl} 
                alt={guide.hero.name}
                className="h-24 mx-auto mb-8 object-contain"
              />
            )}
            <h1 className={cn("text-5xl font-bold mb-4", t.text)}>{guide.hero.name}</h1>
            <p className={cn("text-xl", t.textMuted)}>{guide.hero.tagline}</p>
            <div className={cn("mt-8 text-sm", t.textSubtle)}>
              {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines
            </div>
            {guide.hero.coverImage && (
              <img 
                src={guide.hero.coverImage} 
                alt="Cover"
                className="w-full h-48 object-cover mt-8 rounded-lg"
              />
            )}
          </div>
        );

      case 'identity':
        if (!guide.identity.missionStatement && !guide.identity.archetype && guide.identity.toneOfVoice.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="identity">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Brand Identity</h2>
            {guide.identity.missionStatement && (
              <p className={cn("text-lg mb-4", t.text)}>{guide.identity.missionStatement}</p>
            )}
            {guide.identity.archetype && (
              <p className={t.textMuted}>Archetype: {guide.identity.archetype}</p>
            )}
            {guide.identity.toneOfVoice.length > 0 && (
              <div className="mt-4">
                <span className={cn("font-medium", t.text)}>Tone of Voice: </span>
                <span className={t.textMuted}>{guide.identity.toneOfVoice.join(', ')}</span>
              </div>
            )}
          </div>
        );

      case 'values':
        if (guide.values.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="values">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Core Values</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.values.map((value) => (
                <div key={value.id} className={cn("p-4 rounded-lg", t.card)}>
                  <h3 className={cn("font-semibold mb-1", t.text)}>{value.text}</h3>
                  <p className={cn("text-sm", t.textMuted)}>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'logos':
        if (guide.logos.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="logos">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Logo Variations</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.logos.map((logo) => (
                <div key={logo.id} className={cn("p-4 rounded-lg text-center", t.card)}>
                  <img 
                    src={logo.url} 
                    alt={logo.name}
                    className="h-16 mx-auto mb-2 object-contain"
                  />
                  <p className={cn("font-medium", t.text)}>{logo.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{logo.variant}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'brandicon':
        if (guide.brandIcons.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="brandicon">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Brand Icons</h2>
            <div className="grid grid-cols-3 gap-4">
              {guide.brandIcons.map((icon) => (
                <div key={icon.id} className={cn("p-4 rounded-lg text-center", t.card)}>
                  <img src={icon.url} alt={icon.name} className="h-12 mx-auto mb-2" />
                  <p className={cn("font-medium text-sm", t.text)}>{icon.name}</p>
                  {icon.settings && <p className={cn("text-xs", t.textMuted)}>{icon.settings}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'colors':
        if (guide.colors.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="colors">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Color Palette</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.colors.map((color) => {
                const formats = getAllColorFormats(color.hex);
                return (
                  <div key={color.id} className={cn("p-4 rounded-lg", t.card)}>
                    <div className="flex gap-4">
                      <div 
                        className="w-20 h-20 rounded-lg shrink-0 border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold mb-2", t.text)}>{color.name}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          <div>
                            <span className={cn("font-medium", t.text)}>HEX:</span>
                            <span className={cn("font-mono ml-1", t.textMuted)}>{formats.hex}</span>
                          </div>
                          <div>
                            <span className={cn("font-medium", t.text)}>RGB:</span>
                            <span className={cn("font-mono ml-1", t.textMuted)}>{formats.rgb.replace('rgb(', '').replace(')', '')}</span>
                          </div>
                          <div>
                            <span className={cn("font-medium", t.text)}>CMYK:</span>
                            <span className={cn("font-mono ml-1", t.textMuted)}>{formats.cmyk.replace('cmyk(', '').replace(')', '')}</span>
                          </div>
                          <div>
                            <span className={cn("font-medium", t.text)}>HSV:</span>
                            <span className={cn("font-mono ml-1", t.textMuted)}>{formats.hsv.replace('hsv(', '').replace(')', '')}</span>
                          </div>
                          {color.pantone && (
                            <div className="col-span-2">
                              <span className={cn("font-medium", t.text)}>Pantone:</span>
                              <span className={cn("font-mono ml-1", t.textMuted)}>{color.pantone}</span>
                            </div>
                          )}
                        </div>
                        {color.usage && (
                          <p className={cn("text-xs mt-2", t.textSubtle)}>{color.usage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'gradients':
        if (guide.gradients.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="gradients">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Gradients</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.gradients.map((gradient) => (
                <div key={gradient.id} className="text-center">
                  <div 
                    className="w-full h-16 rounded-lg mb-2"
                    style={{ background: gradient.css }}
                  />
                  <p className={cn("font-medium", t.text)}>{gradient.name}</p>
                  <p className={cn("text-xs font-mono", t.textMuted)}>{gradient.css}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'patterns':
        if (guide.patterns.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="patterns">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Patterns</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.patterns.map((pattern) => (
                <div key={pattern.id} className={cn("p-4 rounded-lg", t.card)}>
                  <img src={pattern.url} alt={pattern.name} className="w-full h-24 object-cover rounded mb-2" />
                  <p className={cn("font-medium text-center", t.text)}>{pattern.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'typography':
        if (guide.typography.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="typography">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Typography</h2>
            <div className="space-y-4">
              {guide.typography.map((type) => (
                <div key={type.id} className={cn("p-4 rounded-lg", t.card)}>
                  <h3 className={cn("font-semibold", t.text)}>{type.name}</h3>
                  <p className={cn("text-lg", t.text)} style={{ fontFamily: type.fontFamily }}>
                    {type.fontFamily}
                  </p>
                  <p className={cn("text-sm", t.textMuted)}>Weight: {type.weight}</p>
                  <p className={cn("text-xs", t.textSubtle)}>{type.usage}</p>
                  {type.downloadUrl && (
                    <p className={cn("text-xs mt-1", t.textSubtle)}>Download: {type.downloadUrl}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'textstyles':
        if (guide.textStyles.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="textstyles">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Text Styles</h2>
            <div className="space-y-2">
              {guide.textStyles.map((style) => (
                <div key={style.id} className={cn("p-3 rounded-lg flex justify-between items-center", t.card)}>
                  <span className={cn("font-mono", t.text)}>&lt;{style.tag}&gt;</span>
                  <span className={cn("text-sm", t.textMuted)}>
                    {style.size} / {style.weight} / {style.lineHeight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'iconography':
        if (guide.iconography.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="iconography">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Iconography</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.iconography.map((icon) => (
                <div key={icon.id} className={cn("p-3 rounded-lg text-center", t.card)}>
                  <div className="h-8 flex items-center justify-center mb-1">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d={icon.svgPath} />
                    </svg>
                  </div>
                  <p className={cn("text-xs", t.text)}>{icon.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'socialicons':
        if (guide.socialIcons.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="socialicons">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Social Icons</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.socialIcons.map((icon) => (
                <div key={icon.id} className={cn("p-3 rounded-lg text-center", t.card)}>
                  <div className="h-8 flex items-center justify-center mb-1">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d={icon.svgPath} />
                    </svg>
                  </div>
                  <p className={cn("text-xs", t.text)}>{icon.platform}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'imagery':
        if (guide.imagery.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="imagery">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Imagery Guidelines</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.imagery.map((img) => (
                <div key={img.id} className={cn("p-3 rounded-lg", t.card)}>
                  <img src={img.url} alt={img.description} className="w-full h-32 object-cover rounded mb-2" />
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium",
                      img.type === 'do' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {img.type === 'do' ? 'DO' : "DON'T"}
                    </span>
                    <p className={cn("text-sm", t.textMuted)}>{img.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'social':
        if (guide.social.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="social">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Social Profiles</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.social.map((profile) => (
                <div key={profile.id} className={cn("p-3 rounded-lg flex items-center gap-3", t.card)}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.platform.charAt(0)}
                  </div>
                  <div>
                    <p className={cn("font-medium text-sm", t.text)}>{profile.platform}</p>
                    <p className={cn("text-xs", t.textMuted)}>{profile.handle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'signatures':
        if (guide.signatures.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="signatures">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Email Signatures</h2>
            <div className="space-y-4">
              {guide.signatures.map((sig) => (
                <div key={sig.id} className={cn("p-4 rounded-lg", t.card)}>
                  <p className={cn("font-medium", t.text)}>{sig.name}</p>
                  <p className={cn("text-sm", t.textMuted)}>{sig.role}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className={cn("py-8 border-b", t.border)} key="qr">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>QR Code Settings</h2>
            <div className={cn("p-4 rounded-lg", t.card)}>
              <p className={cn("mb-2", t.text)}>
                <span className="font-medium">Default URL:</span> {guide.qr.defaultUrl}
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: guide.qr.fgColor }} />
                  <span className={cn("text-sm", t.textMuted)}>Foreground: {guide.qr.fgColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: guide.qr.bgColor }} />
                  <span className={cn("text-sm", t.textMuted)}>Background: {guide.qr.bgColor}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'assets':
        if (guide.assets.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="assets">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Brand Assets</h2>
            <div className="space-y-2">
              {guide.assets.map((asset) => (
                <div key={asset.id} className={cn("p-3 rounded-lg flex justify-between items-center", t.card)}>
                  <div>
                    <p className={cn("font-medium", t.text)}>{asset.name}</p>
                    <p className={cn("text-xs", t.textMuted)}>{asset.type}</p>
                  </div>
                  <span className={cn("text-xs", t.textSubtle)}>{asset.size}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'misuse':
        if (guide.misuse.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="misuse">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Logo Misuse</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.misuse.map((item) => (
                <div key={item.id} className={cn("p-3 rounded-lg", t.card)}>
                  <img src={item.url} alt={item.description} className="w-full h-24 object-contain mb-2 opacity-50" />
                  <p className={cn("text-sm text-center text-red-500")}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'atmosphere':
        return (
          <div className={cn("py-8 border-b", t.border)} key="atmosphere">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Atmosphere Settings</h2>
            <div className={cn("p-4 rounded-lg", t.card)}>
              <div className="grid grid-cols-2 gap-4">
                <p className={t.text}><span className="font-medium">Style:</span> {guide.atmosphere.style}</p>
                <p className={t.text}><span className="font-medium">Animated:</span> {guide.atmosphere.animate ? 'Yes' : 'No'}</p>
                <p className={t.text}><span className="font-medium">Opacity:</span> {guide.atmosphere.opacity}</p>
                <p className={t.text}><span className="font-medium">Blur:</span> {guide.atmosphere.blur}px</p>
              </div>
            </div>
          </div>
        );

      case 'casestudies':
        if (guide.caseStudies.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="casestudies">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Case Studies</h2>
            <div className="space-y-4">
              {guide.caseStudies.map((study) => (
                <div key={study.id} className={cn("p-4 rounded-lg", t.card)}>
                  {study.previewUrl && (
                    <img src={study.previewUrl} alt={study.title} className="w-full h-32 object-cover rounded mb-3" />
                  )}
                  <h3 className={cn("font-semibold mb-1", t.text)}>{study.title}</h3>
                  <p className={cn("text-sm", t.textMuted)}>{study.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'brochures':
        if (guide.brochures.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="brochures">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Brochures</h2>
            <div className="grid grid-cols-2 gap-4">
              {guide.brochures.map((brochure) => (
                <div key={brochure.id} className={cn("p-4 rounded-lg", t.card)}>
                  {brochure.previewUrl && (
                    <img src={brochure.previewUrl} alt={brochure.title} className="w-full h-24 object-cover rounded mb-2" />
                  )}
                  <p className={cn("font-medium text-sm", t.text)}>{brochure.title}</p>
                  <p className={cn("text-xs", t.textMuted)}>{brochure.category}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templates':
        if (guide.templates.length === 0) return null;
        return (
          <div className={cn("py-8 border-b", t.border)} key="templates">
            <h2 className={cn("text-2xl font-bold mb-4", t.text)}>Templates</h2>
            <div className="space-y-2">
              {guide.templates.map((template) => (
                <div key={template.id} className={cn("p-3 rounded-lg flex justify-between items-center", t.card)}>
                  <div>
                    <p className={cn("font-medium", t.text)}>{template.name}</p>
                    <p className={cn("text-xs", t.textMuted)}>{template.fileType}</p>
                  </div>
                  <span className={cn("text-xs", t.textSubtle)}>{template.fileSize}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setShowPreview(true)}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Export PDF</span>
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Export Brand Guide as PDF</DialogTitle>
            <DialogDescription>
              Choose your preferred theme and export your complete brand guide.
            </DialogDescription>
          </DialogHeader>
          
          {/* Theme selector */}
          <div className="flex items-center justify-between py-4 border-b">
            <Label>PDF Theme</Label>
            <ToggleGroup type="single" value={pdfTheme} onValueChange={(v) => v && setPdfTheme(v as PdfTheme)}>
              <ToggleGroupItem value="light" aria-label="Light theme" className="gap-2">
                <Sun className="h-4 w-4" />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark theme" className="gap-2">
                <Moon className="h-4 w-4" />
                Dark
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          {/* Preview */}
          <div className="max-h-[50vh] overflow-auto rounded-lg border">
            <div 
              ref={exportRef} 
              className={cn("p-8 space-y-6", t.bg)}
              style={{ width: '210mm', minHeight: '297mm' }}
            >
              {sectionOrder.map((sectionId) => renderSection(sectionId))}

              {/* Footer */}
              <div className={cn("pt-8 text-center text-sm", t.textSubtle)}>
                <p>Generated on {new Date().toLocaleDateString()}</p>
                <p className="mt-1">© {new Date().getFullYear()} {guide.hero.name}</p>
              </div>
            </div>
          </div>

          {/* Export button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};