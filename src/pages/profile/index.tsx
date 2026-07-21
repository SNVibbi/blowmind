import Avatar from "../../components/Avatar";
import withAuth from "../../hoc/withAuth";
import BlogNavbar from "../../components/BlogNavbar";
import Footer from "../../components/Footer";
import PostList from "../../components/PostList";
import Link from "next/link";
import { useAuthContext } from "../../context/AuthContext";
import { usePaginatedPosts } from "../../hooks/usePaginatedPosts";
import { useBookmarkedPosts } from "../../hooks/useBookmarkedPosts";
import { useDocument } from "../../hooks/useDocument";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface UserDoc {
  firstName: string;
  lastName: string;
  interests?: string[];
  headline?: string;
  photoUrl?: string;
  photoURL?: string;
}

function Profile() {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const { error, document: profile } = useDocument<UserDoc>("users", userId);

  const [tab, setTab] = useState<"posts" | "bookmarks">("posts");
  const [screenWidth, setScreenWidth] = useState(1024);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { posts } = usePaginatedPosts(userId);
  const { posts: bookmarks } = useBookmarkedPosts(userId);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My BlowMind profile", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied!");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  if (error) {
    return <div className="p-6 text-red-600" role="alert">{error}</div>;
  }

  const photo = profile?.photoUrl || profile?.photoURL || user?.photoURL || null;
  const interests = profile?.interests ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BlogNavbar
        screenWidth={screenWidth}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Profile card */}
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
              <div className="mb-2 flex gap-2">
                <Link href="/profile/edit" className="btn-secondary">
                  <i className="fas fa-pen" aria-hidden="true"></i>
                  <span className="hidden sm:inline">Edit profile</span>
                </Link>
                <button onClick={handleShare} className="btn-primary">
                  <i className="fas fa-share-nodes" aria-hidden="true"></i>
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {profile?.firstName} {profile?.lastName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{(profile?.firstName ?? "user").toLowerCase()}
              {profile?.headline ? ` · ${profile.headline}` : ""}
            </p>

            {/* Stats */}
            <div className="mt-4 flex gap-6">
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {posts?.length ?? 0}
                </span>{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">Posts</span>
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {bookmarks?.length ?? 0}
                </span>{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">Bookmarks</span>
              </div>
            </div>

            {/* Interests */}
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

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {(["posts", "bookmarks"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "posts" ? (
            <PostList posts={posts} msg="Posts you write will appear here." />
          ) : (
            <PostList posts={bookmarks} msg="Posts you bookmark will appear here." />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default withAuth(Profile);
