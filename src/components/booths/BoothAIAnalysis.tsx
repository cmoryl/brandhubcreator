import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Brain, Loader2, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, ChevronRight } from "lucide-react";
import { useBoothAnalysis, type BoothAnalysis } from "@/hooks/useBoothAnalysis";
import { useBoothContentSections } from "@/hooks/useBoothContentSections";

interface BoothAIAnalysisProps {
  divisionId: string;
  divisionName: string;
  divisionTagline?: string;
  divisionDescription?: string;
  divisionServices?: string[];
  divisionColor?: string;
  variantLabel?: string;
  isAdmin: boolean;
}

const scoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const scoreBg = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const priorityColor = (priority: string) => {
  if (priority === "high") return "border-red-500/40 text-red-500";
  if (priority === "medium") return "border-yellow-500/40 text-yellow-500";
  return "border-green-500/40 text-green-500";
};

const ScoreGauge = ({ label, score, color }: { label: string; score: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
    <Progress value={score} className="h-1.5" style={{ ['--progress-color' as string]: color }} />
  </div>
);

export const BoothAIAnalysis = ({
  divisionId, divisionName, divisionTagline, divisionDescription,
  divisionServices, divisionColor, variantLabel, isAdmin,
}: BoothAIAnalysisProps) => {
  const { analysis, loading, analyzing, runAnalysis } = useBoothAnalysis(divisionId);
  const { sections } = useBoothContentSections(divisionId, variantLabel);
  const [expanded, setExpanded] = useState(false);

  const handleRunAnalysis = () => {
    runAnalysis({
      division_id: divisionId,
      division_name: divisionName,
      division_tagline: divisionTagline,
      division_description: divisionDescription,
      division_services: divisionServices,
      division_color: divisionColor,
      variant_label: variantLabel,
      content_sections: sections.map(s => ({ heading: s.heading, bullets: s.bullets })),
    });
  };

  if (loading) return null;

  // No analysis yet — show trigger button for admins
  if (!analysis && !isAdmin) return null;

  if (!analysis) {
    return (
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs w-full border-dashed"
          onClick={handleRunAnalysis}
          disabled={analyzing}
        >
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {analyzing ? "Analyzing..." : "Run AI Booth Analysis"}
        </Button>
      </div>
    );
  }

  const { analysis_data: rawAnalysisData, strengths, improvements, recommendations, overall_score, created_at } = analysis;
  const analysis_data = rawAnalysisData as Record<string, any>;
  const safeStrengths = Array.isArray(strengths) ? strengths : [];
  const safeImprovements = Array.isArray(improvements) ? improvements : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Analysis</span>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${scoreBg(overall_score)} text-white`}>
            {overall_score}/100
          </div>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed">{analysis_data?.summary}</p>

          {/* Score Gauges */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreGauge label="Design" score={analysis_data?.design_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
            <ScoreGauge label="Production" score={analysis_data?.production_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
            <ScoreGauge label="Messaging" score={analysis_data?.messaging_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
            <ScoreGauge label="Content" score={analysis_data?.content_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
            <ScoreGauge label="Differentiation" score={analysis_data?.differentiation_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
            <ScoreGauge label="Engagement" score={analysis_data?.engagement_score ?? 0} color={divisionColor || "hsl(var(--primary))"} />
          </div>

          {/* Strengths / Improvements / Recommendations */}
          <Accordion type="multiple" className="space-y-1.5">
            {safeStrengths.length > 0 && (
              <AccordionItem value="strengths" className="border border-green-500/20 rounded-lg bg-green-500/5 px-3 overflow-hidden">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Strengths ({safeStrengths.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-1">
                    {safeStrengths.map((s, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-medium text-foreground">{s.title}</span>
                        <p className="text-muted-foreground mt-0.5">{s.detail}</p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {safeImprovements.length > 0 && (
              <AccordionItem value="improvements" className="border border-yellow-500/20 rounded-lg bg-yellow-500/5 px-3 overflow-hidden">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Improvements ({safeImprovements.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-1">
                    {safeImprovements.map((item, i) => (
                      <li key={i} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.title}</span>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColor(item.priority)}`}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {safeRecommendations.length > 0 && (
              <AccordionItem value="recommendations" className="border border-blue-500/20 rounded-lg bg-blue-500/5 px-3 overflow-hidden">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Recommendations ({safeRecommendations.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-1">
                    {safeRecommendations.map((r, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-medium text-foreground">{r.action}</span>
                        <p className="text-muted-foreground mt-0.5">Impact: {r.impact}</p>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground">
              Analyzed {new Date(created_at).toLocaleDateString()} at {new Date(created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-[10px] h-6 px-2"
                onClick={handleRunAnalysis}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Re-analyze
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
