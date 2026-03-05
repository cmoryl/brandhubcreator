DO $$
DECLARE
  master_colors jsonb;
  master_typography jsonb;
  master_combos jsonb;
  master_tagline jsonb;
  sub_ids uuid[] := ARRAY[
    '43eef2d7-2560-4405-8369-6c03d49153e4'::uuid,
    '8931ae39-1aba-47c5-8f12-1dc4bc86a310'::uuid,
    'c26eaec2-4dc4-4b3b-a1d1-f57fe13a21da'::uuid,
    'af25dc39-b621-4f0b-a64e-b37af09b0f73'::uuid,
    '54bd93f1-784f-43b5-a620-78d8a214044c'::uuid,
    '8b2ed8fd-9489-48ac-a593-e46afdb8b642'::uuid
  ];
  sub_id uuid;
BEGIN
  SELECT 
    guide_data->'colors',
    guide_data->'typography',
    guide_data->'colorCombinations',
    guide_data->'tagline'
  INTO master_colors, master_typography, master_combos, master_tagline
  FROM events
  WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  FOREACH sub_id IN ARRAY sub_ids LOOP
    UPDATE events
    SET guide_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(guide_data, '{}'::jsonb),
            '{colors}', master_colors
          ),
          '{typography}', master_typography
        ),
        '{colorCombinations}', master_combos
      ),
      '{tagline}', master_tagline
    ),
    updated_at = now()
    WHERE id = sub_id;
  END LOOP;
END;
$$