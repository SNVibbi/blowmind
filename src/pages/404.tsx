import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Page not found
      </h1>
      <p className="max-w-md text-gray-600 dark:text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/blog"
        className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
      >
        Back to the feed
      </Link>
    </div>
  );
}
