-- Add dot_style and corner_style columns to qr_codes table
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS dot_style text DEFAULT 'square',
ADD COLUMN IF NOT EXISTS corner_style text DEFAULT 'square';

-- Add comment for documentation
COMMENT ON COLUMN public.qr_codes.dot_style IS 'QR code dot style: square, dots, rounded, extra-rounded, classy, classy-rounded';
COMMENT ON COLUMN public.qr_codes.corner_style IS 'QR code corner style: square, dot, extra-rounded';