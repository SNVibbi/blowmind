import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches unexpected render errors so a single broken component can't
 * blank the whole app. Shows a safe recovery UI — never a stack trace.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Hook point for a monitoring service (Sentry, etc.). Log only in
    // development so we never leak internals to the production console.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Render error caught by ErrorBoundary:", error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="max-w-md text-gray-600 dark:text-gray-400">
            We hit an unexpected problem displaying this page. You can try
            again, or head back to the feed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Try again
            </button>
            {/* Intentional full reload: after a render crash we want a
                clean document, not a client-side transition. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/blog"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Go to feed
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
