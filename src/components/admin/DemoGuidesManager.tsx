import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Star, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface DemoGuide {
  id: string;
  brand_id: string;
  display_order: number;
  is_featured: boolean;
  industry_label: string | null;
  gradient_class: string | null;
  brand?: {
    id: string;
    name: string;
    is_public: boolean;
    guide_data: unknown;
  };
}

interface PublicBrand {
  id: string;
  name: string;
  is_public: boolean;
  guide_data: unknown;
}

const GRADIENT_OPTIONS = [
  { value: 'from-indigo-500 via-purple-500 to-pink-500', label: 'Indigo to Pink' },
  { value: 'from-green-400 via-emerald-500 to-lime-500', label: 'Green to Lime' },
  { value: 'from-cyan-400 via-blue-500 to-indigo-600', label: 'Cyan to Indigo' },
  { value: 'from-amber-600 via-orange-700 to-amber-800', label: 'Amber to Orange' },
  { value: 'from-red-500 via-orange-500 to-yellow-500', label: 'Red to Yellow' },
  { value: 'from-teal-400 via-cyan-500 to-sky-500', label: 'Teal to Sky' },
  { value: 'from-primary via-accent to-primary', label: 'Primary Accent' },
];

export function DemoGuidesManager() {
  const [demoGuides, setDemoGuides] = useState<DemoGuide[]>([]);
  const [publicBrands, setPublicBrands] = useState<PublicBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch demo guides with their associated brands
      const { data: guides, error: guidesError } = await supabase
        .from('demo_guides')
        .select('*')
        .order('display_order');

      if (guidesError) throw guidesError;

      // Fetch all public brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, is_public, guide_data')
        .eq('is_public', true)
        .order('name');

      if (brandsError) throw brandsError;

      // Enrich guides with brand data
      const enrichedGuides = (guides || []).map(guide => ({
        ...guide,
        brand: brands?.find(b => b.id === guide.brand_id),
      }));

      setDemoGuides(enrichedGuides);
      setPublicBrands(brands || []);
    } catch (error) {
      console.error('Error fetching demo guides:', error);
      toast.error('Failed to load demo guides');
    } finally {
      setIsLoading(false);
    }
  };

  const addDemoGuide = async () => {
    if (!selectedBrandId) {
      toast.error('Please select a brand');
      return;
    }

    // Check if already added
    if (demoGuides.some(g => g.brand_id === selectedBrandId)) {
      toast.error('This brand is already a demo guide');
      return;
    }

    // Limit to 3 demo guides
    if (demoGuides.length >= 3) {
      toast.error('Maximum 3 demo guides allowed. Remove one first.');
      return;
    }

    const selectedBrand = publicBrands.find(b => b.id === selectedBrandId);
    
    const { data, error } = await supabase
      .from('demo_guides')
      .insert({
        brand_id: selectedBrandId,
        display_order: demoGuides.length,
        industry_label: 'Brand',
        gradient_class: GRADIENT_OPTIONS[demoGuides.length % GRADIENT_OPTIONS.length].value,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding demo guide:', error);
      toast.error('Failed to add demo guide');
      return;
    }

    setDemoGuides([...demoGuides, { ...data, brand: selectedBrand }]);
    setSelectedBrandId('');
    toast.success('Demo guide added');
  };

  const removeDemoGuide = async (id: string) => {
    const { error } = await supabase
      .from('demo_guides')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing demo guide:', error);
      toast.error('Failed to remove demo guide');
      return;
    }

    setDemoGuides(demoGuides.filter(g => g.id !== id));
    toast.success('Demo guide removed');
  };

  const updateDemoGuide = async (id: string, updates: Partial<DemoGuide>) => {
    const { error } = await supabase
      .from('demo_guides')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating demo guide:', error);
      toast.error('Failed to update demo guide');
      return;
    }

    setDemoGuides(demoGuides.map(g => 
      g.id === id ? { ...g, ...updates } : g
    ));
  };

  const availableBrands = publicBrands.filter(
    b => !demoGuides.some(g => g.brand_id === b.id)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading demo guides...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Demo Guides Manager
        </CardTitle>
        <CardDescription>
          Select up to 3 public brand guides to showcase on the landing page. 
          These will be fully viewable by visitors as examples.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Demo Guide */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label>Add Public Brand as Demo</Label>
            <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a public brand..." />
              </SelectTrigger>
              <SelectContent>
                {availableBrands.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No available public brands
                  </SelectItem>
                ) : (
                  availableBrands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={addDemoGuide} 
            disabled={!selectedBrandId || demoGuides.length >= 3}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Current Demo Guides */}
        <div className="space-y-4">
          <h4 className="font-medium">Current Demo Guides ({demoGuides.length}/3)</h4>
          
          {demoGuides.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No demo guides configured</p>
              <p className="text-sm text-muted-foreground">Add public brands to showcase on the landing page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demoGuides.map((guide, index) => (
                <div 
                  key={guide.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  {/* Preview Swatch */}
                  <div 
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${guide.gradient_class} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                  >
                    {guide.brand?.name?.charAt(0) || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {guide.brand?.name || 'Unknown Brand'}
                      </span>
                      {guide.is_featured && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={guide.industry_label || ''}
                        onChange={(e) => updateDemoGuide(guide.id, { industry_label: e.target.value })}
                        placeholder="Industry label..."
                        className="h-7 text-sm max-w-[150px]"
                      />
                      <Select 
                        value={guide.gradient_class || ''} 
                        onValueChange={(v) => updateDemoGuide(guide.id, { gradient_class: v })}
                      >
                        <SelectTrigger className="h-7 text-sm max-w-[160px]">
                          <SelectValue placeholder="Gradient..." />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADIENT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={guide.is_featured}
                        onCheckedChange={(checked) => updateDemoGuide(guide.id, { is_featured: checked })}
                      />
                      <Label className="text-sm">Featured</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDemoGuide(guide.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          <p><strong>Note:</strong> Only public brands can be added as demo guides. 
          Make sure the brand has all sections filled in for the best showcase experience.
          Visitors will be able to view the full brand guide without logging in.</p>
        </div>
      </CardContent>
    </Card>
  );
}
