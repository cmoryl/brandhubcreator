import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EventGuide, createDefaultEventGuideData, DEFAULT_EVENT_SECTION_ORDER } from '@/types/event';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { CACHE_KEYS } from '@/lib/cacheManager';
import { stripBase64FromGuideData } from '@/lib/stripBase64FromGuideData';
import { logger } from '@/lib/logger';

const SYNC_DEBOUNCE_MS = 500;
const CACHE_KEY = CACHE_KEYS.EVENTS;

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
    eventPrintMaterials: asArray(guideData.eventPrintMaterials, []) as EventGuide['eventPrintMaterials'],
    eventSponsorshipMaterials: asArray(guideData.eventSponsorshipMaterials, []) as EventGuide['eventSponsorshipMaterials'],
    eventInfographics: asArray(guideData.eventInfographics, []) as EventGuide['eventInfographics'],
    eventApplications: asArray(guideData.eventApplications, []) as EventGuide['eventApplications'],
    eventDigitalAssets: asArray(guideData.eventDigitalAssets, []) as EventGuide['eventDigitalAssets'],
    eventSchedule: asArray(guideData.eventSchedule, []) as EventGuide['eventSchedule'],
    eventSpeakers: asArray(guideData.eventSpeakers, []) as EventGuide['eventSpeakers'],
    eventSponsors: asArray(guideData.eventSponsors, []) as EventGuide['eventSponsors'],
    eventHistory: asArray(guideData.eventHistory, []) as EventGuide['eventHistory'],
    partnerBooths: asArray(guideData.partnerBooths, []) as EventGuide['partnerBooths'],
    eventVideos: asArray(guideData.eventVideos, []) as EventGuide['eventVideos'],
    eventLocation: asObject(guideData.eventLocation, { venueName: '', address: '', city: '', country: '', venueMaps: [] }) as EventGuide['eventLocation'],
    
    // Visual
    logos: asArray(guideData.logos, []) as EventGuide['logos'],
    logoDownloadLinks: asArray(guideData.logoDownloadLinks, []) as EventGuide['logoDownloadLinks'],
    brandIcons: asArray(guideData.brandIcons, []) as EventGuide['brandIcons'],
    colors: asArray(guideData.colors, []) as EventGuide['colors'],
    colorCombinations: asArray(guideData.colorCombinations, []) as EventGuide['colorCombinations'],
    gradients: asArray(guideData.gradients, []) as EventGuide['gradients'],
    patterns: asArray(guideData.patterns, []) as EventGuide['patterns'],
    typography: asArray(guideData.typography, []) as EventGuide['typography'],
    textStyles: asArray(guideData.textStyles, []) as EventGuide['textStyles'],
    iconography: asArray(guideData.iconography, []) as EventGuide['iconography'],
    defaultIconColor: guideData.defaultIconColor as EventGuide['defaultIconColor'],
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
    imageAssets: asArray(guideData.imageAssets, []) as EventGuide['imageAssets'],
    misuse: asArray(guideData.misuse, []) as EventGuide['misuse'],
    atmosphere: asObject(guideData.atmosphere, { style: 'gradient', animate: true, opacity: 0.5, blur: 0 }) as EventGuide['atmosphere'],
    sharedAssets: asArray(guideData.sharedAssets, []) as EventGuide['sharedAssets'],
    webinars: asArray(guideData.webinars, []) as EventGuide['webinars'],
    awards: asArray(guideData.awards, []) as EventGuide['awards'],
    
    // Collateral
    caseStudies: asArray(guideData.caseStudies, []) as EventGuide['caseStudies'],
    brochures: asArray(guideData.brochures, []) as EventGuide['brochures'],
    templates: asArray(guideData.templates, []) as EventGuide['templates'],
    services: asArray(guideData.services, []) as EventGuide['services'],
    linkedGuides: asArray(guideData.linkedGuides, []) as EventGuide['linkedGuides'],
    templateSpecs: asArray(guideData.templateSpecs, []) as EventGuide['templateSpecs'],
    presentationTemplates: asArray(guideData.presentationTemplates, []) as EventGuide['presentationTemplates'],
    approvedImagery: guideData.approvedImagery as EventGuide['approvedImagery'],
    presentations: asArray(guideData.presentations, []) as EventGuide['presentations'],
    
    // Data & Analytics
    revenueData: asArray(guideData.revenueData, []) as EventGuide['revenueData'],
    statistics: asArray(guideData.statistics, []) as EventGuide['statistics'],
    infographicLayout: (guideData.infographicLayout as EventGuide['infographicLayout']) || 'cards',
    
    // Partners
    sponsorLogos: asArray(guideData.sponsorLogos, []) as EventGuide['sponsorLogos'],
    clientLogos: asArray(guideData.clientLogos, []) as EventGuide['clientLogos'],
    
    // Insights & Updates
    insights: asArray(guideData.insights, []) as EventGuide['insights'],
    insightsLayout: guideData.insightsLayout as EventGuide['insightsLayout'],
    insightsAccessCode: (guideData.insightsAccessCode as string) || undefined,
    
    // Locations
    locations: asArray(guideData.locations, []) as EventGuide['locations'],
    locationStats: asArray(guideData.locationStats, []) as EventGuide['locationStats'],
    
    // Settings
    sectionSubtitles: asObject(guideData.sectionSubtitles, {}) as EventGuide['sectionSubtitles'],
    sectionLayouts: asObject(guideData.sectionLayouts, {}) as EventGuide['sectionLayouts'],
    pageSettings: asObject(guideData.pageSettings, {}) as EventGuide['pageSettings'],
    
    // Brand Visuals bundle (Foundation/Collaborate/Transform) — used by Layout Templates
    ...(guideData.brandVisuals ? { brandVisuals: guideData.brandVisuals } : {}),
    ...(guideData.layoutTemplateCustomizations
      ? { layoutTemplateCustomizations: asArray(guideData.layoutTemplateCustomizations, []) }
      : {}),
    
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  } as EventGuide;
};

