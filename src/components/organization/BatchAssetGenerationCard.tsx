import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, Blend, Grid3X3, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface GenerationResults {
  brands: { processed: number; gradientsAdded: number; patternsAdded: number };
  products: { processed: number; gradientsAdded: number; patternsAdded: number };
  events: { processed: number; gradientsAdded: number; patternsAdded: number };
  errors: string[];
}

export const BatchAssetGenerationCard = () => {
  const { organization } = useOrganization();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatePatterns, setGeneratePatterns] = useState(true);
  const [generateGradients, setGenerateGradients] = useState(true);
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [progress, setProgress] = useState(0);

  const handleBatchGenerate = async () => {
    if (!generatePatterns && !generateGradients) {
      toast.error('Select at least one asset type to generate');
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setResults(null);
    
    toast.info('Starting batch asset generation...', {
      description: 'This may take a few minutes for AI pattern generation.'
    });

    try {
      setProgress(30);
      
      const { data, error } = await supabase.functions.invoke('batch-generate-assets', {
        body: {
          organizationId: organization?.id,
          generatePatterns,
          generateGradients
        }
      });

      setProgress(100);

      if (error) throw error;

      if (data?.success) {
        setResults(data.results);
        
        const totalProcessed = 
          data.results.brands.processed + 
          data.results.products.processed + 
          data.results.events.processed;
        
        const totalGradients = 
          data.results.brands.gradientsAdded + 
          data.results.products.gradientsAdded + 
          data.results.events.gradientsAdded;
        
        const totalPatterns = 
          data.results.brands.patternsAdded + 
          data.results.products.patternsAdded + 
          data.results.events.patternsAdded;

        if (totalProcessed > 0) {
          toast.success('Batch generation complete!', {
            description: `Updated ${totalProcessed} entities. Added ${totalGradients} gradients and ${totalPatterns} patterns.`
          });
        } else {
          toast.info('No entities needed updates', {
            description: 'All brands/products already have 4+ gradients and patterns.'
          });
        }

        if (data.results.errors.length > 0) {
          console.warn('Generation errors:', data.results.errors);
        }
      }
    } catch (error) {
      console.error('Batch generation error:', error);
      toast.error('Failed to generate assets', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Asset Generation
        </CardTitle>
        <CardDescription>
          Auto-generate brand-specific gradients and geometric patterns for all brands, products, and events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Blend className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="generate-gradients" className="font-medium">Gradients</Label>
                <p className="text-sm text-muted-foreground">Generate 4 CSS gradients based on brand colors</p>
              </div>
            </div>
            <Switch
              id="generate-gradients"
              checked={generateGradients}
              onCheckedChange={setGenerateGradients}
              disabled={isGenerating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Grid3X3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="generate-patterns" className="font-medium">Geometric Primitives</Label>
                <p className="text-sm text-muted-foreground">Generate 4 AI pattern images per brand (slower)</p>
              </div>
            </div>
            <Switch
              id="generate-patterns"
              checked={generatePatterns}
              onCheckedChange={setGeneratePatterns}
              disabled={isGenerating}
            />
          </div>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progress < 30 ? 'Initializing...' : 'Generating assets for all brands...'}
            </p>
          </div>
        )}

        {results && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Generation Complete</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Brands</p>
                <p className="font-medium">{results.brands.processed} updated</p>
                <p className="text-xs text-muted-foreground">
                  +{results.brands.gradientsAdded} gradients, +{results.brands.patternsAdded} patterns
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Products</p>
                <p className="font-medium">{results.products.processed} updated</p>
                <p className="text-xs text-muted-foreground">
                  +{results.products.gradientsAdded} gradients, +{results.products.patternsAdded} patterns
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Events</p>
                <p className="font-medium">{results.events.processed} updated</p>
                <p className="text-xs text-muted-foreground">
                  +{results.events.gradientsAdded} gradients
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleBatchGenerate}
          disabled={isGenerating || (!generatePatterns && !generateGradients)}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Assets...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate for All Brands
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Only entities with colors defined and fewer than 4 gradients/patterns will be updated
        </p>
      </CardContent>
    </Card>
  );
};
