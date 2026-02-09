/**
 * GlobalLinkWorkflowTrigger - UI for triggering translation workflows
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Zap,
  Globe2,
  Clock,
  Languages,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  estimated_time: string;
  steps: string[];
}

interface TargetLanguage {
  language_code: string;
  language_name: string;
  is_active: boolean;
}

interface GlobalLinkWorkflowTriggerProps {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId: string;
  onWorkflowStarted?: () => void;
}

export const GlobalLinkWorkflowTrigger: React.FC<GlobalLinkWorkflowTriggerProps> = ({
  entityId,
  entityType,
  entityName,
  organizationId,
  onWorkflowStarted,
}) => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [languages, setLanguages] = useState<TargetLanguage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('quick-translate');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<{
    success: boolean;
    jobs_created: number;
    template: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, organizationId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch workflow templates
      const { data: templateData } = await supabase.functions.invoke('globallink-connect-workflow', {
        body: { action: 'list_templates', organization_id: organizationId },
      });

      if (templateData?.templates) {
        setTemplates(templateData.templates);
      }

      // Fetch target languages
      const { data: langData } = await supabase
        .from('localization_target_languages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('display_order');

      if (langData) {
        setLanguages(langData);
        // Select all by default
        setSelectedLanguages(langData.map(l => l.language_code));
      }
    } catch (error) {
      console.error('Failed to fetch workflow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerWorkflow = async () => {
    if (selectedLanguages.length === 0) {
      toast.error('Please select at least one target language');
      return;
    }

    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('globallink-connect-workflow', {
        body: {
          action: 'trigger',
          organization_id: organizationId,
          entity_type: entityType,
          entity_id: entityId,
          workflow_template: selectedTemplate,
          target_languages: selectedLanguages,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setWorkflowResult({
          success: true,
          jobs_created: data.jobs_created,
          template: data.template,
        });
        toast.success(`Workflow started: ${data.jobs_created} translation jobs created`);
        onWorkflowStarted?.();
      } else {
        throw new Error(data?.error || 'Failed to trigger workflow');
      }
    } catch (error) {
      console.error('Workflow trigger error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start workflow');
    } finally {
      setIsTriggering(false);
    }
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleAllLanguages = () => {
    if (selectedLanguages.length === languages.length) {
      setSelectedLanguages([]);
    } else {
      setSelectedLanguages(languages.map(l => l.language_code));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          Start Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            GlobalLink Connect Workflow
          </DialogTitle>
          <DialogDescription>
            Automate translation for {entityName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workflowResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Workflow Started</h3>
              <p className="text-muted-foreground">
                {workflowResult.jobs_created} translation jobs created using {workflowResult.template}
              </p>
            </div>
            <Button onClick={() => { setOpen(false); setWorkflowResult(null); }}>
              Done
            </Button>
          </div>
        ) : languages.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Target Languages</h3>
              <p className="text-muted-foreground">
                Please configure target languages in GlobalLink settings first.
              </p>
            </div>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Workflow Template</Label>
              <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((template) => (
                    <Label
                      key={template.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={template.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {template.estimated_time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {template.steps.map((step, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {step}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Language Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Target Languages</Label>
                <Button variant="ghost" size="sm" onClick={toggleAllLanguages}>
                  {selectedLanguages.length === languages.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-[180px] border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <Label
                      key={lang.language_code}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                        selectedLanguages.includes(lang.language_code)
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selectedLanguages.includes(lang.language_code)}
                        onCheckedChange={() => toggleLanguage(lang.language_code)}
                      />
                      <span className="text-sm">{lang.language_name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {lang.language_code}
                      </Badge>
                    </Label>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedLanguages.length} of {languages.length} languages selected
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={triggerWorkflow}
                disabled={isTriggering || selectedLanguages.length === 0}
                className="gap-2"
              >
                {isTriggering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalLinkWorkflowTrigger;
