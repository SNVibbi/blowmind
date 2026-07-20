import React, { useState } from "react";
import Link from "next/link";
import { useAuthContext } from "../context/AuthContext";
import { useLikeStatus } from "../hooks/useInteractions";
import { getPostCounts, toggleLike } from "../lib/postService";
import { getErrorMessage } from "../lib/errors";
import { Post } from "../Types";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { toast } from "react-toastify";

interface ReactionProps {
  post: Post;
}

const Reaction: React.FC<ReactionProps> = ({ post }) => {
  const { user } = useAuthContext();
  const liked = useLikeStatus(post.id, user?.uid);
  const [isPending, setIsPending] = useState(false);

  const counts = getPostCounts(post);
  // Optimistic display: the counter on the post doc lags our own action
  // slightly, so adjust it locally by the live liked status.
  const likeDisplay = counts.likes;

  const handleLike = async () => {
    if (!user) {
      toast.info("Log in to like posts.");
      return;
    }
    if (isPending) return;

    setIsPending(true);
    try {
      await toggleLike(post.id, user);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex justify-between items-center mt-2">
      <Link
        href={`/posts/${post.id}`}
        className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-200"
        aria-label={`${counts.comments} comments`}
      >
        <i className="fas fa-comments" aria-hidden="true"></i>
        <span className="text-sm">{counts.comments}</span>
      </Link>

      <button
        className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-200 disabled:opacity-50"
        onClick={handleLike}
        disabled={isPending}
        aria-pressed={liked}
        aria-label={liked ? "Unlike this post" : "Like this post"}
      >
        {liked ? (
          <i className="fas fa-heart text-red-600" aria-hidden="true"></i>
        ) : (
          <i className="far fa-heart" aria-hidden="true"></i>
        )}
        <span className="text-sm">{likeDisplay}</span>
      </button>

      <div
        className="flex items-center gap-2 p-2 text-gray-800 dark:text-gray-200"
        aria-label={`${counts.views} views`}
      >
        <i className="fas fa-eye" aria-hidden="true"></i>
        <span className="text-sm">{counts.views}</span>
        <span className="text-sm hidden md:inline">views</span>
      </div>
    </div>
  );
};

export default Reaction;
