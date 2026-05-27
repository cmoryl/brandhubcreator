/**
 * SettingsView — studio defaults, naming conventions, QA thresholds.
 * Local state for now; persistence wires later.
 */

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BASE_STYLES, COLOR_MODES } from './studioData';

const SETTINGS_KEY = 'icon-studio-settings';
const loadSettings = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch { return null; }
};

export const SettingsView = () => {
  const initial = loadSettings();
  const [defaultStyle, setDefaultStyle] = useState<string>(initial?.defaultStyle ?? 'outline');
  const [defaultGrid, setDefaultGrid] = useState<string>(initial?.defaultGrid ?? '24');
  const [defaultColor, setDefaultColor] = useState<string>(initial?.defaultColor ?? 'mono');
  const [naming, setNaming] = useState<string>(initial?.naming ?? 'kebab-{section}-{name}');
  const [qaThreshold, setQaThreshold] = useState<number[]>(initial?.qaThreshold ?? [80]);
  const [autoLock, setAutoLock] = useState<boolean>(initial?.autoLock ?? true);
  const [autoOptimize, setAutoOptimize] = useState<boolean>(initial?.autoOptimize ?? true);
  const [includeDarkMode, setIncludeDarkMode] = useState<boolean>(initial?.includeDarkMode ?? true);

  const handleSave = () => {
    const payload = { defaultStyle, defaultGrid, defaultColor, naming, qaThreshold, autoLock, autoOptimize, includeDarkMode };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      toast.success('Settings saved');
    } catch {
      toast.error('Could not save settings');
    }
  };

  return (
    <div className="space-y-6">
      <header className="tp-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(50% 80% at 100% 0%, hsl(var(--tp-light-blue) / 0.18), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <SettingsIcon className="h-3.5 w-3.5" />
              <span>Studio defaults</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Defaults applied to every new generation, QA threshold tuning, and naming
              conventions across exports.
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Generation defaults" description="Applied when creating new sets">
          <Field label="Default base style">
            <Select value={defaultStyle} onValueChange={setDefaultStyle}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_STYLES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default grid">
            <Select value={defaultGrid} onValueChange={setDefaultGrid}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['16', '20', '24', '32', '48'].map((g) => (
                  <SelectItem key={g} value={g}>
                    {g} px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default color mode">
            <Select value={defaultColor} onValueChange={setDefaultColor}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_MODES.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Naming convention" description="Drives export file names">
          <Field label="Pattern">
            <Input
              value={naming}
              onChange={(e) => setNaming(e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </Field>
          <div className="text-[11px] text-muted-foreground">
            Tokens: <code className="font-mono">{'{section}'}</code>{' '}
            <code className="font-mono">{'{name}'}</code>{' '}
            <code className="font-mono">{'{size}'}</code>{' '}
            <code className="font-mono">{'{ext}'}</code>
          </div>
          <div className="rounded-md bg-secondary/30 border border-border/50 p-3 text-[11px]">
            <div className="text-muted-foreground mb-1">Preview</div>
            <code className="font-mono">
              {naming.replace('{section}', 'core').replace('{name}', 'search')}.svg
            </code>
          </div>
        </Section>

        <Section title="QA thresholds" description="When to flag and block exports">
          <Field label={`Minimum brand compliance — ${qaThreshold[0]}%`}>
            <Slider
              min={50}
              max={100}
              step={1}
              value={qaThreshold}
              onValueChange={setQaThreshold}
            />
          </Field>
          <Toggle
            label="Auto-lock approved icons"
            description="Prevents accidental overwrites on regenerate"
            checked={autoLock}
            onCheckedChange={setAutoLock}
          />
          <Toggle
            label="Auto-optimize SVGs"
            description="Run SVGO on save and on export"
            checked={autoOptimize}
            onCheckedChange={setAutoOptimize}
          />
          <Toggle
            label="Include dark-mode variants"
            description="Generate dark surface preview per icon"
            checked={includeDarkMode}
            onCheckedChange={setIncludeDarkMode}
          />
        </Section>

        <Section title="Team & integrations" description="Coming with persistence">
          <div className="text-[11px] text-muted-foreground space-y-2">
            {[
              ['Team roles', 'Owner · Designer · Reviewer · Viewer'],
              ['SSO', 'Use organization SSO (recommended)'],
              ['Webhooks', 'On set published / approved / exported'],
              ['Figma plugin', 'One-click bring-in of approved sets'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-md border bg-secondary/20 px-3 py-2"
              >
                <div className="text-foreground font-medium text-xs">{k}</div>
                <Badge variant="outline" className="text-[10px]">
                  {v}
                </Badge>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <IconographyBrainPanel />
    </div>
  );
};

const IconographyBrainPanel = () => {
  const [open, setOpen] = useState(false);
  const [md, setMd] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || md) return;
    setLoading(true);
    fetch('/knowledge/icon-iconography-history.md')
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(setMd)
      .catch(() => toast.error('Could not load iconography reference'))
      .finally(() => setLoading(false));
  }, [open, md]);

  return (
    <section className="tp-card relative overflow-hidden p-5">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 100% at 0% 0%, hsl(var(--tp-light-blue) / 0.25), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Iconography Brain</h3>
              <Badge variant="outline" className="text-[10px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground max-w-2xl">
              Generation, suggestion, semantic search, and stylization are all primed with a
              distilled history of iconography (Panofsky · Isotype · Olympic pictograms · Material ·
              SF Symbols) plus modern grid, weight, and licensing rules.
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              View reference
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Iconography Brain — Reference</DialogTitle>
            </DialogHeader>
            {loading && (
              <div className="text-xs text-muted-foreground">Loading…</div>
            )}
            <pre className="whitespace-pre-wrap text-[12px] leading-relaxed font-sans text-foreground/90">
              {md}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="tp-card p-5 space-y-3">
    <header>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </header>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
    </label>
    {children}
  </div>
);

const Toggle = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-3 rounded-md border bg-secondary/20 px-3 py-2.5">
    <div className="min-w-0">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground">{description}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
