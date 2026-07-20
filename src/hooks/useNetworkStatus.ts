import { useEffect, useState } from "react";

export interface NetworkStatus {
  online: boolean;
  /** True briefly after coming back online, so the UI can show "reconnected". */
  justReconnected: boolean;
}

/**
 * Track browser online/offline state. SSR-safe: assumes online until the
 * client mounts (navigator is unavailable during server render).
 */
export function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Sync with the real value once we're on the client.
    setOnline(navigator.onLine);

    let reconnectTimer: ReturnType<typeof setTimeout>;

    const handleOnline = () => {
      setOnline(true);
      setJustReconnected(true);
      reconnectTimer = setTimeout(() => setJustReconnected(false), 4000);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(reconnectTimer);
    };
  }, []);

  return { online, justReconnected };
}
