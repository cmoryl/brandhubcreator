import { useState } from "react";
import { Brain, Loader2, RefreshCw, ChevronDown, CheckCircle, AlertTriangle, XCircle, Palette, Eye, Printer, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { useBoothColorAnalysis, type ColorPsychology, type ContrastPair, type ProductionNote, type ColorRecommendation } from "@/hooks/useBoothColorAnalysis";

interface BoothColorAnalysisPanelProps {
  divisionId: string;
  divisionName?: string;
  variantLabel?: string;
  colors: string[];
  isAdmin: boolean;
  color: string;
}

const ScoreGauge = ({ score, label, icon: Icon }: { score: number | null; label: string; icon: React.ElementType }) => {
  const val = score ?? 0;
  const getColor = (s: number) => s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-red-500";
  const getBg = (s: number) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
      <Icon className={`h-4 w-4 ${getColor(val)}`} />
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={`absolute inset-y-0 left-0 rounded-full ${getBg(val)} transition-all duration-500`} style={{ width: `${val}%` }} />
      </div>
      <span className={`text-lg font-bold ${getColor(val)}`}>{score ?? '—'}</span>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    high: "border-red-500/30 text-red-500",
    medium: "border-yellow-500/30 text-yellow-500",
    low: "border-green-500/30 text-green-500",
  };
  return (
    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${styles[priority] || ""}`}>
      {priority}
    </Badge>
  );
};

const PsychologyCard = ({ item }: { item: ColorPsychology }) => (
  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-card border border-border/30">
    <div className="h-8 w-8 rounded-md shrink-0 border border-border/40 shadow-sm" style={{ backgroundColor: item.color }} />
    <div className="min-w-0">
      <p className="text-xs font-semibold text-foreground">{item.emotion}</p>
      <p className="text-[10px] text-muted-foreground">{item.industry_fit}</p>
      {item.notes && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.notes}</p>}
    </div>
  </div>
);

const ContrastPairRow = ({ pair }: { pair: ContrastPair }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/30">
    <div className="flex items-center gap-1 shrink-0">
      <div className="h-5 w-5 rounded border border-border/40" style={{ backgroundColor: pair.background }} />
      <span className="text-[10px] text-muted-foreground">→</span>
      <div className="h-5 w-5 rounded border border-border/40" style={{ backgroundColor: pair.foreground }} />
    </div>
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <span className="text-xs font-mono font-medium">{pair.ratio?.toFixed(1)}:1</span>
      {pair.wcag_aa ? (
        <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500 shrink-0" />
      )}
      <span className="text-[10px] text-muted-foreground truncate">{pair.use_case}</span>
    </div>
  </div>
);

const ProductionRow = ({ note }: { note: ProductionNote }) => (
  <div className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/30">
    <div className="h-5 w-5 rounded shrink-0 border border-border/40" style={{ backgroundColor: note.color }} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">{note.color}</span>
        {note.cmyk_safe ? (
          <Badge variant="outline" className="text-[8px] px-1 py-0 border-green-500/30 text-green-500">CMYK Safe</Badge>
        ) : (
          <Badge variant="outline" className="text-[8px] px-1 py-0 border-yellow-500/30 text-yellow-500">Gamut Risk</Badge>
        )}
      </div>
      {note.large_format_notes && <p className="text-[10px] text-muted-foreground mt-0.5">{note.large_format_notes}</p>}
      {note.material_notes && <p className="text-[10px] text-muted-foreground/70">{note.material_notes}</p>}
    </div>
  </div>
);

export const BoothColorAnalysisPanel = ({ divisionId, divisionName, variantLabel, isAdmin, color }: Omit<BoothColorAnalysisPanelProps, 'colors'>) => {
  const { analysis, loading, analyzing, runAnalysis, paletteColors } = useBoothColorAnalysis(divisionId, variantLabel);
  const [expanded, setExpanded] = useState(false);
  const colors = paletteColors;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading analysis...
      </div>
    );
  }

  const hasAnalysis = !!analysis;
  const safeContrast = Array.isArray(analysis?.analysis_data?.contrast_pairs) ? analysis.analysis_data.contrast_pairs : [];
  const safeProduction = Array.isArray(analysis?.analysis_data?.production_notes) ? analysis.analysis_data.production_notes : [];
  const safeStrengths = Array.isArray(analysis?.analysis_data?.strengths) ? analysis.analysis_data.strengths : [];
  const safePsychology = Array.isArray(analysis?.psychology_data) ? analysis.psychology_data : [];
  const safeRecommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : [];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Color Analysis</h3>
          {hasAnalysis && analysis.overall_score != null && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5">
              {analysis.overall_score}/100
            </Badge>
          )}
          {!hasAnalysis && isAdmin && (
            <span className="text-[10px] text-muted-foreground italic">Not yet analyzed</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={hasAnalysis ? "Re-run analysis" : "Run color analysis"}
              disabled={analyzing || colors.length === 0}
              onClick={(e) => {
                e.stopPropagation();
                runAnalysis(colors, divisionName);
              }}
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : hasAnalysis ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {!hasAnalysis ? (
                <div className="text-center py-6">
                  <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No color analysis available for this booth variant yet.
                  </p>
                  {isAdmin && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => runAnalysis(colors, divisionName)}
                      disabled={analyzing || colors.length === 0}
                    >
                      {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                      Analyze Colors
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Score Gauges */}
                  <div className="grid grid-cols-3 gap-2">
                    <ScoreGauge score={analysis.overall_score} label="Overall" icon={Palette} />
                    <ScoreGauge score={analysis.accessibility_score} label="Accessibility" icon={Eye} />
                    <ScoreGauge score={analysis.production_score} label="Production" icon={Printer} />
                  </div>

                  {/* Summary */}
                  {analysis.analysis_data?.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.analysis_data.summary}</p>
                  )}

                  {/* Harmony */}
                  {analysis.analysis_data?.harmony_type && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: color + '40' }}>
                        {analysis.analysis_data.harmony_type}
                      </Badge>
                      {analysis.analysis_data.harmony_notes && (
                        <span className="text-[10px] text-muted-foreground">{analysis.analysis_data.harmony_notes}</span>
                      )}
                    </div>
                  )}

                  {/* Strengths */}
                  {safeStrengths.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Strengths</h4>
                      {safeStrengths.map((s, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground pl-2 flex items-start gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> {s}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Color Psychology */}
                  {safePsychology.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" /> Color Psychology
                      </h4>
                      <div className="grid gap-1.5">
                        {safePsychology.map((item, i) => (
                          <PsychologyCard key={i} item={item} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contrast Pairs */}
                  {safeContrast.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Best Contrast Pairs
                      </h4>
                      <div className="grid gap-1.5">
                        {safeContrast.map((pair, i) => (
                          <ContrastPairRow key={i} pair={pair} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production Notes */}
                  {safeProduction.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Printer className="h-3 w-3" /> Production Suitability
                      </h4>
                      <div className="grid gap-1.5">
                        {safeProduction.map((note, i) => (
                          <ProductionRow key={i} note={note} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {safeRecommendations.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Recommendations
                      </h4>
                      <div className="grid gap-1.5">
                        {safeRecommendations.map((rec, i) => (
                          <div key={i} className="p-2 rounded-lg bg-card border border-border/30 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">{rec.title}</span>
                              <PriorityBadge priority={rec.priority} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">{rec.description}</p>
                            {rec.suggested_color && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] text-muted-foreground">Suggested:</span>
                                <div className="h-4 w-4 rounded border border-border/40" style={{ backgroundColor: rec.suggested_color }} />
                                <span className="text-[9px] font-mono text-muted-foreground">{rec.suggested_color}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[8px] text-muted-foreground/60 pt-1">
                    Analyzed {new Date(analysis.updated_at).toLocaleDateString()} at {new Date(analysis.updated_at).toLocaleTimeString()}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
