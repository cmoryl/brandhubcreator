/**
 * Sub-Event Creation Wizard
 * Multi-step wizard that pre-fills branding from the master event
 */

import { useState, useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight, Palette, Type, Image, Calendar, MapPin, Sparkles, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useEvents } from '@/contexts/EventContext';
import { EventGuide } from '@/types/event';
import { LinkedEventGuide } from './SubEventsManager';

// Region presets with colors
const REGION_PRESETS = [
  { id: 'USA', name: 'USA', color: '#84cc16', icon: '🇺🇸' },
  { id: 'EMEA', name: 'EMEA', color: '#3b82f6', icon: '🇪🇺' },
  { id: 'APAC', name: 'APAC', color: '#f97316', icon: '🌏' },
  { id: 'LATAM', name: 'LATAM', color: '#ec4899', icon: '🌎' },
  { id: 'ANZ', name: 'ANZ', color: '#14b8a6', icon: '🇦🇺' },
  { id: 'MEA', name: 'MEA', color: '#eab308', icon: '🌍' },
  { id: 'CUSTOM', name: 'Custom Region', color: '#6366f1', icon: '🌐' },
];

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'basics', title: 'Event Basics', description: 'Name, region, and dates', icon: <Calendar className="h-4 w-4" /> },
  { id: 'branding', title: 'Branding', description: 'Inherit master event branding', icon: <Palette className="h-4 w-4" /> },
  { id: 'review', title: 'Review', description: 'Confirm and create', icon: <Check className="h-4 w-4" /> },
];

interface SubEventCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  masterEvent: EventGuide;
  onEventCreated: (linkedGuide: LinkedEventGuide) => void;
}

interface SubEventFormData {
  name: string;
  region: string;
  customRegion: string;
  location: string;
  venue: string;
  dates: string;
  expectedAttendees: number | undefined;
  accentColor: string;
  inheritColors: boolean;
  inheritTypography: boolean;
  inheritLogos: boolean;
  inheritHeroImage: boolean;
}

const getInitialFormData = (masterEvent: EventGuide): SubEventFormData => {
  const masterName = masterEvent.hero?.name || masterEvent.eventDetails?.eventName || '';
  return {
    name: `${masterName} `,
    region: '',
    customRegion: '',
    location: '',
    venue: '',
    dates: '',
    expectedAttendees: undefined,
    accentColor: masterEvent.colors?.[0]?.hex || '#6366f1',
    inheritColors: true,
    inheritTypography: true,
    inheritLogos: true,
    inheritHeroImage: false,
  };
};

