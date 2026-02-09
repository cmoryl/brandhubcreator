-- Brand Creative Studio: Prompt Library and Asset Generation History

-- Prompt Library table for reusable AI prompts
CREATE TABLE public.brand_prompt_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Prompt details
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'social', 'marketing', 'product', 'event', 'pattern', 'photography'
  prompt_template TEXT NOT NULL,
  description TEXT,
  
  -- Output configuration
  output_format TEXT DEFAULT 'image', -- 'image', 'video', 'text'
  aspect_ratio TEXT DEFAULT '1:1', -- '1:1', '16:9', '4:3', '9:16', 'custom'
  style_preset TEXT, -- 'photorealistic', 'illustration', 'minimal', 'bold', '3d'
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Flags
  is_default BOOLEAN DEFAULT false, -- System defaults
  is_shared BOOLEAN DEFAULT false, -- Shared across org
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generated assets history
CREATE TABLE public.brand_generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Asset info
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  asset_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'pattern', 'gradient', 'icon'
  
  -- Generated content
  image_url TEXT,
  thumbnail_url TEXT,
  prompt_used TEXT NOT NULL,
  prompt_id UUID REFERENCES public.brand_prompt_library(id) ON DELETE SET NULL,
  
  -- Generation metadata
  model_used TEXT DEFAULT 'gemini-2.5-flash-image',
  generation_params JSONB DEFAULT '{}',
  aspect_ratio TEXT,
  
  -- Quality tracking
  rating INTEGER, -- 1-5 stars
  is_approved BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false, -- Added to brand assets
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Design tokens export configurations
CREATE TABLE public.brand_design_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  -- Token configuration
  name TEXT NOT NULL DEFAULT 'Default',
  format TEXT NOT NULL DEFAULT 'css', -- 'css', 'scss', 'json', 'figma', 'tailwind'
  
  -- Generated tokens (cached)
  tokens_data JSONB NOT NULL DEFAULT '{}',
  css_output TEXT,
  
  -- Customization
  include_colors BOOLEAN DEFAULT true,
  include_typography BOOLEAN DEFAULT true,
  include_spacing BOOLEAN DEFAULT false,
  include_shadows BOOLEAN DEFAULT false,
  prefix TEXT DEFAULT 'brand',
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(entity_id, entity_type, format)
);

-- Enable RLS
ALTER TABLE public.brand_prompt_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_design_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt library
CREATE POLICY "Users can view prompts for their entities"
  ON public.brand_prompt_library FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    is_shared = true AND organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage prompts for their entities"
  ON public.brand_prompt_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    )
  );

-- RLS policies for generated assets
CREATE POLICY "Users can view generated assets for their entities"
  ON public.brand_generated_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage generated assets for their entities"
  ON public.brand_generated_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    )
  );

-- RLS policies for design tokens
CREATE POLICY "Users can view design tokens for their entities"
  ON public.brand_design_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage design tokens for their entities"
  ON public.brand_design_tokens FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.products WHERE id = entity_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.events WHERE id = entity_id AND user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_prompt_library_entity ON public.brand_prompt_library(entity_id, entity_type);
CREATE INDEX idx_prompt_library_org ON public.brand_prompt_library(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_generated_assets_entity ON public.brand_generated_assets(entity_id, entity_type);
CREATE INDEX idx_design_tokens_entity ON public.brand_design_tokens(entity_id, entity_type);