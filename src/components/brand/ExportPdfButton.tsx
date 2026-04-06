import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FileDown, Loader2, Sun, Moon, Check, ChevronDown, FileText, Printer, List, Brain, Target, Users, TrendingUp, Lightbulb, Minus, Briefcase, Sparkles, Palette, Layout, Image, Calendar, Type, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, SplitSquareVertical, BarChart3, Newspaper, ExternalLink, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseGuide, DEFAULT_SECTION_ORDER, SectionId, BrandSocialAssetSpec, BrandDisplayBannerSpec, TemplateSpec } from '@/types/brand';
import { exportToPdf, PdfTheme, PaperSize, PdfQuality, PDF_QUALITY_PRESETS, PAPER_SIZES, SECTION_METADATA, CATEGORY_LABELS } from '@/lib/exportPdf';
import { PdfLayoutPreset, PDF_PRESETS, CoverPageConfig, DEFAULT_COVER_CONFIG, COVER_LAYOUTS, COVER_PATTERNS, CONFIDENTIALITY_LEVELS, getCoverPatternSvg } from '@/lib/pdfPresets';
import { getAllColorFormats } from '@/lib/colorUtils';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { normalizeGuide } from '@/lib/guideNormalization';
import { supabase } from '@/integrations/supabase/client';
import { AggregatedSocialMetrics, SocialMetricsSnapshot } from '@/types/socialMetrics';
import { SocialMetricsPdfSection } from '@/components/brand/pdf/SocialMetricsPdfSection';
import { BrandIntelligencePdfSection, FullBrandIntelligenceData } from '@/components/brand/pdf/BrandIntelligencePdfSection';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PageBreakIndicator, PrintPageSimulator, PrintPreviewContainer, PageBreakDivider, PrintPreviewHeader, useEstimatedPages } from '@/components/pdf-export';
import '@/styles/pdf-export.css';

