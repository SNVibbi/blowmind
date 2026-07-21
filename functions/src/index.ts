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
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { detectSpam, contentHash } from "./spam.js";

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

// ---- Rate limiting ---------------------------------------------------
// Server-enforced sliding-window limits per user. Clients can't bypass
// them (Admin SDK), and without functions deployed there is simply no
// limiting (graceful degradation). Tune limits here.
const RATE_LIMITS = {
  post: { limit: 5, windowMs: 60_000 }, // 5 posts / minute
  comment: { limit: 15, windowMs: 60_000 }, // 15 comments / minute
} as const;

type RateKind = keyof typeof RATE_LIMITS;

/**
 * Record one action of `kind` for `uid` in a rolling window and report
 * whether it exceeded the limit. Atomic via a transaction on
 * rateLimits/{uid}.
 */
async function recordAndCheckRate(
  uid: string,
  kind: RateKind
): Promise<boolean> {
  const { limit, windowMs } = RATE_LIMITS[kind];
  const ref = db.doc(`rateLimits/${uid}`);
  const now = Date.now();
  const startField = `${kind}_windowStart`;
  const countField = `${kind}_count`;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() ?? {} : {};
    const windowStart = (data[startField] as number) ?? 0;
    const count = (data[countField] as number) ?? 0;

    let nextStart = windowStart;
    let nextCount: number;
    if (now - windowStart > windowMs) {
      nextStart = now;
      nextCount = 1;
    } else {
      nextCount = count + 1;
    }

    tx.set(
      ref,
      { [startField]: nextStart, [countField]: nextCount },
      { merge: true }
    );
    return nextCount > limit;
  });
}

