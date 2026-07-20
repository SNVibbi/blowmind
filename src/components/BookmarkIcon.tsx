import { toast } from "react-toastify";
import { useAuthContext } from "../context/AuthContext";
import { useBookmarkStatus } from "../hooks/useInteractions";
import { toggleBookmark } from "../lib/postService";
import { getErrorMessage } from "../lib/errors";
import { BookmarkIconProps } from "../Types";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function BookmarkIcon({ post }: BookmarkIconProps) {
  const { user } = useAuthContext();
  const bookmarked = useBookmarkStatus(post.id, user?.uid);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast.info("Log in to bookmark posts.");
      return;
    }
    if (isPending) return;

    setIsPending(true);
    try {
      const nowBookmarked = await toggleBookmark(post.id, user.uid, bookmarked);
      toast.success(
        nowBookmarked ? "Added to your bookmarks." : "Removed from your bookmarks."
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
    >
      {bookmarked ? (
        <i className="fas fa-bookmark text-indigo-600" aria-hidden="true"></i>
      ) : (
        <i
          className="far fa-bookmark text-gray-600 dark:text-gray-400"
          aria-hidden="true"
        ></i>
      )}
    </button>
  );
}
