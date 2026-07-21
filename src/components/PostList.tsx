import { useAuthContext } from "../context/AuthContext";
import { incrementExpands, recordView } from "../lib/postService";
import { useReadTime } from "../hooks/useReadTime";
import { Post } from "../Types";
import { toPlainText } from "../lib/text";
import Link from "next/link";
import React, { useState } from "react";
import Avatar from "../components/Avatar";
import BookmarkIcon from "../components/BookmarkIcon";
import Options from "../components/Options";
import Image from "next/image";
import Reaction from "../components/Reaction";
import BlockButton from "./BlockButton";
import { EmptyState } from "./states/StateViews";
import { useBlockedUsers } from "../hooks/useBlockedUsers";

interface PostListProps {
  posts: Post[] | null;
  msg: string;
}

const PostList: React.FC<PostListProps> = ({ posts, msg }) => {
  const { user } = useAuthContext();
  const { calculateReadingTime } = useReadTime();
  const { blockedSet } = useBlockedUsers();

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const visiblePosts =
    posts?.filter((post) => !blockedSet.has(post.author?.id)) ?? null;

  const handleView = async (post: Post) => {
    if (!user) return;
    try {
      await recordView(post.id, user.uid);
    } catch {
      /* non-critical */
    }
  };

  const handleOpen = async (post: Post) => {
    try {
      await incrementExpands(post.id);
    } catch {
      /* non-critical */
    }
  };

  return (
    <div className="space-y-5">
      {visiblePosts?.length === 0 && (
        <EmptyState
          image="/img/empty-posts.svg"
          title="Nothing here yet"
          message={msg}
        />
      )}

      {visiblePosts?.map((post, index) => {
        const isOwner = user?.uid === post.author.id;
        return (
          <article
            key={post.id}
            className="post-card"
            onMouseEnter={() => handleView(post)}
          >
            {/* Author row */}
            <div className="flex items-center gap-3">
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
                  className="block truncate font-semibold text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400"
                >
                  {post.author.firstName} {post.author.lastName}
                </Link>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {post.author.headline ? `${post.author.headline} · ` : ""}
                  {post.createdAt?.toDate?.().toDateString().slice(4)} ·{" "}
                  {calculateReadingTime(post.content)}
                </p>
              </div>

              <div className="relative flex items-center gap-1">
                {!isOwner && user && (
                  <BlockButton
                    targetUid={post.author.id}
                    targetName={post.author.firstName}
                    className="engage"
                  />
                )}
                {!isOwner && <BookmarkIcon post={post} />}
                {isOwner && (
                  <>
                    <button
                      className="engage"
                      aria-label="Post options"
                      onClick={() =>
                        setOpenMenu((v) => (v === post.id ? null : post.id))
                      }
                    >
                      <i className="fas fa-ellipsis-v" aria-hidden="true"></i>
                    </button>
                    {openMenu === post.id && <Options post={post} />}
                  </>
                )}
              </div>
            </div>

            {/* Body (click-through) */}
            <Link
              href={`/posts/${post.id}`}
              onClick={() => handleOpen(post)}
              className="mt-3 block"
            >
              <h2 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-brand-600 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400 sm:text-xl">
                {post.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                {toPlainText(post.content, 180)}
              </p>

              {post.imageURL && (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <Image
                    src={post.imageURL}
                    alt={`Cover for ${post.title}`}
                    className="h-52 w-full object-cover transition-transform duration-300 hover:scale-105"
                    width={800}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 700px"
                    priority={index === 0}
                  />
                </div>
              )}
            </Link>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="chip">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement */}
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
              <Reaction post={post} />
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PostList;
