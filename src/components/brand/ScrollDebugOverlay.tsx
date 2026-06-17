import { useEffect, useState } from 'react';
import { scrollDebug, type ScrollDebugSnapshot } from '@/lib/scrollToSection';
import { Bug } from 'lucide-react';

export function ScrollDebugOverlay() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<ScrollDebugSnapshot | null>(scrollDebug.last);

  useEffect(() => {
    return scrollDebug.on((s) => setSnapshot(s));
  }, []);

  // Keyboard shortcut: Shift + D toggles overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="fixed bottom-20 right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="pointer-events-auto h-10 w-10 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
        title="Toggle scroll debug overlay (Shift+D)"
        aria-label="Toggle scroll debug overlay"
      >
        <Bug className="h-5 w-5" />
      </button>

      {open && snapshot && (
        <div className="pointer-events-auto rounded-xl border bg-popover/95 backdrop-blur-sm shadow-xl p-4 min-w-[260px]">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Scroll Debug
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Section</span>
              <span className="font-mono font-medium">{snapshot.sectionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Header Height</span>
              <span className="font-mono font-medium">{snapshot.headerHeight.toFixed(1)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">topOffsetPx</span>
              <span className="font-mono font-medium">{snapshot.topOffsetPx.toFixed(1)}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drift</span>
              <span
                className={`font-mono font-medium ${
                  snapshot.drift <= 8 ? 'text-green-600' : snapshot.drift <= 16 ? 'text-amber-600' : 'text-red-600'
                }`}
              >
                {snapshot.drift.toFixed(1)}px
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age</span>
              <span className="font-mono font-medium">
                {((performance.now() - snapshot.timestamp) / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
