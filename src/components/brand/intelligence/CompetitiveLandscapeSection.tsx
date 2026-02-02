import { 
  Shield, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Crosshair,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ThreatAssessment {
  competitor: string;
  threat_level: 'high' | 'medium' | 'low';
  key_threat: string;
}

interface CompetitiveLandscape {
  tracked_competitors: string[];
  positioning_summary: string;
  competitive_gaps: string[];
  differentiation_opportunities: string[];
  threat_assessment: ThreatAssessment[];
  market_share_estimate: string;
}

interface CompetitiveLandscapeSectionProps {
  landscape: CompetitiveLandscape;
  isExpanded: boolean;
  onToggle: () => void;
}

const threatColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export const CompetitiveLandscapeSection = ({ 
  landscape, 
  isExpanded, 
  onToggle 
}: CompetitiveLandscapeSectionProps) => {
  if (!landscape) return null;

  const hasContent = landscape.tracked_competitors?.length > 0 || 
    landscape.positioning_summary ||
    landscape.competitive_gaps?.length > 0 ||
    landscape.differentiation_opportunities?.length > 0 ||
    landscape.threat_assessment?.length > 0;

  if (!hasContent) return null;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-rose-500" />
            <span className="font-medium">Competitive Landscape</span>
            {landscape.tracked_competitors?.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {landscape.tracked_competitors.length} competitors
              </Badge>
            )}
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4">
        {/* Tracked Competitors */}
        {landscape.tracked_competitors?.length > 0 && (
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Tracked Competitors
            </h4>
            <div className="flex flex-wrap gap-2">
              {landscape.tracked_competitors.map((competitor, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {competitor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Positioning Summary */}
        {landscape.positioning_summary && (
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Market Positioning
            </h4>
            <p className="text-sm text-muted-foreground">{landscape.positioning_summary}</p>
            {landscape.market_share_estimate && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                <strong>Estimated Position:</strong> {landscape.market_share_estimate}
              </p>
            )}
          </div>
        )}

        {/* Differentiation Opportunities */}
        {landscape.differentiation_opportunities?.length > 0 && (
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Differentiation Opportunities
            </h4>
            <ul className="space-y-1">
              {landscape.differentiation_opportunities.map((opp, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitive Gaps */}
        {landscape.competitive_gaps?.length > 0 && (
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Competitive Gaps
            </h4>
            <ul className="space-y-1">
              {landscape.competitive_gaps.map((gap, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-1">!</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Threat Assessment */}
        {landscape.threat_assessment?.length > 0 && (
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-500" />
              Threat Assessment
            </h4>
            <div className="space-y-3">
              {landscape.threat_assessment.map((threat, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Badge className={`shrink-0 ${threatColors[threat.threat_level]}`}>
                    {threat.threat_level}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{threat.competitor}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{threat.key_threat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
