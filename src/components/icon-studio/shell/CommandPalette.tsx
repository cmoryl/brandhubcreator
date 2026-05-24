/**
 * CommandPalette — global Cmd/Ctrl+K launcher for Icon Studio.
 *
 * Surfaces sections, recent libraries, brand profiles, bundled icon packs,
 * and quick actions in one keyboard-driven launcher. Honors Esc/Enter.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  FolderOpen,
  Image as ImageIcon,
  Keyboard,
  LayoutDashboard,
  Library,
  Package,
  Palette,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import type { ShellSection, Brand as ShellBrand } from './StudioShell';

interface PaletteLibrary {
  id: string;
  name: string;
  iconCount: number;
  level?: string;
}

interface PalettePack {
  id: string;
  name: string;
  count: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (section: ShellSection) => void;
  onOpenLibrary: (id: string) => void;
  onOpenBundledPack?: (packId: string) => void;
  onChangeBrand?: (brand: ShellBrand) => void;
  onShowShortcuts?: () => void;
  libraries: PaletteLibrary[];
  brands: ShellBrand[];
  activeBrandId?: string;
  packs?: PalettePack[];
}

const SECTIONS: Array<{ id: ShellSection; label: string; icon: LucideIcon; hint?: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'G D' },
  { id: 'generate', label: 'Generate icon set', icon: Wand2, hint: 'G N' },
  { id: 'library', label: 'Library', icon: Library, hint: 'G L' },
  { id: 'imported', label: 'Imported Icons', icon: ImageIcon, hint: 'G I' },
  { id: 'brands', label: 'Brands', icon: Building2, hint: 'G B' },
  { id: 'styles', label: 'Style Systems', icon: Palette, hint: 'G S' },
  { id: 'sets', label: 'Icon Sets', icon: FolderOpen },
  { id: 'qa', label: 'QA / Preflight', icon: ShieldCheck, hint: 'G Q' },
  { id: 'export', label: 'Export Center', icon: Package, hint: 'G E' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CommandPalette = ({
  open,
  onOpenChange,
  onNavigate,
  onOpenLibrary,
  onOpenBundledPack,
  onChangeBrand,
  onShowShortcuts,
  libraries,
  brands,
  activeBrandId,
  packs = [],
}: Props) => {
  const run = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      // defer to let dialog close cleanly before route/state change
      setTimeout(fn, 0);
    },
    [onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections, libraries, brands, icon packs…" />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>No matches.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => run(() => onNavigate('generate'))}>
            <Plus className="text-primary" />
            <span>New icon system</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          {onShowShortcuts && (
            <CommandItem onSelect={() => run(() => onShowShortcuts())}>
              <Keyboard />
              <span>Keyboard shortcuts</span>
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <CommandItem
                key={s.id}
                value={`nav ${s.label}`}
                onSelect={() => run(() => onNavigate(s.id))}
              >
                <Icon />
                <span>{s.label}</span>
                {s.hint && <CommandShortcut>{s.hint}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {brands.length > 0 && onChangeBrand && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch brand">
              {brands.slice(0, 12).map((b) => (
                <CommandItem
                  key={b.id}
                  value={`brand ${b.name}`}
                  onSelect={() => run(() => onChangeBrand(b))}
                >
                  <Building2 />
                  <span className="truncate">{b.name}</span>
                  {activeBrandId === b.id && (
                    <CommandShortcut>active</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {libraries.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent libraries">
              {libraries.slice(0, 10).map((l) => (
                <CommandItem
                  key={l.id}
                  value={`lib ${l.name}`}
                  onSelect={() => run(() => onOpenLibrary(l.id))}
                >
                  <Sparkles />
                  <span className="truncate">{l.name}</span>
                  <CommandShortcut>{l.iconCount} icons</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {packs.length > 0 && onOpenBundledPack && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Bundled icon packs">
              {packs.slice(0, 20).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`pack ${p.name}`}
                  onSelect={() => run(() => onOpenBundledPack(p.id))}
                >
                  <ImageIcon />
                  <span className="truncate">{p.name}</span>
                  <CommandShortcut>{p.count.toLocaleString()}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

/**
 * useCommandPalette — wires global hotkeys.
 *
 * Bindings:
 *   ⌘K / Ctrl+K  → toggle palette
 *   ?            → toggle shortcuts dialog
 *   G then <key> → jump to a section (dashboard, generate, library, imported,
 *                  brands, styles, sets, qa, export, settings)
 */
export function useStudioHotkeys(opts: {
  onTogglePalette: () => void;
  onShowShortcuts?: () => void;
  onNavigate?: (section: ShellSection) => void;
}) {
  const { onTogglePalette, onShowShortcuts, onNavigate } = opts;
  const [gPrefix, setGPrefix] = useState(false);

  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const sectionMap: Record<string, ShellSection> = {
      d: 'dashboard',
      n: 'generate',
      l: 'library',
      i: 'imported',
      b: 'brands',
      s: 'styles',
      q: 'qa',
      e: 'export',
    };

    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K toggles palette globally — even from inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTogglePalette();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === '?' && onShowShortcuts) {
        e.preventDefault();
        onShowShortcuts();
        return;
      }
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setGPrefix(true);
        window.setTimeout(() => setGPrefix(false), 1200);
        return;
      }
      if (gPrefix && onNavigate) {
        const target = sectionMap[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          onNavigate(target);
          setGPrefix(false);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onTogglePalette, onShowShortcuts, onNavigate, gPrefix]);
}
