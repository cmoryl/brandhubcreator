
-- Create booth QR codes table
CREATE TABLE public.booth_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.booth_qr_codes ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view booth QR codes"
ON public.booth_qr_codes FOR SELECT USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can insert booth QR codes"
ON public.booth_qr_codes FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update booth QR codes"
ON public.booth_qr_codes FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete booth QR codes"
ON public.booth_qr_codes FOR DELETE USING (true);
