import { useEffect, useRef, useState } from "react";
import { Copy, Link2, Shuffle, Undo2, Redo2, Check, Pencil } from "lucide-react";
import { StudioGradient, exportCssBlock, toCssGradient } from "@/lib/gradientStudio";
import { toast } from "sonner";

interface Props {
  gradient: StudioGradient;
  onRename: (name: string) => void;
  onRandomize: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const StudioToolbar = ({
  gradient, onRename, onRandomize, onUndo, onRedo, canUndo, canRedo,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(gradient.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraftName(gradient.name), [gradient.name]);
  useEffect(() => {
    if (editingName) inputRef.current?.select();
  }, [editingName]);

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(exportCssBlock(gradient));
      setCopied(true);
      toast.success("CSS copied to clipboard");
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy");
    }
  };

  const shareLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("css", toCssGradient(gradient));
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success("Shareable link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); onUndo(); }
      else if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); onRedo(); }
      else if (mod && e.key.toLowerCase() === "c" && e.shiftKey) { e.preventDefault(); copyCss(); }
      else if (e.key.toLowerCase() === "r" && !mod) { e.preventDefault(); onRandomize(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUndo, onRedo, onRandomize, gradient]);

  const commitName = () => {
    setEditingName(false);
    const trimmed = draftName.trim() || "Untitled";
    if (trimmed !== gradient.name) onRename(trimmed);
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-background/85 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-md border border-border shrink-0 shadow-inner"
            style={{ background: toCssGradient(gradient) }}
            aria-hidden
          />
          {editingName ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") { setDraftName(gradient.name); setEditingName(false); }
              }}
              className="text-sm font-medium bg-secondary/60 text-foreground rounded px-2 py-1 outline-none ring-1 ring-primary/40 min-w-[160px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary truncate max-w-[40vw]"
              title="Rename gradient"
            >
              <span className="truncate">{gradient.name}</span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ToolBtn label="Undo (⌘Z)" onClick={onUndo} disabled={!canUndo}><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn label="Redo (⇧⌘Z)" onClick={onRedo} disabled={!canRedo}><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolBtn label="Randomize (R)" onClick={onRandomize}><Shuffle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Remix</span></ToolBtn>
          <ToolBtn label="Copy shareable link" onClick={shareLink}><Link2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span></ToolBtn>
          <ToolBtn label="Copy CSS (⇧⌘C)" onClick={copyCss} primary>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy CSS"}</span>
          </ToolBtn>
        </div>
      </div>
    </div>
  );
};

const ToolBtn = ({
  children, onClick, disabled, label, primary,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string; primary?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className={[
      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      primary
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "bg-secondary/60 hover:bg-secondary text-foreground/80 hover:text-foreground border border-border/60",
    ].join(" ")}
  >
    {children}
  </button>
);
