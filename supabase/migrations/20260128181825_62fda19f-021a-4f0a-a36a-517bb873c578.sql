-- Create a function to fully delete a user including auth record
-- This requires SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Prevent deleting yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Prevent deleting other admins
  IF has_role(target_user_id, 'admin') THEN
    RAISE EXCEPTION 'Cannot delete another admin user';
  END IF;

  -- Delete from organization_members first (foreign key dependency)
  DELETE FROM public.organization_members WHERE user_id = target_user_id;

  -- Delete from user_roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Delete from profiles
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  -- Delete from auth.users (this cascades to auth schema tables)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Add a comment for documentation
COMMENT ON FUNCTION public.admin_delete_user IS 'Fully deletes a user including auth record. Admin only.';