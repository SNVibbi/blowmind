import Avatar from "../components/Avatar";
import BookmarkIcon from "../components/BookmarkIcon";
import ContentInput from "../components/ContentInput";
import ReportButton from "../components/ReportButton";
import Reaction from "../components/Reaction";
import { useAuthContext } from "@/context/AuthContext";
import { useReadTime } from "../hooks/useReadTime";
import { Post } from "../Types";
import { sanitizeHtml } from "../lib/sanitize";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PostDetailsProps {
  post: Post;
}

const PostDetails: React.FC<PostDetailsProps> = ({ post }) => {
  const { user } = useAuthContext();
  const { calculateReadingTime } = useReadTime();

  return (
    <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 sm:p-8">
      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        {post.title}
      </h1>

      {/* Author + meta */}
      <div className="mt-5 flex items-center gap-3">
        <div className="avatar-ring shrink-0">
          <Avatar
            src={post.author.photoURL}
            uid={post.author.id}
            className="h-11 w-11 border-2 border-white dark:border-gray-800"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${post.author.id}`}
            className="font-semibold text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400"
          >
            {post.author.firstName} {post.author.lastName}
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {post.createdAt?.toDate?.().toDateString().slice(4)} ·{" "}
            {calculateReadingTime(post.content)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <BookmarkIcon post={post} />
          {user && user.uid !== post.author.id && (
            <ReportButton targetType="post" targetId={post.id} postId={post.id} />
          )}
        </div>
      </div>

      {/* Cover image */}
      {post.imageURL && (
        <div className="mt-6 overflow-hidden rounded-2xl">
          <Image
            src={post.imageURL}
            alt={`Cover for ${post.title}`}
            className="max-h-[460px] w-full object-cover"
            width={1000}
            height={560}
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="post-content mt-6"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
      />

      {/* Engagement */}
      <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-700">
        <Reaction post={post} />
      </div>

      {/* Comment composer */}
      <div className="mt-4 flex items-start gap-3">
        <div className="avatar-ring mt-1 shrink-0">
          <Avatar
            src={user?.photoURL}
            className="h-9 w-9 border-2 border-white dark:border-gray-800"
          />
        </div>
        <div className="flex-1">
          <ContentInput post={post} />
        </div>
      </div>
    </article>
  );
};

export default PostDetails;
