
-- Bot configuration table for managing AI assistants from admin panel
CREATE TABLE public.bot_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_type TEXT NOT NULL CHECK (bot_type IN ('help_agent', 'brand_assistant')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'AI Assistant',
  system_prompt TEXT,
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash-lite',
  temperature NUMERIC(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2048,
  welcome_message TEXT,
  suggested_questions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  personality_traits JSONB DEFAULT '[]'::jsonb,
  response_style TEXT DEFAULT 'concise' CHECK (response_style IN ('concise', 'detailed', 'conversational', 'professional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bot_type, organization_id)
);

-- Enable RLS
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- Admins can manage bot config
CREATE POLICY "Admins can view bot config"
  ON public.bot_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert bot config"
  ON public.bot_config FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bot config"
  ON public.bot_config FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bot config"
  ON public.bot_config FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_bot_config_updated_at
  BEFORE UPDATE ON public.bot_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bot conversation logs table for tracking all conversations
CREATE TABLE public.bot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_type TEXT NOT NULL CHECK (bot_type IN ('help_agent', 'brand_assistant')),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER DEFAULT 0,
  language_code TEXT DEFAULT 'en',
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  session_duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.bot_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.bot_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON public.bot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON public.bot_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete conversations
CREATE POLICY "Admins can delete conversations"
  ON public.bot_conversations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_bot_conversations_updated_at
  BEFORE UPDATE ON public.bot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_bot_conversations_bot_type ON public.bot_conversations(bot_type);
CREATE INDEX idx_bot_conversations_org ON public.bot_conversations(organization_id);
CREATE INDEX idx_bot_conversations_user ON public.bot_conversations(user_id);
CREATE INDEX idx_bot_conversations_created ON public.bot_conversations(created_at DESC);