async function logRateEvent(
  uid: string,
  kind: RateKind,
  path: string
): Promise<void> {
  await db.collection("rateLimitEvents").add({
    uid,
    kind,
    path,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ---- Spam heuristics -------------------------------------------------
const DUPLICATE_WINDOW_MS = 10 * 60_000; // same content within 10 min = spam

async function logSpamEvent(
  uid: string,
  reason: string,
  path: string
): Promise<void> {
  await db.collection("spamEvents").add({
    uid,
    reason,
    path,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ---- Notifications ---------------------------------------------------
interface PostMeta {
  authorId?: string;
  title?: string;
}

async function getPostMeta(postId: string): Promise<PostMeta> {
  const snap = await db.doc(`posts/${postId}`).get();
  if (!snap.exists) return {};
  const data = snap.data() ?? {};
  return { authorId: data.author?.id ?? data.userId, title: data.title };
}

/** Write a notification into a recipient's subcollection. Never throws. */
async function notify(
  recipientUid: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await db.collection(`users/${recipientUid}/notifications`).add({
      ...payload,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("notify failed:", (err as Error).message);
  }
}

/**
 * Content-based spam check: stateless heuristics plus a stateful
 * duplicate-content check (same text reposted within a short window).
 * Returns a reason string if spammy, else null.
 */
async function checkContentSpam(
  uid: string,
  text: string
): Promise<string | null> {
  const stateless = detectSpam(text);
  if (stateless.spam) return stateless.reason;

  const hash = contentHash(text);
  const ref = db.doc(`rateLimits/${uid}`);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() ?? {} : {};
    const lastHash = data.lastContentHash as string | undefined;
    const lastAt = (data.lastContentAt as number) ?? 0;

    const isDuplicate = lastHash === hash && now - lastAt < DUPLICATE_WINDOW_MS;

    tx.set(
      ref,
      { lastContentHash: hash, lastContentAt: now },
      { merge: true }
    );
    return isDuplicate ? "duplicate-content" : null;
  });
}

// ---- Likes -----------------------------------------------------------
export const onLikeCreated = onDocumentCreated(
  "posts/{postId}/likes/{uid}",
  async (event) => {
    const { postId, uid } = event.params;
    await bumpPostCounter(postId, "likeCount", 1);

    const { authorId, title } = await getPostMeta(postId);
    if (authorId && authorId !== uid) {
      await notify(authorId, {
        type: "like",
        actorUid: uid,
        actorName: event.data?.get("displayName") || "Someone",
        actorPhoto: event.data?.get("photoURL") || "",
        postId,
        postTitle: title || "",
        text: "liked your post",
      });
    }
  }
);
export const onLikeDeleted = onDocumentDeleted(
  "posts/{postId}/likes/{uid}",
  (event) => bumpPostCounter(event.params.postId, "likeCount", -1)
);

// ---- Comments --------------------------------------------------------
export const onCommentCreated = onDocumentCreated(
  "posts/{postId}/comments/{commentId}",
  async (event) => {
    const { postId } = event.params;
    await bumpPostCounter(postId, "commentCount", 1);

    const uid = event.data?.get("userId");
    if (!uid) return;

    if (await recordAndCheckRate(uid, "comment")) {
      // Over the limit: remove the offending comment (its deletion
      // trigger will decrement the counter) and log the event.
      await event.data?.ref.delete();
      await logRateEvent(uid, "comment", event.data!.ref.path);
      return;
    }

    const spamReason = await checkContentSpam(uid, event.data?.get("content") ?? "");
    if (spamReason) {
      await event.data?.ref.delete();
      await logSpamEvent(uid, spamReason, event.data!.ref.path);
      return;
    }

    // Notify the post author (unless they commented on their own post).
    const { authorId, title } = await getPostMeta(postId);
    if (authorId && authorId !== uid) {
      await notify(authorId, {
        type: "comment",
        actorUid: uid,
        actorName: event.data?.get("displayName") || "Someone",
        actorPhoto: event.data?.get("photoURL") || "",
        postId,
        postTitle: title || "",
        text: "commented on your post",
      });
    }
  }
);
export const onCommentDeleted = onDocumentDeleted(
  "posts/{postId}/comments/{commentId}",
  (event) => bumpPostCounter(event.params.postId, "commentCount", -1)
);

// ---- Posts: rate limiting on creation --------------------------------
export const onPostCreated = onDocumentCreated("posts/{postId}", async (event) => {
  const uid = event.data?.get("userId");
  if (!uid) return;

  const softRemove = (by: string) =>
    event.data?.ref.update({
      moderationStatus: "removed",
      moderatedBy: by,
      moderatedAt: FieldValue.serverTimestamp(),
    });

  if (await recordAndCheckRate(uid, "post")) {
    await softRemove("system:rate-limit");
    await logRateEvent(uid, "post", event.data!.ref.path);
    return;
  }

  const text = `${event.data?.get("title") ?? ""} ${event.data?.get("content") ?? ""}`;
  const spamReason = await checkContentSpam(uid, text);
  if (spamReason) {
    await softRemove("system:spam");
    await logSpamEvent(uid, spamReason, event.data!.ref.path);
  }
});

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

// ---- Keep post author snapshots fresh --------------------------------
// Posts embed an author snapshot (name/photo/headline) for cheap reads.
// When a user edits their profile, refresh that snapshot on their posts.
// Guarded to only run when a display field actually changed (so the
// frequent online:true/false toggles on login/logout do NOT trigger the
// expensive fan-out).
export const onUserProfileUpdated = onDocumentUpdated(
  "users/{uid}",
  async (event) => {
    const before = event.data?.before.data() ?? {};
    const after = event.data?.after.data() ?? {};

    const displayFields = ["firstName", "lastName", "photoUrl", "headline"];
    const changed = displayFields.some((f) => before[f] !== after[f]);
    if (!changed) return;

    const uid = event.params.uid;
    const posts = await db
      .collection("posts")
      .where("author.id", "==", uid)
      .get();
    if (posts.empty) return;

    const writer = db.bulkWriter();
    posts.forEach((p) =>
      writer.update(p.ref, {
        "author.firstName": after.firstName ?? "",
        "author.lastName": after.lastName ?? "",
        "author.photoURL": after.photoUrl ?? "",
        "author.headline": after.headline ?? "",
      })
    );
    await writer.close();
    console.log(`Refreshed author snapshot on ${posts.size} post(s) for ${uid}.`);
  }
);

// ---- Scheduled: lift expired suspensions -----------------------------
// Rules already treat a suspension with a past `suspendedUntil` as
// inactive, so users regain access at expiry regardless. This job tidies
// the flag so the banner clears and records stay consistent.
export const liftExpiredSuspensions = onSchedule(
  "every 60 minutes",
  async () => {
    const now = Timestamp.now();
    const expired = await db
      .collection("users")
      .where("suspended", "==", true)
      .where("suspendedUntil", "<=", now)
      .get();

    if (expired.empty) return;

    const writer = db.bulkWriter();
    expired.forEach((d) =>
      writer.update(d.ref, {
        suspended: false,
        suspendedReason: "",
        suspendedBy: "",
        suspendedAt: FieldValue.serverTimestamp(),
      })
    );
    await writer.close();
    console.log(`Lifted ${expired.size} expired suspension(s).`);
  }
);

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
