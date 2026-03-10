/**
 * DataForce Actions Panel for Social Asset Placements
 * Provides compliance check, cultural validation, and GenAI caption generation
 */
import { useState } from 'react';
import { Shield, Users, Wand2, ChevronDown, ChevronUp, Loader2, CheckCircle2, Clock, Copy, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComplianceCheck } from '@/hooks/dataforce/useComplianceCheck';
import { useCulturalValidation } from '@/hooks/dataforce/useCulturalValidation';
import { useGenAITraining } from '@/hooks/dataforce/useGenAITraining';
import { toast } from 'sonner';

interface BrandContext {
  name?: string;
  colors?: Array<{ name: string; hex: string; role?: string }>;
  typography?: Array<{ family: string; weight?: string; usage?: string }>;
  archetype?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  logos?: Array<{ url?: string; name?: string }>;
}

interface SocialDataForceActionsProps {
  organizationId: string;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  platform: string;
  format: string;
  imageUrl?: string;
  brandContext?: BrandContext;
  hasImage: boolean;
  isAdmin: boolean;
}

const VALIDATION_REGIONS = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
];

const CONTENT_TYPES = [
  { value: 'social_post', label: 'Social Post' },
  { value: 'tagline', label: 'Tagline' },
  { value: 'description', label: 'Description' },
];

export const SocialDataForceActions = ({
  organizationId,
  entityId,
  entityType,
  entityName,
  platform,
  format,
  imageUrl,
  brandContext,
  hasImage,
  isAdmin,
}: SocialDataForceActionsProps) => {
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'compliance' | 'validation' | 'caption' | null>(null);
  const [validationRegions, setValidationRegions] = useState<string[]>([]);
  const [captionType, setCaptionType] = useState('social_post');

  const compliance = useComplianceCheck({
    organizationId,
    entityType,
    entityId,
    entityName,
  });

  const validation = useCulturalValidation({
    organizationId,
    entityType,
    entityId,
    entityName,
  });

  const genai = useGenAITraining({
    organizationId,
    entityType,
    entityId,
  });

  if (!hasImage || !isAdmin) return null;

  const handleComplianceCheck = async () => {
    setActiveAction('compliance');
    const guideData: Record<string, unknown> = {
      social_asset: {
        platform,
        format,
        image_url: imageUrl,
      },
      brand_name: brandContext?.name,
      colors: brandContext?.colors,
      typography: brandContext?.typography,
      archetype: brandContext?.archetype,
    };
    await compliance.runCheck(guideData);
  };

  const handleValidation = async () => {
    if (validationRegions.length === 0) {
      toast.error('Select at least one region');
      return;
    }
    setActiveAction('validation');
    const guideData: Record<string, unknown> = {
      social_asset: { platform, format, image_url: imageUrl },
      brand_name: brandContext?.name,
    };
    await validation.submitValidation(validationRegions, 5, guideData);
  };

  const handleGenCaption = async () => {
    setActiveAction('caption');
    const prompt = `Generate a ${captionType === 'social_post' ? 'social media post' : captionType} for ${platform} (${format} format). Brand: ${brandContext?.name || entityName}. Industry: ${brandContext?.industry || 'general'}. Archetype: ${brandContext?.archetype || 'professional'}. Include relevant hashtags and emojis where appropriate.`;
    await genai.generateContent(prompt, captionType);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const hasAnyResult = compliance.result || validation.activeRequest || genai.generatedContent;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="px-3 py-2.5 border-t border-border/50 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">DataForce</span>
              {compliance.result && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] h-4 px-1.5',
                    compliance.result.score >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                      : compliance.result.score >= 60 ? 'text-amber-600 dark:text-amber-400'
                      : 'text-destructive',
                  )}
                >
                  {compliance.result.score}%
                </Badge>
              )}
              {validation.activeRequest && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {validation.activeRequest.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={activeAction === 'compliance' ? 'default' : 'outline'}
              className="h-7 text-xs"
              disabled={compliance.isChecking}
              onClick={handleComplianceCheck}
            >
              {compliance.isChecking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
              Compliance
            </Button>
            <Button
              size="sm"
              variant={activeAction === 'caption' ? 'default' : 'outline'}
              className="h-7 text-xs"
              disabled={genai.isGenerating}
              onClick={() => setActiveAction('caption')}
            >
              {genai.isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
              Generate Caption
            </Button>
            <Button
              size="sm"
              variant={activeAction === 'validation' ? 'default' : 'outline'}
              className="h-7 text-xs"
              disabled={validation.isSubmitting}
              onClick={() => setActiveAction('validation')}
            >
              {validation.isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Users className="h-3 w-3 mr-1" />}
              Validate
            </Button>
          </div>

          {/* Caption generation form */}
          {activeAction === 'caption' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Select value={captionType} onValueChange={setCaptionType}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-xs" disabled={genai.isGenerating} onClick={handleGenCaption}>
                  {genai.isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate'}
                </Button>
              </div>
              {genai.generatedContent && (
                <div className="relative bg-muted/50 rounded-md px-2.5 py-2 border border-border/50">
                  <p className="text-xs text-foreground whitespace-pre-wrap pr-6">{genai.generatedContent.content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-5 w-5 p-0"
                    onClick={() => copyToClipboard(genai.generatedContent!.content)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Validation form */}
          {activeAction === 'validation' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {VALIDATION_REGIONS.map(r => (
                  <Badge
                    key={r.value}
                    variant={validationRegions.includes(r.value) ? 'default' : 'outline'}
                    className="text-[10px] cursor-pointer"
                    onClick={() => {
                      setValidationRegions(prev =>
                        prev.includes(r.value) ? prev.filter(v => v !== r.value) : [...prev, r.value]
                      );
                    }}
                  >
                    {r.label}
                  </Badge>
                ))}
              </div>
              <Button size="sm" className="h-7 text-xs w-full" disabled={validation.isSubmitting || validationRegions.length === 0} onClick={handleValidation}>
                {validation.isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                Submit for Validation ({validationRegions.length} region{validationRegions.length !== 1 ? 's' : ''})
              </Button>
              {validation.activeRequest && (
                <div className="flex items-center gap-2 text-xs bg-primary/5 rounded-md px-2.5 py-1.5">
                  {validation.activeRequest.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Score: <strong>{validation.activeRequest.validationScore}</strong></span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Status: <strong className="capitalize">{validation.activeRequest.status}</strong></span>
                      {validation.activeRequest.estimatedCompletion && (
                        <span className="text-muted-foreground">· Est. {validation.activeRequest.estimatedCompletion}</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compliance result */}
          {compliance.result && activeAction === 'compliance' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Compliance Score</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    compliance.result.score >= 80 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : compliance.result.score >= 60 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {compliance.result.score}%
                </Badge>
              </div>
              {compliance.result.isDemo && (
                <p className="text-[10px] text-muted-foreground italic">Demo mode — results are simulated</p>
              )}
              {compliance.result.issues.length > 0 && (
                <div className="space-y-1.5">
                  {compliance.result.issues.slice(0, 5).map((issue, i) => {
                    const Icon = issue.severity === 'critical' ? XCircle : issue.severity === 'warning' ? AlertTriangle : CheckCircle2;
                    const color = issue.severity === 'critical' ? 'text-destructive' : issue.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', color)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{issue.description}</p>
                          {issue.recommendation && (
                            <p className="text-muted-foreground mt-0.5">{issue.recommendation}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!hasAnyResult && activeAction === null && (
            <p className="text-xs text-muted-foreground italic">Run compliance checks, generate captions, or submit for cultural validation.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
