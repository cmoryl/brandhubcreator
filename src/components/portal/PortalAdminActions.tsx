/**
 * PortalAdminActions Component
 * Floating admin panel with quick actions for creating brands, products, and events
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Building2,
  Package,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { toast } from 'sonner';

interface PortalAdminActionsProps {
  className?: string;
  organizationSlug?: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

export const PortalAdminActions = ({ className, organizationSlug }: PortalAdminActionsProps) => {
  const navigate = useNavigate();
  const { addBrand, addProduct, brands, products } = useBrands();
  const { addEvent, events } = useEvents();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Dialog states
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showSubProductDialog, setShowSubProductDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showExtendEventDialog, setShowExtendEventDialog] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [selectedParentBrand, setSelectedParentBrand] = useState<string>('');
  const [selectedParentProduct, setSelectedParentProduct] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [newLocation, setNewLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form state
  const resetForm = () => {
    setNewName('');
    setSelectedParentBrand('');
    setSelectedParentProduct('');
    setSelectedEvent('');
    setNewLocation('');
    setIsCreating(false);
  };

  // Action handlers
  const handleCreateBrand = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const brand = await addBrand(newName.trim());
      if (brand) {
        toast.success('Brand created successfully');
        navigate(`/brand/${brand.slug || brand.id}`);
      }
    } catch (err) {
      console.error('Error creating brand:', err);
      toast.error('Failed to create brand');
    } finally {
      setIsCreating(false);
      setShowBrandDialog(false);
      resetForm();
    }
  };

  const handleCreateProduct = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const product = await addProduct(newName.trim(), selectedParentBrand || undefined);
      if (product) {
        toast.success('Product created successfully');
        navigate(`/product/${product.slug || product.id}`);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error('Failed to create product');
    } finally {
      setIsCreating(false);
      setShowProductDialog(false);
      resetForm();
    }
  };

  const handleCreateSubProduct = async () => {
    if (!newName.trim() || !selectedParentProduct) return;
    setIsCreating(true);
    try {
      // For sub-products, we create a product and link it to the parent product
      const product = await addProduct(newName.trim());
      if (product) {
        toast.success('Sub-product created successfully');
        toast.info('Link this product to the parent in the Product Guides section');
        navigate(`/product/${product.slug || product.id}`);
      }
    } catch (err) {
      console.error('Error creating sub-product:', err);
      toast.error('Failed to create sub-product');
    } finally {
      setIsCreating(false);
      setShowSubProductDialog(false);
      resetForm();
    }
  };

  const handleCreateEvent = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const event = await addEvent(newName.trim());
      if (event) {
        toast.success('Event created successfully');
        navigate(`/event/${event.slug || event.id}`);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event');
    } finally {
      setIsCreating(false);
      setShowEventDialog(false);
      resetForm();
    }
  };

  const handleExtendEvent = async () => {
    if (!selectedEvent || !newLocation.trim()) return;
    
    const parentEvent = events.find(e => e.id === selectedEvent);
    if (!parentEvent) {
      toast.error('Parent event not found');
      return;
    }
    
    setIsCreating(true);
    try {
      const eventName = `${parentEvent.hero?.name || 'Event'} - ${newLocation.trim()}`;
      const subEvent = await addEvent(eventName, selectedEvent);
      if (subEvent) {
        toast.success('Regional event created successfully');
        toast.info('The new event inherits branding from the master event');
        navigate(`/event/${subEvent.slug || subEvent.id}`);
      }
    } catch (err) {
      console.error('Error extending event:', err);
      toast.error('Failed to create regional event');
    } finally {
      setIsCreating(false);
      setShowExtendEventDialog(false);
      resetForm();
    }
  };

  if (!isVisible) {
    return (
      <Button
        variant="default"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg gap-2"
        onClick={() => setIsVisible(true)}
      >
        <Plus className="h-4 w-4" />
        Quick Add
      </Button>
    );
  }

  const quickActions: QuickAction[] = [
    {
      id: 'brand',
      label: 'Brand',
      description: 'New brand guide',
      icon: <Building2 className="h-4 w-4" />,
      onClick: () => setShowBrandDialog(true),
      variant: 'primary',
    },
    {
      id: 'product',
      label: 'Product',
      description: 'New product guide',
      icon: <Package className="h-4 w-4" />,
      onClick: () => setShowProductDialog(true),
    },
    {
      id: 'sub-product',
      label: 'Sub-Product',
      description: 'Linked to parent',
      icon: <Layers className="h-4 w-4" />,
      onClick: () => setShowSubProductDialog(true),
    },
    {
      id: 'event',
      label: 'Event',
      description: 'New event brand kit',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => setShowEventDialog(true),
    },
    {
      id: 'extend-event',
      label: 'Extend Event',
      description: 'Add location/region',
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => setShowExtendEventDialog(true),
    },
  ];

  return (
    <>
      <Card
        className={cn(
          'fixed bottom-4 right-4 z-50 w-72 shadow-xl border-border/50 backdrop-blur-sm bg-card/95',
          className
        )}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Quick Add
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start gap-3 h-auto py-2.5"
                onClick={action.onClick}
              >
                <div className={cn(
                  'p-1.5 rounded-md',
                  action.variant === 'primary' 
                    ? 'bg-primary-foreground/20' 
                    : 'bg-muted'
                )}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className={cn(
                    'text-[10px]',
                    action.variant === 'primary' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  )}>
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Create Brand Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Create New Brand
            </DialogTitle>
            <DialogDescription>
              Create a new brand guide with its own identity and guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., TransPerfect, GlobalLink"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBrand()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBrandDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateBrand} disabled={!newName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Create New Product
            </DialogTitle>
            <DialogDescription>
              Create a standalone product guide, optionally linked to a parent brand.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., GlobalLink TMS, Reef Central"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-brand">Parent Brand (Optional)</Label>
              <Select value={selectedParentBrand} onValueChange={setSelectedParentBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="No parent brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.hero?.name || 'Unnamed Brand'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowProductDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={!newName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sub-Product Dialog */}
      <Dialog open={showSubProductDialog} onOpenChange={setShowSubProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Create Sub-Product
            </DialogTitle>
            <DialogDescription>
              Create a product that will be linked under a parent product.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sub-product-name">Sub-Product Name</Label>
              <Input
                id="sub-product-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., GlobalLink NOW, Reef Express"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-product">Parent Product</Label>
              <Select value={selectedParentProduct} onValueChange={setSelectedParentProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.hero?.name || 'Unnamed Product'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                After creation, link this in the parent's Product Guides section.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSubProductDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubProduct} disabled={!newName.trim() || !selectedParentProduct || isCreating}>
              {isCreating ? 'Creating...' : 'Create Sub-Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Create New Event
            </DialogTitle>
            <DialogDescription>
              Create a new event brand kit with logos, signage, and digital assets.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., GlobalLink NEXT 2025, Innovation Summit"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEventDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!newName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Event Dialog */}
      <Dialog open={showExtendEventDialog} onOpenChange={setShowExtendEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Extend Event to New Location
            </DialogTitle>
            <DialogDescription>
              Create a regional version of an existing event that inherits its branding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-event">Master Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select master event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.hero?.name || 'Unnamed Event'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-location">New Location/Region</Label>
              <Input
                id="new-location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g., San Francisco, EMEA, Tokyo"
              />
              <p className="text-xs text-muted-foreground">
                The new event will be named: {selectedEvent && events.find(e => e.id === selectedEvent)?.hero?.name} - {newLocation || '[Location]'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowExtendEventDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleExtendEvent} disabled={!selectedEvent || !newLocation.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Regional Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
