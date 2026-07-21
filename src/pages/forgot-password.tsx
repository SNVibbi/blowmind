import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { getAppError } from "../lib/errors";
import PublicHeader from "../components/marketing/PublicHeader";
import Footer from "../components/Footer";
import "@fortawesome/fontawesome-free/css/all.min.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const appError = getAppError(err);
      // Don't reveal whether an account exists for this email.
      if (appError.code === "auth/user-not-found") {
        setSent(true);
      } else {
        setError(appError.message);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900 py-1">
        <div className="bg-gray-200 dark:bg-gray-800 shadow-lg rounded-lg p-8 mt-4 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
            Reset your password
          </h1>

          {sent ? (
            <div role="status" aria-live="polite">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If an account exists for <strong>{email}</strong>, a password
                reset link is on its way. Check your inbox (and spam folder).
              </p>
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enter the email you signed up with and we&apos;ll send you a
                link to reset your password.
              </p>

              {error && (
                <div className="text-red-600 mb-4" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center border-2 border-gray-300 dark:border-gray-700 rounded-lg mb-4 p-2">
                <label
                  htmlFor="email"
                  className="text-gray-600 dark:text-gray-400 mr-2"
                >
                  <i className="fas fa-envelope" aria-hidden="true"></i>
                  <span className="sr-only">Email address</span>
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  placeholder="Email Address"
                  className="flex-grow bg-transparent outline-none text-gray-800 dark:text-gray-200"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="bg-indigo-600 mb-4 text-white w-full py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Sending…" : "Send reset link"}
              </button>

              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
