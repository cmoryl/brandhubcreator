import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BoothGalleryPhoto {
  id: string;
  division_id: string;
  image_url: string;
  caption: string;
  display_order: number;
}

export function useBoothGalleryPhotos(divisionId: string) {
  const [photos, setPhotos] = useState<BoothGalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("booth_gallery_photos")
      .select("id, division_id, image_url, caption, display_order")
      .eq("division_id", divisionId)
      .order("display_order");
    if (!error && data) setPhotos(data);
    setLoading(false);
  }, [divisionId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const uploadPhoto = useCallback(async (file: File, caption: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `booth-gallery/${divisionId}/${Date.now()}.${ext}`;
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

    const { error: dbErr } = await supabase
      .from("booth_gallery_photos")
      .insert({
        division_id: divisionId,
        image_url: urlData.publicUrl,
        caption,
        display_order: photos.length,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
    if (dbErr) {
      toast.error("Save failed: " + dbErr.message);
      return null;
    }
    toast.success("Photo added to gallery");
    await fetchPhotos();
    return urlData.publicUrl;
  }, [divisionId, fetchPhotos, photos.length]);

  const updateCaption = useCallback(async (id: string, caption: string) => {
    const { error } = await supabase
      .from("booth_gallery_photos")
      .update({ caption })
      .eq("id", id);
    if (!error) await fetchPhotos();
  }, [fetchPhotos]);

  const deletePhoto = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("booth_gallery_photos")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Photo removed");
    await fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, uploadPhoto, updateCaption, deletePhoto };
}
