/**
 * PdfBrandingPopover — lets the user configure header/footer branding
 * applied to the exported PDF: entity/header text, footer text, header
 * background color, and visibility of header/footer/logo.
 */
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings2, RotateCcw } from 'lucide-react';
import type { PdfBranding } from '@/lib/iconStudio/brandIconPdf';

export interface PdfBrandingState extends Required<Omit<PdfBranding, 'headerText' | 'footerText' | 'headerBgColor' | 'footerTextColor'>> {
  headerText: string;
  footerText: string;
  headerBgColor: string;
  footerTextColor: string;
}

export const defaultPdfBranding = (entityName: string, entityKind: string, accent: string): PdfBrandingState => ({
  showHeader: true,
  showFooter: true,
  showLogoInHeader: true,
  showLogoOnCover: true,
  headerText: entityName,
  footerText: `${entityName} · ${entityKind} icon system`,
  headerBgColor: accent,
  footerTextColor: '#969696',
});

interface Props {
  value: PdfBrandingState;
  onChange: (next: PdfBrandingState) => void;
  onReset: () => void;
  triggerLabel?: string;
}

export const PdfBrandingPopover = ({ value, onChange, onReset, triggerLabel = 'PDF branding' }: Props) => {
  const set = <K extends keyof PdfBrandingState>(key: K, v: PdfBrandingState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8" title="Configure PDF header & footer branding">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">PDF branding</div>
            <p className="text-[11px] text-muted-foreground">Applied to every content page.</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={onReset}>
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="pdf-header-text" className="text-xs">Header text</Label>
            <Input
              id="pdf-header-text"
              value={value.headerText}
              onChange={(e) => set('headerText', e.target.value)}
              placeholder="Entity name"
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdf-footer-text" className="text-xs">Footer text</Label>
            <Input
              id="pdf-footer-text"
              value={value.footerText}
              onChange={(e) => set('footerText', e.target.value)}
              placeholder="Footer caption"
              className="h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pdf-header-bg" className="text-xs">Header color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="pdf-header-bg"
                  type="color"
                  value={value.headerBgColor}
                  onChange={(e) => set('headerBgColor', e.target.value)}
                  className="h-8 w-10 rounded border border-input bg-transparent cursor-pointer"
                />
                <Input
                  value={value.headerBgColor}
                  onChange={(e) => set('headerBgColor', e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-footer-color" className="text-xs">Footer color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="pdf-footer-color"
                  type="color"
                  value={value.footerTextColor}
                  onChange={(e) => set('footerTextColor', e.target.value)}
                  className="h-8 w-10 rounded border border-input bg-transparent cursor-pointer"
                />
                <Input
                  value={value.footerTextColor}
                  onChange={(e) => set('footerTextColor', e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/60">
            <Toggle label="Show header" checked={value.showHeader} onChange={(v) => set('showHeader', v)} />
            <Toggle label="Show footer" checked={value.showFooter} onChange={(v) => set('showFooter', v)} />
            <Toggle label="Logo in header" checked={value.showLogoInHeader} onChange={(v) => set('showLogoInHeader', v)} />
            <Toggle label="Logo on cover" checked={value.showLogoOnCover} onChange={(v) => set('showLogoOnCover', v)} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-foreground/80">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default PdfBrandingPopover;
