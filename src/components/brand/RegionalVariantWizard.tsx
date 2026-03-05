/**
 * RegionalVariantWizard - Step-by-step wizard for creating localized brand variants
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Globe2, MapPin, Languages, Palette, Type, Image, MessageSquare, 
  ArrowRight, ArrowLeft, Check, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRegionalBranding } from '@/hooks/useRegionalBranding';

interface RegionalVariantWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string;
  onComplete?: () => void;
}

interface VariantFormData {
  variantLevel: 'region' | 'country' | 'language';
  variantCode: string;
  regionName: string;
  
  // Overrides to include
  includeColors: boolean;
  includeTypography: boolean;
  includeLogos: boolean;
  includeMessaging: boolean;
  includeImagery: boolean;
  includeVoice: boolean;
  
  // Cultural adaptations
  culturalNotes: string;
  adaptationNotes: string;
  
  // AI assistance
  useAiAdaptation: boolean;
}

const STEPS = [
  { id: 'region', title: 'Select Region', icon: MapPin },
  { id: 'overrides', title: 'Choose Overrides', icon: Palette },
  { id: 'cultural', title: 'Cultural Notes', icon: Globe2 },
  { id: 'review', title: 'Review & Create', icon: Check },
];

const REGIONS = [
  { code: 'APAC', name: 'Asia Pacific' },
  { code: 'EMEA', name: 'Europe, Middle East & Africa' },
  { code: 'LATAM', name: 'Latin America' },
  { code: 'NA', name: 'North America' },
  { code: 'ANZ', name: 'Australia & New Zealand' },
  { code: 'MENA', name: 'Middle East & North Africa' },
  { code: 'SEA', name: 'Southeast Asia' },
  { code: 'DACH', name: 'Germany, Austria, Switzerland' },
  { code: 'NORDICS', name: 'Nordic Countries' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', region: 'NA' },
  { code: 'UK', name: 'United Kingdom', region: 'EMEA' },
  { code: 'DE', name: 'Germany', region: 'EMEA' },
  { code: 'FR', name: 'France', region: 'EMEA' },
  { code: 'JP', name: 'Japan', region: 'APAC' },
  { code: 'CN', name: 'China', region: 'APAC' },
  { code: 'BR', name: 'Brazil', region: 'LATAM' },
  { code: 'MX', name: 'Mexico', region: 'LATAM' },
  { code: 'AU', name: 'Australia', region: 'ANZ' },
  { code: 'IN', name: 'India', region: 'APAC' },
  { code: 'AE', name: 'UAE', region: 'MENA' },
  { code: 'SA', name: 'Saudi Arabia', region: 'MENA' },
  { code: 'SG', name: 'Singapore', region: 'SEA' },
  { code: 'KR', name: 'South Korea', region: 'APAC' },
];

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'hi-IN', name: 'Hindi' },
];

export const RegionalVariantWizard = ({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  organizationId,
  onComplete
}: RegionalVariantWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [formData, setFormData] = useState<VariantFormData>({
    variantLevel: 'region',
    variantCode: '',
    regionName: '',
    includeColors: true,
    includeTypography: true,
    includeLogos: true,
    includeMessaging: true,
    includeImagery: false,
    includeVoice: true,
    culturalNotes: '',
    adaptationNotes: '',
    useAiAdaptation: false,
  });

  const updateFormData = (updates: Partial<VariantFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const getOptions = () => {
    switch (formData.variantLevel) {
      case 'region':
        return REGIONS.map(r => ({ value: r.code, label: r.name }));
      case 'country':
        return COUNTRIES.map(c => ({ value: c.code, label: c.name }));
      case 'language':
        return LANGUAGES.map(l => ({ value: l.code, label: l.name }));
      default:
        return [];
    }
  };

  const generateAICulturalNotes = async () => {
    if (!formData.variantCode) {
      toast.error('Please select a region first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('globallink-cultural-adapt', {
        body: {
          organization_id: organizationId,
          entity_id: entityId,
          entity_type: entityType,
          entity_name: entityName,
          target_region: formData.variantCode,
          target_country: formData.variantLevel === 'country' ? formData.variantCode : undefined,
          variant_level: formData.variantLevel,
          region_name: formData.regionName,
        }
      });

      if (error) throw error;

      if (data?.success && data?.suggestions?.length > 0) {
        // Extract cultural notes from all suggestion sections
        const notesBySection = data.suggestions.reduce((acc: Record<string, string[]>, s: { section: string; reason: string; suggested_value: unknown }) => {
          const section = s.section || 'general';
          if (!acc[section]) acc[section] = [];
          if (s.reason) acc[section].push(s.reason);
          return acc;
        }, {} as Record<string, string[]>);

        const culturalNotes = Object.entries(notesBySection)
          .map(([section, notes]) => {
            const label = section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return `**${label}:**\n${(notes as string[]).join('\n')}`;
          })
          .join('\n\n');
        
        const adaptationSummary = data.adaptation_summary 
          ? data.adaptation_summary 
          : `Target locale: ${data.locale_name || formData.variantCode}`;

        updateFormData({
          culturalNotes: culturalNotes || `Cultural insights for ${data.locale_name || formData.variantCode}`,
          adaptationNotes: adaptationSummary,
        });
        toast.success('AI cultural insights generated');
      } else {
        toast.info('No specific cultural adaptations found for this region');
      }
    } catch (err) {
      console.error('Failed to generate cultural notes:', err);
      toast.error('Failed to generate cultural insights');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const createVariant = async () => {
    if (!formData.variantCode) {
      toast.error('Please select a target region/country/language');
      return;
    }

    setIsCreating(true);
    try {
      const variantData = {
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId,
        variant_level: formData.variantLevel,
        variant_code: formData.variantCode,
        translation_status: 'draft',
        cultural_adaptations: {
          notes: formData.culturalNotes,
          adaptation_notes: formData.adaptationNotes,
        },
        colors_override: formData.includeColors ? {} : null,
        typography_override: formData.includeTypography ? {} : null,
        logos_override: formData.includeLogos ? {} : null,
        messaging_override: formData.includeMessaging ? {} : null,
        imagery_override: formData.includeImagery ? {} : null,
        voice_override: formData.includeVoice ? {} : null,
        adaptation_notes: formData.adaptationNotes,
      };

      const { data, error } = await supabase
        .from('brand_regional_variants')
        .insert(variantData)
        .select()
        .single();

      if (error) throw error;

      toast.success(`${formData.regionName} variant created successfully`);
      onComplete?.();
      onOpenChange(false);
      
      // Reset form
      setCurrentStep(0);
      setFormData({
        variantLevel: 'region',
        variantCode: '',
        regionName: '',
        includeColors: true,
        includeTypography: true,
        includeLogos: true,
        includeMessaging: true,
        includeImagery: false,
        includeVoice: true,
        culturalNotes: '',
        adaptationNotes: '',
        useAiAdaptation: false,
      });
    } catch (err) {
      console.error('Failed to create variant:', err);
      toast.error('Failed to create regional variant');
    } finally {
      setIsCreating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.variantCode && formData.regionName;
      case 1:
        return formData.includeColors || formData.includeTypography || 
               formData.includeLogos || formData.includeMessaging || 
               formData.includeImagery || formData.includeVoice;
      case 2:
        return true; // Cultural notes are optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      createVariant();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" />
            Create Regional Variant
          </DialogTitle>
          <DialogDescription>
            Create a localized version of {entityName} for a specific region, country, or language
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    isActive && "text-primary font-medium",
                    isComplete && "text-green-600",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isActive && "border-primary bg-primary/10",
                    isComplete && "border-green-600 bg-green-600 text-white",
                    !isActive && !isComplete && "border-muted-foreground/30"
                  )}>
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {/* Step 1: Region Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Variant Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['region', 'country', 'language'] as const).map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={formData.variantLevel === level ? 'default' : 'outline'}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      onClick={() => updateFormData({ variantLevel: level, variantCode: '', regionName: '' })}
                    >
                      {level === 'region' && <MapPin className="h-5 w-5" />}
                      {level === 'country' && <Globe2 className="h-5 w-5" />}
                      {level === 'language' && <Languages className="h-5 w-5" />}
                      <span className="capitalize">{level}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Select {formData.variantLevel}</Label>
                <Select
                  value={formData.variantCode}
                  onValueChange={(value) => {
                    const options = getOptions();
                    const selected = options.find(o => o.value === value);
                    updateFormData({ variantCode: value, regionName: selected?.label || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${formData.variantLevel}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.variantCode && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <p className="text-sm">
                      You're creating a <strong>{formData.variantLevel}</strong> variant for{' '}
                      <Badge variant="secondary">{formData.regionName}</Badge>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Override Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select which brand elements should be customizable for {formData.regionName}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'includeColors', label: 'Color Palette', icon: Palette, desc: 'Adapt colors for cultural preferences' },
                  { key: 'includeTypography', label: 'Typography', icon: Type, desc: 'Local font and text styling' },
                  { key: 'includeLogos', label: 'Logos', icon: Image, desc: 'Region-specific logo variations' },
                  { key: 'includeMessaging', label: 'Messaging', icon: MessageSquare, desc: 'Taglines, slogans, copy' },
                  { key: 'includeImagery', label: 'Imagery', icon: Image, desc: 'Culturally appropriate visuals' },
                  { key: 'includeVoice', label: 'Brand Voice', icon: MessageSquare, desc: 'Tone and communication style' },
                ].map(({ key, label, icon: Icon, desc }) => (
                  <Card 
                    key={key}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      formData[key as keyof VariantFormData] && "border-primary bg-primary/5"
                    )}
                    onClick={() => updateFormData({ [key]: !formData[key as keyof VariantFormData] } as any)}
                  >
                    <CardContent className="pt-4 flex items-start gap-3">
                      <Checkbox 
                        checked={formData[key as keyof VariantFormData] as boolean}
                        onCheckedChange={(checked) => updateFormData({ [key]: checked } as any)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Cultural Notes */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Add cultural considerations for {formData.regionName}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAICulturalNotes}
                  disabled={isGeneratingAI}
                  className="gap-2"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate with AI
                </Button>
              </div>

              <div className="space-y-3">
                <Label htmlFor="culturalNotes">Cultural Considerations</Label>
                <Textarea
                  id="culturalNotes"
                  value={formData.culturalNotes}
                  onChange={(e) => updateFormData({ culturalNotes: e.target.value })}
                  placeholder="E.g., color symbolism, imagery preferences, communication norms..."
                  rows={4}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="adaptationNotes">Adaptation Notes</Label>
                <Textarea
                  id="adaptationNotes"
                  value={formData.adaptationNotes}
                  onChange={(e) => updateFormData({ adaptationNotes: e.target.value })}
                  placeholder="Specific changes needed for this market..."
                  rows={3}
                />
              </div>

              <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="pt-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Cultural Sensitivity</p>
                    <p className="text-amber-600/80 dark:text-amber-400/70 mt-1">
                      Consider consulting local experts or using AI-powered cultural adaptation 
                      tools for accurate regional branding.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Variant Type</span>
                    <Badge variant="secondary" className="capitalize">{formData.variantLevel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <Badge>{formData.regionName}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overrides</span>
                    <div className="flex flex-wrap gap-1">
                      {formData.includeColors && <Badge variant="outline" className="text-xs">Colors</Badge>}
                      {formData.includeTypography && <Badge variant="outline" className="text-xs">Typography</Badge>}
                      {formData.includeLogos && <Badge variant="outline" className="text-xs">Logos</Badge>}
                      {formData.includeMessaging && <Badge variant="outline" className="text-xs">Messaging</Badge>}
                      {formData.includeImagery && <Badge variant="outline" className="text-xs">Imagery</Badge>}
                      {formData.includeVoice && <Badge variant="outline" className="text-xs">Voice</Badge>}
                    </div>
                  </div>
                  {formData.culturalNotes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Cultural Notes</span>
                      <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{formData.culturalNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-700 dark:text-green-400">Ready to Create</p>
                    <p className="text-green-600/80 dark:text-green-400/70 mt-1">
                      This variant will be created as a draft. You can customize each override 
                      section in the brand editor afterward.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : currentStep === STEPS.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Variant
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
