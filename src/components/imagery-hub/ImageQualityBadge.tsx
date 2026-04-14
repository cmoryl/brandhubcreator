/**
 * ImageQualityBadge - Displays quality score badge on images with detailed breakdown
 */
import { useState, useCallback } from 'react';
import { Shield, Loader2, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageQualityBadgeProps {
  image: ApprovedImage;
  entityId?: string;
  entityType?: string;
  onScoreUpdate?: (score: number, details: ApprovedImage['qualityDetails']) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 border-green-500/30';
  if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

export const ImageQualityBadge = ({ image, entityId, entityType, onScoreUpdate }: ImageQualityBadgeProps) => {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(image.qualityScore ?? null);
  const [details, setDetails] = useState(image.qualityDetails ?? null);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('imagery-quality-score', {
        body: {
          imageUrls: [image.url || image.thumbnailUrl],
          entityId,
          entityType,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const s = data.scores?.[0];
      if (s) {
        setScore(s.overall);
        const d = {
          resolution: s.resolution,
          composition: s.composition,
          brandAlignment: s.brandAlignment,
          technicalQuality: s.technicalQuality,
          notes: s.notes,
        };
        setDetails(d);
        onScoreUpdate?.(s.overall, d);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to score image');
    } finally {
      setLoading(false);
    }
  }, [image, entityId, entityType, onScoreUpdate]);

  if (score === null && !loading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => { e.stopPropagation(); analyze(); }}
        title="Score quality"
      >
        <Star className="h-3 w-3" />
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="h-6 w-6 flex items-center justify-center">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'h-5 px-1.5 rounded text-[10px] font-bold border flex items-center gap-0.5',
            getScoreBg(score!)
          )}
          onClick={e => e.stopPropagation()}
        >
          <span className={getScoreColor(score!)}>{score}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start" onClick={e => e.stopPropagation()}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Quality Score</span>
            <span className={cn('text-lg font-bold', getScoreColor(score!))}>{score}</span>
          </div>
          {details && (
            <>
              <div className="space-y-1.5">
                {[
                  { label: 'Resolution', value: details.resolution },
                  { label: 'Composition', value: details.composition },
                  { label: 'Brand Fit', value: details.brandAlignment },
                  { label: 'Technical', value: details.technicalQuality },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">{item.label}</span>
                    <Progress value={item.value} className="h-1.5 flex-1" />
                    <span className={cn('text-xs font-medium w-6 text-right', getScoreColor(item.value))}>{item.value}</span>
                  </div>
                ))}
              </div>
              {details.notes && (
                <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{details.notes}</p>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
