import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Trash2, Palette, Type, Image } from 'lucide-react';
import { useBrands } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { ThemeToggle } from '@/components/ThemeToggle';

const BrandsIndex = () => {
  const navigate = useNavigate();
  const { brands, addBrand, deleteBrand } = useBrands();
  const [isNewBrandDialogOpen, setIsNewBrandDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');

  const handleCreateBrand = () => {
    if (newBrandName.trim()) {
      const brand = addBrand(newBrandName.trim());
      setNewBrandName('');
      setIsNewBrandDialogOpen(false);
      navigate(`/brand/${brand.id}`);
    }
  };

  const handleDeleteClick = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBrandToDelete(brandId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (brandToDelete) {
      deleteBrand(brandToDelete);
      setBrandToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold text-xl text-foreground">BrandForge</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Brand Guides</h1>
          <p className="text-muted-foreground">Create and manage your brand identity systems</p>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* New Brand Card */}
          <Card 
            className="group cursor-pointer border-2 border-dashed border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg"
            onClick={() => setIsNewBrandDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <div className="p-4 bg-muted rounded-full mb-4 group-hover:bg-accent/10 transition-colors">
                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Create New Brand</h3>
              <p className="text-sm text-muted-foreground">Start a fresh brand guide</p>
            </CardContent>
          </Card>

          {/* Existing Brand Cards */}
          {brands.map((brand) => (
            <Card 
              key={brand.id}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
              onClick={() => navigate(`/brand/${brand.id}`)}
            >
              <CardContent className="p-0">
                {/* Color Preview Bar */}
                <div className="h-24 flex">
                  {brand.colors.slice(0, 4).map((color, idx) => (
                    <div 
                      key={color.id} 
                      className="flex-1 transition-all duration-300 group-hover:flex-[1.2]"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                  {brand.colors.length === 0 && (
                    <div className="flex-1 bg-gradient-to-r from-muted to-muted/50" />
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate text-lg">
                        {brand.hero.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {brand.hero.tagline}
                      </p>
                    </div>
                    {brands.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                        onClick={(e) => handleDeleteClick(brand.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" />
                      <span>{brand.colors.length} colors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Type className="h-3.5 w-3.5" />
                      <span>{brand.typography.length} fonts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      <span>{brand.logos.length} logos</span>
                    </div>
                  </div>

                  {/* Updated Date */}
                  <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                    Updated {brand.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* New Brand Dialog */}
      <Dialog open={isNewBrandDialogOpen} onOpenChange={setIsNewBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Brand Guide</DialogTitle>
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
            <DialogTitle>Delete Brand Guide?</DialogTitle>
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
    </div>
  );
};

export default BrandsIndex;
