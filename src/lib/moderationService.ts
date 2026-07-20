import { db } from "../utils/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";

/**
 * Community-safety writes. Reports are soft signals: creating a report
 * never deletes content — a moderator reviews the queue and decides.
 * See docs/MODERATION.md.
 */

export type ReportTargetType = "post" | "comment";

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "misinformation",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam or scam",
  harassment: "Harassment or bullying",
  hate: "Hate speech",
  violence: "Violence or threats",
  sexual: "Sexual or explicit content",
  misinformation: "False information",
  other: "Something else",
};

/**
 * File a report. The document ID is `{reporterUid}_{targetType}_{targetId}`
 * so a single user reporting the same item twice updates their existing
 * report instead of spamming the queue (idempotent).
 */
export async function reportContent(params: {
  reporter: FirebaseUser;
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  reason: ReportReason;
  details?: string;
}): Promise<void> {
  const { reporter, targetType, targetId, postId, reason, details } = params;
  const reportId = `${reporter.uid}_${targetType}_${targetId}`;

  await setDoc(doc(db, "reports", reportId), {
    reporterUid: reporter.uid,
    targetType,
    targetId,
    postId,
    reason,
    details: (details ?? "").slice(0, 1000),
    status: "open",
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------
// Moderator-only operations (also enforced by security rules + claims)
// ---------------------------------------------------------------------

export interface Report {
  id: string;
  reporterUid: string;
  targetType: ReportTargetType;
  targetId: string;
  postId: string;
  reason: ReportReason;
  details?: string;
  status: "open" | "resolved" | "dismissed";
  createdAt?: { seconds: number };
}

/** Fetch the newest open reports for the moderation queue. */
export async function fetchOpenReports(max = 50): Promise<Report[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "reports"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(max)
    )
  );
  return snapshot.docs.map((d) => ({
    ...(d.data() as Omit<Report, "id">),
    id: d.id,
  }));
}

/** Triage a report: mark resolved or dismissed. */
export async function resolveReport(
  reportId: string,
  moderatorUid: string,
  status: "resolved" | "dismissed",
  resolution?: string
): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    resolution: resolution ?? status,
    resolvedAt: serverTimestamp(),
    resolvedBy: moderatorUid,
  });
  await writeAudit(moderatorUid, `report-${status}`, "report", reportId);
}

/** Soft-remove or restore a post (hides it from the public via rules). */
export async function setPostModeration(
  postId: string,
  moderatorUid: string,
  status: "removed" | "ok"
): Promise<void> {
  await updateDoc(doc(db, "posts", postId), {
    moderationStatus: status,
    moderatedAt: serverTimestamp(),
    moderatedBy: moderatorUid,
  });
  await writeAudit(moderatorUid, `post-${status}`, "post", postId);
}

// ---------------------------------------------------------------------
// Suspension
// ---------------------------------------------------------------------

/** Suspend or reinstate a user (blocks their content creation via rules). */
export async function setSuspension(
  targetUid: string,
  moderatorUid: string,
  suspended: boolean,
  reason = ""
): Promise<void> {
  await updateDoc(doc(db, "users", targetUid), {
    suspended,
    suspendedReason: suspended ? reason.slice(0, 500) : "",
    suspendedBy: suspended ? moderatorUid : "",
    suspendedAt: serverTimestamp(),
  });
  await writeAudit(
    moderatorUid,
    suspended ? "user-suspended" : "user-reinstated",
    "user",
    targetUid,
    reason
  );
}

// ---------------------------------------------------------------------
// Appeals
// ---------------------------------------------------------------------

export interface Appeal {
  id: string;
  uid: string;
  message: string;
  status: "open" | "granted" | "denied";
  createdAt?: { seconds: number };
}

/** A suspended user submits (or replaces) their appeal. */
export async function submitAppeal(uid: string, message: string): Promise<void> {
  await setDoc(doc(db, "appeals", uid), {
    uid,
    message: message.slice(0, 2000),
    status: "open",
    createdAt: serverTimestamp(),
  });
}

/** A user's own appeal, if any. */
export async function fetchMyAppeal(uid: string): Promise<Appeal | null> {
  const snap = await getDoc(doc(db, "appeals", uid));
  return snap.exists() ? { ...(snap.data() as Omit<Appeal, "id">), id: snap.id } : null;
}

/** Open appeals for the moderation queue. */
export async function fetchOpenAppeals(max = 50): Promise<Appeal[]> {
  const snapshot = await getDocs(
    query(
      collection(db, "appeals"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(max)
    )
  );
  return snapshot.docs.map((d) => ({
    ...(d.data() as Omit<Appeal, "id">),
    id: d.id,
  }));
}

/** Moderator decision on an appeal (also reinstates the user if granted). */
export async function resolveAppeal(
  uid: string,
  moderatorUid: string,
  decision: "granted" | "denied"
): Promise<void> {
  await updateDoc(doc(db, "appeals", uid), {
    status: decision,
    resolvedAt: serverTimestamp(),
    resolvedBy: moderatorUid,
  });
  if (decision === "granted") {
    await setSuspension(uid, moderatorUid, false);
  }
  await writeAudit(moderatorUid, `appeal-${decision}`, "user", uid);
}

// ---------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  actorUid: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string;
  createdAt?: { seconds: number };
}

/** Append a moderator-action record. Never throws (audit is best-effort). */
export async function writeAudit(
  actorUid: string,
  action: string,
  targetType: string,
  targetId: string,
  note = ""
): Promise<void> {
  try {
    await addDoc(collection(db, "auditLog"), {
      actorUid,
      action,
      targetType,
      targetId,
      note: note.slice(0, 500),
      createdAt: serverTimestamp(),
    });
  } catch {
    /* audit logging must not break the underlying action */
  }
}

/** Recent audit entries for the moderation dashboard. */
export async function fetchAuditLog(max = 50): Promise<AuditEntry[]> {
  const snapshot = await getDocs(
    query(collection(db, "auditLog"), orderBy("createdAt", "desc"), limit(max))
  );
  return snapshot.docs.map((d) => ({
    ...(d.data() as Omit<AuditEntry, "id">),
    id: d.id,
  }));
}
