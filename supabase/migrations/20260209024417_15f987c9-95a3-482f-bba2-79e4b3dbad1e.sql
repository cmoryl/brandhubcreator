-- Create DataForce configuration table
CREATE TABLE public.dataforce_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key TEXT,
  api_endpoint TEXT DEFAULT 'https://api.dataforce.ai/v1',
  api_mode TEXT DEFAULT 'demo' CHECK (api_mode IN ('demo', 'live')),
  
  -- Service enablement
  compliance_ai_enabled BOOLEAN DEFAULT true,
  brand_assistant_enabled BOOLEAN DEFAULT true,
  cultural_validation_enabled BOOLEAN DEFAULT true,
  genai_training_enabled BOOLEAN DEFAULT true,
  
  -- Compliance AI settings
  compliance_model_id TEXT,
  compliance_auto_scan BOOLEAN DEFAULT false,
  compliance_threshold NUMERIC DEFAULT 0.8,
  
  -- Brand Assistant settings
  assistant_model_id TEXT,
  assistant_languages TEXT[] DEFAULT ARRAY['en_US'],
  assistant_persona TEXT,
  
  -- Cultural Validation settings
  validation_panel_size INTEGER DEFAULT 10,
  validation_regions TEXT[],
  validation_auto_request BOOLEAN DEFAULT false,
  
  -- GenAI Training settings
  training_model_base TEXT DEFAULT 'gemini-2.5-flash',
  training_voice_samples INTEGER DEFAULT 0,
  training_last_sync_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_dataforce UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.dataforce_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their org DataForce config"
  ON public.dataforce_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_config.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage DataForce config"
  ON public.dataforce_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_config.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create DataForce compliance jobs table
CREATE TABLE public.dataforce_compliance_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  compliance_score NUMERIC,
  issues_found INTEGER DEFAULT 0,
  issues_data JSONB DEFAULT '[]'::jsonb,
  assets_scanned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.dataforce_compliance_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance jobs
CREATE POLICY "Users can view org compliance jobs"
  ON public.dataforce_compliance_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_compliance_jobs.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create compliance jobs"
  ON public.dataforce_compliance_jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_compliance_jobs.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create cultural validation requests table
CREATE TABLE public.dataforce_validation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  variant_id UUID REFERENCES public.brand_regional_variants(id),
  target_regions TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'cancelled')),
  panel_size INTEGER DEFAULT 10,
  responses_received INTEGER DEFAULT 0,
  validation_score NUMERIC,
  feedback_summary JSONB,
  content_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.dataforce_validation_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view org validation requests"
  ON public.dataforce_validation_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_validation_requests.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create validation requests"
  ON public.dataforce_validation_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_validation_requests.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create brand assistant conversations table
CREATE TABLE public.dataforce_assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID,
  user_id UUID NOT NULL,
  language_code TEXT DEFAULT 'en_US',
  messages JSONB DEFAULT '[]'::jsonb,
  context_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dataforce_assistant_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own conversations"
  ON public.dataforce_assistant_conversations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON public.dataforce_assistant_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.dataforce_assistant_conversations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Create training jobs table
CREATE TABLE public.dataforce_training_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID,
  training_type TEXT NOT NULL CHECK (training_type IN ('voice', 'visual', 'content')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collecting', 'training', 'completed', 'failed')),
  samples_collected INTEGER DEFAULT 0,
  samples_target INTEGER DEFAULT 100,
  model_id TEXT,
  training_config JSONB,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.dataforce_training_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view org training jobs"
  ON public.dataforce_training_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_training_jobs.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage training jobs"
  ON public.dataforce_training_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = dataforce_training_jobs.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Update timestamp trigger
CREATE TRIGGER update_dataforce_config_updated_at
  BEFORE UPDATE ON public.dataforce_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dataforce_conversations_updated_at
  BEFORE UPDATE ON public.dataforce_assistant_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();