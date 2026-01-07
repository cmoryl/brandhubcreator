
-- Add a creator field so newly created organizations are readable immediately (fixes INSERT ... RETURNING under RLS)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.organizations
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Replace overly-permissive insert policy with a safer one tied to creator
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Allow creator to read the org even before membership row exists
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  (created_by = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
  )
);
