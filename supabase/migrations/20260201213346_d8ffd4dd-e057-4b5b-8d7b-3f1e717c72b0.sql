-- Add share_token column to brands table (is_public already exists)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brands_share_token ON brands(share_token) WHERE share_token IS NOT NULL;

-- Add RLS policy for public access to shared brands via token
CREATE POLICY "Anyone can view brands with valid share_token"
ON brands FOR SELECT
USING (share_token IS NOT NULL AND is_public = true);