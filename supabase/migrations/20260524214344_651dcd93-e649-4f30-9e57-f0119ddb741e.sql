UPDATE public.brands
SET guide_data = guide_data
  || jsonb_build_object(
    'values', jsonb_build_array(
      jsonb_build_object('id','1','icon','shield-check','text','Integrity','useImage',false,'description','Exhibit the Utmost Integrity.'),
      jsonb_build_object('id','2','icon','award','text','Quality','useImage',false,'description','Deliver the Highest Quality.'),
      jsonb_build_object('id','3','icon','heart-handshake','text','Respect','useImage',false,'description','Treat Everyone with Respect.'),
      jsonb_build_object('id','4','icon','concierge-bell','text','Service','useImage',false,'description','Provide Outstanding Service.'),
      jsonb_build_object('id','5','icon','globe','text','Diversity','useImage',false,'description','Celebrate Diversity.'),
      jsonb_build_object('id','6','icon','key-round','text','Own It','useImage',false,'description','Act as If You Own It.'),
      jsonb_build_object('id','7','icon','users','text','Teamwork','useImage',false,'description','Operate as a Cohesive Team.'),
      jsonb_build_object('id','8','icon','eye','text','Transparency','useImage',false,'description','The Benefits of Visibility Far Outweigh the Risks.'),
      jsonb_build_object('id','9','icon','target','text','Results','useImage',false,'description','Achieve Results.'),
      jsonb_build_object('id','10','icon','piggy-bank','text','Financial Responsibility','useImage',false,'description','Be Financially Responsible.'),
      jsonb_build_object('id','11','icon','zap','text','Urgency','useImage',false,'description','Work with a Sense of Urgency.')
    )
  )
  || jsonb_build_object(
    'identity',
    COALESCE(guide_data->'identity','{}'::jsonb) || jsonb_build_object(
      'visualConcept','Transforming Global Performance — TransPerfect''s web identity brings transformation to life, expressing how clarity, collaboration and human intelligence drive continual progress. Every design asset contributes to a living system that adapts, evolves and connects across every touchpoint. Transformation isn''t a single moment — it''s an ongoing movement forward, made visible through interaction, light and rhythm.',
      'corporateValues', jsonb_build_array(
        'Integrity','Quality','Respect','Service','Diversity','Own It',
        'Teamwork','Transparency','Results','Financial Responsibility','Urgency'
      ),
      'guidelinesVersion','3.0'
    )
  ),
  updated_at = now()
WHERE id = '0d6d5a5f-0dd0-4e62-9ac2-285a4095de84';