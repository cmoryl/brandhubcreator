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

    const body = await req.json();
    const { action, entityId, entityType = 'brand', organizationId } = body;

    if (!entityId) {
      return new Response(JSON.stringify({ error: 'entityId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: record_signal - Record an interaction signal
    if (action === 'record_signal') {
      const { imageId, signalAction, imageMetadata, searchContext, sectionName } = body;
      
      if (!imageId || !signalAction) {
        return new Response(JSON.stringify({ error: 'imageId and signalAction required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: insertError } = await supabase
        .from('imagery_preference_signals')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          organization_id: organizationId || null,
          image_id: imageId,
          action: signalAction,
          image_metadata: imageMetadata || {},
          search_context: searchContext || {},
          section_name: sectionName || null,
          created_by: userId,
        });

      if (insertError) {
        console.error('Insert signal error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to record signal' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: record_batch - Record multiple signals at once
    if (action === 'record_batch') {
      const { signals } = body;
      if (!Array.isArray(signals) || signals.length === 0) {
        return new Response(JSON.stringify({ error: 'signals array required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const rows = signals.map((s: any) => ({
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId || null,
        image_id: s.imageId,
        action: s.action,
        image_metadata: s.imageMetadata || {},
        search_context: s.searchContext || {},
        section_name: s.sectionName || null,
        created_by: userId,
      }));

      const { error: batchError } = await supabase
        .from('imagery_preference_signals')
        .insert(rows);

      if (batchError) {
        console.error('Batch insert error:', batchError);
        return new Response(JSON.stringify({ error: 'Failed to record batch signals' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, count: rows.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: analyze - Analyze signals and build/update Visual DNA profile
    if (action === 'analyze') {
      const { data: canUse } = await supabase.rpc('can_use_ai_features', { _user_id: userId });
      if (!canUse) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch all signals for this entity
      const { data: signals, error: sigError } = await supabase
        .from('imagery_preference_signals')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .limit(500);

      if (sigError) {
        console.error('Fetch signals error:', sigError);
        return new Response(JSON.stringify({ error: 'Failed to fetch signals' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch Operational Vault images (imageAssets) as implicit approved signals
      const tableName = entityType === 'product' ? 'products' : entityType === 'event' ? 'events' : 'brands';
      const { data: entityData } = await supabase
        .from(tableName)
        .select('guide_data')
        .eq('id', entityId)
        .maybeSingle();

      const vaultImages: any[] = (entityData?.guide_data as any)?.imageAssets || [];
      const vaultImageryItems: any[] = (entityData?.guide_data as any)?.imagery || [];

      const hasSignals = signals && signals.length > 0;
      const hasVaultImages = vaultImages.length > 0 || vaultImageryItems.length > 0;

      if (!hasSignals && !hasVaultImages) {
        return new Response(JSON.stringify({ 
          visual_dna: null, 
          message: 'No signals recorded yet. Approve or skip images, or add images to the Operational Vault to start learning.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const approved = (signals || []).filter(s => s.action === 'approved');
      const skipped = (signals || []).filter(s => s.action === 'skipped');
      const removed = (signals || []).filter(s => s.action === 'removed');

      // Use AI to analyze patterns
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build signal summaries for AI
      const approvedMeta = approved.slice(0, 50).map(s => ({
        categories: (s.image_metadata as any)?.categories || [],
        description: ((s.image_metadata as any)?.description || '').slice(0, 100),
        media_type: (s.image_metadata as any)?.media_type || 'photo',
        dimensions: `${(s.image_metadata as any)?.width || 0}x${(s.image_metadata as any)?.height || 0}`,
      }));

      const skippedMeta = skipped.slice(0, 30).map(s => ({
        categories: (s.image_metadata as any)?.categories || [],
        description: ((s.image_metadata as any)?.description || '').slice(0, 80),
        media_type: (s.image_metadata as any)?.media_type || 'photo',
      }));

      const removedMeta = removed.slice(0, 20).map(s => ({
        categories: (s.image_metadata as any)?.categories || [],
        description: ((s.image_metadata as any)?.description || '').slice(0, 80),
      }));

      // Build vault image summaries (treated as strong implicit approvals)
      const vaultMeta = vaultImages.slice(0, 40).map((img: any) => ({
        title: img.title || img.name || img.fileName || '',
        description: (img.description || img.alt || '').slice(0, 100),
        category: img.category || '',
        tags: img.tags || [],
        source: 'operational_vault',
      }));

      const imageryMeta = vaultImageryItems.slice(0, 20).map((img: any) => ({
        title: img.title || img.name || '',
        description: (img.description || img.alt || '').slice(0, 100),
        category: img.category || '',
        tags: img.tags || [],
        source: 'imagery_guidelines',
      }));

      const allVaultMeta = [...vaultMeta, ...imageryMeta];

      // Search context patterns
      const searchQueries = [...new Set((signals || [])
        .map(s => (s.search_context as any)?.query)
        .filter(Boolean)
      )].slice(0, 20);

      const vaultSection = allVaultMeta.length > 0 ? `
OPERATIONAL VAULT & IMAGERY GUIDELINES (${allVaultMeta.length} curated assets — these are intentionally selected brand images and should be weighted as STRONG implicit approvals):
${JSON.stringify(allVaultMeta, null, 1)}
` : '';

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: `You are a visual preference analyst. Analyze imagery selection patterns to build a Visual DNA profile. Focus on identifying clear preferences vs. dislikes from the approved, skipped, removed, and curated vault image data. Operational Vault images are intentionally curated brand assets — treat them as strong indicators of preferred visual style, equivalent to explicitly approved images.`
            },
            {
              role: 'user',
              content: `Analyze these imagery interaction signals:

APPROVED (${approved.length} total, showing ${approvedMeta.length}):
${JSON.stringify(approvedMeta, null, 1)}

SKIPPED (${skipped.length} total, showing ${skippedMeta.length}):
${JSON.stringify(skippedMeta, null, 1)}

REMOVED (${removed.length} total, showing ${removedMeta.length}):
${JSON.stringify(removedMeta, null, 1)}
${vaultSection}
SEARCH QUERIES USED: ${searchQueries.join(', ')}

Extract the visual preferences, patterns, and aversions. Be specific and actionable. Consider the vault images as strong evidence of preferred visual style.`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'build_visual_dna',
              description: 'Build a Visual DNA profile from imagery preference patterns',
              parameters: {
                type: 'object',
                properties: {
                  preferred_categories: {
                    type: 'array',
                    items: { type: 'object', properties: { name: { type: 'string' }, weight: { type: 'number' }, reason: { type: 'string' } }, required: ['name', 'weight'] }
                  },
                  preferred_colors: {
                    type: 'array',
                    items: { type: 'object', properties: { color: { type: 'string' }, weight: { type: 'number' } }, required: ['color', 'weight'] }
                  },
                  preferred_styles: {
                    type: 'array',
                    items: { type: 'object', properties: { style: { type: 'string' }, weight: { type: 'number' } }, required: ['style', 'weight'] }
                  },
                  preferred_compositions: {
                    type: 'array',
                    items: { type: 'object', properties: { type: { type: 'string' }, preference: { type: 'string' } }, required: ['type', 'preference'] }
                  },
                  mood_keywords: { type: 'array', items: { type: 'string' } },
                  avoid_keywords: { type: 'array', items: { type: 'string' } },
                  approval_patterns: {
                    type: 'object',
                    properties: {
                      summary: { type: 'string' },
                      top_themes: { type: 'array', items: { type: 'string' } },
                      rejection_reasons: { type: 'array', items: { type: 'string' } },
                      style_preference: { type: 'string' },
                      diversity_inclination: { type: 'string' }
                    },
                    required: ['summary', 'top_themes']
                  },
                  confidence_score: { type: 'number' }
                },
                required: ['preferred_categories', 'mood_keywords', 'avoid_keywords', 'approval_patterns', 'confidence_score'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'build_visual_dna' } },
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('AI error:', aiResponse.status);
        return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let dnaResult: any = {};
      if (toolCall?.function?.arguments) {
        try { dnaResult = JSON.parse(toolCall.function.arguments); } catch { dnaResult = {}; }
      }

      // Upsert visual DNA
      const { data: existing } = await supabase
        .from('imagery_visual_dna')
        .select('id')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();

      const dnaRow = {
        entity_id: entityId,
        entity_type: entityType,
        organization_id: organizationId || null,
        preferred_categories: dnaResult.preferred_categories || [],
        preferred_colors: dnaResult.preferred_colors || [],
        preferred_styles: dnaResult.preferred_styles || [],
        preferred_compositions: dnaResult.preferred_compositions || [],
        mood_keywords: dnaResult.mood_keywords || [],
        avoid_keywords: dnaResult.avoid_keywords || [],
        approval_patterns: dnaResult.approval_patterns || {},
        total_approved: approved.length + allVaultMeta.length,
        total_skipped: skipped.length,
        total_removed: removed.length,
        confidence_score: dnaResult.confidence_score || 0,
        last_analyzed_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from('imagery_visual_dna')
          .update(dnaRow)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('imagery_visual_dna')
          .insert(dnaRow);
      }

      // Auto-feed Visual DNA insights to Oracle Knowledge Base
      if (organizationId && dnaResult.approval_patterns?.summary) {
        try {
          const topCategories = Array.isArray(dnaResult.preferred_categories)
            ? dnaResult.preferred_categories.slice(0, 5).map((c: any) => c.name || c).join(', ')
            : '';
          const avoidList = Array.isArray(dnaResult.avoid_keywords)
            ? dnaResult.avoid_keywords.slice(0, 5).join(', ')
            : '';
          const moodList = Array.isArray(dnaResult.mood_keywords)
            ? dnaResult.mood_keywords.slice(0, 5).join(', ')
            : '';

          const kbContent = [
            `Visual DNA Summary: ${dnaResult.approval_patterns.summary}`,
            topCategories ? `Preferred imagery: ${topCategories}` : '',
            moodList ? `Visual mood: ${moodList}` : '',
            avoidList ? `Avoid in imagery: ${avoidList}` : '',
            `Based on ${approved.length} approved, ${skipped.length} skipped, ${removed.length} removed images.`,
            `Confidence: ${dnaResult.confidence_score || 0}%`,
          ].filter(Boolean).join('\n');

          // Fetch entity name for the title
          const tableName = entityType === 'product' ? 'products' : entityType === 'event' ? 'events' : 'brands';
          const { data: entityRow } = await supabase
            .from(tableName)
            .select('name')
            .eq('id', entityId)
            .maybeSingle();

          const entityLabel = entityRow?.name || entityType;

          await supabase
            .from('oracle_knowledge_base')
            .upsert({
              organization_id: organizationId,
              title: `🎨 Visual DNA: ${entityLabel}`,
              content: kbContent,
              content_type: 'intelligence',
              source_type: 'visual_dna',
              category: 'imagery_preferences',
              source_entity_id: entityId,
              source_entity_type: entityType,
              tags: [entityType, 'visual-dna', 'auto-generated', 'imagery'],
              is_active: true,
            }, { onConflict: 'organization_id,source_entity_id,source_entity_type' });

          console.log('[shutterstock-learn] Auto-fed Visual DNA to Oracle KB');
        } catch (oracleErr) {
          console.warn('[shutterstock-learn] Oracle KB feed failed (non-critical):', oracleErr);
        }
      }

      return new Response(JSON.stringify({ visual_dna: { ...dnaRow, id: existing?.id } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: get_dna - Get the current Visual DNA profile
    if (action === 'get_dna') {
      const { data: dna, error: dnaError } = await supabase
        .from('imagery_visual_dna')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .maybeSingle();

      if (dnaError) {
        console.error('Get DNA error:', dnaError);
        return new Response(JSON.stringify({ error: 'Failed to fetch Visual DNA' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Also get signal counts for display
      const { count: signalCount } = await supabase
        .from('imagery_preference_signals')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);

      return new Response(JSON.stringify({ visual_dna: dna, signal_count: signalCount || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('shutterstock-learn error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
