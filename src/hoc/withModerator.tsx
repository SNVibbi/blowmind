import { useAuthContext } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect } from "react";
import { LoadingState } from "@/components/states/StateViews";

/**
 * Gate a page to moderators/admins. Client-side gating is convenience
 * only — the real enforcement is in firestore.rules (custom claims), so a
 * non-moderator who bypasses this simply gets permission-denied on every
 * moderator action.
 */
const withModerator = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const Guarded = (props: P) => {
    const { user, authIsReady } = useAuthContext();
    const { isModerator, ready } = useRole();
    const router = useRouter();

    useEffect(() => {
      if (authIsReady && !user) {
        router.replace({ pathname: "/login", query: { redirect: router.asPath } });
      }
    }, [authIsReady, user, router]);

    if (!authIsReady || !ready) {
      return <LoadingState label="Checking your access…" />;
    }

    if (!user) return null;

    if (!isModerator) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
          <i className="fas fa-lock text-4xl text-gray-400" aria-hidden="true"></i>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Moderators only
          </h1>
          <p className="max-w-md text-gray-600 dark:text-gray-400">
            You don&apos;t have access to this page.
          </p>
          <Link href="/blog" className="btn-primary">
            Back to feed
          </Link>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  Guarded.displayName = `withModerator(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return Guarded;
};

export default withModerator;
