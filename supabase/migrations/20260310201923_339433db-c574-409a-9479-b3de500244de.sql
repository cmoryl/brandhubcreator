ALTER TABLE public.social_asset_analyses 
ADD COLUMN IF NOT EXISTS text_content_analysis jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS text_content_score integer DEFAULT NULL;