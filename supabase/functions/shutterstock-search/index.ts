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

function mapImageResult(img: any) {
  return {
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
    if (ssResponse.status === 404) {
      throw new Error(`Image ID ${imageId} not found on Shutterstock`);
    }
    throw new Error(`Shutterstock API error: ${ssResponse.status}`);
  }

  const img = await ssResponse.json();

  return {
    results: [mapImageResult(img)],
    totalCount: 1,
    page: 1,
    perPage: 1,
  };
}

// Find visually similar images
async function handleSimilar(body: any) {
  const token = getToken();
  const { imageId, page = 1, per_page = 20 } = body;

  if (!imageId) {
    throw new Error('Image ID is required for similar search');
  }

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(Math.min(per_page, 50)),
  });

  const ssResponse = await fetch(
    `https://api.shutterstock.com/v2/images/${imageId}/similar?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!ssResponse.ok) {
    const errorText = await ssResponse.text();
    console.error('Shutterstock similar error:', ssResponse.status, errorText);
    throw new Error(`Shutterstock API error: ${ssResponse.status}`);
  }

  const ssData = await ssResponse.json();

  return {
    results: (ssData.data || []).map(mapImageResult),
    totalCount: ssData.total_count || 0,
    page: ssData.page || page,
    perPage: ssData.per_page || per_page,
  };
}

// Reverse image search - upload base64 image to find similar
async function handleReverseImage(body: any) {
  const token = getToken();
  const { base64Image, page = 1, per_page = 20 } = body;

  if (!base64Image || typeof base64Image !== 'string') {
    throw new Error('base64Image is required for reverse image search');
  }

  // Shutterstock CV similar images endpoint
  const ssResponse = await fetch('https://api.shutterstock.com/v2/cv/similar/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      base64_image: base64Image.replace(/^data:image\/[^;]+;base64,/, ''),
      page,
      per_page: Math.min(per_page, 50),
    }),
  });

  if (!ssResponse.ok) {
    const errorText = await ssResponse.text();
    console.error('Shutterstock reverse image error:', ssResponse.status, errorText);
    throw new Error(`Shutterstock reverse image search error: ${ssResponse.status}`);
  }

  const ssData = await ssResponse.json();

  return {
    results: (ssData.data || []).map(mapImageResult),
    totalCount: ssData.total_count || 0,
    page: ssData.page || page,
    perPage: ssData.per_page || per_page,
  };
}

// Get available categories
async function handleCategories() {
  const token = getToken();

  const ssResponse = await fetch('https://api.shutterstock.com/v2/images/categories', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!ssResponse.ok) {
    throw new Error(`Shutterstock categories error: ${ssResponse.status}`);
  }

  const ssData = await ssResponse.json();
  return {
    categories: (ssData.data || []).map((c: any) => ({ id: c.id, name: c.name })),
  };
}

async function handleSearch(body: any) {
  const token = getToken();
  const {
    query, orientation, category, page = 1, per_page = 20,
    image_type, color, people_number, people_age, people_ethnicity, people_gender,
    sort, safe, min_width, min_height, exclude_keywords,
  } = body;

  if (!query || typeof query !== 'string') {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(Math.min(per_page, 50)),
    sort: sort || 'popular',
  });

  // Safe search
  if (safe === true || safe === 'true') {
    params.set('safe', 'true');
  }

  // Min dimensions
  if (min_width && Number(min_width) > 0) {
    params.set('width_from', String(min_width));
  }
  if (min_height && Number(min_height) > 0) {
    params.set('height_from', String(min_height));
  }

  // Exclude keywords (Shutterstock uses negative keywords with -)
  // We append them to the query as "query NOT keyword1 NOT keyword2"
  let finalQuery = query;
  if (exclude_keywords && typeof exclude_keywords === 'string' && exclude_keywords.trim()) {
    const excludeTerms = exclude_keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    if (excludeTerms.length > 0) {
      finalQuery = `${query} NOT ${excludeTerms.join(' NOT ')}`;
      params.set('query', finalQuery);
    }
  }

  // image_type filter
  if (image_type && ['photo', 'vector', 'illustration'].includes(image_type)) {
    params.set('image_type', image_type);
  }

  if (orientation && ['horizontal', 'vertical', 'square'].includes(orientation)) {
    params.set('orientation', orientation);
  }
  if (category) {
    params.set('category', category);
  }

  // Color filter (hex without #)
  if (color && /^[0-9A-Fa-f]{6}$/.test(color)) {
    params.set('color', color);
  }

  // People filters
  if (people_number !== undefined && people_number !== null && people_number !== '') {
    params.set('people_number', String(people_number));
  }
  if (people_age && typeof people_age === 'string') {
    params.set('people_age', people_age);
  }
  if (people_ethnicity && typeof people_ethnicity === 'string') {
    params.set('people_ethnicity', people_ethnicity);
  }
  if (people_gender && typeof people_gender === 'string') {
    params.set('people_gender', people_gender);
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

  return {
    results: (ssData.data || []).map(mapImageResult),
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

    if (licenseResponse.status === 403) {
      const redownloadResponse = await fetch(`https://api.shutterstock.com/v2/images/licenses?image_id=${imageId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
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
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
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
    switch (action) {
      case 'download':
        result = await handleDownload(body);
        break;
      case 'get_by_id':
        result = await handleGetById(body);
        break;
      case 'similar':
        result = await handleSimilar(body);
        break;
      case 'reverse_image':
        result = await handleReverseImage(body);
        break;
      case 'categories':
        result = await handleCategories();
        break;
      default:
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
