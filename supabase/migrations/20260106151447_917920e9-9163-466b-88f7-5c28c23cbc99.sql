-- Create organizations/tenants table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f59e0b',
  email_from_name TEXT,
  email_from_address TEXT,
  hide_platform_branding BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{"maxBrands": 10, "maxProducts": 50, "maxUsers": 5, "aiAudit": true, "pdfExport": true, "customDomain": false}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_email TEXT,
  invite_token TEXT UNIQUE,
  invite_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to brands table
ALTER TABLE public.brands 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to products table
ALTER TABLE public.products 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_custom_domain ON public.organizations(custom_domain);
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_invite_token ON public.organization_members(invite_token);
CREATE INDEX idx_brands_org_id ON public.brands(organization_id);
CREATE INDEX idx_products_org_id ON public.products(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = organizations.id 
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Org owners and admins can update their organization" 
ON public.organizations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = organizations.id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for organization_members
CREATE POLICY "Users can view members of their organizations" 
ON public.organization_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members AS om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org owners and admins can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members AS om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can insert themselves as org owner on creation" 
ON public.organization_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- Update brands RLS to include organization context
DROP POLICY IF EXISTS "Users can view their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can create their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;

CREATE POLICY "Users can view brands in their organizations" 
ON public.brands 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = brands.organization_id 
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create brands in their organizations" 
ON public.brands 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = brands.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  )
);

CREATE POLICY "Users can update brands in their organizations" 
ON public.brands 
FOR UPDATE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = brands.organization_id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Users can delete brands in their organizations" 
ON public.brands 
FOR DELETE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = brands.organization_id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);

-- Update products RLS similarly
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Users can view products in their organizations" 
ON public.products 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = products.organization_id 
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create products in their organizations" 
ON public.products 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = products.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin', 'member')
    )
  )
);

CREATE POLICY "Users can update products in their organizations" 
ON public.products 
FOR UPDATE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = products.organization_id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin', 'member')
  )
);

CREATE POLICY "Users can delete products in their organizations" 
ON public.products 
FOR DELETE 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_members.organization_id = products.organization_id 
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();