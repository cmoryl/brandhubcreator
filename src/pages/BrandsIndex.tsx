import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Trash2, Palette, Type, Image, Upload, ArrowRight, Layers, Lock, LogOut, Shield, Package, Clock, Star, Heart } from 'lucide-react';
import { useBrands } from '@/contexts/BrandContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
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
import { AppSettingsEditor } from '@/components/admin/AppSettingsEditor';
import { HeroBackground } from '@/components/HeroBackground';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseGuide } from '@/types/brand';

const BrandsIndex = () => {
  const navigate = useNavigate();
  const { brands, products, addBrand, addProduct, deleteBrand, deleteProduct, updateBrand, updateProduct, getRecentlyUpdated, toggleFavorite, getFavorites, isLoading } = useBrands();
  const { user, isAdmin, signOut, isLoading: authLoading } = useAuth();
  const { settings } = useAppSettings();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'brand' | 'product' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'brand' | 'product'>('brand');
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const recentlyUpdated = getRecentlyUpdated();
  const favorites = getFavorites();

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Loading your brands...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="p-4 bg-accent/10 rounded-2xl w-fit mx-auto">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Sign in to BrandForge</h1>
          <p className="text-muted-foreground">Create and manage your brand guides securely.</p>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <Lock className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateItem = async () => {
    if (newItemName.trim()) {
      if (newItemType === 'brand') {
        const brand = await addBrand(newItemName.trim());
        setNewItemName('');
        setIsNewDialogOpen(false);
        if (brand) navigate(`/brand/${brand.id}`);
      } else {
        const product = await addProduct(newItemName.trim());
        setNewItemName('');
        setIsNewDialogOpen(false);
        if (product) navigate(`/product/${product.id}`);
      }
    }
  };

  const handleDeleteClick = (id: string, type: 'brand' | 'product', e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id, type });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'brand') {
        deleteBrand(itemToDelete.id);
      } else {
        deleteProduct(itemToDelete.id);
      }
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const isRecentlyUpdated = (item: BaseGuide) => {
    return recentlyUpdated.some(r => r.id === item.id);
  };

  const handleProductImageUpload = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const product = products.find(p => p.id === productId);
        if (product) {
          updateProduct(productId, {
            hero: { ...product.hero, coverImage: reader.result as string }
          });
        }
      };
      reader.readAsDataURL(file);
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
      <div className="relative overflow-hidden">
        {/* Dynamic Background */}
        <HeroBackground />

        {/* Header */}
        <header className="relative z-10 animate-fade-in-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.appLogo ? (
                <img src={settings.appLogo} alt={settings.appName} className="h-10 w-auto" />
              ) : (
                <div className="p-2.5 bg-accent/10 rounded-xl border border-accent/20 hover-scale cursor-pointer animate-bounce-gentle">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
              )}
              <span className="font-semibold text-2xl text-foreground">{settings.appName}</span>
            </div>
            <div className="flex items-center gap-3">
              {canEdit && <AppSettingsEditor />}
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
            <div className="flex items-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                <span className="text-xs font-medium text-accent">{settings.heroBadgeText}</span>
              </div>
              {canEdit && (
                <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Edit Mode</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {settings.heroTitle}<br />
              <span className="text-accent">{settings.heroHighlight}</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {settings.heroDescription}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {canEdit ? (
                <>
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={() => { setNewItemType('brand'); setIsNewDialogOpen(true); }}
                  >
                    <Plus className="h-5 w-5" />
                    Create Brand
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2"
                    onClick={() => { setNewItemType('product'); setIsNewDialogOpen(true); }}
                  >
                    <Package className="h-5 w-5" />
                    Create Product
                  </Button>
                </>
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
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div>
                <p className="text-3xl font-semibold text-foreground">{brands.length}</p>
                <p className="text-sm text-muted-foreground">Brand Guides</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-foreground">{products.length}</p>
                <p className="text-sm text-muted-foreground">Product Guides</p>
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
        <Tabs defaultValue="brands" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList>
              <TabsTrigger value="brands" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Brands ({brands.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Star className="h-4 w-4" />
                Favorites ({favorites.length})
              </TabsTrigger>
            </TabsList>
            {canEdit && (
              <div className="flex gap-2">
                <Button onClick={() => { setNewItemType('brand'); setIsNewDialogOpen(true); }} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Brand
                </Button>
                <Button onClick={() => { setNewItemType('product'); setIsNewDialogOpen(true); }} className="gap-2">
                  <Package className="h-4 w-4" />
                  New Product
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="brands">
            {/* Brand Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand, index) => (
                <Card 
                  key={brand.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg hover-lift card-animate"
                  style={{ animationDelay: `${index * 0.1}s` }}
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
                      
                      {/* Recently Updated Badge */}
                      {isRecentlyUpdated(brand) && (
                        <Badge className="absolute top-3 right-12 gap-1 bg-accent text-accent-foreground">
                          <Clock className="h-3 w-3" />
                          Recently Updated
                        </Badge>
                      )}

                      {/* Favorite Button */}
                      <Button
                        variant="secondary"
                        size="icon"
                        className={`absolute top-3 right-3 h-8 w-8 ${brand.isFavorite ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' : 'bg-white/90 hover:bg-white'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(brand.id, 'brand');
                        }}
                      >
                        <Star className={`h-4 w-4 ${brand.isFavorite ? 'fill-current' : ''}`} />
                      </Button>

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
                            onClick={(e) => handleDeleteClick(brand.id, 'brand', e)}
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
                  className="group cursor-pointer border-2 border-dashed border-border hover:border-accent/50 bg-transparent hover:bg-accent/5 transition-all duration-300 hover-scale card-animate"
                  style={{ animationDelay: `${brands.length * 0.1}s` }}
                  onClick={() => { setNewItemType('brand'); setIsNewDialogOpen(true); }}
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
          </TabsContent>

          <TabsContent value="products">
            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <Card 
                  key={product.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg hover-lift card-animate"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image / Color Preview */}
                    <div className="relative h-44 overflow-hidden">
                      {product.hero.coverImage ? (
                        <img 
                          src={product.hero.coverImage} 
                          alt={product.hero.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex">
                          {product.colors.length > 0 ? (
                            product.colors.slice(0, 4).map((color) => (
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
                      
                      {/* Recently Updated Badge */}
                      {isRecentlyUpdated(product) && (
                        <Badge className="absolute top-3 right-12 gap-1 bg-accent text-accent-foreground">
                          <Clock className="h-3 w-3" />
                          Recently Updated
                        </Badge>
                      )}

                      {/* Favorite Button */}
                      <Button
                        variant="secondary"
                        size="icon"
                        className={`absolute top-3 right-3 h-8 w-8 ${product.isFavorite ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' : 'bg-white/90 hover:bg-white'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id, 'product');
                        }}
                      >
                        <Star className={`h-4 w-4 ${product.isFavorite ? 'fill-current' : ''}`} />
                      </Button>

                      {/* Product Badge */}
                      <Badge variant="secondary" className="absolute top-3 left-3 gap-1">
                        <Package className="h-3 w-3" />
                        Product
                      </Badge>

                      {/* Overlay Actions - Only show for admins */}
                      {canEdit && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <input
                            ref={(el) => { if (el) fileInputRefs.current.set(product.id, el); }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleProductImageUpload(product.id, e)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            onClick={(e) => triggerImageUpload(product.id, e)}
                          >
                            <Upload className="h-3.5 w-3.5" />
                            {product.hero.coverImage ? 'Change' : 'Add'} Cover
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Card Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate text-xl">
                            {product.hero.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {product.hero.tagline}
                          </p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-2"
                            onClick={(e) => handleDeleteClick(product.id, 'product', e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{product.colors.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Type className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{product.typography.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Image className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{product.logos.length}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Updated {product.updatedAt.toLocaleDateString()}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* New Product Card - Only show for admins */}
              {canEdit && (
                <Card 
                  className="group cursor-pointer border-2 border-dashed border-border hover:border-accent/50 bg-transparent hover:bg-accent/5 transition-all duration-300"
                  onClick={() => { setNewItemType('product'); setIsNewDialogOpen(true); }}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[320px] text-center">
                    <div className="p-5 bg-muted rounded-2xl mb-5 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-300">
                      <Package className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">Create New Product</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Start building a fresh product identity guide
                    </p>
                  </CardContent>
                </Card>
              )}

              {products.length === 0 && !canEdit && (
                <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No product guides yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites">
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => (
                <Card 
                  key={item.id}
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-card shadow-lg"
                  onClick={() => navigate(item.type === 'brand' ? `/brand/${item.id}` : `/product/${item.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Cover Image / Color Preview */}
                    <div className="relative h-44 overflow-hidden">
                      {item.hero.coverImage ? (
                        <img 
                          src={item.hero.coverImage} 
                          alt={item.hero.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex">
                          {item.colors.length > 0 ? (
                            item.colors.slice(0, 4).map((color) => (
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
                      
                      {/* Favorite Star */}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 bg-white/90 hover:bg-white text-yellow-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id, item.type);
                        }}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>

                      {/* Type Badge */}
                      <Badge variant="secondary" className="absolute top-3 left-3 gap-1">
                        {item.type === 'brand' ? (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Brand
                          </>
                        ) : (
                          <>
                            <Package className="h-3 w-3" />
                            Product
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Card Info */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate text-xl">
                            {item.hero.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {item.hero.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.colors.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Type className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.typography.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                          <Image className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.logos.length}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Updated {item.updatedAt.toLocaleDateString()}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {favorites.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground">Click the star icon on any brand or product to add it to your favorites</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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

      {/* Create New Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {newItemType === 'brand' ? 'Brand' : 'Product'} Guide</DialogTitle>
            <DialogDescription>
              Start a new {newItemType} identity from scratch.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="item-name">{newItemType === 'brand' ? 'Brand' : 'Product'} Name</Label>
            <Input
              id="item-name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Enter ${newItemType} name...`}
              className="mt-2"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem} disabled={!newItemName.trim()}>
              Create {newItemType === 'brand' ? 'Brand' : 'Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === 'brand' ? 'Brand' : 'Product'} Guide?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete {itemToDelete?.type === 'brand' ? 'Brand' : 'Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandsIndex;
