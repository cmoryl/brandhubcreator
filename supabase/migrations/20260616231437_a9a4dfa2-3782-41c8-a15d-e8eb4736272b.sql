CREATE OR REPLACE FUNCTION public.can_use_ai_features()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.can_use_ai_features(uid, NULL::uuid, NULL::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_use_ai_features() TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';