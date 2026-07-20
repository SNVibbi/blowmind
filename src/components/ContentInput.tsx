import { useAuthContext } from "../context/AuthContext";
import { addComment } from "../lib/postService";
import { detectSpam } from "../lib/spam";
import { getErrorMessage } from "../lib/errors";
import { Post } from "../Types";
import { ChangeEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

const MAX_COMMENT_LENGTH = 2000;

interface ContentInputProps {
  post: Post;
}

export default function ContentInput({ post }: ContentInputProps) {
  const { user } = useAuthContext();
  const [newComment, setNewComment] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleCommentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast.info("Log in to comment.");
      return;
    }

    const content = newComment.trim();
    if (!content || isPending) return;
    if (content.length > MAX_COMMENT_LENGTH) {
      toast.error(
        `Comments are limited to ${MAX_COMMENT_LENGTH} characters.`
      );
      return;
    }

    const spam = detectSpam(content);
    if (spam.spam) {
      toast.error(spam.reason ?? "This looks like spam.");
      return;
    }

    setIsPending(true);
    try {
      await addComment(post.id, user, content);
      setNewComment("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  const handleCommentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
  };

  return (
    <div className="mt-4">
      <form className="flex items-center w-full" onSubmit={handleCommentSubmit}>
        <label htmlFor={`comment-${post.id}`} className="sr-only">
          Leave a comment
        </label>
        <input
          id={`comment-${post.id}`}
          type="text"
          placeholder="Leave a comment"
          required
          maxLength={MAX_COMMENT_LENGTH}
          onChange={handleCommentChange}
          value={newComment}
          className="flex-grow p-2 bg-gray-200 dark:bg-gray-700 rounded-full border-none outline-none w-full text-gray-800 dark:text-gray-200 transition-colors"
        />
        <button
          type="submit"
          disabled={isPending}
          className="ml-2 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50"
          aria-label="Submit comment"
        >
          <i className="fas fa-paper-plane" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  );
}
