import { db } from "../utils/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  doc,
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
}
