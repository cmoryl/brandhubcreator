-- Create events table for event brand kits
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  parent_brand_id UUID REFERENCES public.brands(id),
  name TEXT NOT NULL,
  slug TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  section_order TEXT[] DEFAULT NULL,
  hidden_sections TEXT[] DEFAULT NULL,
  guide_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create slug trigger
CREATE TRIGGER set_event_slug
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_slug_from_name();

-- Create updated_at trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for events

-- Users can view their own events
CREATE POLICY "Users can view own events"
  ON public.events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Organization members can view org events
CREATE POLICY "Org members can view org events"
  ON public.events
  FOR SELECT
  USING (
    organization_id IS NOT NULL 
    AND public.is_org_member(auth.uid(), organization_id)
  );

-- Public events can be viewed by anyone
CREATE POLICY "Public events are viewable by anyone"
  ON public.events
  FOR SELECT
  USING (is_public = true);

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON public.events
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Org members can update org events
CREATE POLICY "Org members can update org events"
  ON public.events
  FOR UPDATE
  USING (
    organization_id IS NOT NULL 
    AND public.is_org_member(auth.uid(), organization_id)
  );

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
  ON public.events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Org admins can delete org events
CREATE POLICY "Org admins can delete org events"
  ON public.events
  FOR DELETE
  USING (
    organization_id IS NOT NULL 
    AND public.is_org_admin(auth.uid(), organization_id)
  );