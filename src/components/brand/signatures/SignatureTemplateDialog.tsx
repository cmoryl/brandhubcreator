import { useState, useMemo } from 'react';
import { LayoutTemplate, Grid3X3, List } from 'lucide-react';
import { BrandSignature } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SIGNATURE_TEMPLATES, TEMPLATE_CATEGORIES, SignatureTemplate } from './signatureTemplates';
import { DEFAULT_CONFIDENTIALITY } from './signatureConstants';
import { renderSignatureHtml } from './signatureRenderer';
import { safeUUID } from '@/lib/safeUUID';
import DOMPurify from 'dompurify';

interface SignatureTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (signature: BrandSignature) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  professional: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  modern: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  creative: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  minimal: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-400',
  corporate: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

function createSignatureFromTemplate(template: SignatureTemplate): BrandSignature {
  return {
    id: safeUUID(),
    name: 'John Doe',
    role: 'Global Account Lead',
    html: '', // Not used for structured rendering
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
      { id: safeUUID(), platform: 'linkedin', url: '' },
      { id: safeUUID(), platform: 'twitter', url: '' },
    ] : undefined,
    templateId: template.id,
  };
}

/** Generates a tiny preview HTML for the template card */
function renderMiniPreview(template: SignatureTemplate): string {
  const mockSig = createSignatureFromTemplate(template);
  const html = renderSignatureHtml(mockSig);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
    ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'target', 'rel', 'colspan'],
  });
}

export const SignatureTemplateDialog = ({ open, onOpenChange, onSelect }: SignatureTemplateDialogProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return SIGNATURE_TEMPLATES;
    return SIGNATURE_TEMPLATES.filter(t => t.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: SIGNATURE_TEMPLATES.length };
    SIGNATURE_TEMPLATES.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return counts;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Signature Template Library
            <Badge variant="secondary" className="text-xs">{SIGNATURE_TEMPLATES.length} templates</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Category Filter + View Toggle */}
        <div className="flex items-center justify-between gap-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
                <span className="text-[10px] opacity-60">({categoryCounts[cat.id] || 0})</span>
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('grid')}><Grid3X3 className="h-3.5 w-3.5" /></Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(createSignatureFromTemplate(template));
                  onOpenChange(false);
                }}
                className="text-left border border-border rounded-lg hover:border-primary hover:bg-accent/30 transition-all duration-200 overflow-hidden group"
              >
                {/* Header */}
                <div className="p-3 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{template.name}</h4>
                    <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[template.category] || ''}`}>
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                </div>
                {/* Mini Preview */}
                <div className="mx-3 mb-3 bg-white rounded border border-border/50 p-2 overflow-hidden" style={{ maxHeight: viewMode === 'list' ? '60px' : '100px', transform: 'scale(0.65)', transformOrigin: 'top left', width: '153%' }}>
                  <div dangerouslySetInnerHTML={{ __html: renderMiniPreview(template) }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
