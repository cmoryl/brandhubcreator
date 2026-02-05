-- Create a platform settings table for global admin configurations
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read platform settings (they're global config)
CREATE POLICY "Platform settings are readable by authenticated users"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can modify platform settings
CREATE POLICY "Only admins can modify platform settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default global map theme setting
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'global_map_theme',
  '{"tileStyle": "dark", "markerColors": {"studio": "#ec4899", "office": "#6b7280", "headquarters": "#f59e0b", "datacenter": "#22c55e", "partner": "#8b5cf6"}, "uiTheme": {"panelBackground": "rgba(10, 22, 40, 0.9)", "panelText": "rgba(255, 255, 255, 0.7)", "borderColor": "rgba(255, 255, 255, 0.1)", "accentColor": "#00d4ff"}}'::jsonb,
  'Global map theme configuration for all location maps'
);

-- Add trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();