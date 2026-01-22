import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FileDown, Loader2, Sun, Moon, Check, ChevronDown, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseGuide, DEFAULT_SECTION_ORDER, SectionId, BrandSocialAssetSpec, BrandDisplayBannerSpec, TemplateSpec } from '@/types/brand';
import { exportToPdf, PdfTheme, PaperSize, PAPER_SIZES, SECTION_METADATA, CATEGORY_LABELS } from '@/lib/exportPdf';
import { getAllColorFormats } from '@/lib/colorUtils';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ExportPdfButtonProps {
  guide: BaseGuide;
}

export const ExportPdfButton = ({ guide }: ExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('light');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<Set<SectionId>>(new Set(DEFAULT_SECTION_ORDER));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'visual']));
  const exportRef = useRef<HTMLDivElement>(null);

  const sectionOrder = guide.sectionOrder || DEFAULT_SECTION_ORDER;

  // Generate QR code when preview opens
  useEffect(() => {
    if (showPreview && guide.qr.defaultUrl) {
      QRCode.toDataURL(guide.qr.defaultUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: guide.qr.fgColor || '#000000',
          light: guide.qr.bgColor || '#ffffff',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [showPreview, guide.qr.defaultUrl, guide.qr.fgColor, guide.qr.bgColor]);

  // Initialize selected sections based on what has content
  useEffect(() => {
    if (showPreview) {
      const sectionsWithContent = sectionOrder.filter(id => hasSectionContent(id));
      setSelectedSections(new Set(sectionsWithContent));
    }
  }, [showPreview, sectionOrder]);

  const hasSectionContent = useCallback((sectionId: SectionId): boolean => {
    switch (sectionId) {
      case 'hero': return !!(guide.hero.name || guide.hero.logoUrl);
      case 'tagline': return !!(guide.tagline?.primary);
      case 'identity': return !!(guide.identity.missionStatement || guide.identity.archetype || guide.identity.toneOfVoice.length > 0);
      case 'values': return guide.values.length > 0;
      case 'bythenumbers': return (guide.statistics?.length ?? 0) > 0;
      case 'services': return (guide.services?.length ?? 0) > 0;
      case 'revenue': return (guide.revenueData?.length ?? 0) > 0;
      case 'logos': return guide.logos.length > 0;
      case 'brandicon': return guide.brandIcons.length > 0;
      case 'colors': return guide.colors.length > 0;
      case 'gradients': return guide.gradients.length > 0;
      case 'patterns': return guide.patterns.length > 0;
      case 'typography': return guide.typography.length > 0;
      case 'textstyles': return guide.textStyles.length > 0;
      case 'iconography': return guide.iconography.length > 0;
      case 'socialicons': return guide.socialIcons.length > 0;
      case 'imagery': return guide.imagery.length > 0;
      case 'social': return guide.social.length > 0;
      case 'socialassets': return (guide.socialAssets?.length ?? 0) > 0 || (guide.displayBanners?.length ?? 0) > 0;
      case 'website': return (guide.websites?.length ?? 0) > 0;
      case 'signatures': return guide.signatures.length > 0;
      case 'qr': return !!guide.qr.defaultUrl;
      case 'videos': return (guide.videos?.length ?? 0) > 0;
      case 'assets': return guide.assets.length > 0;
      case 'misuse': return guide.misuse.length > 0;
      case 'casestudies': return guide.caseStudies.length > 0;
      case 'brochures': return guide.brochures.length > 0;
      case 'templates': return guide.templates.length > 0;
      case 'templatespecs': return (guide.templateSpecs?.length ?? 0) > 0;
      case 'products': return (guide.linkedGuides?.length ?? 0) > 0;
      default: return false;
    }
  }, [guide]);

  const toggleSection = (sectionId: SectionId) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    const categorySections = SECTION_METADATA.filter(s => s.category === category).map(s => s.id as SectionId);
    const allSelected = categorySections.every(id => selectedSections.has(id));
    
    setSelectedSections(prev => {
      const next = new Set(prev);
      categorySections.forEach(id => {
        if (allSelected) {
          next.delete(id);
        } else if (hasSectionContent(id)) {
          next.add(id);
        }
      });
      return next;
    });
  };

  const selectAll = () => {
    const sectionsWithContent = sectionOrder.filter(id => hasSectionContent(id));
    setSelectedSections(new Set(sectionsWithContent));
  };

  const selectNone = () => setSelectedSections(new Set());

  const handleExport = async () => {
    setIsExporting(true);
    
    setTimeout(async () => {
      if (!exportRef.current) {
        toast.error('Export failed');
        setIsExporting(false);
        return;
      }

      try {
        await exportToPdf(exportRef.current, guide, pdfTheme, paperSize, (status) => {
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
      highlight: 'bg-blue-50 border-blue-200',
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-white',
      textMuted: 'text-gray-300',
      textSubtle: 'text-gray-400',
      border: 'border-gray-700',
      card: 'bg-gray-800',
      accent: 'border-white',
      highlight: 'bg-blue-900/30 border-blue-700',
    },
  };

  const t = themeClasses[pdfTheme];
  const paper = PAPER_SIZES[paperSize];

  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof SECTION_METADATA> = {};
    SECTION_METADATA.forEach(section => {
      if (!groups[section.category]) groups[section.category] = [];
      groups[section.category].push(section);
    });
    return groups;
  }, []);

  const renderSection = (sectionId: SectionId) => {
    if (!selectedSections.has(sectionId)) return null;
    if (!hasSectionContent(sectionId)) return null;

    switch (sectionId) {
      case 'hero':
        return (
          <div className={cn("text-center py-12 border-b-4 pdf-avoid-break", t.accent)} key="hero">
            {guide.hero.logoUrl && (
              <img 
                src={guide.hero.logoUrl} 
                alt={guide.hero.name}
                className="h-20 mx-auto mb-6 object-contain"
              />
            )}
            <h1 className={cn("text-4xl font-bold mb-3", t.text)}>{guide.hero.name}</h1>
            <p className={cn("text-lg", t.textMuted)}>{guide.hero.tagline}</p>
            <div className={cn("mt-6 text-sm", t.textSubtle)}>
              {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines
            </div>
            {guide.hero.coverImage && (
              <img 
                src={guide.hero.coverImage} 
                alt="Cover"
                className="w-full h-40 object-cover mt-6 rounded-lg"
              />
            )}
          </div>
        );

      case 'tagline':
        if (!guide.tagline?.primary) return null;
        return (
          <div className={cn("py-6 border-b pdf-avoid-break", t.border)} key="tagline">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Corporate Tagline</h2>
            <div className={cn("p-4 rounded-lg text-center", t.card)}>
              <p className={cn("text-2xl font-semibold", t.text)}
                style={guide.tagline.fontSettings ? {
                  fontFamily: guide.tagline.fontSettings.fontFamily,
                  fontWeight: guide.tagline.fontSettings.fontWeight,
                  letterSpacing: `${guide.tagline.fontSettings.letterSpacing}em`,
                  textTransform: guide.tagline.fontSettings.textTransform,
                } : undefined}
              >
                "{guide.tagline.primary}"
              </p>
              {guide.tagline.secondary && (
                <p className={cn("mt-2 text-sm", t.textMuted)}>{guide.tagline.secondary}</p>
              )}
              {guide.tagline.variations && guide.tagline.variations.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {guide.tagline.variations.map((v, i) => (
                    <span key={i} className={cn("text-xs px-2 py-1 rounded", t.highlight)}>{v}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'identity':
        if (!guide.identity.missionStatement && !guide.identity.archetype && guide.identity.toneOfVoice.length === 0) return null;
        return (
          <div className={cn("py-6 border-b pdf-avoid-break", t.border)} key="identity">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brand Identity</h2>
            {guide.identity.missionStatement && (
              <p className={cn("text-base mb-3", t.text)}>{guide.identity.missionStatement}</p>
            )}
            {guide.identity.archetype && (
              <p className={t.textMuted}>Archetype: <span className={t.text}>{guide.identity.archetype}</span></p>
            )}
            {guide.identity.toneOfVoice.length > 0 && (
              <div className="mt-3">
                <span className={cn("font-medium", t.text)}>Tone of Voice: </span>
                <span className={t.textMuted}>{guide.identity.toneOfVoice.join(', ')}</span>
              </div>
            )}
          </div>
        );

      case 'values':
        if (guide.values.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="values">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Core Values</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.values.map((value) => (
                <div key={value.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  <h3 className={cn("font-semibold mb-1 text-sm", t.text)}>{value.text}</h3>
                  <p className={cn("text-xs", t.textMuted)}>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bythenumbers':
        if (!guide.statistics || guide.statistics.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="bythenumbers">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>By the Numbers</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.statistics.slice(0, 6).map((stat) => (
                <div key={stat.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <p className={cn("text-2xl font-bold", t.text)}>
                    {stat.prefix}{stat.value}{stat.suffix}
                  </p>
                  <p className={cn("text-xs mt-1", t.textMuted)}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'services':
        if (!guide.services || guide.services.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="services">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Services</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.services.map((service) => (
                <div key={service.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  <h3 className={cn("font-semibold text-sm mb-1", t.text)}>{service.name}</h3>
                  <p className={cn("text-xs", t.textMuted)}>{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'revenue':
        if (!guide.revenueData || guide.revenueData.length === 0) return null;
        const sortedRevenue = [...guide.revenueData].sort((a, b) => a.year - b.year);
        const latestRevenue = sortedRevenue[sortedRevenue.length - 1];
        const earliestRevenue = sortedRevenue[0];
        return (
          <div className={cn("py-6 border-b pdf-avoid-break", t.border)} key="revenue">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Revenue Growth</h2>
            <div className={cn("p-4 rounded-lg", t.card)}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className={cn("text-sm", t.textMuted)}>Starting ({earliestRevenue.year})</p>
                  <p className={cn("text-lg font-bold", t.text)}>${earliestRevenue.revenue}M</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm", t.textMuted)}>Current ({latestRevenue.year})</p>
                  <p className={cn("text-lg font-bold", t.text)}>${latestRevenue.revenue}M</p>
                </div>
              </div>
              <div className="flex gap-1">
                {sortedRevenue.slice(-10).map((point, i) => (
                  <div 
                    key={point.year}
                    className="flex-1 bg-primary/20 rounded-t"
                    style={{ 
                      height: `${(point.revenue / latestRevenue.revenue) * 40}px`,
                      minHeight: '4px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'logos':
        if (guide.logos.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="logos">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Logo Variations</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.logos.map((logo) => (
                <div key={logo.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <img 
                    src={logo.url} 
                    alt={logo.name}
                    className="h-12 mx-auto mb-2 object-contain"
                  />
                  <p className={cn("font-medium text-xs", t.text)}>{logo.name}</p>
                  <p className={cn("text-xs capitalize", t.textMuted)}>{logo.variant}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'brandicon':
        if (guide.brandIcons.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="brandicon">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brand Icons</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.brandIcons.map((icon) => (
                <div key={icon.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <img src={icon.url} alt={icon.name} className="h-10 mx-auto mb-2" />
                  <p className={cn("font-medium text-xs", t.text)}>{icon.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'colors':
        if (guide.colors.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="colors">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Color Palette</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.colors.map((color) => {
                const formats = getAllColorFormats(color.hex);
                return (
                  <div key={color.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                    <div className="flex gap-3">
                      <div 
                        className="w-16 h-16 rounded-lg shrink-0 border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm mb-1", t.text)}>{color.name}</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
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
                          {color.pantone && (
                            <div>
                              <span className={cn("font-medium", t.text)}>Pantone:</span>
                              <span className={cn("font-mono ml-1", t.textMuted)}>{color.pantone}</span>
                            </div>
                          )}
                        </div>
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
          <div className={cn("py-6 border-b", t.border)} key="gradients">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Gradients</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.gradients.map((gradient) => (
                <div key={gradient.id} className="text-center pdf-avoid-break">
                  <div 
                    className="w-full h-12 rounded-lg mb-1"
                    style={{ background: gradient.css }}
                  />
                  <p className={cn("font-medium text-xs", t.text)}>{gradient.name}</p>
                  <p className={cn("text-xs font-mono truncate", t.textMuted)}>{gradient.css}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'patterns':
        if (guide.patterns.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="patterns">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Patterns</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.patterns.map((pattern) => (
                <div key={pattern.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <img src={pattern.url} alt={pattern.name} className="w-full h-16 object-cover rounded mb-1" />
                  <p className={cn("font-medium text-xs text-center", t.text)}>{pattern.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'typography':
        if (guide.typography.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="typography">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Typography</h2>
            <div className="space-y-3">
              {guide.typography.map((type) => (
                <div key={type.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  <h3 className={cn("font-semibold text-sm", t.text)}>{type.name}</h3>
                  <p className={cn("text-lg", t.text)} style={{ fontFamily: type.fontFamily }}>
                    {type.fontFamily}
                  </p>
                  <p className={cn("text-xs", t.textMuted)}>Weight: {type.weight} | {type.usage}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'textstyles':
        if (guide.textStyles.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="textstyles">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Text Styles</h2>
            <div className="space-y-1">
              {guide.textStyles.map((style) => (
                <div key={style.id} className={cn("p-2 rounded-lg flex justify-between items-center pdf-avoid-break", t.card)}>
                  <span className={cn("font-mono text-xs", t.text)}>&lt;{style.tag}&gt;</span>
                  <span className={cn("text-xs", t.textMuted)}>
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
          <div className={cn("py-6 border-b", t.border)} key="iconography">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Iconography</h2>
            <div className="grid grid-cols-6 gap-2">
              {guide.iconography.slice(0, 24).map((icon) => (
                <div key={icon.id} className={cn("p-2 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <div className="h-6 flex items-center justify-center mb-0.5">
                    <svg className="w-5 h-5" viewBox={icon.viewBox || "0 0 24 24"} fill="currentColor">
                      <path d={icon.svgPath} />
                    </svg>
                  </div>
                  <p className={cn("text-xs truncate", t.text)}>{icon.name}</p>
                </div>
              ))}
            </div>
            {guide.iconography.length > 24 && (
              <p className={cn("text-xs mt-2 text-center", t.textMuted)}>
                +{guide.iconography.length - 24} more icons available in the digital guide
              </p>
            )}
          </div>
        );

      case 'socialicons':
        if (guide.socialIcons.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="socialicons">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Social Icons</h2>
            <div className="grid grid-cols-6 gap-2">
              {guide.socialIcons.map((icon) => (
                <div key={icon.id} className={cn("p-2 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <div className="h-6 flex items-center justify-center mb-0.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
          <div className={cn("py-6 border-b", t.border)} key="imagery">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Imagery Guidelines</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.imagery.map((img) => (
                <div key={img.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <img src={img.url} alt={img.description} className="w-full h-24 object-cover rounded mb-1" />
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      img.type === 'do' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {img.type === 'do' ? 'DO' : "DON'T"}
                    </span>
                    <p className={cn("text-xs", t.textMuted)}>{img.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'social':
        if (guide.social.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="social">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Social Profiles</h2>
            <div className="grid grid-cols-2 gap-2">
              {guide.social.map((profile) => (
                <div key={profile.id} className={cn("p-2 rounded-lg flex items-center gap-2 pdf-avoid-break", t.card)}>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.platform.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("font-medium text-xs", t.text)}>{profile.platform}</p>
                    <p className={cn("text-xs truncate", t.textMuted)}>{profile.handle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'socialassets':
        const socialAssets = guide.socialAssets || [];
        const displayBanners = guide.displayBanners || [];
        if (socialAssets.length === 0 && displayBanners.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="socialassets">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Social Assets & Banner Specifications</h2>
            {socialAssets.length > 0 && (
              <div className="mb-4">
                <h3 className={cn("font-semibold text-sm mb-2", t.text)}>Platform Specifications</h3>
                <div className="space-y-2">
                  {socialAssets.map((asset: BrandSocialAssetSpec) => (
                    <div key={asset.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={cn("font-medium text-sm", t.text)}>{asset.platform}</p>
                          <p className={cn("text-xs", t.textMuted)}>Post: {asset.postSize}</p>
                          {asset.storySize && <p className={cn("text-xs", t.textMuted)}>Story: {asset.storySize}</p>}
                        </div>
                        <p className={cn("text-xs", t.textSubtle)}>{asset.textLegibility}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {displayBanners.length > 0 && (
              <div>
                <h3 className={cn("font-semibold text-sm mb-2", t.text)}>Display Banner Sizes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {displayBanners.map((banner: BrandDisplayBannerSpec) => (
                    <div key={banner.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                      <p className={cn("font-medium text-xs", t.text)}>{banner.name}</p>
                      <p className={cn("text-xs font-mono", t.textMuted)}>{banner.dimensions}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'website':
        if (!guide.websites || guide.websites.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="website">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Website Links</h2>
            <div className="space-y-2">
              {guide.websites.map((site) => (
                <div key={site.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <p className={cn("font-medium text-sm", t.text)}>{site.label}</p>
                  <p className={cn("text-xs font-mono break-all", t.textMuted)}>{site.url}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'signatures':
        if (guide.signatures.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="signatures">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Email Signatures</h2>
            <div className="space-y-3">
              {guide.signatures.map((sig) => (
                <div key={sig.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  <p className={cn("font-medium text-sm", t.text)}>{sig.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{sig.role}</p>
                  {sig.email && <p className={cn("text-xs", t.textSubtle)}>{sig.email}</p>}
                  {sig.phone && <p className={cn("text-xs", t.textSubtle)}>{sig.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className={cn("py-6 border-b pdf-avoid-break", t.border)} key="qr">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>QR Code</h2>
            <div className={cn("p-4 rounded-lg flex items-start gap-4", t.card)}>
              {qrCodeDataUrl && (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code" 
                  className="w-24 h-24 rounded border shrink-0"
                  style={{ borderColor: guide.qr.fgColor }}
                />
              )}
              <div className="flex-1">
                <p className={cn("mb-2 text-sm", t.text)}>
                  <span className="font-medium">URL:</span> {guide.qr.defaultUrl}
                </p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: guide.qr.fgColor }} />
                    <span className={cn("text-xs", t.textMuted)}>{guide.qr.fgColor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: guide.qr.bgColor }} />
                    <span className={cn("text-xs", t.textMuted)}>{guide.qr.bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'videos':
        if (!guide.videos || guide.videos.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="videos">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Video Resources</h2>
            <div className="space-y-2">
              {guide.videos.map((video) => (
                <div key={video.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <p className={cn("font-medium text-sm", t.text)}>{video.title}</p>
                  <p className={cn("text-xs font-mono break-all", t.textMuted)}>{video.url}</p>
                  {video.description && <p className={cn("text-xs mt-1", t.textSubtle)}>{video.description}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'assets':
        if (guide.assets.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="assets">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brand Assets</h2>
            <div className="space-y-1">
              {guide.assets.map((asset) => (
                <div key={asset.id} className={cn("p-2 rounded-lg flex justify-between items-center pdf-avoid-break", t.card)}>
                  <div>
                    <p className={cn("font-medium text-sm", t.text)}>{asset.name}</p>
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
          <div className={cn("py-6 border-b", t.border)} key="misuse">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Logo Misuse</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.misuse.map((item) => (
                <div key={item.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <img src={item.url} alt={item.description} className="w-full h-20 object-contain mb-1 opacity-50" />
                  <p className={cn("text-xs text-center text-red-500")}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'casestudies':
        if (guide.caseStudies.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="casestudies">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Case Studies</h2>
            <div className="space-y-3">
              {guide.caseStudies.map((study) => (
                <div key={study.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {study.previewUrl && (
                    <img src={study.previewUrl} alt={study.title} className="w-full h-24 object-cover rounded mb-2" />
                  )}
                  <h3 className={cn("font-semibold text-sm mb-1", t.text)}>{study.title}</h3>
                  <p className={cn("text-xs", t.textMuted)}>{study.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'brochures':
        if (guide.brochures.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="brochures">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brochures</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.brochures.map((brochure) => (
                <div key={brochure.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {brochure.previewUrl && (
                    <img src={brochure.previewUrl} alt={brochure.title} className="w-full h-20 object-cover rounded mb-1" />
                  )}
                  <p className={cn("font-medium text-xs", t.text)}>{brochure.title}</p>
                  <p className={cn("text-xs", t.textMuted)}>{brochure.category}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templates':
        if (guide.templates.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="templates">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Templates</h2>
            <div className="space-y-1">
              {guide.templates.map((template) => (
                <div key={template.id} className={cn("p-2 rounded-lg flex justify-between items-center pdf-avoid-break", t.card)}>
                  <div>
                    <p className={cn("font-medium text-sm", t.text)}>{template.name}</p>
                    <p className={cn("text-xs", t.textMuted)}>{template.fileType}</p>
                  </div>
                  <span className={cn("text-xs", t.textSubtle)}>{template.fileSize}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'templatespecs':
        if (!guide.templateSpecs || guide.templateSpecs.length === 0) return null;
        return (
          <div className={cn("py-6 border-b", t.border)} key="templatespecs">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Template Specifications</h2>
            {guide.templateSpecs.map((spec: TemplateSpec) => (
              <div key={spec.id} className={cn("p-3 rounded-lg mb-3 pdf-avoid-break", t.card)}>
                <h3 className={cn("font-semibold text-sm mb-2", t.text)}>{spec.name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {spec.items.map((item) => (
                    <div key={item.id} className={cn("p-2 rounded border text-xs", t.border)}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {item.number}
                        </span>
                        <span className={cn("font-medium", t.text)}>{item.title}</span>
                      </div>
                      <p className={t.textMuted}>{item.description}</p>
                      {item.dimensions && <p className={cn("mt-1 font-mono", t.textSubtle)}>{item.dimensions}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'products':
        if (!guide.linkedGuides || guide.linkedGuides.length === 0) return null;
        return (
          <div className={cn("py-6 border-b pdf-avoid-break", t.border)} key="products">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Linked Products</h2>
            <p className={cn("text-sm", t.textMuted)}>
              {guide.linkedGuides.length} linked {guide.linkedGuides.length === 1 ? 'guide' : 'guides'} available in the digital brand portal.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const selectedCount = selectedSections.size;
  const totalWithContent = sectionOrder.filter(id => hasSectionContent(id)).length;

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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Brand Guide as PDF
            </DialogTitle>
            <DialogDescription>
              Customize your export by selecting sections, theme, and paper size for optimal printing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Left panel - Options */}
            <div className="w-72 shrink-0 flex flex-col gap-4 overflow-hidden">
              {/* Theme & Paper Size */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Theme</Label>
                  <ToggleGroup type="single" value={pdfTheme} onValueChange={(v) => v && setPdfTheme(v as PdfTheme)} className="justify-start">
                    <ToggleGroupItem value="light" aria-label="Light" size="sm" className="gap-1.5">
                      <Sun className="h-3.5 w-3.5" />
                      Light
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" aria-label="Dark" size="sm" className="gap-1.5">
                      <Moon className="h-3.5 w-3.5" />
                      Dark
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Paper Size</Label>
                  <ToggleGroup type="single" value={paperSize} onValueChange={(v) => v && setPaperSize(v as PaperSize)} className="justify-start">
                    <ToggleGroupItem value="a4" aria-label="A4" size="sm" className="gap-1.5">
                      <Printer className="h-3.5 w-3.5" />
                      A4
                    </ToggleGroupItem>
                    <ToggleGroupItem value="letter" aria-label="Letter" size="sm" className="gap-1.5">
                      <Printer className="h-3.5 w-3.5" />
                      Letter
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Section Selection */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Sections ({selectedCount}/{totalWithContent})</Label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>All</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectNone}>None</Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 pr-2">
                  <div className="space-y-2">
                    {Object.entries(groupedSections).map(([category, sections]) => {
                      const categorySections = sections.map(s => s.id as SectionId);
                      const sectionsWithContent = categorySections.filter(id => hasSectionContent(id));
                      const selectedInCategory = sectionsWithContent.filter(id => selectedSections.has(id)).length;
                      const allSelected = sectionsWithContent.length > 0 && selectedInCategory === sectionsWithContent.length;
                      const someSelected = selectedInCategory > 0 && !allSelected;
                      
                      return (
                        <Collapsible 
                          key={category} 
                          open={expandedCategories.has(category)}
                          onOpenChange={(open) => {
                            setExpandedCategories(prev => {
                              const next = new Set(prev);
                              if (open) next.add(category);
                              else next.delete(category);
                              return next;
                            });
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer group">
                              <Checkbox 
                                checked={allSelected || (someSelected ? 'indeterminate' : false)}
                                onCheckedChange={() => toggleCategory(category)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="flex-1 text-xs font-medium">{CATEGORY_LABELS[category]}</span>
                              <span className="text-xs text-muted-foreground">{selectedInCategory}/{sectionsWithContent.length}</span>
                              <ChevronDown className={cn(
                                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                                expandedCategories.has(category) && "rotate-180"
                              )} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-6 space-y-0.5 py-1">
                              {sections.map((section) => {
                                const sectionId = section.id as SectionId;
                                const hasContent = hasSectionContent(sectionId);
                                return (
                                  <div 
                                    key={section.id}
                                    className={cn(
                                      "flex items-center gap-2 py-1 px-2 rounded-md",
                                      hasContent ? "hover:bg-muted cursor-pointer" : "opacity-40 cursor-not-allowed"
                                    )}
                                    onClick={() => hasContent && toggleSection(sectionId)}
                                  >
                                    <Checkbox 
                                      checked={selectedSections.has(sectionId)}
                                      disabled={!hasContent}
                                      onCheckedChange={() => hasContent && toggleSection(sectionId)}
                                    />
                                    <span className="text-xs">{section.label}</span>
                                    {!hasContent && <span className="text-xs text-muted-foreground ml-auto">(empty)</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right panel - Preview */}
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg">
              <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between">
                <span className="text-xs font-medium">Preview</span>
                <span className="text-xs text-muted-foreground">{paper.label}</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 flex justify-center">
                  <div 
                    ref={exportRef} 
                    className={cn("p-6 shadow-lg", t.bg)}
                    style={{ 
                      width: `${paper.width}mm`, 
                      minHeight: `${paper.height}mm`,
                      maxWidth: '100%',
                    }}
                  >
                    {sectionOrder.map((sectionId) => renderSection(sectionId))}

                    {/* Footer */}
                    <div className={cn("pt-6 text-center text-xs", t.textSubtle)}>
                      <p>Generated on {new Date().toLocaleDateString()}</p>
                      <p className="mt-0.5">© {new Date().getFullYear()} {guide.hero.name}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Export button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {selectedCount} section{selectedCount !== 1 ? 's' : ''} selected for export
            </p>
            <Button onClick={handleExport} disabled={isExporting || selectedCount === 0} className="gap-2">
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
