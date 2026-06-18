
-- Re-categorize existing brands listed in the screenshots
UPDATE public.global_client_logos
SET category = 'PartnerLink Logos', updated_at = now()
WHERE name IN ('Microsoft','Google','Apple','SAP (Commerce Cloud)','Amazon','Coca-Cola','Adidas','American Airlines','Hilton','Lufthansa','Mandarin Oriental','Akeneo');

-- Insert new partner brands (skip if name already exists)
INSERT INTO public.global_client_logos (organization_id, name, category, website_url, files)
SELECT 'ec180296-dfe8-4345-869e-66b524e0a12c'::uuid, n.name, 'PartnerLink Logos', n.url, '[]'::jsonb
FROM (VALUES
  ('Oracle','https://www.oracle.com'),
  ('Cisco','https://www.cisco.com'),
  ('Morgan Stanley','https://www.morganstanley.com'),
  ('American Express','https://www.americanexpress.com'),
  ('Blackstone','https://www.blackstone.com'),
  ('Charles Schwab','https://www.schwab.com'),
  ('Pfizer','https://www.pfizer.com'),
  ('Johnson & Johnson','https://www.jnj.com'),
  ('AstraZeneca','https://www.astrazeneca.com'),
  ('Sanofi','https://www.sanofi.com'),
  ('Moderna','https://www.modernatx.com'),
  ('Unilever','https://www.unilever.com'),
  ('P&G','https://us.pg.com'),
  ('L''Oréal','https://www.loreal.com'),
  ('LEGO','https://www.lego.com'),
  ('LVMH','https://www.lvmh.com'),
  ('United Airlines','https://www.united.com'),
  ('Marriott','https://www.marriott.com'),
  ('Baker McKenzie','https://www.bakermckenzie.com'),
  ('Latham & Watkins','https://www.lw.com'),
  ('Freshfields','https://www.freshfields.com'),
  ('Blizzard','https://www.blizzard.com'),
  ('Haas','https://www.haascnc.com'),
  ('Marks & Spencer','https://www.marksandspencer.com'),
  ('Adobe','https://www.adobe.com'),
  ('Hewlett Packard','https://www.hp.com'),
  ('Lavazza','https://www.lavazza.com'),
  ('Heineken','https://www.heineken.com'),
  ('ResMed','https://www.resmed.com'),
  ('TUI','https://www.tui.com'),
  ('Western Digital','https://www.westerndigital.com'),
  ('Xbox','https://www.xbox.com')
) AS n(name, url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.global_client_logos g WHERE lower(g.name) = lower(n.name)
);
