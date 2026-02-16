import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Loader2, X, Check, Brain, RefreshCw } from "lucide-react";
import { useBoothContentSections, BoothContentSection } from "@/hooks/useBoothContentSections";
import { useBoothSectionAnalysis, type SectionAnalysis } from "@/hooks/useBoothSectionAnalysis";

interface BoothContentManagerProps {
  divisionId: string;
  divisionName?: string;
  isAdmin: boolean;
  color: string;
  variantLabel?: string;
  variants?: string[];
}

const clarityColors: Record<string, string> = {
  excellent: "text-green-500",
  good: "text-blue-500",
  "needs-work": "text-yellow-500",
  poor: "text-red-500",
};

const priorityColors: Record<string, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

const SectionAnalysisDisplay = ({ analysis }: { analysis: SectionAnalysis }) => {
  const safeStrengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const safeImprovements = Array.isArray(analysis.improvements) ? analysis.improvements : [];

  return (
    <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-3 w-3 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Analysis</span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {analysis.overall_score}/100
        </Badge>
        {analysis.analysis_data?.clarity_rating && (
          <span className={`text-[9px] font-medium ${clarityColors[analysis.analysis_data.clarity_rating] || "text-muted-foreground"}`}>
            {analysis.analysis_data.clarity_rating}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{analysis.analysis_data?.summary}</p>
      {safeStrengths.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-[9px] font-semibold text-green-600 dark:text-green-400">Strengths:</span>
          {safeStrengths.map((s, i) => (
            <p key={i} className="text-[10px] text-muted-foreground pl-2">• {s.point}</p>
          ))}
        </div>
      )}
      {safeImprovements.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-[9px] font-semibold text-yellow-600 dark:text-yellow-400">Improvements:</span>
          {safeImprovements.map((item, i) => (
            <p key={i} className="text-[10px] text-muted-foreground pl-2">
              • {item.point}
              <span className={`ml-1 text-[8px] font-medium ${priorityColors[item.priority] || ""}`}>({item.priority})</span>
            </p>
          ))}
        </div>
      )}
      <p className="text-[8px] text-muted-foreground/60">
        Analyzed {new Date(analysis.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

export const BoothContentManager = ({ divisionId, divisionName, isAdmin, color, variantLabel, variants = [] }: BoothContentManagerProps) => {
  const { sections, loading, addSection, updateSection, deleteSection } = useBoothContentSections(divisionId, variantLabel);
  const { analyses, analyzingSection, analyzeSection } = useBoothSectionAnalysis(divisionId);
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
        <Accordion type="multiple" className="space-y-2">
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
                      {analyses[section.id] && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5">
                          <Brain className="h-2.5 w-2.5" />
                          {analyses[section.id].overall_score}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Analyze section"
                          disabled={analyzingSection === section.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeSection(section.id, section.heading, section.bullets, divisionName);
                          }}
                        >
                          {analyzingSection === section.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : analyses[section.id] ? (
                            <RefreshCw className="h-3 w-3" />
                          ) : (
                            <Brain className="h-3 w-3" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEdit(section); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
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
                  {/* Per-section AI analysis */}
                  {analyses[section.id] && (
                    <SectionAnalysisDisplay analysis={analyses[section.id]} />
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          )}
        </Accordion>
      )}
    </div>
  );
};
