import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { useBoothContentSections, BoothContentSection } from "@/hooks/useBoothContentSections";

interface BoothContentManagerProps {
  divisionId: string;
  isAdmin: boolean;
  color: string;
  variantLabel?: string;
  variants?: string[];
}

export const BoothContentManager = ({ divisionId, isAdmin, color, variantLabel, variants = [] }: BoothContentManagerProps) => {
  const { sections, loading, addSection, updateSection, deleteSection } = useBoothContentSections(divisionId, variantLabel);
  const [adding, setAdding] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newBullets, setNewBullets] = useState("");
  const [newVariant, setNewVariant] = useState<string>("shared");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeading, setEditHeading] = useState("");
  const [editBullets, setEditBullets] = useState("");
  const [editVariant, setEditVariant] = useState<string>("shared");

  const parseBullets = (text: string) => text.split("\n").map(b => b.trim()).filter(Boolean);

  const handleAdd = async () => {
    const bullets = parseBullets(newBullets);
    if (!newHeading.trim() || bullets.length === 0) return;
    const variantVal = newVariant === "shared" ? null : newVariant;
    await addSection(newHeading.trim(), bullets, variantVal);
    setNewHeading("");
    setNewBullets("");
    setNewVariant("shared");
    setAdding(false);
  };

  const startEdit = (section: BoothContentSection) => {
    setEditingId(section.id);
    setEditHeading(section.heading);
    setEditBullets(section.bullets.join("\n"));
    setEditVariant(section.variant_label || "shared");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const bullets = parseBullets(editBullets);
    if (!editHeading.trim() || bullets.length === 0) return;
    const variantVal = editVariant === "shared" ? null : editVariant;
    await updateSection(editingId, editHeading.trim(), bullets, variantVal);
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

  const variantOptions = ["shared", ...variants];

  const VariantSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    variants.length > 0 ? (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Applies to:</span>
        {variantOptions.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              value === v 
                ? "border-primary bg-primary/10 text-primary font-medium" 
                : "border-border/40 text-muted-foreground hover:border-primary/40"
            }`}
          >
            {v === "shared" ? "All Variants" : v}
          </button>
        ))}
      </div>
    ) : null
  );

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
          <VariantSelector value={newVariant} onChange={setNewVariant} />
          <div className="flex gap-2">
            <Button size="sm" className="text-xs" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setAdding(false); setNewHeading(""); setNewBullets(""); setNewVariant("shared"); }}>Cancel</Button>
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <Accordion type="multiple" defaultValue={sections.map(s => s.id)} className="space-y-2">
          {sections.map((section) =>
            editingId === section.id && isAdmin ? (
              <div key={section.id} className="bg-muted/30 rounded-lg p-4 border border-primary/30 space-y-2">
                <Input value={editHeading} onChange={(e) => setEditHeading(e.target.value)} className="text-sm font-semibold" />
                <Textarea value={editBullets} onChange={(e) => setEditBullets(e.target.value)} className="text-sm min-h-[100px]" />
                <VariantSelector value={editVariant} onChange={setEditVariant} />
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs gap-1" onClick={handleUpdate}><Check className="h-3 w-3" /> Save</Button>
                  <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setEditingId(null)}><X className="h-3 w-3" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <AccordionItem key={section.id} value={section.id} className="border border-border/40 rounded-lg bg-muted/30 px-4 overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center group relative">
                  <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold" style={{ color }}>{section.heading}</h4>
                      {section.variant_label && isAdmin && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: color + "40" }}>
                          {section.variant_label}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  {isAdmin && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEdit(section); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <AccordionContent>
                  <ul className="space-y-1.5 pb-1">
                    {section.bullets.map((bullet, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          )}
        </Accordion>
      )}
    </div>
  );
};
