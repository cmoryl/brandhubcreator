-- Create table for brand intelligence analysis jobs
CREATE TABLE public.brand_intelligence_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_intelligence_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own analysis jobs"
ON public.brand_intelligence_jobs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create jobs for entities they have access to
CREATE POLICY "Users can create analysis jobs"
ON public.brand_intelligence_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update jobs (for edge function)
CREATE POLICY "Service role can update jobs"
ON public.brand_intelligence_jobs
FOR UPDATE
USING (true);

-- Index for efficient job lookup
CREATE INDEX idx_brand_intelligence_jobs_entity ON public.brand_intelligence_jobs(entity_type, entity_id);
CREATE INDEX idx_brand_intelligence_jobs_status ON public.brand_intelligence_jobs(status) WHERE status IN ('pending', 'processing');

-- Trigger for updated_at
CREATE TRIGGER update_brand_intelligence_jobs_updated_at
BEFORE UPDATE ON public.brand_intelligence_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();