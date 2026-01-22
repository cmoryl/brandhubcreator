import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Default section order from the frontend
const DEFAULT_SECTION_ORDER = [
  'hero', 'tagline', 'identity', 'values', 'bythenumbers', 'services', 'revenue', 'logos', 'brandicon', 'colors', 'gradients',
  'patterns', 'typography', 'textstyles', 'iconography', 'socialicons',
  'imagery', 'social', 'socialassets', 'website', 'signatures', 'qr', 'videos', 'assets', 'misuse',
  'casestudies', 'brochures', 'templates', 'products'
];

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
}

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
    const rollbackData: RollbackEntry[] = body.rollbackData || [];

    // Handle rollback
    if (action === 'rollback' && rollbackData.length > 0) {
      const results: RepairResult[] = [];

      for (const entry of rollbackData) {
        try {
          const table = entry.type === 'brand' ? 'brands' : 'products';
          const { error } = await adminClient
            .from(table)
            .update({
              section_order: entry.originalSectionOrder,
              hidden_sections: entry.originalHiddenSections,
            })
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
          results.push({
            id: entry.id,
            name: '',
            type: entry.type,
            status: 'error',
            changes: [],
            error: err instanceof Error ? err.message : 'Unknown error',
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

    // Fetch all brands and products
    const [{ data: brands, error: brandsError }, { data: products, error: productsError }] = await Promise.all([
      adminClient.from('brands').select('id, name, section_order, hidden_sections'),
      adminClient.from('products').select('id, name, section_order, hidden_sections'),
    ]);

    if (brandsError || productsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: RepairResult[] = [];
    const rollbackEntries: RollbackEntry[] = [];

    // Process brands
    for (const brand of (brands || [])) {
      const changes: string[] = [];
      const normalizedOrder = normalizeSectionOrder(brand.section_order as string[] | null);
      const normalizedHidden = normalizeHiddenSections(
        brand.hidden_sections as string[] | null,
        normalizedOrder
      );

      const orderChanged = JSON.stringify(brand.section_order) !== JSON.stringify(normalizedOrder);
      const hiddenChanged = JSON.stringify(brand.hidden_sections) !== JSON.stringify(normalizedHidden);

      if (!orderChanged && !hiddenChanged) {
        results.push({
          id: brand.id,
          name: brand.name,
          type: 'brand',
          status: 'skipped',
          changes: ['No changes needed'],
        });
        continue;
      }

      if (orderChanged) {
        const missing = DEFAULT_SECTION_ORDER.filter(id => !(brand.section_order as string[] || []).includes(id));
        changes.push(`Added missing sections: ${missing.join(', ') || 'normalized order'}`);
      }
      if (hiddenChanged) {
        changes.push('Cleaned invalid hidden sections');
      }

      // Store rollback data
      rollbackEntries.push({
        id: brand.id,
        type: 'brand',
        originalSectionOrder: brand.section_order as string[] | null,
        originalHiddenSections: brand.hidden_sections as string[] | null,
      });

      if (action === 'preview') {
        results.push({
          id: brand.id,
          name: brand.name,
          type: 'brand',
          status: 'repaired',
          changes,
        });
        continue;
      }

      // Actually update
      try {
        const { error } = await adminClient
          .from('brands')
          .update({
            section_order: normalizedOrder,
            hidden_sections: normalizedHidden,
          })
          .eq('id', brand.id);

        if (error) throw error;

        results.push({
          id: brand.id,
          name: brand.name,
          type: 'brand',
          status: 'repaired',
          changes,
        });
      } catch (err) {
        results.push({
          id: brand.id,
          name: brand.name,
          type: 'brand',
          status: 'error',
          changes: [],
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Process products
    for (const product of (products || [])) {
      const changes: string[] = [];
      const normalizedOrder = normalizeSectionOrder(product.section_order as string[] | null);
      const normalizedHidden = normalizeHiddenSections(
        product.hidden_sections as string[] | null,
        normalizedOrder
      );

      const orderChanged = JSON.stringify(product.section_order) !== JSON.stringify(normalizedOrder);
      const hiddenChanged = JSON.stringify(product.hidden_sections) !== JSON.stringify(normalizedHidden);

      if (!orderChanged && !hiddenChanged) {
        results.push({
          id: product.id,
          name: product.name,
          type: 'product',
          status: 'skipped',
          changes: ['No changes needed'],
        });
        continue;
      }

      if (orderChanged) {
        const missing = DEFAULT_SECTION_ORDER.filter(id => !(product.section_order as string[] || []).includes(id));
        changes.push(`Added missing sections: ${missing.join(', ') || 'normalized order'}`);
      }
      if (hiddenChanged) {
        changes.push('Cleaned invalid hidden sections');
      }

      // Store rollback data
      rollbackEntries.push({
        id: product.id,
        type: 'product',
        originalSectionOrder: product.section_order as string[] | null,
        originalHiddenSections: product.hidden_sections as string[] | null,
      });

      if (action === 'preview') {
        results.push({
          id: product.id,
          name: product.name,
          type: 'product',
          status: 'repaired',
          changes,
        });
        continue;
      }

      // Actually update
      try {
        const { error } = await adminClient
          .from('products')
          .update({
            section_order: normalizedOrder,
            hidden_sections: normalizedHidden,
          })
          .eq('id', product.id);

        if (error) throw error;

        results.push({
          id: product.id,
          name: product.name,
          type: 'product',
          status: 'repaired',
          changes,
        });
      } catch (err) {
        results.push({
          id: product.id,
          name: product.name,
          type: 'product',
          status: 'error',
          changes: [],
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
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
    console.error("Error in bulk-repair-guides:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
