
-- Color Lab saved reports
CREATE TABLE public.color_lab_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_type TEXT NOT NULL DEFAULT 'research',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.color_lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.color_lab_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.color_lab_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.color_lab_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.color_lab_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_color_lab_reports_updated_at
  BEFORE UPDATE ON public.color_lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_color_lab_reports_user ON public.color_lab_reports(user_id, created_at DESC);
