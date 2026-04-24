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
  v_imagery_samples jsonb;
  v_approved_imagery_samples jsonb;
  v_image_assets_samples jsonb;
  v_collateral_samples jsonb;
  v_imagery_total int;
  v_approved_total int;
  v_image_assets_total int;
  v_imagery_avoid_samples jsonb;
  v_imagery_avoid_total int;
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

  SELECT jsonb_agg(jsonb_build_object(
    'url', sub.website_url, 'score', sub.overall_score, 'grade', sub.grade,
    'summary', left(COALESCE(sub.summary, ''), 300), 'report_data', sub.report_data
  ))
  INTO v_db_analyses
  FROM (
    SELECT war.website_url, war.overall_score, war.grade, war.summary, war.report_data
    FROM website_analysis_reports war
    WHERE war.entity_id = p_id AND war.entity_type = p_table
    ORDER BY war.created_at DESC LIMIT 5
  ) sub;

  SELECT jsonb_agg(jsonb_build_object(
    'division_name', sub.division_name, 'variant', sub.variant_label,
    'overall_score', sub.overall_score, 'summary', sub.summary,
    'design_score', sub.design_score, 'messaging_score', sub.messaging_score,
    'content_score', sub.content_score, 'differentiation_score', sub.differentiation_score,
    'engagement_score', sub.engagement_score, 'production_score', sub.production_score,
    'regional_insights', sub.regional_insights, 'top_strengths', sub.top_strengths,
    'top_improvements', sub.top_improvements, 'analyzed_at', sub.created_at
  ))
  INTO v_booth_analyses
  FROM (
    SELECT 
      COALESCE(bcd.name, baa.division_id) AS division_name, baa.variant_label,
      baa.overall_score,
      left(COALESCE((baa.analysis_data->>'summary')::text, ''), 300) AS summary,
      (baa.analysis_data->>'design_score')::int AS design_score,
      (baa.analysis_data->>'messaging_score')::int AS messaging_score,
      (baa.analysis_data->>'content_score')::int AS content_score,
      (baa.analysis_data->>'differentiation_score')::int AS differentiation_score,
      (baa.analysis_data->>'engagement_score')::int AS engagement_score,
      (baa.analysis_data->>'production_score')::int AS production_score,
      baa.analysis_data->'regional_insights' AS regional_insights,
      (SELECT jsonb_agg(s->>'title') FROM jsonb_array_elements(COALESCE(baa.strengths, '[]'::jsonb)) AS s LIMIT 3) AS top_strengths,
      (SELECT jsonb_agg(s->>'title') FROM jsonb_array_elements(COALESCE(baa.improvements, '[]'::jsonb)) AS s WHERE s->>'priority' = 'high' LIMIT 3) AS top_improvements,
      baa.created_at
    FROM booth_ai_analyses baa
    LEFT JOIN booth_custom_divisions bcd ON bcd.division_id = baa.division_id
    WHERE baa.created_at = (SELECT MAX(ba3.created_at) FROM booth_ai_analyses ba3 WHERE ba3.division_id = baa.division_id AND COALESCE(ba3.variant_label, '') = COALESCE(baa.variant_label, ''))
    ORDER BY baa.created_at DESC LIMIT 12
  ) sub;

  SELECT jsonb_agg(jsonb_build_object(
    'url', i->>'url',
    'type', COALESCE(i->>'type', 'do'),
    'description', left(COALESCE(i->>'description', ''), 200),
    'source', 'visualDirection'
  )), COUNT(*)::int
  INTO v_imagery_samples, v_imagery_total
  FROM (
    SELECT i FROM jsonb_array_elements(COALESCE(v_guide->'imagery', '[]'::jsonb)) AS i
    WHERE i->>'url' IS NOT NULL AND length(i->>'url') > 5
    LIMIT 12
  ) sub;

  SELECT 
    jsonb_agg(jsonb_build_object(
      'url', img->>'url',
      'section', section_name,
      'tags', img->'tags',
      'category', img->>'category',
      'source', 'approvedImagery'
    )),
    (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(s->'images', '[]'::jsonb))), 0)::int 
     FROM jsonb_array_elements(COALESCE(v_guide->'approvedImagery'->'sections', '[]'::jsonb)) AS s)
  INTO v_approved_imagery_samples, v_approved_total
  FROM (
    SELECT 
      img,
      s->>'name' AS section_name
    FROM jsonb_array_elements(COALESCE(v_guide->'approvedImagery'->'sections', '[]'::jsonb)) AS s,
         jsonb_array_elements(COALESCE(s->'images', '[]'::jsonb)) AS img
    WHERE img->>'url' IS NOT NULL AND length(img->>'url') > 5
    LIMIT 16
  ) sub;

  SELECT jsonb_agg(jsonb_build_object(
    'url', COALESCE(ia->>'thumbnailUrl', ia->>'url'),
    'name', ia->>'name',
    'category', ia->>'category',
    'source', 'imageAssets'
  )), (SELECT jsonb_array_length(COALESCE(v_guide->'imageAssets', '[]'::jsonb)))::int
  INTO v_image_assets_samples, v_image_assets_total
  FROM (
    SELECT ia FROM jsonb_array_elements(COALESCE(v_guide->'imageAssets', '[]'::jsonb)) AS ia
    WHERE COALESCE(ia->>'thumbnailUrl', ia->>'url') IS NOT NULL
    LIMIT 8
  ) sub;

  -- NEW: Imagery AVOID list (negative feedback the brand team has rejected)
  SELECT jsonb_agg(jsonb_build_object(
    'url', av->>'url',
    'name', av->>'name',
    'reason', av->>'reason',
    'rejectedAt', av->>'rejectedAt',
    'source', 'imageryAvoidList'
  )), (SELECT jsonb_array_length(COALESCE(v_guide->'imageryAvoidList', '[]'::jsonb)))::int
  INTO v_imagery_avoid_samples, v_imagery_avoid_total
  FROM (
    SELECT av FROM jsonb_array_elements(COALESCE(v_guide->'imageryAvoidList', '[]'::jsonb)) AS av
    WHERE av->>'url' IS NOT NULL
    ORDER BY (av->>'rejectedAt') DESC NULLS LAST
    LIMIT 12
  ) sub;

  SELECT jsonb_agg(item) INTO v_collateral_samples FROM (
    SELECT jsonb_build_object(
      'url', COALESCE(b->>'thumbnailUrl', b->>'previewUrl'),
      'title', b->>'title',
      'category', b->>'category',
      'source', 'brochure'
    ) AS item
    FROM jsonb_array_elements(COALESCE(v_guide->'brochures', '[]'::jsonb)) AS b
    WHERE COALESCE(b->>'thumbnailUrl', b->>'previewUrl') IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object(
      'url', COALESCE(pt->>'cardImageUrl', pt->>'thumbnailUrl', (pt->'slides'->0->>'thumbnailUrl')),
      'title', pt->>'name',
      'category', COALESCE(pt->>'category', pt->>'fileType'),
      'source', 'presentation'
    )
    FROM jsonb_array_elements(COALESCE(v_guide->'presentationTemplates', '[]'::jsonb)) AS pt
    WHERE COALESCE(pt->>'cardImageUrl', pt->>'thumbnailUrl', (pt->'slides'->0->>'thumbnailUrl')) IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object(
      'url', t->>'thumbnailUrl',
      'title', t->>'name',
      'category', t->>'fileType',
      'source', 'template'
    )
    FROM jsonb_array_elements(COALESCE(v_guide->'templates', '[]'::jsonb)) AS t
    WHERE t->>'thumbnailUrl' IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object(
      'url', COALESCE(cs->>'imageUrl', cs->>'thumbnailUrl', cs->>'coverImage'),
      'title', cs->>'title',
      'category', 'case-study',
      'source', 'caseStudy'
    )
    FROM jsonb_array_elements(COALESCE(v_guide->'caseStudies', '[]'::jsonb)) AS cs
    WHERE COALESCE(cs->>'imageUrl', cs->>'thumbnailUrl', cs->>'coverImage') IS NOT NULL
    LIMIT 12
  ) collated;

  v_result := jsonb_build_object(
    'name', v_name,
    'hero_name', v_guide->'hero'->>'name',
    'hero_tagline', v_guide->'hero'->>'tagline',
    'mission', v_guide->'identity'->>'missionStatement',
    'archetype', v_guide->'identity'->>'archetype',
    'tone_of_voice', v_guide->'identity'->'toneOfVoice',
    'primary_tagline', v_guide->'tagline'->>'primary',
    'industry', v_guide->>'industry',
    'colors', (SELECT jsonb_agg(jsonb_build_object('name', c->>'name', 'hex', c->>'hex', 'role', c->>'role')) FROM jsonb_array_elements(COALESCE(v_guide->'colors', '[]'::jsonb)) AS c LIMIT 10),
    'values', (SELECT jsonb_agg(c->>'text') FROM jsonb_array_elements(COALESCE(v_guide->'values', '[]'::jsonb)) AS c WHERE c->>'text' IS NOT NULL LIMIT 5),
    'services', (SELECT jsonb_agg(c->>'name') FROM jsonb_array_elements(COALESCE(v_guide->'services', '[]'::jsonb)) AS c WHERE c->>'name' IS NOT NULL LIMIT 5),
    'typography', (SELECT jsonb_agg(COALESCE(c->>'fontFamily', c->>'family')) FROM jsonb_array_elements(COALESCE(v_guide->'typography', '[]'::jsonb)) AS c LIMIT 4),
    'logos_count', jsonb_array_length(COALESCE(v_guide->'logos', '[]'::jsonb)),
    'imagery_count', jsonb_array_length(COALESCE(v_guide->'imagery', '[]'::jsonb)),
    'patterns_count', jsonb_array_length(COALESCE(v_guide->'patterns', '[]'::jsonb)),
    'brochures_count', jsonb_array_length(COALESCE(v_guide->'brochures', '[]'::jsonb)),
    'icons_count', jsonb_array_length(COALESCE(v_guide->'brandIcons', '[]'::jsonb)),
    'presentations_count', jsonb_array_length(COALESCE(v_guide->'presentationTemplates', '[]'::jsonb)),
    'templates_count', jsonb_array_length(COALESCE(v_guide->'templates', '[]'::jsonb)),
    'image_assets_count', COALESCE(v_image_assets_total, 0),
    'approved_imagery_count', COALESCE(v_approved_total, 0),
    'approved_imagery_sections', (
      SELECT jsonb_agg(jsonb_build_object(
        'name', s->>'name',
        'description', left(COALESCE(s->>'description', ''), 160),
        'image_count', jsonb_array_length(COALESCE(s->'images', '[]'::jsonb))
      ))
      FROM jsonb_array_elements(COALESCE(v_guide->'approvedImagery'->'sections', '[]'::jsonb)) AS s
    ),
    'imagery_samples', COALESCE(v_imagery_samples, '[]'::jsonb),
    'approved_imagery_samples', COALESCE(v_approved_imagery_samples, '[]'::jsonb),
    'image_assets_samples', COALESCE(v_image_assets_samples, '[]'::jsonb),
    'collateral_samples', COALESCE(v_collateral_samples, '[]'::jsonb),
    -- NEW: Negative feedback the AI must steer away from on future generations
    'imagery_avoid_count', COALESCE(v_imagery_avoid_total, 0),
    'imagery_avoid_samples', COALESCE(v_imagery_avoid_samples, '[]'::jsonb),
    'awards', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(a->>'title', a->>'name', 'Award'), 'organization', a->>'organization', 'year', a->>'year', 'category', a->>'category', 'description', left(COALESCE(a->>'description', ''), 120))) FROM jsonb_array_elements(COALESCE(v_guide->'awards', '[]'::jsonb)) AS a LIMIT 8),
    'awards_count', jsonb_array_length(COALESCE(v_guide->'awards', '[]'::jsonb)),
    'webinars', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(w->>'title', 'Webinar'), 'topic', w->>'topic', 'speakers', w->>'speakers', 'description', left(COALESCE(w->>'description', ''), 120), 'date', w->>'date')) FROM jsonb_array_elements(COALESCE(v_guide->'webinars', '[]'::jsonb)) AS w LIMIT 5),
    'webinars_count', jsonb_array_length(COALESCE(v_guide->'webinars', '[]'::jsonb)),
    'websites', (SELECT jsonb_agg(jsonb_build_object('url', COALESCE(ws->>'url', ws->>'name'), 'label', ws->>'label', 'description', left(COALESCE(ws->>'description', ''), 100), 'purpose', ws->>'purpose')) FROM jsonb_array_elements(COALESCE(v_guide->'websites', '[]'::jsonb)) AS ws LIMIT 5),
    'websites_count', jsonb_array_length(COALESCE(v_guide->'websites', '[]'::jsonb)),
    'website_analyses', COALESCE(v_db_analyses, (SELECT jsonb_agg(jsonb_build_object('url', COALESCE(i->>'url', i->>'title'), 'score', i->'report'->>'overallScore', 'grade', i->'report'->>'grade', 'summary', left(COALESCE(i->'report'->>'summary', ''), 200))) FROM jsonb_array_elements(COALESCE(v_guide->'insights', '[]'::jsonb)) AS i WHERE i->>'type' = 'website_analysis' OR i->>'subtype' = 'website-report' LIMIT 3)),
    'booth_analyses', v_booth_analyses,
    'case_studies', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(cs->>'title', cs->>'name'), 'description', left(COALESCE(cs->>'description', ''), 100))) FROM jsonb_array_elements(COALESCE(v_guide->'caseStudies', '[]'::jsonb)) AS cs LIMIT 5),
    'case_studies_count', jsonb_array_length(COALESCE(v_guide->'caseStudies', '[]'::jsonb)),
    'statistics', (SELECT jsonb_agg(jsonb_build_object('label', COALESCE(st->>'label', st->>'title'), 'value', st->>'value')) FROM jsonb_array_elements(COALESCE(v_guide->'statistics', '[]'::jsonb)) AS st LIMIT 5),
    'social_profiles', (SELECT jsonb_agg(jsonb_build_object('platform', COALESCE(sp->>'platform', sp->>'name'), 'handle', COALESCE(sp->>'handle', sp->>'url'))) FROM jsonb_array_elements(COALESCE(v_guide->'social', '[]'::jsonb)) AS sp LIMIT 5),
    'external_assets', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(b->>'title', 'Untitled'), 'category', b->>'category', 'url', b->>'externalUrl', 'source', 'brochures')) FROM jsonb_array_elements(COALESCE(v_guide->'brochures', '[]'::jsonb)) AS b WHERE b->>'externalUrl' IS NOT NULL AND length(b->>'externalUrl') > 5 LIMIT 10),
    'external_templates', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(t->>'title', t->>'name', 'Template'), 'category', t->>'category', 'url', t->>'externalUrl', 'source', 'templates')) FROM jsonb_array_elements(COALESCE(v_guide->'templates', '[]'::jsonb)) AS t WHERE t->>'externalUrl' IS NOT NULL AND length(t->>'externalUrl') > 5 LIMIT 10),
    'external_presentations', (SELECT jsonb_agg(jsonb_build_object('title', COALESCE(pt->>'title', pt->>'name', 'Presentation'), 'url', pt->>'externalUrl', 'source', 'presentations')) FROM jsonb_array_elements(COALESCE(v_guide->'presentationTemplates', '[]'::jsonb)) AS pt WHERE pt->>'externalUrl' IS NOT NULL AND length(pt->>'externalUrl') > 5 LIMIT 10),
    'internal_asset_urls', (
      SELECT jsonb_agg(sub.item) FROM (
        SELECT jsonb_build_object('title', COALESCE(b->>'title', 'Brochure'), 'url', b->>'fileUrl', 'source', 'brochures') AS item
        FROM jsonb_array_elements(COALESCE(v_guide->'brochures', '[]'::jsonb)) AS b
        WHERE b->>'fileUrl' IS NOT NULL AND length(b->>'fileUrl') > 5
        UNION ALL
        SELECT jsonb_build_object('title', COALESCE(t->>'title', t->>'name', 'Template'), 'url', t->>'fileUrl', 'source', 'templates')
        FROM jsonb_array_elements(COALESCE(v_guide->'templates', '[]'::jsonb)) AS t
        WHERE t->>'fileUrl' IS NOT NULL AND length(t->>'fileUrl') > 5
        UNION ALL
        SELECT jsonb_build_object('title', COALESCE(pt->>'title', pt->>'name', 'Presentation'), 'url', pt->>'fileUrl', 'source', 'presentations')
        FROM jsonb_array_elements(COALESCE(v_guide->'presentationTemplates', '[]'::jsonb)) AS pt
        WHERE pt->>'fileUrl' IS NOT NULL AND length(pt->>'fileUrl') > 5
        UNION ALL
        SELECT jsonb_build_object('title', COALESCE(cs->>'title', cs->>'name', 'Case Study'), 'url', cs->>'fileUrl', 'source', 'caseStudies')
        FROM jsonb_array_elements(COALESCE(v_guide->'caseStudies', '[]'::jsonb)) AS cs
        WHERE cs->>'fileUrl' IS NOT NULL AND length(cs->>'fileUrl') > 5
        LIMIT 20
      ) sub
    )
  );

  RETURN v_result;
END;
$function$;