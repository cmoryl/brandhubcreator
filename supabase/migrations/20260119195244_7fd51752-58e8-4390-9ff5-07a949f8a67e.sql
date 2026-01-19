-- Add portal_settings column to organizations table for portal customization
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS portal_settings JSONB DEFAULT '{"heroFullWidth": false}'::jsonb;