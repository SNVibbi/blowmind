import { db } from "../utils/firebaseConfig";
import { Comment } from "../Types";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Real-time subscriptions are deliberately narrow: the open comment
 * thread (bounded) and single-document status checks. Feeds use
 * paginated one-shot queries instead — see AGENTS.md stage 5.
 */

const COMMENT_PAGE_SIZE = 100;

/** Live comments for the currently open post, oldest first, bounded. */
export function useComments(postId: string | undefined) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
      limit(COMMENT_PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setComments(
          snapshot.docs.map((d) => ({
            ...(d.data() as Omit<Comment, "id">),
            id: d.id,
          }))
        );
        setError(null);
      },
      () => setError("Could not load comments.")
    );

    return () => unsub();
  }, [postId]);

  return { comments, error };
}

/** Whether the given user has liked the given post (live). */
export function useLikeStatus(
  postId: string | undefined,
  uid: string | undefined
) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!postId || !uid) {
      setLiked(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "posts", postId, "likes", uid),
      (snapshot) => setLiked(snapshot.exists()),
      () => setLiked(false)
    );

    return () => unsub();
  }, [postId, uid]);

  return liked;
}

/** Whether the given user has bookmarked the given post (live). */
export function useBookmarkStatus(
  postId: string | undefined,
  uid: string | undefined
) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!postId || !uid) {
      setBookmarked(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "bookmarks", `${uid}_${postId}`),
      (snapshot) => setBookmarked(snapshot.exists()),
      () => setBookmarked(false)
    );

    return () => unsub();
  }, [postId, uid]);

  return bookmarked;
}
