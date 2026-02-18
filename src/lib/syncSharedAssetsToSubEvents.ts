import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

/**
 * Syncs shared assets from a master event to all its linked sub-events.
 * Reads linkedGuides from the master event's guide_data, then pushes
 * the sharedAssets array into each sub-event's guide_data.
 */
export async function syncSharedAssetsToSubEvents(
  masterEventId: string,
  sharedAssets: unknown[]
): Promise<void> {
  try {
    // Get the master event's linkedGuides to find sub-event IDs
    const { data: masterEvent, error: fetchError } = await supabase
      .from('events')
      .select('guide_data')
      .eq('id', masterEventId)
      .maybeSingle();

    if (fetchError || !masterEvent) return;

    const guideData = masterEvent.guide_data as Record<string, unknown> | null;
    const linkedGuides = Array.isArray(guideData?.linkedGuides) ? guideData.linkedGuides : [];

    if (linkedGuides.length === 0) return;

    const subEventIds = linkedGuides
      .map((g: any) => g?.id)
      .filter(Boolean) as string[];

    if (subEventIds.length === 0) return;

    // Update all sub-events in parallel
    const results = await Promise.all(
      subEventIds.map((subId) =>
        supabase.rpc('update_guide_section', {
          p_table: 'events',
          p_id: subId,
          p_section: 'sharedAssets',
          p_data: JSON.stringify(sharedAssets),
        })
      )
    );

    const failCount = results.filter((r) => r.error).length;
    const successCount = subEventIds.length - failCount;

    if (successCount > 0) {
      toast.success(`Shared assets synced to ${successCount} sub-event${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      console.error('Failed to sync shared assets to some sub-events:', results.filter(r => r.error));
    }
  } catch (err) {
    console.error('[syncSharedAssets] Error:', err);
  }
}
