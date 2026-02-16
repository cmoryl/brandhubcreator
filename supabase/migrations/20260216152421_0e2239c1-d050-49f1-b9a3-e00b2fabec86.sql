
-- Update get_entity_text_context to include booth AI analysis data
-- so all AI workers (audits, competitive, research, intelligence) can reference booth insights
CREATE OR REPLACE FUNCTION public.get_entity_text_context(p_table text, p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_guide jsonb;
  v_name text;
  v_db_analyses jsonb;
  v_booth_analyses jsonb;
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

  -- Fetch persisted website analysis reports from the dedicated table
  SELECT jsonb_agg(jsonb_build_object(
    'url', war.website_url,
    'score', war.overall_score,
    'grade', war.grade,
    'summary', left(COALESCE(war.summary, ''), 300),
    'report_data', war.report_data
  ))
  INTO v_db_analyses
  FROM website_analysis_reports war
  WHERE war.entity_id = p_id
    AND war.entity_type = p_table
  ORDER BY war.created_at DESC
  LIMIT 5;

  -- Fetch booth AI analyses linked to this entity's divisions
  -- Booth analyses are connected via booth_custom_divisions or by division_id matching
  SELECT jsonb_agg(jsonb_build_object(
    'division_name', COALESCE(bcd.name, baa.division_id),
    'variant', baa.variant_label,
    'overall_score', baa.overall_score,
    'summary', left(COALESCE((baa.analysis_data->>'summary')::text, ''), 300),
    'design_score', (baa.analysis_data->>'design_score')::int,
    'messaging_score', (baa.analysis_data->>'messaging_score')::int,
    'content_score', (baa.analysis_data->>'content_score')::int,
    'differentiation_score', (baa.analysis_data->>'differentiation_score')::int,
    'engagement_score', (baa.analysis_data->>'engagement_score')::int,
    'production_score', (baa.analysis_data->>'production_score')::int,
    'regional_insights', baa.analysis_data->'regional_insights',
    'top_strengths', (
      SELECT jsonb_agg(s->>'title')
      FROM jsonb_array_elements(COALESCE(baa.strengths, '[]'::jsonb)) AS s
      LIMIT 3
    ),
    'top_improvements', (
      SELECT jsonb_agg(s->>'title')
      FROM jsonb_array_elements(COALESCE(baa.improvements, '[]'::jsonb)) AS s
      WHERE s->>'priority' = 'high'
      LIMIT 3
    ),
    'analyzed_at', baa.created_at
  ))
  INTO v_booth_analyses
  FROM booth_ai_analyses baa
  LEFT JOIN booth_custom_divisions bcd ON bcd.division_id = baa.division_id
  WHERE baa.division_id IN (
    -- Get all division IDs that have been analyzed
    SELECT DISTINCT ba2.division_id FROM booth_ai_analyses ba2
  )
  -- Only get the latest analysis per division+variant combo
  AND baa.created_at = (
    SELECT MAX(ba3.created_at) 
    FROM booth_ai_analyses ba3 
    WHERE ba3.division_id = baa.division_id 
    AND COALESCE(ba3.variant_label, '') = COALESCE(baa.variant_label, '')
  )
  ORDER BY baa.created_at DESC
  LIMIT 12;

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
    'website_analyses', COALESCE(
      v_db_analyses,
      (SELECT jsonb_agg(jsonb_build_object(
        'url', COALESCE(i->>'url', i->>'title'),
        'score', i->'report'->>'overallScore',
        'grade', i->'report'->>'grade',
        'summary', left(COALESCE(i->'report'->>'summary', ''), 200)
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'insights', '[]'::jsonb)) AS i
      WHERE i->>'type' = 'website_analysis' OR i->>'subtype' = 'website-report'
      LIMIT 3)
    ),
    'booth_analyses', v_booth_analyses,
    'case_studies', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', COALESCE(cs->>'title', cs->>'name'),
        'description', left(COALESCE(cs->>'description', ''), 100)
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'caseStudies', '[]'::jsonb)) AS cs
      LIMIT 5
    ),
    'case_studies_count', jsonb_array_length(COALESCE(v_guide->'caseStudies', '[]'::jsonb)),
    'statistics', (
      SELECT jsonb_agg(jsonb_build_object(
        'label', COALESCE(st->>'label', st->>'title'),
        'value', st->>'value'
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'statistics', '[]'::jsonb)) AS st
      LIMIT 5
    ),
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
$function$;
