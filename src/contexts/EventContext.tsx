import { createContext, useContext, ReactNode } from 'react';
import { EventGuide } from '@/types/event';
import { useEventStorage } from '@/hooks/useEventStorage';
import { CACHE_KEYS } from '@/lib/cacheManager';

interface EventContextType {
  events: EventGuide[];
  isLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  isOnline: boolean;
  addEvent: (name: string, parentBrandId?: string) => Promise<EventGuide | null>;
  updateEvent: (id: string, updates: Partial<EventGuide>) => void;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => EventGuide | undefined;
  getEventBySlug: (slug: string) => EventGuide | undefined;
  toggleFavorite: (id: string) => Promise<void>;
  saveNow: () => Promise<void>;
  hasPendingChanges: () => boolean;
  refetch: () => Promise<void>;
  /** Clear local cache (for cache management) */
  clearLocalCache: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const storage = useEventStorage();

  // Add clearLocalCache function
  const clearLocalCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.EVENTS);
    } catch {
      // Ignore errors
    }
  };

  return (
    <EventContext.Provider value={{ ...storage, clearLocalCache }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
