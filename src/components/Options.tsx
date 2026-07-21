import React, { useState } from "react";
import Link from "next/link";
import Confirm from "./Confirm";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Post } from "@/Types";

interface OptionProps {
  post: Post;
}

const Options: React.FC<OptionProps> = ({ post }) => {
  const [isConfirm, setIsConfirm] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/posts/${post.id}/edit`}
        className="engage"
        aria-label="Edit post"
        title="Edit post"
      >
        <i className="fas fa-pen" aria-hidden="true"></i>
      </Link>
      <button
        className="engage hover:text-red-600"
        onClick={() => setIsConfirm(true)}
        aria-label="Delete post"
        title="Delete post"
      >
        <i className="fas fa-trash" aria-hidden="true"></i>
      </button>

      {isConfirm && (
        <Confirm
          title="Delete post"
          type="delete"
          item="post"
          setIsConfirm={setIsConfirm}
          post={post}
        />
      )}
    </div>
  );
};

export default Options;
