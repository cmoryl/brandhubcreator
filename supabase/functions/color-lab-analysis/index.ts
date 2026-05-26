import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT manually
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, colors, analysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const colorList = colors.map((c: any) => `${c.name}: ${c.hex}`).join(', ');

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'cultural-bias') {
      systemPrompt = `You are an expert color psychologist and cultural semiotician. Analyze color palettes for cultural symbolism, gender perception bias, age inclusivity, and industry fit. Return structured JSON only.`;
      
      userPrompt = `Analyze this color palette for cultural bias and inclusivity:

Colors: ${colorList}

Additional color details: ${JSON.stringify(colors)}

Return a JSON object with this exact structure:
{
  "overallScore": <0-100 inclusivity score>,
  "culturalInsights": [
    {
      "region": "<region name>",
      "associations": ["<cultural meaning>"],
      "warnings": ["<potential issues>"],
      "opportunities": ["<positive uses>"]
    }
  ],
  "biasFlags": [
    {
      "type": "<gender|cultural|age|accessibility>",
      "severity": "<low|medium|high>",
      "description": "<what the bias is>",
      "recommendation": "<how to fix>"
    }
  ],
  "genderPerception": {
    "masculine": <0-100>,
    "feminine": <0-100>,
    "neutral": <0-100>
  },
  "industryFit": [
    {"industry": "<name>", "score": <0-100>, "reason": "<why>"}
  ],
  "recommendations": ["<actionable suggestion>"]
}

Include insights for: North America, Europe, East Asia, Middle East, Latin America, Sub-Saharan Africa, South Asia.
Include at least 5 industries: Technology, Healthcare, Finance, Food & Beverage, Fashion, Education.`;

    } else if (type === 'research-report') {
      systemPrompt = `You are a senior color science researcher specializing in brand color strategy, accessibility compliance, and cross-cultural color psychology. Write comprehensive, evidence-based analysis.`;
      
      const analysisContext = analysis ? `
Harmony: ${analysis.harmony} (score: ${analysis.harmonyScore}/100)
Colorblind Safety: ${analysis.colorblindSafety}%
WCAG Pass Rate: ${analysis.wcagPassRate}%` : '';

      userPrompt = `Generate a comprehensive color research report for this palette:

Colors: ${JSON.stringify(colors)}
${analysisContext}

Return a JSON object with this structure:
{
  "title": "<descriptive report title>",
  "executiveSummary": "<2-3 sentence overview>",
  "colorTheory": {
    "harmonyType": "<harmony classification>",
    "analysis": "<detailed theory analysis, 3-4 sentences>",
    "emotionalImpact": "<emotional response analysis, 2-3 sentences>"
  },
  "accessibilityAudit": {
    "wcagScore": <0-100>,
    "apcaScore": <0-100>,
    "colorblindSafety": <0-100>,
    "findings": ["<specific finding>"]
  },
  "culturalAnalysis": "<cross-cultural analysis, 3-4 sentences>",
  "industryBenchmark": "<how this compares to industry leaders, 2-3 sentences>",
  "productionNotes": "<print and digital production guidance, 2-3 sentences>",
  "recommendations": ["<actionable recommendation>"],
  "conclusion": "<strategic summary, 2-3 sentences>"
}`;

    } else {
      return new Response(JSON.stringify({ error: 'Invalid analysis type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-lite-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Extract JSON from response
    let result: any;
    try {
      // Try direct parse first
      result = JSON.parse(content);
    } catch {
      // Try extracting from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in content
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          result = JSON.parse(braceMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('color-lab-analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
