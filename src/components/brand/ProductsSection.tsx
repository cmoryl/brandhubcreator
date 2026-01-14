import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './SectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useBrands } from '@/contexts/BrandContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface Product {
  id: string;
  name: string;
  guide_data: unknown;
}

interface ProductsSectionProps {
  brandId: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const ProductsSection = ({ 
  brandId, 
  customSubtitle, 
  onSubtitleChange 
}: ProductsSectionProps) => {
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addProduct } = useBrands();

  useEffect(() => {
    fetchProducts();
  }, [brandId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch products linked to this brand
      const { data: linked, error: linkedError } = await supabase
        .from('products')
        .select('id, name, guide_data')
        .eq('parent_brand_id', brandId);

      if (linkedError) throw linkedError;

      // Fetch products not linked to any brand (available to link)
      const { data: available, error: availableError } = await supabase
        .from('products')
        .select('id, name, guide_data')
        .is('parent_brand_id', null);

      if (availableError) throw availableError;

      setLinkedProducts((linked || []) as Product[]);
      setAvailableProducts((available || []) as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    
    setIsCreating(true);
    try {
      const product = await addProduct(newProductName.trim(), brandId);
      if (product) {
        toast.success('Product created and linked to brand');
        setNewProductName('');
        setIsCreateDialogOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };

  const linkProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ parent_brand_id: brandId })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product linked to brand');
      fetchProducts();
    } catch (error) {
      console.error('Error linking product:', error);
      toast.error('Failed to link product');
    }
  };

  const unlinkProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ parent_brand_id: null })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product unlinked from brand');
      fetchProducts();
    } catch (error) {
      console.error('Error unlinking product:', error);
      toast.error('Failed to unlink product');
    }
  };

  const openProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Products"
            defaultSubtitle="Products associated with this brand"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {availableProducts.length > 0 && (
            <Select onValueChange={linkProduct}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Link existing..." />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>
                  Create a new product that will be automatically linked to this brand.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Enter product name..."
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProduct()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProduct} 
                  disabled={!newProductName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Product'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : linkedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkedProducts.map((product, index) => (
            <div
              key={product.id}
              className="group relative bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => openProduct(product.id)}
            >
              <div className="flex items-start gap-4">
                {(product.guide_data as any)?.hero?.logoUrl ? (
                  <img
                    src={(product.guide_data as any).hero.logoUrl}
                    alt={product.name}
                    className="w-12 h-12 object-contain rounded-lg bg-muted p-1"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  {(product.guide_data as any)?.hero?.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {(product.guide_data as any).hero.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    openProduct(product.id);
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink Product</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove "{product.name}" from this brand guide. The product itself will not be deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unlinkProduct(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Unlink
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No products linked</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Create a new product or link existing ones to associate with this brand.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
          {availableProducts.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Or use the dropdown above to link an existing product.
            </p>
          )}
        </div>
      )}
    </section>
  );
};
