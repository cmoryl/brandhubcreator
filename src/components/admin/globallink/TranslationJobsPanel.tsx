/**
 * TranslationJobsPanel - View and manage translation jobs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, CheckCircle2, XCircle, Loader2, 
  FileText, Package, Calendar, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLocalization } from '@/hooks/useLocalization';
import { formatDistanceToNow } from 'date-fns';
import type { LocalizationJob } from '@/types/localization';

const statusConfig = {
  pending: { icon: Clock, color: 'bg-amber-500', label: 'Pending' },
  processing: { icon: Loader2, color: 'bg-blue-500', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'bg-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'bg-red-500', label: 'Failed' },
  cancelled: { icon: XCircle, color: 'bg-gray-500', label: 'Cancelled' },
};

const entityTypeIcons = {
  brand: FileText,
  product: Package,
  event: Calendar,
  ui_label: FileText,
};

export const TranslationJobsPanel: React.FC = () => {
  const { organization } = useOrganization();
  const { jobs, isLoading } = useLocalization(organization?.id);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const filteredJobs = jobs.filter(job => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (typeFilter !== 'all' && job.entity_type !== typeFilter) return false;
    return true;
  });

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Jobs</CardTitle>
          <CardDescription>
            View and manage content translation requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses ({statusCounts.all})</SelectItem>
                  <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                  <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
                  <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
                  <SelectItem value="failed">Failed ({statusCounts.failed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="brand">Brands</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="ui_label">UI Labels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No translation jobs found</p>
              <p className="text-sm">Submit content for translation to see jobs here</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredJobs.map((job) => (
                  <JobRow 
                    key={job.id} 
                    job={job}
                    isExpanded={expandedJob === job.id}
                    onToggle={() => setExpandedJob(
                      expandedJob === job.id ? null : job.id
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface JobRowProps {
  job: LocalizationJob;
  isExpanded: boolean;
  onToggle: () => void;
}

const JobRow: React.FC<JobRowProps> = ({ job, isExpanded, onToggle }) => {
  const status = statusConfig[job.status];
  const StatusIcon = status.icon;
  const EntityIcon = entityTypeIcons[job.entity_type];

  return (
    <div className="border-b last:border-0">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg ${status.color}/10`}>
          <StatusIcon className={`h-4 w-4 ${
            job.status === 'processing' ? 'animate-spin' : ''
          } ${status.color.replace('bg-', 'text-')}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <EntityIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{job.entity_name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {job.entity_type}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{job.source_language} → {job.target_language}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(job.submitted_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {job.word_count && (
            <span className="text-xs text-muted-foreground">
              {job.word_count.toLocaleString()} words
            </span>
          )}
          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
            {status.label}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Translation Method:</span>
              <span className="ml-2 capitalize">{job.translation_method}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Characters:</span>
              <span className="ml-2">{job.character_count?.toLocaleString() || 'N/A'}</span>
            </div>
            {job.completed_at && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-2">
                  {formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })}
                </span>
              </div>
            )}
            {job.error_message && (
              <div className="col-span-2">
                <span className="text-destructive">Error:</span>
                <span className="ml-2 text-destructive">{job.error_message}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">View Source</Button>
            {job.status === 'completed' && (
              <Button variant="outline" size="sm">View Translation</Button>
            )}
            {job.status === 'failed' && (
              <Button variant="outline" size="sm">Retry</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationJobsPanel;
