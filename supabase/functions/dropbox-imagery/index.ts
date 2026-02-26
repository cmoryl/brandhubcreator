import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

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

function isSharedLink(input: string): boolean {
  const cleaned = input.replace(/^\/+/, '');
  return cleaned.startsWith('https://www.dropbox.com/scl/') || 
         cleaned.startsWith('https://www.dropbox.com/sh/') ||
         cleaned.startsWith('https://www.dropbox.com/s/');
}

function extractSharedLink(input: string): string {
  return decodeURIComponent(input).trim().replace(/^\/+/, '');
}

function normalizeDropboxPath(input: string): string {
  let p = decodeURIComponent(input).trim();
  p = p.replace(/^\/+/, '');
  p = p.replace(/^https?:\/\/www\.dropbox\.com\/(home|work|personal)/, '');
  if (p && !p.startsWith('/')) p = '/' + p;
  return p === '/' ? '' : p;
}

async function getAccountRootNs(token: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const account = await res.json();
    return account?.root_info?.root_namespace_id || null;
  } catch {
    return null;
  }
}

function getMimeType(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
    '.tiff': 'image/tiff', '.svg': 'image/svg+xml',
  };
  return mimeMap[ext] || 'image/jpeg';
}

// List image files in a Dropbox folder
async function handleListFolder(body: any) {
  const token = getDropboxToken();
  const { cursor } = body;
  const rawPath = body.folderPath;

  if (rawPath === undefined && !cursor) throw new Error('folderPath is required');

  console.log('Raw folderPath input:', rawPath);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let res: Response;
  let usedSharedLink: string | null = null;

  if (cursor) {
    res = await fetch('https://api.dropboxapi.com/2/files/list_folder/continue', {
      method: 'POST',
      headers,
      body: JSON.stringify({ cursor }),
    });
  } else if (rawPath && isSharedLink(rawPath)) {
    const sharedUrl = extractSharedLink(rawPath);
    usedSharedLink = sharedUrl;
    console.log('Detected shared link, using sharing API:', sharedUrl);

    res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        path: '',
        shared_link: { url: sharedUrl },
        recursive: false,
        limit: 100,
      }),
    });

    if (res.status === 409) {
      const errBody = await res.text();
      console.error('Shared link list_folder 409:', errBody);
      const metaRes = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: sharedUrl }),
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        console.log('Shared link metadata path:', meta.path_lower);
        const folderPath = meta.path_lower || '';
        const rootNsId = await getAccountRootNs(token);
        const extraHeaders = rootNsId 
          ? { 'Dropbox-API-Path-Root': JSON.stringify({".tag": "root", "root": rootNsId}) }
          : {};
        res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: { ...headers, ...extraHeaders },
          body: JSON.stringify({ path: folderPath, recursive: false, limit: 100 }),
        });
        if (res.ok) usedSharedLink = null;
      }
    }
  } else {
    const folderPath = rawPath ? normalizeDropboxPath(rawPath) : '';
    console.log('Normalized folderPath:', folderPath);
    const payload = { path: folderPath, recursive: false, limit: 100 };

    res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const errBody = await res.text();
      console.error('list_folder 409 (trying root namespace):', errBody);
      const rootNsId = await getAccountRootNs(token);
      if (rootNsId) {
        res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: { ...headers, 'Dropbox-API-Path-Root': JSON.stringify({".tag": "root", "root": rootNsId}) },
          body: JSON.stringify(payload),
        });
      }
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Dropbox list_folder error:', res.status, errText);
    throw new Error(`Dropbox API error: ${res.status}`);
  }

  const data = await res.json();

  const imageEntries = (data.entries || []).filter(
    (e: any) => e['.tag'] === 'file' && isImageFile(e.name)
  );

  const thumbnails = await getThumbnailsBatch(token, imageEntries, usedSharedLink);

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
    sharedLinkUrl: usedSharedLink || undefined,
  };
}

