-- Fix the generate_slug function to have explicit search_path
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
$$;