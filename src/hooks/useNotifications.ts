import { db } from "../utils/firebaseConfig";
import { useAuthContext } from "../context/AuthContext";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export interface AppNotification {
  id: string;
  type: "comment" | "like";
  actorUid: string;
  actorName: string;
  actorPhoto: string;
  postId: string;
  postTitle: string;
  text: string;
  read: boolean;
  createdAt?: { seconds: number };
}

const PAGE = 30;

/**
 * Live notifications for the signed-in user. Small per-user list, so a
 * real-time listener is appropriate. Provides the unread count and
 * helpers to mark items read.
 */
export function useNotifications() {
  const { user } = useAuthContext();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(PAGE)
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setItems(
          snap.docs.map((d) => ({
            ...(d.data() as Omit<AppNotification, "id">),
            id: d.id,
          }))
        ),
      () => setItems([])
    );
    return () => unsub();
  }, [user]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await updateDoc(
          doc(db, "users", user.uid, "notifications", id),
          { read: true }
        );
      } catch {
        /* non-critical */
      }
    },
    [user]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const unread = items.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) =>
        batch.update(doc(db, "users", user.uid, "notifications", n.id), {
          read: true,
        })
      );
      await batch.commit();
    } catch {
      /* non-critical */
    }
  }, [user, items]);

  return { items, unreadCount, markRead, markAllRead };
}
