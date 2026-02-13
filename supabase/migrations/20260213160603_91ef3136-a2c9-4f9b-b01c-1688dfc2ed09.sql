
-- Restore public read access for brand_intelligence on public entities (needed for Insights access gate)
CREATE POLICY "Public can view intelligence for public entities"
ON public.brand_intelligence
FOR SELECT
TO anon, authenticated
USING (
  (entity_type = 'brand' AND entity_id IN (SELECT id FROM public.brands WHERE is_public = true))
  OR (entity_type = 'product' AND entity_id IN (SELECT id FROM public.products WHERE is_public = true))
  OR (entity_type = 'event' AND entity_id IN (SELECT id FROM public.events WHERE is_public = true))
);

-- Restore public read access for competitive_analysis_reports on public entities
CREATE POLICY "Public can view reports for public entities"
ON public.competitive_analysis_reports
FOR SELECT
TO anon, authenticated
USING (
  (entity_type = 'brand' AND entity_id IN (SELECT id FROM public.brands WHERE is_public = true))
  OR (entity_type = 'product' AND entity_id IN (SELECT id FROM public.products WHERE is_public = true))
  OR (entity_type = 'event' AND entity_id IN (SELECT id FROM public.events WHERE is_public = true))
);
