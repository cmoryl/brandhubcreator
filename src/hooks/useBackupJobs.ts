import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BackupJob {
  id: string;
  organization_id: string;
  job_type: 'manual' | 'scheduled';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  backup_path: string | null;
  brands_count: number;
  products_count: number;
  events_count: number;
  file_size_bytes: number | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useBackupJobs = (organizationId: string | null) => {
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs((data as BackupJob[]) || []);
    } catch (err) {
      console.error('Failed to fetch backup jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Subscribe to job updates
  useEffect(() => {
    if (!organizationId) return;

    fetchJobs();

    const channel = supabase
      .channel(`backup_jobs_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'backup_jobs',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as BackupJob, ...prev].slice(0, 20));
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) =>
                job.id === (payload.new as BackupJob).id ? (payload.new as BackupJob) : job
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, fetchJobs]);

  const queueBackup = useCallback(async (
    options: {
      scheduledFor?: string;
      jobType?: 'manual' | 'scheduled';
    } = {}
  ): Promise<{ success: boolean; jobId?: string }> => {
    if (!organizationId) {
      toast.error('No organization selected');
      return { success: false };
    }

    setIsQueueing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to create backups');
        return { success: false };
      }

      const response = await supabase.functions.invoke('queue-backup', {
        body: {
          organizationId,
          jobType: options.jobType || 'manual',
          scheduledFor: options.scheduledFor,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success) {
        if (result.existingJobId) {
          toast.info('A backup is already in progress');
        } else {
          toast.error(result.error || 'Failed to queue backup');
        }
        return { success: false };
      }

      toast.success(
        options.scheduledFor
          ? 'Backup scheduled successfully'
          : 'Backup started'
      );
      
      return { success: true, jobId: result.jobId };
    } catch (err) {
      console.error('Failed to queue backup:', err);
      toast.error('Failed to start backup');
      return { success: false };
    } finally {
      setIsQueueing(false);
    }
  }, [organizationId]);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('backup_jobs')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('id', jobId)
        .eq('status', 'pending'); // Can only cancel pending jobs

      if (error) throw error;
      toast.success('Backup job cancelled');
      return true;
    } catch (err) {
      console.error('Failed to cancel job:', err);
      toast.error('Failed to cancel backup');
      return false;
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('backup_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      toast.success('Backup job removed');
      return true;
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error('Failed to remove backup');
      return false;
    }
  }, []);

  const getActiveJob = useCallback(() => {
    return jobs.find((j) => j.status === 'pending' || j.status === 'processing');
  }, [jobs]);

  return {
    jobs,
    isLoading,
    isQueueing,
    fetchJobs,
    queueBackup,
    cancelJob,
    deleteJob,
    getActiveJob,
  };
};
