-- Add color science module columns to bias_awareness_scans
ALTER TABLE public.bias_awareness_scans 
ADD COLUMN IF NOT EXISTS color_accessibility_module JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_strategy_module JSONB DEFAULT NULL;