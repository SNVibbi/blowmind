import { FirebaseError } from "firebase/app";

export type ErrorCategory =
  | "auth"
  | "permission"
  | "network"
  | "validation"
  | "storage"
  | "database"
  | "unknown";

export interface AppError {
  category: ErrorCategory;
  /** Firebase error code when available, e.g. "auth/invalid-credential" */
  code: string | null;
  /** Safe, user-facing message. Never contains internal details. */
  message: string;
}

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/user-not-found": "Incorrect email or password. Please try again.",
  "auth/wrong-password": "Incorrect email or password. Please try again.",
  "auth/email-already-in-use":
    "An account with this email already exists. Try logging in instead.",
  "auth/invalid-email": "That email address doesn't look valid.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/user-disabled":
    "This account has been disabled. Contact support if you think this is a mistake.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed":
    "Network problem. Check your connection and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/cancelled-popup-request": "The sign-in window was closed before finishing.",
  "auth/requires-recent-login":
    "For security, please log in again before doing that.",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied": "You don't have permission to do that.",
  unauthenticated: "Please log in to do that.",
  unavailable:
    "We couldn't reach the server. Check your connection and try again.",
  "deadline-exceeded": "That took too long. Please try again.",
  "not-found": "That content no longer exists.",
  "resource-exhausted": "We're a bit busy right now. Please try again shortly.",
  "failed-precondition": "That action can't be completed right now.",
  aborted: "That didn't go through. Please try again.",
};

const STORAGE_MESSAGES: Record<string, string> = {
  "storage/unauthorized": "You don't have permission to upload this file.",
  "storage/canceled": "The upload was cancelled.",
  "storage/quota-exceeded": "Upload storage is full. Please try again later.",
  "storage/retry-limit-exceeded":
    "The upload kept failing. Check your connection and try again.",
  "storage/object-not-found": "That file no longer exists.",
  "storage/invalid-format": "That file type isn't supported.",
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

function categorize(code: string): ErrorCategory {
  if (code.startsWith("auth/")) return "auth";
  if (code.startsWith("storage/")) return "storage";
  if (code === "permission-denied" || code === "unauthenticated")
    return "permission";
  if (code === "unavailable" || code === "deadline-exceeded") return "network";
  return "database";
}

/**
 * Convert any thrown value into a typed AppError with a message that is
 * safe to show to users. Raw Firebase/internal messages are never exposed.
 */
export function getAppError(err: unknown): AppError {
  if (err instanceof FirebaseError) {
    const message =
      AUTH_MESSAGES[err.code] ??
      FIRESTORE_MESSAGES[err.code] ??
      STORAGE_MESSAGES[err.code] ??
      DEFAULT_MESSAGE;
    return { category: categorize(err.code), code: err.code, message };
  }

  if (err instanceof Error && err.name === "ValidationError") {
    // Our own validation errors carry user-safe messages by construction.
    return { category: "validation", code: null, message: err.message };
  }

  return { category: "unknown", code: null, message: DEFAULT_MESSAGE };
}

/** Shorthand: user-safe message for any thrown value. */
export function getErrorMessage(err: unknown): string {
  return getAppError(err).message;
}

/** Error type for input validation with a message meant for users. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
