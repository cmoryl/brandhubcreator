/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcuts for power users
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  showToasts?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const useKeyboardShortcuts = (
  customShortcuts: Shortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, showToasts = false } = options;
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const shortcutsRef = useRef<Shortcut[]>([]);

  // Default global shortcuts
  const defaultShortcuts: Shortcut[] = [
    {
      key: 'k',
      ctrl: !isMac,
      meta: isMac,
      description: 'Open command palette',
      action: () => {
        // Could integrate with a command palette in the future
        toast.info('Command palette coming soon!');
      },
    },
    {
      key: 'h',
      ctrl: !isMac,
      meta: isMac,
      shift: true,
      description: 'Go to home',
      action: () => navigate('/'),
    },
    {
      key: 'd',
      ctrl: !isMac,
      meta: isMac,
      shift: true,
      description: 'Go to admin dashboard',
      action: () => navigate('/admin'),
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      key: 's',
      ctrl: !isMac,
      meta: isMac,
      shift: true,
      description: 'Go to settings',
      action: () => navigate('/org/settings'),
      requiresAuth: true,
    },
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        const shortcuts = shortcutsRef.current
          .filter(s => {
            if (s.requiresAuth && !user) return false;
            if (s.requiresAdmin && !isAdmin) return false;
            return true;
          })
          .map(s => {
            const modifiers = [];
            if (s.ctrl) modifiers.push('Ctrl');
            if (s.meta) modifiers.push('⌘');
            if (s.shift) modifiers.push('Shift');
            if (s.alt) modifiers.push('Alt');
            return `${modifiers.join('+')}${modifiers.length ? '+' : ''}${s.key.toUpperCase()}: ${s.description}`;
          })
          .join('\n');
        
        toast.info('Keyboard Shortcuts', {
          description: shortcuts || 'No shortcuts available',
          duration: 5000,
        });
      },
    },
  ];

  // Combine default and custom shortcuts
  shortcutsRef.current = [...defaultShortcuts, ...customShortcuts];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        const ctrlMatch = shortcut.ctrl ? (isMac ? event.metaKey : event.ctrlKey) : true;
        const metaMatch = shortcut.meta ? event.metaKey : !shortcut.meta || !isMac;
        const shiftMatch = shortcut.shift ? event.shiftKey : !shortcut.shift || !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !shortcut.alt || !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // Check modifier exclusivity
        const noExtraCtrl = shortcut.ctrl || shortcut.meta || !event.ctrlKey;
        const noExtraMeta = shortcut.meta || !event.metaKey;
        const noExtraShift = shortcut.shift || !event.shiftKey;
        const noExtraAlt = shortcut.alt || !event.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          // Check permissions
          if (shortcut.requiresAuth && !user) continue;
          if (shortcut.requiresAdmin && !isAdmin) continue;

          event.preventDefault();
          
          if (showToasts) {
            toast.success(`Running: ${shortcut.description}`);
          }
          
          shortcut.action();
          break;
        }
      }
    },
    [enabled, user, isAdmin, showToasts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current.filter(s => {
      if (s.requiresAuth && !user) return false;
      if (s.requiresAdmin && !isAdmin) return false;
      return true;
    }),
  };
};

/**
 * KeyboardShortcutsProvider - wraps the app to enable global shortcuts
 */
export const KeyboardShortcutsProvider = ({ children }: { children: React.ReactNode }) => {
  useKeyboardShortcuts();
  return children;
};
