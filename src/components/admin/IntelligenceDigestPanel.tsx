/**
 * Intelligence Digest Panel
 * AI-generated executive summary from Oracle data, health snapshots, and alerts.
 */

import { useState } from 'react';
import { FileText, Loader2, RefreshCw, Clock, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface DigestData {
  digest: string;
  generated_at: string;
  data_sources: {
    has_oracle: boolean;
    alerts_count: number;
    critical_alerts: number;
    snapshots_count: number;
    recommendations_count: number;
  };
}

interface IntelligenceDigestPanelProps {
  organizationId: string;
}

export function IntelligenceDigestPanel({ organizationId }: IntelligenceDigestPanelProps) {
  const [digestData, setDigestData] = useState<DigestData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDigest = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-intelligence-digest', {
        body: { organization_id: organizationId },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add funds to your workspace.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setDigestData(data);
      toast.success('Executive digest generated');
    } catch (err: any) {
      console.error('Digest generation failed:', err);
      toast.error('Failed to generate digest');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Executive Intelligence Digest
          </CardTitle>
          <Button
            size="sm"
            variant={digestData ? 'outline' : 'default'}
            onClick={generateDigest}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : digestData ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Generate Digest
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!digestData && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium text-sm">No digest generated yet</p>
            <p className="text-xs mt-1">Generate an AI executive summary of your intelligence data</p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyzing intelligence data...</p>
            <p className="text-xs mt-1">Compiling Oracle, health, and alert data into executive summary</p>
          </div>
        )}

        {digestData && !isGenerating && (
          <div className="space-y-4">
            {/* Data source badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={digestData.data_sources.has_oracle ? 'default' : 'outline'} className="text-[10px] gap-1">
                <CheckCircle className="h-2.5 w-2.5" /> Oracle
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Database className="h-2.5 w-2.5" />
                {digestData.data_sources.snapshots_count} snapshots
              </Badge>
              {digestData.data_sources.critical_alerts > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {digestData.data_sources.critical_alerts} critical
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(digestData.generated_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Badge>
            </div>

            {/* Digest content */}
            <ScrollArea className="max-h-[500px]">
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground
                [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2
                [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1.5
                [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:mb-1
                [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-2
                [&_ul]:text-xs [&_ul]:space-y-1 [&_ul]:mb-2 [&_ul]:pl-4
                [&_ol]:text-xs [&_ol]:space-y-1 [&_ol]:mb-2 [&_ol]:pl-4
                [&_li]:text-muted-foreground
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_em]:text-primary/80
              ">
                <ReactMarkdown>{digestData.digest}</ReactMarkdown>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
