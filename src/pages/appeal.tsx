import { useEffect, useState } from "react";
import Link from "next/link";
import withAuth from "../hoc/withAuth";
import AppShell from "../components/AppShell";
import { useAuthContext } from "../context/AuthContext";
import { submitAppeal, fetchMyAppeal, Appeal } from "../lib/moderationService";
import { getErrorMessage } from "../lib/errors";
import { LoadingState } from "../components/states/StateViews";
import { toast } from "react-toastify";

function AppealPage() {
  const { user } = useAuthContext();
  const [existing, setExisting] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyAppeal(user.uid)
      .then(setExisting)
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isPending || !message.trim()) return;
    setIsPending(true);
    try {
      await submitAppeal(user.uid, message.trim());
      toast.success("Your appeal has been submitted for review.");
      setExisting({
        id: user.uid,
        uid: user.uid,
        message: message.trim(),
        status: "open",
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppShell>
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Appeal a suspension
      </h1>
      <p className="mb-6 text-gray-500 dark:text-gray-400">
        Tell our moderators why your account should be reinstated.
      </p>

      {loading ? (
        <LoadingState label="Loading…" />
      ) : existing && existing.status === "open" ? (
        <div className="card" role="status">
          <p className="text-gray-800 dark:text-gray-200">
            <i className="fas fa-clock mr-2" aria-hidden="true"></i>
            Your appeal is <strong>under review</strong>. We&apos;ll update your
            account once a moderator responds.
          </p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            “{existing.message}”
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <label htmlFor="appeal-message" className="sr-only">
            Your appeal
          </label>
          <textarea
            id="appeal-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={6}
            required
            placeholder="Explain your appeal…"
            className="input-field"
          />
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-sm text-brand-600 hover:underline dark:text-brand-400"
            >
              Back to feed
            </Link>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Submitting…" : "Submit appeal"}
            </button>
          </div>
        </form>
      )}
    </main>
    </AppShell>
  );
}

export default withAuth(AppealPage);
