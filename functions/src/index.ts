/**
 * BlowMind Cloud Functions.
 *
 * These make interaction counters server-authoritative: clients write only
 * the interaction documents (likes/comments/views/bookmarks); these
 * triggers own the denormalized counts on the post. Security rules block
 * clients from writing the count fields, so counts can't be forged.
 *
 * Also: cleanup of subcollections + orphaned bookmarks/reports when a post
 * is deleted, and an admin-only callable to manage moderator/admin roles.
 *
 * NOTE: counters only move once these are deployed. The app degrades
 * gracefully without them — likes/comments/bookmarks still work (they read
 * the interaction docs directly); only the displayed totals stay stale.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const db = getFirestore();

function bumpPostCounter(
  postId: string,
  field: string,
  delta: number
): Promise<FirebaseFirestore.WriteResult> {
  return db
    .doc(`posts/${postId}`)
    .update({ [field]: FieldValue.increment(delta) })
    .catch((err) => {
      // Post may have been deleted concurrently; that's fine.
      console.warn(`bumpPostCounter ${postId}.${field} skipped:`, err.message);
      return err;
    });
}

// ---- Likes -----------------------------------------------------------
export const onLikeCreated = onDocumentCreated(
  "posts/{postId}/likes/{uid}",
  (event) => bumpPostCounter(event.params.postId, "likeCount", 1)
);
export const onLikeDeleted = onDocumentDeleted(
  "posts/{postId}/likes/{uid}",
  (event) => bumpPostCounter(event.params.postId, "likeCount", -1)
);

// ---- Comments --------------------------------------------------------
export const onCommentCreated = onDocumentCreated(
  "posts/{postId}/comments/{commentId}",
  (event) => bumpPostCounter(event.params.postId, "commentCount", 1)
);
export const onCommentDeleted = onDocumentDeleted(
  "posts/{postId}/comments/{commentId}",
  (event) => bumpPostCounter(event.params.postId, "commentCount", -1)
);

// ---- Views (write-once) ----------------------------------------------
export const onViewCreated = onDocumentCreated(
  "posts/{postId}/views/{uid}",
  (event) => bumpPostCounter(event.params.postId, "viewCount", 1)
);

// ---- Bookmarks (top-level, doc holds postId) -------------------------
export const onBookmarkCreated = onDocumentCreated(
  "bookmarks/{bookmarkId}",
  (event) => {
    const postId = event.data?.get("postId");
    if (!postId) return;
    return bumpPostCounter(postId, "bookmarkCount", 1);
  }
);
export const onBookmarkDeleted = onDocumentDeleted(
  "bookmarks/{bookmarkId}",
  (event) => {
    const postId = event.data?.get("postId");
    if (!postId) return;
    return bumpPostCounter(postId, "bookmarkCount", -1);
  }
);

// ---- Post deletion cleanup -------------------------------------------
export const onPostDeleted = onDocumentDeleted("posts/{postId}", async (event) => {
  const { postId } = event.params;

  // Delete the (now-orphaned) interaction subcollections.
  await db.recursiveDelete(db.doc(`posts/${postId}`));

  // Remove bookmarks pointing at this post (any user).
  const bookmarks = await db
    .collection("bookmarks")
    .where("postId", "==", postId)
    .get();

  // Resolve open reports about this post.
  const reports = await db
    .collection("reports")
    .where("postId", "==", postId)
    .where("status", "==", "open")
    .get();

  const writer = db.bulkWriter();
  bookmarks.forEach((d) => writer.delete(d.ref));
  reports.forEach((d) =>
    writer.update(d.ref, {
      status: "resolved",
      resolution: "content-deleted",
      resolvedAt: FieldValue.serverTimestamp(),
    })
  );
  await writer.close();
});

// ---- Admin: manage roles (custom claims) -----------------------------
export const setUserRole = onCall(async (request) => {
  if (request.auth?.token.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Only admins can change roles."
    );
  }

  const { uid, role, value } = request.data as {
    uid?: string;
    role?: string;
    value?: boolean;
  };

  if (!uid || (role !== "moderator" && role !== "admin")) {
    throw new HttpsError(
      "invalid-argument",
      "Provide a uid and role ('moderator' | 'admin')."
    );
  }

  const auth = getAuth();
  const existing = (await auth.getUser(uid)).customClaims ?? {};
  await auth.setCustomUserClaims(uid, { ...existing, [role]: value === true });

  return { uid, role, value: value === true };
});