export const SubEventCreationWizard = ({
  isOpen,
  onClose,
  masterEvent,
  onEventCreated,
}: SubEventCreationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<SubEventFormData>(() => getInitialFormData(masterEvent));
  const [isCreating, setIsCreating] = useState(false);
  const { addEvent, updateEvent: updateEventContext } = useEvents();

  const updateField = useCallback(<K extends keyof SubEventFormData>(
    field: K,
    value: SubEventFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRegionChange = useCallback((regionId: string) => {
    const preset = REGION_PRESETS.find(r => r.id === regionId);
    updateField('region', regionId);
    if (preset && regionId !== 'CUSTOM') {
      updateField('accentColor', preset.color);
      // Auto-generate name suffix
      const masterName = masterEvent.hero?.name || masterEvent.eventDetails?.eventName || '';
      updateField('name', `${masterName} ${preset.name}`);
    }
  }, [masterEvent, updateField]);

  const handleNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an event name');
      return;
    }

    setIsCreating(true);
    try {
      // Create the new event
      const newEvent = await addEvent(formData.name.trim());
      
      if (newEvent) {
        // Build the inherited guide data
        const inheritedData: Partial<EventGuide> = {};

        if (formData.inheritColors && masterEvent.colors) {
          inheritedData.colors = [...masterEvent.colors];
        }

        if (formData.inheritTypography && masterEvent.typography) {
          inheritedData.typography = [...masterEvent.typography];
        }

        if (formData.inheritLogos && masterEvent.logos) {
          inheritedData.logos = [...masterEvent.logos];
        }

        if (formData.inheritHeroImage && masterEvent.hero?.coverImage) {
          inheritedData.hero = {
            ...newEvent.hero,
            name: formData.name.trim(),
            coverImage: masterEvent.hero.coverImage,
          };
        }

        // Set region and accent color in the event data
        const regionValue = formData.region === 'CUSTOM' 
          ? formData.customRegion || 'Custom' 
          : formData.region;

        inheritedData.eventDetails = {
          ...newEvent.eventDetails,
          eventName: formData.name.trim(),
          eventDates: formData.dates,
          location: formData.location,
          venue: formData.venue,
          expectedAttendees: formData.expectedAttendees,
        };

        // Update the event with inherited data
        updateEventContext(newEvent.id, inheritedData);

        // Create the linked guide entry
        const linkedGuide: LinkedEventGuide = {
          id: newEvent.id,
          type: 'event',
          slug: newEvent.slug || newEvent.id,
          name: formData.name.trim(),
          region: regionValue,
          accentColor: formData.accentColor,
          location: formData.location,
          dates: formData.dates,
          venue: formData.venue,
          attendees: formData.expectedAttendees,
          coverImage: formData.inheritHeroImage ? masterEvent.hero?.coverImage : undefined,
        };

        onEventCreated(linkedGuide);
        toast.success('Sub-event created with inherited branding');
        
        // Reset and close
        setFormData(getInitialFormData(masterEvent));
        setCurrentStep(0);
        onClose();
      }
    } catch (error) {
      console.error('Error creating sub-event:', error);
      toast.error('Failed to create sub-event');
    } finally {
      setIsCreating(false);
    }
  }, [formData, masterEvent, addEvent, updateEventContext, onEventCreated, onClose]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        return formData.name.trim().length > 0 && formData.region.length > 0;
      case 1:
        return true; // Branding is optional
      case 2:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name</Label>
              <Input
                id="event-name"
                placeholder="e.g., GlobalLink NEXT USA 2026"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={formData.region} onValueChange={handleRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_PRESETS.map(region => (
                    <SelectItem key={region.id} value={region.id}>
                      <span className="flex items-center gap-2">
                        <span>{region.icon}</span>
                        <span>{region.name}</span>
                        <span 
                          className="w-3 h-3 rounded-full ml-auto" 
                          style={{ backgroundColor: region.color }}
                        />
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.region === 'CUSTOM' && (
                <Input
                  placeholder="Enter custom region name"
                  value={formData.customRegion}
                  onChange={(e) => updateField('customRegion', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="e.g., Moscone Center"
                  value={formData.venue}
                  onChange={(e) => updateField('venue', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dates">Event Dates</Label>
                <Input
                  id="dates"
                  placeholder="e.g., October 27-28, 2026"
                  value={formData.dates}
                  onChange={(e) => updateField('dates', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">Expected Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.expectedAttendees || ''}
                  onChange={(e) => updateField('expectedAttendees', parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#6366f1"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Inherit from Master Event</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which branding elements to copy from "{masterEvent.hero?.name || masterEvent.eventDetails?.eventName}"
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Card className={formData.inheritColors ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="inherit-colors"
                      checked={formData.inheritColors}
                      onCheckedChange={(checked) => updateField('inheritColors', !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="inherit-colors" className="flex items-center gap-2 cursor-pointer">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        Color Palette
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy all {masterEvent.colors?.length || 0} colors from the master event
                      </p>
                      {masterEvent.colors && masterEvent.colors.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {masterEvent.colors.slice(0, 6).map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-md border border-border"
                              style={{ backgroundColor: color.hex }}
                              title={color.name || color.hex}
                            />
                          ))}
                          {masterEvent.colors.length > 6 && (
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{masterEvent.colors.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={formData.inheritTypography ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="inherit-typography"
                      checked={formData.inheritTypography}
                      onCheckedChange={(checked) => updateField('inheritTypography', !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="inherit-typography" className="flex items-center gap-2 cursor-pointer">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        Typography
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy {masterEvent.typography?.length || 0} text styles (fonts, sizes, weights)
                      </p>
                      {masterEvent.typography && masterEvent.typography.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {masterEvent.typography.slice(0, 4).map((style, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {style.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={formData.inheritLogos ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="inherit-logos"
                      checked={formData.inheritLogos}
                      onCheckedChange={(checked) => updateField('inheritLogos', !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="inherit-logos" className="flex items-center gap-2 cursor-pointer">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        Logo Assets
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy {masterEvent.logos?.length || 0} logo files and configurations
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={formData.inheritHeroImage ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="inherit-hero"
                      checked={formData.inheritHeroImage}
                      onCheckedChange={(checked) => updateField('inheritHeroImage', !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="inherit-hero" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Hero Image
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the same hero/cover image as the master event
                      </p>
                      {masterEvent.hero?.coverImage && (
                        <div className="mt-2 rounded-md overflow-hidden w-32 h-20">
                          <img
                            src={masterEvent.hero.coverImage}
                            alt="Master event hero"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        const selectedRegion = REGION_PRESETS.find(r => r.id === formData.region);
        return (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${formData.accentColor}20` }}
              >
                {selectedRegion?.icon || '🌐'}
              </div>
              <h3 className="text-xl font-semibold">{formData.name || 'Untitled Event'}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {formData.region === 'CUSTOM' ? formData.customRegion : formData.region} Region
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Event Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.dates && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.dates}</span>
                  </div>
                )}
                {formData.expectedAttendees && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.expectedAttendees.toLocaleString()} attendees</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: formData.accentColor }}
                  />
                  <span className="font-mono text-xs">{formData.accentColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Inherited Branding</h4>
              <div className="flex flex-wrap gap-2">
                {formData.inheritColors && (
                  <Badge variant="secondary" className="gap-1">
                    <Palette className="h-3 w-3" />
                    Colors
                  </Badge>
                )}
                {formData.inheritTypography && (
                  <Badge variant="secondary" className="gap-1">
                    <Type className="h-3 w-3" />
                    Typography
                  </Badge>
                )}
                {formData.inheritLogos && (
                  <Badge variant="secondary" className="gap-1">
                    <Image className="h-3 w-3" />
                    Logos
                  </Badge>
                )}
                {formData.inheritHeroImage && (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Hero Image
                  </Badge>
                )}
                {!formData.inheritColors && !formData.inheritTypography && !formData.inheritLogos && !formData.inheritHeroImage && (
                  <span className="text-sm text-muted-foreground">No branding inherited (starting fresh)</span>
                )}
              </div>
            </div>

              <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Ready to create!</strong> This sub-event will be linked to "{masterEvent.hero?.name || masterEvent.eventDetails?.eventName}" and appear in the sub-events list.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Sub-Event
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-3">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-1.5 text-xs ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                    index < currentStep 
                      ? 'bg-primary border-primary text-primary-foreground'
                      : index === currentStep
                        ? 'border-primary text-primary'
                        : 'border-muted-foreground/30'
                  }`}
                >
                  {index < currentStep ? <Check className="h-3 w-3" /> : step.icon}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-4">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onClose : handleBack}
            disabled={isCreating}
          >
            {currentStep === 0 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || !canProceed()}>
              {isCreating ? (
                'Creating...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Create Sub-Event
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
