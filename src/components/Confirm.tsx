import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { deletePost } from "../lib/postService";
import { getErrorMessage } from "../lib/errors";
import { Post } from "../Types";
import { toast } from "react-toastify";

interface ConfirmProps {
  title: string;
  item: string;
  type: string;
  setIsConfirm: (isConfirm: boolean) => void;
  post: Post;
}

export default function Confirm({
  title,
  item,
  type,
  setIsConfirm,
  post,
}: ConfirmProps) {
  const { user } = useAuthContext();
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    if (!user || isPending) return;

    setIsPending(true);
    try {
      await deletePost(post.id, user.uid);
      toast.success("Post deleted.");
      setIsConfirm(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 id="confirm-title" className="text-xl font-bold mb-4">
          {title}
        </h2>
        <p>
          Are you sure you want to {type} this {item}?
        </p>
        <p className="text-red-500 mt-2">You cannot undo this action.</p>
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center text-yellow-500">
            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <h4 className="ml-2 font-bold">Warning</h4>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Deleting this post will also remove it from your bookmarks and
            all references.
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setIsConfirm(false)}
            className="bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
