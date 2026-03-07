import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  FileDown, 
  Loader2, 
  Sun, 
  Moon, 
  ChevronDown, 
  List, 
  Brain, 
  Sparkles,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  BookOpen,
  Calendar,
  MapPin,
  Building2,
  Hash,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventGuide } from '@/types/event';
import { exportToPdf, PdfTheme, PaperSize, PAPER_SIZES, CATEGORY_LABELS } from '@/lib/exportPdf';
import { supabase } from '@/integrations/supabase/client';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventExportPdfButtonProps {
  event: EventGuide;
}

interface BrandIntelligence {
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
  knowledge_entries: {
    id: string;
    type: string;
    content: string;
    source: string;
    category?: string;
    created_at: string;
  }[];
  analysis_count: number;
  last_analyzed_at: string | null;
}

// Event-specific section metadata
const EVENT_SECTION_METADATA = [
  // Core Event Info
  { id: 'hero', label: 'Event Cover', category: 'core' },
  { id: 'eventdetails', label: 'Event Details', category: 'core' },
  { id: 'tagline', label: 'Event Tagline', category: 'core' },
  { id: 'intelligence', label: 'AI Event Intelligence', category: 'core' },
  
  // Venue & Location
  { id: 'eventlocation', label: 'Venue & Location', category: 'venue' },
  { id: 'eventwebsites', label: 'Event Websites', category: 'venue' },
  
  // Event Assets
  { id: 'eventlogos', label: 'Event Logos', category: 'assets' },
  { id: 'eventsignage', label: 'Signage', category: 'assets' },
  { id: 'eventprint', label: 'Print Collateral', category: 'assets' },
  { id: 'eventbanners', label: 'Digital Banners', category: 'assets' },
  { id: 'eventdigital', label: 'Digital Materials', category: 'assets' },
  
  // Visual
  { id: 'colors', label: 'Color Palette', category: 'visual' },
  { id: 'gradients', label: 'Gradients', category: 'visual' },
  { id: 'typography', label: 'Typography', category: 'visual' },
  { id: 'imagery', label: 'Imagery Guidelines', category: 'visual' },
  
  // Program
  { id: 'eventschedule', label: 'Schedule', category: 'program' },
  { id: 'eventspeakers', label: 'Speakers', category: 'program' },
  { id: 'eventsponsors', label: 'Sponsors', category: 'program' },
  
  // Archive
  { id: 'eventhistory', label: 'Event History', category: 'archive' },
];

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  core: 'Event Fundamentals',
  venue: 'Venue & Location',
  assets: 'Event Assets',
  visual: 'Visual Identity',
  program: 'Event Program',
  archive: 'Archive',
};

