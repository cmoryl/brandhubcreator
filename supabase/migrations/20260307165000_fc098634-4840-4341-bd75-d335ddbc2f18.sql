
-- Add bias_flags JSONB column to bot_conversations for tracking bias feedback
ALTER TABLE public.bot_conversations 
ADD COLUMN IF NOT EXISTS bias_flags jsonb DEFAULT '[]'::jsonb;

-- Add bias_flags JSONB column to dataforce_assistant_conversations
ALTER TABLE public.dataforce_assistant_conversations 
ADD COLUMN IF NOT EXISTS bias_flags jsonb DEFAULT '[]'::jsonb;

-- Add bias_flagged_count for quick filtering
ALTER TABLE public.bot_conversations 
ADD COLUMN IF NOT EXISTS bias_flagged_count integer DEFAULT 0;

ALTER TABLE public.dataforce_assistant_conversations 
ADD COLUMN IF NOT EXISTS bias_flagged_count integer DEFAULT 0;

COMMENT ON COLUMN public.bot_conversations.bias_flags IS 'Array of bias flag objects: [{message_id, flag_type, description, flagged_at, flagged_by}]';
COMMENT ON COLUMN public.dataforce_assistant_conversations.bias_flags IS 'Array of bias flag objects: [{message_id, flag_type, description, flagged_at, flagged_by}]';
