GRANT SELECT ON public.global_client_logos TO anon;
CREATE POLICY "Anyone can view global logos publicly"
ON public.global_client_logos
FOR SELECT
TO anon
USING (true);