/**
 * TranslationHub - Central interface for managing translation jobs
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Languages, Globe2, Clock, CheckCircle2, AlertCircle, Play, 
  Pause, RefreshCw, FileText, Loader2, Plus, ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TranslationJob {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  source_language: string;
  target_language: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  word_count: number;
  character_count: number;
  submitted_at: string;
  completed_at: string | null;
  translation_method: 'ai' | 'professional' | 'hybrid';
  error_message: string | null;
}

interface TranslationHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  entityName?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RefreshCw },
  completed: { label: 'Completed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: AlertCircle },
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ko', name: 'Korean' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
];

export const TranslationHub = ({
  open,
  onOpenChange,
  organizationId,
  entityId,
  entityType,
  entityName
}: TranslationHubProps) => {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // New job form
  const [newJobTarget, setNewJobTarget] = useState('');
  const [newJobMethod, setNewJobMethod] = useState<'ai' | 'professional'>('ai');

  useEffect(() => {
    if (open) {
      fetchJobs();
    }
  }, [open, organizationId, entityId]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('localization_jobs')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      
      setJobs((data || []) as TranslationJob[]);
    } catch (err) {
      console.error('Failed to fetch translation jobs:', err);
      toast.error('Failed to load translation jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const createJob = async () => {
    if (!entityId || !newJobTarget) {
      toast.error('Please select a target language');
      return;
    }

    setIsCreating(true);
    try {
      // Fetch entity data to get content
      const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';
      const { data: entityData, error: entityError } = await supabase
        .from(tableName)
        .select('guide_data')
        .eq('id', entityId)
        .single();

      if (entityError) throw entityError;

      // Calculate word/char count from guide_data
      const contentStr = JSON.stringify(entityData.guide_data || {});
      const wordCount = contentStr.split(/\s+/).length;
      const charCount = contentStr.length;

      const { data, error } = await supabase
        .from('localization_jobs')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          entity_name: entityName,
          organization_id: organizationId,
          source_language: 'en',
          target_language: newJobTarget,
          source_content: entityData.guide_data,
          status: 'pending',
          word_count: wordCount,
          character_count: charCount,
          translation_method: newJobMethod,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Translation job created for ${LANGUAGES.find(l => l.code === newJobTarget)?.name}`);
      setNewJobTarget('');
      fetchJobs();
    } catch (err) {
      console.error('Failed to create translation job:', err);
      toast.error('Failed to create translation job');
    } finally {
      setIsCreating(false);
    }
  };

  const startTranslation = async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      // Update status to in_progress
      await supabase
        .from('localization_jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId);

      // Call translation function
      const { data, error } = await supabase.functions.invoke('globallink-translate', {
        body: { jobId }
      });

      if (error) throw error;

      toast.success('Translation started');
      fetchJobs();
    } catch (err) {
      console.error('Failed to start translation:', err);
      toast.error('Failed to start translation');
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    return job.status === activeTab;
  });

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Translation Hub
          </DialogTitle>
          <DialogDescription>
            Manage translation jobs and localized content
            {entityName && ` for ${entityName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-muted/50">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* New Job Section */}
        {entityId && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Translation Job
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs text-muted-foreground">Target Language</label>
                <Select value={newJobTarget} onValueChange={setNewJobTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs text-muted-foreground">Method</label>
                <Select value={newJobMethod} onValueChange={(v) => setNewJobMethod(v as 'ai' | 'professional')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI Translation (Fast)</SelectItem>
                    <SelectItem value="professional">Professional (Accurate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createJob} disabled={isCreating || !newJobTarget}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create Job
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Languages className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No translation jobs found</p>
                {entityId && (
                  <p className="text-sm mt-1">Create a new job above to get started</p>
                )}
              </div>
            ) : (
              filteredJobs.map(job => {
                const StatusIcon = STATUS_CONFIG[job.status].icon;
                return (
                  <Card key={job.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{job.entity_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize">{job.entity_type}</span>
                              <span>•</span>
                              <span>{job.source_language.toUpperCase()} → {job.target_language.toUpperCase()}</span>
                              <span>•</span>
                              <span>{job.word_count?.toLocaleString() || 0} words</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={cn('gap-1', STATUS_CONFIG[job.status].color)}>
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_CONFIG[job.status].label}
                          </Badge>
                          
                          {job.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => startTranslation(job.id)}>
                              <Play className="h-3.5 w-3.5 mr-1" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {job.status === 'in_progress' && (
                        <div className="mt-3">
                          <Progress value={50} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">Translating...</p>
                        </div>
                      )}
                      
                      {job.error_message && (
                        <p className="text-xs text-red-500 mt-2">{job.error_message}</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Submitted {format(new Date(job.submitted_at), 'MMM d, yyyy h:mm a')}
                        {job.completed_at && ` • Completed ${format(new Date(job.completed_at), 'MMM d, yyyy h:mm a')}`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
