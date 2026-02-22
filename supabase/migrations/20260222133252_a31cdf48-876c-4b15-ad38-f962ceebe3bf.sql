
-- User assistant profiles for persona learning
CREATE TABLE public.user_assistant_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  communication_style JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  feedback_patterns JSONB DEFAULT '{}'::jsonb,
  expertise_level TEXT DEFAULT 'intermediate',
  topics_of_interest TEXT[] DEFAULT '{}',
  interaction_count INTEGER DEFAULT 0,
  last_persona_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.user_assistant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_assistant_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_assistant_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_assistant_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_assistant_profiles_updated_at
  BEFORE UPDATE ON public.user_assistant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
