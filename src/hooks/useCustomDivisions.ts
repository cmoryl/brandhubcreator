import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomDivision {
  id: string;
  division_id: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  icon_name: string;
  email: string;
  website: string;
  services: string[];
  display_order: number;
}

export function useCustomDivisions() {
  const [divisions, setDivisions] = useState<CustomDivision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDivisions = useCallback(async () => {
    const { data, error } = await supabase
      .from("booth_custom_divisions")
      .select("*")
      .order("display_order");
    if (!error && data) setDivisions(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDivisions(); }, [fetchDivisions]);

  const addDivision = useCallback(
    async (fields: { name: string; tagline?: string; description?: string; color?: string; email?: string; website?: string }) => {
      const divisionId = fields.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase
        .from("booth_custom_divisions")
        .insert({
          division_id: divisionId,
          name: fields.name,
          tagline: fields.tagline || "",
          description: fields.description || "",
          color: fields.color || "hsl(200, 70%, 45%)",
          email: fields.email || "",
          website: fields.website || "",
          display_order: divisions.length + 100,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      if (error) {
        toast.error("Failed to add booth: " + error.message);
        return null;
      }
      toast.success(`"${fields.name}" booth added`);
      await fetchDivisions();
      return divisionId;
    },
    [fetchDivisions, divisions.length]
  );

  const updateDivision = useCallback(
    async (divisionId: string, fields: Partial<Omit<CustomDivision, "id" | "division_id">>) => {
      const { error } = await supabase
        .from("booth_custom_divisions")
        .update(fields)
        .eq("division_id", divisionId);
      if (error) {
        toast.error("Update failed: " + error.message);
        return false;
      }
      await fetchDivisions();
      return true;
    },
    [fetchDivisions]
  );

  const deleteDivision = useCallback(
    async (divisionId: string) => {
      const { error } = await supabase
        .from("booth_custom_divisions")
        .delete()
        .eq("division_id", divisionId);
      if (error) {
        toast.error("Delete failed: " + error.message);
        return false;
      }
      // Also clean up images
      await supabase
        .from("booth_images")
        .delete()
        .eq("division_id", divisionId);
      toast.success("Booth removed");
      await fetchDivisions();
      return true;
    },
    [fetchDivisions]
  );

  return { divisions, loading, addDivision, updateDivision, deleteDivision, refetch: fetchDivisions };
}
