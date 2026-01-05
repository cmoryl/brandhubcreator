import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Trash2, Palette, Type, Image, Upload, ArrowRight, Layers, Lock, LogOut, Shield } from 'lucide-react';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const BrandsIndex = () => {
  const navigate = useNavigate();
  const { brands, addBrand, deleteBrand, updateBrand } = useBrands();
  const { user, isAdmin, signOut } = useAuth();
  const [isNewBrandDialogOpen, setIsNewBrandDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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

  const handleImageUpload = (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const brand = brands.find(b => b.id === brandId);
        if (brand) {
          updateBrand(brandId, {
            hero: { ...brand.hero, coverImage: reader.result as string }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const input = fileInputRefs.current.get(brandId);
    if (input) {
      input.click();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const canEdit = user && isAdmin;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <span className="font-semibold text-2xl text-foreground">BrandForge</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/10 text-accent text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAdmin && (
                      <DropdownMenuItem className="gap-2 text-accent">
                        <Shield className="h-4 w-4" />
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="outline" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Admin Login
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                <span className="text-xs font-medium text-accent">Brand Identity Platform</span>
              </div>
              {canEdit && (
                <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Edit Mode</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              Create stunning<br />
              <span className="text-accent">brand guides</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
              Design, organize, and share comprehensive brand identity systems. 
              From colors to typography, logos to guidelines — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              {canEdit ? (
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setIsNewBrandDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                  Create New Brand
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => navigate('/auth')}
                >
                  <Lock className="h-5 w-5" />
                  Login to Create
                </Button>
              )}
              {brands.length > 0 && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2"
                  onClick={() => navigate(`/brand/${brands[0].id}`)}
                >
                  View Latest
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border/50">
              <div>
                <p className="text-3xl font-semibold text-foreground">{brands.length}</p>
                <p className="text-sm text-muted-foreground">Brand Guides</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-foreground">22</p>
                <p className="text-sm text-muted-foreground">Sections</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-foreground">∞</p>
                <p className="text-sm text-muted-foreground">Possibilities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-1">Your Brands</h2>
            <p className="text-muted-foreground">
              {canEdit ? 'Select a brand to edit or create a new one' : 'View brand guides'}
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setIsNewBrandDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Brand
            </Button>
          )}
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Card 
              key={brand.id}
              className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
              onClick={() => navigate(`/brand/${brand.id}`)}
            >
              <CardContent className="p-0">
                {/* Cover Image / Color Preview */}
                <div className="relative h-44 overflow-hidden">
                  {brand.hero.coverImage ? (
                    <img 
                      src={brand.hero.coverImage} 
                      alt={brand.hero.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex">
                      {brand.colors.length > 0 ? (
                        brand.colors.slice(0, 4).map((color) => (
                          <div 
                            key={color.id} 
                            className="flex-1 transition-all duration-500 group-hover:flex-[1.1]"
                            style={{ backgroundColor: color.hex }}
                          />
                        ))
                      ) : (
                        <div className="flex-1 bg-gradient-to-br from-muted to-muted/50" />
                      )}
                    </div>
                  )}
                  
                  {/* Overlay Actions - Only show for admins */}
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <input
                        ref={(el) => { if (el) fileInputRefs.current.set(brand.id, el); }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(brand.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => triggerImageUpload(brand.id, e)}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {brand.hero.coverImage ? 'Change' : 'Add'} Cover
                      </Button>
                    </div>
                  )}

                  {/* Logo Badge */}
                  {brand.hero.logoUrl && (
                    <div className="absolute bottom-3 left-3 p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg">
                      <img 
                        src={brand.hero.logoUrl} 
                        alt="Logo" 
                        className="h-8 w-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate text-xl">
                        {brand.hero.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {brand.hero.tagline}
                      </p>
                    </div>
                    {canEdit && brands.length > 1 && (
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
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                      <Palette className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{brand.colors.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                      <Type className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{brand.typography.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                      <Image className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{brand.logos.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                      <Layers className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{brand.values.length}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Updated {brand.updatedAt.toLocaleDateString()}
                    </p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New Brand Card - Only show for admins */}
          {canEdit && (
            <Card 
              className="group cursor-pointer border-2 border-dashed border-border hover:border-accent/50 bg-transparent hover:bg-accent/5 transition-all duration-300"
              onClick={() => setIsNewBrandDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[320px] text-center">
                <div className="p-5 bg-muted rounded-2xl mb-5 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-300">
                  <Plus className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Create New Brand</h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Start building a fresh brand identity guide
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Login prompt for non-admins */}
        {!canEdit && (
          <div className="mt-12 p-8 bg-muted/50 rounded-2xl text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              To create, edit, or publish brand guides, you need admin access. 
              Login with an admin account to manage brands.
            </p>
            <Button onClick={() => navigate('/auth')} className="gap-2">
              <Lock className="h-4 w-4" />
              Login as Admin
            </Button>
          </div>
        )}
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
