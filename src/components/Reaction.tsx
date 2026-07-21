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
  const [pop, setPop] = useState(false);

  const counts = getPostCounts(post);

  const handleLike = async () => {
    if (!user) {
      toast.info("Log in to like posts.");
      return;
    }
    if (isPending) return;
    setPop(true);
    setTimeout(() => setPop(false), 250);
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
    <div className="flex items-center gap-1">
      <button
        onClick={handleLike}
        disabled={isPending}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        className={`engage ${liked ? "text-red-600 dark:text-red-400" : ""}`}
      >
        <i
          className={`${liked ? "fas" : "far"} fa-heart transition-transform ${
            pop ? "scale-125" : ""
          }`}
          aria-hidden="true"
        ></i>
        <span>{counts.likes}</span>
      </button>

      <Link
        href={`/posts/${post.id}`}
        className="engage"
        aria-label={`${counts.comments} comments`}
      >
        <i className="far fa-comment" aria-hidden="true"></i>
        <span>{counts.comments}</span>
      </Link>

      <span className="engage cursor-default hover:bg-transparent hover:text-gray-500">
        <i className="far fa-eye" aria-hidden="true"></i>
        <span>{counts.views}</span>
      </span>
    </div>
  );
};

export default Reaction;
