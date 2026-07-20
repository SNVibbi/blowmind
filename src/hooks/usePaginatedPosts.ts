import { Post } from "../Types";
import { db } from "../utils/firebaseConfig";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 10;

interface UsePaginatedPosts {
  posts: Post[] | null;
  error: string | null;
  isPending: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Cursor-paginated feed query. Replaces the unbounded whole-collection
 * onSnapshot listener: cost is now O(page) per reader instead of
 * O(total posts), and pages are plain one-shot reads the CDN of
 * Firestore's frontend can serve cheaply.
 *
 * Pass `authorId` to page through one author's posts (profile page).
 */
export function usePaginatedPosts(authorId?: string): UsePaginatedPosts {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const loadingRef = useRef(false);

  const buildQuery = useCallback(
    (cursor: QueryDocumentSnapshot | null) => {
      const parts = [
        ...(authorId ? [where("author.id", "==", authorId)] : []),
        orderBy("createdAt", "desc"),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(PAGE_SIZE),
      ];
      return query(collection(db, "posts"), ...parts);
    },
    [authorId]
  );

  const loadPage = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setIsPending(true);

      try {
        const cursor = reset ? null : cursorRef.current;
        const snapshot = await getDocs(buildQuery(cursor));

        const page: Post[] = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Post, "id">),
          id: d.id,
        }));

        cursorRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setPosts((prev) => (reset || !prev ? page : [...prev, ...page]));
        setError(null);
      } catch {
        setError("Could not load posts. Check your connection and try again.");
      } finally {
        setIsPending(false);
        loadingRef.current = false;
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    cursorRef.current = null;
    setPosts(null);
    setHasMore(true);
    loadPage(true);
  }, [loadPage]);

  const loadMore = useCallback(() => loadPage(false), [loadPage]);

  return { posts, error, isPending, hasMore, loadMore };
}
