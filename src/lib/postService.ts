import { db } from "../utils/firebaseConfig";
import { Post } from "../Types";
import { User as FirebaseUser } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  limit as fsLimit,
  orderBy,
} from "firebase/firestore";

/**
 * Search posts by keyword across title, tags, and author name.
 *
 * Firestore has no native full-text search, so this fetches a recent
 * window of posts and filters in memory — fine at early scale. The
 * function boundary is deliberate: swap the body for a dedicated search
 * provider (Algolia/Typesense) later without touching the UI. See
 * docs/SCALING.md.
 */
export async function searchPosts(term: string, max = 100): Promise<Post[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];

  const snapshot = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), fsLimit(max))
  );

  const posts = snapshot.docs.map((d) => ({
    ...(d.data() as Omit<Post, "id">),
    id: d.id,
  }));

  return posts.filter((post) => {
    if (post.moderationStatus === "removed") return false;
    const haystack = [
      post.title,
      ...(post.tags ?? []),
      `${post.author?.firstName ?? ""} ${post.author?.lastName ?? ""}`,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/**
 * All post-interaction writes live here. Every operation is idempotent
 * where the user could double-submit (likes, views, bookmarks use
 * deterministic document IDs), and counters are updated atomically in
 * the same transaction or batch as the interaction document.
 */

export interface PostCounts {
  comments: number;
  likes: number;
  bookmarks: number;
  views: number;
}

/** Read counts from counters, falling back to legacy embedded arrays. */
export function getPostCounts(post: Post): PostCounts {
  return {
    comments: post.commentCount ?? post.comments?.length ?? 0,
    likes: post.likeCount ?? post.likes?.length ?? 0,
    bookmarks: post.bookmarkCount ?? post.bookmarks?.length ?? 0,
    views: post.viewCount ?? post.views?.length ?? 0,
  };
}

// Counters (likeCount/commentCount/viewCount/bookmarkCount) are owned by
// Cloud Functions triggered on these subcollection writes — see
// functions/src/index.ts. Clients write ONLY the interaction document;
// security rules block clients from writing the count fields, so counts
// can't be forged. (Until functions are deployed, counts stay stale but
// all interactions still work.)

/**
 * Like or unlike a post. Uses likes/{uid} as the document ID so a user
 * can never like twice. Returns true if the post is liked after the call.
 */
export async function toggleLike(
  postId: string,
  user: FirebaseUser
): Promise<boolean> {
  const likeRef = doc(db, "posts", postId, "likes", user.uid);

  return runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);

    if (likeSnap.exists()) {
      tx.delete(likeRef);
      return false;
    }

    tx.set(likeRef, {
      uid: user.uid,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
    });
    return true;
  });
}

/** Add a comment (counter maintained by Cloud Function). */
export async function addComment(
  postId: string,
  user: FirebaseUser,
  content: string
): Promise<void> {
  await addDoc(collection(db, "posts", postId, "comments"), {
    userId: user.uid,
    displayName: user.displayName ?? "",
    photoURL: user.photoURL ?? "",
    content,
    createdAt: serverTimestamp(),
  });
}

/**
 * Record a unique view. views/{uid} as the doc ID makes this naturally
 * idempotent; only the first view creates the doc (counter via Function).
 */
export async function recordView(
  postId: string,
  uid: string
): Promise<void> {
  const viewRef = doc(db, "posts", postId, "views", uid);
  const viewSnap = await getDoc(viewRef);
  if (viewSnap.exists()) return;
  await setDoc(viewRef, { uid, createdAt: serverTimestamp() });
}

/**
 * Bookmark or un-bookmark a post. bookmarks/{uid_postId} keeps one
 * bookmark per user per post (counter via Function). Returns true if
 * bookmarked after the call.
 */
export async function toggleBookmark(
  postId: string,
  uid: string,
  currentlyBookmarked: boolean
): Promise<boolean> {
  const bookmarkRef = doc(db, "bookmarks", `${uid}_${postId}`);

  if (currentlyBookmarked) {
    await deleteDoc(bookmarkRef);
  } else {
    await setDoc(bookmarkRef, {
      userId: uid,
      postId,
      createdAt: serverTimestamp(),
    });
  }

  return !currentlyBookmarked;
}

/** Count a details-expand interaction (not unique per user). */
export async function incrementExpands(postId: string): Promise<void> {
  await updateDoc(doc(db, "posts", postId), { expands: increment(1) });
}

/**
 * Fetch the posts referenced by a user's bookmarks. Firestore limits
 * documentId() "in" queries to 10 ids per query, so fetch in chunks.
 * Bookmarks whose post has been deleted are silently skipped.
 */
export async function fetchPostsByIds(postIds: string[]): Promise<Post[]> {
  const posts: Post[] = [];

  for (let i = 0; i < postIds.length; i += 10) {
    const chunk = postIds.slice(i, i + 10);
    const snapshot = await getDocs(
      query(collection(db, "posts"), where(documentId(), "in", chunk))
    );
    snapshot.forEach((docSnap) => {
      posts.push({ ...(docSnap.data() as Omit<Post, "id">), id: docSnap.id });
    });
  }

  // Preserve the order of the caller's bookmark list.
  const order = new Map(postIds.map((id, index) => [id, index]));
  return posts.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}

/**
 * Delete a post. Also removes the deleting user's own bookmark entry if
 * present. NOTE: other users' bookmark documents and the interaction
 * subcollections are cleaned up by the scheduled orphan-cleanup job
 * (see docs/DATA_MODEL.md) — clients cannot delete other users' data.
 */
export async function deletePost(postId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId));
  try {
    await deleteDoc(doc(db, "bookmarks", `${uid}_${postId}`));
  } catch {
    // Best effort — post deletion already succeeded.
  }
}
