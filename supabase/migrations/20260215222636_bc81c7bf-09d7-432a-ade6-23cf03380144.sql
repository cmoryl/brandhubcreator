
-- Create booth_content_sections table for editable booth detail bullets
CREATE TABLE public.booth_content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  heading TEXT NOT NULL,
  bullets TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.booth_content_sections ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view booth content sections"
  ON public.booth_content_sections FOR SELECT
  USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert booth content sections"
  ON public.booth_content_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update booth content sections"
  ON public.booth_content_sections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete booth content sections"
  ON public.booth_content_sections FOR DELETE
  TO authenticated
  USING (true);

-- Seed from existing static data
INSERT INTO public.booth_content_sections (division_id, heading, bullets, display_order) VALUES
-- Corporate
('corporate', 'Core Messaging', ARRAY['The Language of Global Business', 'Any Customer. Any Language. Any Channel.', 'Any Member, Any Language. Any Format Every Time', 'Engage Locally, Grow Globally'], 0),
('corporate', 'Key Capabilities', ARRAY['Efficient Translation', 'Analytics & Insights', 'Real-Time Updates', 'Improved User Experience & Management', 'Accessibility', 'Same-Day Services', 'Telephonic Support', 'Boutique Interpretation'], 1),
-- Life Sciences
('life-sciences', 'Core Messaging', ARRAY['Simplify Your Path From Lab to Launch', '10 of Top-10 Pharmas, CROs, Biotechs', '100+ Worldwide Offices', '170+ Language Support'], 0),
('life-sciences', 'R&D Services', ARRAY['Regulatory Affairs & Labeling', 'COA/eCOA & Digital Health', 'Patient Recruitment', 'Medical Writing', 'AI/ML Automation & Translation', 'eClinical & CTD eSubmission', 'Linguistic Validation & eCOA'], 1),
-- Legal
('legal', 'Core Messaging', ARRAY['The Global Leader in Legal Technology & Support'], 0),
('legal', 'Key Differentiators', ARRAY['Faster Case Outcomes', 'Innovative Legal Technology', 'Strategic Industry Expertise', 'Seamless Multilingual Support'], 1),
-- IP
('ip', 'Core Messaging', ARRAY['Protect Your IP in Any Country'], 0),
('ip', 'Key Capabilities', ARRAY['Leverage Global Patent Quality, Efficiency, with AI-Powered Translation Memory', 'Streamline Patent Filing Processes', 'Quality, Efficiency and Expertise', 'Accelerate Translation and Global Filing Timelines with GlobalLink'], 1),
-- Digital
('digital', 'Core Messaging', ARRAY['Global Performance for International Brands', 'Any Market. Any Language.', 'Performance-led. Measurable Results.'], 0),
('digital', 'Services', ARRAY['International SEO & Paid Media', 'Performance Content & Copywriting', 'LLM Solutions', 'Social Media Intelligence', 'AI Copywriting', 'Market Intelligence'], 1),
-- Media
('media', 'Localization', ARRAY['Subtitling in all industry formats and 200+ languages and dialects with in-context review', 'Dubbing & Voiceover — Traditional and cloud-based recording, with custom casting', 'In-studio and remote recording, AI-enabled workflows'], 0),
('media', 'Post-Production', ARRAY['Image and sound design and editing', 'VFX, SFX, GFX, and creative post', 'Content Creation — Secure storage, packaging and delivery in all industry formats'], 1),
-- Games
('games', 'Core Messaging', ARRAY['The Language of Global Games', 'Where Boutique Expertise Meets Global Excellence'], 0),
('games', 'Full Lifecycle Services', ARRAY['Art & Development', 'Localization', 'Marketing', 'QA Testing', 'Player Support', 'AI Integration'], 1),
-- Live
('live', 'Core Messaging', ARRAY['Multilingual Event Solutions', 'Powered by GlobalLink', 'Deliver engaging, inclusive, and accessible events for global audiences'], 0),
('live', 'Services', ARRAY['Content Creation', 'Technology Consulting', 'App, Web & Platform Localization', 'Post-Launch Activities'], 1),
-- Health
('health', 'Core Messaging', ARRAY['Serving Seniors Through the Continuum of Care', 'With holistic, outcome-driven support', 'Effortless Localization for all your digital health needs'], 0),
('health', 'Outcome Based Rehabilitation Solutions', ARRAY['Physical, Occupational & Speech Therapy', 'Rehabilitation Services & Staffing', 'Flexible Partnership Models', '30+ Years of Experience'], 1),
-- DataForce
('dataforce', 'Core Messaging', ARRAY['Human Insights for AI that is Reliable. Refined. Respected.'], 0);
