/**
 * Clone Brand to New Workspace
 *
 * Creates a brand-new organization and deep-clones an existing brand into it.
 * Strips linkedGuides / linkedBooths / shareToken so the new brand stands alone.
 */

import { supabase } from '@/integrations/supabase/client';
import { OrganizationService } from './service';
import { logBrandCreated } from '@/lib/auditLog';

export interface CloneBrandResult {
  newOrgId: string;
  newOrgSlug: string;
  newBrandId: string;
  newBrandSlug: string;
}

export interface CloneBrandOptions {
  sourceBrandId: string;
  newOrgName: string;
  newOrgSlug: string;
  newBrandSlug?: string;
  isPublic?: boolean;
  userId: string;
}

const normalizeSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

export async function cloneBrandToNewOrg(opts: CloneBrandOptions): Promise<CloneBrandResult> {
  const orgSlug = normalizeSlug(opts.newOrgSlug);
  const brandSlug = normalizeSlug(opts.newBrandSlug || opts.newOrgSlug);

  if (!orgSlug || !brandSlug) {
    throw new Error('Workspace slug is required.');
  }

  // 1. Fetch source brand
  const { data: source, error: fetchErr } = await supabase
    .from('brands')
    .select('*')
    .eq('id', opts.sourceBrandId)
    .single();

  if (fetchErr || !source) {
    throw new Error(fetchErr?.message || 'Could not load source brand.');
  }

  // 2. Check brand slug availability across whole brands table
  const { data: existingBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .maybeSingle();

  if (existingBrand) {
    throw new Error(`A brand with the URL "${brandSlug}" already exists. Choose a different slug.`);
  }

  // 3. Create the new organization (also creates owner membership). Throws on slug collision.
  const newOrg = await OrganizationService.createOrganization(
    opts.newOrgName,
    orgSlug,
    opts.userId
  );

  if (!newOrg) {
    throw new Error('Failed to create new workspace.');
  }

  try {
    // 4. Build cloned guide_data — strip cross-brand links and share token
    const guideData =
      source.guide_data && typeof source.guide_data === 'object' && !Array.isArray(source.guide_data)
        ? { ...(source.guide_data as Record<string, unknown>) }
        : {};

    delete guideData.linkedGuides;
    delete guideData.linkedBooths;
    delete guideData.shareToken;
    delete (guideData as any).share_token;

    // 5. Insert the cloned brand row
    const { data: newBrand, error: insertErr } = await supabase
      .from('brands')
      .insert([{
        name: source.name,
        slug: brandSlug,
        organization_id: newOrg.id,
        is_public: opts.isPublic ?? true,
        guide_data: guideData as any,
        user_id: opts.userId,
      }])
      .select('id, slug')
      .single();

    if (insertErr || !newBrand) {
      throw new Error(insertErr?.message || 'Failed to create cloned brand.');
    }

    // 6. Audit log (best-effort)
    try {
      await logBrandCreated(newBrand.id, source.name, newOrg.id);
    } catch {
      // Non-fatal
    }

    return {
      newOrgId: newOrg.id,
      newOrgSlug: newOrg.slug,
      newBrandId: newBrand.id,
      newBrandSlug: newBrand.slug,
    };
  } catch (err) {
    // Roll back the org if brand insert fails
    try {
      await OrganizationService.deleteOrganization(newOrg.id);
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}
