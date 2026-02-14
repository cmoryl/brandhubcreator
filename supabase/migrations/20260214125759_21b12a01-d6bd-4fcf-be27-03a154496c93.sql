
-- Table to store social platform API credentials per organization
CREATE TABLE public.social_platform_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credential_type TEXT NOT NULL DEFAULT 'api_key',
  credentials JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT NOT NULL DEFAULT 'daily',
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  account_id TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(organization_id, platform, account_id)
);

-- Enable RLS
ALTER TABLE public.social_platform_credentials ENABLE ROW LEVEL SECURITY;

-- RLS: Org members can view credentials
CREATE POLICY "Org members can view social credentials"
ON public.social_platform_credentials
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  )
);

-- RLS: Org admins can manage credentials
CREATE POLICY "Org admins can insert social credentials"
ON public.social_platform_credentials
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Org admins can update social credentials"
ON public.social_platform_credentials
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Org admins can delete social credentials"
ON public.social_platform_credentials
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
  )
);

-- Sync history for audit trail
CREATE TABLE public.social_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES public.social_platform_credentials(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metrics_fetched JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  data_source TEXT NOT NULL DEFAULT 'api'
);

ALTER TABLE public.social_sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sync history"
ON public.social_sync_history
FOR SELECT
USING (
  credential_id IN (
    SELECT id FROM public.social_platform_credentials WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_social_platform_credentials_updated_at
BEFORE UPDATE ON public.social_platform_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
