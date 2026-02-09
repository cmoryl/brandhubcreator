/**
 * DataForce GenAI Training Component
 * Train AI models on brand voice and generate branded content
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Brain, 
  Sparkles,
  Loader2,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  Wand2,
  Mic,
  Palette,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useGenAITraining } from '@/hooks/dataforce';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface GenAITrainingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
}

const CONTENT_TYPES = [
  { value: 'tagline', label: 'Tagline', icon: Sparkles },
  { value: 'description', label: 'Brand Description', icon: FileText },
  { value: 'social_post', label: 'Social Media Post', icon: Mic },
  { value: 'email', label: 'Email Introduction', icon: FileText },
  { value: 'blog', label: 'Blog Introduction', icon: FileText },
];

const TRAINING_TYPES = [
  { 
    value: 'voice' as const, 
    label: 'Brand Voice', 
    icon: Mic,
    description: 'Train on tone, personality, and messaging style'
  },
  { 
    value: 'visual' as const, 
    label: 'Visual Style', 
    icon: Palette,
    description: 'Learn color, typography, and design patterns'
  },
  { 
    value: 'content' as const, 
    label: 'Content Patterns', 
    icon: FileText,
    description: 'Understand content structure and themes'
  },
];

export const GenAITraining = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName
}: GenAITrainingProps) => {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'train' | 'generate'>('generate');
  const [selectedTrainingType, setSelectedTrainingType] = useState<'voice' | 'visual' | 'content'>('voice');
  const [contentType, setContentType] = useState('tagline');
  const [prompt, setPrompt] = useState('');

  const {
    isTraining,
    isGenerating,
    activeJob,
    recentJobs,
    generatedContent,
    isPolling,
    startTraining,
    generateContent,
    fetchHistory,
    clearActiveJob,
    clearGeneratedContent,
  } = useGenAITraining({
    organizationId: organization?.id || '',
    entityType,
    entityId,
  });

  useEffect(() => {
    if (open && organization?.id) {
      fetchHistory();
    }
  }, [open, organization?.id, fetchHistory]);

  const handleStartTraining = async () => {
    await startTraining(selectedTrainingType);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    await generateContent(prompt, contentType);
  };

  const copyToClipboard = () => {
    if (generatedContent?.content) {
      navigator.clipboard.writeText(generatedContent.content);
      toast.success('Copied to clipboard');
    }
  };

  const getTrainingProgress = () => {
    if (!activeJob) return 0;
    return (activeJob.samplesCollected / activeJob.samplesTarget) * 100;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            GenAI Brand Training
          </SheetTitle>
          <SheetDescription>
            Train AI on {entityName}'s brand voice and generate content
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'train' | 'generate')} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="train" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Train Model
            </TabsTrigger>
          </TabsList>

          {/* Generate Content Tab */}
          <TabsContent value="generate" className="space-y-4 mt-4">
            {/* Content Type Selection */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe what you want to create for ${entityName}...`}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                The AI will use {entityName}'s brand voice and guidelines
              </p>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>

            {/* Generated Content */}
            {generatedContent && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Generated Content</CardTitle>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={clearGeneratedContent}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {CONTENT_TYPES.find(t => t.value === generatedContent.contentType)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{generatedContent.content}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Prompts */}
            {!generatedContent && !isGenerating && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    `Create a memorable tagline for ${entityName}`,
                    `Write a professional about section for ${entityName}`,
                    `Generate a social media announcement for ${entityName}'s new feature`,
                  ].map((quickPrompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setPrompt(quickPrompt)}
                    >
                      {quickPrompt}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Train Model Tab */}
          <TabsContent value="train" className="space-y-4 mt-4">
            {!activeJob ? (
              <>
                {/* Training Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Training Type</Label>
                  <div className="grid gap-3">
                    {TRAINING_TYPES.map(type => (
                      <div
                        key={type.value}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTrainingType === type.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTrainingType(type.value)}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedTrainingType === type.value 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted'
                        }`}>
                          <type.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Start Training Button */}
                <Button
                  onClick={handleStartTraining}
                  disabled={isTraining}
                  className="w-full"
                  size="lg"
                >
                  {isTraining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Training...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Start Training
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* Active Training Job */
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {activeJob.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      Training {activeJob.trainingType}
                    </CardTitle>
                    {activeJob.isDemo && (
                      <Badge variant="secondary">Demo</Badge>
                    )}
                  </div>
                  <CardDescription className="capitalize">
                    Status: {activeJob.status}
                    {isPolling && ' (polling for updates...)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Samples Collected</span>
                      <span>{activeJob.samplesCollected} / {activeJob.samplesTarget}</span>
                    </div>
                    <Progress value={getTrainingProgress()} className="h-2" />
                  </div>

                  {/* Metrics (if completed) */}
                  {activeJob.metrics && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="text-lg font-semibold">
                          {(activeJob.metrics.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Brand Alignment</p>
                        <p className="text-lg font-semibold">
                          {(activeJob.metrics.brandAlignmentScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Validation</p>
                        <p className="text-lg font-semibold">
                          {(activeJob.metrics.validationScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Sample Usage</p>
                        <p className="text-lg font-semibold">
                          {(activeJob.metrics.sampleUtilization * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {activeJob.status === 'completed' && (
                    <Button
                      onClick={clearActiveJob}
                      variant="outline"
                      className="w-full"
                    >
                      Train New Model
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Jobs */}
            {recentJobs.length > 0 && !activeJob && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Training Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentJobs.slice(0, 5).map(job => (
                    <div 
                      key={job.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {job.trainingType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge 
                        variant={job.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
