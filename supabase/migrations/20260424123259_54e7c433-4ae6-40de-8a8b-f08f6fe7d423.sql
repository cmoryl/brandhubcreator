DO $$
DECLARE
  v_assets jsonb;
  v_new jsonb := '[]'::jsonb;
  v_item jsonb;
  v_url text;
BEGIN
  SELECT COALESCE(guide_data->'imageAssets', '[]'::jsonb) INTO v_assets
  FROM public.brands WHERE slug = 'transperfect';

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_assets) LOOP
    v_url := v_item->>'url';
    IF v_url LIKE 'https://brandhubcreator.lovable.app/orbs-white/%' THEN
      v_item := jsonb_set(
        v_item,
        '{url}',
        to_jsonb(replace(v_url, 'https://brandhubcreator.lovable.app', ''))
      );
    END IF;
    v_new := v_new || v_item;
  END LOOP;

  UPDATE public.brands
  SET guide_data = jsonb_set(guide_data, '{imageAssets}', v_new),
      updated_at = now()
  WHERE slug = 'transperfect';
END $$;