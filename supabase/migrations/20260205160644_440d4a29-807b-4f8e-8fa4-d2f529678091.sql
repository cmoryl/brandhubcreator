-- Create dedicated demo_brands table for showcase content
-- This separates demo content from real customer brands

CREATE TABLE public.demo_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'brand' CHECK (type IN ('brand', 'product', 'event')),
  industry_label TEXT,
  gradient_class TEXT DEFAULT 'from-primary to-accent',
  card_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  guide_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  section_order TEXT[] DEFAULT NULL,
  hidden_sections TEXT[] DEFAULT NULL,
  page_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_brands ENABLE ROW LEVEL SECURITY;

-- Public can read active demo brands (for landing page showcase)
CREATE POLICY "Anyone can view active demo brands"
  ON public.demo_brands
  FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage demo brands"
  ON public.demo_brands
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_demo_brands_updated_at
  BEFORE UPDATE ON public.demo_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient ordering
CREATE INDEX idx_demo_brands_display_order ON public.demo_brands(display_order);
CREATE INDEX idx_demo_brands_type ON public.demo_brands(type);
CREATE INDEX idx_demo_brands_slug ON public.demo_brands(slug);

-- Add comment for documentation
COMMENT ON TABLE public.demo_brands IS 'Dedicated table for demo/showcase brands displayed on the landing page. Separate from real customer data.';