/**
 * DataForce Cultural Validation Panel Component
 * Request human validation of brand content across regions
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Users, 
  Globe,
  Loader2,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ValidationFeedback {
  overallRating: number;
  culturalAppropriateness: number;
  messagingClarity: number;
  visualAppeal: number;
  comments: Array<{
    region: string;
    sentiment: string;
    text: string;
    category: string;
  }>;
  recommendations: string[];
}

interface CulturalValidationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  variantId?: string;
  guideData: Record<string, unknown>;
}

const REGIONS = [
  { code: 'NA', label: 'North America', flag: '🌎' },
  { code: 'LATAM', label: 'Latin America', flag: '🌎' },
  { code: 'EU', label: 'Europe', flag: '🌍' },
  { code: 'MENA', label: 'Middle East & Africa', flag: '🌍' },
  { code: 'APAC', label: 'Asia Pacific', flag: '🌏' },
];

export const CulturalValidation = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  variantId,
  guideData
}: CulturalValidationProps) => {
  const { organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [panelSize, setPanelSize] = useState(10);
  const [result, setResult] = useState<{
    requestId: string;
    status: string;
    validationScore?: number;
    feedback?: ValidationFeedback;
    isDemo: boolean;
    estimatedCompletion?: string;
  } | null>(null);

  const toggleRegion = (code: string) => {
    setSelectedRegions(prev => 
      prev.includes(code) 
        ? prev.filter(r => r !== code)
        : [...prev, code]
    );
  };

  const submitValidation = async () => {
    if (!organization?.id || selectedRegions.length === 0) {
      toast.error('Please select at least one region');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke('dataforce-validation', {
        body: {
          organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          variant_id: variantId,
          target_regions: selectedRegions,
          panel_size: panelSize,
          content_snapshot: guideData,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Validation request failed');
      }

      setResult({
        requestId: data.requestId,
        status: data.status,
        validationScore: data.validationScore,
        feedback: data.feedbackSummary,
        isDemo: data.isDemo,
        estimatedCompletion: data.estimatedCompletion,
      });

      toast.success(data.status === 'completed' 
        ? 'Validation complete!' 
        : 'Validation request submitted');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Validation request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-amber-500';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Cultural Validation Panel
          </SheetTitle>
          <SheetDescription>
            Get human feedback on {entityName} from target regions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {!result ? (
            <>
              {/* Region Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Target Regions</Label>
                <div className="grid grid-cols-1 gap-2">
                  {REGIONS.map(region => (
                    <div
                      key={region.code}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRegions.includes(region.code) 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleRegion(region.code)}
                    >
                      <Checkbox 
                        checked={selectedRegions.includes(region.code)}
                        onCheckedChange={() => toggleRegion(region.code)}
                      />
                      <span className="text-xl">{region.flag}</span>
                      <span className="flex-1">{region.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel Size */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Panel Size: {panelSize} reviewers per region
                </Label>
                <Slider
                  value={[panelSize]}
                  onValueChange={([value]) => setPanelSize(value)}
                  min={5}
                  max={50}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Total reviewers: {panelSize * selectedRegions.length}
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={submitValidation} 
                disabled={isSubmitting || selectedRegions.length === 0}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Request Validation
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Status Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Validation Status</CardTitle>
                    {result.isDemo && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {result.status === 'completed' ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <Clock className="h-8 w-8 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{result.status}</p>
                      {result.estimatedCompletion && result.status !== 'completed' && (
                        <p className="text-sm text-muted-foreground">
                          Est. completion: {new Date(result.estimatedCompletion).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results (if completed) */}
              {result.feedback && (
                <>
                  {/* Score Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Validation Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-primary">
                          {result.validationScore}%
                        </div>
                        <Progress value={result.validationScore} className="flex-1 h-3" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Cultural Fit</span>
                            <span>{result.feedback.culturalAppropriateness}%</span>
                          </div>
                          <Progress value={result.feedback.culturalAppropriateness} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Message Clarity</span>
                            <span>{result.feedback.messagingClarity}%</span>
                          </div>
                          <Progress value={result.feedback.messagingClarity} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Visual Appeal</span>
                            <span>{result.feedback.visualAppeal}%</span>
                          </div>
                          <Progress value={result.feedback.visualAppeal} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments */}
                  {result.feedback.comments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Reviewer Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.feedback.comments.slice(0, 5).map((comment, i) => (
                          <div key={i} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe className="h-3 w-3" />
                              <span className="text-xs font-medium">{comment.region}</span>
                              <Badge variant="outline" className="text-xs">
                                {comment.category}
                              </Badge>
                            </div>
                            <p className={`text-sm ${getSentimentColor(comment.sentiment)}`}>
                              {comment.text}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {result.feedback.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.feedback.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* New Validation Button */}
              <Button 
                onClick={() => setResult(null)} 
                variant="outline"
                className="w-full"
              >
                Request New Validation
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
