/**
 * LocalizationSidebarTab - Dedicated sidebar tab for localization features
 * Provides quick translate, cultural insights, and variant management
 */

import React, { useState } from 'react';
import { 
  Globe2, 
  Languages, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  Brain,
  MapPin,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLocalization } from '@/hooks/useLocalization';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES } from '@/types/localization';

interface LocalizationSidebarTabProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  guideData?: Record<string, unknown>;
  onOpenCulturalAnalysis?: () => void;
  onOpenWorkflowTrigger?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const LocalizationSidebarTab: React.FC<LocalizationSidebarTabProps> = ({
  entityType,
  entityId,
  entityName,
  guideData,
  onOpenCulturalAnalysis,
  onOpenWorkflowTrigger,
  onOpenSettings,
  className,
}) => {
  const { organization } = useOrganization();
  const { 
    targetLanguages, 
    jobs, 
    config, 
    isTranslating,
    translateContent,
    submitJob,
    addLanguage,
  } = useLocalization(organization?.id);
  
  const [quickTranslating, setQuickTranslating] = useState<string | null>(null);

  // Get active languages
  const activeLanguages = targetLanguages.filter(l => l.is_active);
  
  // Get jobs for this entity
  const entityJobs = jobs.filter(j => j.entity_id === entityId);
  const pendingJobs = entityJobs.filter(j => j.status === 'pending' || j.status === 'processing');
  const completedJobs = entityJobs.filter(j => j.status === 'completed');

  // Calculate translation coverage
  const totalLanguages = activeLanguages.length;
  const translatedLanguages = completedJobs.length;
  const coveragePercent = totalLanguages > 0 ? Math.round((translatedLanguages / totalLanguages) * 100) : 0;

  // API mode
  const isLiveMode = config?.api_mode === 'live';
  const isDemo = !config || config.api_mode === 'demo';

  // Quick translate a single language
  const handleQuickTranslate = async (languageCode: string, languageName: string) => {
    if (!guideData) {
      toast.error('No content to translate');
      return;
    }

    setQuickTranslating(languageCode);
    try {
      const result = await translateContent({
        source_language: 'en_US',
        target_language: languageCode,
        content: guideData,
        preserve_formatting: true,
      });

      if (result.success) {
        toast.success(`Translated to ${languageName}`, {
          description: result.cached ? 'Retrieved from cache' : `${result.word_count || 0} words translated`,
        });
        
        // Submit as a job for tracking
        await submitJob.mutateAsync({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          target_language: languageCode,
          source_content: guideData,
        });
      } else {
        toast.error(`Translation failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Translation failed');
    } finally {
      setQuickTranslating(null);
    }
  };

  // Add a popular language quickly
  const handleAddLanguage = async (code: string, name: string) => {
    try {
      await addLanguage.mutateAsync({ language_code: code, language_name: name });
      toast.success(`Added ${name} as target language`);
    } catch {
      // Error handled in hook
    }
  };

  // Suggested languages (popular ones not yet added)
  const suggestedLanguages = SUPPORTED_LANGUAGES
    .filter(l => !targetLanguages.some(tl => tl.language_code === l.code))
    .slice(0, 4);

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-4 space-y-4">
        {/* Status Overview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              Localization Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Coverage</span>
              <span className="font-medium">{coveragePercent}%</span>
            </div>
            <Progress value={coveragePercent} className="h-2" />
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{translatedLanguages} translated</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>{pendingJobs.length} pending</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isLiveMode ? 'default' : 'secondary'} className="text-[10px]">
                {isLiveMode ? 'Live API' : 'Demo Mode'}
              </Badge>
              {isDemo && (
                <span className="text-[10px] text-muted-foreground">
                  Simulated translations
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-2 flex-col gap-1"
              onClick={onOpenWorkflowTrigger}
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs">Translate All</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-2 flex-col gap-1"
              onClick={onOpenCulturalAnalysis}
            >
              <Brain className="h-4 w-4" />
              <span className="text-xs">Cultural Insights</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Target Languages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Target Languages
            </h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onOpenSettings}>
              <Settings className="h-3 w-3" />
            </Button>
          </div>

          {activeLanguages.length > 0 ? (
            <div className="space-y-1">
              {activeLanguages.map(lang => {
                const job = entityJobs.find(j => j.target_language === lang.language_code);
                const isTranslated = job?.status === 'completed';
                const isPending = job?.status === 'pending' || job?.status === 'processing';
                const isQuickTranslating = quickTranslating === lang.language_code;

                return (
                  <div
                    key={lang.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isTranslated ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : isPending ? (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className="text-sm">{lang.language_name}</span>
                    </div>
                    
                    {!isTranslated && !isPending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleQuickTranslate(lang.language_code, lang.language_name)}
                        disabled={isQuickTranslating || isTranslating}
                      >
                        {isQuickTranslating ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Translate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-muted/30 rounded-lg">
              <Languages className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                No target languages configured
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Add popular languages:</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {suggestedLanguages.map(lang => (
                    <Button
                      key={lang.code}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => handleAddLanguage(lang.code, lang.name)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Regional Variants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Variants
          </h3>
          
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Create region-specific versions with cultural adaptations
              </p>
              <Button variant="outline" size="sm" className="text-xs" onClick={onOpenCulturalAnalysis}>
                <Sparkles className="h-3 w-3 mr-1" />
                Analyze & Create Variants
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        {entityJobs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Activity</h3>
            <div className="space-y-1">
              {entityJobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs"
                >
                  <span>{SUPPORTED_LANGUAGES.find(l => l.code === job.target_language)?.name || job.target_language}</span>
                  <Badge
                    variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'failed' ? 'destructive' :
                      'secondary'
                    }
                    className="text-[10px]"
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default LocalizationSidebarTab;
