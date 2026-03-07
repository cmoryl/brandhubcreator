/**
 * Environment-gated debug logger.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.sync('updateBrand: Scheduling update for', id);
 *   logger.storage('Loaded from cache');
 *   logger.realtime('Subscribed to', channelName);
 * 
 * Logs are suppressed in production builds (import.meta.env.PROD).
 * console.error and console.warn always pass through.
 */

const IS_DEV = !import.meta.env.PROD;

type LogNamespace =
  | 'sync'
  | 'storage'
  | 'realtime'
  | 'events'
  | 'auth'
  | 'admin'
  | 'oracle'
  | 'general';

function createNamespacedLogger(namespace: string) {
  return (...args: unknown[]) => {
    if (IS_DEV) {
      console.log(`[${namespace.toUpperCase()}]`, ...args);
    }
  };
}

export const logger = {
  /** Sync operations (brand/product/event DB writes) */
  sync: createNamespacedLogger('sync'),
  /** Storage & cache operations */
  storage: createNamespacedLogger('storage'),
  /** Realtime subscriptions */
  realtime: createNamespacedLogger('realtime'),
  /** Event storage operations */
  events: createNamespacedLogger('events'),
  /** Auth flow */
  auth: createNamespacedLogger('auth'),
  /** Admin operations */
  admin: createNamespacedLogger('admin'),
  /** Oracle Brain */
  oracle: createNamespacedLogger('oracle'),
  /** General debug */
  debug: createNamespacedLogger('debug'),
};
