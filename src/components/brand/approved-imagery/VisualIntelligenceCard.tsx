/**
 * Visual Intelligence Card
 * Compact collapsible card showing learned Visual DNA in entity editors
 */

import { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LearnedPreferencesPanel } from './LearnedPreferencesPanel';
import { useImageryPreferenceLearning } from '@/hooks/useImageryPreferenceLearning';

interface VisualIntelligenceCardProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  organizationId: string | null | undefined;
}

export const VisualIntelligenceCard = ({
  entityId,
  entityType,
  organizationId,
}: VisualIntelligenceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    visualDna,
    signalCount,
    isAnalyzing,
    isLoading,
    analyzePreferences,
  } = useImageryPreferenceLearning(entityId, entityType, organizationId);

  // Don't render anything if no signals exist yet
  if (!isLoading && !visualDna && signalCount === 0) return null;

  const hasData = !!visualDna;
  const confidence = visualDna?.confidence_score || 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Visual Intelligence</span>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : hasData ? (
                <Badge variant="outline" className="text-[9px] px-1.5 h-4 gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  {confidence}%
                </Badge>
              ) : signalCount > 0 ? (
                <Badge variant="secondary" className="text-[9px] px-1.5 h-4">
                  {signalCount} signals
                </Badge>
              ) : null}
            </div>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-3 pb-3">
            <LearnedPreferencesPanel
              visualDna={visualDna}
              signalCount={signalCount}
              isAnalyzing={isAnalyzing}
              isLoading={isLoading}
              onAnalyze={analyzePreferences}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
