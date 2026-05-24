import { useState } from 'react';
import { Plus, X, Pencil, Download, ExternalLink, ShieldCheck, Eye, Type, AlertTriangle } from 'lucide-react';
import { BrandTypography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TransPerfectColorTypographyPanel } from './identity/TransPerfectColorTypographyPanel';

interface TypographySectionProps {
  typography: BrandTypography[];
  onTypographyChange?: (typography: BrandTypography[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isAdmin?: boolean;
  brandSlug?: string;
}

const fontOptions = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'DM Sans', family: 'DM Sans, sans-serif' },
  { name: 'Fraunces', family: 'Fraunces, serif' },
  { name: 'Playfair Display', family: 'Playfair Display, serif' },
  { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif' },
  { name: 'Lato', family: 'Lato, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
];

const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

// Get Google Fonts download URL
const getGoogleFontsUrl = (fontFamily: string): string | null => {
  const fontName = fontFamily?.split(',')[0]?.trim();
  if (!fontName) return null;
  
  // System fonts don't have Google Fonts pages
  const systemFonts = ['Georgia', 'Arial', 'Helvetica', 'Times New Roman', 'Verdana'];
  if (systemFonts.includes(fontName)) return null;
  
  // Format for Google Fonts URL (replace spaces with +)
  const formattedName = fontName.replace(/\s+/g, '+');
  return `https://fonts.google.com/specimen/${formattedName}`;
};

const DEFAULT_PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';

export const TypographySection = ({ typography, onTypographyChange, customSubtitle, onSubtitleChange, isAdmin = false, brandSlug }: TypographySectionProps) => {
  const canEdit = Boolean(onTypographyChange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const addTypography = () => {
    if (!onTypographyChange) return;
    const newType: BrandTypography = {
      id: crypto.randomUUID(),
      name: 'Heading',
      fontFamily: 'Fraunces, serif',
      weight: '600',
      usage: 'Headlines and titles',
    };
    onTypographyChange([...typography, newType]);
    setEditingId(newType.id);
  };

  const updateTypography = (id: string, updates: Partial<BrandTypography>) => {
    if (!onTypographyChange) return;
    onTypographyChange(typography.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTypography = (id: string) => {
    if (!onTypographyChange) return;
    onTypographyChange(typography.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Typography"
            defaultSubtitle="Define your brand's type system"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <Button onClick={addTypography} size="sm" className="gap-2 shrink-0 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Style
          </Button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {typography.map((type, index) => (
          <div
            key={type.id}
            className="group relative bg-card rounded-xl p-6 shadow-sm border border-border animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {canEdit && editingId === type.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={type.name}
                    onChange={(e) => updateTypography(type.id, { name: e.target.value })}
                    placeholder="Style name"
                    className="h-10"
                  />
                  <Select
                    value={type.fontFamily}
                    onValueChange={(value) => updateTypography(type.id, { fontFamily: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.family} value={font.family}>
                          <span style={{ fontFamily: font.family }}>{font.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={type.weight}
                    onValueChange={(value) => updateTypography(type.id, { weight: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightOptions.map(weight => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={type.usage}
                  onChange={(e) => updateTypography(type.id, { usage: e.target.value })}
                  placeholder="Usage description"
                  className="h-10"
                />
                <Input
                  value={type.previewText || ''}
                  onChange={(e) => updateTypography(type.id, { previewText: e.target.value })}
                  placeholder="Custom preview text (e.g., your company tagline)"
                  className="h-10"
                />
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      {type.name}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {type.weight}
                    </span>
                  </div>
                  <p
                    className="text-3xl text-foreground"
                    style={{ fontFamily: type.fontFamily, fontWeight: parseInt(type.weight) }}
                  >
                    {type.previewText || DEFAULT_PREVIEW_TEXT}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{type.fontFamily?.split(',')[0] || 'Unknown'}</span>
                    {getGoogleFontsUrl(type.fontFamily) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={getGoogleFontsUrl(type.fontFamily)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="h-3 w-3" />
                              <span>Download Font</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download from Google Fonts</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span>•</span>
                    <span>{type.usage || 'General'}</span>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(type.id)}
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteTypography(type.id)}
                      className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {typography.length === 0 && canEdit && (
          <button
            onClick={addTypography}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first typography style</span>
          </button>
        )}
      </div>

      {/* WCAG Contrast & Readability Compliance Panel - Admin only */}
      {isAdmin && <WcagTypographyPanel />}
    </section>
  );
};

/* ── WCAG Typography Compliance Panel ── */

const CONTRAST_REQUIREMENTS = [
  {
    level: 'AA',
    label: 'WCAG 2.2 Level AA',
    required: true,
    rules: [
      { context: 'Normal text (< 18pt / 14pt bold)', ratio: '4.5 : 1', icon: Type },
      { context: 'Large text (≥ 18pt or ≥ 14pt bold)', ratio: '3 : 1', icon: Type },
      { context: 'UI components & graphical objects', ratio: '3 : 1', icon: Eye },
    ],
  },
  {
    level: 'AAA',
    label: 'WCAG 2.2 Level AAA (Recommended)',
    required: false,
    rules: [
      { context: 'Normal text (< 18pt / 14pt bold)', ratio: '7 : 1', icon: Type },
      { context: 'Large text (≥ 18pt or ≥ 14pt bold)', ratio: '4.5 : 1', icon: Type },
    ],
  },
];

const READABILITY_GUIDELINES = [
  'Body text minimum 16px (1rem) on screen; never below 12px for any readable content',
  'Line height 1.5× font size for body copy (WCAG 1.4.12 Text Spacing)',
  'Paragraph spacing at least 2× font size; letter spacing ≥ 0.12em for body',
  'Maximum line length 80 characters (40 for CJK) to maintain readability',
  'Avoid full-justified text — use left-aligned (LTR) or right-aligned (RTL) for readability',
  'Ensure text can be resized up to 200% without loss of content or functionality (WCAG 1.4.4)',
  'Do not use text embedded in images as the sole means of conveying information',
  'Maintain at least 4.5:1 contrast for placeholder text and form labels',
];

const WcagTypographyPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">WCAG Contrast & Readability Compliance</span>
          <span className="text-xs text-muted-foreground ml-1">WCAG 2.2</span>
        </div>
        {isExpanded ? (
          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        ) : (
          <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All typographic choices must meet WCAG 2.2 contrast minimums. These ratios apply to every foreground/background pairing across light and dark modes.
          </p>

          {/* Contrast ratio tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTRAST_REQUIREMENTS.map((level) => (
              <div key={level.level} className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={cn('h-4 w-4', level.required ? 'text-green-600' : 'text-amber-500')} />
                  <h4 className={cn('text-sm font-semibold', level.required ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400')}>
                    {level.label}
                  </h4>
                  {level.required && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">Required</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {level.rules.map((rule, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <rule.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80">{rule.context}</span>
                      </div>
                      <span className="font-mono font-semibold text-foreground shrink-0 ml-2">{rule.ratio}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Readability guidelines */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Readability & Spacing Standards</h4>
            </div>
            <ul className="space-y-1.5">
              {READABILITY_GUIDELINES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning callout */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Validation reminder:</strong> Contrast ratios must be verified for every color/background combination — not just default pairings. Test against dark mode, hover states, disabled states, and any gradient or image backgrounds where text appears.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
