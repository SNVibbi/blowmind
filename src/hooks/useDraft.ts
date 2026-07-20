import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persist an in-progress form value to localStorage so a refresh, a
 * crash, or an accidental navigation doesn't lose the user's work.
 * Debounced writes; SSR-safe.
 */
export function useDraft<T>(
  key: string,
  initialValue: T,
  { debounceMs = 500 }: { debounceMs?: number } = {}
) {
  const storageKey = `blowmind:draft:${key}`;
  const [value, setValue] = useState<T>(initialValue);
  const [restored, setRestored] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Restore once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null) {
        setValue(JSON.parse(saved) as T);
        setRestored(true);
      }
    } catch {
      /* corrupt or unavailable storage — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced persistence on change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        /* quota or unavailable — non-fatal */
      }
    }, debounceMs);
    return () => clearTimeout(timer.current);
  }, [value, storageKey, debounceMs]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    setRestored(false);
  }, [storageKey]);

  return { value, setValue, restored, clearDraft };
}
