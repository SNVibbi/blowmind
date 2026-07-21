import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import withAuth from "../hoc/withAuth";
import BlogNavbar from "../components/BlogNavbar";
import Footer from "../components/Footer";
import Avatar from "../components/Avatar";
import { useNotifications } from "../hooks/useNotifications";
import { EmptyState } from "../components/states/StateViews";
import "@fortawesome/fontawesome-free/css/all.min.css";

function NotificationsPage() {
  const { items, unreadCount, markAllRead, markRead } = useNotifications();
  const [screenWidth, setScreenWidth] = useState(1024);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onResize = () => setScreenWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Mark everything read shortly after the page opens.
  useEffect(() => {
    const t = setTimeout(() => markAllRead(), 1200);
    return () => clearTimeout(t);
  }, [markAllRead]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BlogNavbar
        screenWidth={screenWidth}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-brand-600 hover:underline dark:text-brand-400">
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications yet"
            message="When people like or comment on your posts, you'll see it here."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/posts/${n.postId}`}
                  onClick={() => markRead(n.id)}
                  className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition-colors ${
                    n.read
                      ? "bg-white ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
                      : "bg-brand-50 ring-brand-100 dark:bg-brand-900/20 dark:ring-brand-900/40"
                  }`}
                >
                  <Avatar src={n.actorPhoto} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-semibold">{n.actorName}</span>{" "}
                      {n.text}
                      {n.postTitle ? (
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          · {n.postTitle}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-400">
                      <i
                        className={`fas ${n.type === "like" ? "fa-heart" : "fa-comment"} mr-1`}
                        aria-hidden="true"
                      ></i>
                      {n.createdAt
                        ? formatDistanceToNow(new Date(n.createdAt.seconds * 1000), {
                            addSuffix: true,
                          })
                        : "just now"}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" aria-label="unread" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default withAuth(NotificationsPage);
