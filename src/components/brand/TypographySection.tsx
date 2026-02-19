import { useState } from 'react';
import { Plus, X, Pencil, Download, ExternalLink } from 'lucide-react';
import { BrandTypography } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TypographySectionProps {
  typography: BrandTypography[];
  onTypographyChange?: (typography: BrandTypography[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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

export const TypographySection = ({ typography, onTypographyChange, customSubtitle, onSubtitleChange }: TypographySectionProps) => {
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
    </section>
  );
};
