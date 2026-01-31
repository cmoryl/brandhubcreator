import { Button } from "@/components/ui/button";
import { Copy, Share2, FileDown, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InsightActionTrackerProps {
  insightId: string;
  insightContent: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
}

export function InsightActionTracker({ 
  insightId, 
  insightContent, 
  entityType, 
  entityId 
}: InsightActionTrackerProps) {
  const { toast } = useToast();

  const trackAction = async (actionType: 'copy' | 'share' | 'export' | 'reference') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'track_action',
          entityType,
          entityId,
          insightAction: {
            insight_id: insightId,
            action_type: actionType,
          },
        },
      });
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(insightContent);
    await trackAction('copy');
    toast({
      title: "Copied",
      description: "Insight copied to clipboard",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Brand Insight',
          text: insightContent,
        });
        await trackAction('share');
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await handleCopy();
    }
  };

  const handleExport = async () => {
    const blob = new Blob([insightContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-${insightId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    await trackAction('export');
    toast({
      title: "Exported",
      description: "Insight downloaded",
    });
  };

  const handleReference = async () => {
    await trackAction('reference');
    toast({
      title: "Referenced",
      description: "This insight will be prioritized in future analyses",
    });
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy insight</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share insight</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleExport}
            >
              <FileDown className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export insight</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleReference}
            >
              <Link className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as important reference</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