// Intelligence data type - re-exported from dedicated PDF section
type BrandIntelligenceData = FullBrandIntelligenceData;

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
  const [layoutPreset, setLayoutPreset] = useState<PdfLayoutPreset>('professional');
  const [coverConfig, setCoverConfig] = useState<CoverPageConfig>(DEFAULT_COVER_CONFIG);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [includeToc, setIncludeToc] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<Set<SectionId>>(new Set(DEFAULT_SECTION_ORDER));
  const [pageBreaksBefore, setPageBreaksBefore] = useState<Set<SectionId>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'visual']));
  const [intelligence, setIntelligence] = useState<BrandIntelligenceData | null>(null);
  const [socialMetrics, setSocialMetrics] = useState<{
    aggregated: AggregatedSocialMetrics | null;
    snapshots: SocialMetricsSnapshot[];
  }>({ aggregated: null, snapshots: [] });
  const [previewZoom, setPreviewZoom] = useState(0.65);
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const [viewMode, setViewMode] = useState<'scroll' | 'single'>('scroll');
  const exportRef = useRef<HTMLDivElement>(null);

  // Toggle page break before a section
  const togglePageBreak = useCallback((sectionId: SectionId) => {
    setPageBreaksBefore(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const sectionOrder = guide.sectionOrder || DEFAULT_SECTION_ORDER;

  // Get primary color from guide for default accent
  const primaryColor = useMemo(() => {
    const primaryColorObj = guide.colors.find(c => c.name.toLowerCase().includes('primary')) || guide.colors[0];
    return primaryColorObj?.hex || '#003b71';
  }, [guide.colors]);

  // Fetch intelligence data when preview opens
  useEffect(() => {
    if (showPreview && guide.id) {
      const fetchIntelligence = async () => {
        try {
          const { data } = await supabase
            .from('brand_intelligence')
            .select('brand_summary, market_position, target_audience, competitive_advantages, brand_voice_profile, growth_recommendations, cultural_insights, competitive_landscape, knowledge_entries, globallink_recommendations, regional_adaptations, bias_awareness_profile, localization_readiness_score, analysis_count, last_analyzed_at')
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
              cultural_insights: data.cultural_insights as Record<string, unknown> | null,
              competitive_landscape: data.competitive_landscape as Record<string, unknown> | null,
              knowledge_entries: (data.knowledge_entries as BrandIntelligenceData['knowledge_entries']) || [],
              globallink_recommendations: data.globallink_recommendations as Record<string, unknown> | null,
              regional_adaptations: data.regional_adaptations as Record<string, unknown> | null,
              bias_awareness_profile: data.bias_awareness_profile as Record<string, unknown> | null,
              localization_readiness_score: data.localization_readiness_score,
              analysis_count: data.analysis_count,
              last_analyzed_at: data.last_analyzed_at,
            });
          }
        } catch (err) {
          logger.debug('No intelligence data found for guide');
        }
      };
      fetchIntelligence();
    }
  }, [showPreview, guide.id]);

  // Fetch social metrics when preview opens
  useEffect(() => {
    if (showPreview && guide.id) {
      const fetchSocialMetrics = async () => {
        try {
          // Fetch aggregated metrics
          const { data: aggregatedData } = await supabase
            .rpc('get_aggregated_social_metrics', {
              p_entity_id: guide.id,
              p_entity_type: guide.type || 'brand'
            });
          
          // Fetch latest snapshots per platform
          const { data: snapshotsData } = await supabase
            .from('social_metrics_snapshots')
            .select('*')
            .eq('entity_id', guide.id)
            .eq('entity_type', guide.type || 'brand')
            .order('snapshot_date', { ascending: false });
          
          // Get latest snapshot per platform
          const latestByPlatform = new Map<string, SocialMetricsSnapshot>();
          (snapshotsData || []).forEach((snapshot: SocialMetricsSnapshot) => {
            if (!latestByPlatform.has(snapshot.platform)) {
              latestByPlatform.set(snapshot.platform, snapshot);
            }
          });
          
          setSocialMetrics({
            aggregated: aggregatedData?.[0] || null,
            snapshots: Array.from(latestByPlatform.values())
          });
        } catch (err) {
          logger.debug('No social metrics data found for guide');
        }
      };
      fetchSocialMetrics();
    }
  }, [showPreview, guide.id, guide.type]);

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
      case 'awards': return (guide.awards?.length ?? 0) > 0;
      case 'brief': return !!(intelligence?.brand_summary || intelligence?.market_position || (intelligence?.growth_recommendations?.length ?? 0) > 0);
      case 'insights': return (guide.insights?.length ?? 0) > 0;
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
      case 'socialassets': return (guide.socialAssets?.length ?? 0) > 0;
      case 'website': return (guide.websites?.length ?? 0) > 0;
      case 'signatures': return guide.signatures.length > 0;
      case 'qr': return !!guide.qr.defaultUrl;
      case 'videos': return (guide.videos?.length ?? 0) > 0;
      case 'webinars': return (guide.webinars?.length ?? 0) > 0;
      case 'assets': return guide.assets.length > 0;
      case 'imageassets': return (guide.imageAssets?.length ?? 0) > 0;
      case 'misuse': return guide.misuse.length > 0;
      case 'casestudies': return guide.caseStudies.length > 0;
      case 'brochures': return guide.brochures.length > 0;
      case 'templates': return guide.templates.length > 0;
      case 'templatespecs': return (guide.templateSpecs?.length ?? 0) > 0;
      case 'presentations': return (guide.presentationTemplates?.length ?? 0) > 0;
      case 'eventsignage': return (guide.eventSignage?.length ?? 0) > 0;
      case 'sponsorlogos': return (guide.sponsorLogos?.length ?? 0) > 0;
      case 'clientlogos': return (guide.clientLogos?.length ?? 0) > 0;
      case 'locations': return (guide.locations?.length ?? 0) > 0;
      case 'studios': return (guide.studios?.length ?? 0) > 0;
      case 'approvedimagery': return !!(guide.approvedImagery && Object.keys(guide.approvedImagery).length > 0);
      case 'products': return (guide.linkedGuides?.length ?? 0) > 0;
      case 'events': return (guide.linkedGuides?.filter(g => g.type === 'event')?.length ?? 0) > 0;
      case 'universe': return (guide.linkedGuides?.length ?? 0) > 0;
      case 'socialmetrics': return !!(socialMetrics.aggregated && socialMetrics.aggregated.platforms_count > 0);
      default: return false;
    }
  }, [guide, intelligence, socialMetrics]);

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
        // Temporarily make the hidden export container visible for html2canvas
        const el = exportRef.current;
        const prevStyle = el.style.cssText;
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.top = '0';
        el.style.zIndex = '-1';
        el.style.opacity = '0.01';
        el.style.pointerEvents = 'none';
        el.style.overflow = 'visible';
        
        await exportToPdf(el, guide, pdfTheme, paperSize, (status) => {
          logger.debug('PDF export status:', status);
        });
        
        // Restore hidden positioning
        el.style.cssText = prevStyle;
        
        // Log the export to audit_logs for tracking
        try {
          await supabase.rpc('insert_audit_log', {
            p_brand_id: guide.id || null,
            p_entity_type: 'pdf',
            p_action_type: 'export',
            p_entity_name: guide.hero?.name || 'Brand Guide',
            p_details: {
              download_type: 'pdf',
              format: 'pdf',
              paper_size: paperSize,
              theme: pdfTheme,
              sections_count: selectedSections.size,
            },
          });
        } catch (logError) {
          console.warn('Failed to log export:', logError);
        }
        
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
        const bgColor = coverConfig.backgroundColor || (pdfTheme === 'dark' ? '#111827' : '#ffffff');
        const accentColor = coverConfig.accentColor || primaryColor;
        const patternBg = getCoverPatternSvg(coverConfig.pattern, accentColor, coverConfig.patternOpacity);
        
        return (
          <div 
            id="pdf-section-hero" 
            className={cn(
              "pdf-section-hero pdf-avoid-break",
              `pdf-cover-${coverConfig.layout}`
            )} 
            key="hero"
            style={{
              backgroundColor: bgColor,
              backgroundImage: patternBg !== 'none' ? patternBg : undefined,
              position: 'relative',
            }}
          >
            {/* Full-bleed background image */}
            {coverConfig.layout === 'full-bleed' && guide.hero.coverImage && coverConfig.showCoverImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${guide.hero.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.3,
                }}
              />
            )}
            
            {/* Content container */}
            <div className={cn(
              "relative z-10",
              coverConfig.layout === 'split' ? 'pdf-cover-split-content' : ''
            )}>
              {/* Logo */}
              {coverConfig.showLogo && guide.hero.logoUrl && (
                <img 
                  src={guide.hero.logoUrl} 
                  alt={guide.hero.name}
                  className="pdf-logo"
                  crossOrigin="anonymous"
                  loading="eager"
                />
              )}
              
              {/* Title */}
              <h1 className="pdf-title" style={{ color: accentColor !== primaryColor ? accentColor : undefined }}>
                {guide.hero.name}
              </h1>
              
              {/* Tagline */}
              {coverConfig.showTagline && guide.hero.tagline && (
                <p className="pdf-tagline">{guide.hero.tagline}</p>
              )}
              
              {/* Document type label */}
              <div style={{ marginTop: '16px', fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines
              </div>
              
              {/* Date */}
              {coverConfig.showDate && (
                <div style={{ marginTop: '12px', fontSize: '10px', opacity: 0.4 }}>
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
              )}
              
              {/* Confidentiality Badge */}
              {coverConfig.confidentialityLevel !== 'none' && (
                <div style={{
                  marginTop: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: `2px solid ${CONFIDENTIALITY_LEVELS.find(l => l.id === coverConfig.confidentialityLevel)?.color || '#dc2626'}`,
                  color: CONFIDENTIALITY_LEVELS.find(l => l.id === coverConfig.confidentialityLevel)?.color || '#dc2626',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}>
                  {coverConfig.confidentialityLevel === 'confidential' ? '🔒 ' : coverConfig.confidentialityLevel === 'draft' ? '📝 ' : '🔐 '}
                  {CONFIDENTIALITY_LEVELS.find(l => l.id === coverConfig.confidentialityLevel)?.label}
                </div>
              )}
            </div>
            
            {/* Cover image for non-full-bleed layouts */}
            {coverConfig.layout !== 'full-bleed' && guide.hero.coverImage && coverConfig.showCoverImage && (
              <div className={cn(
                "pdf-image-container",
                coverConfig.layout === 'split' ? 'pdf-cover-split-image' : 'pdf-image-16-9'
              )} style={{ marginTop: coverConfig.layout !== 'split' ? '24px' : 0, width: coverConfig.layout !== 'split' ? '100%' : undefined }}>
                <img 
                  src={guide.hero.coverImage} 
                  alt="Cover"
                  crossOrigin="anonymous"
                  loading="eager"
                />
              </div>
            )}
            
            {/* Accent decoration */}
            {coverConfig.layout === 'left-aligned' && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: accentColor }}
              />
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
          <div id="pdf-section-values" className={cn("py-6 border-b pdf-section-group", t.border)} key="values">
            <div className="pdf-section-header pdf-keep-with-next">
              <h2>Core Values</h2>
            </div>
            <div className="pdf-grid-2 pdf-section-content">
              {guide.values.map((value) => (
                <div key={value.id} className="pdf-value-card pdf-avoid-break pdf-grid-item-atomic">
                  <div className="pdf-value-title pdf-text-h3">{value.text}</div>
                  <div className="pdf-value-description pdf-text-body">{value.description}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bythenumbers':
        if (!guide.statistics || guide.statistics.length === 0) return null;
        return (
          <div id="pdf-section-bythenumbers" className={cn("py-6 border-b pdf-section-group", t.border)} key="bythenumbers">
            <div className="pdf-section-header pdf-keep-with-next">
              <h2>By the Numbers</h2>
            </div>
            <div className="pdf-grid-3 pdf-section-content">
              {guide.statistics.slice(0, 6).map((stat) => (
                <div key={stat.id} className="pdf-stat-card pdf-avoid-break pdf-grid-item-atomic">
                  <div className="pdf-stat-value pdf-text-display">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div className="pdf-stat-label pdf-text-overline">{stat.label}</div>
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
        if (!intelligence) return null;
        return (
          <BrandIntelligencePdfSection
            key="brief"
            intelligence={intelligence}
            theme={pdfTheme}
          />
        );

      case 'logos':
        if (guide.logos.length === 0) return null;
        return (
          <div id="pdf-section-logos" className={cn("py-6 border-b pdf-section-group", t.border)} key="logos">
            <div className="pdf-section-header pdf-keep-with-next">
              <h2 className="pdf-text-h1">Logo Variations</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 pdf-section-content">
              {guide.logos.map((logo) => (
                <div key={logo.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break pdf-grid-item-atomic", t.card)}>
                  <div className="h-16 flex items-center justify-center mb-2 pdf-image-atomic">
                    <img 
                      src={logo.url} 
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain pdf-logo-image"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <p className={cn("font-medium text-xs pdf-text-caption", t.text)}>{logo.name}</p>
                  <p className={cn("text-xs capitalize pdf-text-caption", t.textMuted)}>{logo.variant}</p>
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
          <div id="pdf-section-colors" className={cn("py-6 border-b pdf-section-group", t.border)} key="colors">
            <div className="pdf-section-header pdf-keep-with-next">
              <h2 className="pdf-text-h1">Color Palette</h2>
            </div>
            <div className="pdf-grid-2 pdf-section-content">
              {guide.colors.map((color) => {
                const formats = getAllColorFormats(color.hex);
                return (
                  <div key={color.id} className="pdf-color-swatch pdf-avoid-break pdf-grid-item-atomic">
                    <div 
                      className="pdf-color-preview"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="pdf-color-info">
                      <div className="pdf-color-name pdf-text-h3">{color.name}</div>
                      <div className="pdf-color-values pdf-text-mono">
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
          <div id="pdf-section-imagery" className={cn("py-6 border-b pdf-section-group", t.border)} key="imagery">
            <div className="pdf-section-header pdf-keep-with-next">
              <h2 className="pdf-text-h1">Imagery Guidelines</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pdf-section-content">
              {guide.imagery.map((img) => (
                <div key={img.id} className={cn("p-2 rounded-lg pdf-avoid-break pdf-grid-item-atomic", t.card)}>
                  <div className="aspect-[16/10] w-full overflow-hidden rounded mb-1 pdf-image-atomic">
                    <img 
                      src={img.url} 
                      alt={img.description} 
                      className="w-full h-full object-cover pdf-gallery-image"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded font-medium pdf-text-overline",
                      img.type === 'do' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {img.type === 'do' ? 'DO' : "DON'T"}
                    </span>
                    <p className={cn("text-xs pdf-text-caption", t.textMuted)}>{img.description}</p>
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
                <div key={profile.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
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
                  {profile.url && (
                    <span className="pdf-link-url">{profile.url}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'socialassets':
        const socialAssets = guide.socialAssets || [];
        const displayBanners = (guide as any).displayBannerSets || (guide as any).socialBannerSets || [];
        if (socialAssets.length === 0 && displayBanners.length === 0) return null;
        return (
          <div id="pdf-section-socialassets" className={cn("py-6 border-b", t.border)} key="socialassets">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Social Assets & Specifications</h2>
            
            {/* Display banner sets with images */}
            {displayBanners.length > 0 && (
              <div className="mb-4">
                <h3 className={cn("font-semibold text-sm mb-2", t.text)}>Social Media Banner Sets</h3>
                <div className="grid grid-cols-2 gap-3">
                  {displayBanners.map((banner: any) => (
                    <div key={banner.id} className={cn("rounded-lg overflow-hidden pdf-avoid-break", t.card)}>
                      {banner.previewUrl && (
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <img src={banner.previewUrl} alt={banner.name || 'Banner'} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className={cn("font-medium text-xs", t.text)}>{banner.name || banner.platform}</p>
                        {banner.dimensions && <p className={cn("text-xs", t.textMuted)}>{banner.dimensions}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                  <span className="pdf-link-url">
                    <ExternalLink className="pdf-link-icon" />
                    {site.url}
                  </span>
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
                  <span className="pdf-link-url">
                    <Link2 className="pdf-link-icon" />
                    {video.url}
                  </span>
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
            <div className="grid grid-cols-2 gap-3">
              {guide.assets.map((asset) => (
                <div key={asset.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {(asset.thumbnailUrl || (asset.url && /\.(jpe?g|png|gif|webp|svg)$/i.test(asset.url))) && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded mb-2">
                      <img 
                        src={asset.thumbnailUrl || asset.url} 
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        loading="eager"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={cn("font-medium text-sm", t.text)}>{asset.name}</p>
                      <p className={cn("text-xs", t.textMuted)}>{asset.type}{asset.category ? ` · ${asset.category}` : ''}</p>
                    </div>
                    <span className={cn("text-xs", t.textSubtle)}>{asset.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'imageassets':
        if (!guide.imageAssets || guide.imageAssets.length === 0) return null;
        return (
          <div id="pdf-section-imageassets" className={cn("py-6 border-b", t.border)} key="imageassets">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Image Library</h2>
            <div className="grid grid-cols-3 gap-3">
              {guide.imageAssets.map((img) => (
                <div key={img.id} className={cn("p-2 rounded-lg pdf-avoid-break", t.card)}>
                  <div className="aspect-[4/3] w-full overflow-hidden rounded mb-1">
                    <img 
                      src={img.url} 
                      alt={img.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      loading="eager"
                    />
                  </div>
                  <p className={cn("font-medium text-xs text-center", t.text)}>{img.name}</p>
                  <p className={cn("text-xs text-center", t.textMuted)}>{img.type} · {img.size}</p>
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
          <div id="pdf-section-casestudies" className={cn("py-6 border-b pdf-page-break-before pdf-section-group", t.border)} key="casestudies">
            <div className="pdf-section-header pdf-keep-with-next" style={{ marginBottom: '16px' }}>
              <FileText className="h-5 w-5" />
              <h2 className="pdf-text-h1">Case Studies & Success Stories</h2>
            </div>
            <div className="space-y-4 pdf-section-content">
              {guide.caseStudies.map((study, idx) => (
                <div 
                  key={study.id} 
                  className={cn(
                    "pdf-case-study-card pdf-avoid-break pdf-grid-item-atomic overflow-hidden",
                    pdfTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  )}
                  style={{ borderRadius: '12px' }}
                >
                  {study.previewUrl && (
                    <div className="pdf-image-container pdf-image-16-9 pdf-image-atomic">
                      <img 
                        src={study.previewUrl} 
                        alt={study.title} 
                        className="pdf-gallery-image"
                        crossOrigin="anonymous"
                        loading="eager"
                      />
                    </div>
                  )}
                  <div className="pdf-case-study-content" style={{ padding: '16px' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={cn("font-bold text-base pdf-text-h2", t.text)}>{study.title}</h3>
                      <span 
                        className={cn(
                          "shrink-0 px-2 py-1 rounded-full text-xs font-medium pdf-text-overline",
                          pdfTheme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        Case #{idx + 1}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed pdf-text-body pdf-widow-control", t.textMuted)}>{study.description}</p>
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
              <p className={cn("text-sm font-medium pdf-text-body", t.text)}>
                {guide.caseStudies.length} documented success {guide.caseStudies.length === 1 ? 'story' : 'stories'} demonstrating brand impact and market results.
              </p>
            </div>
          </div>
        );

      case 'brochures':
        if (guide.brochures.length === 0) return null;
        return (
          <div id="pdf-section-brochures" className={cn("py-6 border-b", t.border)} key="brochures">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Digital Collateral</h2>
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
                  {brochure.externalUrl && (
                    <span className="pdf-link-url mt-1">
                      <ExternalLink className="pdf-link-icon" />
                      {brochure.externalUrl}
                    </span>
                  )}
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
        const productGuides = guide.linkedGuides.filter(g => g.type !== 'event');
        if (productGuides.length === 0) return null;
        return (
          <div id="pdf-section-products" className={cn("py-6 border-b", t.border)} key="products">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Linked Products</h2>
            <div className="grid grid-cols-2 gap-3">
              {productGuides.map((linked) => (
                <div key={linked.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {linked.coverImage && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={linked.coverImage} alt={linked.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-medium text-sm", t.text)}>{linked.name}</p>
                  {(linked as any).tagline && <p className={cn("text-xs italic", t.textMuted)}>{(linked as any).tagline}</p>}
                  {linked.slug && (
                    <span className="pdf-link-url mt-1">
                      <Link2 className="pdf-link-icon" />
                      View in Brand Portal: /{linked.slug}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'events':
        if (!guide.linkedGuides) return null;
        const eventGuides = guide.linkedGuides.filter(g => g.type === 'event');
        if (eventGuides.length === 0) return null;
        return (
          <div id="pdf-section-events" className={cn("py-6 border-b", t.border)} key="events">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Linked Events</h2>
            <div className="grid grid-cols-2 gap-3">
              {eventGuides.map((linked) => (
                <div key={linked.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {linked.coverImage && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={linked.coverImage} alt={linked.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-medium text-sm", t.text)}>{linked.name}</p>
                  {linked.dates && <p className={cn("text-xs", t.textMuted)}>{linked.dates}</p>}
                  {linked.location && <p className={cn("text-xs", t.textSubtle)}>{linked.location}</p>}
                  {linked.slug && (
                    <span className="pdf-link-url mt-1">
                      <Link2 className="pdf-link-icon" />
                      View in Brand Portal: /{linked.slug}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'universe':
        if (!guide.linkedGuides || guide.linkedGuides.length === 0) return null;
        return (
          <div id="pdf-section-universe" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="universe">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Brand Universe</h2>
            <p className={cn("text-sm mb-3", t.textMuted)}>
              {guide.linkedGuides.length} connected {guide.linkedGuides.length === 1 ? 'entity' : 'entities'} across the brand ecosystem.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {guide.linkedGuides.map((linked) => (
                <div key={linked.id} className={cn("p-2 rounded-lg text-center pdf-avoid-break", t.card)}>
                  {(linked.coverImage || undefined) && (
                    <div className="aspect-square w-full overflow-hidden rounded mb-1">
                      <img src={linked.coverImage || undefined} alt={linked.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-medium text-xs", t.text)}>{linked.name}</p>
                  <p className={cn("text-xs capitalize", t.textMuted)}>{linked.type}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'awards':
        if (!guide.awards || guide.awards.length === 0) return null;
        return (
          <div id="pdf-section-awards" className={cn("py-6 border-b", t.border)} key="awards">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Awards & Recognition</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.awards.map((award) => (
                <div key={award.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {award.imageUrl && (
                    <div className="h-16 flex items-center justify-center mb-2">
                      <img src={award.imageUrl} alt={award.title} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{award.title}</p>
                  <p className={cn("text-xs", t.textMuted)}>{award.organization} · {award.year}</p>
                  {award.description && <p className={cn("text-xs mt-1", t.textSubtle)}>{award.description}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'insights':
        if (!guide.insights || guide.insights.length === 0) return null;
        return (
          <div id="pdf-section-insights" className={cn("py-6 border-b", t.border)} key="insights">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Insights & Updates</h2>
            <div className="space-y-3">
              {guide.insights.slice(0, 8).map((insight) => (
                <div key={insight.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {insight.imageUrl && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={insight.imageUrl} alt={insight.title} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{insight.title}</p>
                  {insight.summary && <p className={cn("text-xs mt-1", t.textMuted)}>{insight.summary}</p>}
                  {insight.date && <p className={cn("text-xs mt-1", t.textSubtle)}>{insight.date}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'webinars':
        if (!guide.webinars || guide.webinars.length === 0) return null;
        return (
          <div id="pdf-section-webinars" className={cn("py-6 border-b", t.border)} key="webinars">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Webinars</h2>
            <div className="space-y-2">
              {guide.webinars.map((webinar) => (
                <div key={webinar.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {webinar.thumbnailUrl && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={webinar.thumbnailUrl} alt={webinar.title} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{webinar.title}</p>
                  {webinar.date && <p className={cn("text-xs", t.textMuted)}>{webinar.date}{webinar.duration ? ` · ${webinar.duration}` : ''}</p>}
                  {webinar.description && <p className={cn("text-xs mt-1", t.textSubtle)}>{webinar.description}</p>}
                  {(webinar.recordingUrl || webinar.registrationUrl) && (
                    <span className="pdf-link-url mt-1">
                      <Link2 className="pdf-link-icon" />
                      {webinar.recordingUrl || webinar.registrationUrl}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'presentations':
        if (!guide.presentationTemplates || guide.presentationTemplates.length === 0) return null;
        return (
          <div id="pdf-section-presentations" className={cn("py-6 border-b", t.border)} key="presentations">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Presentations</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.presentationTemplates.map((pres) => (
                <div key={pres.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {(pres.cardImageUrl || pres.thumbnailUrl || pres.slides?.[0]?.thumbnailUrl) && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded mb-2">
                      <img src={pres.cardImageUrl || pres.thumbnailUrl || pres.slides?.[0]?.thumbnailUrl} alt={pres.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{pres.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>
                    {pres.slides?.length || 0} slide{(pres.slides?.length || 0) !== 1 ? 's' : ''}
                    {pres.fileSize ? ` · ${pres.fileSize}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'eventsignage':
        if (!guide.eventSignage || guide.eventSignage.length === 0) return null;
        return (
          <div id="pdf-section-eventsignage" className={cn("py-6 border-b", t.border)} key="eventsignage">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Event Signage</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.eventSignage.map((sign) => (
                <div key={sign.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {sign.previewUrl && (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded mb-2">
                      <img src={sign.previewUrl} alt={sign.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{sign.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{sign.type.replace(/-/g, ' ')} · {sign.dimensions}</p>
                  {sign.notes && <p className={cn("text-xs mt-1", t.textSubtle)}>{sign.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'sponsorlogos':
        if (!guide.sponsorLogos || guide.sponsorLogos.length === 0) return null;
        return (
          <div id="pdf-section-sponsorlogos" className={cn("py-6 border-b", t.border)} key="sponsorlogos">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Sponsor & Partner Logos</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.sponsorLogos.map((logo) => (
                <div key={logo.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  <div className="h-12 flex items-center justify-center mb-2">
                    <img src={logo.url} alt={logo.name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" loading="eager" />
                  </div>
                  <p className={cn("font-medium text-xs", t.text)}>{logo.name}</p>
                  <p className={cn("text-xs capitalize", t.textMuted)}>{logo.tier}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'clientlogos':
        if (!guide.clientLogos || guide.clientLogos.length === 0) return null;
        return (
          <div id="pdf-section-clientlogos" className={cn("py-6 border-b", t.border)} key="clientlogos">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Client Logos</h2>
            <div className="grid grid-cols-4 gap-3">
              {guide.clientLogos.map((client) => (
                <div key={client.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  {client.files?.[0]?.url && (
                    <div className="h-12 flex items-center justify-center mb-2">
                      <img src={client.files[0].url} alt={client.name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-medium text-xs", t.text)}>{client.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{client.files?.length || 0} variant{(client.files?.length || 0) !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'locations':
        if (!guide.locations || guide.locations.length === 0) return null;
        return (
          <div id="pdf-section-locations" className={cn("py-6 border-b", t.border)} key="locations">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Locations</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.locations.map((loc) => (
                <div key={loc.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {loc.imageUrl && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{loc.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{loc.city}, {loc.country}</p>
                  <p className={cn("text-xs capitalize", t.textSubtle)}>{loc.category}</p>
                  {loc.description && <p className={cn("text-xs mt-1", t.textSubtle)}>{loc.description}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'studios':
        if (!guide.studios || guide.studios.length === 0) return null;
        return (
          <div id="pdf-section-studios" className={cn("py-6 border-b", t.border)} key="studios">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Our Studios</h2>
            <div className="grid grid-cols-2 gap-3">
              {guide.studios.map((studio) => (
                <div key={studio.id} className={cn("p-3 rounded-lg pdf-avoid-break", t.card)}>
                  {studio.imageUrl && (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded mb-2">
                      <img src={studio.imageUrl} alt={studio.name} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                    </div>
                  )}
                  <p className={cn("font-semibold text-sm", t.text)}>{studio.name}</p>
                  <p className={cn("text-xs", t.textMuted)}>{studio.location}</p>
                  {studio.specialties && studio.specialties.length > 0 && (
                    <p className={cn("text-xs mt-1", t.textSubtle)}>{studio.specialties.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'approvedimagery':
        if (!guide.approvedImagery || Object.keys(guide.approvedImagery).length === 0) return null;
        const imageryCategories = guide.approvedImagery as unknown as Record<string, { images?: { url: string; caption?: string }[]; description?: string }>;
        return (
          <div id="pdf-section-approvedimagery" className={cn("py-6 border-b", t.border)} key="approvedimagery">
            <h2 className={cn("text-xl font-bold mb-3", t.text)}>Approved Imagery</h2>
            {Object.entries(imageryCategories).map(([category, data]) => (
              <div key={category} className="mb-4">
                <h3 className={cn("font-semibold text-sm mb-2 capitalize", t.text)}>{category}</h3>
                {data?.description && <p className={cn("text-xs mb-2", t.textMuted)}>{data.description}</p>}
                {data?.images && data.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {data.images.map((img, idx) => (
                      <div key={idx} className={cn("rounded-lg overflow-hidden pdf-avoid-break", t.card)}>
                        <div className="aspect-[4/3] w-full overflow-hidden">
                          <img src={img.url} alt={img.caption || category} className="w-full h-full object-cover" crossOrigin="anonymous" loading="eager" />
                        </div>
                        {img.caption && <p className={cn("text-xs p-1.5 text-center", t.textMuted)}>{img.caption}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'socialmetrics':
        if (!socialMetrics.aggregated || socialMetrics.aggregated.platforms_count === 0) return null;
        return (
          <SocialMetricsPdfSection
            key="socialmetrics"
            aggregated={socialMetrics.aggregated}
            snapshots={socialMetrics.snapshots}
            theme={pdfTheme}
          />
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
              {/* Layout Preset Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Layout Style</Label>
                <RadioGroup value={layoutPreset} onValueChange={(v) => setLayoutPreset(v as PdfLayoutPreset)} className="space-y-2">
                  {Object.values(PDF_PRESETS).map((preset) => {
                    const PresetIcon = preset.id === 'minimal' ? Minus : preset.id === 'professional' ? Briefcase : preset.id === 'magazine' ? Newspaper : Sparkles;
                    return (
                      <label
                        key={preset.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          layoutPreset === preset.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem value={preset.id} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <PresetIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{preset.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

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
              
              {/* Cover Page Customization */}
              <Collapsible open={showCoverOptions} onOpenChange={setShowCoverOptions}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between py-2 px-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs font-medium cursor-pointer">Cover Page Options</Label>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showCoverOptions && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  {/* Layout Selection */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Layout</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {COVER_LAYOUTS.map((layout) => (
                        <button
                          key={layout.id}
                          onClick={() => setCoverConfig(prev => ({ ...prev, layout: layout.id }))}
                          className={cn(
                            "text-xs py-1.5 px-2 rounded border transition-all text-left",
                            coverConfig.layout === layout.id 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {layout.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Pattern Selection */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Background Pattern</Label>
                    <div className="flex flex-wrap gap-1">
                      {COVER_PATTERNS.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => setCoverConfig(prev => ({ ...prev, pattern: pattern.id }))}
                          className={cn(
                            "text-xs py-1 px-2 rounded border transition-all",
                            coverConfig.pattern === pattern.id 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {pattern.label}
                        </button>
                      ))}
                    </div>
                    {coverConfig.pattern !== 'none' && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground mb-1 block">Pattern Opacity</Label>
                        <Slider
                          value={[coverConfig.patternOpacity * 100]}
                          onValueChange={([v]) => setCoverConfig(prev => ({ ...prev, patternOpacity: v / 100 }))}
                          max={20}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Color Pickers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Background</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full h-8 rounded border border-border flex items-center gap-2 px-2 hover:border-primary/50 transition-colors">
                            <div 
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: coverConfig.backgroundColor || (pdfTheme === 'dark' ? '#111827' : '#ffffff') }}
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              {coverConfig.backgroundColor || 'Default'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-2">
                            <button
                              onClick={() => setCoverConfig(prev => ({ ...prev, backgroundColor: '' }))}
                              className={cn("w-full text-xs py-1.5 px-2 rounded border text-left", !coverConfig.backgroundColor && "border-primary bg-primary/10")}
                            >
                              Default (from theme)
                            </button>
                            <div className="grid grid-cols-5 gap-1">
                              {['#ffffff', '#f8fafc', '#1e293b', '#0f172a', '#111827', '#18181b', '#003b71', '#139cd8', '#0ea5e9', '#8b5cf6'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setCoverConfig(prev => ({ ...prev, backgroundColor: color }))}
                                  className={cn("w-7 h-7 rounded border-2 transition-transform hover:scale-110", coverConfig.backgroundColor === color && "border-primary ring-2 ring-primary/30")}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={coverConfig.backgroundColor || '#ffffff'}
                              onChange={(e) => setCoverConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                              className="w-full h-8 cursor-pointer rounded"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Accent</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full h-8 rounded border border-border flex items-center gap-2 px-2 hover:border-primary/50 transition-colors">
                            <div 
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: coverConfig.accentColor || primaryColor }}
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              {coverConfig.accentColor || 'Brand'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-2">
                            <button
                              onClick={() => setCoverConfig(prev => ({ ...prev, accentColor: '' }))}
                              className={cn("w-full text-xs py-1.5 px-2 rounded border text-left", !coverConfig.accentColor && "border-primary bg-primary/10")}
                            >
                              Brand Primary
                            </button>
                            <div className="grid grid-cols-5 gap-1">
                              {guide.colors.slice(0, 10).map((color) => (
                                <button
                                  key={color.id}
                                  onClick={() => setCoverConfig(prev => ({ ...prev, accentColor: color.hex }))}
                                  className={cn("w-7 h-7 rounded border-2 transition-transform hover:scale-110", coverConfig.accentColor === color.hex && "border-primary ring-2 ring-primary/30")}
                                  style={{ backgroundColor: color.hex }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={coverConfig.accentColor || primaryColor}
                              onChange={(e) => setCoverConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                              className="w-full h-8 cursor-pointer rounded"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  {/* Element Toggles */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Show Elements</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'showLogo', label: 'Logo', icon: Image },
                        { key: 'showTagline', label: 'Tagline', icon: Type },
                        { key: 'showDate', label: 'Date', icon: Calendar },
                        { key: 'showCoverImage', label: 'Cover Image', icon: Image },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setCoverConfig(prev => ({ ...prev, [key]: !prev[key as keyof CoverPageConfig] }))}
                          className={cn(
                            "flex items-center gap-1.5 text-xs py-1.5 px-2 rounded border transition-all",
                            coverConfig[key as keyof CoverPageConfig]
                              ? "border-primary/50 bg-primary/5 text-foreground"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {coverConfig[key as keyof CoverPageConfig] ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Confidentiality Level */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Confidentiality Badge</Label>
                    <div className="flex flex-wrap gap-1">
                      {CONFIDENTIALITY_LEVELS.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setCoverConfig(prev => ({ ...prev, confidentialityLevel: level.id }))}
                          className={cn(
                            "text-xs py-1 px-2 rounded border transition-all",
                            coverConfig.confidentialityLevel === level.id 
                              ? "border-primary bg-primary/10 text-primary" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Running Footer Toggle */}
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="running-footer" className="text-xs text-muted-foreground cursor-pointer">Running Footer</Label>
                    <Switch
                      id="running-footer"
                      checked={coverConfig.showRunningFooter}
                      onCheckedChange={(checked) => setCoverConfig(prev => ({ ...prev, showRunningFooter: checked }))}
                    />
                  </div>
                  
                  {/* Page Numbers Toggle */}
                  <div className="flex items-center justify-between py-1.5">
                    <Label htmlFor="page-numbers" className="text-xs text-muted-foreground cursor-pointer">Page Numbers</Label>
                    <Switch
                      id="page-numbers"
                      checked={coverConfig.showPageNumbers}
                      onCheckedChange={(checked) => setCoverConfig(prev => ({ ...prev, showPageNumbers: checked }))}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Section Selection */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-medium">Sections ({selectedCount}/{totalWithContent})</Label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>All</Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectNone}>None</Button>
                  </div>
                </div>
                
                {/* Page break legend */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <SplitSquareVertical className="h-2.5 w-2.5" />
                    <span>Hover to add page breaks</span>
                  </div>
                  {pageBreaksBefore.size > 0 && (
                    <button 
                      onClick={() => setPageBreaksBefore(new Set())}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Clear all ({pageBreaksBefore.size})
                    </button>
                  )}
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
                              {sections.map((section, sectionIdx) => {
                                const sectionId = section.id as SectionId;
                                const hasContent = hasSectionContent(sectionId);
                                const isSelected = selectedSections.has(sectionId);
                                const hasPageBreak = pageBreaksBefore.has(sectionId);
                                const canHavePageBreak = hasContent && isSelected && sectionId !== 'hero';
                                
                                return (
                                  <div 
                                    key={section.id}
                                    className={cn(
                                      "group flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors",
                                      hasContent ? "hover:bg-muted" : "opacity-40 cursor-not-allowed",
                                      hasPageBreak && "bg-primary/5 border-l-2 border-primary"
                                    )}
                                  >
                                    <Checkbox 
                                      checked={isSelected}
                                      disabled={!hasContent}
                                      onCheckedChange={() => hasContent && toggleSection(sectionId)}
                                      className="cursor-pointer"
                                    />
                                    <span 
                                      className={cn("text-xs flex-1 cursor-pointer", !hasContent && "cursor-not-allowed")}
                                      onClick={() => hasContent && toggleSection(sectionId)}
                                    >
                                      {section.label}
                                    </span>
                                    
                                    {/* Page break toggle button */}
                                    {canHavePageBreak && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                togglePageBreak(sectionId);
                                              }}
                                              className={cn(
                                                "p-1 rounded transition-all opacity-0 group-hover:opacity-100",
                                                hasPageBreak 
                                                  ? "bg-primary/10 text-primary opacity-100" 
                                                  : "hover:bg-muted-foreground/10 text-muted-foreground"
                                              )}
                                            >
                                              <SplitSquareVertical className="h-3 w-3" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent side="left" className="text-xs">
                                            {hasPageBreak ? 'Remove page break' : 'Add page break before'}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    
                                    {!hasContent && <span className="text-xs text-muted-foreground">(empty)</span>}
                                    {hasPageBreak && (
                                      <span className="text-[10px] text-primary font-medium">⏎</span>
                                    )}
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

            {/* Right panel - Enhanced Print Preview */}
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg bg-gradient-to-b from-muted/20 to-muted/40">
              {/* Preview Header with enhanced controls */}
              <PrintPreviewHeader
                paperSize={paperSize}
                layoutPreset={layoutPreset}
                estimatedPages={Math.ceil(selectedCount / 3) + (selectedSections.has('hero') ? 1 : 0) + (includeToc ? 1 : 0)}
                zoom={previewZoom}
                onZoomChange={setPreviewZoom}
                showMarginGuides={showMarginGuides}
                onShowMarginGuidesChange={setShowMarginGuides}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {/* Preview Content with realistic page simulation */}
              <ScrollArea className="flex-1">
                <div className="p-8 flex justify-center" style={{ background: 'radial-gradient(circle at center, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.6) 100%)' }}>
                  <PrintPreviewContainer zoom={previewZoom}>
                    {/* Hidden export container that wraps ALL content for PDF generation */}
                    <div 
                      ref={exportRef}
                      className={cn(
                        "pdf-export-container",
                        `pdf-preset-${layoutPreset}`,
                        pdfTheme === 'dark' ? 'pdf-theme-dark' : '',
                        t.bg
                      )}
                      style={{ position: 'absolute', left: '-9999px', top: 0, width: `${Math.round((PAPER_SIZES[paperSize].width - PAPER_SIZES[paperSize].margins[1] - PAPER_SIZES[paperSize].margins[3]) * 3.78)}px` }}
                    >
                      {/* Hero / Cover */}
                      {selectedSections.has('hero') && renderSection('hero')}
                      
                      {/* Table of Contents */}
                      {includeToc && includedSections.length > 0 && renderTableOfContents()}
                      
                      {/* All remaining sections */}
                      {sectionOrder.filter(id => id !== 'hero').map((sectionId) => {
                        const hasForcedPageBreak = pageBreaksBefore.has(sectionId) && selectedSections.has(sectionId);
                        const section = renderSection(sectionId);
                        if (!section) return null;
                        return (
                          <div key={`export-${sectionId}`}>
                            {hasForcedPageBreak && <div className="pdf-page-break-before" />}
                            {section}
                          </div>
                        );
                      })}
                      
                      {/* Resource Appendix — collects all linkable URLs */}
                      {(() => {
                        const resources: { name: string; url: string; type: string }[] = [];
                        
                        // Websites
                        if (selectedSections.has('website') && guide.websites) {
                          guide.websites.forEach(s => resources.push({ name: s.label, url: s.url, type: 'Website' }));
                        }
                        // Social profiles
                        if (selectedSections.has('social')) {
                          guide.social.forEach(s => {
                            if (s.url) resources.push({ name: `${s.platform} (${s.handle})`, url: s.url, type: 'Social' });
                          });
                        }
                        // Videos
                        if (selectedSections.has('videos') && guide.videos) {
                          guide.videos.forEach(v => resources.push({ name: v.title, url: v.url, type: 'Video' }));
                        }
                        // Webinars
                        if (selectedSections.has('webinars') && guide.webinars) {
                          guide.webinars.forEach(w => {
                            const url = w.recordingUrl || w.registrationUrl;
                            if (url) resources.push({ name: w.title, url, type: 'Webinar' });
                          });
                        }
                        // Brochures
                        if (selectedSections.has('brochures')) {
                          guide.brochures.forEach(b => {
                            if (b.externalUrl) resources.push({ name: b.title, url: b.externalUrl, type: 'Collateral' });
                          });
                        }
                        // QR
                        if (selectedSections.has('qr') && guide.qr.defaultUrl) {
                          resources.push({ name: 'Brand QR Code', url: guide.qr.defaultUrl, type: 'QR' });
                        }

                        if (resources.length === 0) return null;

                        return (
                          <div className="pdf-resource-appendix pdf-page-break-before pdf-avoid-break">
                            <h3 className={t.text}>Digital Resource Links</h3>
                            <p className={cn("text-xs mb-3", t.textMuted)}>
                              All external URLs referenced in this brand guide for easy access.
                            </p>
                            {resources.map((r, i) => (
                              <div key={i} className="pdf-resource-row">
                                <span className={cn("pdf-resource-name", t.text)}>{r.name}</span>
                                <span className="text-xs opacity-50">{r.type}</span>
                                <span className="pdf-resource-url">{r.url}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      
                      {/* Running footer for every page */}
                      {coverConfig.showRunningFooter && (
                        <div className="pdf-running-footer" style={{
                          position: 'relative',
                          marginTop: '32px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(128,128,128,0.2)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '8px',
                          opacity: 0.4,
                        }}>
                          <span>{guide.hero.name} — {guide.type === 'brand' ? 'Brand' : 'Product'} Guidelines</span>
                          <span>
                            {coverConfig.confidentialityLevel !== 'none' && (
                              <span style={{ color: CONFIDENTIALITY_LEVELS.find(l => l.id === coverConfig.confidentialityLevel)?.color, fontWeight: 700, marginRight: '8px', opacity: 1 }}>
                                {CONFIDENTIALITY_LEVELS.find(l => l.id === coverConfig.confidentialityLevel)?.label?.toUpperCase()}
                              </span>
                            )}
                            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="pdf-footer">
                        <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="mt-1">© {new Date().getFullYear()} {guide.hero.name}. All rights reserved.</p>
                      </div>
                    </div>

                    {/* Visible preview pages (for user display only) */}
                    {/* Cover Page (Page 1) */}
                    {selectedSections.has('hero') && (
                      <>
                        <PrintPageSimulator
                          paperSize={paperSize}
                          theme={pdfTheme}
                          themeClasses={t}
                          showMarginGuides={showMarginGuides}
                          pageNumber={1}
                          totalPages={Math.ceil(selectedCount / 3) + (includeToc ? 2 : 1)}
                          brandName={guide.hero.name}
                        >
                          <div className={cn(
                            "pdf-export-container",
                            `pdf-preset-${layoutPreset}`,
                            pdfTheme === 'dark' ? 'pdf-theme-dark' : '',
                          )}>
                            {renderSection('hero')}
                          </div>
                        </PrintPageSimulator>
                        
                        <PageBreakDivider paperSize={paperSize} />
                      </>
                    )}

                    {/* Table of Contents (Page 2) */}
                    {includeToc && includedSections.length > 0 && (
                      <>
                        <PrintPageSimulator
                          paperSize={paperSize}
                          theme={pdfTheme}
                          themeClasses={t}
                          showMarginGuides={showMarginGuides}
                          pageNumber={selectedSections.has('hero') ? 2 : 1}
                          totalPages={Math.ceil(selectedCount / 3) + (selectedSections.has('hero') ? 1 : 0) + 1}
                          brandName={guide.hero.name}
                        >
                          <div className={cn(
                            "pdf-export-container",
                            `pdf-preset-${layoutPreset}`,
                            pdfTheme === 'dark' ? 'pdf-theme-dark' : '',
                            t.bg
                          )}>
                            {renderTableOfContents()}
                          </div>
                        </PrintPageSimulator>
                        
                        <PageBreakDivider paperSize={paperSize} />
                      </>
                    )}

                    {/* Content Pages */}
                    <PrintPageSimulator
                      paperSize={paperSize}
                      theme={pdfTheme}
                      themeClasses={t}
                      showMarginGuides={showMarginGuides}
                      pageNumber={(selectedSections.has('hero') ? 1 : 0) + (includeToc ? 1 : 0) + 1}
                      totalPages={Math.ceil(selectedCount / 3) + (selectedSections.has('hero') ? 1 : 0) + (includeToc ? 1 : 0)}
                      brandName={guide.hero.name}
                    >
                      <div className={cn(
                        "pdf-export-container",
                        `pdf-preset-${layoutPreset}`,
                        pdfTheme === 'dark' ? 'pdf-theme-dark' : '',
                        t.bg
                      )}>
                        {/* Render remaining sections with page break hints */}
                        {sectionOrder.filter(id => id !== 'hero').map((sectionId, idx) => {
                          const section = renderSection(sectionId);
                          const hasForcedPageBreak = pageBreaksBefore.has(sectionId) && selectedSections.has(sectionId);
                          const hasAutoPageBreak = idx > 0 && idx % 4 === 0 && selectedSections.has(sectionId);
                          const showPageBreak = hasForcedPageBreak || hasAutoPageBreak;
                          
                          return (
                            <div key={sectionId}>
                              {showPageBreak && (
                                <PageBreakIndicator 
                                  pageNumber={Math.floor(idx / 4) + (includeToc ? 3 : 2) + (selectedSections.has('hero') ? 1 : 0)} 
                                  paperSize={paperSize}
                                  className={hasForcedPageBreak ? 'border-primary/40 bg-primary/5' : undefined}
                                />
                              )}
                              {hasForcedPageBreak && (
                                <div className="pdf-page-break-before" />
                              )}
                              {section}
                            </div>
                          );
                        })}

                        {/* Footer */}
                        <div className="pdf-footer">
                          <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <p className="mt-1">© {new Date().getFullYear()} {guide.hero.name}. All rights reserved.</p>
                        </div>
                      </div>
                    </PrintPageSimulator>
                  </PrintPreviewContainer>
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
