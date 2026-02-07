-- Create table for user logo favorites
CREATE TABLE public.user_logo_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- Reference to the entity (brand, product, or event) that owns the logo
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('brand', 'product', 'event')),
  -- The logo's id within the entity's guide_data->logos array
  logo_id TEXT NOT NULL,
  -- Denormalized fields for quick display without joins
  logo_name TEXT,
  logo_url TEXT,
  logo_variant TEXT,
  entity_name TEXT,
  entity_slug TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure unique favorites per user
  UNIQUE(user_id, entity_id, logo_id)
);

-- Create index for fast lookup by user
CREATE INDEX idx_user_logo_favorites_user_id ON public.user_logo_favorites(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_logo_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own favorites
CREATE POLICY "Users can view their own logo favorites"
ON public.user_logo_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own logo favorites"
ON public.user_logo_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logo favorites"
ON public.user_logo_favorites
FOR DELETE
USING (auth.uid() = user_id);