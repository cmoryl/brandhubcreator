UPDATE brands
SET guide_data = guide_data
  || jsonb_build_object(
    'tagline', jsonb_build_object(
      'primary', 'Transforming Global Performance.',
      'secondary', 'A living platform built on language, people, tech, and trust — driving performance every step of the way.',
      'variations', jsonb_build_array(
        'Built to Transform.',
        'Continuous transformation. Continuous momentum.',
        'A home for transformation.',
        'Move boldly. Evolve continuously. Turn change into momentum.'
      ),
      'fontSettings', jsonb_build_object(
        'fontSize', 64,
        'fontStyle', 'normal',
        'textAlign', 'center',
        'fontFamily', 'Geist',
        'fontWeight', '500',
        'lineHeight', 1.15,
        'letterSpacing', '-0.02em'
      ),
      '_settings', jsonb_build_object(
        'solidColor', '#0A1F4D',
        'gradientColors', jsonb_build_object(
          'from', '#0A1F4D',
          'via', '#1561FF',
          'to', '#C2A3FF'
        ),
        'backgroundStyle', 'gradient'
      )
    )
  )
  || jsonb_build_object(
    'identity', jsonb_build_object(
      'archetype', 'The Transformer',
      'toneOfVoice', jsonb_build_array(
        'Purposeful', 'Emotive', 'Elevated', 'Human', 'Pace-setting', 'Forward-thinking'
      ),
      'missionStatement', 'TransPerfect is a global partner for ambitious organisations. We help our clients move boldly, evolve continuously, and turn change into momentum. Through insight, human expertise, and technology, we create solutions that enhance content performance, unlock potential, and enable businesses to thrive wherever they land.',
      'brandStory', 'Transformation doesn''t happen all at once. It builds through small moves and seismic shifts — a new idea, a quiet improvement, a smarter system, a bold decision. And when every step is driven by intent, sharpened by insight, and built with expertise, then transformation stops being just process — it becomes who you are. For over 30 years, we''ve partnered with clients to create solutions that move with them — fast, flexible, freeing potential, enhancing performance, and enabling them to thrive wherever they land. Because transformation isn''t a standalone moment. It''s a mindset — the way forward thinking organisations stay ahead.',
      'corePurpose', 'In a world that never stands still, language is an enabler — we work to remove barriers that slow down global connection and collaboration so people, ideas, and businesses can move forward freely.',
      'reasonToBelieve', 'Built up over 30 years, we''re experts in seeing and harnessing the bigger potential of language, and providing solutions that drive businesses forward.',
      'inShort', jsonb_build_object(
        'whatWeDo', 'Continuous transformation',
        'howWeDoIt', 'Through expertise — people, tech, industry',
        'whyItMatters', 'More relevant, alive, ahead'
      )
    )
  )
  || jsonb_build_object(
    'colors', jsonb_build_array(
      jsonb_build_object('id','1','hex','#1561FF','name','Blue 500','usage','Primary brand color — vibrant, energetic, the foundation of every digital expression','cmyk','85, 65, 0, 0','pantone','2728 C'),
      jsonb_build_object('id','2','hex','#0A1F4D','name','Blue 800','usage','Secondary primary — grounded, confident, used for headers and dark surfaces','cmyk','100, 90, 30, 50','pantone','282 C'),
      jsonb_build_object('id','3','hex','#C2A3FF','name','Lavender','usage','Secondary — depth and flexibility, complements core blues','cmyk','30, 35, 0, 0','pantone','2655 C'),
      jsonb_build_object('id','4','hex','#A1FBF9','name','Turquoise','usage','Secondary — adds light and clarity to interface accents','cmyk','40, 0, 15, 0','pantone','317 C'),
      jsonb_build_object('id','5','hex','#FFEB66','name','Yellow','usage','Secondary — energetic accent for highlights and callouts','cmyk','0, 5, 70, 0','pantone','100 C'),
      jsonb_build_object('id','6','hex','#FF9B70','name','Orange','usage','Secondary — warm accent, contrast against the cool blue base','cmyk','0, 50, 60, 0','pantone','164 C'),
      jsonb_build_object('id','7','hex','#FFFFFF','name','White','usage','Surface — primary background in light mode, breathing room','cmyk','0, 0, 0, 0','pantone','White'),
      jsonb_build_object('id','8','hex','#0A0F1F','name','Ink','usage','Surface — primary text in light mode, dark mode background base','cmyk','85, 75, 50, 95','pantone','Black 6 C')
    )
  )
  || jsonb_build_object(
    'gradients', jsonb_build_array(
      jsonb_build_object('id','1','name','Gradient Lavender','css','linear-gradient(135deg, #1561FF 0%, #C2A3FF 100%)'),
      jsonb_build_object('id','2','name','Gradient Turquoise','css','linear-gradient(135deg, #1561FF 0%, #A1FBF9 100%)'),
      jsonb_build_object('id','3','name','Transformation Flow','css','linear-gradient(135deg, #0A1F4D 0%, #1561FF 50%, #C2A3FF 100%)'),
      jsonb_build_object('id','4','name','Aurora Streaks','css','linear-gradient(180deg, #0A1F4D 0%, #1561FF 60%, #A1FBF9 100%)'),
      jsonb_build_object('id','5','name','Warm Accent','css','linear-gradient(135deg, #FFEB66 0%, #FF9B70 100%)')
    )
  )
  || jsonb_build_object(
    'typography', jsonb_build_array(
      jsonb_build_object('id','heading','name','Heading XL','usage','Hero titles and primary headlines — Geist Sans Medium, tight tracking','weight','500','fontFamily','Geist','previewText','Transforming Global Performance.'),
      jsonb_build_object('id','subheading','name','Heading M','usage','Section titles and sub-headlines — Geist Sans Medium','weight','500','fontFamily','Geist','previewText','Built to Transform.'),
      jsonb_build_object('id','small-heading','name','Heading S','usage','Component titles and small headlines — Geist Sans Medium 18px','weight','500','fontFamily','Geist','previewText','Global content for every mind'),
      jsonb_build_object('id','body','name','Body','usage','Body copy, paragraphs, descriptions — Geist Sans Regular','weight','400','fontFamily','Geist','previewText','Continuous transformation, made visible through interaction, light and rhythm.'),
      jsonb_build_object('id','caption','name','Caption','usage','Captions, labels, micro-copy — Geist Sans Light','weight','300','fontFamily','Geist','previewText','TransPerfect. 2026.')
    )
  )
  || jsonb_build_object(
    'hero', (guide_data->'hero')
      || jsonb_build_object(
        'tagline', 'Transforming Global Performance.',
        'coverImage', 'https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/hero-brand-visual-2026.jpg',
        'titleColor', '#FFFFFF',
        'heroEffect', 'gradient-bars',
        'heroEffectMode', 'dark',
        'heroEffectColorScheme', 'cyan-purple',
        'overlayGradient', 'default'
      )
  )
  || jsonb_build_object(
    'values', jsonb_build_array(
      jsonb_build_object('id','1','icon','sparkles','text','Connection','description','Human and visual connections that express understanding, partnership and clarity. We invest in long-term relationships that move clients forward.','useImage', false),
      jsonb_build_object('id','2','icon','trending-up','text','Transformation','description','Gradients and rhythm — change isn''t a single moment, it''s an ongoing movement forward. We make transformation continuous, tangible and human.','useImage', false),
      jsonb_build_object('id','3','icon','layers','text','Materiality','description','Glass-like translucency, light and clarity. Our solutions react to context — adapting, evolving and connecting across every touchpoint.','useImage', false),
      jsonb_build_object('id','4','icon','zap','text','Pace-Setting','description','Built up over 30 years of expertise — we see the bigger potential of language and provide solutions that drive businesses forward, faster.','useImage', false)
    )
  )
  || jsonb_build_object(
    'imagery', jsonb_build_array(
      jsonb_build_object('id','1','category','do','imageUrl','https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/hero-brand-visual-2026.jpg','description','Brand visual — two glowing spheres merging, representing connection and partnership'),
      jsonb_build_object('id','2','category','do','imageUrl','https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/hero-streaks-2026.jpg','description','Brand visual — aurora light streaks rising, expressing transformation and movement'),
      jsonb_build_object('id','3','category','do','imageUrl','https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/orbs-collaborate-2026.jpg','description','Brand visual — collaborate state, two orbs intersecting and sharing energy'),
      jsonb_build_object('id','4','category','do','imageUrl','https://nhxaijbyqfkkhhoornzy.supabase.co/storage/v1/object/public/organization-assets/ec180296-dfe8-4345-869e-66b524e0a12c/brands/0d6d5a5f-0dd0-4e62-9ac2-285a4095de84/gradient-flow-2026.jpg','description','Brand gradient — Blue 500 to Lavender, the foundation of the digital interface system')
    )
  ),
  updated_at = now()
WHERE id = '0d6d5a5f-0dd0-4e62-9ac2-285a4095de84';