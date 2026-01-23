import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  RefreshCw, Search, Palette, Package, Eye, EyeOff, 
  Building2, User, AlertTriangle, ExternalLink, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InspectorBrand {
  id: string;
  name: string;
  user_id: string;
  organization_id: string | null;
  is_public: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  ownerEmail: string | null;
  organizationName: string | null;
}

interface InspectorProduct {
  id: string;
  name: string;
  user_id: string;
  organization_id: string | null;
  parent_brand_id: string | null;
  is_public: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  ownerEmail: string | null;
  organizationName: string | null;
  parentBrandName: string | null;
}

interface InspectorEvent {
  id: string;
  name: string;
  user_id: string;
  organization_id: string | null;
  parent_brand_id: string | null;
  is_public: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  ownerEmail: string | null;
  organizationName: string | null;
  parentBrandName: string | null;
}

export function DataInspector() {
  const [brands, setBrands] = useState<InspectorBrand[]>([]);
  const [products, setProducts] = useState<InspectorProduct[]>([]);
  const [events, setEvents] = useState<InspectorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('brands');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, user_id, organization_id, is_public, is_favorite, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (brandsError) throw brandsError;

      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, user_id, organization_id, parent_brand_id, is_public, is_favorite, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, user_id, organization_id, parent_brand_id, is_public, is_favorite, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch profiles for email mapping
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email');
      
      const emailMap = new Map<string, string>();
      profiles?.forEach(p => {
        if (p.user_id && p.email) emailMap.set(p.user_id, p.email);
      });

      // Fetch organizations for name mapping
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name');
      
      const orgMap = new Map<string, string>();
      orgs?.forEach(o => orgMap.set(o.id, o.name));

      // Create brand name map for products and events
      const brandNameMap = new Map<string, string>();
      brandsData?.forEach(b => brandNameMap.set(b.id, b.name));

      // Enrich brands data
      const enrichedBrands: InspectorBrand[] = (brandsData || []).map(b => ({
        ...b,
        ownerEmail: emailMap.get(b.user_id) || null,
        organizationName: b.organization_id ? orgMap.get(b.organization_id) || null : null,
      }));

      // Enrich products data
      const enrichedProducts: InspectorProduct[] = (productsData || []).map(p => ({
        ...p,
        ownerEmail: emailMap.get(p.user_id) || null,
        organizationName: p.organization_id ? orgMap.get(p.organization_id) || null : null,
        parentBrandName: p.parent_brand_id ? brandNameMap.get(p.parent_brand_id) || null : null,
      }));

      // Enrich events data
      const enrichedEvents: InspectorEvent[] = (eventsData || []).map(e => ({
        ...e,
        ownerEmail: emailMap.get(e.user_id) || null,
        organizationName: e.organization_id ? orgMap.get(e.organization_id) || null : null,
        parentBrandName: e.parent_brand_id ? brandNameMap.get(e.parent_brand_id) || null : null,
      }));

      setBrands(enrichedBrands);
      setProducts(enrichedProducts);
      setEvents(enrichedEvents);
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Error fetching inspector data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const brandStats = {
    total: brands.length,
    public: brands.filter(b => b.is_public).length,
    withOrg: brands.filter(b => b.organization_id).length,
    orphaned: brands.filter(b => !b.organization_id).length,
  };

  const productStats = {
    total: products.length,
    public: products.filter(p => p.is_public).length,
    withOrg: products.filter(p => p.organization_id).length,
    orphaned: products.filter(p => !p.organization_id).length,
  };

  const eventStats = {
    total: events.length,
    public: events.filter(e => e.is_public).length,
    withOrg: events.filter(e => e.organization_id).length,
    orphaned: events.filter(e => !e.organization_id).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Data Inspector
            </CardTitle>
            <CardDescription>
              Debug visibility issues by viewing all brands/products/events with their owners and organizations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, org..." 
                className="pl-9 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Brands</span>
            </div>
            <div className="text-2xl font-bold">{brandStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {brandStats.public} public · {brandStats.orphaned} personal
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Products</span>
            </div>
            <div className="text-2xl font-bold">{productStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {productStats.public} public · {productStats.orphaned} personal
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Events</span>
            </div>
            <div className="text-2xl font-bold">{eventStats.total}</div>
            <div className="text-xs text-muted-foreground">
              {eventStats.public} public · {eventStats.orphaned} personal
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium">Org-Scoped</span>
            </div>
            <div className="text-2xl font-bold">{brandStats.withOrg + productStats.withOrg + eventStats.withOrg}</div>
            <div className="text-xs text-muted-foreground">
              {brandStats.withOrg}b · {productStats.withOrg}p · {eventStats.withOrg}e
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Personal (No Org)</span>
            </div>
            <div className="text-2xl font-bold">{brandStats.orphaned + productStats.orphaned + eventStats.orphaned}</div>
            <div className="text-xs text-muted-foreground">
              May have RLS visibility issues
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="brands" className="gap-2">
              <Palette className="h-4 w-4" />
              Brands ({filteredBrands.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events ({filteredEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brands">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]" title={brand.ownerEmail || brand.user_id}>
                            {brand.ownerEmail || brand.user_id.slice(0, 8) + '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {brand.organizationName ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {brand.organizationName}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600">
                            <User className="h-3 w-3" />
                            Personal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.is_public ? (
                          <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                            <Eye className="h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(brand.updated_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {brand.id.slice(0, 8)}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/brand/${brand.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBrands.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No brands found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="products">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Parent Brand</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]" title={product.ownerEmail || product.user_id}>
                            {product.ownerEmail || product.user_id.slice(0, 8) + '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.organizationName ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {product.organizationName}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600">
                            <User className="h-3 w-3" />
                            Personal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.parentBrandName ? (
                          <span className="text-sm">{product.parentBrandName}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.is_public ? (
                          <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                            <Eye className="h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(product.updated_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/product/${product.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No products found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Parent Brand</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]" title={event.ownerEmail || event.user_id}>
                            {event.ownerEmail || event.user_id.slice(0, 8) + '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.organizationName ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {event.organizationName}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600">
                            <User className="h-3 w-3" />
                            Personal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.parentBrandName ? (
                          <span className="text-sm">{event.parentBrandName}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.is_public ? (
                          <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                            <Eye className="h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(event.updated_at), 'MMM d, h:mm a')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/event/${event.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No events found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}