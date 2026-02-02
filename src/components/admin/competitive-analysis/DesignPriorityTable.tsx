import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DesignPriority } from '@/types/competitiveAnalysis';

interface DesignPriorityTableProps {
  priorities: DesignPriority[];
}

export function DesignPriorityTable({ priorities }: DesignPriorityTableProps) {
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
      return <Badge variant="outline" className="border-red-500 text-red-500">High Effort</Badge>;
    }
    if (normalized.includes('medium')) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Medium Effort</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-500">Low Effort</Badge>;
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {priorities.map((priority, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">{priority.title}</TableCell>
              <TableCell>{getImpactBadge(priority.impact)}</TableCell>
              <TableCell>{getEffortBadge(priority.effort)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
