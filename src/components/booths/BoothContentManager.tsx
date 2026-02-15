import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { useBoothContentSections, BoothContentSection } from "@/hooks/useBoothContentSections";

interface BoothContentManagerProps {
  divisionId: string;
  isAdmin: boolean;
  color: string;
}

export const BoothContentManager = ({ divisionId, isAdmin, color }: BoothContentManagerProps) => {
  const { sections, loading, addSection, updateSection, deleteSection } = useBoothContentSections(divisionId);
  const [adding, setAdding] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newBullets, setNewBullets] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeading, setEditHeading] = useState("");
  const [editBullets, setEditBullets] = useState("");

  const parseBullets = (text: string) => text.split("\n").map(b => b.trim()).filter(Boolean);

  const handleAdd = async () => {
    const bullets = parseBullets(newBullets);
    if (!newHeading.trim() || bullets.length === 0) return;
    await addSection(newHeading.trim(), bullets);
    setNewHeading("");
    setNewBullets("");
    setAdding(false);
  };

  const startEdit = (section: BoothContentSection) => {
    setEditingId(section.id);
    setEditHeading(section.heading);
    setEditBullets(section.bullets.join("\n"));
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const bullets = parseBullets(editBullets);
    if (!editHeading.trim() || bullets.length === 0) return;
    await updateSection(editingId, editHeading.trim(), bullets);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading booth details...
      </div>
    );
  }

  if (sections.length === 0 && !isAdmin) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Booth Details</h3>
        {isAdmin && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
        )}
      </div>

      {adding && isAdmin && (
        <div className="mb-4 space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
          <Input placeholder="Section heading" value={newHeading} onChange={(e) => setNewHeading(e.target.value)} className="text-sm" />
          <Textarea placeholder="Bullet points (one per line)" value={newBullets} onChange={(e) => setNewBullets(e.target.value)} className="text-sm min-h-[80px]" />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewHeading(""); setNewBullets(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((section) =>
            editingId === section.id && isAdmin ? (
              <div key={section.id} className="bg-muted/30 rounded-lg p-4 border border-primary/30 space-y-2">
                <Input value={editHeading} onChange={(e) => setEditHeading(e.target.value)} className="text-sm font-semibold" />
                <Textarea value={editBullets} onChange={(e) => setEditBullets(e.target.value)} className="text-sm min-h-[100px]" />
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs gap-1" onClick={handleUpdate}><Check className="h-3 w-3" /> Save</Button>
                  <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setEditingId(null)}><X className="h-3 w-3" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <div key={section.id} className="bg-muted/30 rounded-lg p-4 border border-border/40 group relative">
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(section)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSection(section.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <h4 className="text-sm font-semibold mb-2" style={{ color }}>{section.heading}</h4>
                <ul className="space-y-1.5">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
