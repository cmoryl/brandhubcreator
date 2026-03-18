import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    throw new Error('Unauthorized');
  }

  const userId = claimsData.claims.sub;
  const { data: canUse } = await supabase.rpc('can_use_ai_features', { _user_id: userId });
  if (!canUse) {
    throw new Error('Admin access required');
  }

  return userId;
}

function getToken() {
  const token = Deno.env.get('SHUTTERSTOCK_API_TOKEN');
  if (!token) throw new Error('Shutterstock API token not configured');
  return token;
}

// Fetch a single image by its Shutterstock ID
async function handleGetById(body: any) {
  const token = getToken();
  const { imageId } = body;

  if (!imageId || typeof imageId !== 'string') {
    throw new Error('Image ID is required');
  }

  const ssResponse = await fetch(`https://api.shutterstock.com/v2/images/${imageId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!ssResponse.ok) {
    const errorText = await ssResponse.text();
    console.error('Shutterstock get-by-id error:', ssResponse.status, errorText);
    if (ssResponse.status === 404) {
      throw new Error(`Image ID ${imageId} not found on Shutterstock`);
    }
    throw new Error(`Shutterstock API error: ${ssResponse.status}`);
  }

  const img = await ssResponse.json();

  const result = {
    id: img.id,
    description: img.description,
    url: img.assets?.preview?.url || img.assets?.large_thumb?.url || '',
    thumbnailUrl: img.assets?.large_thumb?.url || img.assets?.small_thumb?.url || '',
    previewUrl: img.assets?.preview?.url || '',
    width: img.assets?.preview?.width || 0,
    height: img.assets?.preview?.height || 0,
    contributor: img.contributor?.id,
    categories: (img.categories || []).map((c: any) => c.name),
    media_type: img.media_type || 'image',
  };

  return {
    results: [result],
    totalCount: 1,
    page: 1,
    perPage: 1,
  };
}

async function handleSearch(body: any) {
  const token = getToken();
  const { query, orientation, category, page = 1, per_page = 20, image_type } = body;

  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(Math.min(per_page, 50)),
    sort: 'popular',
  });

  // image_type filter: photo, vector, illustration (default: photo)
  if (image_type && ['photo', 'vector', 'illustration'].includes(image_type)) {
    params.set('image_type', image_type);
  } else if (!image_type || image_type === 'all') {
    // Don't set image_type to return all types
  } else {
    params.set('image_type', 'photo');
  }

  if (orientation && ['horizontal', 'vertical', 'square'].includes(orientation)) {
    params.set('orientation', orientation);
  }
  if (category) {
    params.set('category', category);
  }

  const ssResponse = await fetch(`https://api.shutterstock.com/v2/images/search?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!ssResponse.ok) {
    const errorText = await ssResponse.text();
    console.error('Shutterstock API error:', ssResponse.status, errorText);
    throw new Error(`Shutterstock API error: ${ssResponse.status}`);
  }

  const ssData = await ssResponse.json();

  const results = (ssData.data || []).map((img: any) => ({
    id: img.id,
    description: img.description,
    url: img.assets?.preview?.url || img.assets?.large_thumb?.url || '',
    thumbnailUrl: img.assets?.large_thumb?.url || img.assets?.small_thumb?.url || '',
    previewUrl: img.assets?.preview?.url || '',
    width: img.assets?.preview?.width || 0,
    height: img.assets?.preview?.height || 0,
    contributor: img.contributor?.id,
    categories: (img.categories || []).map((c: any) => c.name),
    media_type: img.media_type || 'image',
  }));

  return {
    results,
    totalCount: ssData.total_count || 0,
    page: ssData.page || page,
    perPage: ssData.per_page || per_page,
  };
}

async function handleDownload(body: any) {
  const token = getToken();
  const { imageId } = body;

  if (!imageId) {
    throw new Error('Image ID is required');
  }

  // License the image first
  const licenseResponse = await fetch('https://api.shutterstock.com/v2/images/licenses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      images: [{ image_id: imageId, subscription_id: undefined, format: 'jpg', size: 'huge' }],
    }),
  });

  if (!licenseResponse.ok) {
    const errorText = await licenseResponse.text();
    console.error('Shutterstock license error:', licenseResponse.status, errorText);

    // 403 = subscription tier doesn't support licensing API
    if (licenseResponse.status === 403) {
      const redownloadResponse = await fetch(`https://api.shutterstock.com/v2/images/licenses?image_id=${imageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (redownloadResponse.ok) {
        const redownloadData = await redownloadResponse.json();
        const existing = redownloadData.data?.[0];
        if (existing?.download?.url) {
          return { downloadUrl: existing.download.url, alreadyLicensed: true };
        }
      }

      return {
        downloadUrl: null,
        requiresUpgrade: true,
        shutterstockUrl: `https://www.shutterstock.com/image-photo/${imageId}`,
        message: 'Your Shutterstock subscription does not support API-based licensing. You can download this image directly from Shutterstock.',
      };
    }

    const redownloadResponse = await fetch(`https://api.shutterstock.com/v2/images/licenses?image_id=${imageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (redownloadResponse.ok) {
      const redownloadData = await redownloadResponse.json();
      const existing = redownloadData.data?.[0];
      if (existing?.download?.url) {
        return { downloadUrl: existing.download.url, alreadyLicensed: true };
      }
    }

    throw new Error(`Failed to license image: ${licenseResponse.status}`);
  }

  const licenseData = await licenseResponse.json();
  const downloadUrl = licenseData.data?.[0]?.download?.url;

  if (!downloadUrl) {
    throw new Error('No download URL returned from Shutterstock');
  }

  return { downloadUrl, alreadyLicensed: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAuth(req);
    const body = await req.json();
    const action = body.action || 'search';

    let result;
    if (action === 'download') {
      result = await handleDownload(body);
    } else if (action === 'get_by_id') {
      result = await handleGetById(body);
    } else {
      result = await handleSearch(body);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    console.error('shutterstock-search error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
