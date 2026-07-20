import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";

export interface Role {
  isModerator: boolean;
  isAdmin: boolean;
  /** True once the claims have been read (or there's no user). */
  ready: boolean;
}

/**
 * Read the current user's privileged roles from their ID token custom
 * claims (set server-side via the setUserRole Cloud Function). Claims are
 * the trusted source; the UI only mirrors what the rules already enforce.
 */
export function useRole(): Role {
  const { user, authIsReady } = useAuthContext();
  const [role, setRole] = useState<Role>({
    isModerator: false,
    isAdmin: false,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    if (!authIsReady) return;
    if (!user) {
      setRole({ isModerator: false, isAdmin: false, ready: true });
      return;
    }

    user
      .getIdTokenResult()
      .then((result) => {
        if (cancelled) return;
        const isAdmin = result.claims.admin === true;
        const isModerator = isAdmin || result.claims.moderator === true;
        setRole({ isModerator, isAdmin, ready: true });
      })
      .catch(() => {
        if (!cancelled) {
          setRole({ isModerator: false, isAdmin: false, ready: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authIsReady]);

  return role;
}
