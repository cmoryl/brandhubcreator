import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// IMPORTANT: Keep this in sync with src/types/brand.ts DEFAULT_SECTION_ORDER
const DEFAULT_SECTION_ORDER = [
  'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 
  'logos', 'brandicon', 'colors', 'gradients', 'patterns', 'typography', 'textstyles', 
  'iconography', 'socialicons', 'imagery', 'social', 'socialassets', 'website', 
  'signatures', 'qr', 'videos', 'assets', 'misuse', 'casestudies', 'brochures', 
  'templates', 'templatespecs', 'products'
];

// Default structures for guide_data repair
const DEFAULT_HERO = { name: '', tagline: '', coverImage: '', logoUrl: '' };
const DEFAULT_TAGLINE = { primary: '', secondary: '', variations: [] };
const DEFAULT_IDENTITY = { missionStatement: '', archetype: '', toneOfVoice: [] };
const DEFAULT_QR = { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' };
const DEFAULT_ATMOSPHERE = { style: 'gradient', animate: true, opacity: 0.5, blur: 0 };
const DEFAULT_PAGE_SETTINGS = {
  showHeader: true,
  showFooter: true,
  showSectionTitles: true,
  sidebarPosition: 'left',
  heroStyle: 'banner',
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RepairResult {
  id: string;
  name: string;
  type: 'brand' | 'product';
  status: 'repaired' | 'skipped' | 'error';
  changes: string[];
  error?: string;
}

interface RollbackEntry {
  id: string;
  type: 'brand' | 'product';
  originalSectionOrder: string[] | null;
  originalHiddenSections: string[] | null;
  originalGuideData?: Record<string, unknown>;
}

type RepairMode = 'section-order' | 'guide-data' | 'full';

function normalizeSectionOrder(order: string[] | null): string[] {
  const incoming = Array.isArray(order) ? order : [];
  const known = incoming.filter((id) => DEFAULT_SECTION_ORDER.includes(id));
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !known.includes(id));
  return [...known, ...missing];
}

function normalizeHiddenSections(hidden: string[] | null, order: string[]): string[] {
  const set = new Set(order);
  return (Array.isArray(hidden) ? hidden : []).filter((id) => set.has(id));
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function safeObject<T extends object>(value: unknown, fallback: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as T : fallback;
}

// Normalize legacy typography fields
function normalizeTypography(typography: unknown[]): unknown[] {
  return safeArray(typography).map((t: any) => ({
    ...t,
    id: t.id || crypto.randomUUID(),
    name: t.name || t.role || 'Typography',
    fontFamily: t.fontFamily || t.family || 'Inter, sans-serif',
    weight: t.weight || '400',
    usage: t.usage || t.role || 'General',
  }));
}

// Normalize legacy templates fields
function normalizeTemplates(templates: unknown[]): unknown[] {
  return safeArray(templates).map((t: any) => ({
    ...t,
    id: t.id || crypto.randomUUID(),
    name: t.name || 'Template',
    fileType: t.fileType || t.category || 'other',
    fileSize: t.fileSize || '',
  }));
}

// Normalize legacy brochures fields
function normalizeBrochures(brochures: unknown[]): unknown[] {
  return safeArray(brochures).map((b: any) => ({
    ...b,
    id: b.id || crypto.randomUUID(),
    title: b.title || b.name || 'Untitled',
    previewUrl: b.previewUrl || b.imageUrl || '',
    description: b.description || '',
  }));
}

// Full guide_data normalization
function normalizeGuideData(data: Record<string, unknown> | null): { 
  normalized: Record<string, unknown>; 
  changes: string[];
} {
  const g = data || {};
  const changes: string[] = [];
  
  // Core objects
  if (!g.hero || typeof g.hero !== 'object') {
    g.hero = DEFAULT_HERO;
    changes.push('Added missing hero object');
  }
  if (!g.tagline || typeof g.tagline !== 'object') {
    g.tagline = DEFAULT_TAGLINE;
    changes.push('Added missing tagline object');
  }
  if (!g.identity || typeof g.identity !== 'object') {
    g.identity = DEFAULT_IDENTITY;
    changes.push('Added missing identity object');
  }
  if (!g.qr || typeof g.qr !== 'object') {
    g.qr = DEFAULT_QR;
    changes.push('Added missing QR object');
  }
  if (!g.atmosphere || typeof g.atmosphere !== 'object') {
    g.atmosphere = DEFAULT_ATMOSPHERE;
    changes.push('Added missing atmosphere object');
  }
  if (!g.pageSettings || typeof g.pageSettings !== 'object') {
    g.pageSettings = DEFAULT_PAGE_SETTINGS;
    changes.push('Added missing pageSettings object');
  }

  // Array fields - ensure they exist as arrays
  const arrayFields = [
    'values', 'logos', 'brandIcons', 'colors', 'colorCombinations', 'gradients',
    'patterns', 'typography', 'textStyles', 'iconography', 'socialIcons',
    'imagery', 'social', 'websites', 'signatures', 'emailBanners', 'videos',
    'assets', 'misuse', 'caseStudies', 'brochures', 'templates', 'services',
    'socialAssets', 'displayBanners', 'linkedGuides', 'templateSpecs',
    'revenueData', 'statistics'
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(g[field])) {
      g[field] = [];
      // Only report if it was defined but wrong type
      if (g[field] !== undefined) {
        changes.push(`Fixed ${field} to be array`);
      }
    }
  }

  // Normalize legacy data formats
  const originalTypo = JSON.stringify(g.typography);
  g.typography = normalizeTypography(g.typography as unknown[]);
  if (JSON.stringify(g.typography) !== originalTypo) {
    changes.push('Normalized typography data (family→fontFamily, role→usage)');
  }

  const originalTemplates = JSON.stringify(g.templates);
  g.templates = normalizeTemplates(g.templates as unknown[]);
  if (JSON.stringify(g.templates) !== originalTemplates) {
    changes.push('Normalized templates data (category→fileType)');
  }

  const originalBrochures = JSON.stringify(g.brochures);
  g.brochures = normalizeBrochures(g.brochures as unknown[]);
  if (JSON.stringify(g.brochures) !== originalBrochures) {
    changes.push('Normalized brochures data (name→title, imageUrl→previewUrl)');
  }

  return { normalized: g, changes };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'repair'; // 'repair' | 'rollback' | 'preview'
    const mode: RepairMode = body.mode || 'section-order'; // 'section-order' | 'guide-data' | 'full'
    const rollbackData: RollbackEntry[] = body.rollbackData || [];

    console.log(`[bulk-repair-guides] Action: ${action}, Mode: ${mode}`);

    // Handle rollback
    if (action === 'rollback' && rollbackData.length > 0) {
      const results: RepairResult[] = [];

      for (const entry of rollbackData) {
        try {
          const table = entry.type === 'brand' ? 'brands' : 'products';
          const updateData: Record<string, unknown> = {};
          
          if (entry.originalSectionOrder !== undefined) {
            updateData.section_order = entry.originalSectionOrder;
          }
          if (entry.originalHiddenSections !== undefined) {
            updateData.hidden_sections = entry.originalHiddenSections;
          }
          if (entry.originalGuideData !== undefined) {
            updateData.guide_data = entry.originalGuideData;
          }

          const { error } = await adminClient
            .from(table)
            .update(updateData)
            .eq('id', entry.id);

          if (error) throw error;

          results.push({
            id: entry.id,
            name: '',
            type: entry.type,
            status: 'repaired',
            changes: ['Rolled back to original values'],
          });
        } catch (err) {
          console.error(`[bulk-repair-guides] Rollback error for ${entry.id}:`, err);
          results.push({
            id: entry.id,
            name: '',
            type: entry.type,
            status: 'error',
            changes: [],
            error: 'Rollback failed',
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'rollback',
        results,
        totalProcessed: results.length,
        totalRepaired: results.filter(r => r.status === 'repaired').length,
        totalErrors: results.filter(r => r.status === 'error').length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all brands and products - always fetch guide_data for full repair capability
    const [{ data: brands, error: brandsError }, { data: products, error: productsError }] = await Promise.all([
      adminClient.from('brands').select('id, name, section_order, hidden_sections, guide_data'),
      adminClient.from('products').select('id, name, section_order, hidden_sections, guide_data'),
    ]);

    if (brandsError || productsError) {
      console.error('[bulk-repair-guides] Fetch error:', brandsError || productsError);
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: RepairResult[] = [];
    const rollbackEntries: RollbackEntry[] = [];

    // Process function for both brands and products
    const processGuide = async (
      guide: { id: string; name: string; section_order: unknown; hidden_sections: unknown; guide_data?: unknown },
      type: 'brand' | 'product'
    ) => {
      const changes: string[] = [];
      const updateData: Record<string, unknown> = {};
      const rollbackEntry: RollbackEntry = {
        id: guide.id,
        type,
        originalSectionOrder: guide.section_order as string[] | null,
        originalHiddenSections: guide.hidden_sections as string[] | null,
      };

      // Section order repair
      if (mode === 'section-order' || mode === 'full') {
        const normalizedOrder = normalizeSectionOrder(guide.section_order as string[] | null);
        const normalizedHidden = normalizeHiddenSections(
          guide.hidden_sections as string[] | null,
          normalizedOrder
        );

        const orderChanged = JSON.stringify(guide.section_order) !== JSON.stringify(normalizedOrder);
        const hiddenChanged = JSON.stringify(guide.hidden_sections) !== JSON.stringify(normalizedHidden);

        if (orderChanged) {
          const missing = DEFAULT_SECTION_ORDER.filter(id => !(guide.section_order as string[] || []).includes(id));
          if (missing.length > 0) {
            changes.push(`Added missing sections: ${missing.join(', ')}`);
          } else {
            changes.push('Normalized section order');
          }
          updateData.section_order = normalizedOrder;
        }
        if (hiddenChanged) {
          changes.push('Cleaned invalid hidden sections');
          updateData.hidden_sections = normalizedHidden;
        }
      }

      // Guide data repair
      if ((mode === 'guide-data' || mode === 'full') && guide.guide_data !== undefined) {
        rollbackEntry.originalGuideData = guide.guide_data as Record<string, unknown>;
        const { normalized, changes: dataChanges } = normalizeGuideData(guide.guide_data as Record<string, unknown>);
        
        if (dataChanges.length > 0) {
          changes.push(...dataChanges);
          updateData.guide_data = normalized;
        }
      }

      // No changes needed
      if (changes.length === 0) {
        results.push({
          id: guide.id,
          name: guide.name,
          type,
          status: 'skipped',
          changes: ['No changes needed'],
        });
        return;
      }

      // Store rollback data
      rollbackEntries.push(rollbackEntry);

      if (action === 'preview') {
        results.push({
          id: guide.id,
          name: guide.name,
          type,
          status: 'repaired',
          changes,
        });
        return;
      }

      // Actually update
      try {
        const table = type === 'brand' ? 'brands' : 'products';
        const { error } = await adminClient
          .from(table)
          .update(updateData)
          .eq('id', guide.id);

        if (error) throw error;

        results.push({
          id: guide.id,
          name: guide.name,
          type,
          status: 'repaired',
          changes,
        });
      } catch (err) {
        console.error(`[bulk-repair-guides] ${type} repair error for ${guide.name}:`, err);
        results.push({
          id: guide.id,
          name: guide.name,
          type,
          status: 'error',
          changes: [],
          error: 'Repair failed',
        });
      }
    };

    // Process all guides
    for (const brand of (brands || [])) {
      await processGuide(brand, 'brand');
    }
    for (const product of (products || [])) {
      await processGuide(product, 'product');
    }

    console.log(`[bulk-repair-guides] Processed ${results.length} guides, repaired ${results.filter(r => r.status === 'repaired').length}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      mode,
      results,
      rollbackData: action === 'repair' ? rollbackEntries : undefined,
      totalProcessed: results.length,
      totalRepaired: results.filter(r => r.status === 'repaired').length,
      totalSkipped: results.filter(r => r.status === 'skipped').length,
      totalErrors: results.filter(r => r.status === 'error').length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[bulk-repair-guides] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Operation failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
