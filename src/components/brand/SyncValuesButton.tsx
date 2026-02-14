import { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BrandValue } from '@/types/brand';

interface SyncValuesButtonProps {
  values: BrandValue[];
  organizationId: string;
  brandId: string;
  brandName: string;
  onSyncComplete?: () => void;
}

export const SyncValuesButton = ({ 
  values, 
  organizationId, 
  brandId, 
  brandName,
  onSyncComplete
}: SyncValuesButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ brands: number; products: number; events: number } | null>(null);

  const handleSync = async () => {
    if (!organizationId || values.length === 0) {
      toast.error('No values to sync or organization not found');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      // Convert values to JSON-safe format
      const valuesJson = JSON.parse(JSON.stringify(values));
      console.log('[SyncValues] Starting sync for brand:', brandName, 'with', values.length, 'values');
      console.log('[SyncValues] Organization ID:', organizationId);

      // Fetch all entities in parallel
      const [productsRes, eventsRes, brandsRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, guide_data')
          .eq('organization_id', organizationId),
        supabase
          .from('events')
          .select('id, name, guide_data')
          .eq('organization_id', organizationId),
        supabase
          .from('brands')
          .select('id, name, guide_data')
          .eq('organization_id', organizationId)
          .neq('id', brandId),
      ]);

      if (productsRes.error) {
        console.error('[SyncValues] Products fetch error:', productsRes.error);
        throw productsRes.error;
      }
      if (eventsRes.error) {
        console.error('[SyncValues] Events fetch error:', eventsRes.error);
        throw eventsRes.error;
      }
      if (brandsRes.error) {
        console.error('[SyncValues] Brands fetch error:', brandsRes.error);
        throw brandsRes.error;
      }

      const products = productsRes.data || [];
      const events = eventsRes.data || [];
      const otherBrands = brandsRes.data || [];

      console.log(`[SyncValues] Found ${products.length} products, ${events.length} events, ${otherBrands.length} other brands`);

      let productsUpdated = 0;
      let eventsUpdated = 0;
      let brandsUpdated = 0;
      const errors: string[] = [];

      // Build all update promises
      const updatePromises: Promise<void>[] = [];

      // Update products
      for (const product of products) {
        updatePromises.push((async () => {
          const currentGuideData = (product.guide_data as Record<string, unknown>) || {};
          const updatedGuideData = { ...currentGuideData, values: valuesJson };

          const { error } = await supabase
            .from('products')
            .update({ guide_data: updatedGuideData, updated_at: new Date().toISOString() })
            .eq('id', product.id);

          if (error) {
            console.error(`[SyncValues] Failed to update product "${product.name}":`, error);
            errors.push(`Product "${product.name}": ${error.message}`);
          } else {
            productsUpdated++;
          }
        })());
      }

      // Update events
      for (const event of events) {
        updatePromises.push((async () => {
          const currentGuideData = (event.guide_data as Record<string, unknown>) || {};
          const updatedGuideData = { ...currentGuideData, values: valuesJson };

          const { error } = await supabase
            .from('events')
            .update({ guide_data: updatedGuideData, updated_at: new Date().toISOString() })
            .eq('id', event.id);

          if (error) {
            console.error(`[SyncValues] Failed to update event "${event.name}":`, error);
            errors.push(`Event "${event.name}": ${error.message}`);
          } else {
            eventsUpdated++;
          }
        })());
      }

      // Update other brands
      for (const brand of otherBrands) {
        updatePromises.push((async () => {
          const currentGuideData = (brand.guide_data as Record<string, unknown>) || {};
          const updatedGuideData = { ...currentGuideData, values: valuesJson };

          const { error } = await supabase
            .from('brands')
            .update({ guide_data: updatedGuideData, updated_at: new Date().toISOString() })
            .eq('id', brand.id);

          if (error) {
            console.error(`[SyncValues] Failed to update brand "${brand.name}":`, error);
            errors.push(`Brand "${brand.name}": ${error.message}`);
          } else {
            brandsUpdated++;
          }
        })());
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      console.log(`[SyncValues] Sync complete: ${brandsUpdated} brands, ${productsUpdated} products, ${eventsUpdated} events`);
      if (errors.length > 0) {
        console.warn('[SyncValues] Errors:', errors);
      }

      setSyncResult({ brands: brandsUpdated, products: productsUpdated, events: eventsUpdated });

      if (errors.length > 0) {
        toast.warning(
          `Partially synced: ${brandsUpdated} brands, ${productsUpdated} products, ${eventsUpdated} events`,
          { description: `${errors.length} update(s) failed. Check console for details.` }
        );
      } else {
        toast.success(
          `Synced values across ${brandsUpdated + 1} brands, ${productsUpdated} products, and ${eventsUpdated} events`,
          { description: `Philosophical pillars from "${brandName}" have been applied across the organization.` }
        );
      }

      // Trigger refetch so other contexts pick up changes
      onSyncComplete?.();
    } catch (error) {
      console.error('[SyncValues] Sync error:', error);
      toast.error('Failed to sync values', {
        description: error instanceof Error ? error.message : 'Please check your permissions and try again.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={values.length === 0}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : syncResult ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Values
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Philosophical Pillars
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will push the <strong>{values.length} philosophical pillars</strong> from 
              <strong> "{brandName}"</strong> to all brands, products, and events in your organization.
            </p>
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-sm">
                Existing values in other guides will be replaced. This action cannot be undone.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              'Sync to All'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
