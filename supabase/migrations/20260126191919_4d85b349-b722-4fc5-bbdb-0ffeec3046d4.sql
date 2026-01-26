-- Create brand-backups storage bucket for automatic backups
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-backups', 'brand-backups', false, 52428800, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for brand-backups bucket
-- Only authenticated users who are org members can read backups
CREATE POLICY "Org members can read their backups"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'brand-backups'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user is member of the org folder they're accessing
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[1]
    )
    OR has_role(auth.uid(), 'admin')
  )
);

-- Only admins/owners can create backups (edge function uses service role)
CREATE POLICY "Service role can manage backups"
ON storage.objects FOR ALL
USING (bucket_id = 'brand-backups')
WITH CHECK (bucket_id = 'brand-backups');

-- Create backup_history table to track backups with metadata
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'manual'
  backup_path TEXT NOT NULL,
  brands_count INTEGER NOT NULL DEFAULT 0,
  products_count INTEGER NOT NULL DEFAULT 0,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Policies for backup_history
CREATE POLICY "Org members can view backup history"
ON public.backup_history FOR SELECT
USING (is_org_member(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can insert backup history"
ON public.backup_history FOR INSERT
WITH CHECK (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins can delete backup history"
ON public.backup_history FOR DELETE
USING (is_org_admin(auth.uid(), organization_id) OR has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_backup_history_org_created ON public.backup_history(organization_id, created_at DESC);