/**
 * DataForce Compliance Checker Component
 * Run brand compliance checks from entity editors
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ComplianceIssue {
  id: string;
  type: 'color' | 'typography' | 'logo' | 'imagery' | 'messaging' | 'layout';
  severity: 'critical' | 'warning' | 'info';
  assetName: string;
  description: string;
  recommendation: string;
  confidence: number;
}

interface ComplianceCheckerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  guideData: Record<string, unknown>;
}

export const ComplianceChecker = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  guideData
}: ComplianceCheckerProps) => {
  const { organization } = useOrganization();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    issues: ComplianceIssue[];
    isDemo: boolean;
  } | null>(null);

  const runComplianceCheck = async () => {
    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to run compliance checks');
        return;
      }

      const response = await supabase.functions.invoke('dataforce-compliance', {
        body: {
          organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          guide_data: guideData,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Compliance check failed');
      }

      setResult({
        score: data.complianceScore,
        issues: data.issues || [],
        isDemo: data.isDemo,
      });

      toast.success(`Compliance check complete: ${data.complianceScore}% score`);
    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error(error instanceof Error ? error.message : 'Compliance check failed');
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Brand Compliance Check
          </SheetTitle>
          <SheetDescription>
            Analyze {entityName} for brand guideline compliance
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Run Check Button */}
          <Button 
            onClick={runComplianceCheck} 
            disabled={isChecking}
            className="w-full"
            size="lg"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : result ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Compliance Check
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Compliance Check
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Score Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Compliance Score</CardTitle>
                    {result.isDemo && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}%
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={result.score} 
                        className="h-3"
                      />
                    </div>
                    {result.score >= 80 && (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {result.score >= 90 
                      ? 'Excellent! Brand guidelines are well-maintained.'
                      : result.score >= 70
                        ? 'Good compliance with some areas for improvement.'
                        : 'Several compliance issues need attention.'}
                  </p>
                </CardContent>
              </Card>

              {/* Issues List */}
              {result.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Issues Found
                      <Badge variant="outline">{result.issues.length}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Address these issues to improve compliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.issues.map((issue, index) => (
                      <div 
                        key={issue.id || index}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{issue.assetName}</span>
                              <Badge variant={getSeverityColor(issue.severity) as any} className="text-xs">
                                {issue.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {issue.description}
                            </p>
                          </div>
                        </div>
                        <div className="pl-6 text-sm bg-muted/50 p-2 rounded">
                          <strong>Recommendation:</strong> {issue.recommendation}
                        </div>
                        {issue.confidence && (
                          <div className="pl-6 text-xs text-muted-foreground">
                            Confidence: {Math.round(issue.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {result.issues.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium">No Issues Found</h3>
                    <p className="text-sm text-muted-foreground">
                      Your brand guidelines are fully compliant!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Info Card */}
          {!result && !isChecking && (
            <Card className="bg-muted/50">
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p>DataForce Compliance AI analyzes your brand assets for:</p>
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      <li>Color accessibility and contrast</li>
                      <li>Typography consistency</li>
                      <li>Logo usage guidelines</li>
                      <li>Imagery style alignment</li>
                      <li>Messaging tone and voice</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
