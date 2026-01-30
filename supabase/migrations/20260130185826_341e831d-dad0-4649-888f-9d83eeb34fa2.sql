-- Create table for saved report prompts
CREATE TABLE public.saved_report_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_report_prompts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see org prompts + their own + defaults
CREATE POLICY "Users can view accessible prompts"
ON public.saved_report_prompts
FOR SELECT
USING (
  is_default = true 
  OR created_by = auth.uid()
  OR (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

CREATE POLICY "Users can create prompts"
ON public.saved_report_prompts
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own prompts"
ON public.saved_report_prompts
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own prompts"
ON public.saved_report_prompts
FOR DELETE
USING (auth.uid() = created_by);

-- Add timestamp trigger
CREATE TRIGGER update_saved_report_prompts_updated_at
BEFORE UPDATE ON public.saved_report_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default prompts
INSERT INTO public.saved_report_prompts (name, prompt, category, is_default) VALUES
('Brand Health Analysis', 'Analyze the overall health and completeness of these brands. Identify which brands need the most attention and provide specific recommendations for improvement.', 'analysis', true),
('Competitive Comparison', 'Compare these brands and identify their unique strengths and positioning. What differentiates each brand from the others?', 'comparison', true),
('Content Gaps Report', 'Review these brands and identify missing content sections, incomplete information, and areas that need more development.', 'audit', true),
('Brand Consistency Check', 'Evaluate the consistency of brand elements (colors, typography, messaging) across these brands. Flag any inconsistencies or conflicts.', 'audit', true),
('Executive Summary', 'Generate a brief executive summary of the brand portfolio, highlighting key metrics, recent activity, and strategic recommendations.', 'summary', true);