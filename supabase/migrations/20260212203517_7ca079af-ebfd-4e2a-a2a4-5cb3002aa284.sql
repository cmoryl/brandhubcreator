-- Allow public read access to competitive analysis reports for public brands/products/events
CREATE POLICY "Public can view reports for public entities"
ON public.competitive_analysis_reports
FOR SELECT
USING (
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM brands WHERE id = competitive_analysis_reports.entity_id AND is_public = true
  ))
  OR (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM products WHERE id = competitive_analysis_reports.entity_id AND is_public = true
  ))
  OR (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM events WHERE id = competitive_analysis_reports.entity_id AND is_public = true
  ))
);

-- Allow public read access to brand intelligence for public entities
CREATE POLICY "Public can view intelligence for public entities"
ON public.brand_intelligence
FOR SELECT
USING (
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM brands WHERE id = brand_intelligence.entity_id AND is_public = true
  ))
  OR (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM products WHERE id = brand_intelligence.entity_id AND is_public = true
  ))
  OR (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM events WHERE id = brand_intelligence.entity_id AND is_public = true
  ))
);

-- Allow public read access to compliance jobs for public entities
CREATE POLICY "Public can view compliance for public entities"
ON public.dataforce_compliance_jobs
FOR SELECT
USING (
  (entity_type = 'brand' AND EXISTS (
    SELECT 1 FROM brands WHERE id = dataforce_compliance_jobs.entity_id AND is_public = true
  ))
  OR (entity_type = 'product' AND EXISTS (
    SELECT 1 FROM products WHERE id = dataforce_compliance_jobs.entity_id AND is_public = true
  ))
  OR (entity_type = 'event' AND EXISTS (
    SELECT 1 FROM events WHERE id = dataforce_compliance_jobs.entity_id AND is_public = true
  ))
);