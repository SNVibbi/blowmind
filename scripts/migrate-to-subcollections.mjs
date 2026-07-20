/**
 * Stage 4 migration: move embedded interaction arrays out of post
 * documents into subcollections, and set denormalized counters.
 *
 *   posts/{id}.comments[]  -> posts/{id}/comments/{autoId} + commentCount
 *   posts/{id}.likes[]     -> posts/{id}/likes/{uid}       + likeCount
 *   posts/{id}.views[]     -> posts/{id}/views/{uid}       + viewCount
 *   posts/{id}.bookmarks[] -> bookmarks/{uid_postId}       + bookmarkCount
 *
 * The legacy top-level bookmarks collection (full post copies) is
 * replaced by slim {userId, postId, createdAt} documents keyed
 * {uid}_{postId}; old-format bookmark docs are deleted.
 *
 * Idempotent: posts already carrying `migratedAt` are skipped.
 *
 * SAFETY
 * - Run against the EMULATOR first:
 *     firebase emulators:start --only firestore
 *     FIRESTORE_EMULATOR_HOST=localhost:8080 GOOGLE_CLOUD_PROJECT=demo-blowmind node scripts/migrate-to-subcollections.mjs
 * - Running against PRODUCTION requires a service-account key and the
 *   project owner's explicit go-ahead. Take a Firestore export/backup
 *   first (gcloud firestore export). Then:
 *     GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json GOOGLE_CLOUD_PROJECT=<project-id> node scripts/migrate-to-subcollections.mjs
 * - Pass --dry-run to report what would change without writing.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const DRY_RUN = process.argv.includes("--dry-run");

initializeApp({
  credential: process.env.FIRESTORE_EMULATOR_HOST
    ? undefined
    : applicationDefault(),
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const db = getFirestore();

function toTimestamp(value) {
  if (!value) return Timestamp.now();
  if (value instanceof Timestamp) return value;
  if (typeof value.seconds === "number") {
    return new Timestamp(value.seconds, value.nanoseconds ?? 0);
  }
  return Timestamp.now();
}

async function migratePost(postDoc) {
  const post = postDoc.data();

  if (post.migratedAt) {
    return { id: postDoc.id, skipped: true };
  }

  const comments = Array.isArray(post.comments) ? post.comments : [];
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const views = Array.isArray(post.views) ? post.views : [];
  const bookmarks = Array.isArray(post.bookmarks) ? post.bookmarks : [];

  const summary = {
    id: postDoc.id,
    comments: comments.length,
    likes: likes.length,
    views: views.length,
    bookmarks: bookmarks.length,
  };

  if (DRY_RUN) return summary;

  const batch = db.batch();

  for (const comment of comments) {
    const ref = postDoc.ref.collection("comments").doc();
    batch.set(ref, {
      userId: comment.userId ?? "",
      displayName: comment.displayName ?? "",
      photoURL: comment.photoURL ?? "",
      content: typeof comment.content === "string" ? comment.content : "",
      createdAt: toTimestamp(comment.createdAt),
    });
  }

  const seenLikes = new Set();
  for (const like of likes) {
    if (!like.uid || seenLikes.has(like.uid)) continue;
    seenLikes.add(like.uid);
    batch.set(postDoc.ref.collection("likes").doc(like.uid), {
      uid: like.uid,
      displayName: like.displayName ?? "",
      photoURL: like.photoURL ?? "",
      createdAt: toTimestamp(like.createdAt),
    });
  }

  const seenViews = new Set();
  for (const view of views) {
    if (!view.uid || seenViews.has(view.uid)) continue;
    seenViews.add(view.uid);
    batch.set(postDoc.ref.collection("views").doc(view.uid), {
      uid: view.uid,
      createdAt: Timestamp.now(),
    });
  }

  const seenBookmarks = new Set();
  for (const bookmark of bookmarks) {
    if (!bookmark.userId || seenBookmarks.has(bookmark.userId)) continue;
    seenBookmarks.add(bookmark.userId);
    batch.set(db.doc(`bookmarks/${bookmark.userId}_${postDoc.id}`), {
      userId: bookmark.userId,
      postId: postDoc.id,
      createdAt: Timestamp.now(),
    });
  }

  batch.update(postDoc.ref, {
    commentCount: comments.length,
    likeCount: seenLikes.size,
    viewCount: seenViews.size,
    bookmarkCount: seenBookmarks.size,
    expands: typeof post.expands === "number" ? post.expands : (post.expand ?? 0),
    comments: FieldValue.delete(),
    likes: FieldValue.delete(),
    views: FieldValue.delete(),
    bookmarks: FieldValue.delete(),
    expand: FieldValue.delete(),
    migratedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return summary;
}

async function deleteLegacyBookmarkDocs() {
  // Old bookmark docs were full post copies with random IDs; new docs
  // are slim and keyed {uid}_{postId}. Remove any doc missing postId or
  // whose ID doesn't match the convention.
  const snapshot = await db.collection("bookmarks").get();
  let removed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const expectedId = `${data.userId}_${data.postId}`;
    const isLegacy = !data.postId || docSnap.id !== expectedId;
    if (isLegacy) {
      if (!DRY_RUN) await docSnap.ref.delete();
      removed += 1;
    }
  }

  return removed;
}

const postsSnapshot = await db.collection("posts").get();
console.log(
  `${DRY_RUN ? "[DRY RUN] " : ""}Migrating ${postsSnapshot.size} posts…`
);

let migrated = 0;
let skipped = 0;

for (const postDoc of postsSnapshot.docs) {
  const result = await migratePost(postDoc);
  if (result.skipped) {
    skipped += 1;
  } else {
    migrated += 1;
    console.log(
      `  ${result.id}: ${result.comments} comments, ${result.likes} likes, ` +
        `${result.views} views, ${result.bookmarks} bookmarks`
    );
  }
}

const legacyBookmarks = await deleteLegacyBookmarkDocs();

console.log(
  `${DRY_RUN ? "[DRY RUN] " : ""}Done. ${migrated} migrated, ${skipped} already migrated, ` +
    `${legacyBookmarks} legacy bookmark docs ${DRY_RUN ? "would be " : ""}removed.`
);
