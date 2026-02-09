/**
 * DataForce Settings Panel
 * Admin configuration for DataForce integration services
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Bot, 
  Users, 
  Sparkles, 
  Save,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DataForceConfig {
  id?: string;
  api_key?: string;
  api_endpoint: string;
  api_mode: 'demo' | 'live';
  compliance_ai_enabled: boolean;
  brand_assistant_enabled: boolean;
  cultural_validation_enabled: boolean;
  genai_training_enabled: boolean;
  compliance_model_id?: string;
  compliance_auto_scan: boolean;
  compliance_threshold: number;
  assistant_model_id?: string;
  assistant_languages: string[];
  assistant_persona?: string;
  validation_panel_size: number;
  validation_regions?: string[];
  validation_auto_request: boolean;
  training_model_base: string;
  training_voice_samples: number;
  training_last_sync_at?: string;
}

const defaultConfig: DataForceConfig = {
  api_endpoint: 'https://api.dataforce.ai/v1',
  api_mode: 'demo',
  compliance_ai_enabled: true,
  brand_assistant_enabled: true,
  cultural_validation_enabled: true,
  genai_training_enabled: true,
  compliance_auto_scan: false,
  compliance_threshold: 0.8,
  assistant_languages: ['en_US'],
  validation_panel_size: 10,
  validation_auto_request: false,
  training_model_base: 'gemini-2.5-flash',
  training_voice_samples: 0,
};

export const DataForceSettings = () => {
  const { organization } = useOrganization();
  const [config, setConfig] = useState<DataForceConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchConfig();
    }
  }, [organization?.id]);

  const fetchConfig = async () => {
    if (!organization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('dataforce_config')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching DataForce config:', error);
      }

      if (data) {
        setConfig({
          ...defaultConfig,
          ...data,
          api_mode: (data.api_mode as 'demo' | 'live') || 'demo',
        });
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!organization?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('dataforce_config')
        .upsert({
          ...config,
          organization_id: organization.id,
        }, {
          onConflict: 'organization_id'
        });

      if (error) throw error;
      toast.success('DataForce settings saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <img 
              src="https://www.transperfect.com/sites/default/files/dataforce-logo.svg" 
              alt="DataForce" 
              className="h-6"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            DataForce Integration
          </h2>
          <p className="text-muted-foreground">
            AI-powered brand compliance, assistance, and training services
          </p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* API Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            API Configuration
            <Badge variant={config.api_mode === 'live' ? 'default' : 'secondary'}>
              {config.api_mode === 'live' ? 'Live Mode' : 'Demo Mode'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure your DataForce API connection. Demo mode provides simulated responses for testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Mode Info */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              {config.api_mode === 'demo' ? (
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {config.api_mode === 'demo' ? 'Demo Mode Active' : 'Live Mode Active'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.api_mode === 'demo' 
                    ? 'All DataForce services work with simulated responses. Brand Assistant and Compliance AI use built-in AI when available. Toggle to Live mode and add your DataForce API key for production services.'
                    : 'Connected to DataForce production API. All services use your configured API key.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Live API</Label>
              <p className="text-sm text-muted-foreground">
                Switch to live mode when you have a DataForce API key
              </p>
            </div>
            <Switch
              checked={config.api_mode === 'live'}
              onCheckedChange={(checked) => 
                setConfig({ ...config, api_mode: checked ? 'live' : 'demo' })
              }
            />
          </div>

          {config.api_mode === 'live' && (
            <>
              <div className="space-y-2">
                <Label>API Key (Optional)</Label>
                <Input
                  type="password"
                  placeholder="Enter your DataForce API key when ready"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to continue using built-in AI capabilities. Add key for full DataForce API access.
                </p>
              </div>
              <div className="space-y-2">
                <Label>API Endpoint</Label>
                <Input
                  value={config.api_endpoint}
                  onChange={(e) => setConfig({ ...config, api_endpoint: e.target.value })}
                />
              </div>
            </>
          )}

          <a 
            href="https://www.dataforce.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            Get a DataForce API key <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </CardContent>
      </Card>

      {/* Service Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Compliance AI</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Brand Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Validation</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">GenAI Training</span>
          </TabsTrigger>
        </TabsList>

        {/* Compliance AI Settings */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Brand Compliance AI
                  </CardTitle>
                  <CardDescription>
                    Automated brand guideline compliance checking
                  </CardDescription>
                </div>
                <Switch
                  checked={config.compliance_ai_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, compliance_ai_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {config.compliance_ai_enabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Scan on Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically run compliance checks when brand assets change
                    </p>
                  </div>
                  <Switch
                    checked={config.compliance_auto_scan}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, compliance_auto_scan: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Compliance Threshold: {Math.round(config.compliance_threshold * 100)}%</Label>
                  <Slider
                    value={[config.compliance_threshold * 100]}
                    onValueChange={([value]) => 
                      setConfig({ ...config, compliance_threshold: value / 100 })
                    }
                    min={50}
                    max={100}
                    step={5}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum score required to pass compliance checks
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Brand Assistant Settings */}
        <TabsContent value="assistant">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-green-500" />
                    AI Brand Assistant
                  </CardTitle>
                  <CardDescription>
                    Multilingual chatbot for brand questions
                  </CardDescription>
                </div>
                <Switch
                  checked={config.brand_assistant_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, brand_assistant_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {config.brand_assistant_enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assistant Persona</Label>
                  <Textarea
                    placeholder="Define the assistant's personality and behavior..."
                    value={config.assistant_persona || ''}
                    onChange={(e) => setConfig({ ...config, assistant_persona: e.target.value })}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Custom instructions for how the assistant should behave
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Supported Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {['en_US', 'es_ES', 'fr_FR', 'de_DE', 'ja_JP', 'zh_CN', 'pt_BR'].map((lang) => (
                      <Badge
                        key={lang}
                        variant={config.assistant_languages.includes(lang) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const langs = config.assistant_languages.includes(lang)
                            ? config.assistant_languages.filter(l => l !== lang)
                            : [...config.assistant_languages, lang];
                          setConfig({ ...config, assistant_languages: langs });
                        }}
                      >
                        {lang.split('_')[0].toUpperCase()}
                        {config.assistant_languages.includes(lang) && (
                          <CheckCircle className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Cultural Validation Settings */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Cultural Validation Panel
                  </CardTitle>
                  <CardDescription>
                    Human validation of brand content across regions
                  </CardDescription>
                </div>
                <Switch
                  checked={config.cultural_validation_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, cultural_validation_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {config.cultural_validation_enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Panel Size: {config.validation_panel_size} reviewers</Label>
                  <Slider
                    value={[config.validation_panel_size]}
                    onValueChange={([value]) => 
                      setConfig({ ...config, validation_panel_size: value })
                    }
                    min={5}
                    max={50}
                    step={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Request Validation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically request validation for new regional variants
                    </p>
                  </div>
                  <Switch
                    checked={config.validation_auto_request}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, validation_auto_request: checked })
                    }
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* GenAI Training Settings */}
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    GenAI Brand Training
                  </CardTitle>
                  <CardDescription>
                    Train AI models on your brand voice and style
                  </CardDescription>
                </div>
                <Switch
                  checked={config.genai_training_enabled}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, genai_training_enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {config.genai_training_enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Base Model</Label>
                  <div className="flex gap-2">
                    {['gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-5-mini'].map((model) => (
                      <Badge
                        key={model}
                        variant={config.training_model_base === model ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setConfig({ ...config, training_model_base: model })}
                      >
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Training Samples Collected</span>
                    <span className="font-mono">{config.training_voice_samples}</span>
                  </div>
                  {config.training_last_sync_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Sync</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(config.training_last_sync_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
