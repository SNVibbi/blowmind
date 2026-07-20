import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import withModerator from "@/hoc/withModerator";
import { useAuthContext } from "@/context/AuthContext";
import {
  fetchOpenReports,
  resolveReport,
  setPostModeration,
  REPORT_REASON_LABELS,
  Report,
} from "@/lib/moderationService";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/StateViews";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

function ModerationQueue() {
  const { user } = useAuthContext();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setReports(await fetchOpenReports());
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (report: Report, fn: () => Promise<void>) => {
    if (!user || busyId) return;
    setBusyId(report.id);
    try {
      await fn();
      setReports((prev) => prev?.filter((r) => r.id !== report.id) ?? null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = (report: Report) =>
    act(report, async () => {
      await setPostModeration(report.postId, user!.uid, "removed");
      await resolveReport(report.id, user!.uid, "resolved", "content-removed");
      toast.success("Post removed and report resolved.");
    });

  const handleDismiss = (report: Report) =>
    act(report, async () => {
      await resolveReport(report.id, user!.uid, "dismissed");
      toast.success("Report dismissed.");
    });

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Moderation queue
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Open reports, newest first.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" aria-label="Refresh queue">
          <i className="fas fa-rotate-right" aria-hidden="true"></i>
          Refresh
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={load} />}
      {!reports && !error && <LoadingState label="Loading reports…" />}
      {reports?.length === 0 && (
        <EmptyState
          icon="circle-check"
          title="All clear"
          message="There are no open reports right now."
        />
      )}

      <ul className="space-y-4">
        {reports?.map((report) => (
          <li key={report.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {REPORT_REASON_LABELS[report.reason] ?? report.reason}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {report.targetType}
              </span>
            </div>

            {report.details && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                “{report.details}”
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link
                href={`/posts/${report.postId}`}
                className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                target="_blank"
              >
                View reported post
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => handleRemove(report)}
                disabled={busyId === report.id}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                {busyId === report.id ? "Working…" : "Remove post"}
              </button>
              <button
                onClick={() => handleDismiss(report)}
                disabled={busyId === report.id}
                className="btn-secondary"
              >
                Dismiss report
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default withModerator(ModerationQueue);
