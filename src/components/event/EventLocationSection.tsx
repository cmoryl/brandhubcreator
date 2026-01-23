import { useState } from 'react';
import { 
  MapPin, Plus, Trash2, ExternalLink, Edit2, Check, X, Download, 
  Building2, Phone, Mail, Car, Train, Hotel, Map, Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { EventLocation, EventVenueMap } from '@/types/event';
import { cn } from '@/lib/utils';
import { AILocationResearch } from './AILocationResearch';

interface EventLocationSectionProps {
  location: EventLocation;
  onUpdate: (location: EventLocation) => void;
  isEditable?: boolean;
  subtitle?: string;
}

const MAP_TYPES = [
  { value: 'floor-plan', label: 'Floor Plan' },
  { value: 'venue-overview', label: 'Venue Overview' },
  { value: 'parking', label: 'Parking Map' },
  { value: 'transit', label: 'Transit Map' },
  { value: 'custom', label: 'Custom Map' },
];

export const EventLocationSection = ({ 
  location, 
  onUpdate, 
  isEditable = true, 
  subtitle 
}: EventLocationSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EventLocation>(location);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddingMap, setIsAddingMap] = useState(false);
  const [newMap, setNewMap] = useState<Partial<EventVenueMap>>({
    name: '',
    type: 'floor-plan',
    imageUrl: '',
  });

  const handleSave = () => {
    onUpdate(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(location);
    setIsEditing(false);
  };

  const handleAddMap = () => {
    if (!newMap.name || !newMap.imageUrl) return;
    
    const map: EventVenueMap = {
      id: crypto.randomUUID(),
      name: newMap.name,
      type: newMap.type as EventVenueMap['type'],
      imageUrl: newMap.imageUrl,
      description: newMap.description,
    };
    
    const updatedMaps = [...(location.venueMaps || []), map];
    onUpdate({ ...location, venueMaps: updatedMaps });
    setNewMap({ name: '', type: 'floor-plan', imageUrl: '' });
    setIsAddingMap(false);
  };

  const handleDeleteMap = (mapId: string) => {
    const updatedMaps = (location.venueMaps || []).filter(m => m.id !== mapId);
    onUpdate({ ...location, venueMaps: updatedMaps });
  };

  const generateGoogleMapsEmbed = () => {
    if (!draft.coordinates?.lat || !draft.coordinates?.lng) return '';
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${draft.coordinates.lat},${draft.coordinates.lng}&zoom=15`;
  };

  const exportLocationCard = () => {
    const data = {
      venue: location.venueName,
      address: `${location.address}, ${location.city}${location.state ? `, ${location.state}` : ''} ${location.postalCode || ''}, ${location.country}`,
      googleMaps: location.googleMapsUrl,
      phone: location.venuePhone,
      email: location.venueEmail,
      website: location.venueWebsite,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-location.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasLocation = location.venueName || location.address || location.city;

  return (
    <section id="eventlocation" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Venue & Location
          </h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Event venue details, maps, and travel information</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasLocation && (
            <Button variant="outline" size="sm" onClick={exportLocationCard}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {isEditable && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Location
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maps">Maps ({location.venueMaps?.length || 0})</TabsTrigger>
          <TabsTrigger value="travel">Travel Info</TabsTrigger>
          <TabsTrigger value="research">AI Research</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isEditing ? (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Venue Details</h3>
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input
                        value={draft.venueName}
                        onChange={(e) => setDraft({ ...draft, venueName: e.target.value })}
                        placeholder="Moscone Center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input
                        value={draft.address}
                        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                        placeholder="747 Howard St"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={draft.city}
                          onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                          placeholder="San Francisco"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State/Province</Label>
                        <Input
                          value={draft.state || ''}
                          onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                          placeholder="CA"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input
                          value={draft.postalCode || ''}
                          onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                          placeholder="94103"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                          value={draft.country}
                          onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                          placeholder="USA"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact & Links</h3>
                    <div className="space-y-2">
                      <Label>Venue Website</Label>
                      <Input
                        value={draft.venueWebsite || ''}
                        onChange={(e) => setDraft({ ...draft, venueWebsite: e.target.value })}
                        placeholder="https://www.moscone.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={draft.venuePhone || ''}
                        onChange={(e) => setDraft({ ...draft, venuePhone: e.target.value })}
                        placeholder="+1 (415) 555-0123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={draft.venueEmail || ''}
                        onChange={(e) => setDraft({ ...draft, venueEmail: e.target.value })}
                        placeholder="info@venue.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Maps URL</Label>
                      <Input
                        value={draft.googleMapsUrl || ''}
                        onChange={(e) => setDraft({ ...draft, googleMapsUrl: e.target.value })}
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Maps Embed (iframe src)</Label>
                      <Input
                        value={draft.googleMapsEmbed || ''}
                        onChange={(e) => setDraft({ ...draft, googleMapsEmbed: e.target.value })}
                        placeholder="https://www.google.com/maps/embed?..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !hasLocation ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">No location set</h3>
                <p className="text-muted-foreground mb-4">Add venue details, maps, and travel information</p>
                {isEditable && (
                  <Button onClick={() => setIsEditing(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Venue Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {location.venueName || 'Venue'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">{location.address}</p>
                    <p className="text-muted-foreground">
                      {location.city}{location.state && `, ${location.state}`} {location.postalCode}
                    </p>
                    <p className="text-muted-foreground">{location.country}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {location.venuePhone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${location.venuePhone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    )}
                    {location.venueEmail && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${location.venueEmail}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </a>
                      </Button>
                    )}
                    {location.venueWebsite && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={location.venueWebsite} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {location.googleMapsUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={location.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                          <Map className="h-4 w-4 mr-2" />
                          Directions
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Map Embed */}
              <Card className="overflow-hidden">
                <div className="aspect-[16/10] bg-muted">
                  {location.googleMapsEmbed ? (
                    <iframe
                      src={location.googleMapsEmbed}
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : location.googleMapsUrl ? (
                    <a 
                      href={location.googleMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                    >
                      <Map className="h-12 w-12 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to open in Google Maps</span>
                    </a>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Map className="h-12 w-12 opacity-50" />
                      <span className="text-sm">No map configured</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="maps">
          <div className="space-y-4">
            {isEditable && (
              <div className="flex justify-end">
                <Button onClick={() => setIsAddingMap(true)} disabled={isAddingMap}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Map
                </Button>
              </div>
            )}

            {isAddingMap && (
              <Card className="border-dashed border-primary">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Map Name</Label>
                      <Input
                        value={newMap.name || ''}
                        onChange={(e) => setNewMap({ ...newMap, name: e.target.value })}
                        placeholder="Main Hall Floor Plan"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newMap.type}
                        onValueChange={(value) => setNewMap({ ...newMap, type: value as EventVenueMap['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        value={newMap.imageUrl || ''}
                        onChange={(e) => setNewMap({ ...newMap, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={handleAddMap} disabled={!newMap.name || !newMap.imageUrl}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingMap(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(location.venueMaps?.length || 0) === 0 && !isAddingMap ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No custom maps yet</h3>
                  <p className="text-muted-foreground mb-4">Add floor plans, venue overviews, or parking maps</p>
                  {isEditable && (
                    <Button onClick={() => setIsAddingMap(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Map
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {location.venueMaps?.map((map) => (
                  <Card key={map.id} className="group overflow-hidden">
                    <div className="aspect-[4/3] bg-muted relative">
                      <img
                        src={map.imageUrl}
                        alt={map.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2">
                        {MAP_TYPES.find(t => t.value === map.type)?.label}
                      </Badge>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => window.open(map.imageUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {isEditable && (
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDeleteMap(map.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{map.name}</h4>
                      {map.description && (
                        <p className="text-sm text-muted-foreground mt-1">{map.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="travel">
          {isEditing ? (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Parking Information
                      </Label>
                      <Textarea
                        value={draft.parkingInfo || ''}
                        onChange={(e) => setDraft({ ...draft, parkingInfo: e.target.value })}
                        placeholder="Parking garage located at..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Train className="h-4 w-4" />
                        Public Transit
                      </Label>
                      <Textarea
                        value={draft.transitInfo || ''}
                        onChange={(e) => setDraft({ ...draft, transitInfo: e.target.value })}
                        placeholder="BART Powell Street station is..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        Nearby Hotels
                      </Label>
                      <Textarea
                        value={draft.nearbyHotels || ''}
                        onChange={(e) => setDraft({ ...draft, nearbyHotels: e.target.value })}
                        placeholder="Marriott Marquis (0.2 mi)..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={draft.customNotes || ''}
                        onChange={(e) => setDraft({ ...draft, customNotes: e.target.value })}
                        placeholder="Any other travel tips..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {location.parkingInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Car className="h-5 w-5 text-primary" />
                      Parking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{location.parkingInfo}</p>
                  </CardContent>
                </Card>
              )}
              {location.transitInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Train className="h-5 w-5 text-primary" />
                      Public Transit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{location.transitInfo}</p>
                  </CardContent>
                </Card>
              )}
              {location.nearbyHotels && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Hotel className="h-5 w-5 text-primary" />
                      Nearby Hotels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{location.nearbyHotels}</p>
                  </CardContent>
                </Card>
              )}
              {location.customNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{location.customNotes}</p>
                  </CardContent>
                </Card>
              )}
              {!location.parkingInfo && !location.transitInfo && !location.nearbyHotels && !location.customNotes && (
                <Card className="border-dashed col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Train className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No travel info yet</h3>
                    <p className="text-muted-foreground mb-4">Add parking, transit, and hotel information</p>
                    {isEditable && (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Add Travel Info
                      </Button>
                    )}
                  </CardContent>
                </Card>
            )}
          </div>
        )}
        </TabsContent>

        <TabsContent value="research">
          <AILocationResearch location={location} isEditable={isEditable} />
        </TabsContent>
      </Tabs>
    </section>
  );
};
