import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, Star, Eye, RefreshCw, Edit, ExternalLink, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import type { Json } from '@/integrations/supabase/types';

interface DemoBrand {
  id: string;
  name: string;
  slug: string;
  type: string;
  industry_label: string | null;
  gradient_class: string | null;
  card_image_url: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  guide_data: Json;
  section_order: string[] | null;
  hidden_sections: string[] | null;
  page_settings: Json | null;
  created_at: string;
  updated_at: string;
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

const TYPE_OPTIONS = [
  { value: 'brand', label: 'Brand' },
  { value: 'product', label: 'Product' },
  { value: 'event', label: 'Event' },
];

export function DemoGuidesManager() {
  const navigate = useNavigate();
  const [demoBrands, setDemoBrands] = useState<DemoBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // New demo brand form state
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('brand');
  const [newIndustryLabel, setNewIndustryLabel] = useState('');

  useEffect(() => {
    loadDemoBrands();
  }, []);

  const loadDemoBrands = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_brands')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setDemoBrands(data || []);
    } catch (error) {
      console.error('[DemoGuidesManager] Error fetching demo brands:', error);
      toast.error('Failed to load demo brands');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setNewName(name);
    setNewSlug(generateSlug(name));
  };

  const createDemoBrand = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!newSlug.trim()) {
      toast.error('Please enter a slug');
      return;
    }

    // Check if slug already exists
    const existingSlug = demoBrands.find(b => b.slug === newSlug);
    if (existingSlug) {
      toast.error('This slug is already in use');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('demo_brands')
        .insert({
          name: newName.trim(),
          slug: newSlug.trim(),
          type: newType,
          industry_label: newIndustryLabel.trim() || null,
          display_order: demoBrands.length,
          gradient_class: GRADIENT_OPTIONS[demoBrands.length % GRADIENT_OPTIONS.length].value,
          is_active: true,
          is_featured: false,
          guide_data: {},
        })
        .select()
        .single();

      if (error) throw error;

      setDemoBrands([...demoBrands, data]);
      setCreateDialogOpen(false);
      setNewName('');
      setNewSlug('');
      setNewType('brand');
      setNewIndustryLabel('');
      toast.success('Demo brand created');
    } catch (error: any) {
      console.error('Error creating demo brand:', error);
      if (error.code === '23505') {
        toast.error('A demo brand with this slug already exists');
      } else {
        toast.error('Failed to create demo brand');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDemoBrand = async (id: string) => {
    try {
      const { error } = await supabase
        .from('demo_brands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDemoBrands(demoBrands.filter(b => b.id !== id));
      toast.success('Demo brand deleted');
    } catch (error) {
      console.error('Error deleting demo brand:', error);
      toast.error('Failed to delete demo brand');
    }
  };

  const updateDemoBrand = async (id: string, updates: Partial<DemoBrand>) => {
    try {
      const { error } = await supabase
        .from('demo_brands')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setDemoBrands(demoBrands.map(b => 
        b.id === id ? { ...b, ...updates } : b
      ));
    } catch (error) {
      console.error('Error updating demo brand:', error);
      toast.error('Failed to update demo brand');
    }
  };

  const openDemoEditor = (slug: string) => {
    // Navigate to demo brand editor
    navigate(`/demo/${slug}`);
  };

  const previewDemoBrand = (slug: string) => {
    // Open the demo brand page in a new tab
    window.open(`/demo/${slug}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading demo brands...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Demo Brands Manager
        </CardTitle>
        <CardDescription>
          Manage demo brands showcased on the landing page. These are separate from customer data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Demo Brand */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Demo Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Demo Brand</DialogTitle>
              <DialogDescription>
                Create a new demo brand to showcase on the landing page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter brand name..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="brand-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL will be: /demo/{newSlug || 'brand-slug'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry Label</Label>
                <Input
                  id="industry"
                  value={newIndustryLabel}
                  onChange={(e) => setNewIndustryLabel(e.target.value)}
                  placeholder="e.g., Technology, Fashion..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createDemoBrand} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Demo Brands List */}
        <div className="space-y-4">
          <h4 className="font-medium">Demo Brands ({demoBrands.length})</h4>
          
          {demoBrands.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No demo brands created</p>
              <p className="text-sm text-muted-foreground">Create demo brands to showcase on the landing page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {demoBrands.map((brand) => (
                <div 
                  key={brand.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${!brand.is_active ? 'opacity-60' : ''}`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  {/* Preview Swatch */}
                  <div 
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${brand.gradient_class} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                  >
                    {brand.name?.charAt(0) || '?'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{brand.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {brand.type}
                      </Badge>
                      {brand.is_featured && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Featured
                        </Badge>
                      )}
                      {!brand.is_active && (
                        <Badge variant="destructive" className="gap-1">
                          <Power className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={brand.industry_label || ''}
                        onChange={(e) => updateDemoBrand(brand.id, { industry_label: e.target.value })}
                        placeholder="Industry label..."
                        className="h-7 text-sm max-w-[150px]"
                      />
                      <Select 
                        value={brand.gradient_class || ''} 
                        onValueChange={(v) => updateDemoBrand(brand.id, { gradient_class: v })}
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
                    <p className="text-xs text-muted-foreground mt-1">/demo/{brand.slug}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2 mr-2">
                      <Switch
                        checked={brand.is_active}
                        onCheckedChange={(checked) => updateDemoBrand(brand.id, { is_active: checked })}
                      />
                      <Label className="text-sm">Active</Label>
                    </div>
                    
                    {/* Featured Toggle */}
                    <div className="flex items-center gap-2 mr-2">
                      <Switch
                        checked={brand.is_featured}
                        onCheckedChange={(checked) => updateDemoBrand(brand.id, { is_featured: checked })}
                      />
                      <Label className="text-sm">Featured</Label>
                    </div>
                    
                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDemoEditor(brand.slug)}
                      className="gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    
                    {/* Preview Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => previewDemoBrand(brand.slug)}
                      title="Preview in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDemoBrand(brand.id)}
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
          <p><strong>Note:</strong> Demo brands are completely separate from customer data. 
          Click "Edit" to open the brand guide editor where you can customize all content sections.
          Toggle "Active" to show/hide on the landing page.</p>
        </div>
      </CardContent>
    </Card>
  );
}
