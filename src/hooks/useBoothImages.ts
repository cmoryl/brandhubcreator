import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BoothImage {
  id: string;
  division_id: string;
  variant_label: string;
  image_url: string;
  display_order: number;
}

export interface MergedVariant {
  label: string;
  image: string;
  isCustom: boolean; // true = from DB, false = hardcoded default
  hasOverride: boolean; // true = hardcoded but image overridden in DB
}

export function useBoothImages(divisionId: string) {
  const [images, setImages] = useState<BoothImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("booth_images")
      .select("*")
      .eq("division_id", divisionId)
      .order("display_order");
    if (!error && data) setImages(data);
    setLoading(false);
  }, [divisionId]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const getVariantImage = useCallback(
    (variantLabel: string, fallback: string): string => {
      const found = images.find((img) => img.variant_label === variantLabel);
      return found ? found.image_url : fallback;
    },
    [images]
  );

  /** Merge hardcoded variants with DB-added custom variants */
  const getMergedVariants = useCallback(
    (hardcodedVariants: { label: string; image: string }[]): MergedVariant[] => {
      const hardcodedLabels = new Set(hardcodedVariants.map(v => v.label));
      
      // Start with hardcoded, applying overrides
      const merged: MergedVariant[] = hardcodedVariants.map(v => {
        const override = images.find(img => img.variant_label === v.label);
        return {
          label: v.label,
          image: override ? override.image_url : v.image,
          isCustom: false,
          hasOverride: !!override,
        };
      });

      // Add DB-only variants (custom additions, excluding __card__ and hardcoded overrides)
      const customVariants = images
        .filter(img => !hardcodedLabels.has(img.variant_label) && img.variant_label !== "__card__")
        .map(img => ({
          label: img.variant_label,
          image: img.image_url,
          isCustom: true,
          hasOverride: false,
        }));

      return [...merged, ...customVariants];
    },
    [images]
  );

  const uploadImage = useCallback(
    async (variantLabel: string, file: File) => {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `booth-images/${divisionId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("organization-assets")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) {
        toast.error("Upload failed: " + uploadErr.message);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(path);

      const nextOrder = images.length;
      const { error: dbErr } = await supabase
        .from("booth_images")
        .upsert(
          {
            division_id: divisionId,
            variant_label: variantLabel,
            image_url: urlData.publicUrl,
            display_order: nextOrder,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
          { onConflict: "division_id,variant_label" }
        );
      if (dbErr) {
        toast.error("Save failed: " + dbErr.message);
        return null;
      }
      toast.success(`Image updated for "${variantLabel}"`);
      await fetchImages();
      return urlData.publicUrl;
    },
    [divisionId, fetchImages, images.length]
  );

  const deleteImage = useCallback(
    async (variantLabel: string) => {
      const { error } = await supabase
        .from("booth_images")
        .delete()
        .eq("division_id", divisionId)
        .eq("variant_label", variantLabel);
      if (error) {
        toast.error("Delete failed");
        return;
      }
      toast.success("Image removed");
      await fetchImages();
    },
    [divisionId, fetchImages]
  );

  const renameVariant = useCallback(
    async (oldLabel: string, newLabel: string) => {
      const { error } = await supabase
        .from("booth_images")
        .update({ variant_label: newLabel })
        .eq("division_id", divisionId)
        .eq("variant_label", oldLabel);
      if (error) {
        toast.error("Rename failed: " + error.message);
        return false;
      }
      await fetchImages();
      return true;
    },
    [divisionId, fetchImages]
  );

  return { images, loading, getVariantImage, getMergedVariants, uploadImage, deleteImage, renameVariant };
}
