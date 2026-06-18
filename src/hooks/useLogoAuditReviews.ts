import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReviewStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface LogoAuditReview {
  id: string;
  logo_id: string;
  lockup: string;
  variant: string;
  file_url: string | null;
  status: ReviewStatus;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string;
  updated_at: string;
}

const slotKey = (
  logoId: string,
  lockup: string,
  variant: string,
  fileUrl: string | null,
) => `${logoId}::${lockup}::${variant}::${fileUrl ?? ''}`;

export function useLogoAuditReviews(logoId: string | undefined) {
  const [reviews, setReviews] = useState<LogoAuditReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!logoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('logo_audit_reviews')
      .select('*')
      .eq('logo_id', logoId)
      .order('reviewed_at', { ascending: false });
    if (!error) setReviews((data || []) as LogoAuditReview[]);
    setLoading(false);
  }, [logoId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byKey = new Map(
    reviews.map((r) => [slotKey(r.logo_id, r.lockup, r.variant, r.file_url), r]),
  );

  const getReview = (lockup: string, variant: string, fileUrl: string | null) =>
    logoId ? byKey.get(slotKey(logoId, lockup, variant, fileUrl)) : undefined;

  const upsert = async (input: {
    lockup: string;
    variant: string;
    fileUrl: string | null;
    status: ReviewStatus;
    notes: string | null;
  }) => {
    if (!logoId) return;
    const key = slotKey(logoId, input.lockup, input.variant, input.fileUrl);
    setSaving(key);
    const { data: userData } = await supabase.auth.getUser();
    const existing = byKey.get(key);
    const payload = {
      logo_id: logoId,
      lockup: input.lockup,
      variant: input.variant,
      file_url: input.fileUrl,
      status: input.status,
      notes: input.notes,
      reviewed_by: userData.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await supabase.from('logo_audit_reviews').update(payload).eq('id', existing.id)
      : await supabase.from('logo_audit_reviews').insert(payload);
    setSaving(null);
    if (error) {
      toast.error(error.message.includes('row-level security') ? 'Admins only' : 'Save failed');
      return false;
    }
    toast.success('Review saved');
    await refresh();
    return true;
  };

  const remove = async (reviewId: string) => {
    setSaving(reviewId);
    const { error } = await supabase.from('logo_audit_reviews').delete().eq('id', reviewId);
    setSaving(null);
    if (error) {
      toast.error('Delete failed');
      return false;
    }
    toast.success('Review cleared');
    await refresh();
    return true;
  };

  return { reviews, loading, saving, getReview, upsert, remove, refresh };
}
