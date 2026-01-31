import { useState } from "react";
import { ChevronRight, ChevronDown, Clock, BookOpen, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { iconKitGuides, IconKitGuide } from "@/data/iconKitGuides";
import { cn } from "@/lib/utils";

interface IconKitGuidesProps {
  searchQuery?: string;
}

export const IconKitGuides = ({ searchQuery = "" }: IconKitGuidesProps) => {
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  // Filter guides based on search
  const filteredGuides = iconKitGuides.filter(guide => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      guide.title.toLowerCase().includes(query) ||
      guide.description.toLowerCase().includes(query) ||
      guide.steps.some(step => 
        step.title.toLowerCase().includes(query) ||
        step.description.toLowerCase().includes(query)
      )
    );
  });

  if (filteredGuides.length === 0) {
    return null;
  }

  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-600 border-green-500/30',
    intermediate: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    advanced: 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-violet-500" />
        <h3 className="text-lg font-semibold text-foreground">Step-by-Step Guides</h3>
      </div>

      <div className="grid gap-3">
        {filteredGuides.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            isExpanded={expandedGuide === guide.id}
            onToggle={() => setExpandedGuide(
              expandedGuide === guide.id ? null : guide.id
            )}
            difficultyColors={difficultyColors}
          />
        ))}
      </div>
    </div>
  );
};

interface GuideCardProps {
  guide: IconKitGuide;
  isExpanded: boolean;
  onToggle: () => void;
  difficultyColors: Record<string, string>;
}

const GuideCard = ({ guide, isExpanded, onToggle, difficultyColors }: GuideCardProps) => {
  const Icon = guide.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={cn(
        "overflow-hidden transition-all border-border/50",
        isExpanded && "border-violet-500/30 bg-violet-500/5"
      )}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isExpanded ? "bg-violet-500/20" : "bg-muted"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isExpanded ? "text-violet-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{guide.title}</p>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs capitalize", difficultyColors[guide.difficulty])}
                >
                  {guide.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {guide.duration}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Mobile badges */}
            <div className="flex sm:hidden items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs capitalize", difficultyColors[guide.difficulty])}
              >
                {guide.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {guide.duration}
              </Badge>
            </div>

            {/* Steps */}
            <div className="space-y-3 pt-2">
              {guide.steps.map((step, index) => (
                <div 
                  key={step.step}
                  className="flex gap-3 group"
                >
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 group-hover:bg-violet-500/30 transition-colors">
                    <span className="text-sm font-bold text-violet-600">{step.step}</span>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-3 border-b border-border/30 last:border-0">
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    
                    {/* Tip */}
                    {step.tip && (
                      <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">{step.tip}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default IconKitGuides;
