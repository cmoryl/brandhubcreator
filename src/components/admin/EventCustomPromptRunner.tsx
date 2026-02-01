import { useState, useRef } from 'react';
import { Sparkles, Send, Save, Loader2, BookmarkPlus, Trash2, ChevronDown, CalendarDays } from 'lucide-react';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSavedPrompts, SavedPrompt } from '@/hooks/useSavedPrompts';

interface EventData {
  id: string;
  name: string;
}

interface EventCustomPromptRunnerProps {
  events: EventData[];
}

// Event-specific default templates
const EVENT_PROMPT_TEMPLATES = [
  {
    name: 'Event Readiness Check',
    prompt: 'Analyze these events and assess their readiness for launch. Check for completeness of schedules, speaker information, sponsor integration, signage specifications, and digital materials. Identify any gaps that need to be addressed before each event goes live.',
    category: 'audit',
  },
  {
    name: 'Speaker & Sponsor Analysis',
    prompt: 'Review the speaker lineup and sponsor tiers across these events. Identify opportunities for cross-promotion, highlight any missing speaker bios or sponsor logos, and suggest ways to maximize sponsor visibility.',
    category: 'analysis',
  },
  {
    name: 'Event Branding Consistency',
    prompt: 'Evaluate the brand consistency across these events. Check if event logos, colors, and signage align with parent brand guidelines. Flag any deviations and suggest corrections.',
    category: 'audit',
  },
  {
    name: 'Post-Event Summary',
    prompt: 'Generate a comprehensive summary of past events including attendance metrics, speaker highlights, sponsor participation, and key learnings. Identify patterns and recommendations for future events.',
    category: 'summary',
  },
  {
    name: 'Event Marketing Assets',
    prompt: 'Analyze the digital marketing assets for these events including banners, social media assets, and email templates. Identify missing assets and provide recommendations for a complete marketing toolkit.',
    category: 'analysis',
  },
  {
    name: 'Venue & Logistics Review',
    prompt: 'Review the venue and location information for these events. Check for completeness of address details, parking information, transit options, and nearby accommodations. Identify any missing logistical information.',
    category: 'audit',
  },
];

export function EventCustomPromptRunner({ events }: EventCustomPromptRunnerProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('event');
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { prompts, isLoading: promptsLoading, savePrompt, deletePrompt } = useSavedPrompts();

  // Filter prompts to show event-specific ones first
  const eventPrompts = prompts.filter(p => p.category === 'event');
  const otherPrompts = prompts.filter(p => p.category !== 'event');

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

      // Call the run-event-prompt edge function
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-event-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt,
            eventIds: events.map(e => e.id),
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

      toast.success('Event analysis complete');
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        toast.info('Request cancelled');
      } else {
        console.error('Prompt error:', error);
        toast.error((error as Error).message || 'Failed to run event prompt');
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
      setNewPromptCategory('event');
    }
  };

  const handleSelectTemplate = (template: { prompt: string; name: string }) => {
    setPrompt(template.prompt);
    setIsTemplatesOpen(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleDeletePrompt = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deletePrompt(id);
  };

  const categoryLabels: Record<string, string> = {
    event: 'Event',
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
          <CalendarDays className="h-4 w-4" />
          Event AI Analysis
        </CardTitle>
        <CardDescription>
          Run custom AI analysis on your event portfolio. Use event-specific templates or create your own prompts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates Dropdown */}
        <Collapsible open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4" />
                Event Templates & Saved Prompts ({EVENT_PROMPT_TEMPLATES.length + eventPrompts.length})
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTemplatesOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ScrollArea className="h-[280px] rounded-md border p-3">
              {/* Built-in Event Templates */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                  Event Templates
                </h4>
                <div className="space-y-1">
                  {EVENT_PROMPT_TEMPLATES.map((template, idx) => (
                    <div
                      key={`builtin-${idx}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{template.name}</span>
                          <Badge variant="secondary" className="text-xs">Built-in</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {template.prompt.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Saved Event Prompts */}
              {eventPrompts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                    Your Event Prompts
                  </h4>
                  <div className="space-y-1">
                    {eventPrompts.map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate">{template.name}</span>
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
              )}

              {/* Other Saved Prompts */}
              {otherPrompts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
                    Other Saved Prompts
                  </h4>
                  <div className="space-y-1">
                    {otherPrompts.slice(0, 5).map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{template.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[template.category] || template.category}
                            </Badge>
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
              )}

              {promptsLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
            placeholder="Enter your event analysis prompt... (e.g., 'Analyze speaker diversity across upcoming conferences')"
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
                  disabled={prompt.length < 10 || events.length === 0}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Run Event Analysis
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Response Display */}
        {(response || isRunning) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">AI Event Analysis</h4>
              {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </div>
            <ScrollArea className="h-[300px] rounded-md border bg-muted/30 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {response || 'Analyzing events...'}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Info Banner */}
        {events.length > 0 && !response && !isRunning && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              <strong>{events.length} events</strong> will be included in the analysis. 
              Use event-specific templates above or write custom prompts to explore insights about schedules, speakers, sponsors, and more.
            </p>
          </div>
        )}

        {/* Save Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Event Prompt Template</DialogTitle>
              <DialogDescription>
                Save this prompt for quick access in future event analyses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g., Speaker Diversity Analysis"
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
