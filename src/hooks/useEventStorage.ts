import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EventGuide, createDefaultEventGuideData, DEFAULT_EVENT_SECTION_ORDER } from '@/types/event';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

const SYNC_DEBOUNCE_MS = 500;

interface DbEvent {
  id: string;
  user_id: string;
  organization_id: string | null;
  parent_brand_id: string | null;
  name: string;
  slug: string | null;
  is_favorite: boolean;
  is_public: boolean;
  section_order: string[] | null;
  hidden_sections: string[] | null;
  guide_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Defensive helpers
const asArray = <T,>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

const asObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : fallback;

const mergeSectionOrder = (dbOrder: string[] | null): EventGuide['sectionOrder'] => {
  if (!dbOrder) return DEFAULT_EVENT_SECTION_ORDER;
  const missingSections = DEFAULT_EVENT_SECTION_ORDER.filter(s => !dbOrder.includes(s));
  return [...dbOrder, ...missingSections] as EventGuide['sectionOrder'];
};

const dbToEventGuide = (db: DbEvent): EventGuide => {
  const guideData = asObject<Record<string, unknown>>(db.guide_data, {});
  
  return {
    id: db.id,
    type: 'event',
    slug: db.slug || undefined,
    organizationId: db.organization_id,
    parentBrandId: db.parent_brand_id || undefined,
    isFavorite: db.is_favorite,
    isPublic: db.is_public ?? false,
    sectionOrder: mergeSectionOrder(db.section_order),
    hiddenSections: asArray(db.hidden_sections, []) as EventGuide['hiddenSections'],
    
    hero: asObject(guideData.hero, { name: db.name, tagline: '', coverImage: '', logoUrl: '' }) as EventGuide['hero'],
    tagline: asObject(guideData.tagline, { primary: '', secondary: '', variations: [] }) as EventGuide['tagline'],
    identity: asObject(guideData.identity, { missionStatement: '', archetype: '', toneOfVoice: [] }) as EventGuide['identity'],
    values: asArray(guideData.values, []) as EventGuide['values'],
    
    // Event-specific
    eventDetails: asObject(guideData.eventDetails, { eventName: db.name, eventDates: '', location: '' }) as EventGuide['eventDetails'],
    eventLogos: asArray(guideData.eventLogos, []) as EventGuide['eventLogos'],
    eventSignage: asArray(guideData.eventSignage, []) as EventGuide['eventSignage'],
    eventBanners: asArray(guideData.eventBanners, []) as EventGuide['eventBanners'],
    eventDigitalMaterials: asArray(guideData.eventDigitalMaterials, []) as EventGuide['eventDigitalMaterials'],
    eventSchedule: asArray(guideData.eventSchedule, []) as EventGuide['eventSchedule'],
    eventSpeakers: asArray(guideData.eventSpeakers, []) as EventGuide['eventSpeakers'],
    eventSponsors: asArray(guideData.eventSponsors, []) as EventGuide['eventSponsors'],
    eventHistory: asArray(guideData.eventHistory, []) as EventGuide['eventHistory'],
    eventVideos: asArray(guideData.eventVideos, []) as EventGuide['eventVideos'],
    eventLocation: asObject(guideData.eventLocation, { venueName: '', address: '', city: '', country: '', venueMaps: [] }) as EventGuide['eventLocation'],
    
    // Visual
    logos: asArray(guideData.logos, []) as EventGuide['logos'],
    brandIcons: asArray(guideData.brandIcons, []) as EventGuide['brandIcons'],
    colors: asArray(guideData.colors, []) as EventGuide['colors'],
    colorCombinations: asArray(guideData.colorCombinations, []) as EventGuide['colorCombinations'],
    gradients: asArray(guideData.gradients, []) as EventGuide['gradients'],
    patterns: asArray(guideData.patterns, []) as EventGuide['patterns'],
    typography: asArray(guideData.typography, []) as EventGuide['typography'],
    textStyles: asArray(guideData.textStyles, []) as EventGuide['textStyles'],
    iconography: asArray(guideData.iconography, []) as EventGuide['iconography'],
    socialIcons: asArray(guideData.socialIcons, []) as EventGuide['socialIcons'],
    imagery: asArray(guideData.imagery, []) as EventGuide['imagery'],
    
    // Communication
    social: asArray(guideData.social, []) as EventGuide['social'],
    socialAssets: asArray(guideData.socialAssets, []) as EventGuide['socialAssets'],
    displayBanners: asArray(guideData.displayBanners, []) as EventGuide['displayBanners'],
    websites: asArray(guideData.websites, []) as EventGuide['websites'],
    signatures: asArray(guideData.signatures, []) as EventGuide['signatures'],
    emailBanners: asArray(guideData.emailBanners, []) as EventGuide['emailBanners'],
    qr: asObject(guideData.qr, { defaultUrl: '', fgColor: '#000000', bgColor: '#ffffff' }) as EventGuide['qr'],
    videos: asArray(guideData.videos, []) as EventGuide['videos'],
    
    // Resources
    assets: asArray(guideData.assets, []) as EventGuide['assets'],
    misuse: asArray(guideData.misuse, []) as EventGuide['misuse'],
    atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as EventGuide['atmosphere'],
    
    // Collateral
    caseStudies: asArray(guideData.caseStudies, []) as EventGuide['caseStudies'],
    brochures: asArray(guideData.brochures, []) as EventGuide['brochures'],
    templates: asArray(guideData.templates, []) as EventGuide['templates'],
    services: asArray(guideData.services, []) as EventGuide['services'],
    linkedGuides: asArray(guideData.linkedGuides, []) as EventGuide['linkedGuides'],
    templateSpecs: asArray(guideData.templateSpecs, []) as EventGuide['templateSpecs'],
    revenueData: asArray(guideData.revenueData, []) as EventGuide['revenueData'],
    statistics: asArray(guideData.statistics, []) as EventGuide['statistics'],
    infographicLayout: (guideData.infographicLayout as EventGuide['infographicLayout']) || 'cards',
    sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as EventGuide['sectionSubtitles'],
    sectionLayouts: asObject(guideData.sectionLayouts, {}) as EventGuide['sectionLayouts'],
    pageSettings: asObject(guideData.pageSettings, {}) as EventGuide['pageSettings'],
    
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
};

const eventGuideToDb = (event: Partial<EventGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, parentBrandId, ...guideData } = event as EventGuide;
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    ...(parentBrandId ? { parent_brand_id: parentBrandId } : {}),
    name: guideData.hero?.name ?? guideData.eventDetails?.eventName ?? 'My Event',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: guideData as unknown as Json,
  };
};

