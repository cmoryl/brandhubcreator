-- Create a lightweight function that extracts only section metadata from guide_data
-- Returns a compact JSON with just the keys and their array lengths / key presence
-- This avoids transferring the full guide_data blob (can be 70MB+) to edge functions
CREATE OR REPLACE FUNCTION public.get_brand_audit_summary(p_brand_id uuid, p_entity_type text DEFAULT 'brand')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guide_data jsonb;
  v_name text;
  v_hidden text[];
  v_result jsonb;
BEGIN
  IF p_entity_type = 'product' THEN
    SELECT name, guide_data, hidden_sections INTO v_name, v_guide_data, v_hidden
    FROM products WHERE id = p_brand_id;
  ELSIF p_entity_type = 'event' THEN
    SELECT name, guide_data, hidden_sections INTO v_name, v_guide_data, v_hidden
    FROM events WHERE id = p_brand_id;
  ELSE
    SELECT name, guide_data, hidden_sections INTO v_name, v_guide_data, v_hidden
    FROM brands WHERE id = p_brand_id;
  END IF;

  IF v_guide_data IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_result := jsonb_build_object(
    'name', v_name,
    'hiddenSections', to_jsonb(COALESCE(v_hidden, ARRAY[]::text[])),
    'hero', jsonb_build_object(
      'name', v_guide_data->'hero'->>'name',
      'tagline', v_guide_data->'hero'->>'tagline',
      'description', left(v_guide_data->'hero'->>'description', 150),
      'hasImage', (v_guide_data->'hero'->>'imageUrl') IS NOT NULL,
      'hasCover', (v_guide_data->'hero'->>'coverImage') IS NOT NULL,
      'hasCard', (v_guide_data->'hero'->>'cardImage') IS NOT NULL
    ),
    'identity', jsonb_build_object(
      'missionStatement', left(v_guide_data->'identity'->>'missionStatement', 200),
      'visionStatement', left(v_guide_data->'identity'->>'visionStatement', 200),
      'archetype', v_guide_data->'identity'->>'archetype',
      'hasBrandPromise', (v_guide_data->'identity'->>'brandPromise') IS NOT NULL,
      'hasPersonality', (v_guide_data->'identity'->>'personality') IS NOT NULL,
      'hasVoiceTone', (v_guide_data->'identity'->>'voiceTone') IS NOT NULL,
      'hasBrandStory', (v_guide_data->'identity'->>'brandStory') IS NOT NULL
    ),
    'colorsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'colors') = 'array' THEN v_guide_data->'colors' ELSE '[]'::jsonb END), 0),
    'colorNames', (SELECT jsonb_agg(c->>'name') FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_guide_data->'colors') = 'array' THEN v_guide_data->'colors' ELSE '[]'::jsonb END) AS c LIMIT 6),
    'typographyCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'typography') = 'array' THEN v_guide_data->'typography' ELSE '[]'::jsonb END), 0),
    'fontNames', (SELECT jsonb_agg(t->>'family') FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_guide_data->'typography') = 'array' THEN v_guide_data->'typography' ELSE '[]'::jsonb END) AS t LIMIT 4),
    'logosCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'logos') = 'array' THEN v_guide_data->'logos' ELSE '[]'::jsonb END), 0),
    'valuesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'values') = 'array' THEN v_guide_data->'values' ELSE '[]'::jsonb END), 0),
    'servicesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'services') = 'array' THEN v_guide_data->'services' ELSE '[]'::jsonb END), 0),
    'gradientsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'gradients') = 'array' THEN v_guide_data->'gradients' ELSE '[]'::jsonb END), 0),
    'patternsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'patterns') = 'array' THEN v_guide_data->'patterns' ELSE '[]'::jsonb END), 0),
    'socialCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'social') = 'array' THEN v_guide_data->'social' ELSE '[]'::jsonb END), 0),
    'socialAssetsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'socialAssets') = 'array' THEN v_guide_data->'socialAssets' ELSE '[]'::jsonb END), 0),
    'websitesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'websites') = 'array' THEN v_guide_data->'websites' ELSE '[]'::jsonb END), 0),
    'brandIconsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'brandIcons') = 'array' THEN v_guide_data->'brandIcons' ELSE '[]'::jsonb END), 0),
    'iconographyCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'iconography') = 'array' THEN v_guide_data->'iconography' ELSE '[]'::jsonb END), 0),
    'imageryCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'imagery') = 'array' THEN v_guide_data->'imagery' ELSE '[]'::jsonb END), 0),
    'imageAssetsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'imageAssets') = 'array' THEN v_guide_data->'imageAssets' ELSE '[]'::jsonb END), 0),
    'misuseCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'misuse') = 'array' THEN v_guide_data->'misuse' ELSE '[]'::jsonb END), 0),
    'templatesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'templates') = 'array' THEN v_guide_data->'templates' ELSE '[]'::jsonb END), 0),
    'brochuresCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'brochures') = 'array' THEN v_guide_data->'brochures' ELSE '[]'::jsonb END), 0),
    'presentationTemplatesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'presentationTemplates') = 'array' THEN v_guide_data->'presentationTemplates' ELSE '[]'::jsonb END), 0),
    'awardsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'awards') = 'array' THEN v_guide_data->'awards' ELSE '[]'::jsonb END), 0),
    'statisticsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'statistics') = 'array' THEN v_guide_data->'statistics' ELSE '[]'::jsonb END), 0),
    'clientLogosCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'clientLogos') = 'array' THEN v_guide_data->'clientLogos' ELSE '[]'::jsonb END), 0),
    'sponsorLogosCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'sponsorLogos') = 'array' THEN v_guide_data->'sponsorLogos' ELSE '[]'::jsonb END), 0),
    'signaturesCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'signatures') = 'array' THEN v_guide_data->'signatures' ELSE '[]'::jsonb END), 0),
    'colorCombinationsCount', COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(v_guide_data->'colorCombinations') = 'array' THEN v_guide_data->'colorCombinations' ELSE '[]'::jsonb END), 0),
    'hasQrUrl', (v_guide_data->'qr'->>'defaultUrl') IS NOT NULL
  );

  RETURN v_result;
END;
$$;