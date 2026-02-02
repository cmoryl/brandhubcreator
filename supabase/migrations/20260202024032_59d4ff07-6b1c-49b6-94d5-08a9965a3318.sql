-- Create table for lead/contact submissions from Get Started button
CREATE TABLE public.lead_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  team_size TEXT,
  use_case TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for anonymous form submissions)
CREATE POLICY "Anyone can submit leads"
ON public.lead_submissions
FOR INSERT
WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view all submissions"
ON public.lead_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update submissions (for status, notes)
CREATE POLICY "Admins can update submissions"
ON public.lead_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_lead_submissions_updated_at
BEFORE UPDATE ON public.lead_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for status filtering
CREATE INDEX idx_lead_submissions_status ON public.lead_submissions(status);
CREATE INDEX idx_lead_submissions_created_at ON public.lead_submissions(created_at DESC);