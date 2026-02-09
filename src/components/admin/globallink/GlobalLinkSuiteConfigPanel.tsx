/**
 * GlobalLinkSuiteConfigPanel - Configure all GlobalLink products
 * Translation, AI, Connect, and Fluent
 */

import React from 'react';
import { Languages, Brain, GitBranch, Edit3, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRegionalBranding } from '@/hooks/useRegionalBranding';

export const GlobalLinkSuiteConfigPanel: React.FC = () => {
  const { organization } = useOrganization();
  const { glProductConfig, updateGLProductConfig, isLoading } = useRegionalBranding(organization?.id);

  const config = glProductConfig || {
    translation_enabled: true,
    ai_enabled: false,
    ai_model: 'standard',
    ai_cultural_adaptation: true,
    ai_content_optimization: false,
    connect_enabled: false,
    connect_project_id: null,
    connect_workflow_template: null,
    fluent_enabled: false,
    fluent_embed_key: null,
  };

  const handleUpdate = (updates: Record<string, unknown>) => {
    updateGLProductConfig.mutate(updates);
  };

  return (
    <div className="space-y-6">
      {/* Translation - GlobalLink Web API */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Languages className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                Translation
                <Badge variant="secondary" className="text-[10px]">Web API</Badge>
              </CardTitle>
              <CardDescription>
                GlobalLink Web API for real-time content translation
              </CardDescription>
            </div>
            <Switch
              checked={config.translation_enabled}
              onCheckedChange={(checked) => handleUpdate({ translation_enabled: checked })}
            />
          </div>
        </CardHeader>
        {config.translation_enabled && (
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Translation service is active</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI - Cultural Adaptation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                GlobalLink AI
                <Badge variant="outline" className="text-[10px]">Beta</Badge>
              </CardTitle>
              <CardDescription>
                AI-powered cultural adaptation and content optimization
              </CardDescription>
            </div>
            <Switch
              checked={config.ai_enabled}
              onCheckedChange={(checked) => handleUpdate({ ai_enabled: checked })}
            />
          </div>
        </CardHeader>
        {config.ai_enabled && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  value={config.ai_model}
                  onValueChange={(v) => handleUpdate({ ai_model: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Cultural Adaptation</Label>
                  <p className="text-xs text-muted-foreground">
                    Suggest culturally appropriate modifications
                  </p>
                </div>
                <Switch
                  checked={config.ai_cultural_adaptation}
                  onCheckedChange={(checked) => handleUpdate({ ai_cultural_adaptation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Content Optimization</Label>
                  <p className="text-xs text-muted-foreground">
                    Optimize content for local markets
                  </p>
                </div>
                <Switch
                  checked={config.ai_content_optimization}
                  onCheckedChange={(checked) => handleUpdate({ ai_content_optimization: checked })}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Connect - Workflow Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <GitBranch className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">GlobalLink Connect</CardTitle>
              <CardDescription>
                Translation workflow management and project tracking
              </CardDescription>
            </div>
            <Switch
              checked={config.connect_enabled}
              onCheckedChange={(checked) => handleUpdate({ connect_enabled: checked })}
            />
          </div>
        </CardHeader>
        {config.connect_enabled && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Project ID</Label>
                <Input
                  value={config.connect_project_id || ''}
                  onChange={(e) => handleUpdate({ connect_project_id: e.target.value })}
                  placeholder="Enter GlobalLink Connect project ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Workflow Template</Label>
                <Select
                  value={config.connect_workflow_template || ''}
                  onValueChange={(v) => handleUpdate({ connect_workflow_template: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Translation</SelectItem>
                    <SelectItem value="review">Translation + Review</SelectItem>
                    <SelectItem value="approval">Translation + Review + Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Fluent - In-Context Editing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Edit3 className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">GlobalLink Fluent</CardTitle>
              <CardDescription>
                In-context editing for translators and reviewers
              </CardDescription>
            </div>
            <Switch
              checked={config.fluent_enabled}
              onCheckedChange={(checked) => handleUpdate({ fluent_enabled: checked })}
            />
          </div>
        </CardHeader>
        {config.fluent_enabled && (
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label>Embed Key</Label>
              <Input
                value={config.fluent_embed_key || ''}
                onChange={(e) => handleUpdate({ fluent_embed_key: e.target.value })}
                placeholder="Enter Fluent embed key"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Enables translators to edit content directly in the brand guide preview
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default GlobalLinkSuiteConfigPanel;
