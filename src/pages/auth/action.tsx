import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../../utils/firebaseConfig";
import { getErrorMessage } from "../../lib/errors";
import PublicHeader from "../../components/marketing/PublicHeader";
import Footer from "../../components/Footer";
import { LoadingState } from "../../components/states/StateViews";
import "@fortawesome/fontawesome-free/css/all.min.css";

/**
 * In-app handler for Firebase Auth email action links (password reset,
 * email verification). Set this URL as the custom action URL in the
 * Firebase console so links open here instead of the default hosted page.
 * Handles: ?mode=resetPassword|verifyEmail&oobCode=...
 */
type Phase = "verifying" | "reset-form" | "success" | "error";

function AuthAction() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [mode, setMode] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const oobCode =
    typeof router.query.oobCode === "string" ? router.query.oobCode : "";
  const actionMode =
    typeof router.query.mode === "string" ? router.query.mode : "";

  // Validate the code as soon as the query is available.
  useEffect(() => {
    if (!router.isReady) return;
    if (!oobCode || !actionMode) {
      setPhase("error");
      setError("This link is invalid or incomplete.");
      return;
    }
    setMode(actionMode);

    (async () => {
      try {
        if (actionMode === "resetPassword") {
          const mail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(mail);
          setPhase("reset-form");
        } else if (actionMode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          setMessage("Your email address has been verified. You can now log in.");
          setPhase("success");
        } else {
          setPhase("error");
          setError("Unsupported action.");
        }
      } catch (err: unknown) {
        setPhase("error");
        setError(
          `${getErrorMessage(err)} The link may have expired or already been used.`
        );
      }
    })();
  }, [router.isReady, oobCode, actionMode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage("Your password has been reset. You can now log in.");
      setPhase("success");
    } catch (err: unknown) {
      setError(
        `${getErrorMessage(err)} The link may have expired — request a new one.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Account action · BlowMind</title>
      </Head>
      <PublicHeader />
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-100 px-4 py-10 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          {phase === "verifying" && <LoadingState label="Verifying your link…" />}

          {phase === "reset-form" && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                Choose a new password
              </h1>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                for <strong>{email}</strong>
              </p>
              {error && (
                <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
                  {error}
                </p>
              )}
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label htmlFor="pw" className="mb-1 block text-sm font-medium">
                    New password
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600">
                    <input
                      id="pw"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="flex-grow bg-transparent outline-none text-gray-800 dark:text-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="ml-2 text-gray-500"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      <i className={showPw ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="pw2" className="mb-1 block text-sm font-medium">
                    Confirm password
                  </label>
                  <input
                    id="pw2"
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="input-field"
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </>
          )}

          {phase === "success" && (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40">
                <i className="fas fa-check text-xl" aria-hidden="true"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                All set
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
              <Link href="/login" className="btn-primary mt-6 inline-flex">
                Go to login
              </Link>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40">
                <i className="fas fa-triangle-exclamation text-xl" aria-hidden="true"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
              <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
                Request a new link
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AuthAction;
