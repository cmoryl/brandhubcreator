/**
 * StyleSystemDetailDialog — large preview of a single style system with
 * expanded icon examples across multiple categories, sizes, and color modes.
 */

import { useEffect, useState } from 'react';
import { Wand2, Sparkles, Grid3x3, Ruler, Layers, Sun, Moon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconSetPreview } from './IconSetPreview';
import type { BaseStyle } from './studioData';

interface Props {
  style: BaseStyle | null;
  accent: string;
  onClose: () => void;
  onApply?: () => void;
}

// Themed sample categories — much richer than the 6-emoji card preview.
const CATEGORIES: { title: string; emojis: string[] }[] = [
  { title: 'System & UI', emojis: ['⚙️', '🔍', '🔔', '📂', '🏠', '👤', '🚪', '🧭', '📍', '🔄', '⬆️', '⬇️'] },
  { title: 'Data & Analytics', emojis: ['📊', '📈', '📉', '🎯', '🧮', '📋', '🗂️', '🔬', '📝', '⏱️', '🧪', '📐'] },
  { title: 'Commerce & Finance', emojis: ['🛒', '🛍️', '💳', '💰', '🏷️', '📦', '🚚', '🎁', '⭐', '🧾', '🏦', '💸'] },
  { title: 'Security & Compliance', emojis: ['🛡️', '🔐', '🔑', '✅', '🚨', '📜', '🪪', '🛂', '🪙', '⚖️', '🏛️', '📑'] },
  { title: 'Communication', emojis: ['💬', '📧', '📞', '🎙️', '📣', '🔔', '🔕', '📺', '📷', '🎬', '🤝', '🗣️'] },
  { title: 'AI & Tech', emojis: ['✨', '🪄', '🧠', '🤖', '⚡', '🔌', '🧩', '🛠️', '🚀', '💡', '📡', '🔗'] },
];

const SIZE_LADDER: { label: string; size: 'sm' | 'md' | 'lg' }[] = [
  { label: '16 / 20 px', size: 'sm' },
  { label: '24 / 32 px', size: 'md' },
  { label: '48 / 64 px', size: 'lg' },
];

export const StyleSystemDetailDialog = ({ style, accent, onClose, onApply }: Props) => {
  const open = !!style;
  const a2 = style?.preview.accent2 ? `hsl(var(--${style.preview.accent2}))` : undefined;
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from current app theme each time dialog opens
  useEffect(() => {
    if (open && typeof document !== 'undefined') {
      setPreviewTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none">
        <div className={cn('bg-background text-foreground rounded-lg overflow-hidden border border-border', previewTheme === 'dark' && 'dark')}>

          {style && (
            <>
              {/* Hero header with showcase preview */}
              <div
                className="relative overflow-hidden p-8 border-b border-border/60 bg-background text-foreground"
                style={{
                  background: `radial-gradient(80% 100% at 0% 0%, color-mix(in oklab, ${accent} 22%, transparent), transparent 70%), radial-gradient(60% 100% at 100% 100%, color-mix(in oklab, ${a2 ?? accent} 18%, transparent), transparent 70%)`,
                }}
              >
              <DialogHeader className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Style system · {style.preview.variant}</span>
                  </div>
                  {/* Dark / Light toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 backdrop-blur-sm p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme('light')}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        previewTheme === 'light'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Light preview"
                      aria-label="Switch to light preview"
                    >
                      <Sun className="h-3 w-3" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme('dark')}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        previewTheme === 'dark'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Dark preview"
                      aria-label="Switch to dark preview"
                    >
                      <Moon className="h-3 w-3" />
                      Dark
                    </button>
                  </div>
                </div>
                <DialogTitle className="text-3xl font-semibold tracking-tight">
                  {style.name}
                </DialogTitle>
                <DialogDescription className="text-sm max-w-2xl">
                  {style.description}. Below is the full visual fingerprint —
                  applied across categories, sizes, and color treatments.
                </DialogDescription>
              </DialogHeader>

              {/* Hero showcase row at LG size */}
              <div className="rounded-xl bg-background/40 backdrop-blur-sm border border-border/40 p-5">
                <IconSetPreview
                  emojis={['✨', '🛡️', '📊', '🛒', '💬', '🚀']}
                  accent={accent}
                  accent2={a2}
                  size="lg"
                  count={6}
                  variant={style.preview.variant}
                  radius={style.preview.radius}
                  strokeWidth={style.preview.strokeWidth}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {Object.entries(style.recipe)
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <Badge key={k} variant="secondary" className="text-[10px] capitalize">
                      {k}
                    </Badge>
                  ))}
                <Badge variant="outline" className="text-[10px]">
                  Radius {style.preview.radius ?? 10}px
                </Badge>
                {style.preview.strokeWidth && (
                  <Badge variant="outline" className="text-[10px]">
                    Stroke {style.preview.strokeWidth}px
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Size ladder */}
              <Section
                title="Size ladder"
                icon={Ruler}
                hint="Same recipe rendered at three optical sizes."
              >
                <div className="space-y-3">
                  {SIZE_LADDER.map((row) => {
                    // Cap columns so lg tiles (56px) never overflow the card.
                    const cols = row.size === 'lg' ? 8 : row.size === 'md' ? 10 : 12;
                    return (
                      <div
                        key={row.size}
                        className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {row.label}
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {cols} icons
                          </Badge>
                        </div>
                        <IconSetPreview
                          emojis={['⚙️', '📊', '🔐', '🛒', '✨', '🛡️', '💬', '🚀', '🔔', '🏠', '📦', '🎯']}
                          accent={accent}
                          accent2={a2}
                          size={row.size}
                          count={cols}
                          columns={cols}
                          variant={style.preview.variant}
                          radius={style.preview.radius}
                          strokeWidth={style.preview.strokeWidth}
                        />
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Categories — 6 themed icon rows */}
              <Section
                title="Category showcase"
                icon={Grid3x3}
                hint="12 icons per category — see how the style scales across vocab."
              >
                <div className="space-y-4">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.title}
                      className="rounded-lg border border-border/50 bg-card/40 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold">{cat.title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          12 icons
                        </Badge>
                      </div>
                      <IconSetPreview
                        emojis={cat.emojis}
                        accent={accent}
                        accent2={a2}
                        size="md"
                        count={12}
                        columns={12}
                        variant={style.preview.variant}
                        radius={style.preview.radius}
                        strokeWidth={style.preview.strokeWidth}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Color treatments */}
              <Section
                title="Color treatments"
                icon={Layers}
                hint="Same style applied across brand accents."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Digital Blue', token: '--tp-digital-blue' },
                    { label: 'Pink', token: '--tp-pink' },
                    { label: 'Teal', token: '--tp-teal' },
                    { label: 'Orange', token: '--tp-orange' },
                  ].map((c) => (
                    <div
                      key={c.token}
                      className="rounded-lg border border-border/50 bg-card/40 p-3 space-y-2"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {c.label}
                      </div>
                      <IconSetPreview
                        emojis={['⚙️', '📊', '🔐', '🛒', '✨', '🛡️']}
                        accent={`hsl(var(${c.token}))`}
                        accent2={a2}
                        size="sm"
                        count={6}
                        variant={style.preview.variant}
                        radius={style.preview.radius}
                        strokeWidth={style.preview.strokeWidth}
                      />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Footer actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
                <div className="text-xs text-muted-foreground">
                  Recipe locked across all generated icons in this system.
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      onApply?.();
                      onClose();
                    }}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Apply to new set
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: typeof Wand2;
  hint?: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
    {children}
  </section>
);
