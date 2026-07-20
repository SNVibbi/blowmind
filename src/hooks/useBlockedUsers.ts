import { db } from "../utils/firebaseConfig";
import { useAuthContext } from "../context/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

/**
 * Live set of uids the current user has blocked/muted. Small per-user
 * list, so a real-time listener is appropriate and keeps filtering
 * instant after (un)blocking. Returns an empty set when signed out.
 */
export function useBlockedUsers() {
  const { user } = useAuthContext();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setIds([]);
      return;
    }
    const q = query(
      collection(db, "blocks"),
      where("userId", "==", user.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setIds(snap.docs.map((d) => d.get("targetUid") as string)),
      () => setIds([])
    );
    return () => unsub();
  }, [user]);

  const blockedSet = useMemo(() => new Set(ids), [ids]);
  return { blockedIds: ids, blockedSet };
}
