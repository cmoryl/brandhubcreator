import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const { data: canUse } = await supabase.rpc('can_use_ai_features', { _user_id: userId });
    if (!canUse) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entityId, entityType = 'brand', userQuery, categoryName, approvedImageTitles } = await req.json();

    if (!entityId) {
      return new Response(JSON.stringify({ error: 'entityId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch brand context via RPC
    const tableName = entityType === 'product' ? 'products' : entityType === 'event' ? 'events' : 'brands';
    const { data: brandContext, error: contextError } = await supabase.rpc('get_entity_text_context', {
      p_table: tableName,
      p_id: entityId,
    });

    if (contextError) {
      console.error('Context fetch error:', contextError);
    }

    // Fetch Oracle brain insights if available
    const { data: intelligence } = await supabase
      .from('brand_intelligence')
      .select('brand_summary, brand_voice_profile, cultural_insights, target_audience, competitive_advantages')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType === 'brand' ? 'brand' : entityType)
      .maybeSingle();

    // Fetch Visual DNA (learned preferences)
    const { data: visualDna } = await supabase
      .from('imagery_visual_dna')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType === 'brand' ? 'brand' : entityType)
      .maybeSingle();

    // Fetch imagery guidelines from guide_data
    let imageryGuidelines = null;
    const { data: entityData } = await supabase
      .from(tableName)
      .select('guide_data')
      .eq('id', entityId)
      .maybeSingle();

    if (entityData?.guide_data) {
      const gd = entityData.guide_data as any;
      imageryGuidelines = {
        imagery: gd.imagery || [],
        imageAssets: gd.imageAssets || [],
        approvedImagery: gd.approvedImagery || { sections: [] },
      };
    }

    // Build the AI prompt
    const brandName = brandContext?.name || 'Unknown Brand';
    const archetype = brandContext?.archetype || '';
    const mission = brandContext?.mission || '';
    const colors = Array.isArray(brandContext?.colors) ? brandContext.colors : [];
    const values = Array.isArray(brandContext?.values) ? brandContext.values : [];
    const services = Array.isArray(brandContext?.services) ? brandContext.services : [];
    const industry = brandContext?.industry || '';
    const toneOfVoice = brandContext?.tone_of_voice || '';
    const tagline = brandContext?.primary_tagline || '';

    const voiceProfile = intelligence?.brand_voice_profile || {};
    const targetAudience = intelligence?.target_audience || {};
    const culturalInsights = intelligence?.cultural_insights || {};
    const brandSummary = intelligence?.brand_summary || '';

    // Analyze existing approved imagery to learn patterns
    const existingSections = imageryGuidelines?.approvedImagery?.sections || [];
    const existingCategories = existingSections.map((s: any) => s.name);
    const allApprovedTitles = existingSections.flatMap((s: any) =>
      (s.images || []).map((img: any) => img.title)
    ).slice(0, 30); // Recent 30 for pattern learning

    // Extract Operational Vault (imageAssets) metadata for style context
    const vaultImages = imageryGuidelines?.imageAssets || [];
    const vaultContext = vaultImages.length > 0 ? `
OPERATIONAL VAULT IMAGES (${vaultImages.length} curated assets — these represent the brand's intentionally selected visual style):
${vaultImages.slice(0, 40).map((img: any) => {
  const parts = [
    img.title || img.name || img.fileName || '',
    img.description || img.alt || '',
    img.category || '',
    img.tags?.join(', ') || '',
  ].filter(Boolean);
  return `- ${parts.join(' | ')}`;
}).join('\n')}` : '';

    // Build Visual DNA context
    const dnaContext = visualDna ? `
LEARNED VISUAL PREFERENCES (from ${visualDna.total_approved || 0} approved, ${visualDna.total_skipped || 0} skipped, ${visualDna.total_removed || 0} removed images):
- Preferred categories: ${JSON.stringify(visualDna.preferred_categories || [])}
- Preferred colors: ${JSON.stringify(visualDna.preferred_colors || [])}
- Preferred styles: ${JSON.stringify(visualDna.preferred_styles || [])}
- Mood keywords to use: ${JSON.stringify(visualDna.mood_keywords || [])}
- Keywords to AVOID: ${JSON.stringify(visualDna.avoid_keywords || [])}
- Approval patterns: ${JSON.stringify((visualDna.approval_patterns as any)?.summary || '')}
- Top themes: ${JSON.stringify((visualDna.approval_patterns as any)?.top_themes || [])}
- Rejection reasons: ${JSON.stringify((visualDna.approval_patterns as any)?.rejection_reasons || [])}
- Confidence: ${visualDna.confidence_score || 0}%` : '';

    const systemPrompt = `You are a brand imagery strategist. You help brands find stock photography that perfectly aligns with their visual identity, brand archetype, and strategic positioning.

Your job is to generate highly specific Shutterstock search queries that will find images matching this brand's established look and feel. The queries should be professional stock photography search terms — not generic, but deeply informed by the brand's identity.

BRAND CONTEXT:
- Name: ${brandName}
- Industry: ${industry}
- Archetype: ${archetype}
- Mission: ${mission}
- Tagline: ${tagline}
- Core Values: ${JSON.stringify(values)}
- Services: ${JSON.stringify(services)}
- Brand Colors: ${JSON.stringify(colors.map((c: any) => `${c.name || ''} (${c.hex || ''})`))}
- Tone of Voice: ${JSON.stringify(toneOfVoice)}
${brandSummary ? `- Brand Summary: ${brandSummary}` : ''}
${Object.keys(voiceProfile).length ? `- Voice Profile: ${JSON.stringify(voiceProfile)}` : ''}
${Object.keys(targetAudience).length ? `- Target Audience: ${JSON.stringify(targetAudience)}` : ''}
${Object.keys(culturalInsights).length ? `- Cultural Insights: ${JSON.stringify(culturalInsights)}` : ''}
${dnaContext}

EXISTING IMAGERY CATEGORIES: ${existingCategories.join(', ') || 'None yet'}
PREVIOUSLY APPROVED IMAGE THEMES: ${allApprovedTitles.join('; ').slice(0, 500) || 'None yet'}
${approvedImageTitles?.length ? `RECENTLY APPROVED IN THIS CATEGORY: ${approvedImageTitles.join('; ')}` : ''}

GUIDELINES:
- Generate search queries that reflect the brand's visual DNA — colors, mood, energy level, sophistication
- Consider the brand archetype when suggesting imagery style (e.g., "Hero" archetype = powerful/dramatic, "Sage" = contemplative/scholarly)
- Avoid generic corporate stock imagery — aim for authentic, editorial-quality results
- Each query should be 3-8 words, specific enough to yield focused results
- Include mood/style modifiers (e.g., "warm lighting", "aerial perspective", "close-up detail", "diverse team")
- Learn from previously approved images to suggest similar styles
${visualDna ? '- IMPORTANT: Heavily weight the learned visual preferences above — they represent what the brand team actually likes and dislikes' : ''}`;

    let userPrompt = '';
    if (userQuery) {
      userPrompt = `The user searched for: "${userQuery}"
${categoryName ? `They are looking for images in the "${categoryName}" category.` : ''}

Generate 5 enhanced search queries that refine their search to better match this brand's visual identity. Also provide a brief explanation of why these queries align with the brand.

Return a JSON object with this structure:
{
  "enhancedQueries": ["query1", "query2", "query3", "query4", "query5"],
  "reasoning": "Brief explanation of how these queries align with the brand identity",
  "suggestedOrientation": "horizontal" | "vertical" | "square" | null,
  "styleNotes": "Brief note on what visual style to look for"
}`;
    } else {
      userPrompt = `${categoryName ? `The user wants to find images for the "${categoryName}" category.` : 'The user is browsing for brand imagery.'}

Generate 8 suggested search queries that would find images perfectly aligned with this brand's visual identity and strategy. Consider the brand's archetype, industry, values, and existing imagery patterns.

Return a JSON object with this structure:
{
  "suggestions": [
    {"query": "search query", "category": "suggested category name", "rationale": "why this fits the brand"}
  ],
  "brandImageryProfile": "2-3 sentence description of the ideal imagery style for this brand",
  "moodKeywords": ["keyword1", "keyword2", "keyword3"],
  "avoidKeywords": ["keyword1", "keyword2"]
}`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: userQuery ? 'return_enhanced_queries' : 'return_suggestions',
              description: userQuery ? 'Return enhanced search queries' : 'Return search suggestions',
              parameters: userQuery ? {
                type: 'object',
                properties: {
                  enhancedQueries: { type: 'array', items: { type: 'string' } },
                  reasoning: { type: 'string' },
                  suggestedOrientation: { type: 'string' },
                  styleNotes: { type: 'string' },
                },
                required: ['enhancedQueries', 'reasoning'],
                additionalProperties: false,
              } : {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        query: { type: 'string' },
                        category: { type: 'string' },
                        rationale: { type: 'string' },
                      },
                      required: ['query', 'rationale'],
                      additionalProperties: false,
                    },
                  },
                  brandImageryProfile: { type: 'string' },
                  moodKeywords: { type: 'array', items: { type: 'string' } },
                  avoidKeywords: { type: 'array', items: { type: 'string' } },
                },
                required: ['suggestions', 'brandImageryProfile'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: { name: userQuery ? 'return_enhanced_queries' : 'return_suggestions' },
        },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);
      return new Response(JSON.stringify({ error: 'AI suggestion failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let result: any = {};
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { error: 'Failed to parse AI response' };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('shutterstock-ai-suggest error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
