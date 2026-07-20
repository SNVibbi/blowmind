import { Bookmark, Post } from "../Types";
import { fetchPostsByIds } from "../lib/postService";
import { db } from "../utils/firebaseConfig";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const BOOKMARK_PAGE_SIZE = 50;

/**
 * Load the newest bookmarks for a user and resolve them to their posts.
 * Bookmarks whose post has been deleted are skipped automatically.
 */
export function useBookmarkedPosts(uid: string | undefined) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "bookmarks"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc"),
            limit(BOOKMARK_PAGE_SIZE)
          )
        );
        const bookmarks = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Bookmark, "id">),
          id: d.id,
        }));

        const loaded = await fetchPostsByIds(
          bookmarks.map((b) => b.postId).filter(Boolean)
        );
        if (!cancelled) {
          setPosts(loaded);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load your bookmarks.");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { posts, error };
}
