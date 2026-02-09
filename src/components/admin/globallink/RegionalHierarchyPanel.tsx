/**
 * RegionalHierarchyPanel - Admin panel for managing regions and countries
 */

import React, { useState } from 'react';
import { Plus, Globe2, MapPin, ChevronRight, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRegionalBranding } from '@/hooks/useRegionalBranding';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

export const RegionalHierarchyPanel: React.FC = () => {
  const { organization } = useOrganization();
  const { regions, countries, addRegion, addCountry, isLoading } = useRegionalBranding(organization?.id);
  
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newRegion, setNewRegion] = useState({ code: '', name: '', parent: 'global' });
  const [newCountry, setNewCountry] = useState({ code: '', name: '', region: 'americas', language: 'en_US' });

  const handleAddRegion = () => {
    addRegion.mutate({
      code: newRegion.code.toLowerCase(),
      name: newRegion.name,
      parent_region_code: newRegion.parent,
    }, {
      onSuccess: () => {
        setShowAddRegion(false);
        setNewRegion({ code: '', name: '', parent: 'global' });
      },
    });
  };

  const handleAddCountry = () => {
    addCountry.mutate({
      country_code: newCountry.code.toUpperCase(),
      country_name: newCountry.name,
      region_code: newCountry.region,
      default_language: newCountry.language,
    }, {
      onSuccess: () => {
        setShowAddCountry(false);
        setNewCountry({ code: '', name: '', region: 'americas', language: 'en_US' });
      },
    });
  };

  // Build hierarchy tree
  const topLevelRegions = regions.filter(r => !r.parent_region_code || r.parent_region_code === 'global');
  
  const getCountriesForRegion = (regionCode: string) => 
    countries.filter(c => c.region_code === regionCode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regional Hierarchy</h3>
          <p className="text-sm text-muted-foreground">
            Configure regions and countries for localized brand variants
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddRegion} onOpenChange={setShowAddRegion}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Region
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Region</DialogTitle>
                <DialogDescription>
                  Add a new region to the hierarchy (e.g., Americas, EMEA, APAC)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Region Code</Label>
                  <Input
                    value={newRegion.code}
                    onChange={e => setNewRegion(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g., latam, nordics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={newRegion.name}
                    onChange={e => setNewRegion(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Latin America"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Region</Label>
                  <Select
                    value={newRegion.parent}
                    onValueChange={v => setNewRegion(p => ({ ...p, parent: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (Top Level)</SelectItem>
                      {STANDARD_REGIONS.filter(r => r.code !== 'global').map(r => (
                        <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddRegion(false)}>Cancel</Button>
                <Button onClick={handleAddRegion} disabled={!newRegion.code || !newRegion.name}>
                  Add Region
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddCountry} onOpenChange={setShowAddCountry}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Country
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Country</DialogTitle>
                <DialogDescription>
                  Add a country to enable country-specific brand variants
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Country Code (ISO)</Label>
                  <Input
                    value={newCountry.code}
                    onChange={e => setNewCountry(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g., US, GB, JP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country Name</Label>
                  <Input
                    value={newCountry.name}
                    onChange={e => setNewCountry(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., United States"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={newCountry.region}
                    onValueChange={v => setNewCountry(p => ({ ...p, region: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_REGIONS.filter(r => r.code !== 'global').map(r => (
                        <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                      ))}
                      {regions.filter(r => !STANDARD_REGIONS.some(sr => sr.code === r.code)).map(r => (
                        <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Input
                    value={newCountry.language}
                    onChange={e => setNewCountry(p => ({ ...p, language: e.target.value }))}
                    placeholder="e.g., en_US"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddCountry(false)}>Cancel</Button>
                <Button onClick={handleAddCountry} disabled={!newCountry.code || !newCountry.name}>
                  Add Country
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Setup from Templates */}
      {regions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Globe2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Regions Configured</h4>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Set up your regional hierarchy to enable localized brand variants. 
              Start with standard regions or create custom ones.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // Add standard regions
                STANDARD_REGIONS.forEach(region => {
                  if (region.code !== 'global') {
                    addRegion.mutate({
                      code: region.code,
                      name: region.name,
                      parent_region_code: region.parent || undefined,
                    });
                  }
                });
              }}
            >
              Initialize Standard Regions
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy Tree */}
      {regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hierarchy Structure</CardTitle>
            <CardDescription>
              Global → Region → Country inheritance chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Global Level */}
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Globe2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Global (Default)</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">Base</Badge>
              </div>

              {/* Regions */}
              {topLevelRegions.map(region => (
                <div key={region.id} className="ml-4 border-l-2 border-muted pl-4 space-y-1">
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Globe2 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{region.name}</span>
                    <Badge variant="outline" className="text-[10px]">{region.code}</Badge>
                    <Switch
                      checked={region.is_active}
                      className="ml-auto scale-75"
                    />
                  </div>

                  {/* Countries under this region */}
                  {getCountriesForRegion(region.code).map(country => (
                    <div key={country.id} className="ml-6 flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-base">{getCountryFlag(country.country_code)}</span>
                      <span className="text-sm">{country.country_name}</span>
                      <Badge variant="outline" className="text-[10px]">{country.country_code}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{country.default_language}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Countries Quick Reference */}
      {countries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configured Countries</CardTitle>
            <CardDescription>
              {countries.length} countries configured for regional variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {countries.map(country => (
                <Badge key={country.id} variant="outline" className="gap-1.5 py-1">
                  <span>{getCountryFlag(country.country_code)}</span>
                  <span>{country.country_name}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default RegionalHierarchyPanel;
