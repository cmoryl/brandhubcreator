/**
 * AIBoothGenerator — Natural language booth generation.
 * User describes their booth, AI generates complete layout + furniture.
 */
import { useState, useCallback } from 'react';
import { Sparkles, Wand2, Loader2, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BoothLayout, LightingPreset } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';
import type { FlooringConfig } from './BoothFloorpad';

export interface AIBoothResult {
  layout: BoothLayout;
  lighting: LightingPreset;
  flooring: { type: string; color: string };
  furniture: Array<{
    assetId: string;
    position: [number, number, number];
    rotation: [number, number, number];
    label?: string;
  }>;
  panelDescriptions: Array<{ panelId: string; suggestion: string }>;
  designNotes: string;
  aesthetic: string;
}

interface AIBoothGeneratorProps {
  onGenerate: (result: AIBoothResult) => void;
  isAdmin: boolean;
}

const QUICK_PROMPTS = [
  { label: '10×20 Tech', prompt: '10x20 booth, 2 demo stations with screens, modern tech aesthetic, open layout' },
  { label: '20×20 Island', prompt: '20x20 island booth, 4 demo stations, reception counter, lounge area, premium corporate feel' },
  { label: '10×10 Startup', prompt: '10x10 booth, 1 screen, minimalist startup look, literature rack, open and inviting' },
  { label: '10×20 Healthcare', prompt: '10x20 booth, private consultation area, 2 screens, clean medical aesthetic, warm lighting' },
  { label: '20×20 Retail', prompt: '20x20 peninsula, product display tables, bright lighting, bold retail experience' },
];

export function AIBoothGenerator({ onGenerate, isAdmin }: AIBoothGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<AIBoothResult | null>(null);

  const generate = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('Please describe your booth');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('booth-ai-generator', {
        body: { prompt: text.trim() },
      });

      if (error) throw new Error(error.message || 'Generation failed');
      if (data?.error) throw new Error(data.error);

      const result = data as AIBoothResult;
      setLastResult(result);
      onGenerate(result);

      toast.success('Booth generated!', {
        description: `${result.layout} layout with ${result.furniture?.length || 0} items — "${result.aesthetic}"`,
      });
    } catch (e: any) {
      const msg = e?.message || 'Failed to generate booth';
      if (msg.includes('rate limit')) {
        toast.error('Rate limit reached', { description: 'Please wait a moment and try again.' });
      } else if (msg.includes('credits')) {
        toast.error('AI credits exhausted', { description: 'Please add credits in Settings → Workspace → Usage.' });
      } else {
        toast.error('Generation failed', { description: msg });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerate]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Booth Generator</span>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((qp) => (
          <Badge
            key={qp.label}
            variant="outline"
            className={cn(
              "text-[10px] cursor-pointer transition-colors hover:bg-primary/10 hover:border-primary/30",
              prompt === qp.prompt && "bg-primary/10 border-primary/30"
            )}
            onClick={() => setPrompt(qp.prompt)}
          >
            <Zap className="h-2.5 w-2.5 mr-0.5" />
            {qp.label}
          </Badge>
        ))}
      </div>

      {/* Prompt input */}
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your booth... e.g. '10x20 booth, 2 demo stations, 1 screen, modern tech aesthetic, open layout'"
        className="text-xs min-h-[72px] resize-none"
        rows={3}
        disabled={isGenerating}
      />

      <Button
        onClick={() => generate(prompt)}
        disabled={isGenerating || !prompt.trim()}
        className="w-full h-8 text-xs gap-1.5"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating Booth...
          </>
        ) : (
          <>
            <Wand2 className="h-3.5 w-3.5" />
            Generate Booth
            <ArrowRight className="h-3 w-3" />
          </>
        )}
      </Button>

      {/* Last result summary */}
      {lastResult && !isGenerating && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{lastResult.layout}</Badge>
            <Badge variant="outline" className="text-[10px]">{lastResult.aesthetic}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{lastResult.designNotes}</p>
          {lastResult.panelDescriptions?.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-semibold uppercase text-muted-foreground tracking-wider">Panel Suggestions</p>
              {lastResult.panelDescriptions.map((pd) => (
                <div key={pd.panelId} className="flex items-start gap-1.5">
                  <Badge variant="outline" className="text-[8px] shrink-0 mt-0.5">{pd.panelId}</Badge>
                  <span className="text-[10px] text-muted-foreground">{pd.suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
