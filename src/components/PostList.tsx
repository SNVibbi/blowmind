import { useAuthContext } from "../context/AuthContext";
import { incrementExpands, recordView } from "../lib/postService";
import { useReadTime } from "../hooks/useReadTime";
import { Post } from "../Types";
import { sanitizeHtml } from "../lib/sanitize";
import Link from "next/link";
import React, { useState } from "react";
import Avatar from "../components/Avatar";
import BookmarkIcon from "../components/BookmarkIcon";
import Options from "../components/Options";
import DefaultAvatar from "../../public/img/default-avatar.jpg"
import Image from "next/image";
import Reaction from "../components/Reaction";
import { EmptyState } from "./states/StateViews";


interface PostListProps {
    posts: Post[] | null;
    msg: string;

}

const PostList: React.FC<PostListProps> = ({ posts, msg }) => {
    const { user } = useAuthContext();
    const { calculateReadingTime } = useReadTime();

    const [options, setOptions] = useState<{ [key: number]: boolean}>({});

    const handleClick = async (post: Post) => {
        try {
            await incrementExpands(post.id);
        } catch {
            // Non-critical engagement metric — never bother the reader.
        }
    };

    const handleMouseEnter = async (post: Post) => {
        if (!user) return;
        try {
            // Idempotent: recordView only counts the first view per user.
            await recordView(post.id, user.uid);
        } catch {
            // Non-critical engagement metric — never bother the reader.
        }
    };

    const handleOptions = (index: number) => {
        setOptions((state) => ({
            ...state, 
            [index]: !state[index],
        }));
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 mt-1">
            {posts?.length === 0 && (
                <EmptyState image="/img/empty-posts.svg" title="Nothing here yet" message={msg} />
            )}
            {posts?.map((post, index) => (
                <div
                    className="card"
                    key={post.id}
                    onMouseEnter={() => handleMouseEnter(post)}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <Avatar src={post.author.photoURL || DefaultAvatar} className="w-16 h-16 sm:w-20 sm:h-20" />
                        <div className="flex-1">
                            <span className="font-semi-bold text-gray-900 dark:text-gray-100">
                                {post.author.firstName} {post.author.lastName}
                            </span>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span>{post.createdAt.toDate().toDateString().slice(3)}</span>
                                <span className="mx-1">.</span>
                                <span>{post.author.headline}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex items-center space-x-2">
                            {options[index] && <Options post={post} />}
                            {user?.uid !== post.author.id && <BookmarkIcon post={post} />}
                            {user?.uid === post.author.id && (
                                <button 
                                    className="text-gray-500 hover:text-gray-700" 
                                    onClick={() => handleOptions(index)}
                                >
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div onClick={() => handleClick(post)}>
                        <Link href={`/posts/${post.id}`}>
                            <h2 className="text-xl font-bold text-brand-600 dark:text-brand-400 hover:underline">
                                {post.title}
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <i className="fas fa-book-reader mr-1"></i>
                                <span>{calculateReadingTime(post.content)}</span>
                            </div>
                            <p
                                className="mt-2 text-gray-700 dark:txt-gray-300"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                            />
                            {post.imageURL && (
                                <div className="mt-4">
                                    <Image
                                    src={post.imageURL}
                                    alt={`Image for post: ${post.title}`}
                                    className="mt-2 rounded-lg w-full h-auto object-cover"
                                    width={800}
                                    height={400}
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    priority={index === 0}
                                />
                                </div>
                            )}
                        </Link>
                        <Reaction post={post} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default PostList;