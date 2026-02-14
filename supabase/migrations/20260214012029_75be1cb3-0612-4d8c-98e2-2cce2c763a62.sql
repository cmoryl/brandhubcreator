-- Enrich get_entity_text_context to include awards, webinars, websites, 
-- website analysis insights, case studies, statistics, and social profiles
CREATE OR REPLACE FUNCTION public.get_entity_text_context(
  p_table text,
  p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_guide jsonb;
  v_name text;
BEGIN
  IF p_table = 'brands' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM brands WHERE id = p_id;
  ELSIF p_table = 'products' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM products WHERE id = p_id;
  ELSIF p_table = 'events' THEN
    SELECT name, guide_data INTO v_name, v_guide FROM events WHERE id = p_id;
  ELSE
    RETURN NULL;
  END IF;

  IF v_guide IS NULL THEN
    RETURN jsonb_build_object('name', v_name);
  END IF;

  v_result := jsonb_build_object(
    'name', v_name,
    'hero_name', v_guide->'hero'->>'name',
    'hero_tagline', v_guide->'hero'->>'tagline',
    'mission', v_guide->'identity'->>'missionStatement',
    'archetype', v_guide->'identity'->>'archetype',
    'tone_of_voice', v_guide->'identity'->'toneOfVoice',
    'primary_tagline', v_guide->'tagline'->>'primary',
    'industry', v_guide->>'industry',
    'colors', (
      SELECT jsonb_agg(jsonb_build_object('name', c->>'name', 'hex', c->>'hex', 'role', c->>'role'))
      FROM jsonb_array_elements(COALESCE(v_guide->'colors', '[]'::jsonb)) AS c
      LIMIT 10
    ),
    'values', (
      SELECT jsonb_agg(c->>'text')
      FROM jsonb_array_elements(COALESCE(v_guide->'values', '[]'::jsonb)) AS c
      WHERE c->>'text' IS NOT NULL
      LIMIT 5
    ),
    'services', (
      SELECT jsonb_agg(c->>'name')
      FROM jsonb_array_elements(COALESCE(v_guide->'services', '[]'::jsonb)) AS c
      WHERE c->>'name' IS NOT NULL
      LIMIT 5
    ),
    'typography', (
      SELECT jsonb_agg(COALESCE(c->>'fontFamily', c->>'family'))
      FROM jsonb_array_elements(COALESCE(v_guide->'typography', '[]'::jsonb)) AS c
      LIMIT 4
    ),
    'logos_count', jsonb_array_length(COALESCE(v_guide->'logos', '[]'::jsonb)),
    'imagery_count', jsonb_array_length(COALESCE(v_guide->'imagery', '[]'::jsonb)),
    'patterns_count', jsonb_array_length(COALESCE(v_guide->'patterns', '[]'::jsonb)),
    'brochures_count', jsonb_array_length(COALESCE(v_guide->'brochures', '[]'::jsonb)),
    'icons_count', jsonb_array_length(COALESCE(v_guide->'brandIcons', '[]'::jsonb)),
    -- Awards: title, organization, year, category
    'awards', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', COALESCE(a->>'title', a->>'name', 'Award'),
        'organization', a->>'organization',
        'year', a->>'year',
        'category', a->>'category',
        'description', left(COALESCE(a->>'description', ''), 120)
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'awards', '[]'::jsonb)) AS a
      LIMIT 8
    ),
    'awards_count', jsonb_array_length(COALESCE(v_guide->'awards', '[]'::jsonb)),
    -- Webinars: title, topic, speakers, description
    'webinars', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', COALESCE(w->>'title', 'Webinar'),
        'topic', w->>'topic',
        'speakers', w->>'speakers',
        'description', left(COALESCE(w->>'description', ''), 120),
        'date', w->>'date'
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'webinars', '[]'::jsonb)) AS w
      LIMIT 5
    ),
    'webinars_count', jsonb_array_length(COALESCE(v_guide->'webinars', '[]'::jsonb)),
    -- Websites: url, label, description, purpose
    'websites', (
      SELECT jsonb_agg(jsonb_build_object(
        'url', COALESCE(ws->>'url', ws->>'name'),
        'label', ws->>'label',
        'description', left(COALESCE(ws->>'description', ''), 100),
        'purpose', ws->>'purpose'
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'websites', '[]'::jsonb)) AS ws
      LIMIT 5
    ),
    'websites_count', jsonb_array_length(COALESCE(v_guide->'websites', '[]'::jsonb)),
    -- Website analysis reports from insights
    'website_analyses', (
      SELECT jsonb_agg(jsonb_build_object(
        'url', COALESCE(i->>'url', i->>'title'),
        'score', i->'report'->>'overallScore',
        'grade', i->'report'->>'grade',
        'summary', left(COALESCE(i->'report'->>'summary', ''), 200)
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'insights', '[]'::jsonb)) AS i
      WHERE i->>'type' = 'website_analysis' OR i->>'subtype' = 'website-report'
      LIMIT 3
    ),
    -- Case studies
    'case_studies', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', COALESCE(cs->>'title', cs->>'name'),
        'description', left(COALESCE(cs->>'description', ''), 100)
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'caseStudies', '[]'::jsonb)) AS cs
      LIMIT 5
    ),
    'case_studies_count', jsonb_array_length(COALESCE(v_guide->'caseStudies', '[]'::jsonb)),
    -- Statistics
    'statistics', (
      SELECT jsonb_agg(jsonb_build_object(
        'label', COALESCE(st->>'label', st->>'title'),
        'value', st->>'value'
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'statistics', '[]'::jsonb)) AS st
      LIMIT 5
    ),
    -- Social profiles
    'social_profiles', (
      SELECT jsonb_agg(jsonb_build_object(
        'platform', COALESCE(sp->>'platform', sp->>'name'),
        'handle', COALESCE(sp->>'handle', sp->>'url')
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'social', '[]'::jsonb)) AS sp
      LIMIT 5
    )
  );

  RETURN v_result;
END;
$$;