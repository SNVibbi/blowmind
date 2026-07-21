import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import BlogNavbar from "../../components/BlogNavbar";
import Footer from "../../components/Footer";
import Avatar from "../../components/Avatar";
import PostList from "../../components/PostList";
import BlockButton from "../../components/BlockButton";
import { useAuthContext } from "../../context/AuthContext";
import { useDocument } from "../../hooks/useDocument";
import { usePaginatedPosts } from "../../hooks/usePaginatedPosts";
import { LoadingState } from "../../components/states/StateViews";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface UserDoc {
  firstName?: string;
  lastName?: string;
  headline?: string;
  photoUrl?: string;
  photoURL?: string;
  interests?: string[];
}

export default function UserProfile() {
  const router = useRouter();
  const { user } = useAuthContext();
  const uid = typeof router.query.uid === "string" ? router.query.uid : undefined;

  const [screenWidth, setScreenWidth] = useState(1024);
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If it's my own uid, send me to the editable /profile.
  useEffect(() => {
    if (uid && user?.uid === uid) router.replace("/profile");
  }, [uid, user, router]);

  const { document: profile } = useDocument<UserDoc>("users", uid);
  const { posts } = usePaginatedPosts(uid);

  // Prefer the users doc; fall back to the author snapshot on a post
  // (works even for signed-out visitors who can't read user docs).
  const fromPost = posts?.[0]?.author;
  const firstName = profile?.firstName ?? fromPost?.firstName ?? "";
  const lastName = profile?.lastName ?? fromPost?.lastName ?? "";
  const headline = profile?.headline ?? fromPost?.headline ?? "";
  const photo =
    profile?.photoUrl || profile?.photoURL || fromPost?.photoURL || null;
  const interests = profile?.interests ?? [];
  const name = `${firstName} ${lastName}`.trim() || "BlowMind user";

  if (!uid) return <LoadingState label="Loading…" />;

  return (
    <>
      <Head>
        <title>{`${name} · BlowMind`}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <BlogNavbar
          screenWidth={screenWidth}
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
        />

        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <div className="h-32 bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 sm:h-40" />
            <div className="px-5 pb-5 sm:px-8">
              <div className="-mt-12 flex items-end justify-between">
                <div className="avatar-ring">
                  <Avatar
                    src={photo}
                    className="h-24 w-24 border-4 border-white dark:border-gray-800"
                  />
                </div>
                {user && user.uid !== uid && (
                  <div className="mb-2">
                    <BlockButton targetUid={uid} targetName={firstName} className="btn-secondary" />
                  </div>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{(firstName || "user").toLowerCase()}
                {headline ? ` · ${headline}` : ""}
              </p>

              <div className="mt-4">
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {posts?.length ?? 0}
                </span>{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">Posts</span>
              </div>

              {interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {interests.map((i) => (
                    <span key={i} className="chip">
                      {i}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Posts by {firstName || "this user"}
          </h2>
          <PostList posts={posts} msg="This user hasn't posted yet." />
        </div>

        <Footer />
      </div>
    </>
  );
}
