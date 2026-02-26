import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) throw new Error('Unauthorized');

  const userId = claimsData.claims.sub;
  const { data: canUse } = await supabase.rpc('can_use_ai_features', { _user_id: userId });
  if (!canUse) throw new Error('Admin access required');

  return userId;
}

function getDropboxToken() {
  const token = Deno.env.get('DROPBOX_ACCESS_TOKEN');
  if (!token) throw new Error('Dropbox access token not configured');
  return token;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']);

function isImageFile(name: string): boolean {
  const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

// Normalize a Dropbox path — strip full URLs like https://www.dropbox.com/work/...
function normalizeDropboxPath(input: string): string {
  let p = decodeURIComponent(input).trim();
  // Strip full Dropbox web URLs
  p = p.replace(/^https?:\/\/www\.dropbox\.com\/(home|work|personal)/, '');
  // Ensure leading slash
  if (p && !p.startsWith('/')) p = '/' + p;
  return p || '';
}

// List image files in a Dropbox folder
async function handleListFolder(body: any) {
  const token = getDropboxToken();
  const { cursor } = body;
  const folderPath = body.folderPath ? normalizeDropboxPath(body.folderPath) : undefined;

  if (!folderPath && !cursor) throw new Error('folderPath is required');

  const endpoint = cursor
    ? 'https://api.dropboxapi.com/2/files/list_folder/continue'
    : 'https://api.dropboxapi.com/2/files/list_folder';

  const payload = cursor
    ? { cursor }
    : { path: folderPath, recursive: false, limit: 100 };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Dropbox list_folder error:', res.status, errText);
    throw new Error(`Dropbox API error: ${res.status}`);
  }

  const data = await res.json();

  // Filter to image files only
  const imageEntries = (data.entries || []).filter(
    (e: any) => e['.tag'] === 'file' && isImageFile(e.name)
  );

  // Get thumbnails in batch (max 25 per call)
  const thumbnails = await getThumbnailsBatch(token, imageEntries);

  const files = imageEntries.map((entry: any, idx: number) => ({
    id: entry.id,
    name: entry.name,
    path: entry.path_display || entry.path_lower,
    size: entry.size,
    modified: entry.server_modified,
    thumbnailData: thumbnails[idx] || null,
  }));

  return {
    files,
    hasMore: data.has_more,
    cursor: data.cursor,
  };
}

async function getThumbnailsBatch(token: string, entries: any[]): Promise<(string | null)[]> {
  if (entries.length === 0) return [];

  // Process in chunks of 25 (Dropbox batch limit)
  const results: (string | null)[] = [];

  for (let i = 0; i < entries.length; i += 25) {
    const chunk = entries.slice(i, i + 25);
    const batchEntries = chunk.map((e: any) => ({
      path: e.path_lower || e.path_display,
      format: 'jpeg',
      size: 'w256h256',
      mode: 'fitone_bestfit',
    }));

    try {
      const res = await fetch('https://content.dropboxapi.com/2/files/get_thumbnail_batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: batchEntries }),
      });

      if (res.ok) {
        const data = await res.json();
        for (const entry of data.entries) {
          if (entry['.tag'] === 'success' && entry.thumbnail) {
            results.push(`data:image/jpeg;base64,${entry.thumbnail}`);
          } else {
            results.push(null);
          }
        }
      } else {
        // Fill with nulls on error
        chunk.forEach(() => results.push(null));
      }
    } catch {
      chunk.forEach(() => results.push(null));
    }
  }

  return results;
}

// Get a temporary download link for a file
async function handleGetDownloadLink(body: any) {
  const token = getDropboxToken();
  const { filePath } = body;

  if (!filePath) throw new Error('filePath is required');

  const res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Dropbox get_temporary_link error:', res.status, errText);
    throw new Error(`Dropbox API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    downloadUrl: data.link,
    metadata: {
      name: data.metadata?.name,
      size: data.metadata?.size,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAuth(req);
    const body = await req.json();
    const action = body.action || 'list';

    let result;
    if (action === 'download') {
      result = await handleGetDownloadLink(body);
    } else {
      result = await handleListFolder(body);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    console.error('dropbox-imagery error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
