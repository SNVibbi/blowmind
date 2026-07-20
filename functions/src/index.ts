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
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
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
  async (event) => {
    const { postId } = event.params;
    await bumpPostCounter(postId, "commentCount", 1);

    const uid = event.data?.get("userId");
    if (uid && (await recordAndCheckRate(uid, "comment"))) {
      // Over the limit: remove the offending comment (its deletion
      // trigger will decrement the counter) and log the event.
      await event.data?.ref.delete();
      await logRateEvent(uid, "comment", event.data!.ref.path);
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
  if (await recordAndCheckRate(uid, "post")) {
    // Over the limit: soft-remove (reviewable) and log.
    await event.data?.ref.update({
      moderationStatus: "removed",
      moderatedBy: "system:rate-limit",
      moderatedAt: FieldValue.serverTimestamp(),
    });
    await logRateEvent(uid, "post", event.data!.ref.path);
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
