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
}

export const SyncValuesButton = ({ 
  values, 
  organizationId, 
  brandId, 
  brandName 
}: SyncValuesButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ products: number; events: number } | null>(null);

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

      // Fetch all products in the organization
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, guide_data')
        .eq('organization_id', organizationId);

      if (productsError) throw productsError;

      // Fetch all events in the organization
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name, guide_data')
        .eq('organization_id', organizationId);

      if (eventsError) throw eventsError;

      let productsUpdated = 0;
      let eventsUpdated = 0;

      // Update all products with the values
      for (const product of products || []) {
        const currentGuideData = (product.guide_data as Record<string, unknown>) || {};
        const updatedGuideData = {
          ...currentGuideData,
          values: valuesJson,
        };

        const { error: updateError } = await supabase
          .from('products')
          .update({ guide_data: updatedGuideData })
          .eq('id', product.id);

        if (!updateError) {
          productsUpdated++;
        }
      }

      // Update all events with the values
      for (const event of events || []) {
        const currentGuideData = (event.guide_data as Record<string, unknown>) || {};
        const updatedGuideData = {
          ...currentGuideData,
          values: valuesJson,
        };

        const { error: updateError } = await supabase
          .from('events')
          .update({ guide_data: updatedGuideData })
          .eq('id', event.id);

        if (!updateError) {
          eventsUpdated++;
        }
      }

      // Also update other brands in the organization (except the source brand)
      const { data: otherBrands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, guide_data')
        .eq('organization_id', organizationId)
        .neq('id', brandId);

      let brandsUpdated = 0;
      if (!brandsError && otherBrands) {
        for (const brand of otherBrands) {
          const currentGuideData = (brand.guide_data as Record<string, unknown>) || {};
          const updatedGuideData = {
            ...currentGuideData,
            values: valuesJson,
          };

          const { error: updateError } = await supabase
            .from('brands')
            .update({ guide_data: updatedGuideData })
            .eq('id', brand.id);

          if (!updateError) {
            brandsUpdated++;
          }
        }
      }

      setSyncResult({ products: productsUpdated, events: eventsUpdated });
      toast.success(
        `Synced values across ${brandsUpdated + 1} brands, ${productsUpdated} products, and ${eventsUpdated} events`,
        {
          description: `Philosophical pillars from "${brandName}" have been applied across the organization.`,
        }
      );
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync values', {
        description: 'Please check your permissions and try again.',
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
