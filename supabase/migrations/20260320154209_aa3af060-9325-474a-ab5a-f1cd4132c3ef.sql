
-- Add brand_id column to bot_config for per-brand agent support
ALTER TABLE public.bot_config ADD COLUMN brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE;

-- Ensure only one bot_config per brand
CREATE UNIQUE INDEX idx_bot_config_brand_agent ON public.bot_config(brand_id) WHERE brand_id IS NOT NULL;
