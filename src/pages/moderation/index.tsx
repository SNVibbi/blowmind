import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import withModerator from "@/hoc/withModerator";
import { useAuthContext } from "@/context/AuthContext";
import {
  fetchOpenReports,
  resolveReport,
  setPostModeration,
  setSuspension,
  fetchOpenAppeals,
  resolveAppeal,
  fetchAuditLog,
  REPORT_REASON_LABELS,
  Report,
  Appeal,
  AuditEntry,
} from "@/lib/moderationService";
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getErrorMessage } from "@/lib/errors";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/StateViews";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

type Tab = "reports" | "appeals" | "audit";

function ModerationQueue() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<Tab>("reports");

  const [reports, setReports] = useState<Report[] | null>(null);
  const [appeals, setAppeals] = useState<Appeal[] | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (tab === "reports") setReports(await fetchOpenReports());
      if (tab === "appeals") setAppeals(await fetchOpenAppeals());
      if (tab === "audit") setAudit(await fetchAuditLog());
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id: string, fn: () => Promise<void>) => {
    if (!user || busyId) return;
    setBusyId(id);
    try {
      await fn();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  // ---- report actions ----
  const removePost = (r: Report) =>
    run(r.id, async () => {
      await setPostModeration(r.postId, user!.uid, "removed");
      await resolveReport(r.id, user!.uid, "resolved", "content-removed");
      setReports((p) => p?.filter((x) => x.id !== r.id) ?? null);
      toast.success("Post removed and report resolved.");
    });

  const suspendAuthor = (r: Report) =>
    run(r.id, async () => {
      const snap = await getDoc(doc(db, "posts", r.postId));
      const authorId = snap.exists()
        ? (snap.data().author?.id as string | undefined)
        : undefined;
      if (!authorId) {
        toast.error("Couldn't find the post's author.");
        return;
      }
      await setPostModeration(r.postId, user!.uid, "removed");
      // Default to a 7-day timed suspension.
      await setSuspension(authorId, user!.uid, true, "Repeated policy violations", 7);
      await resolveReport(r.id, user!.uid, "resolved", "author-suspended");
      setReports((p) => p?.filter((x) => x.id !== r.id) ?? null);
      toast.success("Post removed and author suspended for 7 days.");
    });

  const dismiss = (r: Report) =>
    run(r.id, async () => {
      await resolveReport(r.id, user!.uid, "dismissed");
      setReports((p) => p?.filter((x) => x.id !== r.id) ?? null);
      toast.success("Report dismissed.");
    });

  // ---- appeal actions ----
  const decideAppeal = (a: Appeal, decision: "granted" | "denied") =>
    run(a.id, async () => {
      await resolveAppeal(a.uid, user!.uid, decision);
      setAppeals((p) => p?.filter((x) => x.id !== a.id) ?? null);
      toast.success(
        decision === "granted" ? "Appeal granted; user reinstated." : "Appeal denied."
      );
    });

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "reports", label: "Reports", icon: "flag" },
    { id: "appeals", label: "Appeals", icon: "gavel" },
    { id: "audit", label: "Audit log", icon: "clipboard-list" },
  ];

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Moderation
        </h1>
        <button onClick={load} className="btn-secondary" aria-label="Refresh">
          <i className="fas fa-rotate-right" aria-hidden="true"></i> Refresh
        </button>
      </header>

      <div role="tablist" className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-b-2 border-brand-600 text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <i className={`fas fa-${t.icon} mr-1`} aria-hidden="true"></i>
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {/* Reports */}
      {tab === "reports" && (
        <>
          {!reports && !error && <LoadingState label="Loading reports…" />}
          {reports?.length === 0 && (
            <EmptyState icon="circle-check" title="All clear" message="No open reports." />
          )}
          <ul className="space-y-4">
            {reports?.map((r) => (
              <li key={r.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{r.targetType}</span>
                </div>
                {r.details && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">“{r.details}”</p>
                )}
                <Link
                  href={`/posts/${r.postId}`}
                  target="_blank"
                  className="mt-3 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400"
                >
                  View reported post
                </Link>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => removePost(r)} disabled={busyId === r.id} className="btn bg-red-600 text-white hover:bg-red-700">
                    Remove post
                  </button>
                  <button onClick={() => suspendAuthor(r)} disabled={busyId === r.id} className="btn bg-orange-600 text-white hover:bg-orange-700">
                    Remove &amp; suspend author
                  </button>
                  <button onClick={() => dismiss(r)} disabled={busyId === r.id} className="btn-secondary">
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Appeals */}
      {tab === "appeals" && (
        <>
          {!appeals && !error && <LoadingState label="Loading appeals…" />}
          {appeals?.length === 0 && (
            <EmptyState icon="gavel" title="No open appeals" message="Suspended users' appeals show up here." />
          )}
          <ul className="space-y-4">
            {appeals?.map((a) => (
              <li key={a.id} className="card">
                <p className="text-sm text-gray-700 dark:text-gray-300">“{a.message}”</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => decideAppeal(a, "granted")} disabled={busyId === a.id} className="btn bg-green-600 text-white hover:bg-green-700">
                    Grant &amp; reinstate
                  </button>
                  <button onClick={() => decideAppeal(a, "denied")} disabled={busyId === a.id} className="btn-secondary">
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Audit log */}
      {tab === "audit" && (
        <>
          {!audit && !error && <LoadingState label="Loading audit log…" />}
          {audit?.length === 0 && (
            <EmptyState icon="clipboard-list" title="No entries yet" message="Moderator actions are recorded here." />
          )}
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {audit?.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {e.action}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {e.targetType}:{e.targetId.slice(0, 8)}…
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {e.createdAt ? new Date(e.createdAt.seconds * 1000).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default withModerator(ModerationQueue);
