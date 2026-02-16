import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoothQRCode {
  id: string;
  division_id: string;
  label: string;
  url: string;
  image_url: string | null;
  display_order: number;
  variant_label: string | null;
}

export function useBoothQRCodes(divisionId: string, variantLabel?: string) {
  const [qrCodes, setQrCodes] = useState<BoothQRCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQRCodes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("booth_qr_codes")
      .select("id, division_id, label, url, image_url, display_order, variant_label")
      .eq("division_id", divisionId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      const filtered = data.filter(s =>
        s.variant_label === null || s.variant_label === (variantLabel || null)
      );
      setQrCodes(filtered);
    }
    setLoading(false);
  }, [divisionId, variantLabel]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const addQRCode = useCallback(
    async (label: string, url: string, imageUrl?: string, forVariant?: string | null) => {
      const { error } = await supabase.from("booth_qr_codes").insert({
        division_id: divisionId,
        label,
        url,
        image_url: imageUrl || null,
        display_order: qrCodes.length,
        variant_label: forVariant ?? null,
      });
      if (!error) await fetchQRCodes();
    },
    [divisionId, qrCodes.length, fetchQRCodes]
  );

  const updateQRCode = useCallback(
    async (id: string, label: string, url: string, imageUrl?: string | null) => {
      const { error } = await supabase
        .from("booth_qr_codes")
        .update({ label, url, image_url: imageUrl ?? null })
        .eq("id", id);
      if (!error) await fetchQRCodes();
    },
    [fetchQRCodes]
  );

  const deleteQRCode = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("booth_qr_codes")
        .delete()
        .eq("id", id);
      if (!error) await fetchQRCodes();
    },
    [fetchQRCodes]
  );

  return { qrCodes, loading, addQRCode, updateQRCode, deleteQRCode, refetch: fetchQRCodes };
}
