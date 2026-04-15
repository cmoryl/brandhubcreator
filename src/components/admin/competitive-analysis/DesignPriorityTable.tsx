import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { DesignPriority } from '@/types/competitiveAnalysis';

interface DesignPriorityTableProps {
  priorities: DesignPriority[];
  reportId?: string;
  onApprove?: (index: number, title: string) => Promise<unknown>;
  isUtilized?: (index: number) => boolean;
}

export function DesignPriorityTable({ priorities, reportId, onApprove, isUtilized }: DesignPriorityTableProps) {
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);

  const getImpactBadge = (impact: string) => {
    const normalized = impact.toLowerCase();
    if (normalized.includes('high')) {
      return <Badge variant="destructive">High Impact</Badge>;
    }
    if (normalized.includes('medium')) {
      return <Badge variant="default">Medium Impact</Badge>;
    }
    return <Badge variant="secondary">Low Impact</Badge>;
  };

  const getEffortBadge = (effort: string) => {
    const normalized = effort.toLowerCase();
    if (normalized.includes('high')) {
      return <Badge variant="outline" className="border-destructive text-destructive">High Effort</Badge>;
    }
    if (normalized.includes('medium')) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium Effort</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-500">Low Effort</Badge>;
  };

  const handleApprove = async (index: number, title: string) => {
    if (!onApprove) return;
    setApprovingIndex(index);
    try {
      await onApprove(index, title);
    } finally {
      setApprovingIndex(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="w-[140px]">Impact</TableHead>
            <TableHead className="w-[140px]">Effort</TableHead>
            {onApprove && <TableHead className="w-[140px] text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {priorities.map((priority, index) => {
            const utilized = isUtilized?.(index) ?? false;
            return (
              <TableRow key={index} className={cn(utilized && 'bg-primary/5')}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{priority.title}</span>
                    {utilized && (
                      <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Utilized
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getImpactBadge(priority.impact)}</TableCell>
                <TableCell>{getEffortBadge(priority.effort)}</TableCell>
                {onApprove && (
                  <TableCell className="text-right">
                    {utilized ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground">Applied</span>
                        </TooltipTrigger>
                        <TooltipContent>This recommendation has been integrated into the Imagery Hub</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={approvingIndex !== null}
                        onClick={() => handleApprove(index, priority.title)}
                      >
                        {approvingIndex === index ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Approve & Apply
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