export const useEventStorage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const [events, setEvents] = useState<EventGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  
  const eventsRef = useRef<EventGuide[]>([]);
  const pendingUpdatesRef = useRef<Map<string, Partial<EventGuide>>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);
  
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  
  const fetchEvents = useCallback(async () => {
    if (!user?.id) {
      setEvents([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const query = supabase
        .from('events')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (organization?.id) {
        query.eq('organization_id', organization.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const eventGuides = (data || []).map((row) => dbToEventGuide(row as unknown as DbEvent));
      setEvents(eventGuides);
      setLastSyncedAt(new Date());
      setSyncStatus('idle');
      setLastSyncError(null);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setSyncStatus('error');
      setLastSyncError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organization?.id]);
  
  useEffect(() => {
    if (!authLoading && !orgLoading) {
      fetchEvents();
    }
  }, [authLoading, orgLoading, fetchEvents]);
  
  const addEvent = useCallback(async (name: string, parentBrandId?: string): Promise<EventGuide | null> => {
    if (!user?.id) {
      toast.error('Please sign in to create an event');
      return null;
    }
    
    const defaultData = createDefaultEventGuideData(name);
    const dbPayload = eventGuideToDb(
      { ...defaultData, parentBrandId } as Partial<EventGuide>,
      user.id,
      organization?.id
    );
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(dbPayload)
        .select()
        .single();
      
      if (error) throw error;
      
      const newEvent = dbToEventGuide(data as DbEvent);
      setEvents(prev => [newEvent, ...prev]);
      toast.success(`Event "${name}" created`);
      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      toast.error('Failed to create event');
      return null;
    }
  }, [user?.id, organization?.id]);
  
  const updateEvent = useCallback((id: string, updates: Partial<EventGuide>) => {
    // Optimistic update
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
    ));
    
    // Queue update
    const existing = pendingUpdatesRef.current.get(id) || {};
    pendingUpdatesRef.current.set(id, { ...existing, ...updates });
    
    // Debounced sync
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncPendingUpdates(), SYNC_DEBOUNCE_MS);
  }, []);
  
  const syncPendingUpdates = useCallback(async () => {
    if (!user?.id || pendingUpdatesRef.current.size === 0) return;
    
    setSyncStatus('syncing');
    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();
    
    for (const [id, changes] of updates) {
      const currentEvent = eventsRef.current.find(e => e.id === id);
      if (!currentEvent) continue;
      
      const merged = { ...currentEvent, ...changes };
      const dbPayload = eventGuideToDb(merged, user.id, organization?.id);
      
      try {
        const { error } = await supabase
          .from('events')
          .update(dbPayload)
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync event update:', err);
        setSyncStatus('error');
        setLastSyncError(err instanceof Error ? err.message : 'Unknown error');
        return;
      }
    }
    
    setLastSyncedAt(new Date());
    setSyncStatus('idle');
    setLastSyncError(null);
  }, [user?.id, organization?.id]);
  
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event deleted');
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error('Failed to delete event');
    }
  }, []);
  
  const getEvent = useCallback((id: string) => events.find(e => e.id === id), [events]);
  
  const getEventBySlug = useCallback((slug: string) => events.find(e => e.slug === slug), [events]);
  
  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    const newValue = !event.isFavorite;
    updateEvent(id, { isFavorite: newValue });
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_favorite: newValue })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      updateEvent(id, { isFavorite: !newValue });
    }
  }, [events, updateEvent]);
  
  const saveNow = useCallback(async () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    await syncPendingUpdates();
  }, [syncPendingUpdates]);
  
  const hasPendingChanges = useCallback(() => pendingUpdatesRef.current.size > 0, []);
  
  const refetch = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);
  
  return {
    events,
    isLoading,
    syncStatus,
    lastSyncedAt,
    lastSyncError,
    isOnline,
    addEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    getEventBySlug,
    toggleFavorite,
    saveNow,
    hasPendingChanges,
    refetch,
  };
};
