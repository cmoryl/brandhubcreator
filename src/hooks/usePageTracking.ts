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
  const sessionId = useRef<string>('');

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

  // Track page view
  const trackPageView = useCallback(async () => {
    if (!user?.id) return;
    
    const currentSessionId = await getOrCreateSession();
    const path = location.pathname;
    
    // Don't track the same path twice in a row
    if (path === lastPath.current) return;
    
    // Calculate duration of previous page
    const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
    
    try {
      await supabase.from('page_views').insert({
        user_id: user.id,
        session_id: currentSessionId,
        entity_type: options.entityType || 'page',
        entity_id: options.entityId || null,
        entity_name: options.entityName || null,
        page_path: path,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        duration_seconds: lastPath.current ? duration : 0,
      });
      
      // Update session page count
      await supabase
        .from('user_sessions')
        .update({ page_count: 1 }) // Will be incremented properly via trigger if needed
        .eq('session_id', currentSessionId)
        .single();
      
    } catch (error) {
      console.error('[PageTracking] Failed to track page view:', error);
    }
    
    lastPath.current = path;
    pageStartTime.current = Date.now();
  }, [user?.id, location.pathname, options, getOrCreateSession]);

  // Track on route change
  useEffect(() => {
    trackPageView();
  }, [location.pathname, trackPageView]);

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
 */
export const trackEntityView = async (
  userId: string | undefined,
  entityType: string,
  entityId: string,
  entityName: string
) => {
  if (!userId) return;
  
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
