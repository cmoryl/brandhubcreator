
UPDATE brands
SET guide_data = jsonb_set(
  guide_data,
  '{approvedImagery,sections}',
  COALESCE(guide_data->'approvedImagery'->'sections', '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', 'Approved Backgrounds',
      'description', 'Approved TransPerfect gradient/orb background imagery for use across templates and social surfaces.',
      'images', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'url', '/__l5e/assets-v1/be7cba81-a413-4555-b954-508fa2a21a5c/tp-general-bg-1.png',
          'thumbnailUrl', '/__l5e/assets-v1/be7cba81-a413-4555-b954-508fa2a21a5c/tp-general-bg-1.png',
          'title', 'TransPerfect General Background 1',
          'description', 'Deep navy to electric blue gradient with luminous purple/turquoise orb top-right.',
          'category', 'background',
          'tags', jsonb_build_array('background','gradient','orb','approved','transperfect'),
          'source', 'upload',
          'approvedAt', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'createdAt', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"')
        ),
        jsonb_build_object(
          'id', gen_random_uuid()::text,
          'url', '/__l5e/assets-v1/3f6181d4-0586-4a50-9c14-7aa2941533c1/tp-general-bg-2.png',
          'thumbnailUrl', '/__l5e/assets-v1/3f6181d4-0586-4a50-9c14-7aa2941533c1/tp-general-bg-2.png',
          'title', 'TransPerfect General Background 2',
          'description', 'Soft lavender-to-cyan gradient with luminous violet orb centered top.',
          'category', 'background',
          'tags', jsonb_build_array('background','gradient','orb','approved','transperfect'),
          'source', 'upload',
          'approvedAt', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'createdAt', to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"')
        )
      )
    )
  )
)
WHERE id = '0d6d5a5f-0dd0-4e62-9ac2-285a4095de84'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(guide_data->'approvedImagery'->'sections','[]'::jsonb)) s
    WHERE s->>'name' = 'Approved Backgrounds'
  );
