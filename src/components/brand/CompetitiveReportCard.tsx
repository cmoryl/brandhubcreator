import { useState } from 'react';
import { TrendingUp, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/admin/competitive-analysis/ScoreGauge';
import { CompetitiveAnalysisDialog } from '@/components/brand/CompetitiveAnalysisDialog';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { formatDistanceToNow } from 'date-fns';
import type { EntityType } from '@/types/competitiveAnalysis';

interface CompetitiveReportCardProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  organizationId?: string | null;
}

export function CompetitiveReportCard({
  entityType,
  entityId,
  entityName,
  organizationId,
}: CompetitiveReportCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { latestReport, isLoading, refetch } = useCompetitiveAnalysis({ entityType, entityId, organizationId });

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Competitive Analysis
            </CardTitle>
            {latestReport && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(latestReport.created_at), { addSuffix: true })}
              </Badge>
            )}
          </div>
          <CardDescription>
            AI-powered competitive intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestReport ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ScoreGauge 
                  score={latestReport.score || 0} 
                  size="sm" 
                  showLabel={false}
                />
                <div className="text-sm">
                  <p className="font-medium">
                    {latestReport.competitors?.length || 0} competitors analyzed
                  </p>
                  <p className="text-muted-foreground">
                    Click to view full report
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDialogOpen(true)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDialogOpen(true)}
              disabled={isLoading}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Run Competitive Analysis
            </Button>
          )}
        </CardContent>
      </Card>

      <CompetitiveAnalysisDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={entityType}
        entityId={entityId}
        entityName={entityName}
        organizationId={organizationId}
        onReportGenerated={refetch}
      />
    </>
  );
}
