import { useCallback, useEffect, useState } from "react";
import withAuth from "../../hoc/withAuth";
import AppShell from "../../components/AppShell";
import { useAuthContext } from "../../context/AuthContext";
import { fetchBlocks, unblockUser, BlockEntry } from "../../lib/blockService";
import { normalizeUserProfile } from "../../lib/userService";
import { db } from "../../utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getErrorMessage } from "../../lib/errors";
import { EmptyState, ErrorState, LoadingState } from "../../components/states/StateViews";
import Avatar from "../../components/Avatar";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface BlockedRow extends BlockEntry {
  name: string;
  photoUrl: string;
}

function Settings() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<BlockedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const blocks = await fetchBlocks(user.uid);
      const withNames = await Promise.all(
        blocks.map(async (b) => {
          let name = "Unknown user";
          let photoUrl = "";
          try {
            const snap = await getDoc(doc(db, "users", b.targetUid));
            if (snap.exists()) {
              const p = normalizeUserProfile(snap.data());
              name = `${p.firstName} ${p.lastName}`.trim() || "Unknown user";
              photoUrl = p.photoUrl;
            }
          } catch {
            /* keep fallback name */
          }
          return { ...b, name, photoUrl };
        })
      );
      setRows(withNames);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (row: BlockedRow) => {
    if (!user || busyId) return;
    setBusyId(row.id);
    try {
      await unblockUser(user.uid, row.targetUid);
      setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null);
      toast.success(`Unblocked ${row.name}.`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h1>
      <p className="mb-6 text-gray-500 dark:text-gray-400">
        Manage the people you&apos;ve blocked or muted.
      </p>

      <section aria-labelledby="blocked-heading" className="card">
        <h2
          id="blocked-heading"
          className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Blocked &amp; muted
        </h2>

        {error && <ErrorState message={error} onRetry={load} />}
        {!rows && !error && <LoadingState label="Loading your list…" />}
        {rows?.length === 0 && (
          <EmptyState
            icon="user-group"
            title="No one blocked"
            message="People you block won't appear in your feed or comments."
          />
        )}

        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {rows?.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-3">
              <Avatar src={row.photoUrl || null} />
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {row.name}
                </p>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {row.type}
                </p>
              </div>
              <button
                onClick={() => handleUnblock(row)}
                disabled={busyId === row.id}
                className="btn-secondary"
              >
                {busyId === row.id ? "…" : "Unblock"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
    </AppShell>
  );
}

export default withAuth(Settings);
