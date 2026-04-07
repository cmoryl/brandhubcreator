import { useState, useMemo } from 'react';
import { LayoutTemplate, Grid3X3, List, Sparkles, Eye } from 'lucide-react';
import { BrandSignature, BrandEmailBanner } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SIGNATURE_TEMPLATES, TEMPLATE_CATEGORIES, SignatureTemplate } from './signatureTemplates';
import { DEFAULT_CONFIDENTIALITY } from './signatureConstants';
import { renderSignatureHtml } from './signatureRenderer';
import { safeUUID } from '@/lib/safeUUID';
import DOMPurify from 'dompurify';

interface SignatureTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (signature: BrandSignature) => void;
  /** Brand/product email banners to auto-populate in templates */
  emailBanners?: BrandEmailBanner[];
}

const CATEGORY_COLORS: Record<string, string> = {
  professional: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20',
  modern: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  creative: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  minimal: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-400 border-neutral-500/20',
  corporate: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
};

const CATEGORY_ICONS: Record<string, string> = {
  professional: '🏢',
  modern: '⚡',
  creative: '🎨',
  minimal: '✦',
  corporate: '🏛️',
};

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
  ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'target', 'rel', 'colspan'],
};

function createSignatureFromTemplate(template: SignatureTemplate, emailBanners?: BrandEmailBanner[]): BrandSignature {
  // Auto-populate with the first brand banner if available
  const primaryBanner = emailBanners?.[0];
  return {
    id: safeUUID(),
    name: 'John Doe',
    role: 'Global Account Lead',
    html: '',
    company: 'Your Company',
    email: 'jdoe@company.com',
    phone: '+1 212.555.0123',
    website: 'www.company.com',
    address: '1250 Broadway, New York, NY 10001',
    logoUrl: '',
    variant: template.variant,
    style: { ...template.style },
    confidentialityNotice: template.includeConfidentiality ? DEFAULT_CONFIDENTIALITY : undefined,
    socialLinks: template.includeSocialPlaceholders ? [
      { id: safeUUID(), platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
      { id: safeUUID(), platform: 'twitter', url: 'https://x.com/johndoe' },
    ] : undefined,
    // Auto-attach brand banner
    bannerUrl: primaryBanner?.imageUrl || '',
    bannerLinkUrl: primaryBanner?.linkUrl || '',
    bannerWidth: primaryBanner?.width || 550,
    bannerHeight: primaryBanner?.height || 150,
    templateId: template.id,
  };
}

/** Generates preview HTML for the template card */
function renderTemplatePreview(template: SignatureTemplate, emailBanners?: BrandEmailBanner[]): string {
  const mockSig = createSignatureFromTemplate(template, emailBanners);
  const html = renderSignatureHtml(mockSig);
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

const VARIANT_LABELS: Record<string, string> = {
  full: 'Full Signature',
  reply: 'Reply',
  minimal: 'Text Only',
};

const LAYOUT_TEMPLATE_LABELS: Record<string, string> = {
  classic: '⬜ Classic',
  centered: '⊞ Centered',
  'side-banner': '▐ Side Banner',
  card: '▣ Card',
  inline: '━ Inline',
  stacked: '▤ Stacked',
  'two-column': '▥ Two Column',
  'banner-top': '▀ Banner Top',
};

export const SignatureTemplateDialog = ({ open, onOpenChange, onSelect, emailBanners }: SignatureTemplateDialogProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return SIGNATURE_TEMPLATES;
    return SIGNATURE_TEMPLATES.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SIGNATURE_TEMPLATES.length };
    SIGNATURE_TEMPLATES.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return counts;
  }, []);

  // Pre-render all previews for current filter (includes brand banners if available)
  const previews = useMemo(() => {
    const map: Record<string, string> = {};
    filteredTemplates.forEach(t => { map[t.id] = renderTemplatePreview(t, emailBanners); });
    return map;
  }, [filteredTemplates, emailBanners]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutTemplate className="h-4.5 w-4.5 text-primary" />
              </div>
              Signature Template Library
              <Badge variant="secondary" className="text-xs font-medium ml-1">{SIGNATURE_TEMPLATES.length} templates</Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Category Filter + View Toggle */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5 transition-all"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.id !== 'all' && <span className="text-sm">{CATEGORY_ICONS[cat.id]}</span>}
                  {cat.label}
                  <span className="text-[10px] opacity-60 tabular-nums">({categoryCounts[cat.id] || 0})</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('list')}>
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-4'
          }>
            {filteredTemplates.map((template, index) => {
              const isHovered = hoveredId === template.id;
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(createSignatureFromTemplate(template));
                    onOpenChange(false);
                  }}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    text-left rounded-xl border transition-all duration-300 overflow-hidden group relative
                    ${isHovered
                      ? 'border-primary shadow-lg shadow-primary/10 scale-[1.01]'
                      : 'border-border hover:border-primary/50 shadow-sm'
                    }
                    ${viewMode === 'list' ? 'flex items-stretch' : ''}
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Color accent stripe */}
                  {viewMode === 'grid' && (
                    <div
                      className="h-1 w-full transition-all duration-300"
                      style={{
                        background: template.accentSwatch || '#666',
                        opacity: isHovered ? 1 : 0.6,
                      }}
                    />
                  )}
                  {viewMode === 'list' && (
                    <div
                      className="w-1 shrink-0 transition-all duration-300"
                      style={{
                        background: template.accentSwatch || '#666',
                        opacity: isHovered ? 1 : 0.6,
                      }}
                    />
                  )}

                  {/* Header info */}
                  <div className={`p-3.5 ${viewMode === 'list' ? 'w-[220px] shrink-0 border-r border-border/50 flex flex-col justify-center' : 'pb-2'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">{template.name}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-[18px] ${CATEGORY_COLORS[template.category] || ''}`}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[18px] text-muted-foreground border-border">
                        {VARIANT_LABELS[template.variant] || template.variant}
                      </Badge>
                      {template.style.layoutTemplate && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-[18px] bg-primary/5 text-primary border-primary/20">
                          {LAYOUT_TEMPLATE_LABELS[template.style.layoutTemplate] || template.style.layoutTemplate}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{template.description}</p>

                    {/* Style meta chips */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {template.style.fontFamily?.split(',')[0]?.replace(/'/g, '')}
                      </span>
                      {template.style.layout === 'vertical' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Vertical</span>
                      )}
                      {template.includeConfidentiality && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+Notice</span>
                      )}
                      {template.includeSocialPlaceholders && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">+Social</span>
                      )}
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className={`
                    relative bg-white overflow-hidden
                    ${viewMode === 'grid'
                      ? 'mx-3 mb-3 rounded-lg border border-border/40'
                      : 'flex-1 border-none'
                    }
                  `}>
                    {/* Preview container with proper scaling */}
                    <div
                      className="p-4 origin-top-left"
                      style={{
                        transform: viewMode === 'grid' ? 'scale(0.55)' : 'scale(0.5)',
                        width: viewMode === 'grid' ? '182%' : '200%',
                        maxHeight: viewMode === 'grid' ? '999px' : '999px',
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: previews[template.id] || '' }} />
                    </div>

                    {/* Fade overlay at bottom for grid view */}
                    {viewMode === 'grid' && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}

                    {/* Hover overlay with CTA */}
                    <div className={`
                      absolute inset-0 flex items-center justify-center transition-all duration-300
                      ${isHovered ? 'bg-primary/5 backdrop-blur-[1px] opacity-100' : 'opacity-0'}
                    `}>
                      <div className={`
                        flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg
                        transition-all duration-300
                        ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
                      `}>
                        <Sparkles className="h-3.5 w-3.5" />
                        Use This Template
                      </div>
                    </div>
                  </div>

                  {/* Height limiter for grid preview */}
                  {viewMode === 'grid' && (
                    <style>{`
                      button:has([data-template="${template.id}"]) .preview-container {
                        max-height: 140px;
                      }
                    `}</style>
                  )}
                </button>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Eye className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No templates in this category</p>
              <p className="text-xs mt-1">Try selecting a different category</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
