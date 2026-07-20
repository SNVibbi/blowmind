import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

/**
 * Route-protection HOC. Wrap any page that requires a signed-in user:
 *
 *   export default withAuth(ProfilePage);
 *
 * Waits for Firebase auth to initialize (no redirect flicker), then
 * sends signed-out visitors to /login carrying the current path so
 * useLogin can send them back after they sign in.
 */
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthenticatedComponent = (props: P) => {
    const { user, authIsReady } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      if (authIsReady && !user) {
        router.replace({
          pathname: "/login",
          query: { redirect: router.asPath },
        });
      }
    }, [user, authIsReady, router]);

    if (!authIsReady) {
      return (
        <div
          className="flex min-h-screen items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Checking your session…</span>
          <div
            aria-hidden="true"
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-custom-blue"
          />
        </div>
      );
    }

    if (!user) {
      // Redirect effect above is in flight; render nothing meanwhile.
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthenticatedComponent;
};

export default withAuth;
