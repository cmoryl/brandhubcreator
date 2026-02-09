/**
 * GlobalLinkConfigPanel - Configuration settings for GlobalLink integration
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Settings, ExternalLink, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLocalization } from '@/hooks/useLocalization';
import { toast } from 'sonner';

export const GlobalLinkConfigPanel: React.FC = () => {
  const { organization } = useOrganization();
  const { config, updateConfig, isLoading } = useLocalization(organization?.id);
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [testingConnection, setTestingConnection] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    api_mode: config?.api_mode || 'demo',
    api_endpoint: config?.api_endpoint || '',
    api_key: '',
    project_key: config?.project_key || '',
    default_service: config?.default_service || 'mt',
    auto_translate_new_content: config?.auto_translate_new_content || false,
    preserve_formatting: config?.preserve_formatting ?? true,
    glossary_enabled: config?.glossary_enabled || false,
  });

  React.useEffect(() => {
    if (config) {
      setFormData(prev => ({
        ...prev,
        api_mode: config.api_mode,
        api_endpoint: config.api_endpoint || '',
        project_key: config.project_key || '',
        default_service: config.default_service || 'mt',
        auto_translate_new_content: config.auto_translate_new_content,
        preserve_formatting: config.preserve_formatting,
        glossary_enabled: config.glossary_enabled,
        // Don't overwrite api_key if user has entered something - it's masked in DB
      }));
    }
  }, [config]);

  const hasApiKeyConfigured = config?.api_key && config.api_key.length > 0;

  const handleSave = () => {
    // Only include api_key if user entered a new one
    const dataToSave = {
      ...formData,
      api_key: formData.api_key || undefined,
    };
    updateConfig.mutate(dataToSave);
    // Clear the api_key field after save for security
    setFormData(prev => ({ ...prev, api_key: '' }));
  };

  const testConnection = async () => {
    if (!formData.project_key && !config?.project_key) {
      toast.error('Please enter a Project Key first');
      return;
    }
    
    setTestingConnection(true);
    try {
      // Simple test translation request
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/globallink-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          organization_id: organization?.id,
          source_language: 'en_US',
          target_language: 'es_ES',
          content: 'Hello, this is a test.',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Connection successful! Translation API is working.');
      } else {
        toast.error(data.error || 'Connection test failed');
      }
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure your GlobalLink API connection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Mode</Label>
            <Select
              value={formData.api_mode}
              onValueChange={(value: 'demo' | 'live') => 
                setFormData(prev => ({ ...prev, api_mode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Demo</Badge>
                    <span>Simulated translations for testing</span>
                  </div>
                </SelectItem>
                <SelectItem value="live">
                  <div className="flex items-center gap-2">
                    <Badge>Live</Badge>
                    <span>Real GlobalLink Web API</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.api_mode === 'demo' 
                ? 'Demo mode adds language markers to content without actual translation.'
                : 'Live mode requires valid GlobalLink API credentials.'}
            </p>
          </div>

          {formData.api_mode === 'live' && (
            <>
              <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">GlobalLink API Credentials</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your GlobalLink credentials below. They will be securely stored and used for live translations.
                    </p>
                    <Button variant="link" className="h-auto p-0 text-xs" asChild>
                      <a 
                        href="https://globallink.transperfect.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Get API credentials from TransPerfect
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder={hasApiKeyConfigured ? '••••••••••••••••' : 'Enter your GlobalLink API Key'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {hasApiKeyConfigured && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    API Key configured. Enter a new value to update.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project Key</Label>
                <Input
                  value={formData.project_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_key: e.target.value }))}
                  placeholder="Enter your GlobalLink Project Key"
                />
                <p className="text-xs text-muted-foreground">
                  Your GlobalLink project identifier for translation services
                </p>
              </div>

              <div className="space-y-2">
                <Label>API Endpoint (Optional)</Label>
                <Input
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                  placeholder="https://www.onelink-edge.com/xapis/TX"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the default GlobalLink Web API endpoint
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={testingConnection}
                className="w-full"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </>
          )}

          <div className="space-y-2">
            <Label>Default Translation Service</Label>
            <Select
              value={formData.default_service}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, default_service: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mt">Machine Translation (Neural)</SelectItem>
                <SelectItem value="ht">Human Translation</SelectItem>
                <SelectItem value="hybrid">Hybrid (MT + Post-Edit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Translation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Settings</CardTitle>
          <CardDescription>
            Configure how content is translated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-translate New Content</Label>
              <p className="text-xs text-muted-foreground">
                Automatically queue new content for translation
              </p>
            </div>
            <Switch
              checked={formData.auto_translate_new_content}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, auto_translate_new_content: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Preserve Formatting</Label>
              <p className="text-xs text-muted-foreground">
                Maintain HTML tags and markdown during translation
              </p>
            </div>
            <Switch
              checked={formData.preserve_formatting}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, preserve_formatting: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label>Glossary Integration</Label>
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Enterprise
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Use brand-specific terminology glossaries
              </p>
            </div>
            <Switch
              checked={formData.glossary_enabled}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, glossary_enabled: checked }))
              }
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {formData.api_mode === 'demo' ? (
              <>
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <div>
                  <p className="font-medium">Demo Mode Active</p>
                  <p className="text-xs text-muted-foreground">
                    Translations will be simulated with language markers
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Ready for Live Translations</p>
                  <p className="text-xs text-muted-foreground">
                    Ensure API secrets are configured in Cloud settings
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};

export default GlobalLinkConfigPanel;