async function getThumbnailsBatch(token: string, entries: any[], sharedLinkUrl?: string | null): Promise<(string | null)[]> {
  if (entries.length === 0) return [];

  const results: (string | null)[] = [];

  for (let i = 0; i < entries.length; i += 25) {
    const chunk = entries.slice(i, i + 25);
    const batchEntries = chunk.map((e: any) => ({
      path: e.path_lower || e.path_display || `/${e.name}`,
      format: { '.tag': 'jpeg' },
      size: { '.tag': 'w256h256' },
      mode: { '.tag': 'fitone_bestfit' },
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
        const errText = await res.text();
        console.error('Thumbnail batch error:', res.status, errText);
        chunk.forEach(() => results.push(null));
      }
    } catch (e) {
      console.error('Thumbnail batch exception:', e);
      chunk.forEach(() => results.push(null));
    }
  }

  return results;
}

// Download a file from Dropbox and upload it to Supabase Storage
// Returns a permanent storage URL instead of base64
async function handleDownloadAndStore(body: any) {
  const token = getDropboxToken();
  const filePath = body.filePath || (body.fileName ? `/${body.fileName}` : null);
  const sharedLinkUrl = body.sharedLinkUrl;
  const orgId = body.organizationId;
  const entityType = body.entityType || 'brand';
  const entityId = body.entityId;

  if (!filePath) throw new Error('filePath is required');
  if (!orgId) throw new Error('organizationId is required for storage upload');
  if (!entityId) throw new Error('entityId is required for storage upload');

  console.log('Download request - filePath:', filePath, 'sharedLinkUrl:', sharedLinkUrl ? 'yes' : 'no');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let fileBlob: Blob | null = null;
  let fileName = filePath.split('/').pop() || 'image.jpg';

  // If we have a shared link, try that FIRST
  if (sharedLinkUrl) {
    console.log('Using shared link download for:', filePath);
    const downloadRes = await fetch('https://content.dropboxapi.com/2/sharing/get_shared_link_file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Dropbox-API-Arg': JSON.stringify({ url: sharedLinkUrl, path: `/${filePath.replace(/^\/+/, '')}` }),
      },
    });

    if (downloadRes.ok) {
      fileBlob = await downloadRes.blob();
      try {
        const apiResult = downloadRes.headers.get('dropbox-api-result');
        if (apiResult) {
          const metadata = JSON.parse(apiResult);
          if (metadata?.name) fileName = metadata.name;
        }
      } catch {}
    } else {
      const errText = await downloadRes.text();
      console.error('Shared link download failed:', downloadRes.status, errText);
    }
  }

  // Fallback: try get_temporary_link
  if (!fileBlob) {
    let res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST',
      headers,
      body: JSON.stringify({ path: filePath }),
    });

    if (!res.ok) {
      const rootNsId = await getAccountRootNs(token);
      if (rootNsId) {
        res = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
          method: 'POST',
          headers: { ...headers, 'Dropbox-API-Path-Root': JSON.stringify({".tag": "root", "root": rootNsId}) },
          body: JSON.stringify({ path: filePath }),
        });
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error('Dropbox get_temporary_link error:', res.status, errText);
      throw new Error(`Dropbox API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.metadata?.name) fileName = data.metadata.name;

    const fileRes = await fetch(data.link);
    if (!fileRes.ok) {
      throw new Error(`Failed to download file from temporary link: ${fileRes.status}`);
    }
    fileBlob = await fileRes.blob();
  }

  // Check file size
  if (fileBlob.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum is 20MB.`);
  }

  // Upload to Supabase Storage
  const supabaseAdmin = createSupabaseAdmin();
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${orgId}/${entityType}s/${entityId}/dropbox-${timestamp}-${sanitizedName}`;
  const mimeType = getMimeType(fileName);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('organization-assets')
    .upload(storagePath, fileBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to upload to storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('organization-assets')
    .getPublicUrl(storagePath);

  const publicUrl = `${urlData.publicUrl}?t=${timestamp}`;

  console.log('Successfully stored Dropbox file:', storagePath);

  return {
    downloadUrl: publicUrl,
    storagePath,
    metadata: {
      name: fileName,
      size: fileBlob.size,
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
      result = await handleDownloadAndStore(body);
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
