import { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, AlertTriangle, CheckCircle, Loader2, 
  Palette, Package, LayoutGrid, RefreshCw, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
import { sectionMeta } from '@/components/brand/sectionMeta';

// Critical sections that should rarely be hidden
const CRITICAL_SECTIONS: SectionId[] = [
  'hero',
  'logos',
  'colors',
  'typography',
  'social',
  'socialassets',
];

interface GuideWithHiddenSections {
  id: string;
  name: string;
  type: 'brand' | 'product';
  organizationId: string | null;
  organizationName: string | null;
  hiddenSections: SectionId[];
  criticalHidden: SectionId[];
}

interface ScanResult {
  guides: GuideWithHiddenSections[];
  totalGuides: number;
  guidesWithHidden: number;
  guidesWithCriticalHidden: number;
}

export const HiddenSectionsScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedGuides, setSelectedGuides] = useState<Set<string>>(new Set());
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setSelectedGuides(new Set());

    try {
      // Fetch all brands
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, organization_id, hidden_sections');
      
      if (brandsError) throw brandsError;

      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, organization_id, hidden_sections');
      
      if (productsError) throw productsError;

      // Fetch organization names
      const orgIds = new Set([
        ...(brands || []).map(b => b.organization_id).filter(Boolean),
        ...(products || []).map(p => p.organization_id).filter(Boolean),
      ]);
      
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(orgIds));
      
      const orgMap = new Map(orgs?.map(o => [o.id, o.name]) || []);

      const guides: GuideWithHiddenSections[] = [];

      // Process brands
      for (const brand of brands || []) {
        const hidden = (brand.hidden_sections as SectionId[] | null) || [];
        if (hidden.length > 0) {
          const criticalHidden = hidden.filter(s => CRITICAL_SECTIONS.includes(s));
          guides.push({
            id: brand.id,
            name: brand.name,
            type: 'brand',
            organizationId: brand.organization_id,
            organizationName: brand.organization_id ? orgMap.get(brand.organization_id) || 'Unknown' : null,
            hiddenSections: hidden,
            criticalHidden,
          });
        }
      }

      // Process products
      for (const product of products || []) {
        const hidden = (product.hidden_sections as SectionId[] | null) || [];
        if (hidden.length > 0) {
          const criticalHidden = hidden.filter(s => CRITICAL_SECTIONS.includes(s));
          guides.push({
            id: product.id,
            name: product.name,
            type: 'product',
            organizationId: product.organization_id,
            organizationName: product.organization_id ? orgMap.get(product.organization_id) || 'Unknown' : null,
            hiddenSections: hidden,
            criticalHidden,
          });
        }
      }

      // Sort by critical hidden count (most first)
      guides.sort((a, b) => b.criticalHidden.length - a.criticalHidden.length);

      const result: ScanResult = {
        guides,
        totalGuides: (brands?.length || 0) + (products?.length || 0),
        guidesWithHidden: guides.length,
        guidesWithCriticalHidden: guides.filter(g => g.criticalHidden.length > 0).length,
      };

      setScanResult(result);
      
      // Auto-select all guides with critical sections hidden
      const criticalGuides = guides.filter(g => g.criticalHidden.length > 0).map(g => `${g.type}-${g.id}`);
      setSelectedGuides(new Set(criticalGuides));

      toast.success(`Scan complete: Found ${result.guidesWithCriticalHidden} guides with critical sections hidden`);
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Failed to scan guides');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUnhideSelected = async () => {
    if (selectedGuides.size === 0) {
      toast.error('No guides selected');
      return;
    }

    setIsFixing(true);

    try {
      let fixed = 0;
      let errors = 0;

      for (const key of selectedGuides) {
        const [type, id] = key.split('-');
        const guide = scanResult?.guides.find(g => g.type === type && g.id === id);
        if (!guide) continue;

        // Remove critical sections from hidden
        const newHidden = guide.hiddenSections.filter(s => !CRITICAL_SECTIONS.includes(s));

        const table = type === 'brand' ? 'brands' : 'products';
        const { error } = await supabase
          .from(table)
          .update({ hidden_sections: newHidden })
          .eq('id', id);

        if (error) {
          console.error(`Error updating ${type} ${id}:`, error);
          errors++;
        } else {
          fixed++;
        }
      }

      toast.success(`Fixed ${fixed} guides${errors > 0 ? `, ${errors} errors` : ''}`);
      
      // Re-scan to update results
      await handleScan();
    } catch (error) {
      console.error('Fix error:', error);
      toast.error('Failed to fix guides');
    } finally {
      setIsFixing(false);
    }
  };

  const handleUnhideAll = async () => {
    if (!scanResult || scanResult.guidesWithCriticalHidden === 0) {
      toast.error('No guides with critical sections hidden');
      return;
    }

    setIsFixing(true);

    try {
      let fixed = 0;
      let errors = 0;

      for (const guide of scanResult.guides) {
        if (guide.criticalHidden.length === 0) continue;

        const newHidden = guide.hiddenSections.filter(s => !CRITICAL_SECTIONS.includes(s));
        const table = guide.type === 'brand' ? 'brands' : 'products';

        const { error } = await supabase
          .from(table)
          .update({ hidden_sections: newHidden })
          .eq('id', guide.id);

        if (error) {
          console.error(`Error updating ${guide.type} ${guide.id}:`, error);
          errors++;
        } else {
          fixed++;
        }
      }

      toast.success(`Fixed ${fixed} guides${errors > 0 ? `, ${errors} errors` : ''}`);
      await handleScan();
    } catch (error) {
      console.error('Fix all error:', error);
      toast.error('Failed to fix all guides');
    } finally {
      setIsFixing(false);
    }
  };

  const toggleGuideSelection = (key: string) => {
    const newSelected = new Set(selectedGuides);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedGuides(newSelected);
  };

  const toggleOrgExpanded = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  // Group guides by organization
  const groupedGuides = useMemo(() => {
    if (!scanResult) return new Map<string, GuideWithHiddenSections[]>();
    
    const groups = new Map<string, GuideWithHiddenSections[]>();
    for (const guide of scanResult.guides) {
      const key = guide.organizationId || 'personal';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(guide);
    }
    return groups;
  }, [scanResult]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOff className="h-5 w-5" />
          Hidden Sections Scanner
        </CardTitle>
        <CardDescription>
          Scan all guides for hidden critical sections (Hero, Logos, Colors, Typography, Social, Social Assets) 
          and unhide them with one click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleScan}
            disabled={isScanning || isFixing}
            className="gap-2"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Scan All Guides
          </Button>

          {scanResult && scanResult.guidesWithCriticalHidden > 0 && (
            <>
              <Button
                variant="default"
                onClick={handleUnhideSelected}
                disabled={isFixing || selectedGuides.size === 0}
                className="gap-2"
              >
                {isFixing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Unhide Selected ({selectedGuides.size})
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="secondary"
                    disabled={isFixing}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Fix All ({scanResult.guidesWithCriticalHidden})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unhide Critical Sections</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will unhide critical sections (Hero, Logos, Colors, Typography, Social, Social Assets) 
                      for {scanResult.guidesWithCriticalHidden} guides across all organizations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnhideAll}>
                      Unhide All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {/* Summary Stats */}
        {scanResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{scanResult.totalGuides}</p>
              <p className="text-xs text-muted-foreground">Total Guides</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{scanResult.guidesWithHidden}</p>
              <p className="text-xs text-muted-foreground">With Hidden Sections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{scanResult.guidesWithCriticalHidden}</p>
              <p className="text-xs text-muted-foreground">Critical Hidden</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{scanResult.totalGuides - scanResult.guidesWithCriticalHidden}</p>
              <p className="text-xs text-muted-foreground">OK</p>
            </div>
          </div>
        )}

        {/* Critical Sections Legend */}
        <div className="flex flex-wrap gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Critical sections:</span>
          {CRITICAL_SECTIONS.map(section => (
            <Badge key={section} variant="outline" className="text-xs">
              {sectionMeta[section]?.label || section}
            </Badge>
          ))}
        </div>

        {/* Loading State */}
        {isScanning && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Scanning all guides...</span>
          </div>
        )}

        {/* Results */}
        {scanResult && !isScanning && (
          <div className="space-y-2">
            {scanResult.guidesWithHidden === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p>All guides are in good shape! No hidden sections found.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-3">
                  {Array.from(groupedGuides.entries()).map(([orgKey, guides]) => {
                    const orgName = orgKey === 'personal' ? 'Personal Guides' : guides[0].organizationName || 'Unknown Org';
                    const isExpanded = expandedOrgs.has(orgKey);
                    const criticalCount = guides.filter(g => g.criticalHidden.length > 0).length;

                    return (
                      <Collapsible key={orgKey} open={isExpanded} onOpenChange={() => toggleOrgExpanded(orgKey)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="font-medium">{orgName}</span>
                              <Badge variant="secondary">{guides.length} guides</Badge>
                              {criticalCount > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {criticalCount} critical
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-6 pt-2 space-y-2">
                            {guides.map(guide => {
                              const key = `${guide.type}-${guide.id}`;
                              const isSelected = selectedGuides.has(key);
                              const hasCritical = guide.criticalHidden.length > 0;

                              return (
                                <div
                                  key={key}
                                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                                    hasCritical ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleGuideSelection(key)}
                                    disabled={!hasCritical}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="gap-1">
                                        {guide.type === 'brand' ? (
                                          <Palette className="h-3 w-3" />
                                        ) : (
                                          <Package className="h-3 w-3" />
                                        )}
                                        {guide.type}
                                      </Badge>
                                      <span className="font-medium truncate">{guide.name}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {guide.hiddenSections.map(section => {
                                        const isCritical = CRITICAL_SECTIONS.includes(section);
                                        return (
                                          <Badge
                                            key={section}
                                            variant={isCritical ? 'destructive' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {sectionMeta[section]?.label || section}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Empty state */}
        {!scanResult && !isScanning && (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Click "Scan All Guides" to find guides with hidden critical sections.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
