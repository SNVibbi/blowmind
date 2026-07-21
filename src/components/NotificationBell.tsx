import Link from "next/link";
import { useNotifications } from "../hooks/useNotifications";
import { useAuthContext } from "../context/AuthContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

/** Navbar bell with a live unread badge, linking to the notifications page. */
export default function NotificationBell() {
  const { user } = useAuthContext();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      title="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
    >
      <i className="fas fa-bell" aria-hidden="true"></i>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
