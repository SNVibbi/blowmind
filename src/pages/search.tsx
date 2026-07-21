import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import BlogNavbar from "../components/BlogNavbar";
import Footer from "../components/Footer";
import Searchbar from "../components/Searchbar";
import PostList from "../components/PostList";
import { searchPosts } from "../lib/postService";
import { Post } from "../Types";
import { getErrorMessage } from "../lib/errors";
import { EmptyState, ErrorState, LoadingState } from "../components/states/StateViews";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function SearchPage() {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q : "";

  const [results, setResults] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screenWidth, setScreenWidth] = useState(1024);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setResults(null);
    setError(null);
    searchPosts(q)
      .then((r) => !cancelled && setResults(r))
      .catch((err) => !cancelled && setError(getErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <>
      <Head>
        <title>{q ? `Search: ${q} · BlowMind` : "Search · BlowMind"}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BlogNavbar
          screenWidth={screenWidth}
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
        />

        <div className="mx-auto max-w-3xl px-4 py-6">
          <Searchbar setMobileMenu={setMobileMenu} initialTerm={q} />

          {q.trim() ? (
            <>
              <h1 className="mb-4 mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Results for{" "}
                <span className="text-brand-600 dark:text-brand-400">
                  &ldquo;{q}&rdquo;
                </span>
                {results ? (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {results.length} found
                  </span>
                ) : null}
              </h1>

              {error && <ErrorState message={error} />}
              {!results && !error && <LoadingState label="Searching…" />}
              {results && results.length === 0 && !error && (
                <EmptyState
                  icon="magnifying-glass"
                  title="No matches"
                  message="Try a different keyword, tag, or author name."
                />
              )}
              {results && results.length > 0 && (
                <PostList posts={results} msg="" />
              )}
            </>
          ) : (
            <EmptyState
              icon="magnifying-glass"
              title="Search BlowMind"
              message="Find posts by title, tag, or author."
            />
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
