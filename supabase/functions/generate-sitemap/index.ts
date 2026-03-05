import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Static routes that are always included
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/auth', priority: '0.5', changefreq: 'yearly' },
  { path: '/help', priority: '0.7', changefreq: 'monthly' },
  { path: '/knowledge', priority: '0.6', changefreq: 'weekly' },
  { path: '/sitemap', priority: '0.3', changefreq: 'monthly' },
  { path: '/hero-effects', priority: '0.4', changefreq: 'monthly' },
  { path: '/docs/brand-export-schema', priority: '0.5', changefreq: 'monthly' },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function buildUrlEntry(
  baseUrl: string,
  path: string,
  lastmod?: string,
  changefreq = 'weekly',
  priority = '0.5'
): string {
  const url = `${baseUrl}${path}`;
  let entry = `  <url>\n    <loc>${escapeXml(url)}</loc>\n`;
  
  if (lastmod) {
    entry += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
  }
  
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  entry += `  </url>\n`;
  
  return entry;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get base URL from request or use default
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || 'https://brandhubcreator.lovable.app';

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    for (const route of STATIC_ROUTES) {
      sitemap += buildUrlEntry(baseUrl, route.path, undefined, route.changefreq, route.priority);
    }

    // Fetch public brands
    const { data: brands } = await supabase
      .from('brands')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (brands) {
      for (const brand of brands) {
        if (brand.slug) {
          sitemap += buildUrlEntry(
            baseUrl,
            `/brand/${brand.slug}`,
            brand.updated_at,
            'weekly',
            '0.8'
          );
        }
      }
    }

    // Fetch public products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (products) {
      for (const product of products) {
        if (product.slug) {
          sitemap += buildUrlEntry(
            baseUrl,
            `/product/${product.slug}`,
            product.updated_at,
            'weekly',
            '0.7'
          );
        }
      }
    }

    // Fetch public events
    const { data: events } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null);

    if (events) {
      for (const event of events) {
        if (event.slug) {
          sitemap += buildUrlEntry(
            baseUrl,
            `/event/${event.slug}`,
            event.updated_at,
            'weekly',
            '0.6'
          );
        }
      }
    }

    // Fetch active demo brands
    const { data: demoBrands } = await supabase
      .from('demo_brands')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (demoBrands) {
      for (const demo of demoBrands) {
        if (demo.slug) {
          sitemap += buildUrlEntry(
            baseUrl,
            `/demo/${demo.slug}`,
            demo.updated_at,
            'monthly',
            '0.6'
          );
        }
      }
    }

    // Fetch organizations that have public content (derive from already-fetched data)
    const orgSlugsFromPublicEntities = new Set<string>();
    const orgUpdatedAtMap = new Map<string, string>();

    // Collect org slugs from public brands
    if (brands) {
      const { data: brandOrgs } = await supabase
        .from('brands')
        .select('organization_id')
        .eq('is_public', true)
        .not('organization_id', 'is', null);
      if (brandOrgs) {
        for (const bo of brandOrgs) {
          if (bo.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('slug, updated_at')
              .eq('id', bo.organization_id)
              .maybeSingle();
            if (org?.slug) {
              orgSlugsFromPublicEntities.add(org.slug);
              orgUpdatedAtMap.set(org.slug, org.updated_at);
            }
          }
        }
      }
    }

    const orgs = Array.from(orgSlugsFromPublicEntities).map(slug => ({
      slug,
      updated_at: orgUpdatedAtMap.get(slug),
    }));

    for (const org of orgs) {
      if (org.slug) {
        sitemap += buildUrlEntry(
          baseUrl,
          `/org/${org.slug}`,
          org.updated_at,
          'weekly',
          '0.7'
        );
      }
    }

    sitemap += '</urlset>';

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
