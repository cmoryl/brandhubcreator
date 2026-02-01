import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, eventIds } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.length < 10 || prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Prompt must be between 10 and 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check recent prompt runs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: promptCount } = await supabaseClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'event_prompt')
      .gte('created_at', oneHourAgo);

    if (promptCount !== null && promptCount >= 20) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 20 event prompts per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch events - RLS handles access control
    let eventsQuery = supabaseClient
      .from('events')
      .select('id, name, guide_data, is_public, organization_id, parent_brand_id, created_at, updated_at');

    if (eventIds && Array.isArray(eventIds) && eventIds.length > 0) {
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = eventIds.filter((id: string) => uuidRegex.test(id));
      if (validIds.length > 0) {
        eventsQuery = eventsQuery.in('id', validIds.slice(0, 30)); // Limit to 30 events
      }
    }

    const { data: events, error: eventsError } = await eventsQuery.limit(30);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch parent brand names for context
    const brandIds = [...new Set((events || []).filter(e => e.parent_brand_id).map(e => e.parent_brand_id))];
    let brandMap = new Map<string, string>();
    
    if (brandIds.length > 0) {
      const { data: brands } = await supabaseClient
        .from('brands')
        .select('id, name')
        .in('id', brandIds as string[]);
      
      brandMap = new Map(brands?.map(b => [b.id, b.name]) || []);
    }

    // Build context from event data
    const eventContext = buildEventContext(events || [], brandMap);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Running event prompt for user ${user.id} on ${events?.length || 0} events`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert event planner, strategist, and brand event coordinator. You have access to a portfolio of event data and will answer questions or perform analysis based on the user's prompt.

Be concise, specific, and actionable in your responses. Use data from the provided events to support your analysis. Format your response in clear sections with headers when appropriate.

You understand:
- Event logistics: venues, schedules, speakers, sponsors
- Event branding: signage, banners, digital materials, visual identity
- Event marketing: promotional materials, social assets, email campaigns
- Event history: past events, learnings, trends
- Brand alignment: how events connect to parent brands

If asked to analyze readiness, check completeness of schedules, speaker info, sponsor integration, and materials.
If asked for recommendations, prioritize by impact on attendee experience.
If data is missing or incomplete, note this and provide guidance on what information would help.`
          },
          {
            role: 'user',
            content: `## Event Portfolio Data\n\n${eventContext}\n\n---\n\n## User Request\n\n${prompt}`
          }
        ],
        temperature: 0.4,
        max_tokens: 3000,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this prompt for rate limiting
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        brand_id: events?.[0]?.parent_brand_id || '00000000-0000-0000-0000-000000000000',
        action_type: 'event_prompt',
        entity_type: 'event_report',
        entity_name: prompt.substring(0, 100),
        details: { eventCount: events?.length || 0 }
      });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to run event prompt';
    console.error('Run event prompt error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildEventContext(events: unknown[], brandMap: Map<string, string>): string {
  const sections: string[] = [];
  
  // Portfolio overview
  const upcomingCount = events.filter((e: any) => {
    const details = e.guide_data?.eventDetails || {};
    if (details.endDate || details.startDate) {
      try {
        const dateStr = details.endDate || details.startDate;
        return new Date(dateStr) > new Date();
      } catch { return false; }
    }
    return false;
  }).length;

  sections.push(`### Event Portfolio Overview`);
  sections.push(`- Total Events: ${events.length}`);
  sections.push(`- Upcoming Events: ${upcomingCount}`);
  sections.push(`- Past Events: ${events.length - upcomingCount}`);
  sections.push(`- Public Events: ${events.filter((e: any) => e.is_public).length}`);
  sections.push('');

  // Aggregate stats
  let totalSpeakers = 0;
  let totalSponsors = 0;
  let eventsWithSchedules = 0;

  for (const event of events as any[]) {
    const guideData = event.guide_data || {};
    const speakers = guideData.eventSpeakers || [];
    const sponsors = guideData.eventSponsors || [];
    const schedule = guideData.eventSchedule || [];
    
    totalSpeakers += speakers.length;
    totalSponsors += sponsors.length;
    if (schedule.length > 0) eventsWithSchedules++;
  }

  sections.push(`### Aggregate Statistics`);
  sections.push(`- Total Speakers: ${totalSpeakers}`);
  sections.push(`- Total Sponsors: ${totalSponsors}`);
  sections.push(`- Events with Schedules: ${eventsWithSchedules}`);
  sections.push('');

  // Individual event details
  for (const event of events as any[]) {
    const guideData = event.guide_data || {};
    const hero = guideData.hero || {};
    const eventDetails = guideData.eventDetails || {};
    const eventLocation = guideData.eventLocation || {};
    const schedule = guideData.eventSchedule || [];
    const speakers = guideData.eventSpeakers || [];
    const sponsors = guideData.eventSponsors || [];
    const signage = guideData.eventSignage || [];
    const banners = guideData.eventBanners || [];
    const digitalMaterials = guideData.eventDigitalMaterials || [];
    const videos = guideData.eventVideos || [];
    const history = guideData.eventHistory || [];
    const colors = guideData.colors || [];
    const logos = guideData.logos || [];
    const eventLogos = guideData.eventLogos || [];

    const eventName = eventDetails.eventName || hero.name || event.name;
    const parentBrandName = event.parent_brand_id ? brandMap.get(event.parent_brand_id) : null;

    sections.push(`### ${eventName}`);
    sections.push(`- Status: ${event.is_public ? 'Public' : 'Private'}`);
    if (parentBrandName) sections.push(`- Parent Brand: ${parentBrandName}`);
    
    if (eventDetails.eventType) sections.push(`- Type: ${eventDetails.eventType}`);
    if (eventDetails.eventDates) sections.push(`- Dates: ${eventDetails.eventDates}`);
    if (eventDetails.location || eventLocation.venueName) {
      sections.push(`- Location: ${eventLocation.venueName || eventDetails.venue || eventDetails.location || ''}`);
    }
    if (eventDetails.expectedAttendees) sections.push(`- Expected Attendees: ${eventDetails.expectedAttendees}`);
    if (eventDetails.hashtag) sections.push(`- Hashtag: ${eventDetails.hashtag}`);
    
    // Schedule info
    if (schedule.length > 0) {
      sections.push(`- Schedule: ${schedule.length} sessions`);
    }
    
    // Speakers
    if (speakers.length > 0) {
      const speakerNames = speakers.slice(0, 5).map((s: any) => s.name).join(', ');
      sections.push(`- Speakers (${speakers.length}): ${speakerNames}${speakers.length > 5 ? '...' : ''}`);
    }
    
    // Sponsors
    if (sponsors.length > 0) {
      const tierCounts = sponsors.reduce((acc: any, s: any) => {
        acc[s.tier] = (acc[s.tier] || 0) + 1;
        return acc;
      }, {});
      const tierSummary = Object.entries(tierCounts).map(([tier, count]) => `${tier}: ${count}`).join(', ');
      sections.push(`- Sponsors (${sponsors.length}): ${tierSummary}`);
    }
    
    // Materials
    const materialsCount = signage.length + banners.length + digitalMaterials.length;
    if (materialsCount > 0) {
      sections.push(`- Materials: ${signage.length} signage, ${banners.length} banners, ${digitalMaterials.length} digital`);
    }
    
    if (videos.length > 0) sections.push(`- Videos: ${videos.length}`);
    if (history.length > 0) sections.push(`- Past Events Archived: ${history.length}`);
    
    // Visual identity
    const totalLogos = logos.length + eventLogos.length;
    if (totalLogos > 0) sections.push(`- Logos: ${totalLogos} defined`);
    if (colors.length > 0) sections.push(`- Colors: ${colors.length} defined`);
    
    // Calculate completeness
    let score = 0;
    if (eventName) score += 10;
    if (eventDetails.eventDates) score += 10;
    if (eventDetails.location || eventLocation.venueName) score += 10;
    if (totalLogos > 0) score += 10;
    if (colors.length > 0) score += 5;
    if (schedule.length > 0) score += 15;
    if (speakers.length > 0) score += 10;
    if (sponsors.length > 0) score += 10;
    if (signage.length > 0 || banners.length > 0) score += 10;
    if (digitalMaterials.length > 0) score += 5;
    if (eventLocation.address || eventLocation.googleMapsUrl) score += 5;
    
    sections.push(`- Completeness: ${score}%`);
    
    // Missing items
    const missing: string[] = [];
    if (!eventDetails.eventDates) missing.push('dates');
    if (!eventDetails.location && !eventLocation.venueName) missing.push('location');
    if (schedule.length === 0) missing.push('schedule');
    if (totalLogos === 0) missing.push('logo');
    if (missing.length > 0) {
      sections.push(`- Missing: ${missing.join(', ')}`);
    }
    
    sections.push('');
  }

  return sections.join('\n');
}
