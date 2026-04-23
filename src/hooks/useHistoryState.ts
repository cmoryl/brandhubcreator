/**
 * useHistoryState
 *
 * Drop-in replacement for useState that maintains an undo/redo stack.
 * - `set(next | updater)` pushes a new entry to history (truncates redo branch).
 * - `replace(next | updater)` mutates the current entry without creating a history step.
 *   Use for transient changes (e.g. dragging a slider) so the stack isn't flooded.
 * - `reset(value)` wipes history and seeds a new baseline.
 * - `undo()` / `redo()` move the cursor; `canUndo` / `canRedo` reflect availability.
 */
import { useCallback, useRef, useState } from 'react';

export interface HistoryControls<T> {
  state: T;
  set: (next: T | ((prev: T) => T)) => void;
  replace: (next: T | ((prev: T) => T)) => void;
  reset: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  cursor: number;
}

const MAX_HISTORY = 50;

export function useHistoryState<T>(initial: T): HistoryControls<T> {
  const [history, setHistory] = useState<T[]>([initial]);
  const [cursor, setCursor] = useState(0);
  // Mirror cursor in a ref so undo/redo handlers stay stable across renders
  const cursorRef = useRef(0);
  cursorRef.current = cursor;

  const state = history[cursor];

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const idx = cursorRef.current;
      const prev = h[idx];
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      // Truncate any redo branch, then append
      const truncated = h.slice(0, idx + 1);
      const appended = [...truncated, value];
      // Cap stack size — drop oldest entries
      const trimmed = appended.length > MAX_HISTORY ? appended.slice(appended.length - MAX_HISTORY) : appended;
      setCursor(trimmed.length - 1);
      return trimmed;
    });
  }, []);

  const replace = useCallback((next: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const idx = cursorRef.current;
      const prev = h[idx];
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      const copy = h.slice();
      copy[idx] = value;
      return copy;
    });
  }, []);

  const reset = useCallback((value: T) => {
    setHistory([value]);
    setCursor(0);
  }, []);

  const undo = useCallback(() => {
    setCursor((c) => (c > 0 ? c - 1 : c));
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      setCursor((c) => (c < h.length - 1 ? c + 1 : c));
      return h;
    });
  }, []);

  return {
    state,
    set,
    replace,
    reset,
    undo,
    redo,
    canUndo: cursor > 0,
    canRedo: cursor < history.length - 1,
    historySize: history.length,
    cursor,
  };
}
