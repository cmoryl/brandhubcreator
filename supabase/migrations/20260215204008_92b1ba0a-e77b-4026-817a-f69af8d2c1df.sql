
-- Create booth_key_stats table for per-division key stats with optional SVG icons
CREATE TABLE public.booth_key_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon_svg TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.booth_key_stats ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view booth key stats"
  ON public.booth_key_stats FOR SELECT
  USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert booth key stats"
  ON public.booth_key_stats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update booth key stats"
  ON public.booth_key_stats FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete booth key stats"
  ON public.booth_key_stats FOR DELETE
  TO authenticated
  USING (true);

-- Seed default stats extracted from booth content
INSERT INTO public.booth_key_stats (division_id, label, value, display_order) VALUES
  -- Corporate
  ('corporate', 'Languages', '170+', 0),
  ('corporate', 'Offices', '100+', 1),
  -- Life Sciences
  ('life-sciences', 'Top-10 Pharmas Served', '10 of 10', 0),
  ('life-sciences', 'Languages', '170+', 1),
  ('life-sciences', 'Worldwide Offices', '100+', 2),
  -- Legal
  ('legal', 'Global Reach', 'Worldwide', 0),
  ('legal', 'Legal Technology', 'Leader', 1),
  -- IP
  ('ip', 'Patent Filing', 'Global', 0),
  ('ip', 'AI-Powered', 'Translation', 1),
  -- Digital
  ('digital', 'Markets', 'Global', 0),
  ('digital', 'AI Copywriting', 'Powered', 1),
  -- Media
  ('media', 'Recording Studios', '130+', 0),
  ('media', 'Mixing Rooms', '51+', 1),
  ('media', 'Dolby Atmos Rooms', '3', 2),
  -- Games
  ('games', 'Full Lifecycle', 'Services', 0),
  ('games', 'AI Integration', 'Enabled', 1),
  -- Live
  ('live', 'Event Solutions', 'Multilingual', 0),
  ('live', 'GlobalLink', 'Powered', 1),
  -- Health
  ('health', 'Experience', '30+ Years', 0),
  ('health', 'Therapy Services', '3 Types', 1),
  -- DataForce
  ('dataforce', 'AI Disciplines', '6', 0),
  ('dataforce', 'Capabilities', '46+', 1),
  ('dataforce', 'Use Cases', '140+', 2),
  -- Trial Interactive
  ('trial-interactive', 'Platform', 'eClinical', 0),
  ('trial-interactive', 'AI-Powered', 'Intelligence', 1),
  -- G3
  ('g3', 'Certifications', 'WBENC & ISO', 0),
  ('g3', 'Content Solutions', 'AI-Driven', 1);
