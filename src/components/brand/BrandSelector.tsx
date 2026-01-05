import { useState } from 'react';
import { Plus, ChevronDown, Trash2, Check } from 'lucide-react';
import { BrandGuide } from '@/types/brand';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BrandSelectorProps {
  brands: BrandGuide[];
  currentBrandId: string;
  onBrandSelect: (brandId: string) => void;
  onBrandCreate: (name: string) => void;
  onBrandDelete: (brandId: string) => void;
}

export const BrandSelector = ({
  brands,
  currentBrandId,
  onBrandSelect,
  onBrandCreate,
  onBrandDelete,
}: BrandSelectorProps) => {
  const [isNewBrandDialogOpen, setIsNewBrandDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');

  const currentBrand = brands.find(b => b.id === currentBrandId);

  const handleCreateBrand = () => {
    if (newBrandName.trim()) {
      onBrandCreate(newBrandName.trim());
      setNewBrandName('');
      setIsNewBrandDialogOpen(false);
    }
  };

  const handleDeleteClick = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBrandToDelete(brandId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (brandToDelete) {
      onBrandDelete(brandToDelete);
      setBrandToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 font-serif font-semibold max-w-[200px]">
            <span className="truncate">{currentBrand?.hero.name || 'Select Brand'}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {brands.map(brand => (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => onBrandSelect(brand.id)}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {brand.id === currentBrandId && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
                <span className={brand.id !== currentBrandId ? 'ml-6' : ''}>
                  {brand.hero.name}
                </span>
              </div>
              {brands.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={(e) => handleDeleteClick(brand.id, e)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsNewBrandDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Brand Guide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Brand Dialog */}
      <Dialog open={isNewBrandDialogOpen} onOpenChange={setIsNewBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Create New Brand Guide</DialogTitle>
            <DialogDescription>
              Start a new brand identity from scratch.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="brand-name">Brand Name</Label>
            <Input
              id="brand-name"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Enter brand name..."
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBrand()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBrand} disabled={!newBrandName.trim()}>
              Create Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Brand Guide?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All brand data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
