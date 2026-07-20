import { db } from "../utils/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

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
