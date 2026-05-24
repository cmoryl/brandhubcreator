/**
 * KeyboardShortcutsDialog — discoverable list of Icon Studio hotkeys.
 * Opens via the "?" key (see useStudioHotkeys).
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ROWS: Array<{ keys: string[]; label: string }> = [
  { keys: ['⌘', 'K'], label: 'Open command palette' },
  { keys: ['Ctrl', 'K'], label: 'Open command palette (Windows / Linux)' },
  { keys: ['?'], label: 'Show this shortcuts list' },
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'N'], label: 'Go to Generate (new icon system)' },
  { keys: ['G', 'L'], label: 'Go to Library' },
  { keys: ['G', 'I'], label: 'Go to Imported Icons' },
  { keys: ['G', 'B'], label: 'Go to Brands' },
  { keys: ['G', 'S'], label: 'Go to Style Systems' },
  { keys: ['G', 'Q'], label: 'Go to QA / Preflight' },
  { keys: ['G', 'E'], label: 'Go to Export Center' },
  { keys: ['Esc'], label: 'Close dialogs / palette' },
];

export const KeyboardShortcutsDialog = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <DialogDescription>
          Drive Icon Studio without leaving the keyboard. Press G then a key to jump to a section.
        </DialogDescription>
      </DialogHeader>
      <ul className="divide-y rounded-md border bg-secondary/30">
        {ROWS.map((r) => (
          <li
            key={r.label + r.keys.join('+')}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <span className="text-sm text-foreground">{r.label}</span>
            <span className="flex items-center gap-1">
              {r.keys.map((k, idx) => (
                <kbd
                  key={`${k}-${idx}`}
                  className="rounded border bg-background px-1.5 py-0.5 text-[11px] font-mono text-foreground shadow-sm"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </DialogContent>
  </Dialog>
);
