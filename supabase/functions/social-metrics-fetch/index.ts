import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Platform API configurations
const PLATFORM_CONFIGS: Record<string, {
  name: string;
  fetchMetrics: (credentials: Record<string, string>, accountId: string) => Promise<Record<string, unknown>>;
}> = {
  'Instagram': {
    name: 'Instagram',
    fetchMetrics: async (creds, accountId) => {
      // Meta Graph API for Instagram Business/Creator accounts
      const accessToken = creds.access_token;
      if (!accessToken) throw new Error("Missing Instagram access_token");

      const baseUrl = `https://graph.facebook.com/v19.0/${accountId}`;
      
      // Fetch user info
      const userResp = await fetch(`${baseUrl}?fields=followers_count,media_count,username&access_token=${accessToken}`);
      if (!userResp.ok) throw new Error(`Instagram API error: ${userResp.status}`);
      const userData = await userResp.json();

      // Fetch insights (last 30 days)
      const insightsResp = await fetch(
        `${baseUrl}/insights?metric=reach,impressions,accounts_engaged&period=day&since=${Math.floor(Date.now()/1000) - 30*86400}&until=${Math.floor(Date.now()/1000)}&access_token=${accessToken}`
      );
      let reach = 0, impressions = 0;
      if (insightsResp.ok) {
        const insightsData = await insightsResp.json();
        for (const metric of insightsData.data || []) {
          const total = (metric.values || []).reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          if (metric.name === 'reach') reach = total;
          if (metric.name === 'impressions') impressions = total;
        }
      }

      // Fetch recent media for engagement calculation
      const mediaResp = await fetch(`${baseUrl}/media?fields=like_count,comments_count,shares&limit=25&access_token=${accessToken}`);
      let avgLikes = 0, avgComments = 0, avgShares = 0;
      if (mediaResp.ok) {
        const mediaData = await mediaResp.json();
        const posts = mediaData.data || [];
        if (posts.length > 0) {
          avgLikes = posts.reduce((s: number, p: any) => s + (p.like_count || 0), 0) / posts.length;
          avgComments = posts.reduce((s: number, p: any) => s + (p.comments_count || 0), 0) / posts.length;
          avgShares = posts.reduce((s: number, p: any) => s + (p.shares || 0), 0) / posts.length;
        }
      }

      const followers = userData.followers_count || 0;
      const engagementRate = followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0;

      return {
        followers_count: followers,
        posts_count: userData.media_count || 0,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_likes_per_post: Math.round(avgLikes),
        avg_comments_per_post: Math.round(avgComments),
        avg_shares_per_post: Math.round(avgShares),
        reach_count: reach,
        impressions_count: impressions,
        organic_reach_count: reach,
      };
    }
  },
  'Facebook': {
    name: 'Facebook',
    fetchMetrics: async (creds, accountId) => {
      const accessToken = creds.access_token;
      if (!accessToken) throw new Error("Missing Facebook access_token");

      const baseUrl = `https://graph.facebook.com/v19.0/${accountId}`;
      
      const pageResp = await fetch(`${baseUrl}?fields=fan_count,name&access_token=${accessToken}`);
      if (!pageResp.ok) throw new Error(`Facebook API error: ${pageResp.status}`);
      const pageData = await pageResp.json();

      const insightsResp = await fetch(
        `${baseUrl}/insights?metric=page_impressions,page_engaged_users,page_fan_adds&period=days_28&access_token=${accessToken}`
      );
      let impressions = 0, engaged = 0, newFans = 0;
      if (insightsResp.ok) {
        const insightsData = await insightsResp.json();
        for (const metric of insightsData.data || []) {
          const lastValue = metric.values?.[metric.values.length - 1]?.value || 0;
          if (metric.name === 'page_impressions') impressions = lastValue;
          if (metric.name === 'page_engaged_users') engaged = lastValue;
          if (metric.name === 'page_fan_adds') newFans = lastValue;
        }
      }

      const followers = pageData.fan_count || 0;
      const growthRate = followers > 0 ? (newFans / followers) * 100 : 0;

      return {
        followers_count: followers,
        impressions_count: impressions,
        engagement_rate: followers > 0 ? Math.round((engaged / followers) * 10000) / 100 : 0,
        follower_growth_percent: Math.round(growthRate * 100) / 100,
        reach_count: impressions,
      };
    }
  },
  'X (Twitter)': {
    name: 'X (Twitter)',
    fetchMetrics: async (creds, accountId) => {
      // X API v2
      const bearerToken = creds.bearer_token;
      if (!bearerToken) throw new Error("Missing X bearer_token");

      const headers = { Authorization: `Bearer ${bearerToken}` };

      // Get user info
      const userResp = await fetch(
        `https://api.x.com/2/users/${accountId}?user.fields=public_metrics`,
        { headers }
      );
      if (!userResp.ok) throw new Error(`X API error: ${userResp.status}`);
      const userData = await userResp.json();
      const metrics = userData.data?.public_metrics || {};

      // Get recent tweets for engagement
      const tweetsResp = await fetch(
        `https://api.x.com/2/users/${accountId}/tweets?max_results=20&tweet.fields=public_metrics`,
        { headers }
      );
      let avgLikes = 0, avgComments = 0, avgShares = 0;
      if (tweetsResp.ok) {
        const tweetsData = await tweetsResp.json();
        const tweets = tweetsData.data || [];
        if (tweets.length > 0) {
          avgLikes = tweets.reduce((s: number, t: any) => s + (t.public_metrics?.like_count || 0), 0) / tweets.length;
          avgComments = tweets.reduce((s: number, t: any) => s + (t.public_metrics?.reply_count || 0), 0) / tweets.length;
          avgShares = tweets.reduce((s: number, t: any) => s + (t.public_metrics?.retweet_count || 0), 0) / tweets.length;
        }
      }

      const followers = metrics.followers_count || 0;
      const engagementRate = followers > 0 ? ((avgLikes + avgComments + avgShares) / followers) * 100 : 0;

      return {
        followers_count: followers,
        posts_count: metrics.tweet_count || 0,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        avg_likes_per_post: Math.round(avgLikes),
        avg_comments_per_post: Math.round(avgComments),
        avg_shares_per_post: Math.round(avgShares),
        brand_mentions_count: metrics.listed_count || 0,
      };
    }
  },
  'LinkedIn': {
    name: 'LinkedIn',
    fetchMetrics: async (creds, accountId) => {
      const accessToken = creds.access_token;
      if (!accessToken) throw new Error("Missing LinkedIn access_token");

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202401',
      };

      // Get org follower stats
      const statsResp = await fetch(
        `https://api.linkedin.com/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${accountId}`,
        { headers }
      );
      
      let followers = 0;
      if (statsResp.ok) {
        const statsData = await statsResp.json();
        const elements = statsData.elements || [];
        if (elements.length > 0) {
          followers = elements[0]?.followerCounts?.organicFollowerCount || 0;
        }
      }

      return {
        followers_count: followers,
        engagement_rate: 0,
        posts_count: 0,
      };
    }
  },
  'YouTube': {
    name: 'YouTube',
    fetchMetrics: async (creds, accountId) => {
      const apiKey = creds.api_key;
      if (!apiKey) throw new Error("Missing YouTube api_key");

      const channelResp = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${accountId}&key=${apiKey}`
      );
      if (!channelResp.ok) throw new Error(`YouTube API error: ${channelResp.status}`);
      const channelData = await channelResp.json();
      const stats = channelData.items?.[0]?.statistics || {};

      return {
        followers_count: parseInt(stats.subscriberCount || '0'),
        posts_count: parseInt(stats.videoCount || '0'),
        impressions_count: parseInt(stats.viewCount || '0'),
        engagement_rate: 0,
      };
    }
  },
  'TikTok': {
    name: 'TikTok',
    fetchMetrics: async (creds, accountId) => {
      const accessToken = creds.access_token;
      if (!accessToken) throw new Error("Missing TikTok access_token");

      const resp = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!resp.ok) throw new Error(`TikTok API error: ${resp.status}`);
      const data = await resp.json();
      const user = data.data?.user || {};

      return {
        followers_count: user.follower_count || 0,
        posts_count: user.video_count || 0,
        avg_likes_per_post: user.likes_count && user.video_count ? Math.round(user.likes_count / user.video_count) : 0,
        engagement_rate: 0,
      };
    }
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entityId, entityType, organizationId, platform, credentialId } = await req.json();

    if (!entityId || !platform) {
      return new Response(JSON.stringify({ error: "entityId and platform are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch credential from DB using service role
    const credQuery = credentialId 
      ? `id=eq.${credentialId}`
      : `organization_id=eq.${organizationId}&platform=eq.${platform}&is_active=eq.true`;
    
    const credResp = await fetch(
      `${SUPABASE_URL}/rest/v1/social_platform_credentials?${credQuery}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!credResp.ok) throw new Error("Failed to fetch credentials");
    const creds = await credResp.json();

    if (!creds || creds.length === 0) {
      return new Response(JSON.stringify({ 
        error: "no_credentials",
        message: `No API credentials configured for ${platform}. Add credentials in the Social Registry settings.` 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credential = creds[0];
    const platformConfig = PLATFORM_CONFIGS[platform];

    if (!platformConfig) {
      return new Response(JSON.stringify({ 
        error: "unsupported_platform",
        message: `Platform "${platform}" is not yet supported for API integration.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create sync history record
    const syncResp = await fetch(`${SUPABASE_URL}/rest/v1/social_sync_history`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        credential_id: credential.id,
        entity_id: entityId,
        entity_type: entityType,
        platform,
        status: "running",
      }),
    });
    const syncRecord = (await syncResp.json())?.[0];

    try {
      // Fetch real metrics
      const metrics = await platformConfig.fetchMetrics(
        credential.credentials,
        credential.account_id || ''
      );

      // Update sync history with success
      if (syncRecord?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/social_sync_history?id=eq.${syncRecord.id}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
            metrics_fetched: metrics,
            completed_at: new Date().toISOString(),
          }),
        });
      }

      // Update credential last_sync
      await fetch(`${SUPABASE_URL}/rest/v1/social_platform_credentials?id=eq.${credential.id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          last_sync_at: new Date().toISOString(),
          sync_status: "success",
          sync_error: null,
        }),
      });

      return new Response(JSON.stringify({ success: true, metrics, data_source: 'api' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (fetchError) {
      // Update sync history with failure
      const errorMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
      
      if (syncRecord?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/social_sync_history?id=eq.${syncRecord.id}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "failed",
            error_message: errorMsg,
            completed_at: new Date().toISOString(),
          }),
        });
      }

      // Update credential sync status
      await fetch(`${SUPABASE_URL}/rest/v1/social_platform_credentials?id=eq.${credential.id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sync_status: "error",
          sync_error: errorMsg,
        }),
      });

      throw fetchError;
    }

  } catch (error) {
    console.error("social-metrics-fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
