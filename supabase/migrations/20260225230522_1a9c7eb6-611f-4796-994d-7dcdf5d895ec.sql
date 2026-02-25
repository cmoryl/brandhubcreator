
-- Assistant Memory table for conversational intelligence persistence
CREATE TABLE public.assistant_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('brand', 'product', 'event')),
  entity_id UUID,
  summary TEXT NOT NULL,
  key_decisions JSONB DEFAULT '[]'::jsonb,
  topics TEXT[] DEFAULT '{}',
  conversation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assistant_memory_org ON public.assistant_memory(organization_id);
CREATE INDEX idx_assistant_memory_entity ON public.assistant_memory(entity_id, entity_type);
CREATE INDEX idx_assistant_memory_topics ON public.assistant_memory USING GIN(topics);

-- RLS
ALTER TABLE public.assistant_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view assistant memory"
  ON public.assistant_memory FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage assistant memory"
  ON public.assistant_memory FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Timestamp trigger
CREATE TRIGGER update_assistant_memory_updated_at
  BEFORE UPDATE ON public.assistant_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
