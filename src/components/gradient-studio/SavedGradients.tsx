import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Trash2, Plus, Search, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioGradient, toCssGradient } from "@/lib/gradientStudio";
import { scoreGradient } from "@/lib/gradientA11y";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SavedGradientRow {
  id: string;
  name: string;
  description: string | null;
  gradient: StudioGradient;
  css: string | null;
  category: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  created_by: string | null;
}

const CATEGORIES = ["signature", "marketing", "product", "event", "ui", "experimental", "custom"] as const;

interface Props {
  currentGradient: StudioGradient;
  onUseGradient: (g: StudioGradient) => void;
}

export const SavedGradients = ({ currentGradient, onUseGradient }: Props) => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<SavedGradientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [saveOpen, setSaveOpen] = useState(false);
  const [editing, setEditing] = useState<SavedGradientRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_gradients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load saved gradients");
    } else {
      setRows((data ?? []) as unknown as SavedGradientRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [rows, query, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved gradient?")) return;
    const { error } = await supabase.from("saved_gradients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved gradients…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button size="sm" className="h-8 gap-1" onClick={() => setSaveOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Save current
          </Button>
        )}
      </div>

      {!isAdmin && (
        <p className="text-[11px] text-muted-foreground">
          Read-only view. Only admins can add, edit, or remove saved gradients.
        </p>
      )}

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
          <Bookmark className="h-5 w-5 mx-auto mb-2 opacity-60" />
          No saved gradients{query || categoryFilter !== "all" ? " match this filter" : " yet"}.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((row) => (
            <SavedCard
              key={row.id}
              row={row}
              isAdmin={isAdmin}
              onUse={() => onUseGradient(row.gradient)}
              onEdit={() => setEditing(row)}
              onDelete={() => handleDelete(row.id)}
            />
          ))}
        </div>
      )}

      {isAdmin && (
        <SaveDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          gradient={currentGradient}
          onSaved={(row) => { setRows((r) => [row, ...r]); setSaveOpen(false); }}
        />
      )}
      {isAdmin && editing && (
        <SaveDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          gradient={editing.gradient}
          existing={editing}
          onSaved={(row) => {
            setRows((r) => r.map((x) => (x.id === row.id ? row : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

const SavedCard = ({
  row, isAdmin, onUse, onEdit, onDelete,
}: {
  row: SavedGradientRow;
  isAdmin: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const css = row.css || toCssGradient(row.gradient);
  const score = useMemo(() => {
    try { return scoreGradient(row.gradient); } catch { return null; }
  }, [row.gradient]);

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={onUse}
        className="relative aspect-[16/10] flex items-center justify-center text-left"
        style={{ background: css }}
        title="Open in editor"
      >
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold text-white drop-shadow">Aa</span>
        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold text-[#111]">Aa</span>
        {!row.is_public && (
          <Badge className="absolute top-1.5 right-1.5 h-4 text-[9px] px-1.5" variant="secondary">private</Badge>
        )}
      </button>
      <div className="p-2 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate">{row.name}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{row.category}</div>
          </div>
          {score && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
              {Math.min(score.minRatioWhite, score.minRatioDark).toFixed(1)}
            </Badge>
          )}
        </div>
        {row.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{row.description}</p>
        )}
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px]" onClick={onUse}>
            Open
          </Button>
          {isAdmin && (
            <>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit} title="Edit">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDelete} title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SaveDialog = ({
  open, onOpenChange, gradient, existing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  gradient: StudioGradient;
  existing?: SavedGradientRow;
  onSaved: (row: SavedGradientRow) => void;
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(existing?.name ?? gradient.name ?? "Untitled gradient");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<string>(existing?.category ?? "custom");
  const [tagsText, setTagsText] = useState((existing?.tags ?? []).join(", "));
  const [isPublic, setIsPublic] = useState(existing?.is_public ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !existing) {
      setName(gradient.name ?? "Untitled gradient");
      setDescription("");
      setCategory("custom");
      setTagsText("");
      setIsPublic(true);
    }
  }, [open, existing, gradient]);

  const css = toCssGradient(gradient);

  const submit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      gradient: gradient as unknown as Record<string, unknown>,
      css,
      category,
      tags,
      is_public: isPublic,
    };
    if (existing) {
      const { data, error } = await supabase
        .from("saved_gradients")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Updated");
      onSaved(data as unknown as SavedGradientRow);
    } else {
      const { data, error } = await supabase
        .from("saved_gradients")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Saved");
      onSaved(data as unknown as SavedGradientRow);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit saved gradient" : "Save gradient"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            className="h-24 rounded-md border border-border"
            style={{ background: css }}
            aria-label="Preview"
          />
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs"
              placeholder="What is this gradient for?"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="brand, hero, dark"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="visibility" className="text-xs">
              Visible to all signed-in users
            </Label>
            <Switch id="visibility" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            <Check className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving…" : existing ? "Save changes" : "Save gradient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
