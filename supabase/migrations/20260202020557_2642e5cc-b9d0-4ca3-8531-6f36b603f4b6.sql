-- Create backup_jobs table for queue-based async backup processing
CREATE TABLE public.backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  backup_path TEXT,
  brands_count INTEGER DEFAULT 0,
  products_count INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  file_size_bytes INTEGER,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for backup_jobs
CREATE POLICY "Organization members can view their backup jobs"
  ON public.backup_jobs
  FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Organization admins can create backup jobs"
  ON public.backup_jobs
  FOR INSERT
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Organization admins can update backup jobs"
  ON public.backup_jobs
  FOR UPDATE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Organization admins can delete backup jobs"
  ON public.backup_jobs
  FOR DELETE
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for pending jobs lookup
CREATE INDEX idx_backup_jobs_pending ON public.backup_jobs(status, scheduled_for) 
  WHERE status = 'pending';

-- Create index for organization lookup
CREATE INDEX idx_backup_jobs_org ON public.backup_jobs(organization_id, created_at DESC);

-- Add schedule settings to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS backup_schedule JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON TABLE public.backup_jobs IS 'Queue for async backup processing - jobs are created immediately and processed by worker';
COMMENT ON COLUMN public.backup_jobs.status IS 'pending: waiting to process, processing: in progress, completed: done, failed: error occurred';
COMMENT ON COLUMN public.backup_jobs.scheduled_for IS 'When the backup should run (null = immediate)';