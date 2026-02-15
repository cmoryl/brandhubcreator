import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BoothImage {
  id: string;
  division_id: string;
  variant_label: string;
  image_url: string;
  display_order: number;
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

      // Upsert the record
      const { error: dbErr } = await supabase
        .from("booth_images")
        .upsert(
          {
            division_id: divisionId,
            variant_label: variantLabel,
            image_url: urlData.publicUrl,
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
    [divisionId, fetchImages]
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
      toast.success("Reverted to default image");
      await fetchImages();
    },
    [divisionId, fetchImages]
  );

  return { images, loading, getVariantImage, uploadImage, deleteImage };
}