const eventGuideToDb = (event: Partial<EventGuide>, userId: string, organizationId?: string | null) => {
  const { id, type, isFavorite, isPublic, sectionOrder, hiddenSections, createdAt, updatedAt, parentBrandId, ...guideData } = event as EventGuide;
  // Strip any remaining base64 blobs to prevent payload bloat
  const cleanedGuideData = stripBase64FromGuideData(guideData as Record<string, unknown>);
  return {
    user_id: userId,
    ...(organizationId ? { organization_id: organizationId } : {}),
    ...(parentBrandId ? { parent_brand_id: parentBrandId } : {}),
    name: guideData.hero?.name ?? guideData.eventDetails?.eventName ?? 'My Event',
    is_favorite: isFavorite ?? false,
    is_public: isPublic ?? false,
    section_order: (sectionOrder as string[] | null) ?? null,
    hidden_sections: (hiddenSections as string[] | null) ?? null,
    guide_data: cleanedGuideData as unknown as Json,
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
  
  // Core state refs
  const eventsRef = useRef<EventGuide[]>([]);
  const pendingUpdatesRef = useRef<Map<string, Partial<EventGuide>>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for reliable flush access (needed for beforeunload where state may be stale)
  const userRef = useRef(user);
  const orgRef = useRef(organization);
  const accessTokenRef = useRef<string | null>(null);
  const eventSyncTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  useEffect(() => {
    orgRef.current = organization;
  }, [organization]);
  
  // Track access token for flush operations
  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data }) => {
        accessTokenRef.current = data.session?.access_token ?? null;
      });
    } else {
      accessTokenRef.current = null;
    }
  }, [user]);
  
  // LocalStorage cache functions for offline resilience
  const saveCache = useCallback((nextEvents: EventGuide[]) => {
    try {
      const payload = {
        savedAt: Date.now(),
        userId: user?.id ?? null,
        events: nextEvents,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota errors
    }
  }, [user?.id]);

  const loadCache = useCallback((): EventGuide[] | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        savedAt?: number;
        userId?: string | null;
        events?: EventGuide[];
      };
      // Only load cache for the current user
      if ((parsed.userId ?? null) !== (user?.id ?? null)) return null;
      
      // Rehydrate Date objects
      const rehydrateDates = <T extends { createdAt?: unknown; updatedAt?: unknown }>(item: T): T => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt as string) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt as string) : new Date(),
      });
      
      return Array.isArray(parsed.events) ? parsed.events.map(rehydrateDates) : [];
    } catch {
      return null;
    }
  }, [user?.id]);
  
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
      saveCache(eventGuides); // Persist to localStorage for offline resilience
      setLastSyncedAt(new Date());
      setSyncStatus('idle');
      setLastSyncError(null);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      
      // Fallback to cached data on fetch failure
      const cached = loadCache();
      if (cached && cached.length > 0) {
        logger.events('Using cached data due to fetch failure');
        setEvents(cached);
        setSyncStatus('offline');
        setLastSyncError('Using cached data. Changes will sync when connection recovers.');
      } else {
        setSyncStatus('error');
        setLastSyncError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organization?.id, saveCache, loadCache]);
  
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
      setEvents(prev => {
        const updated = [newEvent, ...prev];
        saveCache(updated);
        return updated;
      });
      toast.success(`Event "${name}" created`);
      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      toast.error('Failed to create event');
      return null;
    }
  }, [user?.id, organization?.id, saveCache]);
  
  const updateEvent = useCallback((id: string, updates: Partial<EventGuide>) => {
    // Optimistic update
    setEvents(prev => {
      const updated = prev.map(e => 
        e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
      );
      saveCache(updated);
      return updated;
    });
    
    // Queue update
    const existing = pendingUpdatesRef.current.get(id) || {};
    pendingUpdatesRef.current.set(id, { ...existing, ...updates });
    
    // Clear any existing timeout for this specific event
    const existingTimeout = eventSyncTimeouts.current.get(id);
    if (existingTimeout) clearTimeout(existingTimeout);
    
    // Debounced sync for this specific event
    const timeout = setTimeout(() => {
      syncPendingUpdates();
      eventSyncTimeouts.current.delete(id);
    }, SYNC_DEBOUNCE_MS);
    eventSyncTimeouts.current.set(id, timeout);
    
    // Also update the main timeout ref for backward compatibility
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncPendingUpdates(), SYNC_DEBOUNCE_MS);
  }, [saveCache]);
  
  const syncPendingUpdates = useCallback(async () => {
    if (!user?.id || pendingUpdatesRef.current.size === 0) return;
    
    setSyncStatus('syncing');
    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();
    
    for (const [id, changes] of updates) {
      let currentEvent = eventsRef.current.find(e => e.id === id);
      
      // If event not in local state, fetch from DB and merge pending updates
      if (!currentEvent) {
        logger.events('Event not in local state, fetching from DB:', id);
        try {
          const { data: dbEvent, error: fetchError } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (fetchError || !dbEvent) {
            console.error('[EVENTS SYNC] Failed to fetch event from DB:', fetchError);
            continue;
          }
          
          currentEvent = { ...dbToEventGuide(dbEvent as DbEvent), ...changes };
        } catch (fetchErr) {
          console.error('[EVENTS SYNC] Error fetching event:', fetchErr);
          continue;
        }
      }
      
      const merged = { ...currentEvent, ...changes };
      const dbPayload = eventGuideToDb(merged, user.id, organization?.id);
      
      try {
        const { error } = await supabase
          .from('events')
          .update(dbPayload)
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error('[EVENTS SYNC] Failed to sync event update:', err);
        setSyncStatus('error');
        setLastSyncError(err instanceof Error ? err.message : 'Unknown error');
        return;
      }
    }
    
    // Update cache with current state after successful sync
    saveCache(eventsRef.current);
    setLastSyncedAt(new Date());
    setSyncStatus('idle');
    setLastSyncError(null);
  }, [user?.id, organization?.id, saveCache]);
  
  // Flush pending updates using fetch with keepalive (works during page unload)
  const flushPendingUpdates = useCallback(() => {
    // Clear all individual timeouts
    eventSyncTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    eventSyncTimeouts.current.clear();
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    // Check if we have pending updates and necessary auth
    if (pendingUpdatesRef.current.size === 0) return;
    if (!userRef.current?.id || !accessTokenRef.current) {
      console.warn('[EVENTS FLUSH] Cannot flush: missing user or access token');
      return;
    }
    
    logger.events('Flushing', pendingUpdatesRef.current.size, 'pending updates');
    
    const updates = Array.from(pendingUpdatesRef.current.entries());
    pendingUpdatesRef.current.clear();
    
    for (const [id, changes] of updates) {
      const currentEvent = eventsRef.current.find(e => e.id === id);
      if (!currentEvent) continue;
      
      const merged = { ...currentEvent, ...changes };
      const dbPayload = eventGuideToDb(merged, userRef.current.id, orgRef.current?.id);
      
      // Use fetch with keepalive for reliable persistence during page unload
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${accessTokenRef.current}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(dbPayload),
        keepalive: true,
      }).catch(err => {
        console.error('[EVENTS FLUSH] Failed to flush event update:', err);
      });
    }
  }, []);
  
  // Handle beforeunload and cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingUpdates();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Flush on unmount as well
      flushPendingUpdates();
    };
  }, [flushPendingUpdates]);
  
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents(prev => {
        const updated = prev.filter(e => e.id !== id);
        saveCache(updated);
        return updated;
      });
      toast.success('Event deleted');
    } catch (err) {
      console.error('Failed to delete event:', err);
      toast.error('Failed to delete event');
    }
  }, [saveCache]);
  
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
    eventSyncTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    eventSyncTimeouts.current.clear();
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
