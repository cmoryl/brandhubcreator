/**
 * GlobalLink Translate Edge Function
 * Handles translation requests via GlobalLink Web API or demo mode
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  organization_id: string;
  source_language: string;
  target_language: string;
  content: string | Record<string, unknown>;
  context?: string;
  preserve_formatting?: boolean;
}

interface TranslationResponse {
  success: boolean;
  translated_content: string | Record<string, unknown>;
  word_count?: number;
  character_count?: number;
  cached?: boolean;
  error?: string;
}

// Simple hash function for cache lookup
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Demo translation - simulates GlobalLink by adding language markers
function demoTranslate(
  content: string | Record<string, unknown>,
  targetLanguage: string
): string | Record<string, unknown> {
  const langPrefix = `[${targetLanguage}]`;
  
  if (typeof content === 'string') {
    return `${langPrefix} ${content}`;
  }
  
  // Recursively translate object values
  const translated: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === 'string' && value.trim()) {
      translated[key] = `${langPrefix} ${value}`;
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = demoTranslate(value as Record<string, unknown>, targetLanguage);
    } else {
      translated[key] = value;
    }
  }
  return translated;
}

// Count words in content
function countWords(content: string | Record<string, unknown>): number {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  return str.split(/\s+/).filter(Boolean).length;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: TranslationRequest = await req.json();
    const { 
      organization_id, 
      source_language = 'en_US', 
      target_language, 
      content,
      context,
      preserve_formatting = true 
    } = body;

    if (!organization_id || !target_language || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get GlobalLink config for this organization
    const { data: config } = await supabase
      .from('globallink_config')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const isDemo = !config || config.api_mode === 'demo';
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const contentHash = hashContent(contentStr + target_language);

    // Check cache first
    const { data: cached } = await supabase
      .from('localization_cache')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('source_hash', contentHash)
      .eq('target_language', target_language)
      .maybeSingle();

    if (cached) {
      // Update hit count
      await supabase
        .from('localization_cache')
        .update({ 
          hit_count: (cached.hit_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cached.id);

      const translatedContent = typeof content === 'string' 
        ? cached.translated_text 
        : JSON.parse(cached.translated_text);

      return new Response(
        JSON.stringify({
          success: true,
          translated_content: translatedContent,
          word_count: countWords(content),
          character_count: contentStr.length,
          cached: true,
        } as TranslationResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let translatedContent: string | Record<string, unknown>;

    if (isDemo) {
      // Demo mode - simulate translation
      translatedContent = demoTranslate(content, target_language);
      console.log('Demo translation completed for', target_language);
    } else {
      // Live mode - call GlobalLink Web API
      // Check for API key in database config first, then fall back to environment secrets
      const apiKey = config?.api_key || Deno.env.get('GLOBALLINK_API_KEY');
      const projectKey = config?.project_key || Deno.env.get('GLOBALLINK_PROJECT_KEY');
      
      if (!apiKey || !projectKey) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GlobalLink API credentials not configured. Please add your API Key and Project Key in the GlobalLink Settings panel.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // GlobalLink Web API endpoint
      const apiEndpoint = config?.api_endpoint || 'https://www.onelink-edge.com/xapis/TX';
      
      try {
        // Step 1: Create session
        const sessionResponse = await fetch(`${apiEndpoint}/P?create_session=1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x_tx_account': projectKey,
          },
        });

        if (!sessionResponse.ok) {
          throw new Error(`Failed to create GlobalLink session: ${sessionResponse.status}`);
        }

        const sessionData = await sessionResponse.json();
        const sessionToken = sessionData.session_token;

        // Step 2: Submit translation
        const translateResponse = await fetch(`${apiEndpoint}?tx_token=${sessionToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x_tx_service': target_language,
          },
          body: contentStr,
        });

        if (!translateResponse.ok) {
          throw new Error(`Translation failed: ${translateResponse.status}`);
        }

        const translatedStr = await translateResponse.text();
        translatedContent = typeof content === 'string' 
          ? translatedStr 
          : JSON.parse(translatedStr);

      } catch (apiError) {
        console.error('GlobalLink API error:', apiError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GlobalLink API error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Cache the translation
    const translatedStr = typeof translatedContent === 'string' 
      ? translatedContent 
      : JSON.stringify(translatedContent);

    await supabase
      .from('localization_cache')
      .insert({
        organization_id,
        source_hash: contentHash,
        source_language,
        target_language,
        source_text: contentStr,
        translated_text: translatedStr,
        context: context || null,
      });

    return new Response(
      JSON.stringify({
        success: true,
        translated_content: translatedContent,
        word_count: countWords(content),
        character_count: contentStr.length,
        cached: false,
      } as TranslationResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Translation failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
