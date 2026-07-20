import React from "react";

/**
 * Shared, accessible presentational states so loading / empty / error
 * look consistent everywhere instead of ad-hoc one-liners.
 */

interface EmptyStateProps {
  icon?: string;
  /** Optional illustration path (from /public); overrides the icon. */
  image?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "inbox",
  image,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      {image ? (
        // Plain <img>: decorative local SVG, no next/image optimizer needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" width={200} height={150} className="mb-1 opacity-90" />
      ) : (
        <i
          className={`fas fa-${icon} text-4xl text-gray-400 dark:text-gray-500`}
          aria-hidden="true"
        ></i>
      )}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
      {message && (
        <p className="max-w-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
    >
      <i
        className="fas fa-triangle-exclamation text-4xl text-red-500"
        aria-hidden="true"
      ></i>
      <p className="max-w-sm text-gray-700 dark:text-gray-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-12"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
