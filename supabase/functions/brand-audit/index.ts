import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandData {
  id: string;
  type: 'brand' | 'product';
  hero: {
    name: string;
    tagline: string;
  };
  identity: {
    missionStatement: string;
    archetype: string;
    toneOfVoice: string[];
  };
  values: Array<{ title: string; description: string }>;
  colors: Array<{ name: string; hex: string; usage: string }>;
  typography: Array<{ name: string; fontFamily: string; usage: string }>;
  gradients: Array<{ name: string; colors: string[] }>;
  patterns: Array<{ name: string }>;
}

interface AuditResult {
  overallScore: number;
  categories: {
    name: string;
    score: number;
    findings: string[];
    recommendations: string[];
  }[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CRITICAL: Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Authentication failed: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log('Authentication failed: Invalid user', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { brand } = await req.json();
    
    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Brand data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting brand audit for: ${brand.hero?.name || 'Unknown'} by user ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the audit prompt
    const auditPrompt = buildAuditPrompt(brand);
    
    console.log('Calling AI Gateway for brand analysis...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a brand cohesion expert and design consultant. Analyze brand guides for consistency, completeness, and best practices. 
            
Provide your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "categories": [
    {
      "name": "<category name>",
      "score": <number 0-100>,
      "findings": ["<finding 1>", "<finding 2>"],
      "recommendations": ["<recommendation 1>", "<recommendation 2>"]
    }
  ],
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "actionItems": ["<priority action 1>", "<priority action 2>", "<priority action 3>"]
}

Categories to evaluate:
1. Visual Consistency - Color harmony, typography pairing, pattern usage
2. Brand Identity - Mission clarity, values alignment, tone coherence
3. Completeness - Missing elements, gaps in the guide
4. Best Practices - Industry standards, accessibility, scalability

Be specific and actionable in your recommendations.`
          },
          {
            role: 'user',
            content: auditPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let auditResult: AuditResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      auditResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return a fallback response
      auditResult = {
        overallScore: 70,
        categories: [
          {
            name: 'Analysis',
            score: 70,
            findings: ['Brand data was analyzed but structured parsing failed'],
            recommendations: ['Please try again or provide more detailed brand information']
          }
        ],
        summary: content.substring(0, 200),
        strengths: ['Brand guide exists'],
        weaknesses: ['Could not perform detailed analysis'],
        actionItems: ['Review and enhance brand guide completeness']
      };
    }

    console.log(`Audit complete. Overall score: ${auditResult.overallScore}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit: auditResult,
        brandName: brand.hero?.name,
        auditDate: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform brand audit';
    console.error('Brand audit error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAuditPrompt(brand: BrandData): string {
  const sections = [];

  sections.push(`# Brand Audit Request: ${brand.hero?.name || 'Unnamed Brand'}`);
  sections.push(`Type: ${brand.type || 'brand'}`);
  
  if (brand.hero) {
    sections.push(`\n## Identity`);
    sections.push(`- Name: ${brand.hero.name}`);
    sections.push(`- Tagline: ${brand.hero.tagline || 'Not defined'}`);
  }

  if (brand.identity) {
    sections.push(`\n## Brand Narrative`);
    sections.push(`- Mission: ${brand.identity.missionStatement || 'Not defined'}`);
    sections.push(`- Archetype: ${brand.identity.archetype || 'Not defined'}`);
    sections.push(`- Tone of Voice: ${brand.identity.toneOfVoice?.join(', ') || 'Not defined'}`);
  }

  if (brand.values && brand.values.length > 0) {
    sections.push(`\n## Brand Values (${brand.values.length} defined)`);
    brand.values.forEach((v, i) => {
      sections.push(`${i + 1}. ${v.title}: ${v.description || 'No description'}`);
    });
  } else {
    sections.push(`\n## Brand Values: None defined`);
  }

  if (brand.colors && brand.colors.length > 0) {
    sections.push(`\n## Color Palette (${brand.colors.length} colors)`);
    brand.colors.forEach(c => {
      sections.push(`- ${c.name}: ${c.hex} - ${c.usage || 'No usage defined'}`);
    });
  } else {
    sections.push(`\n## Color Palette: None defined`);
  }

  if (brand.typography && brand.typography.length > 0) {
    sections.push(`\n## Typography (${brand.typography.length} styles)`);
    brand.typography.forEach(t => {
      sections.push(`- ${t.name}: ${t.fontFamily} - ${t.usage || 'No usage defined'}`);
    });
  } else {
    sections.push(`\n## Typography: None defined`);
  }

  if (brand.gradients && brand.gradients.length > 0) {
    sections.push(`\n## Gradients: ${brand.gradients.length} defined`);
  }

  if (brand.patterns && brand.patterns.length > 0) {
    sections.push(`\n## Patterns: ${brand.patterns.length} defined`);
  }

  sections.push(`\n\nPlease analyze this brand guide for cohesion, completeness, and best practices. Return your analysis as JSON.`);

  return sections.join('\n');
}
