import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCustomDivisions } from "@/hooks/useCustomDivisions";
import {
  DIVISIONS,
  customToBoothDivision,
  DivisionDetail,
  type BoothDivision,
} from "@/pages/BoothsCatalog";
import { BrandHubLogo } from "@/components/BrandHubLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function BoothDivisionPage() {
  const { divisionId } = useParams<{ divisionId: string }>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { divisions: customDivisions } = useCustomDivisions();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(!!user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const staticDivisionIds = new Set(DIVISIONS.map((d) => d.id));
  const allDivisions: BoothDivision[] = [
    ...DIVISIONS.map((div) => {
      const override = customDivisions.find((c) => c.division_id === div.id);
      if (!override) return div;
      return {
        ...div,
        tagline: override.tagline || div.tagline,
        description: override.description || div.description,
        email: override.email || div.email,
        website: override.website || div.website,
        services: override.services?.length ? override.services : div.services,
        color: override.color || div.color,
      };
    }),
    ...customDivisions
      .filter((c) => !staticDivisionIds.has(c.division_id))
      .map(customToBoothDivision),
  ];

  const division = allDivisions.find((d) => d.id === divisionId);

  if (!division) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Division Not Found</h1>
          <p className="text-muted-foreground">The booth division you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/booths")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Booth Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/booths")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Booth Catalog
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: division.color }}
              >
                <division.icon className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-foreground font-heading">
                {division.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="cursor-pointer" onClick={() => navigate("/org/transperfect")}>
              <BrandHubLogo size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Full-page content using DivisionDetail in page mode */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DivisionDetail
          division={division}
          onClose={() => navigate("/booths")}
          isAdmin={isAdmin}
          mode="page"
        />
      </div>
    </div>
  );
}
