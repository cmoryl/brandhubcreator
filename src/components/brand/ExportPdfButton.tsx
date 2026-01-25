import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FileDown, Loader2, Sun, Moon, Check, ChevronDown, FileText, Printer, List, Brain, Target, Users, TrendingUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseGuide, DEFAULT_SECTION_ORDER, SectionId, BrandSocialAssetSpec, BrandDisplayBannerSpec, TemplateSpec } from '@/types/brand';
import { exportToPdf, PdfTheme, PaperSize, PAPER_SIZES, SECTION_METADATA, CATEGORY_LABELS } from '@/lib/exportPdf';
import { getAllColorFormats } from '@/lib/colorUtils';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { normalizeGuide } from '@/lib/guideNormalization';
import { supabase } from '@/integrations/supabase/client';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import '@/styles/pdf-export.css';

// Intelligence data type
interface BrandIntelligenceData {
  brand_summary: string | null;
  market_position: string | null;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  } | null;
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  } | null;
  growth_recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }[];
}

interface ExportPdfButtonProps {
  guide: BaseGuide;
}

// Get section label from metadata
const getSectionLabel = (sectionId: SectionId): string => {
  const meta = SECTION_METADATA.find(s => s.id === sectionId);
  return meta?.label || sectionId;
};

export const ExportPdfButton = ({ guide: rawGuide }: ExportPdfButtonProps) => {
  // Use centralized normalization to ensure all fields have safe defaults
  const guide = useMemo(() => normalizeGuide(rawGuide), [rawGuide]);

  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('light');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [includeToc, setIncludeToc] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<Set<SectionId>>(new Set(DEFAULT_SECTION_ORDER));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'visual']));
  const [intelligence, setIntelligence] = useState<BrandIntelligenceData | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const sectionOrder = guide.sectionOrder || DEFAULT_SECTION_ORDER;

  // Fetch intelligence data when preview opens
  useEffect(() => {
    if (showPreview && guide.id) {
      const fetchIntelligence = async () => {
        try {
          const { data } = await supabase
            .from('brand_intelligence')
            .select('brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations')
            .eq('entity_id', guide.id)
            .single();
          
          if (data) {
            setIntelligence({
              brand_summary: data.brand_summary,
              market_position: data.market_position,
              target_audience: data.target_audience as BrandIntelligenceData['target_audience'],
              competitive_advantages: (data.competitive_advantages as string[]) || [],
              brand_voice_profile: data.brand_voice_profile as BrandIntelligenceData['brand_voice_profile'],
              growth_recommendations: (data.growth_recommendations as BrandIntelligenceData['growth_recommendations']) || [],
            });
          }
        } catch (err) {
          console.log('No intelligence data found for guide');
        }
      };
      fetchIntelligence();
    }
  }, [showPreview, guide.id]);

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
  }, [showPreview, sectionOrder, intelligence]);

  const hasSectionContent = useCallback((sectionId: SectionId): boolean => {
    switch (sectionId) {
      case 'hero': return !!(guide.hero.name || guide.hero.logoUrl);
      case 'tagline': return !!(guide.tagline?.primary);
      case 'identity': return !!(guide.identity.missionStatement || guide.identity.archetype || guide.identity.toneOfVoice.length > 0);
      case 'values': return guide.values.length > 0;
      case 'bythenumbers': return (guide.statistics?.length ?? 0) > 0;
      case 'services': return (guide.services?.length ?? 0) > 0;
      case 'revenue': return (guide.revenueData?.length ?? 0) > 0;
      case 'brief': return !!(intelligence?.brand_summary || intelligence?.market_position || (intelligence?.growth_recommendations?.length ?? 0) > 0);
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
  }, [guide, intelligence]);

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

  // Group sections by category for the selection UI
  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof SECTION_METADATA> = {};
    SECTION_METADATA.forEach(section => {
      if (!groups[section.category]) groups[section.category] = [];
      groups[section.category].push(section);
    });
    return groups;
  }, []);

  // Get ordered list of sections that will be included (for TOC)
  const includedSections = useMemo(() => {
    return sectionOrder.filter(id => selectedSections.has(id) && hasSectionContent(id) && id !== 'hero');
  }, [sectionOrder, selectedSections, hasSectionContent]);

  // Render Table of Contents
  const renderTableOfContents = () => {
    if (!includeToc || includedSections.length === 0) return null;

    // Group sections by category for organized TOC
    const groupedTocSections: Record<string, SectionId[]> = {};
    includedSections.forEach(sectionId => {
      const meta = SECTION_METADATA.find(s => s.id === sectionId);
      const category = meta?.category || 'other';
      if (!groupedTocSections[category]) groupedTocSections[category] = [];
      groupedTocSections[category].push(sectionId);
    });

    return (
      <div className={cn("py-8 border-b pdf-page-break-after", t.border)} key="toc">
        <div className="flex items-center gap-2 mb-6">
          <List className={cn("h-5 w-5", t.text)} />
          <h2 className={cn("text-2xl font-bold", t.text)}>Table of Contents</h2>
        </div>
        
        <div className="space-y-4">
          {Object.entries(groupedTocSections).map(([category, sections], categoryIndex) => (
            <div key={category}>
              <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-2", t.textSubtle)}>
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="space-y-1">
                {sections.map((sectionId, index) => {
                  const globalIndex = includedSections.indexOf(sectionId) + 1;
                  return (
                    <a
                      key={sectionId}
                      href={`#pdf-section-${sectionId}`}
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded hover:bg-opacity-10 transition-colors group",
                        t.card
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("text-xs font-mono w-6 text-center", t.textMuted)}>
                          {String(globalIndex).padStart(2, '0')}
                        </span>
                        <span className={cn("text-sm font-medium", t.text)}>
                          {getSectionLabel(sectionId)}
                        </span>
                      </div>
                      <div className={cn("flex items-center gap-2", t.textMuted)}>
                        <span className="hidden group-hover:inline text-xs">Jump to section</span>
                        <span className="text-xs font-mono">→</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={cn("mt-6 pt-4 border-t text-xs text-center", t.border, t.textSubtle)}>
          {includedSections.length} section{includedSections.length !== 1 ? 's' : ''} in this guide
        </div>
      </div>
    );
  };

  const renderSection = (sectionId: SectionId) => {
    if (!selectedSections.has(sectionId)) return null;
    if (!hasSectionContent(sectionId)) return null;

    switch (sectionId) {
      case 'hero':
        return (
          <div id="pdf-section-hero" className="pdf-section-hero pdf-avoid-break" key="hero">
            {guide.hero.logoUrl && (
              <img 
                src={guide.hero.logoUrl} 
                alt={guide.hero.name}
                className="pdf-logo"
                crossOrigin="anonymous"
                loading="eager"
              />
            )}
            <h1 className="pdf-title">{guide.hero.name}</h1>
            <p className="pdf-tagline">{guide.hero.tagline}</p>
            <div style={{ marginTop: '16px', fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines
            </div>
            {guide.hero.coverImage && (
              <div className="pdf-image-container pdf-image-16-9" style={{ marginTop: '24px', width: '100%' }}>
                <img 
                  src={guide.hero.coverImage} 
                  alt="Cover"
                  crossOrigin="anonymous"
                  loading="eager"
                />
              </div>
            )}
          </div>
        );

      case 'tagline':
        if (!guide.tagline?.primary) return null;
        return (
          <div id="pdf-section-tagline" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="tagline">
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
          <div id="pdf-section-identity" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="identity">
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
          <div id="pdf-section-values" className={cn("py-6 border-b", t.border)} key="values">
            <div className="pdf-section-header">
              <h2>Core Values</h2>
            </div>
            <div className="pdf-grid-2">
              {guide.values.map((value) => (
                <div key={value.id} className="pdf-value-card pdf-avoid-break">
                  <div className="pdf-value-title">{value.text}</div>
                  <div className="pdf-value-description">{value.description}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bythenumbers':
        if (!guide.statistics || guide.statistics.length === 0) return null;
        return (
          <div id="pdf-section-bythenumbers" className={cn("py-6 border-b", t.border)} key="bythenumbers">
            <div className="pdf-section-header">
              <h2>By the Numbers</h2>
            </div>
            <div className="pdf-grid-3">
              {guide.statistics.slice(0, 6).map((stat) => (
                <div key={stat.id} className="pdf-stat-card pdf-avoid-break">
                  <div className="pdf-stat-value">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div className="pdf-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'services':
        if (!guide.services || guide.services.length === 0) return null;
        return (
          <div id="pdf-section-services" className={cn("py-6 border-b", t.border)} key="services">
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
          <div id="pdf-section-revenue" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="revenue">
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

      case 'brief':
        if (!intelligence?.brand_summary && !intelligence?.market_position && (intelligence?.growth_recommendations?.length ?? 0) === 0) return null;
        return (
          <div id="pdf-section-brief" className={cn("py-6 border-b pdf-page-break-before", t.border)} key="brief">
            <div className="pdf-section-header" style={{ marginBottom: '16px' }}>
              <Brain className="h-5 w-5" />
              <h2>Brand Brief & Intelligence</h2>
            </div>
            
            {/* Brand Summary */}
            {intelligence.brand_summary && (
              <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)}>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className={cn("font-semibold text-sm", t.text)}>Executive Summary</h3>
                </div>
                <p className={cn("text-sm leading-relaxed", t.text)}>{intelligence.brand_summary}</p>
              </div>
            )}

            {/* Market Position & Target Audience */}
            <div className="pdf-grid-2" style={{ marginBottom: '16px' }}>
              {intelligence.market_position && (
                <div className={cn("p-4 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <h3 className={cn("font-semibold text-sm", t.text)}>Market Position</h3>
                  </div>
                  <p className={cn("text-xs", t.textMuted)}>{intelligence.market_position}</p>
                </div>
              )}
              
              {intelligence.target_audience && (
                <div className={cn("p-4 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <h3 className={cn("font-semibold text-sm", t.text)}>Target Audience</h3>
                  </div>
                  <p className={cn("text-xs font-medium mb-1", t.text)}>{intelligence.target_audience.primary}</p>
                  {intelligence.target_audience.demographics?.length > 0 && (
                    <p className={cn("text-xs", t.textMuted)}>
                      {intelligence.target_audience.demographics.join(' • ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Competitive Advantages */}
            {intelligence.competitive_advantages && intelligence.competitive_advantages.length > 0 && (
              <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <h3 className={cn("font-semibold text-sm", t.text)}>Competitive Advantages</h3>
                </div>
                <div className="pdf-grid-2">
                  {intelligence.competitive_advantages.slice(0, 6).map((adv, idx) => (
                    <div 
                      key={idx} 
                      className={cn("px-3 py-2 rounded-md text-xs font-medium pdf-avoid-break", 
                        pdfTheme === 'dark' ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700'
                      )}
                    >
                      {adv}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth Recommendations */}
            {intelligence.growth_recommendations && intelligence.growth_recommendations.length > 0 && (
              <div className={cn("p-4 rounded-lg pdf-avoid-break", t.card)}>
                <h3 className={cn("font-semibold text-sm mb-3", t.text)}>Strategic Recommendations</h3>
                <div className="space-y-3">
                  {intelligence.growth_recommendations.slice(0, 4).map((rec, idx) => (
                    <div 
                      key={idx} 
                      className={cn("p-3 rounded-lg border-l-3 pdf-avoid-break",
                        rec.priority === 'high' ? 'border-l-red-500 bg-red-500/5' :
                        rec.priority === 'medium' ? 'border-l-amber-500 bg-amber-500/5' :
                        'border-l-green-500 bg-green-500/5'
                      )}
                      style={{ borderLeftWidth: '3px' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-bold uppercase px-2 py-0.5 rounded",
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className={cn("text-sm font-medium mb-1", t.text)}>{rec.recommendation}</p>
                      {rec.rationale && (
                        <p className={cn("text-xs", t.textMuted)}>{rec.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Voice Profile */}
            {intelligence.brand_voice_profile && (
              <div className={cn("p-4 rounded-lg mt-4 pdf-avoid-break", t.card)}>
                <h3 className={cn("font-semibold text-sm mb-3", t.text)}>Brand Voice Profile</h3>
                <div className="pdf-grid-3">
                  {intelligence.brand_voice_profile.tone?.length > 0 && (
                    <div>
                      <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Tone</p>
                      <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.tone.join(', ')}</p>
                    </div>
                  )}
                  {intelligence.brand_voice_profile.personality?.length > 0 && (
                    <div>
                      <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Personality</p>
                      <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.personality.join(', ')}</p>
                    </div>
                  )}
                  {intelligence.brand_voice_profile.communication_style && (
                    <div>
                      <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Style</p>
                      <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.communication_style}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'logos':
        if (guide.logos.length === 0) return null;
        return (
          <div id="pdf-section-logos" className={cn("py-6 border-b", t.border)} key="logos">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Logo Variations</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.logos.map((logo) => (
                <div key={logo.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <div className="h-16 flex items-center justify-center mb-2">
                    <img 
                      src={logo.url} 
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
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
          <div id="pdf-section-brandicon" className={cn("py-6 border-b", t.border)} key="brandicon">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brand Icons</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.brandIcons.map((icon) => (
                <div key={icon.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <div className="h-12 flex items-center justify-center mb-2">
                    <img 
                      src={icon.url} 
                      alt={icon.name} 
                      className="max-h-full max-w-full object-contain"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <p className={cn("font-medium text-xs", t.text)}>{icon.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'colors':
        if (guide.colors.length === 0) return null;
        return (
          <div id="pdf-section-colors" className={cn("py-6 border-b", t.border)} key="colors">
            <div className="pdf-section-header">
              <h2>Color Palette</h2>
            </div>
            <div className="pdf-grid-2">
              {guide.colors.map((color) => {
                const formats = getAllColorFormats(color.hex);
                return (
                  <div key={color.id} className="pdf-color-swatch pdf-avoid-break">
                    <div 
                      className="pdf-color-preview"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="pdf-color-info">
                      <div className="pdf-color-name">{color.name}</div>
                      <div className="pdf-color-values">
                        <div><strong>HEX:</strong> {formats.hex}</div>
                        <div><strong>RGB:</strong> {formats.rgb.replace('rgb(', '').replace(')', '')}</div>
                        <div><strong>CMYK:</strong> {formats.cmyk.replace('cmyk(', '').replace(')', '')}</div>
                        {color.pantone && <div><strong>Pantone:</strong> {color.pantone}</div>}
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
          <div id="pdf-section-gradients" className={cn("py-6 border-b", t.border)} key="gradients">
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
          <div id="pdf-section-patterns" className={cn("py-6 border-b", t.border)} key="patterns">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Patterns</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.patterns.map((pattern) => (
                <div key={pattern.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="aspect-[4/3] w-full overflow-hidden rounded mb-1">
                    <img 
                      src={pattern.url} 
                      alt={pattern.name} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <p className={cn("font-medium text-xs text-center", t.text)}>{pattern.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'typography':
        if (guide.typography.length === 0) return null;
        return (
          <div id="pdf-section-typography" className={cn("py-6 border-b", t.border)} key="typography">
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
          <div id="pdf-section-textstyles" className={cn("py-6 border-b", t.border)} key="textstyles">
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
          <div id="pdf-section-iconography" className={cn("py-6 border-b", t.border)} key="iconography">
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
          <div id="pdf-section-socialicons" className={cn("py-6 border-b", t.border)} key="socialicons">
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
          <div id="pdf-section-imagery" className={cn("py-6 border-b", t.border)} key="imagery">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Imagery Guidelines</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.imagery.map((img) => (
                <div key={img.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="aspect-[16/10] w-full overflow-hidden rounded mb-1">
                    <img 
                      src={img.url} 
                      alt={img.description} 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
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
          <div id="pdf-section-social" className={cn("py-6 border-b", t.border)} key="social">
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
          <div id="pdf-section-socialassets" className={cn("py-6 border-b", t.border)} key="socialassets">
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
          <div id="pdf-section-website" className={cn("py-6 border-b", t.border)} key="website">
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
          <div id="pdf-section-signatures" className={cn("py-6 border-b", t.border)} key="signatures">
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
          <div id="pdf-section-qr" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="qr">
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
          <div id="pdf-section-videos" className={cn("py-6 border-b", t.border)} key="videos">
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
          <div id="pdf-section-assets" className={cn("py-6 border-b", t.border)} key="assets">
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
          <div id="pdf-section-misuse" className={cn("py-6 border-b", t.border)} key="misuse">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Logo Misuse</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.misuse.map((item) => (
                <div key={item.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="aspect-[4/3] w-full overflow-hidden rounded mb-1 flex items-center justify-center opacity-50">
                    <img 
                      src={item.url} 
                      alt={item.description} 
                      className="max-w-full max-h-full object-contain"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <p className={cn("text-xs text-center text-red-500")}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'casestudies':
        if (guide.caseStudies.length === 0) return null;
        return (
          <div id="pdf-section-casestudies" className={cn("py-6 border-b pdf-page-break-before", t.border)} key="casestudies">
            <div className="pdf-section-header" style={{ marginBottom: '16px' }}>
              <FileText className="h-5 w-5" />
              <h2>Case Studies & Success Stories</h2>
            </div>
            <div className="space-y-4">
              {guide.caseStudies.map((study, idx) => (
                <div 
                  key={study.id} 
                  className={cn(
                    "pdf-case-study-card pdf-avoid-break overflow-hidden",
                    pdfTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  )}
                  style={{ borderRadius: '12px' }}
                >
                  {study.previewUrl && (
                    <div className="pdf-image-container pdf-image-16-9">
                      <img 
                        src={study.previewUrl} 
                        alt={study.title} 
                        crossOrigin="anonymous"
                        loading="eager"
                      />
                    </div>
                  )}
                  <div className="pdf-case-study-content" style={{ padding: '16px' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={cn("font-bold text-base", t.text)}>{study.title}</h3>
                      <span 
                        className={cn(
                          "shrink-0 px-2 py-1 rounded-full text-xs font-medium",
                          pdfTheme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        Case #{idx + 1}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed", t.textMuted)}>{study.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary callout */}
            <div 
              className={cn("mt-4 p-4 rounded-lg border-l-4 pdf-avoid-break",
                pdfTheme === 'dark' ? 'bg-blue-500/10 border-l-blue-400' : 'bg-blue-50 border-l-blue-500'
              )}
            >
              <p className={cn("text-sm font-medium", t.text)}>
                {guide.caseStudies.length} documented success {guide.caseStudies.length === 1 ? 'story' : 'stories'} demonstrating brand impact and market results.
              </p>
            </div>
          </div>
        );

      case 'brochures':
        if (guide.brochures.length === 0) return null;
        return (
          <div id="pdf-section-brochures" className={cn("py-6 border-b", t.border)} key="brochures">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brochures</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.brochures.map((brochure) => (
                <div key={brochure.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {brochure.previewUrl && (
                    <div className="aspect-[3/4] w-full overflow-hidden rounded mb-1">
                      <img 
                        src={brochure.previewUrl} 
                        alt={brochure.title} 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        loading="eager"
                      />
                    </div>
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
          <div id="pdf-section-templates" className={cn("py-6 border-b", t.border)} key="templates">
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
          <div id="pdf-section-templatespecs" className={cn("py-6 border-b", t.border)} key="templatespecs">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Template Specifications</h2>
            {guide.templateSpecs.map((spec: TemplateSpec) => (
              <div key={spec.id} className={cn("p-3 rounded-lg mb-3 pdf-avoid-break", t.card)}>
                <h3 className={cn("font-semibold text-sm mb-2", t.text)}>{spec.name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(spec.items || []).map((item) => (
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
          <div id="pdf-section-products" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="products">
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

                {/* Table of Contents Toggle */}
                <div className="flex items-center justify-between py-2 px-1 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="toc-toggle" className="text-xs font-medium cursor-pointer">
                      Include Table of Contents
                    </Label>
                  </div>
                  <Switch
                    id="toc-toggle"
                    checked={includeToc}
                    onCheckedChange={setIncludeToc}
                  />
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
                <div className="p-4 flex justify-center bg-muted/30">
                  <div 
                    ref={exportRef} 
                    className={cn(
                      "p-8 shadow-lg pdf-export-container rounded-sm",
                      pdfTheme === 'dark' ? 'pdf-theme-dark' : '',
                      t.bg
                    )}
                    style={{ 
                      width: `${paper.width * 0.95}mm`,
                      minHeight: `${paper.height * 0.5}mm`,
                      maxWidth: '100%',
                    }}
                  >
                    {/* Render Hero first */}
                    {renderSection('hero')}
                    
                    {/* Render Table of Contents after Hero */}
                    {renderTableOfContents()}
                    
                    {/* Render remaining sections */}
                    {sectionOrder.filter(id => id !== 'hero').map((sectionId) => renderSection(sectionId))}

                    {/* Footer */}
                    <div className="pdf-footer">
                      <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="mt-1">© {new Date().getFullYear()} {guide.hero.name}. All rights reserved.</p>
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
