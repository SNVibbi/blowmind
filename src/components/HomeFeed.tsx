import BlogNavbar from "@/components/BlogNavbar";
import Aside from "./Aside";
import Interest from "../pages/interest";
import PostList from "./PostList";
import { useAuthContext } from "../context/AuthContext";
import { useDocument } from "../hooks/useDocument";
import { usePaginatedPosts } from "../hooks/usePaginatedPosts";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState } from "react";
import Footer from "./Footer";
import Searchbar from "@/components/Searchbar";
import { LoadingState, ErrorState } from "./states/StateViews";

type swProps = {
  sw: number;
};

const Home: React.FC<swProps> = ({ sw }) => {
  const { user } = useAuthContext();
  const router = useRouter();
  const {
    posts,
    error: postError,
    isPending: postPending,
    hasMore,
    loadMore,
  } = usePaginatedPosts();

  const { document: currentUser } = useDocument<{ interests: string[] }>(
    "users",
    user?.uid
  );

  const [mobileMenu, setMobileMenu] = useState(false);
  const wide = sw > 1050;

  const handleWrite = () => {
    if (user) router.push("/create-post");
    else router.push({ pathname: "/login", query: { redirect: "/create-post" } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BlogNavbar
        screenWidth={sw}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />
      <Searchbar setMobileMenu={setMobileMenu} />

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <main className="min-w-0 flex-1">
          {/* Signed-out call to action */}
          {!user && (
            <div className="card mb-6 flex flex-col items-start justify-between gap-3 bg-gradient-to-br from-brand-600 to-accent-500 text-white sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">Join the conversation</h2>
                <p className="text-sm text-white/90">
                  Sign in to like, comment, bookmark, and write your own posts.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/login" className="btn bg-white/15 text-white hover:bg-white/25">
                  Log in
                </Link>
                <Link href="/signup" className="btn bg-white text-brand-700 hover:bg-white/90">
                  Sign up
                </Link>
              </div>
            </div>
          )}

          {/* Interest picker for signed-in users who haven't chosen yet */}
          {user && currentUser && (currentUser.interests ?? []).length === 0 && (
            <Interest />
          )}

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Feed
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The latest from the community
              </p>
            </div>
            <button onClick={handleWrite} className="btn-primary">
              <i className="fas fa-pencil-alt" aria-hidden="true"></i>
              <span className="hidden sm:inline">Write a post</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>

          {postError && <ErrorState message={postError} />}
          {postPending && !posts && <LoadingState label="Loading the feed…" />}

          {posts && (
            <>
              <PostList posts={posts} msg="No posts yet — be the first to write one!" />
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={postPending}
                    className="btn-secondary"
                  >
                    {postPending ? "Loading…" : "Load more posts"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {wide && user && (
          <div className="w-72 shrink-0">
            <Aside />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Home;
