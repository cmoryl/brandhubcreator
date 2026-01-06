-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  section_order TEXT[] DEFAULT NULL,
  hidden_sections TEXT[] DEFAULT NULL,
  guide_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  parent_brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  section_order TEXT[] DEFAULT NULL,
  hidden_sections TEXT[] DEFAULT NULL,
  guide_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brands
CREATE POLICY "Users can view their own brands" 
ON public.brands 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" 
ON public.brands 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" 
ON public.brands 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" 
ON public.brands 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for products
CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_brands_user_id ON public.brands(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_parent_brand_id ON public.products(parent_brand_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();