export const EventExportPdfButton = ({ event }: EventExportPdfButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<PdfTheme>('light');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [includeToc, setIncludeToc] = useState(true);
  const [includeIntelligence, setIncludeIntelligence] = useState(true);
  const [intelligence, setIntelligence] = useState<BrandIntelligence | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'venue']));
  const exportRef = useRef<HTMLDivElement>(null);

  // Fetch intelligence when preview opens
  useEffect(() => {
    if (showPreview && includeIntelligence) {
      fetchIntelligence();
    }
  }, [showPreview, includeIntelligence, event.id]);

  const fetchIntelligence = async () => {
    setLoadingIntelligence(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { action: 'get', entityType: 'event', entityId: event.id }
      });
      if (!error && data?.intelligence) {
        setIntelligence(data.intelligence);
      }
    } catch (err) {
      console.error('Failed to fetch intelligence:', err);
    } finally {
      setLoadingIntelligence(false);
    }
  };

  const hasSectionContent = useCallback((sectionId: string): boolean => {
    switch (sectionId) {
      case 'hero': return !!(event.hero.name || event.hero.logoUrl);
      case 'eventdetails': return !!(event.eventDetails?.eventName);
      case 'tagline': return !!(event.tagline?.primary);
      case 'intelligence': return !!intelligence?.brand_summary;
      case 'eventlocation': return !!(event.eventLocation?.venueName || event.eventLocation?.address);
      case 'eventwebsites': return (event.websites?.length ?? 0) > 0;
      case 'eventlogos': return (event.eventLogos?.length ?? 0) > 0;
      case 'eventsignage': return (event.eventSignage?.length ?? 0) > 0;
      case 'eventbanners': return (event.eventBanners?.length ?? 0) > 0;
      case 'eventdigital': return (event.eventDigitalMaterials?.length ?? 0) > 0;
      case 'colors': return (event.colors?.length ?? 0) > 0;
      case 'gradients': return (event.gradients?.length ?? 0) > 0;
      case 'typography': return (event.typography?.length ?? 0) > 0;
      case 'imagery': return (event.imagery?.length ?? 0) > 0;
      case 'eventschedule': return (event.eventSchedule?.length ?? 0) > 0;
      case 'eventspeakers': return (event.eventSpeakers?.length ?? 0) > 0;
      case 'eventsponsors': return (event.eventSponsors?.length ?? 0) > 0;
      case 'eventhistory': return (event.eventHistory?.length ?? 0) > 0;
      default: return false;
    }
  }, [event, intelligence]);

  // Initialize selected sections
  useEffect(() => {
    if (showPreview) {
      const sectionsWithContent = EVENT_SECTION_METADATA.map(s => s.id).filter(id => hasSectionContent(id));
      setSelectedSections(new Set(sectionsWithContent));
    }
  }, [showPreview, hasSectionContent]);

  const toggleSection = (sectionId: string) => {
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

  const handleExport = async () => {
    setIsExporting(true);
    
    setTimeout(async () => {
      if (!exportRef.current) {
        toast.error('Export failed');
        setIsExporting(false);
        return;
      }

      try {
        await exportToPdf(exportRef.current, event as any, pdfTheme, paperSize, (status) => {
          logger.debug('Event PDF export status:', status);
        });
        toast.success('Event PDF exported successfully!');
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
      primary: 'text-blue-600',
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
      primary: 'text-blue-400',
    },
  };

  const t = themeClasses[pdfTheme];
  const paper = PAPER_SIZES[paperSize];

  const groupedSections = useMemo(() => {
    const groups: Record<string, typeof EVENT_SECTION_METADATA> = {};
    EVENT_SECTION_METADATA.forEach(section => {
      if (!groups[section.category]) groups[section.category] = [];
      groups[section.category].push(section);
    });
    return groups;
  }, []);

  const includedSections = useMemo(() => {
    return EVENT_SECTION_METADATA.map(s => s.id).filter(id => selectedSections.has(id) && hasSectionContent(id) && id !== 'hero');
  }, [selectedSections, hasSectionContent]);

  const selectedCount = selectedSections.size;

  // Render Table of Contents
  const renderTableOfContents = () => {
    if (!includeToc || includedSections.length === 0) return null;

    return (
      <div className={cn("py-8 border-b pdf-page-break-after", t.border)} key="toc">
        <div className="flex items-center gap-2 mb-6">
          <List className={cn("h-5 w-5", t.text)} />
          <h2 className={cn("text-2xl font-bold", t.text)}>Table of Contents</h2>
        </div>
        
        <div className="space-y-1">
          {includedSections.map((sectionId, index) => {
            const meta = EVENT_SECTION_METADATA.find(s => s.id === sectionId);
            return (
              <a
                key={sectionId}
                href={`#pdf-section-${sectionId}`}
                className={cn("flex items-center justify-between py-1.5 px-2 rounded", t.card)}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-mono w-6 text-center", t.textMuted)}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={cn("text-sm font-medium", t.text)}>
                    {meta?.label || sectionId}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Intelligence Section
  const renderIntelligenceSection = () => {
    if (!selectedSections.has('intelligence') || !intelligence?.brand_summary) return null;

    const priorityColors: Record<string, string> = {
      high: 'text-red-600',
      medium: 'text-amber-600',
      low: 'text-green-600',
    };

    return (
      <div id="pdf-section-intelligence" className={cn("py-6 border-b pdf-page-break-before", t.border)} key="intelligence">
        <div className="flex items-center gap-2 mb-4">
          <Brain className={cn("h-5 w-5", t.primary)} />
          <h2 className={cn("text-xl font-bold", t.text)}>AI Event Intelligence</h2>
        </div>

        {/* Summary */}
        <div className={cn("p-4 rounded-lg mb-4", t.card)}>
          <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
            <Sparkles className="h-4 w-4" />
            Event Summary
          </h3>
          <p className={cn("text-sm", t.textMuted)}>{intelligence.brand_summary}</p>
        </div>

        {/* Market Position */}
        {intelligence.market_position && (
          <div className={cn("p-4 rounded-lg mb-4", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <TrendingUp className="h-4 w-4" />
              Market Position
            </h3>
            <p className={cn("text-sm", t.textMuted)}>{intelligence.market_position}</p>
          </div>
        )}

        {/* Target Audience */}
        {intelligence.target_audience && (
          <div className={cn("p-4 rounded-lg mb-4", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <Users className="h-4 w-4" />
              Target Audience
            </h3>
            <p className={cn("text-sm", t.textMuted)}>
              <strong>Primary:</strong> {intelligence.target_audience.primary}
            </p>
            {intelligence.target_audience.secondary?.length > 0 && (
              <p className={cn("text-sm mt-1", t.textMuted)}>
                <strong>Secondary:</strong> {intelligence.target_audience.secondary.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Competitive Advantages */}
        {intelligence.competitive_advantages?.length > 0 && (
          <div className={cn("p-4 rounded-lg mb-4", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <Zap className="h-4 w-4" />
              Competitive Advantages
            </h3>
            <ul className="space-y-1">
              {intelligence.competitive_advantages.map((adv, i) => (
                <li key={i} className={cn("text-sm flex items-start gap-2", t.textMuted)}>
                  <span className={t.primary}>•</span>
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Brand Voice */}
        {intelligence.brand_voice_profile && (
          <div className={cn("p-4 rounded-lg mb-4", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <MessageSquare className="h-4 w-4" />
              Event Voice Profile
            </h3>
            {intelligence.brand_voice_profile.tone?.length > 0 && (
              <p className={cn("text-sm", t.textMuted)}>
                <strong>Tone:</strong> {intelligence.brand_voice_profile.tone.join(', ')}
              </p>
            )}
            {intelligence.brand_voice_profile.personality?.length > 0 && (
              <p className={cn("text-sm mt-1", t.textMuted)}>
                <strong>Personality:</strong> {intelligence.brand_voice_profile.personality.join(', ')}
              </p>
            )}
            {intelligence.brand_voice_profile.communication_style && (
              <p className={cn("text-sm mt-1", t.textMuted)}>
                <strong>Style:</strong> {intelligence.brand_voice_profile.communication_style}
              </p>
            )}
          </div>
        )}

        {/* Growth Recommendations */}
        {intelligence.growth_recommendations?.length > 0 && (
          <div className={cn("p-4 rounded-lg", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <TrendingUp className="h-4 w-4" />
              Growth Recommendations
            </h3>
            <div className="space-y-2">
              {intelligence.growth_recommendations.map((rec, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className={priorityColors[rec.priority] || t.textMuted}>●</span>
                    <span className={t.text}>{rec.recommendation}</span>
                  </div>
                  <p className={cn("text-xs ml-4 mt-0.5", t.textSubtle)}>{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Entries */}
        {intelligence.knowledge_entries?.length > 0 && (
          <div className={cn("p-4 rounded-lg mt-4", t.card)}>
            <h3 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", t.text)}>
              <BookOpen className="h-4 w-4" />
              Knowledge Base ({intelligence.knowledge_entries.length} entries)
            </h3>
            <div className="space-y-2">
              {intelligence.knowledge_entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className={cn("text-xs p-2 rounded", t.highlight)}>
                  <span className="uppercase tracking-wide mr-2">{entry.type}:</span>
                  <span className={t.textMuted}>{entry.content}</span>
                </div>
              ))}
              {intelligence.knowledge_entries.length > 10 && (
                <p className={cn("text-xs italic", t.textSubtle)}>
                  + {intelligence.knowledge_entries.length - 10} more entries
                </p>
              )}
            </div>
          </div>
        )}

        {/* Analysis metadata */}
        <div className={cn("mt-4 text-xs", t.textSubtle)}>
          <p>Total Analyses: {intelligence.analysis_count}</p>
          {intelligence.last_analyzed_at && (
            <p>Last Analyzed: {new Date(intelligence.last_analyzed_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    if (!selectedSections.has(sectionId)) return null;
    if (!hasSectionContent(sectionId)) return null;

    switch (sectionId) {
      case 'hero':
        return (
          <div id="pdf-section-hero" className={cn("text-center py-12 border-b-4 pdf-avoid-break", t.accent)} key="hero">
            {event.hero.logoUrl && (
              <img src={event.hero.logoUrl} alt={event.hero.name} className="h-20 mx-auto mb-6 object-contain" />
            )}
            <h1 className={cn("text-4xl font-bold mb-3", t.text)}>{event.hero.name}</h1>
            <p className={cn("text-lg", t.textMuted)}>{event.hero.tagline}</p>
            <div className={cn("mt-6 text-sm", t.textSubtle)}>Event Brand Kit</div>
          </div>
        );

      case 'eventdetails':
        const details = event.eventDetails;
        if (!details?.eventName) return null;
        return (
          <div id="pdf-section-eventdetails" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="eventdetails">
            <h2 className={cn("text-xl font-bold mb-4", t.text)}>Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={cn("p-3 rounded-lg", t.card)}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className={cn("text-xs font-medium", t.textSubtle)}>Event Name</span>
                </div>
                <p className={cn("font-semibold", t.text)}>{details.eventName}</p>
              </div>
              {details.eventDates && (
                <div className={cn("p-3 rounded-lg", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className={cn("text-xs font-medium", t.textSubtle)}>Dates</span>
                  </div>
                  <p className={cn("font-semibold", t.text)}>{details.eventDates}</p>
                </div>
              )}
              {details.location && (
                <div className={cn("p-3 rounded-lg", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className={cn("text-xs font-medium", t.textSubtle)}>Location</span>
                  </div>
                  <p className={cn("font-semibold", t.text)}>{details.location}</p>
                </div>
              )}
              {details.venue && (
                <div className={cn("p-3 rounded-lg", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4" />
                    <span className={cn("text-xs font-medium", t.textSubtle)}>Venue</span>
                  </div>
                  <p className={cn("font-semibold", t.text)}>{details.venue}</p>
                </div>
              )}
              {details.hashtag && (
                <div className={cn("p-3 rounded-lg", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4" />
                    <span className={cn("text-xs font-medium", t.textSubtle)}>Hashtag</span>
                  </div>
                  <p className={cn("font-semibold", t.text)}>{details.hashtag}</p>
                </div>
              )}
              {details.registrationUrl && (
                <div className={cn("p-3 rounded-lg", t.card)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4" />
                    <span className={cn("text-xs font-medium", t.textSubtle)}>Registration</span>
                  </div>
                  <p className={cn("font-semibold text-sm truncate", t.primary)}>{details.registrationUrl}</p>
                </div>
              )}
            </div>
            {details.tagline && (
              <div className={cn("mt-4 p-4 rounded-lg text-center", t.highlight)}>
                <p className={cn("text-lg italic", t.text)}>"{details.tagline}"</p>
              </div>
            )}
          </div>
        );

      case 'intelligence':
        return renderIntelligenceSection();

      case 'eventlocation':
        const loc = event.eventLocation;
        if (!loc?.venueName && !loc?.address) return null;
        return (
          <div id="pdf-section-eventlocation" className={cn("py-6 border-b pdf-avoid-break", t.border)} key="eventlocation">
            <h2 className={cn("text-xl font-bold mb-4", t.text)}>Venue & Location</h2>
            <div className={cn("p-4 rounded-lg", t.card)}>
              {loc.venueName && <p className={cn("font-semibold mb-1", t.text)}>{loc.venueName}</p>}
              {loc.address && <p className={cn("text-sm", t.textMuted)}>{loc.address}</p>}
              {(loc.city || loc.state || loc.country) && (
                <p className={cn("text-sm", t.textMuted)}>
                  {[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        );

      case 'colors':
        if (!event.colors || event.colors.length === 0) return null;
        return (
          <div id="pdf-section-colors" className={cn("py-6 border-b", t.border)} key="colors">
            <h2 className={cn("text-xl font-bold mb-4", t.text)}>Color Palette</h2>
            <div className="grid grid-cols-4 gap-3">
              {event.colors.map((color) => (
                <div key={color.id} className="pdf-avoid-break">
                  <div className="w-full h-16 rounded-lg shadow-sm" style={{ backgroundColor: color.hex }} />
                  <p className={cn("text-sm font-medium mt-2", t.text)}>{color.name}</p>
                  <p className={cn("text-xs font-mono", t.textMuted)}>{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'eventschedule':
        if (!event.eventSchedule || event.eventSchedule.length === 0) return null;
        return (
          <div id="pdf-section-eventschedule" className={cn("py-6 border-b", t.border)} key="eventschedule">
            <h2 className={cn("text-xl font-bold mb-4", t.text)}>Event Schedule</h2>
            <div className="space-y-2">
              {event.eventSchedule.map((item) => (
                <div key={item.id} className={cn("p-3 rounded-lg flex gap-4 pdf-avoid-break", t.card)}>
                  <div className={cn("font-mono text-sm w-20 shrink-0", t.textMuted)}>{item.time}</div>
                  <div>
                    <p className={cn("font-medium", t.text)}>{item.title}</p>
                    {item.description && <p className={cn("text-sm", t.textMuted)}>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'eventsponsors':
        if (!event.eventSponsors || event.eventSponsors.length === 0) return null;
        return (
          <div id="pdf-section-eventsponsors" className={cn("py-6 border-b", t.border)} key="eventsponsors">
            <h2 className={cn("text-xl font-bold mb-4", t.text)}>Sponsors</h2>
            <div className="grid grid-cols-3 gap-4">
              {event.eventSponsors.map((sponsor) => (
                <div key={sponsor.id} className={cn("p-3 rounded-lg text-center pdf-avoid-break", t.card)}>
                  {sponsor.logoUrl && (
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 mx-auto object-contain mb-2" />
                  )}
                  <p className={cn("text-sm font-medium", t.text)}>{sponsor.name}</p>
                  <p className={cn("text-xs capitalize", t.textMuted)}>{sponsor.tier}</p>
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
      <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
        <FileDown className="h-4 w-4" />
        Export PDF
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>Export Event Guide as PDF</DialogTitle>
            <DialogDescription>
              Customize your PDF export with AI Intelligence report
            </DialogDescription>
          </DialogHeader>

          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-xs">Theme:</Label>
                <ToggleGroup type="single" value={pdfTheme} onValueChange={(v) => v && setPdfTheme(v as PdfTheme)} size="sm">
                  <ToggleGroupItem value="light"><Sun className="h-3.5 w-3.5" /></ToggleGroupItem>
                  <ToggleGroupItem value="dark"><Moon className="h-3.5 w-3.5" /></ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Paper size */}
              <div className="flex items-center gap-2">
                <Label className="text-xs">Size:</Label>
                <ToggleGroup type="single" value={paperSize} onValueChange={(v) => v && setPaperSize(v as PaperSize)} size="sm">
                  <ToggleGroupItem value="a4" className="text-xs">A4</ToggleGroupItem>
                  <ToggleGroupItem value="letter" className="text-xs">Letter</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* TOC toggle */}
              <div className="flex items-center gap-2">
                <Switch id="toc" checked={includeToc} onCheckedChange={setIncludeToc} />
                <Label htmlFor="toc" className="text-xs">Table of Contents</Label>
              </div>

              {/* Intelligence toggle */}
              <div className="flex items-center gap-2">
                <Switch id="intelligence" checked={includeIntelligence} onCheckedChange={setIncludeIntelligence} />
                <Label htmlFor="intelligence" className="text-xs flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Intelligence
                </Label>
                {loadingIntelligence && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left panel - Section selection */}
            <div className="w-64 border-r flex flex-col shrink-0">
              <div className="p-3 border-b">
                <p className="text-xs font-medium text-muted-foreground">
                  {selectedCount} section{selectedCount !== 1 ? 's' : ''} selected
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {Object.entries(groupedSections).map(([category, sections]) => (
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
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-muted text-sm font-medium">
                        <span>{EVENT_CATEGORY_LABELS[category]}</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-2 space-y-1 mt-1">
                        {sections.map((section) => {
                          const hasContent = hasSectionContent(section.id);
                          return (
                            <label
                              key={section.id}
                              className={cn(
                                "flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer hover:bg-muted",
                                !hasContent && "opacity-40 cursor-not-allowed"
                              )}
                            >
                              <Checkbox
                                checked={selectedSections.has(section.id)}
                                onCheckedChange={() => hasContent && toggleSection(section.id)}
                                disabled={!hasContent}
                              />
                              <span>{section.label}</span>
                              {section.id === 'intelligence' && (
                                <Badge variant="secondary" className="ml-auto text-[10px]">AI</Badge>
                              )}
                            </label>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right panel - Preview */}
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg m-2">
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
                    {renderSection('hero')}
                    {renderTableOfContents()}
                    {EVENT_SECTION_METADATA.filter(s => s.id !== 'hero').map((s) => renderSection(s.id))}

                    {/* Footer */}
                    <div className={cn("pt-6 text-center text-xs", t.textSubtle)}>
                      <p>Generated on {new Date().toLocaleDateString()}</p>
                      <p className="mt-0.5">© {new Date().getFullYear()} {event.hero.name}</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Export button */}
          <div className="flex items-center justify-between p-4 border-t shrink-0">
            <p className="text-xs text-muted-foreground">
              {selectedCount} section{selectedCount !== 1 ? 's' : ''} selected
              {includeIntelligence && intelligence?.brand_summary && ' (includes AI Intelligence)'}
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
