/**
 * CreateProductSuiteDialog Component
 * Dialog for creating a product suite with a master product and multiple sub-products
 */

import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Package, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useBrands } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubProductEntry {
  id: string;
  name: string;
  tagline: string;
}

interface CreateProductSuiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Using forwardRef for compatibility with Radix UI dialog components
export const CreateProductSuiteDialog = forwardRef<HTMLDivElement, CreateProductSuiteDialogProps>(
  function CreateProductSuiteDialog({ open, onOpenChange }, ref) {
  const navigate = useNavigate();
  const { addProduct, refetch } = useBrands();

  const [suiteName, setSuiteName] = useState('');
  const [suiteTagline, setSuiteTagline] = useState('');
  const [subProducts, setSubProducts] = useState<SubProductEntry[]>([]);
  const [newSubProductName, setNewSubProductName] = useState('');
  const [newSubProductTagline, setNewSubProductTagline] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingProduct, setExistingProduct] = useState<{ id: string; name: string } | null>(null);

  const resetForm = () => {
    setSuiteName('');
    setSuiteTagline('');
    setSubProducts([]);
    setNewSubProductName('');
    setNewSubProductTagline('');
    setIsCreating(false);
    setShowConfirmDialog(false);
    setExistingProduct(null);
  };

  const handleAddSubProduct = () => {
    if (!newSubProductName.trim()) return;
    
    setSubProducts(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newSubProductName.trim(),
        tagline: newSubProductTagline.trim(),
      },
    ]);
    setNewSubProductName('');
    setNewSubProductTagline('');
  };

  const handleRemoveSubProduct = (id: string) => {
    setSubProducts(prev => prev.filter(p => p.id !== id));
  };

  // Check for existing product with similar name before creating
  const checkForExistingProduct = async (): Promise<boolean> => {
    const slug = suiteName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data: existing } = await supabase
      .from('products')
      .select('id, name, slug')
      .or(`slug.eq.${slug},name.ilike.${suiteName.trim()}`)
      .limit(1);
    
    if (existing && existing.length > 0) {
      setExistingProduct({ id: existing[0].id, name: existing[0].name });
      setShowConfirmDialog(true);
      return true; // Found existing product
    }
    
    return false; // No conflict
  };

  const handleInitiateCreate = async () => {
    if (!suiteName.trim()) {
      toast.error('Please enter a suite name');
      return;
    }

    // Check for existing products first
    const hasConflict = await checkForExistingProduct();
    if (!hasConflict) {
      // No conflict, proceed directly
      await handleCreateSuite();
    }
    // If conflict, the confirmation dialog will be shown
  };

  const handleCreateSuite = async () => {
    setShowConfirmDialog(false);
    
    if (!suiteName.trim()) {
      toast.error('Please enter a suite name');
      return;
    }

    setIsCreating(true);
    
    try {
      // Step 1: Create the master product (suite)
      let masterProduct;
      try {
        masterProduct = await addProduct(suiteName.trim());
      } catch (addError) {
        console.error('Error in addProduct:', addError);
        throw new Error('Failed to create master product');
      }
      
      if (!masterProduct) {
        throw new Error('Failed to create master product - no product returned');
      }

      console.log('Master product created:', masterProduct.id);

      // Step 2: Update the master product with tagline and initial setup
      const initialGuideData = {
        hero: {
          name: suiteName.trim(),
          tagline: suiteTagline.trim() || `The Complete ${suiteName.trim()} Suite`,
        },
        colors: [
          { id: crypto.randomUUID(), hex: '#0066CC', name: 'Primary Blue' },
          { id: crypto.randomUUID(), hex: '#00A3E0', name: 'Light Blue' },
          { id: crypto.randomUUID(), hex: '#1A1A2E', name: 'Dark Navy' },
        ],
        linkedGuides: [] as { id: string; type: 'product'; name: string; slug: string }[],
      };

      // Step 3: Create sub-products and collect their IDs
      const linkedGuides: { id: string; type: 'product'; name: string; slug: string }[] = [];
      
      for (const subProduct of subProducts) {
        try {
          const createdSubProduct = await addProduct(subProduct.name);
          if (createdSubProduct) {
            console.log('Sub-product created:', createdSubProduct.id);
            
            // Update sub-product with tagline
            const { error: subUpdateError } = await supabase
              .from('products')
              .update({
                guide_data: {
                  hero: {
                    name: subProduct.name,
                    tagline: subProduct.tagline || '',
                  },
                },
              })
              .eq('id', createdSubProduct.id);

            if (subUpdateError) {
              console.warn('Error updating sub-product tagline:', subUpdateError);
            }

            linkedGuides.push({
              id: createdSubProduct.id,
              type: 'product',
              name: subProduct.name,
              slug: createdSubProduct.slug || subProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            });
          }
        } catch (subError) {
          console.error('Error creating sub-product:', subProduct.name, subError);
          // Continue with other sub-products
        }
      }

      // Step 4: Update master product with linked sub-products and mark as suite master
      initialGuideData.linkedGuides = linkedGuides;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          guide_data: initialGuideData,
          is_suite_master: true, // Mark as protected suite master
        })
        .eq('id', masterProduct.id);

      if (updateError) {
        console.error('Error updating master product with links:', updateError);
      }

      // Close dialog and show success before navigation
      const productSlug = masterProduct.slug || masterProduct.id;
      const subProductCount = linkedGuides.length;
      
      onOpenChange(false);
      resetForm();

      toast.success(
        `Product suite "${suiteName}" created with ${subProductCount} sub-products!`
      );
      
      // Small delay to allow state to settle before navigation
      setTimeout(() => {
        // Refresh products list in background
        refetch?.().catch(console.error);
        
        // Navigate to the master product
        navigate(`/product/${productSlug}`);
      }, 100);
      
    } catch (err) {
      console.error('Error creating product suite:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create product suite');
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Create Product Suite
          </DialogTitle>
          <DialogDescription>
            Create a master product with multiple linked sub-products, like DigitalReef or GlobalLink.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
          {/* Suite Name */}
          <div className="space-y-2">
            <Label htmlFor="suite-name">Suite Name</Label>
            <Input
              id="suite-name"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              placeholder="e.g., GlobalLink, DigitalReef"
              autoFocus
            />
          </div>

          {/* Suite Tagline */}
          <div className="space-y-2">
            <Label htmlFor="suite-tagline">Tagline (Optional)</Label>
            <Input
              id="suite-tagline"
              value={suiteTagline}
              onChange={(e) => setSuiteTagline(e.target.value)}
              placeholder="e.g., The Complete Language & Localization Technology Suite"
            />
          </div>

          <Separator />

          {/* Sub-Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sub-Products</Label>
              <Badge variant="secondary" className="text-xs">
                {subProducts.length} added
              </Badge>
            </div>

            {/* Added Sub-Products List */}
            {subProducts.length > 0 && (
              <ScrollArea className="h-[140px] rounded-md border">
                <div className="p-2 space-y-2">
                  {subProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        {product.tagline && (
                          <p className="text-xs text-muted-foreground truncate">
                            {product.tagline}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleRemoveSubProduct(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Add New Sub-Product Form */}
            <div className="space-y-2 p-3 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Plus className="h-4 w-4" />
                Add Sub-Product
              </div>
              <Input
                value={newSubProductName}
                onChange={(e) => setNewSubProductName(e.target.value)}
                placeholder="Sub-product name (e.g., GlobalLink TMS)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubProduct();
                  }
                }}
              />
              <Input
                value={newSubProductTagline}
                onChange={(e) => setNewSubProductTagline(e.target.value)}
                placeholder="Tagline (optional)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubProduct();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full gap-1"
                onClick={handleAddSubProduct}
                disabled={!newSubProductName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Add to Suite
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              You can also add or manage sub-products later from the Product Guides section.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInitiateCreate}
            disabled={!suiteName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : `Create Suite${subProducts.length > 0 ? ` (${subProducts.length + 1} products)` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for Duplicate Protection */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Similar Product Exists
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                A product named <strong>"{existingProduct?.name}"</strong> already exists in your organization.
              </p>
              <p>
                Creating a new suite with the name "{suiteName}" will create a separate product. 
                This will <strong>not</strong> overwrite the existing product.
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSuite}>
              Create Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
});

CreateProductSuiteDialog.displayName = 'CreateProductSuiteDialog';
