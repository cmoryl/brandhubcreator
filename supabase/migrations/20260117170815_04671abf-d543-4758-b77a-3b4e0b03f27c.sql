-- Create a table for curated demo guides that admins can manage
CREATE TABLE public.demo_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  industry_label TEXT,
  gradient_class TEXT DEFAULT 'from-primary to-accent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id)
);

-- Enable RLS
ALTER TABLE public.demo_guides ENABLE ROW LEVEL SECURITY;

-- Public read access for demo guides
CREATE POLICY "Demo guides are publicly readable"
ON public.demo_guides
FOR SELECT
USING (true);

-- Only admins can manage demo guides
CREATE POLICY "Admins can insert demo guides"
ON public.demo_guides
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update demo guides"
ON public.demo_guides
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete demo guides"
ON public.demo_guides
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_demo_guides_updated_at
BEFORE UPDATE ON public.demo_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for ordering
CREATE INDEX idx_demo_guides_order ON public.demo_guides(display_order);