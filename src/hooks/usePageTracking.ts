/**
 * usePageTracking Hook
 * Automatically tracks page views and session data for analytics
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'bh_session_id';
const SESSION_START_KEY = 'bh_session_start';

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

interface TrackingOptions {
  entityType?: string;
  entityId?: string;
  entityName?: string;
}

export const usePageTracking = (options: TrackingOptions = {}) => {
  const location = useLocation();
  const { user } = useAuth();
  const pageStartTime = useRef<number>(Date.now());
  const lastPath = useRef<string>('');
  const lastTrackTime = useRef<number>(0);
  const sessionId = useRef<string>('');
  const isTracking = useRef<boolean>(false);
  const optionsRef = useRef(options);
  
  // Throttle: minimum 1 second between page view tracks
  const TRACK_THROTTLE_MS = 1000;
  
  // Keep options ref updated
  optionsRef.current = options;

  // Initialize or get session
  const getOrCreateSession = useCallback(async () => {
    let storedSessionId = sessionStorage.getItem(SESSION_KEY);
    const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
    
    // Create new session if none exists or if older than 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    const isExpired = sessionStart && (Date.now() - parseInt(sessionStart)) > thirtyMinutes;
    
    if (!storedSessionId || isExpired) {
      storedSessionId = generateSessionId();
      sessionStorage.setItem(SESSION_KEY, storedSessionId);
      sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
      
      // Record new session in database
      if (user?.id) {
        try {
          await supabase.from('user_sessions').insert({
            user_id: user.id,
            session_id: storedSessionId,
            device_type: getDeviceType(),
            browser: getBrowser(),
          });
        } catch (error) {
          console.error('[PageTracking] Failed to create session:', error);
        }
      }
    }
    
    sessionId.current = storedSessionId;
    return storedSessionId;
  }, [user?.id]);

  // Track page view - stable callback using refs
  const trackPageView = useCallback(async () => {
    if (!user?.id || isTracking.current) return;
    
    const path = location.pathname;
    const now = Date.now();
    
    // Don't track the same path twice in a row
    if (path === lastPath.current) return;
    
    // Throttle: prevent rapid-fire tracking (React StrictMode, re-renders)
    if (now - lastTrackTime.current < TRACK_THROTTLE_MS) return;
    
    // Skip entity routes - they use trackEntityView for more specific tracking
    const isEntityRoute = /^\/(product|brand|event)\//.test(path);
    if (isEntityRoute) {
      lastPath.current = path; // Still update lastPath to prevent re-entry
      return;
    }
    
    isTracking.current = true;
    lastTrackTime.current = now;
    
    try {
      const currentSessionId = await getOrCreateSession();
      
      // Calculate duration of previous page
      const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      await supabase.from('page_views').insert({
        user_id: user.id,
        session_id: currentSessionId,
        entity_type: optionsRef.current.entityType || 'page',
        entity_id: optionsRef.current.entityId || null,
        entity_name: optionsRef.current.entityName || null,
        page_path: path,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        duration_seconds: lastPath.current ? duration : 0,
      });
      
      // Update session page count
      await supabase
        .from('user_sessions')
        .update({ page_count: 1 })
        .eq('session_id', currentSessionId)
        .single();
      
      lastPath.current = path;
      pageStartTime.current = Date.now();
    } catch (error) {
      console.error('[PageTracking] Failed to track page view:', error);
    } finally {
      isTracking.current = false;
    }
  }, [user?.id, location.pathname, getOrCreateSession]);

  // Track on route change - only depends on pathname
  useEffect(() => {
    trackPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Track session end on unmount
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionId.current && user?.id) {
        const duration = Math.floor((Date.now() - parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0')) / 1000);
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?session_id=eq.${sessionId.current}`,
          JSON.stringify({ 
            ended_at: new Date().toISOString(),
            duration_seconds: duration,
            is_active: false 
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id]);

  return { trackPageView };
};

/**
 * Track a specific entity view (brand, product, event)
 * Uses deduplication to prevent double-tracking with usePageTracking
 */
const ENTITY_TRACK_KEY = 'bh_last_entity_track';

export const trackEntityView = async (
  userId: string | undefined,
  entityType: string,
  entityId: string,
  entityName: string
) => {
  if (!userId) return;
  
  // Deduplicate: check if we just tracked this entity
  const trackKey = `${entityType}:${entityId}:${window.location.pathname}`;
  const lastTrack = sessionStorage.getItem(ENTITY_TRACK_KEY);
  if (lastTrack === trackKey) return;
  
  sessionStorage.setItem(ENTITY_TRACK_KEY, trackKey);
  
  const sessionId = sessionStorage.getItem(SESSION_KEY) || generateSessionId();
  
  try {
    await supabase.from('page_views').insert({
      user_id: userId,
      session_id: sessionId,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
    });
  } catch (error) {
    console.error('[PageTracking] Failed to track entity view:', error);
  }
};
