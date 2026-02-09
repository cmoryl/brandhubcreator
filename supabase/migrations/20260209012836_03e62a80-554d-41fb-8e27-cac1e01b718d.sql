-- Add api_key column to globallink_config for in-app credential management
ALTER TABLE public.globallink_config 
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add a comment explaining the column
COMMENT ON COLUMN public.globallink_config.api_key IS 'GlobalLink API key for live translation mode. Stored securely per organization.';