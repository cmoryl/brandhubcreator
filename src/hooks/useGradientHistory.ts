import { useCallback, useRef, useState } from "react";
import { StudioGradient } from "@/lib/gradientStudio";

const MAX = 50;

/**
 * Lightweight undo/redo stack for the gradient editor.
 * Coalesces edits made within `debounceMs` of each other so a slider drag
 * doesn't flood the history.
 */
export const useGradientHistory = (initial: StudioGradient, debounceMs = 400) => {
  const [state, setState] = useState<StudioGradient>(initial);
  const past = useRef<StudioGradient[]>([]);
  const future = useRef<StudioGradient[]>([]);
  const lastPush = useRef<number>(0);
  const [, force] = useState(0);

  const set = useCallback((updater: StudioGradient | ((prev: StudioGradient) => StudioGradient)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: StudioGradient) => StudioGradient)(prev) : updater;
      if (next === prev) return prev;
      const now = Date.now();
      if (now - lastPush.current > debounceMs) {
        past.current.push(prev);
        if (past.current.length > MAX) past.current.shift();
        future.current = [];
      }
      lastPush.current = now;
      return next;
    });
  }, [debounceMs]);

  const undo = useCallback(() => {
    setState((prev) => {
      const last = past.current.pop();
      if (!last) return prev;
      future.current.push(prev);
      lastPush.current = 0;
      force((n) => n + 1);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = future.current.pop();
      if (!next) return prev;
      past.current.push(prev);
      lastPush.current = 0;
      force((n) => n + 1);
      return next;
    });
  }, []);

  return {
    gradient: state,
    setGradient: set,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
};
