import { useState, useEffect } from 'react';
import { 
  Sparkles, Loader2, MapPin, Utensils, Car, Hotel, 
  Landmark, Sun, Lightbulb, ChevronDown, ChevronUp, RefreshCw, Save, CheckCircle, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventLocation, LocationResearchReport } from '@/types/event';

interface AILocationResearchProps {
  location: EventLocation;
  isEditable?: boolean;
  onSaveReport?: (report: LocationResearchReport) => void;
  onClearReport?: () => void;
}

export const AILocationResearch = ({ 
  location, 
  isEditable = true, 
  onSaveReport,
  onClearReport 
}: AILocationResearchProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<LocationResearchReport | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    neighborhood: true,
    dining: false,
    transportation: false,
    hotels: false,
    attractions: false,
    practical: false,
    tips: false,
  });

  // Load saved report from location data on mount
  useEffect(() => {
    if (location.locationResearchReport) {
      setReport(location.locationResearchReport);
      setHasUnsavedChanges(false);
    }
  }, [location.locationResearchReport]);

  const hasRequiredInfo = location.city && location.country;
  const hasSavedReport = !!location.locationResearchReport;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const runResearch = async () => {
    if (!hasRequiredInfo) {
      toast.error('Please add city and country information first');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('location-research', {
        body: {
          venueName: location.venueName,
          city: location.city,
          state: location.state,
          country: location.country,
          address: location.address,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit reached. Please try again in a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits to continue.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.report) {
        const newReport: LocationResearchReport = {
          ...data.report,
          generatedAt: data.generatedAt || new Date().toISOString(),
        };
        setReport(newReport);
        setHasUnsavedChanges(true);
        toast.success('Location report generated! Click Save to persist.');
      }
    } catch (error) {
      console.error('Location research error:', error);
      toast.error('Failed to generate location report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report || !onSaveReport) return;
    
    setIsSaving(true);
    try {
      onSaveReport(report);
      setHasUnsavedChanges(false);
      toast.success('Location report saved to event!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearReport = () => {
    if (!onClearReport) return;
    
    onClearReport();
    setReport(null);
    setHasUnsavedChanges(false);
    toast.success('Location report cleared');
  };

  const SectionCard = ({ 
    id, 
    icon: Icon, 
    title, 
    children 
  }: { 
    id: string; 
    icon: React.ElementType; 
    title: string; 
    children: React.ReactNode;
  }) => (
    <Collapsible open={expandedSections[id]} onOpenChange={() => toggleSection(id)}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </span>
              {expandedSections[id] ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  if (!report) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-10 w-10 text-primary/60 mb-3" />
          <h3 className="font-semibold text-lg mb-2">AI Location Research</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Generate a comprehensive location report with nearby dining, hotels, transportation, 
            attractions, and practical tips for event attendees.
          </p>
          {!hasRequiredInfo && (
            <p className="text-sm text-amber-600 mb-4">
              Add city and country information to enable research
            </p>
          )}
          {isEditable && (
            <Button 
              onClick={runResearch} 
              disabled={isLoading || !hasRequiredInfo}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Research Location
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={hasSavedReport ? "default" : "secondary"} className="gap-1">
            {hasSavedReport ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {hasSavedReport ? 'Saved' : 'AI Generated'}
          </Badge>
          {report.generatedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date(report.generatedAt).toLocaleDateString()}
            </span>
          )}
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Unsaved
            </Badge>
          )}
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && onSaveReport && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveReport} 
                disabled={isSaving}
                className="gap-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Report
              </Button>
            )}
            {hasSavedReport && onClearReport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearReport}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={runResearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Overview */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm leading-relaxed">{report.overview}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Neighborhood */}
        <SectionCard id="neighborhood" icon={MapPin} title="Neighborhood">
          <div className="space-y-3 text-sm">
            <p>{report.neighborhood.description}</p>
            <div>
              <span className="font-medium">Character: </span>
              <span className="text-muted-foreground">{report.neighborhood.character}</span>
            </div>
            <div>
              <span className="font-medium">Safety: </span>
              <span className="text-muted-foreground">{report.neighborhood.safetyNotes}</span>
            </div>
          </div>
        </SectionCard>

        {/* Dining */}
        <SectionCard id="dining" icon={Utensils} title="Dining">
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-1">
              {report.dining.nearby.map((restaurant, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {restaurant}
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground">{report.dining.recommendations}</p>
          </div>
        </SectionCard>

        {/* Transportation */}
        <SectionCard id="transportation" icon={Car} title="Transportation">
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Airports: </span>
              <span className="text-muted-foreground">{report.transportation.airports.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium">Public Transit: </span>
              <span className="text-muted-foreground">{report.transportation.publicTransit}</span>
            </div>
            <div>
              <span className="font-medium">Rideshare: </span>
              <span className="text-muted-foreground">{report.transportation.rideshare}</span>
            </div>
            <div>
              <span className="font-medium">Parking: </span>
              <span className="text-muted-foreground">{report.transportation.parking}</span>
            </div>
          </div>
        </SectionCard>

        {/* Hotels */}
        <SectionCard id="hotels" icon={Hotel} title="Nearby Hotels">
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-amber-600">Luxury: </span>
              <span className="text-muted-foreground">{report.hotels.luxury.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium text-blue-600">Mid-Range: </span>
              <span className="text-muted-foreground">{report.hotels.midRange.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium text-green-600">Budget: </span>
              <span className="text-muted-foreground">{report.hotels.budget.join(', ')}</span>
            </div>
            <p className="text-muted-foreground pt-2">{report.hotels.recommendations}</p>
          </div>
        </SectionCard>

        {/* Attractions */}
        <SectionCard id="attractions" icon={Landmark} title="Nearby Attractions">
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Cultural: </span>
              <span className="text-muted-foreground">{report.attractions.cultural.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium">Entertainment: </span>
              <span className="text-muted-foreground">{report.attractions.entertainment.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium">Outdoor: </span>
              <span className="text-muted-foreground">{report.attractions.outdoor.join(', ')}</span>
            </div>
          </div>
        </SectionCard>

        {/* Practical Info */}
        <SectionCard id="practical" icon={Sun} title="Practical Info">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Weather: </span>
              <span className="text-muted-foreground">{report.practicalInfo.weather}</span>
            </div>
            <div>
              <span className="font-medium">Timezone: </span>
              <span className="text-muted-foreground">{report.practicalInfo.timezone}</span>
            </div>
            <div>
              <span className="font-medium">Currency: </span>
              <span className="text-muted-foreground">{report.practicalInfo.currency}</span>
            </div>
            <div>
              <span className="font-medium">Tipping: </span>
              <span className="text-muted-foreground">{report.practicalInfo.tipping}</span>
            </div>
            <div>
              <span className="font-medium">Local Customs: </span>
              <span className="text-muted-foreground">{report.practicalInfo.localCustoms}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Event Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Tips for Attendees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.eventTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-medium">{i + 1}.</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
