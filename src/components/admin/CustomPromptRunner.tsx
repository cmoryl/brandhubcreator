import { useState, useRef } from 'react';
import { Sparkles, Send, Save, Loader2, BookmarkPlus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSavedPrompts, SavedPrompt } from '@/hooks/useSavedPrompts';

interface BrandReportData {
  id: string;
  name: string;
}

interface CustomPromptRunnerProps {
  brands: BrandReportData[];
}

export function CustomPromptRunner({ brands }: CustomPromptRunnerProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('general');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { prompts, isLoading: promptsLoading, savePrompt, deletePrompt } = useSavedPrompts();

  const runPrompt = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      toast.error('Prompt must be at least 10 characters');
      return;
    }

    setIsRunning(true);
    setResponse('');
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-brand-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            brandIds: brands.map(b => b.id),
            includeProducts: true,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setResponse(prev => prev + content);
            }
          } catch {
            // Incomplete JSON, will be handled in next chunk
          }
        }
      }

      toast.success('Analysis complete');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('Request cancelled');
      } else {
        console.error('Prompt error:', error);
        toast.error((error as Error).message || 'Failed to run prompt');
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSavePrompt = async () => {
    if (!newPromptName.trim()) {
      toast.error('Please enter a name for the prompt');
      return;
    }

    const result = await savePrompt(newPromptName, prompt, newPromptCategory);
    if (result) {
      setIsSaveDialogOpen(false);
      setNewPromptName('');
      setNewPromptCategory('general');
    }
  };

  const handleSelectTemplate = (template: SavedPrompt) => {
    setPrompt(template.prompt);
    setIsTemplatesOpen(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleDeletePrompt = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deletePrompt(id);
  };

  const groupedPrompts = prompts.reduce((acc, p) => {
    const cat = p.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, SavedPrompt[]>);

  const categoryLabels: Record<string, string> = {
    analysis: 'Analysis',
    comparison: 'Comparison',
    audit: 'Audit',
    summary: 'Summary',
    general: 'General',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Custom AI Prompt
        </CardTitle>
        <CardDescription>
          Run custom AI analysis on your brand portfolio. Select a template or write your own prompt.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates Dropdown */}
        <Collapsible open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Saved Templates ({prompts.length})
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ScrollArea className="h-[200px] rounded-md border p-3">
              {promptsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved templates yet
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                    <div key={category}>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="space-y-1">
                        {categoryPrompts.map(template => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{template.name}</span>
                                {template.is_default && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {template.prompt.substring(0, 60)}...
                              </p>
                            </div>
                            {!template.is_default && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeletePrompt(e, template.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Prompt Input */}
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your analysis prompt... (e.g., 'Compare the brand values and identify any conflicts or overlaps')"
            className="min-h-[120px] resize-none"
            disabled={isRunning}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {prompt.length}/2000 characters
            </span>
            <div className="flex gap-2">
              {prompt.length >= 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSaveDialogOpen(true)}
                  disabled={isRunning}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save as Template
                </Button>
              )}
              {isRunning ? (
                <Button variant="destructive" size="sm" onClick={cancelRequest}>
                  Cancel
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={runPrompt}
                  disabled={prompt.length < 10 || brands.length === 0}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Run Analysis
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Response Display */}
        {(response || isRunning) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">AI Response</h4>
              {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </div>
            <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {response || 'Analyzing...'}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Info Banner */}
        {brands.length > 0 && !response && !isRunning && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              <strong>{brands.length} brands</strong> will be included in the analysis. 
              Run a report first to load brand data, then use custom prompts to explore insights.
            </p>
          </div>
        )}

        {/* Save Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Prompt Template</DialogTitle>
              <DialogDescription>
                Save this prompt for quick access later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g., Brand Consistency Check"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {categoryLabels[newPromptCategory] || newPromptCategory}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <DropdownMenuItem key={key} onClick={() => setNewPromptCategory(key)}>
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Preview</label>
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-2">
                  {prompt.substring(0, 150)}{prompt.length > 150 ? '...' : ''}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePrompt}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
